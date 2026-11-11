# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from adda_space.permissions import is_adda_admin


class AddaRoom(Document):
	def validate(self):
		if self.room_name:
			self.room_name = self.room_name.strip()
		if not self.room_name:
			frappe.throw(_("Room Name cannot be empty."))

		if self.capacity is not None and self.capacity < 0:
			frappe.throw(_("Capacity cannot be negative."))

		self.validate_operating_hours()
		self.validate_coordinator_permissions()

	def validate_operating_hours(self):
		if self.is_active:
			if not self.opening_time or not self.closing_time:
				frappe.throw(_("Opening time and closing time are mandatory for an active room."))

		if self.opening_time and self.closing_time:
			s_open = str(self.opening_time).strip()
			s_close = str(self.closing_time).strip()

			if s_open == s_close:
				frappe.throw(_("Opening time and closing time cannot be the same."))

			if s_close < s_open:
				frappe.throw(_("Closing time must be after opening time."))
		elif self.opening_time or self.closing_time:
			frappe.throw(_("Both opening time and closing time must be configured."))

	def validate_coordinator_permissions(self):
		user = frappe.session.user
		if is_adda_admin(user):
			return

		roles = frappe.get_roles(user)
		if "Room Coordinator" in roles:
			coord = getattr(self, "coordinator", None)
			if not coord and self.name:
				coord = frappe.db.get_value("Adda Room", self.name, "coordinator")
			if coord != user and self.owner != user:
				frappe.throw(
					_("Room Coordinators are only permitted to modify their assigned room."),
					frappe.PermissionError,
				)

			if not self.is_new():
				doc_before = self.get_doc_before_save()
				if doc_before and doc_before.coordinator != self.coordinator:
					frappe.throw(
						_("Room Coordinators are not permitted to reassign the room coordinator."),
						frappe.PermissionError,
					)

	def on_trash(self):
		user = frappe.session.user
		if is_adda_admin(user):
			return

		roles = frappe.get_roles(user)
		if "Room Coordinator" in roles:
			frappe.throw(
				_("Room Coordinators cannot delete rooms."),
				frappe.PermissionError,
			)
