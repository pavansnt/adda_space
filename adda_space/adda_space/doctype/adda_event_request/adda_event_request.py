# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime


def is_adda_admin(user=None) -> bool:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	roles = frappe.get_roles(user)
	return "System Manager" in roles or "Adda Space Admin" in roles or "Administrator" == user


class AddaEventRequest(Document):
	def validate(self):
		self.validate_dates()
		self.validate_permissions_and_status()

	def validate_dates(self):
		if not self.start_date_time or not self.end_date_time:
			frappe.throw(_("Both Start Date Time and End Date Time are mandatory."))

		start_dt = get_datetime(self.start_date_time)
		end_dt = get_datetime(self.end_date_time)

		if start_dt >= end_dt:
			frappe.throw(_("Start Date Time must be strictly before End Date Time."))

	def validate_permissions_and_status(self):
		# If document is being created or modified by a non-admin / Guest user:
		if not is_adda_admin():
			# Ensure public submission cannot bypass review or set status to Approved/Rejected
			if self.is_new():
				self.status = "Pending Review"
				self.event = None
			else:
				# Prevent modifying an existing request if not an admin
				doc_before = self.get_doc_before_save()
				if doc_before and doc_before.status != self.status:
					frappe.throw(_("Only Adda Space administrators can change proposal review status."))
				if doc_before and doc_before.event != self.event:
					self.event = doc_before.event

	@frappe.whitelist()
	def approve(self, admin_notes=None):
		"""Admin action to approve proposal and create/update corresponding Adda Event."""
		if not is_adda_admin():
			frappe.throw(_("Only Adda Space administrators can approve event proposals."), frappe.PermissionError)

		if admin_notes:
			self.admin_notes = admin_notes

		event_name = self.event
		if event_name and frappe.db.exists("Adda Event", event_name):
			# Update existing Adda Event record without creating a duplicate
			event_doc = frappe.get_doc("Adda Event", event_name)
			event_doc.title = self.title
			event_doc.type = self.event_type or "Adda"
			event_doc.description = self.description
			event_doc.start_date_time = self.start_date_time
			event_doc.end_date_time = self.end_date_time
			event_doc.city = self.city
			event_doc.room_name = self.room_name
			event_doc.venue_details = self.venue_details
			event_doc.mode = self.mode or "Offline"
			event_doc.cover_image = self.cover_image
			event_doc.image = self.cover_image
			event_doc.people_expected = self.people_expected
			event_doc.wa_group_link = self.wa_group_link
			event_doc.organizer_name = self.organizer_name
			event_doc.organizer_email = self.organizer_email
			event_doc.organizer_mobile = self.organizer_mobile
			event_doc.approval_status = "Approved"
			event_doc.event_request = self.name
			event_doc.save(ignore_permissions=True)
		else:
			# Create new Adda Event record
			event_doc = frappe.get_doc({
				"doctype": "Adda Event",
				"title": self.title,
				"type": self.event_type or "Adda",
				"description": self.description,
				"start_date_time": self.start_date_time,
				"end_date_time": self.end_date_time,
				"city": self.city,
				"room_name": self.room_name,
				"venue_details": self.venue_details,
				"mode": self.mode or "Offline",
				"cover_image": self.cover_image,
				"image": self.cover_image,
				"people_expected": self.people_expected,
				"wa_group_link": self.wa_group_link,
				"organizer_name": self.organizer_name,
				"organizer_email": self.organizer_email,
				"organizer_mobile": self.organizer_mobile,
				"approval_status": "Approved",
				"event_request": self.name,
			})
			event_doc.insert(ignore_permissions=True)
			self.event = event_doc.name

		self.status = "Approved"
		self.save(ignore_permissions=True)

		return {
			"status": "success",
			"message": _("Proposal approved and Adda Event created."),
			"event": self.event,
		}

	@frappe.whitelist()
	def reject(self, admin_notes=None):
		"""Admin action to reject proposal."""
		if not is_adda_admin():
			frappe.throw(_("Only Adda Space administrators can reject event proposals."), frappe.PermissionError)

		if admin_notes:
			self.admin_notes = admin_notes

		self.status = "Rejected"
		if self.event and frappe.db.exists("Adda Event", self.event):
			frappe.db.set_value("Adda Event", self.event, "approval_status", "Rejected")

		self.save(ignore_permissions=True)

		return {
			"status": "success",
			"message": _("Proposal has been marked as Rejected."),
		}

