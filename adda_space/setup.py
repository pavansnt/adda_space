# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe


def setup_adda_space():
	"""Initialize Adda Space roles and base configuration on install/migrate."""
	setup_roles()
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
