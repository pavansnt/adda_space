# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase


class TestAddaRoom(IntegrationTestCase):
	def setUp(self):
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

	def tearDown(self):
		for r in ["Test Conference Room"]:
			if frappe.db.exists("Adda Room", r):
				frappe.delete_doc("Adda Room", r, force=True, ignore_permissions=True)

	def test_create_valid_room(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Conference Room",
			"city": "Bengaluru",
			"capacity": 30,
			"is_active": 1,
		}).insert(ignore_permissions=True)

		self.assertEqual(room.name, "Test Conference Room")
		self.assertEqual(room.capacity, 30)

	def test_room_negative_capacity_prevented(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Conference Room",
			"city": "Bengaluru",
			"capacity": -5,
		})
		with self.assertRaises(frappe.ValidationError):
			room.insert(ignore_permissions=True)

