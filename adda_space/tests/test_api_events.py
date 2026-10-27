# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime
from adda_space.api.events import (
	get_supported_cities,
	get_adda_rooms,
	get_adda_room_availability,
	get_adda_events,
	get_adda_event_detail,

	
	create_adda_event,
	register_adda_event,
	get_backend_health,
)


class TestApiEvents(IntegrationTestCase):
	def setUp(self):
		frappe.set_user("Administrator")

		# Ensure test city exists
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		# Ensure test room exists
		if not frappe.db.exists("Adda Room", "Main Room Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda Room",
				"room_name": "Main Room Bengaluru",
				"city": "Bengaluru",
				"capacity": 40,
				"is_active": 1,
			}).insert(ignore_permissions=True)

		now = now_datetime()
		# Create an upcoming approved event
		self.upcoming_event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "API Test Upcoming Event",
			"type": "Adda",
			"description": "Upcoming Adda event.",
			"start_date_time": add_to_date(now, days=5, hours=10),
			"end_date_time": add_to_date(now, days=5, hours=12),
			"city": "Bengaluru",
			"room_name": "Main Room Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
			"capacity": 20,
		}).insert(ignore_permissions=True)

		# Create a past approved event
		self.past_event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "API Test Past Event",
			"type": "Adda",
			"description": "Past Adda event.",
			"start_date_time": add_to_date(now, days=-5, hours=10),
			"end_date_time": add_to_date(now, days=-5, hours=12),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

	def tearDown(self):
		frappe.set_user("Administrator")
		for ev_id in [getattr(self, "upcoming_event", None), getattr(self, "past_event", None)]:
			if ev_id and frappe.db.exists("Adda Event", ev_id.name):
				# Delete registrations and recaps first
				for reg in frappe.get_all("Adda Event Registration", filters={"event": ev_id.name}, pluck="name"):
					frappe.delete_doc("Adda Event Registration", reg, force=True, ignore_permissions=True)
				for rec in frappe.get_all("Event Recap", filters={"event": ev_id.name}, pluck="name"):
					frappe.delete_doc("Event Recap", rec, force=True, ignore_permissions=True)
				frappe.delete_doc("Adda Event", ev_id.name, force=True, ignore_permissions=True)

		for r in frappe.get_all("Adda Event Request", filters={"title": ["like", "API Test%"]}, pluck="name"):
			ev = frappe.db.get_value("Adda Event Request", r, "event")
			if ev and frappe.db.exists("Adda Event", ev):
				frappe.delete_doc("Adda Event", ev, force=True, ignore_permissions=True)
			frappe.delete_doc("Adda Event Request", r, force=True, ignore_permissions=True)

	def test_get_supported_cities(self):
		res = get_supported_cities()
		self.assertTrue(res.get("success"))
		self.assertIn("Bengaluru", res.get("cities"))

	def test_get_adda_rooms(self):
		res = get_adda_rooms(city="Bengaluru")
		self.assertEqual(res.get("status"), "success")
		room_names = [r["room_name"] for r in res.get("rooms", [])]
		self.assertIn("Main Room Bengaluru", room_names)

	def test_get_adda_room_availability(self):
		date_str = str(self.upcoming_event.start_date_time)[:10]
		res = get_adda_room_availability(date=date_str, city="Bengaluru", room_name="Main Room Bengaluru")
		self.assertEqual(res.get("status"), "success")
		self.assertTrue(len(res.get("bookings", [])) > 0)
		booking = res["bookings"][0]
		self.assertEqual(booking["room_name"], "Main Room Bengaluru")

	def test_get_adda_events_upcoming_and_past(self):
		# Upcoming events
		upcoming_res = get_adda_events(time_scope="upcoming", event_type="all")
		self.assertTrue(upcoming_res.get("success"))
		upcoming_names = [e["name"] for e in upcoming_res.get("events", [])]
		self.assertIn(self.upcoming_event.name, upcoming_names)
		self.assertNotIn(self.past_event.name, upcoming_names)

		# Past events
		past_res = get_adda_events(time_scope="past", event_type="all")
		self.assertTrue(past_res.get("success"))
		past_names = [e["name"] for e in past_res.get("events", [])]
		self.assertIn(self.past_event.name, past_names)
		self.assertNotIn(self.upcoming_event.name, past_names)

	def test_get_adda_event_detail(self):
		# Detail by document name
		res = get_adda_event_detail(self.upcoming_event.name)
		self.assertTrue(res.get("success"))
		self.assertEqual(res["event"]["name"], self.upcoming_event.name)
		self.assertEqual(res["event"]["title"], "API Test Upcoming Event")

		# Detail by unique_id
		res_uid = get_adda_event_detail(self.upcoming_event.unique_id)
		self.assertTrue(res_uid.get("success"))
		self.assertEqual(res_uid["event"]["name"], self.upcoming_event.name)

		# Detail for invalid event returns 404
		res_invalid = get_adda_event_detail("nonexistent-event-id")
		self.assertFalse(res_invalid.get("success"))

	def test_create_adda_event_public_request(self):
		frappe.set_user("Guest")
		now = now_datetime()
		start = add_to_date(now, days=12, hours=10).strftime("%Y-%m-%d %H:%M:%S")
		end = add_to_date(now, days=12, hours=12).strftime("%Y-%m-%d %H:%M:%S")

		res = create_adda_event(
			title="API Test Proposal From Guest",
			type="Adda",
			description="Proposal submitted via public API.",
			start_date_time=start,
			end_date_time=end,
			city="Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			people_expected=15,
		)
		self.assertTrue(res.get("success"))
		self.assertEqual(res.get("approval_status"), "Pending Review")

		# Verify event created in DB as authoritative Adda Event
		event_doc = frappe.get_doc("Adda Event", res["name"])
		self.assertEqual(event_doc.status, "Pending Review")
		self.assertEqual(event_doc.approval_status, "Pending Review")

	def test_register_adda_event_api(self):
		res = register_adda_event(
			event=self.upcoming_event.name,
			full_name="API Registrant",
			mobile="9812345678",
		)
		self.assertTrue(res.get("success"))
		self.assertTrue(res.get("is_new"))
		self.assertEqual(res.get("status"), "Registered")

		# Retry same registration returns already_registered
		res_dup = register_adda_event(
			event=self.upcoming_event.name,
			full_name="API Registrant",
			mobile="9812345678",
		)
		self.assertTrue(res_dup.get("success"))
		self.assertTrue(res_dup.get("already_registered"))

	def test_get_backend_health(self):
		health = get_backend_health()
		self.assertEqual(health.get("database"), "connected")
		self.assertTrue(health.get("adda_events") > 0)
		self.assertIn("Bengaluru", health.get("supported_cities", []))

	def test_room_availability_date_normalization(self):
		# Test with DD-MM-YYYY format
		res_dmy = get_adda_room_availability(date="28-10-2026", city="Bengaluru", room_name="Main Room Bengaluru")
		self.assertEqual(res_dmy.get("status"), "success")
		self.assertEqual(res_dmy.get("date"), "2026-10-28")

		# Test with YYYY-MM-DD format
		res_ymd = get_adda_room_availability(date="2026-10-28", city="Bengaluru", room_name="Main Room Bengaluru")
		self.assertEqual(res_ymd.get("status"), "success")
		self.assertEqual(res_ymd.get("date"), "2026-10-28")

	def test_room_availability_unapproved_request_does_not_block(self):
		# An unapproved Adda Event Request must not cause a false conflict in room availability
		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "API Test Unapproved Request",
			"event_type": "Adda",
			"description": "Unapproved proposal.",
			"start_date_time": "2026-10-28 10:00:00",
			"end_date_time": "2026-10-28 12:00:00",
			"city": "Bengaluru",
			"room_name": "Main Room Bengaluru",
			"status": "Pending Review",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"people_expected": 20,
		}).insert(ignore_permissions=True)

		try:
			res = get_adda_room_availability(
				date="2026-10-28",
				city="Bengaluru",
				room_name="Main Room Bengaluru",
				start_time="10:00",
				end_time="12:00",
			)
			self.assertEqual(res.get("status"), "success")
			# Confirm request does not appear in bookings and room is marked available
			event_ids = [b["event_id"] for b in res.get("bookings", [])]
			self.assertNotIn(req.name, event_ids)
			self.assertTrue(res.get("is_available"))
			self.assertIsNone(res.get("collision"))
		finally:
			frappe.delete_doc("Adda Event Request", req.name, force=True, ignore_permissions=True)

	def test_room_availability_exact_boundary_conditions(self):
		# Create an authoritative Adda Event from 10:00 to 12:00 on 2026-10-28
		ev = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "API Test Boundary Event",
			"type": "Adda",
			"description": "Event from 10 to 12",
			"start_date_time": "2026-10-28 10:00:00",
			"end_date_time": "2026-10-28 12:00:00",
			"city": "Bengaluru",
			"room_name": "Main Room Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		try:
			# 1. Exact overlap (10:00-12:00) -> Collides
			res_exact = get_adda_room_availability(
				date="2026-10-28", room_name="Main Room Bengaluru", start_time="10:00", end_time="12:00"
			)
			self.assertFalse(res_exact.get("is_available"))
			self.assertIsNotNone(res_exact.get("collision"))

			# 2. Overlap partial (11:00-13:00) -> Collides
			res_partial = get_adda_room_availability(
				date="2026-10-28", room_name="Main Room Bengaluru", start_time="11:00", end_time="13:00"
			)
			self.assertFalse(res_partial.get("is_available"))

			# 3. Boundary ending exactly at 10:00 (08:00-10:00) -> Does NOT collide
			res_before = get_adda_room_availability(
				date="2026-10-28", room_name="Main Room Bengaluru", start_time="08:00", end_time="10:00"
			)
			self.assertTrue(res_before.get("is_available"))
			self.assertIsNone(res_before.get("collision"))

			# 4. Boundary starting exactly at 12:00 (12:00-14:00) -> Does NOT collide
			res_after = get_adda_room_availability(
				date="2026-10-28", room_name="Main Room Bengaluru", start_time="12:00", end_time="14:00"
			)
			self.assertTrue(res_after.get("is_available"))
			self.assertIsNone(res_after.get("collision"))
		finally:
			frappe.delete_doc("Adda Event", ev.name, force=True, ignore_permissions=True)

	def test_calendar_and_availability_agree(self):
		# Ensure calendar API (get_adda_events) and availability API (get_adda_room_availability)
		# read the same event record
		ev = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "API Test Consistent Event",
			"type": "Adda",
			"description": "Calendar and availability consistency test.",
			"start_date_time": "2026-10-28 14:00:00",
			"end_date_time": "2026-10-28 16:00:00",
			"city": "Bengaluru",
			"room_name": "Main Room Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		try:
			# Check availability API
			avail_res = get_adda_room_availability(date="2026-10-28", city="Bengaluru", room_name="Main Room Bengaluru")
			avail_ids = [b["event_id"] for b in avail_res.get("bookings", [])]
			self.assertIn(ev.name, avail_ids)

			# Check calendar API with start_date and end_date
			cal_res = get_adda_events(start_date="2026-10-28", end_date="2026-10-28", city="Bengaluru", event_type="all")
			cal_ids = [e["name"] for e in cal_res.get("events", [])]
			self.assertIn(ev.name, cal_ids)
		finally:
			frappe.delete_doc("Adda Event", ev.name, force=True, ignore_permissions=True)

	def test_format_event_payload_poster_security(self):
		from adda_space.api.events import _format_event_payload

		# Public file URL is preserved
		payload_pub = _format_event_payload({"cover_image": "/files/test_poster.png", "title": "Test Public"})
		self.assertIn("/files/test_poster.png", payload_pub["cover_image"])

		# External HTTPS URL is preserved
		payload_ext = _format_event_payload({"cover_image": "https://example.com/poster.jpg", "title": "Test Ext"})
		self.assertEqual(payload_ext["cover_image"], "https://example.com/poster.jpg")

		# Private file for guest returns None to avoid broken 403 img in browser
		frappe.set_user("Guest")
		payload_priv_guest = _format_event_payload({"cover_image": "/private/files/secret.png", "title": "Test Priv"})
		self.assertIsNone(payload_priv_guest["cover_image"])

	def test_website_creation_and_reference_id_stability(self):
		frappe.set_user("Guest")
		now = now_datetime()
		start = add_to_date(now, days=20, hours=10).strftime("%Y-%m-%d %H:%M:%S")
		end = add_to_date(now, days=20, hours=12).strftime("%Y-%m-%d %H:%M:%S")

		# 1. Create event via website API
		res = create_adda_event(
			title="API Test Website Proposal",
			type="Adda",
			description="Submitted via website form.",
			start_date_time=start,
			end_date_time=end,
			city="Bengaluru",
			room_name="Main Room Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			people_expected=25,
		)
		self.assertTrue(res.get("success"))
		ref_id = res.get("name")
		self.assertTrue(ref_id)

		# 2. Locate event in Frappe Desk using exact reference ID
		frappe.set_user("Administrator")
		desk_event = frappe.get_doc("Adda Event", ref_id)
		self.assertEqual(desk_event.name, ref_id)
		self.assertEqual(desk_event.title, "API Test Website Proposal")
		self.assertEqual(desk_event.status, "Pending Review")

		# 3. Confirm no duplicate event was created
		count = frappe.db.count("Adda Event", filters={"name": ref_id})
		self.assertEqual(count, 1)

		# 4. Check Adda Space calendar (with include_pending=1)
		cal = get_adda_events(time_scope="upcoming", include_pending="1")
		event_names = [e["name"] for e in cal.get("events", [])]
		self.assertIn(ref_id, event_names)

		# 5. Admin approves proposal in Desk -> ID does NOT change
		desk_event.approve()
		desk_event.reload()
		self.assertEqual(desk_event.name, ref_id)
		self.assertEqual(desk_event.status, "Approved")

		# 6. Check calendar without include_pending -> now visible as Approved
		cal_pub = get_adda_events(time_scope="upcoming")
		self.assertIn(ref_id, [e["name"] for e in cal_pub.get("events", [])])

		frappe.delete_doc("Adda Event", ref_id, force=True, ignore_permissions=True)

	def test_website_save_draft_then_submit_preserves_identity(self):
		frappe.set_user("Guest")
		now = now_datetime()
		start = add_to_date(now, days=22, hours=14).strftime("%Y-%m-%d %H:%M:%S")
		end = add_to_date(now, days=22, hours=16).strftime("%Y-%m-%d %H:%M:%S")

		# 1. Save draft
		draft_res = create_adda_event(
			title="API Test Initial Draft",
			type="Adda",
			description="Initial draft content.",
			start_date_time=start,
			end_date_time=end,
			city="Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			status="Draft",
		)
		self.assertTrue(draft_res.get("success"))
		draft_id = draft_res["name"]
		self.assertEqual(draft_res.get("status"), "Draft")

		# Draft must NOT be on public calendar
		cal = get_adda_events(time_scope="upcoming", include_pending="1")
		self.assertNotIn(draft_id, [e["name"] for e in cal.get("events", [])])

		# 2. Submit the event passing existing event_id
		submit_res = create_adda_event(
			event_id=draft_id,
			title="API Test Updated and Submitted",
			type="Adda",
			description="Updated final description.",
			start_date_time=start,
			end_date_time=end,
			city="Bengaluru",
			room_name="Main Room Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			status="Pending Review",
		)
		self.assertTrue(submit_res.get("success"))
		self.assertEqual(submit_res["name"], draft_id)
		self.assertEqual(submit_res["status"], "Pending Review")

		# Confirm only ONE document exists with this ID
		frappe.set_user("Administrator")
		count = frappe.db.count("Adda Event", filters={"name": draft_id})
		self.assertEqual(count, 1)

		# Event now appears on calendar with include_pending=1
		cal_submitted = get_adda_events(time_scope="upcoming", include_pending="1")
		self.assertIn(draft_id, [e["name"] for e in cal_submitted.get("events", [])])

		frappe.delete_doc("Adda Event", draft_id, force=True, ignore_permissions=True)

	def test_consecutive_event_creations_do_not_replace_previous_event(self):
		"""
		Critical regression test:
		1. Create Event A for 2026-10-28.
		2. Create Event B for 2026-10-30.
		3. Verify Event A remains on 2026-10-28 with original title, date, and status.
		4. Verify Event B is on 2026-10-30 with a distinct document name.
		5. Verify both records exist simultaneously in DB.
		6. Verify both records appear simultaneously in calendar API.
		7. Verify explicit edit still updates existing record without duplicate.
		"""
		frappe.set_user("Guest")

		# 1. Create Event A for October 28
		res_a = create_adda_event(
			title="Event A on Oct 28",
			type="Adda",
			description="First event details.",
			start_date_time="2026-10-28 10:00:00",
			end_date_time="2026-10-28 12:00:00",
			city="Bengaluru",
			room_name="Main Room Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			people_expected=20,
		)
		self.assertTrue(res_a.get("success"))
		id_a = res_a["name"]
		self.assertTrue(id_a)

		# Verify Event A is on calendar for Oct 28
		cal_a = get_adda_events(start_date="2026-10-28", end_date="2026-10-28", include_pending="1")
		self.assertIn(id_a, [e["name"] for e in cal_a.get("events", [])])

		# 2. Create Event B for October 30 (even if a stale client passed id_a)
		res_b = create_adda_event(
			name=id_a,  # Simulating stale browser reference ID leak
			title="Event B on Oct 30",
			type="Adda",
			description="Second event details.",
			start_date_time="2026-10-30 14:00:00",
			end_date_time="2026-10-30 16:00:00",
			city="Bengaluru",
			room_name="Main Room Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			people_expected=30,
		)
		self.assertTrue(res_b.get("success"))
		id_b = res_b["name"]
		self.assertTrue(id_b)

		try:
			# Verify Event A and Event B have distinct document names
			self.assertNotEqual(id_a, id_b, "Event B must receive its own distinct document name and not replace Event A")

			# Verify both records exist in DB
			frappe.set_user("Administrator")
			self.assertTrue(frappe.db.exists("Adda Event", id_a))
			self.assertTrue(frappe.db.exists("Adda Event", id_b))

			# Verify Event A was NOT modified
			doc_a = frappe.get_doc("Adda Event", id_a)
			self.assertEqual(doc_a.title, "Event A on Oct 28")
			self.assertEqual(str(doc_a.start_date_time)[:19], "2026-10-28 10:00:00")
			self.assertEqual(str(doc_a.end_date_time)[:19], "2026-10-28 12:00:00")
			self.assertEqual(doc_a.status, "Pending Review")

			# Verify Event B has its own correct values
			doc_b = frappe.get_doc("Adda Event", id_b)
			self.assertEqual(doc_b.title, "Event B on Oct 30")
			self.assertEqual(str(doc_b.start_date_time)[:19], "2026-10-30 14:00:00")
			self.assertEqual(str(doc_b.end_date_time)[:19], "2026-10-30 16:00:00")
			self.assertEqual(doc_b.status, "Pending Review")

			# Verify both events appear simultaneously in calendar
			cal_both = get_adda_events(start_date="2026-10-28", end_date="2026-10-30", include_pending="1")
			events_found = {e["name"]: e for e in cal_both.get("events", [])}
			self.assertIn(id_a, events_found)
			self.assertIn(id_b, events_found)
			self.assertEqual(str(events_found[id_a]["start_date_time"])[:10], "2026-10-28")
			self.assertEqual(str(events_found[id_b]["start_date_time"])[:10], "2026-10-30")

			# 3. Verify authorized edit action updates in place without creating a duplicate
			edit_res = create_adda_event(
				event_id=id_a,
				action="edit",
				title="Event A Updated Title",
				type="Adda",
				description="Updated description.",
				start_date_time="2026-10-28 10:00:00",
				end_date_time="2026-10-28 12:00:00",
				city="Bengaluru",
				cover_image="/assets/adda_space/images/adda_space_logo.png",
			)
			self.assertEqual(edit_res["name"], id_a)
			doc_a_updated = frappe.get_doc("Adda Event", id_a)
			self.assertEqual(doc_a_updated.title, "Event A Updated Title")
			self.assertEqual(frappe.db.count("Adda Event", filters={"title": "Event A Updated Title"}), 1)

			# 4. Verify approval workflow
			doc_a_updated.approve()
			doc_a_updated.reload()
			self.assertEqual(doc_a_updated.status, "Approved")
			self.assertEqual(doc_a_updated.name, id_a)

		finally:
			frappe.delete_doc("Adda Event", id_a, force=True, ignore_permissions=True)
			frappe.delete_doc("Adda Event", id_b, force=True, ignore_permissions=True)

	def test_hosting_creates_event_never_registration(self):
		"""
		Ensure hosting workflow strictly creates an Adda Event record and
		NEVER creates an Adda Event Registration record.
		"""
		regs_before = frappe.db.count("Adda Event Registration")
		events_before = frappe.db.count("Adda Event")

		event_res = create_adda_event(
			title="Community Gardening Workshop",
			type="Adda",
			description="Learn organic composting and urban gardening.",
			start_date_time="2026-11-05 10:00:00",
			end_date_time="2026-11-05 12:00:00",
			city="Bengaluru",
			room_name="Hall Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
		)

		self.assertTrue(event_res.get("name"))
		event_id = event_res["name"]

		try:
			# Verify an Adda Event was created
			self.assertEqual(frappe.db.count("Adda Event"), events_before + 1)
			doc = frappe.get_doc("Adda Event", event_id)
			self.assertEqual(doc.title, "Community Gardening Workshop")
			self.assertEqual(doc.status, "Pending Review")

			# Verify ZERO registrations were created during hosting
			self.assertEqual(frappe.db.count("Adda Event Registration"), regs_before)

			# Verify checking registrations for this event returns 0
			event_regs = frappe.get_all("Adda Event Registration", filters={"event": event_id})
			self.assertEqual(len(event_regs), 0)

		finally:
			frappe.delete_doc("Adda Event", event_id, force=True, ignore_permissions=True)

	def test_registration_creates_registration_never_modifies_event(self):
		"""
		Ensure participant registration strictly creates an Adda Event Registration record
		and does not modify the target Adda Event document identity or status.
		"""
		# Create and approve an event for registration
		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Clean Water Circle",
			"type": "Adda",
			"description": "Civic monitoring of neighborhood lake quality.",
			"start_date_time": "2026-11-10 10:00:00",
			"end_date_time": "2026-11-10 12:00:00",
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"status": "Approved",
			"approval_status": "Approved",
			"capacity": 50,
		}).insert(ignore_permissions=True)

		event_id = event.name
		events_count_before = frappe.db.count("Adda Event")

		try:
			# Register a participant
			reg_res = register_adda_event(
				event=event_id,
				mobile="9876543210",
				full_name="Asha Kumar",
			)

			self.assertTrue(reg_res.get("registration_name"))
			reg_id = reg_res["registration_name"]
			self.assertEqual(reg_res.get("status"), "Registered")

			# Verify event count remains identical (no new event created)
			self.assertEqual(frappe.db.count("Adda Event"), events_count_before)

			# Verify target event document was NOT modified
			event_reloaded = frappe.get_doc("Adda Event", event_id)
			self.assertEqual(event_reloaded.title, "Clean Water Circle")
			self.assertEqual(event_reloaded.status, "Approved")
			self.assertEqual(event_reloaded.name, event_id)

			# Verify Adda Event Registration was created and properly linked
			reg_doc = frappe.get_doc("Adda Event Registration", reg_id)
			self.assertEqual(reg_doc.event, event_id)
			self.assertTrue("9876543210" in reg_doc.mobile)
			self.assertEqual(reg_doc.full_name, "Asha Kumar")

		finally:
			frappe.db.delete("Adda Event Registration", {"event": event_id})
			frappe.delete_doc("Adda Event", event_id, force=True, ignore_permissions=True)

	def test_detail_py_redirects_date_and_host_routes(self):
		"""
		Ensure detail.py intercepts date strings and 'host' keywords routed to /events/<event_id>
		and redirects to the hosting workflow on the calendar instead of serving the participant registration form.
		"""
		from adda_space.www.events.detail import get_context

		# 1. Date route: YYYY-MM-DD
		frappe.form_dict.event_id = "2026-10-28"
		frappe.local.flags.redirect_location = None
		with self.assertRaises(frappe.Redirect):
			get_context({})
		self.assertEqual(frappe.local.flags.redirect_location, "/events?date=2026-10-28&open_host=1")

		# 2. Date route: DD-MM-YYYY
		frappe.form_dict.event_id = "28-10-2026"
		frappe.local.flags.redirect_location = None
		with self.assertRaises(frappe.Redirect):
			get_context({})
		self.assertEqual(frappe.local.flags.redirect_location, "/events?date=28-10-2026&open_host=1")

		# 3. Host keyword route
		frappe.form_dict.event_id = "host"
		frappe.local.flags.redirect_location = None
		with self.assertRaises(frappe.Redirect):
			get_context({})
		self.assertEqual(frappe.local.flags.redirect_location, "/events?open_host=1")

		# 4. Actual event identifier (e.g. EV-2026-00001) must NOT redirect
		frappe.form_dict.event_id = "EV-2026-00001"
		frappe.local.flags.redirect_location = None
		# Should return without raising Redirect
		get_context({})
		self.assertIsNone(frappe.local.flags.redirect_location)

	def test_click_future_date_and_create_event(self):
		"""
		Scenario 3: Click an eligible future date, check availability, and create a gathering for that date.
		Ensures date is preserved, event is created with unique name, and no RSVP is created.
		"""
		future_date = "2026-11-20"
		# Verify room availability on this future date
		avail = get_adda_room_availability(
			date=future_date,
			city="Bengaluru",
			room_name="Main Room Bengaluru",
			start_time="14:00",
			end_time="16:00",
		)
		self.assertEqual(avail.get("status"), "success")
		self.assertTrue(avail.get("is_available"))

		regs_before = frappe.db.count("Adda Event Registration")

		# Create event for this future date
		res = create_adda_event(
			title="Future Date Solar Hackathon",
			description="Neighbourhood energy mapping circle.",
			start=f"{future_date} 14:00:00",
			end=f"{future_date} 16:00:00",
			city="Bengaluru",
			room_name="Main Room Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			mode="Offline",
		)

		self.assertTrue(res.get("name"))
		event_id = res["name"]

		try:
			doc = frappe.get_doc("Adda Event", event_id)
			self.assertEqual(doc.title, "Future Date Solar Hackathon")
			self.assertTrue(str(doc.start_date_time).startswith(future_date))
			self.assertEqual(doc.status, "Pending Review")

			# Zero registrations created as side-effect
			self.assertEqual(frappe.db.count("Adda Event Registration"), regs_before)
		finally:
			frappe.delete_doc("Adda Event", event_id, force=True, ignore_permissions=True)

	def test_next_month_navigation_and_date_range_queries(self):
		"""
		Scenario 4: Navigate to next month and select a future date.
		Ensures date range query for next month correctly retrieves events in that calendar view.
		"""
		next_month_date = "2026-11-15"
		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Next Month Climate Action Meetup",
			"type": "Adda",
			"description": "Planning seasonal composting in Bengaluru.",
			"start_date_time": f"{next_month_date} 10:00:00",
			"end_date_time": f"{next_month_date} 12:00:00",
			"city": "Bengaluru",
			"room_name": "Main Room Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
			"capacity": 30,
		}).insert(ignore_permissions=True)

		try:
			# Query covering November 2026
			res = get_adda_events(
				city="Bengaluru",
				start_date="2026-11-01",
				end_date="2026-11-30",
				event_type="all",
				include_pending=1,
				page_length=100,
			)

			self.assertTrue(res.get("success"))
			event_names = [e.get("name") for e in res.get("events", [])]
			self.assertIn(event.name, event_names)

			# Verify availability check for next month date
			avail = get_adda_room_availability(
				date=next_month_date,
				city="Bengaluru",
				room_name="Main Room Bengaluru",
				start_time="10:00",
				end_time="12:00",
			)
			self.assertEqual(avail.get("status"), "success")
			self.assertFalse(avail.get("is_available"))
			self.assertEqual(avail.get("collision", {}).get("event_id"), event.name)
		finally:
			frappe.delete_doc("Adda Event", event.name, force=True, ignore_permissions=True)

	def test_error_handling_and_validations_displayed_clearly(self):
		"""
		Scenario 10: Verify errors, validations, and restrictions return clear, actionable feedback.
		"""
		# 1. Registration missing mobile
		res_no_mobile = register_adda_event(
			event=self.upcoming_event.name,
			mobile="",
		)
		self.assertFalse(res_no_mobile.get("success"))
		self.assertEqual(res_no_mobile.get("status"), "Rejected")
		self.assertIn("mobile", res_no_mobile.get("error", "").lower())

		# 2. Registration missing event identifier
		res_no_event = register_adda_event(
			event="",
			mobile="9876543210",
		)
		self.assertFalse(res_no_event.get("success"))
		self.assertEqual(res_no_event.get("status"), "Rejected")
		self.assertIn("identifier is required", res_no_event.get("error", "").lower())

		# 3. Registration non-existent event
		res_not_found = register_adda_event(
			event="NON-EXISTENT-EVENT-12345",
			mobile="9876543210",
		)
		self.assertFalse(res_not_found.get("success"))
		self.assertEqual(res_not_found.get("status"), "Rejected")
		self.assertIn("not found", res_not_found.get("error", "").lower())

		# 4. Event creation missing mandatory fields throws clear error
		with self.assertRaises(frappe.ValidationError):
			create_adda_event(
				title="",
				description="",
				city="Bengaluru",
				cover_image="/assets/adda_space/images/adda_space_logo.png",
			)

		# 5. Duplicate registration returns clear duplicate status
		reg1 = register_adda_event(
			event=self.upcoming_event.name,
			mobile="9876500001",
			full_name="Duplicate Test User",
		)
		self.assertTrue(reg1.get("success"))
		self.assertEqual(reg1.get("status"), "Registered")

		reg2 = register_adda_event(
			event=self.upcoming_event.name,
			mobile="9876500001",
			full_name="Duplicate Test User",
		)
		self.assertTrue(reg2.get("success"))
		self.assertTrue(reg2.get("already_registered"))
		self.assertEqual(reg2.get("registration_name"), reg1.get("registration_name"))

		# Cleanup
		frappe.db.delete("Adda Event Registration", {"event": self.upcoming_event.name})
