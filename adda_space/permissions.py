# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def is_adda_admin(user=None) -> bool:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	roles = frappe.get_roles(user)
	return "System Manager" in roles or "Adda Space Admin" in roles or user == "Administrator"


def has_event_permission(doc, user=None, permission_type=None, **kwargs):
	"""
	Server-side document permission hook for Adda Event.
	Signature: has_event_permission(doc, user=None, permission_type=None)

	Rules:
	- Administrator and System Manager / Adda Space Admin retain full access.
	- Users without Room Coordinator role retain their existing permission behaviour.
	- Room Coordinator can delete an event only when doc.owner == user.
	- Room Coordinator cannot delete another user's event.
	- Room Coordinator can read, write, and create events (including events created by other coordinators).
	"""
	permission_type = permission_type or kwargs.get("ptype") or "read"
	user = user or frappe.session.user

	if is_adda_admin(user):
		return True

	roles = frappe.get_roles(user)
	if "Room Coordinator" in roles:
		if permission_type == "delete":
			if not doc:
				# General permission check without specific document:
				# Room Coordinator cannot delete globally/in bulk
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
	Enforces that Room Coordinators can only delete events they created.
	"""
	user = frappe.session.user
	if is_adda_admin(user):
		return

	roles = frappe.get_roles(user)
	if "Room Coordinator" in roles:
		owner = getattr(doc, "owner", None)
		if not owner and hasattr(doc, "name") and doc.name:
			owner = frappe.db.get_value("Adda Event", doc.name, "owner")
		if owner and owner != user:
			frappe.throw(
				_("Room Coordinators can only delete events that they created."),
				frappe.PermissionError,
			)


def has_room_permission(doc, user=None, permission_type=None, **kwargs):
	"""
	Server-side document permission hook for Adda Room.
	Signature: has_room_permission(doc, user=None, permission_type=None)

	Rules:
	- Administrator and System Manager / Adda Space Admin retain full access.
	- Room Coordinator can read all rooms (needed to select rooms when creating events).
	- Room Coordinator cannot create or delete any room.
	- Room Coordinator can only modify (write) details of the room they are assigned to
	  (doc.coordinator == user or doc.owner == user).
	"""
	permission_type = permission_type or kwargs.get("ptype") or "read"
	user = user or frappe.session.user

	if is_adda_admin(user):
		return True

	roles = frappe.get_roles(user)
	if "Room Coordinator" in roles:
		if permission_type == "read":
			return True

		if permission_type in ("create", "delete"):
			return False

		if permission_type == "write":
			if not doc:
				return True
			coord = getattr(doc, "coordinator", None)
			if not coord and isinstance(doc, (str, int)):
				coord = frappe.db.get_value("Adda Room", doc, "coordinator")
			owner = getattr(doc, "owner", None)
			if not owner and isinstance(doc, (str, int)):
				owner = frappe.db.get_value("Adda Room", doc, "owner")
			return bool((coord and coord == user) or (owner and owner == user))

	return None


def validate_room_delete_permission(doc, method=None):
	"""
	Server-side document event hook for Adda Room on_trash.
	Enforces that Room Coordinators cannot delete rooms.
	"""
	user = frappe.session.user
	if is_adda_admin(user):
		return

	roles = frappe.get_roles(user)
	if "Room Coordinator" in roles:
		frappe.throw(
			_("Room Coordinators cannot delete rooms."),
			frappe.PermissionError,
		)
