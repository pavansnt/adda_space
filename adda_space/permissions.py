# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def has_event_permission(doc, user=None, permission_type=None, **kwargs):
	"""
	Server-side document permission hook for Adda Event.
	Signature: has_event_permission(doc, user=None, permission_type=None)

	Rules:
	- Administrator and System Manager / Adda Space Admin retain full access.
	- Users without Event Coordinator role retain their existing permission behaviour.
	- Event Coordinator can delete an event only when doc.owner == user.
	- Event Coordinator cannot delete another user's event.
	- Event Coordinator can read, write, and create events (including events created by other coordinators).
	"""
	permission_type = permission_type or kwargs.get("ptype") or "read"
	user = user or frappe.session.user

	if user == "Administrator":
		return True

	roles = frappe.get_roles(user)
	if "System Manager" in roles or "Adda Space Admin" in roles:
		return True

	if "Event Coordinator" in roles:
		if permission_type == "delete":
			if not doc:
				# General permission check without specific document:
				# Event Coordinator cannot delete globally/in bulk
				return False
			owner = getattr(doc, "owner", None)
			if not owner and isinstance(doc, (str, int)):
				owner = frappe.db.get_value("Adda Event", doc, "owner")
			return bool(owner and owner == user)

		if permission_type in ("read", "write", "create"):
			return True

	return None


def validate_event_delete_permission(doc, method=None):
	"""
	Server-side document event hook for Adda Event on_trash / before_delete.
	Enforces that Event Coordinators can only delete events they created.
	"""
	user = frappe.session.user
	if user == "Administrator":
		return

	roles = frappe.get_roles(user)
	if "System Manager" in roles or "Adda Space Admin" in roles:
		return

	if "Event Coordinator" in roles:
		owner = getattr(doc, "owner", None)
		if not owner and hasattr(doc, "name") and doc.name:
			owner = frappe.db.get_value("Adda Event", doc.name, "owner")
		if owner and owner != user:
			frappe.throw(
				_("Event Coordinators can only delete events that they created."),
				frappe.PermissionError,
			)
