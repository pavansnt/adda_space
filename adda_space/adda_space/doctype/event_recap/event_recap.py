# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils.data import strip_html


class EventRecap(Document):
	def validate(self):
		self.validate_one_recap_per_event()
		self.validate_published_content()
		self.validate_attendees()

	def validate_one_recap_per_event(self):
		if self.event and frappe.db.exists(
			"Event Recap", {"event": self.event, "name": ["!=", self.name or ""]}
		):
			frappe.throw(_("An event can have only one recap."))

	def validate_published_content(self):
		if self.status != "Published":
			return

		if not (self.title or "").strip():
			frappe.throw(_("Add a recap title before publishing."))
		if not strip_html(self.summary or "").strip():
			frappe.throw(_("Add a recap summary before publishing."))

	def validate_attendees(self):
		if self.attendees is not None and self.attendees < 0:
			frappe.throw(_("Attendees cannot be a negative number."))
