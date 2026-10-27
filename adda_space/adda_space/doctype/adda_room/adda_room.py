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

