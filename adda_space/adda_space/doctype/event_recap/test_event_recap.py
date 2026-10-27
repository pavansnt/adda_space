# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime


class TestEventRecap(IntegrationTestCase):
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
			"title": "Recap Test Event",
			"type": "Adda",
			"description": "Event for recap test.",
			"start_date_time": add_to_date(now, days=-2),
			"end_date_time": add_to_date(now, days=-2, hours=2),
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

	def tearDown(self):
		recaps = frappe.get_all("Event Recap", filters={"event": self.event.name}, pluck="name")
		for r in recaps:
			frappe.delete_doc("Event Recap", r, force=True, ignore_permissions=True)

		if frappe.db.exists("Adda Event", self.event.name):
			frappe.delete_doc("Adda Event", self.event.name, force=True, ignore_permissions=True)

	def test_create_valid_published_recap(self):
		recap = frappe.get_doc({
			"doctype": "Event Recap",
			"event": self.event.name,
			"title": "Highlights from the Adda Gathering",
			"status": "Published",
			"summary": "<p>We had a great turnout and discussed local solutions.</p>",
			"key_outcomes": "Formed 2 working groups.",
			"attendees": 25,
			"facilitator": "Pavan",
		}).insert(ignore_permissions=True)

		self.assertEqual(recap.event, self.event.name)
		self.assertEqual(recap.status, "Published")

	def test_published_recap_requires_title_and_summary(self):
		recap = frappe.get_doc({
			"doctype": "Event Recap",
			"event": self.event.name,
			"title": "",
			"status": "Published",
			"summary": "",
		})
		with self.assertRaises(frappe.ValidationError):
			recap.insert(ignore_permissions=True)

	def test_only_one_recap_per_event(self):
		frappe.get_doc({
			"doctype": "Event Recap",
			"event": self.event.name,
			"title": "Recap 1",
			"status": "Draft",
			"summary": "Summary 1",
		}).insert(ignore_permissions=True)

		recap2 = frappe.get_doc({
			"doctype": "Event Recap",
			"event": self.event.name,
			"title": "Recap 2",
			"status": "Draft",
			"summary": "Summary 2",
		})
		with self.assertRaises(frappe.ValidationError):
			recap2.insert(ignore_permissions=True)
