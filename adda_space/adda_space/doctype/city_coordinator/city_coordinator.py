# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


def is_adda_admin(user=None) -> bool:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	roles = frappe.get_roles(user)
	return "System Manager" in roles or "Adda Space Admin" in roles or user == "Administrator"


class CityCoordinator(Document):
	def validate(self):
		self.clean_fields()
		self.validate_city()
		self.validate_active_coordinator_per_city()
		self.validate_operating_hours()
		self.validate_permissions()

	def clean_fields(self):
		if self.coordinator_name:
			self.coordinator_name = self.coordinator_name.strip()
		if self.whatsapp_number:
			self.whatsapp_number = self.whatsapp_number.strip()
		if self.role_title:
			self.role_title = self.role_title.strip()
		if self.email:
			self.email = self.email.strip()
		if self.hours_note:
			self.hours_note = self.hours_note.strip()

	def validate_city(self):
		if not self.city:
			frappe.throw(_("City is mandatory."))
		if (
			getattr(frappe, "db", None)
			and hasattr(frappe.db, "table_exists")
			and frappe.db.table_exists("Adda City")
			and not frappe.db.exists("Adda City", self.city)
		):
			frappe.throw(_("Adda City '{0}' does not exist.").format(self.city))

	def validate_active_coordinator_per_city(self):
		if not self.is_active:
			return

		# Check for existing active coordinator for this city
		filters = {
			"city": self.city,
			"is_active": 1,
		}
		if self.name:
			filters["name"] = ["!=", self.name]

		if getattr(frappe, "db", None) and hasattr(frappe.db, "table_exists") and frappe.db.table_exists("City Coordinator"):
			existing = frappe.get_all(
				"City Coordinator",
				filters=filters,
				fields=["name", "coordinator_name"],
				limit=1,
			)
			if existing:
				name_found = existing[0].get("coordinator_name") or existing[0].get("name")
				frappe.throw(
					_(
						"An active coordinator is already assigned to {0}: '{1}'. Only one active coordinator per city is allowed."
					).format(self.city, name_found)
				)

	def validate_operating_hours(self):
		if not self.is_active:
			return

		if not self.opening_time or not self.closing_time:
			frappe.throw(_("Opening time and closing time are mandatory for an active coordinator."))

		s_open = str(self.opening_time).strip()
		s_close = str(self.closing_time).strip()

		if s_open == s_close:
			frappe.throw(_("Opening time and closing time cannot be the same."))

		if s_close < s_open:
			frappe.throw(_("Closing time must be after opening time."))

	def validate_permissions(self):
		if is_adda_admin():
			return

		session_user = getattr(frappe.session, "user", None)
		if self.user and session_user and self.user != session_user:
			frappe.throw(
				_("You are only permitted to manage your own City Coordinator record."),
				frappe.PermissionError,
			)

		if not self.is_new():
			doc_before = self.get_doc_before_save()
			if doc_before and doc_before.city != self.city:
				frappe.throw(
					_("Coordinators are not authorized to change the assigned city."),
					frappe.PermissionError,
				)

