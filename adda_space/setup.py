# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe


def setup_adda_space():
	"""Initialize Adda Space roles and base configuration on install/migrate."""
	setup_roles()
	setup_settings()


def setup_roles():
	"""Ensure 'Adda Space Admin' role exists with Desk access."""
	role_name = "Adda Space Admin"
	if not frappe.db.exists("Role", role_name):
		role = frappe.get_doc({
			"doctype": "Role",
			"role_name": role_name,
			"desk_access": 1,
			"is_custom": 0,
		})
		role.insert(ignore_permissions=True)
		frappe.db.commit()


def setup_settings():
	"""Ensure Adda Space Settings document is initialized with default values."""
	if frappe.db.table_exists("Adda Space Settings"):
		try:
			settings = frappe.get_single("Adda Space Settings")
			if settings.get("enable_public_registration") is None:
				settings.enable_public_registration = 1
				settings.save(ignore_permissions=True)
				frappe.db.commit()
		except Exception:
			pass

def setup_settings():
	"""Ensure Adda Space Settings document is initialized with default values."""
	if frappe.db.table_exists("Adda Space Settings"):
		try:
			settings = frappe.get_single("Adda Space Settings")
			if settings.get("enable_public_registration") is None:
				settings.enable_public_registration = 1
				settings.save(ignore_permissions=True)
				frappe.db.commit()
		except Exception:
			pass

