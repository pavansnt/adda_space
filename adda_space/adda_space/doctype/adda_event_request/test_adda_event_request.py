# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime


class TestAddaEventRequest(IntegrationTestCase):
	def setUp(self):
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

	def tearDown(self):
		frappe.set_user("Administrator")
		reqs = frappe.get_all(
			"Adda Event Request",
			filters={"title": ["like", "Test Proposal%"]},
			pluck="name",
		)
		for r in reqs:
			ev = frappe.db.get_value("Adda Event Request", r, "event")
			if ev and frappe.db.exists("Adda Event", ev):
				frappe.delete_doc("Adda Event", ev, force=True, ignore_permissions=True)
			frappe.delete_doc("Adda Event Request", r, force=True, ignore_permissions=True)

	def test_submission_defaults_to_pending_review(self):
		frappe.set_user("Guest")
		now = now_datetime()
		start = add_to_date(now, days=3)
		end = add_to_date(now, days=3, hours=2)

		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Test Proposal Pending",
			"description": "Public proposal submission.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"status": "Approved",  # Attempting to bypass approval as guest
		})
		req.insert(ignore_permissions=True)

		# Must be forced to Pending Review by validate()
		self.assertEqual(req.status, "Pending Review")
		self.assertIsNone(req.event)

	def test_admin_approval_creates_event_without_duplicate(self):
		frappe.set_user("Administrator")
		now = now_datetime()
		start = add_to_date(now, days=4)
		end = add_to_date(now, days=4, hours=2)

		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Test Proposal for Approval",
			"description": "Proposal awaiting review.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"status": "Pending Review",
		}).insert(ignore_permissions=True)

		# Admin approves
		res = req.approve(admin_notes="Looks great, approved for Adda Space!")
		self.assertEqual(res.get("status"), "success")
		self.assertEqual(req.status, "Approved")
		self.assertTrue(req.event)

		created_event = frappe.get_doc("Adda Event", req.event)
		self.assertEqual(created_event.title, "Test Proposal for Approval")
		self.assertEqual(created_event.approval_status, "Approved")

		# Re-approval should update existing event and not create a duplicate
		event_id_first = req.event
		req.title = "Test Proposal for Approval Updated"
		res2 = req.approve()
		self.assertEqual(req.event, event_id_first)

		updated_event = frappe.get_doc("Adda Event", event_id_first)
		self.assertEqual(updated_event.title, "Test Proposal for Approval Updated")

	def test_admin_rejection(self):
		frappe.set_user("Administrator")
		now = now_datetime()
		start = add_to_date(now, days=6)
		end = add_to_date(now, days=6, hours=2)

		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Test Proposal for Rejection",
			"description": "Proposal that will be rejected.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"status": "Pending Review",
		}).insert(ignore_permissions=True)

		req.reject(admin_notes="Room unavailable on this date.")
		self.assertEqual(req.status, "Rejected")
		self.assertEqual(req.admin_notes, "Room unavailable on this date.")

	def test_non_admin_cannot_approve(self):
		frappe.set_user("Administrator")
		now = now_datetime()
		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Test Proposal Non Admin",
			"description": "Proposal.",
			"start_date_time": add_to_date(now, days=7),
			"end_date_time": add_to_date(now, days=7, hours=2),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"status": "Pending Review",
		}).insert(ignore_permissions=True)

		# Switch to Guest
		frappe.set_user("Guest")
		with self.assertRaises(frappe.PermissionError):
			req.approve()

