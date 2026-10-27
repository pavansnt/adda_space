# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from adda_space.setup import setup_adda_space


def execute():
	"""
	Idempotent migration patch to migrate legacy data from Samaaja and Solve Ninja
	into Adda Space's independent DocTypes.
	"""
	frappe.reload_doc("adda_space", "doctype", "adda_city")
	frappe.reload_doc("adda_space", "doctype", "adda_room")
	frappe.reload_doc("adda_space", "doctype", "adda_event")
	frappe.reload_doc("adda_space", "doctype", "adda_event_request")
	frappe.reload_doc("adda_space", "doctype", "adda_event_registration")
	frappe.reload_doc("adda_space", "doctype", "adda_space_settings")
	frappe.reload_doc("adda_space", "doctype", "event_recap")

	setup_adda_space()

	orig_in_import = getattr(frappe.flags, "in_import", False)
	frappe.flags.in_import = True
	try:
		migrate_cities()
		migrate_rooms()
		migrate_events()
		migrate_registrations()
	finally:
		frappe.flags.in_import = orig_in_import


def migrate_cities():
	"""Copy legacy cities from Samaaja Cities into Adda City."""
	if not frappe.db.table_exists("Samaaja Cities"):
		return

	legacy_cities = frappe.db.sql(
		"""SELECT name, city_name FROM "tabSamaaja Cities" """, as_dict=True
	)
	for row in legacy_cities:
		city_name = (row.get("city_name") or row.get("name") or "").strip()
		if not city_name:
			continue
		if not frappe.db.exists("Adda City", city_name):
			doc = frappe.get_doc({
				"doctype": "Adda City",
				"city_name": city_name,
				"is_active": 1,
				"country": "India",
			})
			doc.flags.ignore_permissions = True
			doc.flags.ignore_mandatory = True
			doc.flags.ignore_validate = True
			doc.insert()


def migrate_rooms():
	"""Ensure existing rooms have their city correctly linked to Adda City."""
	if not frappe.db.table_exists("Adda Room"):
		return

	# If Adda Room table already has rows from solve_ninja, ensure they exist as Adda Room docs
	try:
		rooms = frappe.db.sql(
			"""SELECT room_name, city, capacity FROM "tabAdda Room" """, as_dict=True
		)
		for r in rooms:
			room_name = (r.get("room_name") or "").strip()
			if not room_name:
				continue
			city = (r.get("city") or "").strip()
			if city and not frappe.db.exists("Adda City", city):
				migrate_cities()

			if not frappe.db.exists("Adda Room", room_name):
				doc = frappe.get_doc({
					"doctype": "Adda Room",
					"room_name": room_name,
					"city": city if frappe.db.exists("Adda City", city) else None,
					"capacity": r.get("capacity") or 0,
					"is_active": 1,
				})
				doc.flags.ignore_permissions = True
				doc.insert()
	except Exception as e:
		frappe.log_error(f"Error migrating Adda Room: {e}", "Adda Space Migration")


