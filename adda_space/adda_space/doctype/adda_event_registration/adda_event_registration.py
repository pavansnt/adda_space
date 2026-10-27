# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


def clean_phone_number(val):
	if not val:
		return ""
	digits = "".join(filter(str.isdigit, str(val)))
	if len(digits) == 10:
		return f"91{digits}"
	return digits


class AddaEventRegistration(Document):
	def validate(self):
		self.clean_mobile()
		self.validate_duplicate_registration()
		self.validate_capacity()

	def clean_mobile(self):
		if self.mobile:
			self.mobile = clean_phone_number(self.mobile)
		if not self.mobile and not self.user:
			frappe.throw(_("Mobile number or User is required for registration."))

	def validate_duplicate_registration(self):
		"""Detect active duplicate registration for the same event."""
		if not self.event:
			return

		# Check by user or mobile
		filters = {
			"event": self.event,
			"name": ["!=", self.name or ""],
			"status": ["not in", ["Rejected", "Cancelled"]],
		}
		if self.user:
			filters["user"] = self.user
			existing = frappe.get_all("Adda Event Registration", filters=filters, pluck="name")
			if existing:
				self.status = "Rejected"
				self.reason = _("Duplicate registration: User is already registered for this event.")
				return

		if self.mobile:
			# Check trailing 10 digits
			clean_mob = self.mobile[-10:] if len(self.mobile) >= 10 else self.mobile
			all_regs = frappe.get_all(
				"Adda Event Registration",
				filters={
					"event": self.event,
					"name": ["!=", self.name or ""],
					"status": ["not in", ["Rejected", "Cancelled"]],
				},
				fields=["name", "mobile"],
			)
			for reg in all_regs:
				reg_mob = reg.get("mobile") or ""
				if reg_mob.endswith(clean_mob):
					self.status = "Rejected"
					self.reason = _("Duplicate registration: Mobile number is already registered for this event.")
					return

	def validate_capacity(self):
		if self.status != "Registered" or not self.event:
			return

		event_capacity = frappe.db.get_value("Adda Event", self.event, "capacity")
		if event_capacity and event_capacity > 0:
			current_count = frappe.db.count(
				"Adda Event Registration",
				filters={
					"event": self.event,
					"name": ["!=", self.name or ""],
					"status": "Registered",
				},
			)
			if current_count >= event_capacity:
				self.status = "Rejected"
				self.reason = _("Event has reached maximum capacity.")

