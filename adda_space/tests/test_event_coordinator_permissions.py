# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime


class TestEventCoordinatorPermissions(IntegrationTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		frappe.set_user("Administrator")

		# Ensure Event Coordinator role exists with desk access
		if not frappe.db.exists("Role", "Event Coordinator"):
			frappe.get_doc({
				"doctype": "Role",
				"role_name": "Event Coordinator",
				"desk_access": 1,
				"is_custom": 0,
			}).insert(ignore_permissions=True)
		else:
			frappe.db.set_value("Role", "Event Coordinator", "desk_access", 1)

		# Ensure test city exists
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		# Ensure test room exists
		if not frappe.db.exists("Adda Room", "Permission Test Room"):
			frappe.get_doc({
				"doctype": "Adda Room",
				"room_name": "Permission Test Room",
				"city": "Bengaluru",
				"capacity": 30,
				"opening_time": "09:00:00",
				"closing_time": "21:00:00",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		# Create test users directly in DB to bypass unrelated app hooks
		cls.coord1_email = "test_coord1@example.com"
		cls.coord2_email = "test_coord2@example.com"
		cls.regular_email = "test_regular_user@example.com"

		for email, role in [
			(cls.coord1_email, "Event Coordinator"),
			(cls.coord2_email, "Event Coordinator"),
			(cls.regular_email, None),
		]:
			frappe.db.sql("""
				INSERT INTO "tabUser" (name, email, first_name, enabled, creation, modified, modified_by, owner, docstatus)
				VALUES (%s, %s, %s, 1, NOW(), NOW(), 'Administrator', 'Administrator', 0)
				ON CONFLICT (name) DO NOTHING
			""", (email, email, email.split("@")[0]))

			# Remove any existing roles for this user
			frappe.db.sql("""
				DELETE FROM "tabHas Role" WHERE parent = %s
			""", (email,))

			if role:
				frappe.db.sql("""
					INSERT INTO "tabHas Role" (name, parent, parenttype, parentfield, role, creation, modified, modified_by, owner, docstatus)
					VALUES (%s, %s, 'User', 'roles', %s, NOW(), NOW(), 'Administrator', 'Administrator', 0)
				""", (frappe.generate_hash(length=10), email, role))

			frappe.db.commit()
			frappe.cache.hdel("roles", email)

	def setUp(self):
		frappe.set_user("Administrator")

	def tearDown(self):
		frappe.set_user("Administrator")
		# Clean up any test events created during tests
		events = frappe.get_all(
			"Adda Event",
			filters={"title": ["like", "Coord Perm Test%"]},
			pluck="name",
		)
		for ev in events:
			try:
				frappe.delete_doc("Adda Event", ev, force=True, ignore_permissions=True)
			except Exception:
				pass

	def _create_event(self, title, owner, days_offset=10):
		now = now_datetime()
		prev_user = frappe.session.user
		frappe.set_user(owner)
		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": title,
			"type": "Adda",
			"description": "Permission test event.",
			"start_date_time": add_to_date(now, days=days_offset, hours=10),
			"end_date_time": add_to_date(now, days=days_offset, hours=12),
			"city": "Bengaluru",
			"room_name": "Permission Test Room",
			"mode": "Offline",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Pending Review",
		})
		event.insert(ignore_permissions=True)
		frappe.set_user(prev_user)
		return event

	def test_01_coordinator_creates_event_allowed(self):
		"""1. Coordinator creates event: Allowed"""
		frappe.set_user(self.coord1_email)
		now = now_datetime()
		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Coord Perm Test Create Own",
			"type": "Adda",
			"description": "Created by coordinator.",
			"start_date_time": add_to_date(now, days=11, hours=10),
			"end_date_time": add_to_date(now, days=11, hours=12),
			"city": "Bengaluru",
			"room_name": "Permission Test Room",
			"mode": "Offline",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
		})
		event.insert()  # Normal permissions check
		self.assertTrue(event.name)
		self.assertEqual(event.owner, self.coord1_email)

	def test_02_coordinator_views_another_users_event_allowed(self):
		"""2. Coordinator views another user's event: Allowed"""
		# Created by coord2
		other_event = self._create_event("Coord Perm Test View Other", self.coord2_email, days_offset=12)

		frappe.set_user(self.coord1_email)
		has_read = frappe.has_permission("Adda Event", "read", doc=other_event)
		self.assertTrue(has_read)

		doc = frappe.get_doc("Adda Event", other_event.name)
		self.assertEqual(doc.title, "Coord Perm Test View Other")

	def test_03_coordinator_edits_another_users_event_allowed(self):
		"""3. Coordinator edits another user's event: Allowed"""
		other_event = self._create_event("Coord Perm Test Edit Other", self.coord2_email, days_offset=13)

		frappe.set_user(self.coord1_email)
		has_write = frappe.has_permission("Adda Event", "write", doc=other_event)
		self.assertTrue(has_write)

		doc = frappe.get_doc("Adda Event", other_event.name)
		doc.description = "Updated description by another coordinator."
		doc.save()

		doc.reload()
		self.assertEqual(doc.description, "Updated description by another coordinator.")

	def test_04_coordinator_deletes_own_event_allowed(self):
		"""4. Coordinator deletes own event: Allowed (Desk and API)"""
		own_event = self._create_event("Coord Perm Test Delete Own", self.coord1_email, days_offset=14)

		frappe.set_user(self.coord1_email)
		has_delete = frappe.has_permission("Adda Event", "delete", doc=own_event)
		self.assertTrue(has_delete)

		# Direct API deletion / Desk action
		frappe.delete_doc("Adda Event", own_event.name)
		self.assertFalse(frappe.db.exists("Adda Event", own_event.name))

		# Also test via client API endpoint (used by Desk form delete button)
		own_event_api = self._create_event("Coord Perm Test Delete Own API", self.coord1_email, days_offset=15)
		frappe.call("frappe.client.delete", doctype="Adda Event", name=own_event_api.name)
		self.assertFalse(frappe.db.exists("Adda Event", own_event_api.name))

	def test_05_coordinator_deletes_another_users_event_denied(self):
		"""5. Coordinator deletes another user's event: Denied"""
		other_event = self._create_event("Coord Perm Test Delete Other Denied", self.coord2_email, days_offset=16)

		frappe.set_user(self.coord1_email)
		has_delete = frappe.has_permission("Adda Event", "delete", doc=other_event)
		self.assertFalse(has_delete)

		# Direct delete_doc should raise PermissionError
		with self.assertRaises(frappe.PermissionError):
			frappe.delete_doc("Adda Event", other_event.name)

		# Client API deletion should also raise PermissionError
		with self.assertRaises(frappe.PermissionError):
			frappe.call("frappe.client.delete", doctype="Adda Event", name=other_event.name)

		self.assertTrue(frappe.db.exists("Adda Event", other_event.name))

	def test_06_coordinator_uploads_event_image_allowed(self):
		"""6. Coordinator uploads event image: Allowed via File doctype"""
		own_event = self._create_event("Coord Perm Test Upload Image", self.coord1_email, days_offset=17)

		frappe.set_user(self.coord1_email)
		# File upload linked to the event
		file_doc = frappe.get_doc({
			"doctype": "File",
			"file_name": "test_event_poster.png",
			"attached_to_doctype": "Adda Event",
			"attached_to_name": own_event.name,
			"content": "fake image content data",
			"is_private": 0,
		}).insert()

		self.assertTrue(file_doc.name)
		self.assertEqual(file_doc.attached_to_name, own_event.name)

		# Clean up file
		frappe.set_user("Administrator")
		frappe.delete_doc("File", file_doc.name, force=True, ignore_permissions=True)

	def test_07_coordinator_edits_adda_room_denied(self):
		"""7. Coordinator edits Adda Room: Denied"""
		frappe.set_user(self.coord1_email)
		room = frappe.get_doc("Adda Room", "Permission Test Room")
		room.description = "Unauthorized edit attempt by coordinator"

		with self.assertRaises(frappe.PermissionError):
			room.save()

	def test_08_coordinator_deletes_adda_room_denied(self):
		"""8. Coordinator deletes Adda Room: Denied"""
		frappe.set_user(self.coord1_email)
		with self.assertRaises(frappe.PermissionError):
			frappe.delete_doc("Adda Room", "Permission Test Room")

	def test_09_regular_user_permissions_unchanged(self):
		"""9. Regular user permissions: Unchanged (cannot create, edit, or delete events)"""
		other_event = self._create_event("Coord Perm Test Regular User", self.coord1_email, days_offset=18)

		frappe.set_user(self.regular_email)
		# Cannot create event
		now = now_datetime()
		unauth_event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Unauth Event",
			"type": "Adda",
			"description": "Should fail.",
			"start_date_time": add_to_date(now, days=19, hours=10),
			"end_date_time": add_to_date(now, days=19, hours=12),
			"city": "Bengaluru",
		})
		with self.assertRaises(frappe.PermissionError):
			unauth_event.insert()

		# Cannot edit event
		doc = frappe.get_doc("Adda Event", other_event.name)
		doc.description = "Malicious update by regular user"
		with self.assertRaises(frappe.PermissionError):
			doc.save()

		# Cannot delete event
		with self.assertRaises(frappe.PermissionError):
			frappe.delete_doc("Adda Event", other_event.name)