def migrate_events():
	"""Migrate legacy Solve Event records into Adda Event and Adda Event Request."""
	# Ensure any existing Adda Event records with Draft or NULL approval_status are updated to Pending Review
	if frappe.db.table_exists("Adda Event"):
		try:
			frappe.db.sql(
				"""
				UPDATE "tabAdda Event"
				SET approval_status = 'Pending Review'
				WHERE approval_status IS NULL OR approval_status IN ('Draft', '')
				"""
			)
		except Exception:
			pass

	if not frappe.db.table_exists("Solve Event"):
		return

	solve_events = frappe.db.sql(
		"""
		SELECT name, unique_id, title, description, type, start_date_time, end_date_time,
		       city, room_name, venue_details, mode, cover_image, approval_status,
		       capacity, people_expected, wa_group_link, checkin_url, checkin_qr
		FROM "tabSolve Event"
		""",
		as_dict=True,
	)

	for ev in solve_events:
		ev_name = ev.get("name")
		if not ev_name:
			continue

		city = (ev.get("city") or "").strip()
		if city and not frappe.db.exists("Adda City", city):
			# Ensure city exists in Adda City before linking
			c_doc = frappe.get_doc({
				"doctype": "Adda City",
				"city_name": city,
				"is_active": 1,
			})
			c_doc.flags.ignore_permissions = True
			c_doc.insert()

		room_name = (ev.get("room_name") or "").strip()
		if room_name and not frappe.db.exists("Adda Room", room_name):
			r_doc = frappe.get_doc({
				"doctype": "Adda Room",
				"room_name": room_name,
				"city": city if frappe.db.exists("Adda City", city) else None,
				"is_active": 1,
			})
			r_doc.flags.ignore_permissions = True
			r_doc.insert()

		actual_name = ev_name
		if not frappe.db.exists("Adda Event", ev_name):
			doc = frappe.get_doc({
				"doctype": "Adda Event",
				"name": ev_name,
				"unique_id": ev.get("unique_id"),
				"title": ev.get("title") or "Gathering",
				"description": ev.get("description") or "Gathering details",
				"type": ev.get("type") or "Adda",
				"start_date_time": ev.get("start_date_time"),
				"end_date_time": ev.get("end_date_time"),
				"city": city,
				"room_name": room_name or None,
				"venue_details": ev.get("venue_details"),
				"mode": ev.get("mode") or "Offline",
				"cover_image": ev.get("cover_image") or "/assets/adda_space/images/adda_space_logo.png",
				"image": ev.get("cover_image"),
				"approval_status": ev.get("approval_status") or "Approved",
				"capacity": ev.get("capacity") or 0,
				"people_expected": ev.get("people_expected") or 0,
				"wa_group_link": ev.get("wa_group_link"),
				"checkin_url": ev.get("checkin_url"),
				"checkin_qr": ev.get("checkin_qr"),
			})
			doc.flags.ignore_permissions = True
			doc.flags.ignore_mandatory = True
			doc.flags.ignore_validate = True
			doc.insert()
			actual_name = doc.name
		else:
			actual_name = ev_name

		# If event was Pending Review, ensure an Adda Event Request also exists
		if ev.get("approval_status") == "Pending Review":
			if not frappe.db.exists("Adda Event Request", {"event": actual_name}):
				req = frappe.get_doc({
					"doctype": "Adda Event Request",
					"title": ev.get("title") or "Gathering Proposal",
					"event_type": ev.get("type") or "Adda",
					"description": ev.get("description") or "Proposal details",
					"start_date_time": ev.get("start_date_time"),
					"end_date_time": ev.get("end_date_time"),
					"city": city,
					"room_name": room_name or None,
					"venue_details": ev.get("venue_details"),
					"mode": ev.get("mode") or "Offline",
					"cover_image": ev.get("cover_image") or "/assets/adda_space/images/adda_space_logo.png",
					"people_expected": ev.get("people_expected") or 20,
					"wa_group_link": ev.get("wa_group_link"),
					"status": "Pending Review",
					"event": actual_name,
				})
				req.flags.ignore_permissions = True
				req.flags.ignore_mandatory = True
				req.flags.ignore_validate = True
				req.insert()


def migrate_registrations():
	"""Migrate legacy Solve Event Registration records into Adda Event Registration."""
	if not frappe.db.table_exists("Solve Event Registration"):
		return

	registrations = frappe.db.sql(
		"""
		SELECT name, solve_event, full_name, mobile, user, city, status, source, reason
		FROM "tabSolve Event Registration"
		""",
		as_dict=True,
	)

	for reg in registrations:
		reg_name = reg.get("name")
		solve_event = reg.get("solve_event")
		if not reg_name or not solve_event:
			continue

		if not frappe.db.exists("Adda Event", solve_event):
			continue

		if not frappe.db.exists("Adda Event Registration", reg_name):
			doc = frappe.get_doc({
				"doctype": "Adda Event Registration",
				"name": reg_name,
				"event": solve_event,
				"full_name": reg.get("full_name") or "Participant",
				"mobile": reg.get("mobile") or "",
				"user": reg.get("user"),
				"city": reg.get("city") if frappe.db.exists("Adda City", reg.get("city")) else None,
				"status": reg.get("status") or "Registered",
				"source": reg.get("source") or "Web Form",
				"reason": reg.get("reason"),
			})
			doc.flags.ignore_permissions = True
			doc.flags.ignore_mandatory = True
			doc.flags.ignore_validate = True
			doc.insert()
