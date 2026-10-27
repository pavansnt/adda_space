# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime

EXTRA_TEST_RECORD_DEPENDENCIES = []
IGNORE_TEST_RECORD_DEPENDENCIES = ["User", "Adda Event", "Adda Event Registration"]


class TestAddaEventRegistration(IntegrationTestCase):
	def setUp(self):
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		now = now_datetime()
		self.event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Registration Event",
			"type": "Adda",
			"description": "Event for testing registrations.",
			"start_date_time": add_to_date(now, days=10),
			"end_date_time": add_to_date(now, days=10, hours=2),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
			"capacity": 2,
		}).insert(ignore_permissions=True)

	def tearDown(self):
		regs = frappe.get_all(
			"Adda Event Registration",
			filters={"event": self.event.name},
			pluck="name",
		)
		for r in regs:
			frappe.delete_doc("Adda Event Registration", r, force=True, ignore_permissions=True)

		if frappe.db.exists("Adda Event", self.event.name):
			frappe.delete_doc("Adda Event", self.event.name, force=True, ignore_permissions=True)

	def test_successful_registration(self):
		reg = frappe.get_doc({
			"doctype": "Adda Event Registration",
			"event": self.event.name,
			"full_name": "Participant One",
			"mobile": "9876543210",
			"email": "p1@example.com",
			"status": "Registered",
		}).insert(ignore_permissions=True)

		self.assertEqual(reg.status, "Registered")
		self.assertTrue(reg.name)

	def test_duplicate_registration_rejected(self):
		frappe.get_doc({
			"doctype": "Adda Event Registration",
			"event": self.event.name,
			"full_name": "Participant Dup 1",
			"mobile": "9876543211",
			"status": "Registered",
		}).insert(ignore_permissions=True)

		# Second registration with same mobile
		dup = frappe.get_doc({
			"doctype": "Adda Event Registration",
			"event": self.event.name,
			"full_name": "Participant Dup 2",
			"mobile": "9876543211",
			"status": "Registered",
		}).insert(ignore_permissions=True)

		self.assertEqual(dup.status, "Rejected")
		self.assertIn("duplicate", (dup.reason or "").lower())

	def test_capacity_limit_enforced(self):
		# Capacity is 2
		frappe.get_doc({
			"doctype": "Adda Event Registration",
			"event": self.event.name,
			"full_name": "Cap 1",
			"mobile": "9876543221",
			"status": "Registered",
		}).insert(ignore_permissions=True)

		frappe.get_doc({
			"doctype": "Adda Event Registration",
			"event": self.event.name,
			"full_name": "Cap 2",
			"mobile": "9876543222",
			"status": "Registered",
		}).insert(ignore_permissions=True)

		# 3rd registration should be rejected
		over_cap = frappe.get_doc({
			"doctype": "Adda Event Registration",
			"event": self.event.name,
			"full_name": "Cap 3",
			"mobile": "9876543223",
			"status": "Registered",
		}).insert(ignore_permissions=True)

		self.assertEqual(over_cap.status, "Rejected")
		self.assertIn("capacity", (over_cap.reason or "").lower())
