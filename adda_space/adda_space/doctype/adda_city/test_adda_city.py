# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestAddaCity(IntegrationTestCase):
	def tearDown(self):
		# Clean up any test cities created
		for c in ["Testville", "testville", "Newcity"]:
			if frappe.db.exists("Adda City", c):
				frappe.delete_doc("Adda City", c, force=True, ignore_permissions=True)

	def test_create_valid_city(self):
		city = frappe.get_doc({
			"doctype": "Adda City",
			"city_name": "Testville",
			"is_active": 1,
			"state": "Karnataka",
			"country": "India",
		}).insert(ignore_permissions=True)

		self.assertEqual(city.name, "Testville")
		self.assertEqual(city.is_active, 1)

	def test_duplicate_city_prevented(self):
		frappe.get_doc({
			"doctype": "Adda City",
			"city_name": "Testville",
		}).insert(ignore_permissions=True)

		# Case-insensitive duplicate test
		dup = frappe.get_doc({
			"doctype": "Adda City",
			"city_name": "testville",
		})
		with self.assertRaises(frappe.ValidationError):
			dup.insert(ignore_permissions=True)

	def test_empty_city_disallowed(self):
		invalid = frappe.get_doc({
			"doctype": "Adda City",
			"city_name": "   ",
		})
		with self.assertRaises(frappe.ValidationError):
			invalid.insert(ignore_permissions=True)
