# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class AddaRoom(Document):
	def validate(self):
		if self.room_name:
			self.room_name = self.room_name.strip()
		if not self.room_name:
			frappe.throw(_("Room Name cannot be empty."))

		if self.capacity is not None and self.capacity < 0:
			frappe.throw(_("Capacity cannot be negative."))

		self.validate_operating_hours()

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
