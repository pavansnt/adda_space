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
				"timezone": "Asia/Kolkata",
				"is_active": 1,
			}).insert(ignore_permissions=True)

	def tearDown(self):
		for r in ["Test Conference Room", "Test Inactive Room", "Test Room Hours"]:
			if frappe.db.exists("Adda Room", r):
				frappe.delete_doc("Adda Room", r, force=True, ignore_permissions=True)

	def test_create_valid_room(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Conference Room",
			"city": "Bengaluru",
			"capacity": 30,
			"opening_time": "10:00:00",
			"closing_time": "18:00:00",
			"is_active": 1,
		}).insert(ignore_permissions=True)

		self.assertEqual(room.name, "Test Conference Room")
		self.assertEqual(room.capacity, 30)
		self.assertEqual(str(room.opening_time), "10:00:00")
		self.assertEqual(str(room.closing_time), "18:00:00")

	def test_room_negative_capacity_prevented(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Conference Room",
			"city": "Bengaluru",
			"capacity": -5,
			"opening_time": "10:00:00",
			"closing_time": "18:00:00",
			"is_active": 1,
		})
		with self.assertRaises(frappe.ValidationError):
			room.insert(ignore_permissions=True)

	def test_room_operating_hours_mandatory_when_active(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Room Hours",
			"city": "Bengaluru",
			"capacity": 20,
			"is_active": 1,
			"opening_time": None,
			"closing_time": None,
		})
		with self.assertRaises(frappe.ValidationError):
			room.insert(ignore_permissions=True)

	def test_room_reject_closing_before_opening(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Room Hours",
			"city": "Bengaluru",
			"capacity": 20,
			"is_active": 1,
			"opening_time": "18:00:00",
			"closing_time": "10:00:00",
		})
		with self.assertRaises(frappe.ValidationError):
			room.insert(ignore_permissions=True)

	def test_room_reject_identical_hours(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Room Hours",
			"city": "Bengaluru",
			"capacity": 20,
			"is_active": 1,
			"opening_time": "10:00:00",
			"closing_time": "10:00:00",
		})
		with self.assertRaises(frappe.ValidationError):
			room.insert(ignore_permissions=True)

	def test_inactive_room_without_hours_allowed(self):
		room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Test Inactive Room",
			"city": "Bengaluru",
			"capacity": 20,
			"is_active": 0,
			"opening_time": None,
			"closing_time": None,
		}).insert(ignore_permissions=True)

		self.assertEqual(room.is_active, 0)
		self.assertIsNone(room.opening_time)
		self.assertIsNone(room.closing_time)
