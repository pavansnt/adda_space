# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime
from adda_space.api.events import (
	get_adda_events,
	get_adda_event_detail,
	create_adda_event,
	fetch_supported_cities,
)


class TestApiSecurityAndPermissions(IntegrationTestCase):
	def setUp(self):
		frappe.set_user("Administrator")
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		now = now_datetime()
		self.approved_event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Security Test Approved Event",
			"type": "Adda",
			"description": "Public approved gathering.",
			"start_date_time": add_to_date(now, days=8, hours=10),
			"end_date_time": add_to_date(now, days=8, hours=12),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
			"organizer_name": "Private Organizer",
			"organizer_email": "private_organizer@example.com",
			"organizer_mobile": "9999988888",
		}).insert(ignore_permissions=True)

		self.rejected_event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Security Test Rejected Event",
			"type": "Adda",
			"description": "Rejected gathering.",
			"start_date_time": add_to_date(now, days=9, hours=10),
			"end_date_time": add_to_date(now, days=9, hours=12),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Rejected",
		}).insert(ignore_permissions=True)

	def tearDown(self):
		frappe.set_user("Administrator")
		for ev in [getattr(self, "approved_event", None), getattr(self, "rejected_event", None)]:
			if ev and frappe.db.exists("Adda Event", ev.name):
				frappe.delete_doc("Adda Event", ev.name, force=True, ignore_permissions=True)

		reqs = frappe.get_all(
			"Adda Event Request",
			filters={"title": ["like", "Security Test%"]},
			pluck="name",
		)
		for r in reqs:
			ev = frappe.db.get_value("Adda Event Request", r, "event")
			if ev and frappe.db.exists("Adda Event", ev):
				frappe.delete_doc("Adda Event", ev, force=True, ignore_permissions=True)
			frappe.delete_doc("Adda Event Request", r, force=True, ignore_permissions=True)

	def test_public_event_list_does_not_expose_private_organizer_data(self):
		frappe.set_user("Guest")
		res = get_adda_events(time_scope="upcoming", event_type="all")
		self.assertTrue(res.get("success"))

		matched = [e for e in res.get("events", []) if e.get("name") == self.approved_event.name]
		self.assertEqual(len(matched), 1)
		event_payload = matched[0]

		# Verify private fields are NOT in the public payload
		self.assertNotIn("organizer_email", event_payload)
		self.assertNotIn("organizer_mobile", event_payload)
		self.assertNotIn("admin_notes", event_payload)

	def test_public_event_detail_does_not_expose_private_organizer_data(self):
		frappe.set_user("Guest")
		res = get_adda_event_detail(self.approved_event.name)
		self.assertTrue(res.get("success"))
		payload = res.get("event")

		self.assertNotIn("organizer_email", payload)
		self.assertNotIn("organizer_mobile", payload)
		self.assertNotIn("admin_notes", payload)

	def test_rejected_or_unapproved_events_not_exposed_in_public_api(self):
		frappe.set_user("Guest")
		# 1. Not in public list
		res = get_adda_events(time_scope="upcoming", event_type="all")
		event_names = [e.get("name") for e in res.get("events", [])]
		self.assertNotIn(self.rejected_event.name, event_names)

		# 2. Detail returns 404
		detail_res = get_adda_event_detail(self.rejected_event.name)
		self.assertFalse(detail_res.get("success"))

	def test_guest_submission_cannot_set_approved_status(self):
		frappe.set_user("Guest")
		now = now_datetime()
		res = create_adda_event(
			title="Security Test Guest Submit",
			type="Adda",
			description="Attempting to force approval status as guest.",
			start_date_time=add_to_date(now, days=15, hours=10).strftime("%Y-%m-%d %H:%M:%S"),
			end_date_time=add_to_date(now, days=15, hours=12).strftime("%Y-%m-%d %H:%M:%S"),
			city="Bengaluru",
			cover_image="/assets/adda_space/images/adda_space_logo.png",
			approval_status="Approved",  # Exploit attempt
		)

		self.assertTrue(res.get("success"))
		self.assertEqual(res.get("approval_status"), "Pending Review")

		event_doc = frappe.get_doc("Adda Event", res["name"])
		self.assertEqual(event_doc.approval_status, "Pending Review")

	def test_guest_cannot_execute_approve_method(self):
		frappe.set_user("Administrator")
		now = now_datetime()
		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Security Test Pending",
			"description": "Pending proposal.",
			"start_date_time": add_to_date(now, days=16),
			"end_date_time": add_to_date(now, days=16, hours=2),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"status": "Pending Review",
		}).insert(ignore_permissions=True)

		frappe.set_user("Guest")
		with self.assertRaises(frappe.PermissionError):
			req.approve()

		with self.assertRaises(frappe.PermissionError):
			req.reject()

