# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class AddaCity(Document):
	def validate(self):
		self.clean_fields()
		self.validate_duplicate_name()

	def clean_fields(self):
		if self.city_name:
			self.city_name = self.city_name.strip()
		if not self.city_name:
			frappe.throw(_("City Name cannot be empty."))

	def validate_duplicate_name(self):
		"""Case-insensitive duplicate check to prevent duplicates like 'Bengaluru' and 'bengaluru'."""
		clean_name = (self.city_name or "").strip().lower()
		existing = frappe.get_all(
			"Adda City",
			filters={"name": ["!=", self.name or ""]},
			fields=["name", "city_name"],
		)
		for record in existing:
			rec_name = (record.get("city_name") or record.get("name") or "").strip().lower()
			if rec_name == clean_name:
				frappe.throw(_("Adda City '{0}' already exists.").format(self.city_name))
