# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe


def setup_adda_space():
	"""Initialize Adda Space roles, permissions and base configuration on install/migrate."""
	setup_roles()
	setup_permissions()
	setup_settings()


def setup_roles():
	"""Ensure 'Adda Space Admin', 'City Coordinator', and 'Event Coordinator' roles exist with Desk access."""
	for role_name in ("Adda Space Admin", "City Coordinator", "Event Coordinator"):
		if not frappe.db.exists("Role", role_name):
			role = frappe.get_doc({
				"doctype": "Role",
				"role_name": role_name,
				"desk_access": 1,
				"is_custom": 0,
			})
			role.insert(ignore_permissions=True)
			frappe.db.commit()
		else:
			try:
				role = frappe.get_doc("Role", role_name)
				if not role.desk_access:
					role.desk_access = 1
					role.save(ignore_permissions=True)
					frappe.db.commit()
			except Exception:
				pass


def setup_permissions():
	"""Ensure Event Coordinator permissions exist in both DocPerm and Custom DocPerm."""
	# 1. Force reload doctypes so tabDocPerm gets updated from JSON
	for dt in ("adda_event", "adda_room"):
		try:
			frappe.reload_doc("adda_space", "doctype", dt, force=True)
		except Exception:
			pass

	# 2. Check if Custom DocPerm exists for Adda Event or Adda Room on deployed site
	if frappe.db.table_exists("Custom DocPerm"):
		has_custom_event_perms = frappe.db.exists("Custom DocPerm", {"parent": "Adda Event"})
		if has_custom_event_perms:
			# If Custom DocPerm exists on deployed site, it overrides DocPerm.
			# Insert Event Coordinator rules into Custom DocPerm if not already present:
			if not frappe.db.exists("Custom DocPerm", {"parent": "Adda Event", "role": "Event Coordinator", "if_owner": 0}):
				frappe.get_doc({
					"doctype": "Custom DocPerm",
					"parent": "Adda Event",
					"parenttype": "DocType",
					"parentfield": "permissions",
					"role": "Event Coordinator",
					"permlevel": 0,
					"read": 1,
					"write": 1,
					"create": 1,
					"delete": 0,
					"if_owner": 0,
				}).insert(ignore_permissions=True)

			if not frappe.db.exists("Custom DocPerm", {"parent": "Adda Event", "role": "Event Coordinator", "if_owner": 1}):
				frappe.get_doc({
					"doctype": "Custom DocPerm",
					"parent": "Adda Event",
					"parenttype": "DocType",
					"parentfield": "permissions",
					"role": "Event Coordinator",
					"permlevel": 0,
					"read": 1,
					"write": 1,
					"create": 0,
					"delete": 1,
					"if_owner": 1,
				}).insert(ignore_permissions=True)

		has_custom_room_perms = frappe.db.exists("Custom DocPerm", {"parent": "Adda Room"})
		if has_custom_room_perms:
			if not frappe.db.exists("Custom DocPerm", {"parent": "Adda Room", "role": "Event Coordinator"}):
				frappe.get_doc({
					"doctype": "Custom DocPerm",
					"parent": "Adda Room",
					"parenttype": "DocType",
					"parentfield": "permissions",
					"role": "Event Coordinator",
					"permlevel": 0,
					"read": 1,
					"write": 0,
					"create": 0,
					"delete": 0,
					"if_owner": 0,
				}).insert(ignore_permissions=True)

	# 3. Ensure standard DocPerm table also has the rows in DB
	if frappe.db.table_exists("DocPerm"):
		if not frappe.db.exists("DocPerm", {"parent": "Adda Event", "role": "Event Coordinator", "if_owner": 0}):
			frappe.get_doc({
				"doctype": "DocPerm",
				"parent": "Adda Event",
				"parenttype": "DocType",
				"parentfield": "permissions",
				"role": "Event Coordinator",
				"permlevel": 0,
				"read": 1,
				"write": 1,
				"create": 1,
				"delete": 0,
				"if_owner": 0,
			}).insert(ignore_permissions=True)

		if not frappe.db.exists("DocPerm", {"parent": "Adda Event", "role": "Event Coordinator", "if_owner": 1}):
			frappe.get_doc({
				"doctype": "DocPerm",
				"parent": "Adda Event",
				"parenttype": "DocType",
				"parentfield": "permissions",
				"role": "Event Coordinator",
				"permlevel": 0,
				"read": 1,
				"write": 1,
				"create": 0,
				"delete": 1,
				"if_owner": 1,
			}).insert(ignore_permissions=True)

		if not frappe.db.exists("DocPerm", {"parent": "Adda Room", "role": "Event Coordinator"}):
			frappe.get_doc({
				"doctype": "DocPerm",
				"parent": "Adda Room",
				"parenttype": "DocType",
				"parentfield": "permissions",
				"role": "Event Coordinator",
				"permlevel": 0,
				"read": 1,
				"write": 0,
				"create": 0,
				"delete": 0,
				"if_owner": 0,
			}).insert(ignore_permissions=True)

	frappe.db.commit()
	frappe.clear_cache(doctype="Adda Event")
	frappe.clear_cache(doctype="Adda Room")


def setup_settings():
	"""Ensure Adda Space Settings and Website Settings documents are initialized with default values."""
	if frappe.db.table_exists("Adda Space Settings"):
		try:
			settings = frappe.get_single("Adda Space Settings")
			if settings.get("enable_public_registration") is None:
				settings.enable_public_registration = 1
				settings.save(ignore_permissions=True)
				frappe.db.commit()
		except Exception:
			pass

	if frappe.db.table_exists("Website Settings"):
		try:
			ws = frappe.get_single("Website Settings")
			ws.favicon = "/assets/adda_space/images/favicon.ico"
			ws.app_logo = "/assets/adda_space/images/adda_space_logo.png"
			ws.save(ignore_permissions=True)
			frappe.db.commit()
		except Exception:
			pass
