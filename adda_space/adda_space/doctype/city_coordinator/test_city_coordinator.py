# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import unittest
from unittest.mock import MagicMock, patch
import frappe
from frappe.tests import IntegrationTestCase
from adda_space.adda_space.doctype.city_coordinator.city_coordinator import CityCoordinator
from adda_space.api.events import (
	normalize_phone_number,
	format_time_12hr,
	get_city_coordinator,
	_MOCK_COORDINATOR_STORE,
)


class TestCityCoordinatorUnit(unittest.TestCase):
	"""Unit tests verifying City Coordinator logic without live database."""

	@classmethod
	def setUpClass(cls):
		try:
			frappe.init(site="samaaja.localhost", sites_path="sites")
		except Exception:
			pass
		cls.trans_patch = patch("frappe.translate.get_all_translations", return_value={})
		cls.trans_patch.start()

	@classmethod
	def tearDownClass(cls):
		cls.trans_patch.stop()

	def setUp(self):
		_MOCK_COORDINATOR_STORE.clear()
		if not hasattr(frappe, "local"):
			frappe.local = MagicMock()
		frappe.local.flags = frappe._dict()
		frappe.local.flags.mute_messages = False
		frappe.local.valid_columns = {}
		frappe.local.message_log = []
		frappe.local.db = MagicMock()

	def _create_coordinator(self, **kwargs):
		with patch("frappe.get_meta") as mock_meta:
			mock_meta.return_value._table_doctypes = []
			mock_meta.return_value.get_valid_columns.return_value = [
				"coordinator_name", "city", "whatsapp_number", "opening_time", "closing_time", "is_active", "role_title", "hours_note"
			]
			data = {"doctype": "City Coordinator"}
			data.update(kwargs)
			return CityCoordinator(data)

	def test_phone_normalization_indian_10_digit(self):
		self.assertEqual(normalize_phone_number("87929 65810"), "918792965810")
		self.assertEqual(normalize_phone_number("90350-54940"), "919035054940")
		self.assertEqual(normalize_phone_number("09035054940"), "919035054940")

	def test_phone_normalization_with_country_code(self):
		self.assertEqual(normalize_phone_number("+91 87929 65810"), "918792965810")
		self.assertEqual(normalize_phone_number("+1 (555) 234-5678"), "15552345678")
		self.assertEqual(normalize_phone_number("+44 7911 123456"), "447911123456")

	def test_time_formatting_12hr(self):
		self.assertEqual(format_time_12hr("10:00:00"), "10:00 AM")
		self.assertEqual(format_time_12hr("18:00:00"), "6:00 PM")
		self.assertEqual(format_time_12hr("00:00:00"), "12:00 AM")
		self.assertEqual(format_time_12hr("12:00:00"), "12:00 PM")
		self.assertEqual(format_time_12hr("09:30"), "9:30 AM")

	def test_coordinator_validation_missing_city(self):
		doc = self._create_coordinator(
			coordinator_name="Test Person",
			city="",
			whatsapp_number="87929 65810",
			is_active=1,
		)
		with self.assertRaises(frappe.ValidationError):
			doc.validate_city()

	def test_coordinator_validation_operating_hours_mandatory_when_active(self):
		doc = self._create_coordinator(
			coordinator_name="Sarah Misra",
			city="Mysuru",
			whatsapp_number="87929 65810",
			is_active=1,
			opening_time=None,
			closing_time=None,
		)
		with self.assertRaises(frappe.ValidationError):
			doc.validate_operating_hours()

	def test_coordinator_validation_reject_identical_hours(self):
		doc = self._create_coordinator(
			coordinator_name="Sarah Misra",
			city="Mysuru",
			whatsapp_number="87929 65810",
			is_active=1,
			opening_time="10:00:00",
			closing_time="10:00:00",
		)
		with self.assertRaises(frappe.ValidationError):
			doc.validate_operating_hours()

	def test_coordinator_validation_reject_closing_before_opening(self):
		doc = self._create_coordinator(
			coordinator_name="Sarah Misra",
			city="Mysuru",
			whatsapp_number="87929 65810",
			is_active=1,
			opening_time="18:00:00",
			closing_time="10:00:00",
		)
		with self.assertRaises(frappe.ValidationError):
			doc.validate_operating_hours()

	def test_coordinator_validation_valid_hours(self):
		doc = self._create_coordinator(
			coordinator_name="Sarah Misra",
			city="Mysuru",
			whatsapp_number="87929 65810",
			is_active=1,
			opening_time="10:00:00",
			closing_time="18:00:00",
		)
		# Should succeed without error
		doc.validate_operating_hours()

	def test_api_missing_city_raises_validation_error(self):
		with self.assertRaises(frappe.ValidationError):
			get_city_coordinator(city="")

	def test_api_nonexistent_city_raises_validation_error(self):
		with self.assertRaises(frappe.ValidationError):
			get_city_coordinator(city="NonexistentCityXYZ")

	def test_api_city_without_coordinator(self):
		res = get_city_coordinator(city="Bengaluru")
		self.assertTrue(res.get("success"))
		self.assertEqual(res.get("city"), "Bengaluru")
		self.assertIsNone(res.get("coordinator"))
		self.assertIn("No active coordinator", res.get("message"))

	def test_api_city_with_active_coordinator(self):
		_MOCK_COORDINATOR_STORE["bengaluru"] = {
			"name": "Bengaluru-Chiku Agarawal",
			"coordinator_name": "Chiku Agarawal",
			"role_title": "City Lead",
			"whatsapp_number": "90350 54940",
			"opening_time": "10:00:00",
			"closing_time": "18:00:00",
			"hours_note": "Closed on municipal holidays",
		}
		res = get_city_coordinator(city="Bengaluru")
		self.assertTrue(res.get("success"))
		coord = res.get("coordinator")
		self.assertIsNotNone(coord)
		self.assertEqual(coord["coordinator_name"], "Chiku Agarawal")
		self.assertEqual(coord["role_title"], "City Lead")
		self.assertEqual(coord["whatsapp_number"], "90350 54940")
		self.assertEqual(coord["normalized_phone"], "919035054940")
		self.assertEqual(coord["formatted_opening_time"], "10:00 AM")
		self.assertEqual(coord["formatted_closing_time"], "6:00 PM")
		self.assertEqual(coord["hours_note"], "Closed on municipal holidays")

		# Ensure private fields are NOT exposed
		self.assertNotIn("email", coord)
		self.assertNotIn("user", coord)
		self.assertNotIn("internal_notes", coord)


class TestCityCoordinatorIntegration(IntegrationTestCase):
	"""Integration tests requiring live Frappe site and database."""

	def setUp(self):
		frappe.set_user("Administrator")
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		if not frappe.db.exists("Adda City", "Mysuru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Mysuru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

	def tearDown(self):
		frappe.set_user("Administrator")
		for name in frappe.get_all("City Coordinator", filters={"coordinator_name": ["like", "Test%"]}, pluck="name"):
			frappe.delete_doc("City Coordinator", name, force=True, ignore_permissions=True)

	def test_one_active_coordinator_per_city_enforced(self):
		coord1 = frappe.get_doc({
			"doctype": "City Coordinator",
			"coordinator_name": "Test Lead 1",
			"city": "Bengaluru",
			"whatsapp_number": "9999900001",
			"is_active": 1,
			"opening_time": "10:00:00",
			"closing_time": "18:00:00",
		}).insert(ignore_permissions=True)

		coord2 = frappe.get_doc({
			"doctype": "City Coordinator",
			"coordinator_name": "Test Lead 2",
			"city": "Bengaluru",
			"whatsapp_number": "9999900002",
			"is_active": 1,
			"opening_time": "10:00:00",
			"closing_time": "18:00:00",
		})
		with self.assertRaises(frappe.ValidationError):
			coord2.insert(ignore_permissions=True)

