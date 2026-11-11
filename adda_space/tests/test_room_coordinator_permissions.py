# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime
from adda_space.setup import setup_adda_space


class TestRoomCoordinatorPermissions(IntegrationTestCase):
	@classmethod
	def setUpClass(cls):
		super().setUpClass()
		frappe.set_user("Administrator")

		# Ensure roles and permissions are initialized
		setup_adda_space()

		# Ensure test city exists
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		# Test user accounts
		cls.coord1_email = "test_coord1@example.com"
		cls.coord2_email = "test_coord2@example.com"
		cls.regular_email = "test_regular_user@example.com"

		for email, role in [
			(cls.coord1_email, "Room Coordinator"),
			(cls.coord2_email, "Room Coordinator"),
			(cls.regular_email, None),
		]:
			frappe.db.sql("""
				INSERT INTO "tabUser" (name, email, first_name, enabled, creation, modified, modified_by, owner, docstatus)
				VALUES (%s, %s, %s, 1, NOW(), NOW(), 'Administrator', 'Administrator', 0)
				ON CONFLICT (name) DO NOTHING
			""", (email, email, email.split("@")[0]))

			# Clear existing roles for this user
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

		# Room 1: Assigned to coord1
		cls.room1_name = "Room Coord Assigned Room"
		if frappe.db.exists("Adda Room", cls.room1_name):
			frappe.delete_doc("Adda Room", cls.room1_name, force=True, ignore_permissions=True)
		frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": cls.room1_name,
			"city": "Bengaluru",
			"coordinator": cls.coord1_email,
			"capacity": 25,
			"opening_time": "09:00:00",
			"closing_time": "21:00:00",
			"is_active": 1,
		}).insert(ignore_permissions=True)

		# Room 2: Assigned to coord2
		cls.room2_name = "Room Coord Other Room"
		if frappe.db.exists("Adda Room", cls.room2_name):
			frappe.delete_doc("Adda Room", cls.room2_name, force=True, ignore_permissions=True)
		frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": cls.room2_name,
			"city": "Bengaluru",
			"coordinator": cls.coord2_email,
			"capacity": 40,
			"opening_time": "08:00:00",
			"closing_time": "20:00:00",
			"is_active": 1,
		}).insert(ignore_permissions=True)

	def setUp(self):
		frappe.set_user("Administrator")

	def tearDown(self):
		frappe.set_user("Administrator")
		# Clean up any test events created during tests
		events = frappe.get_all(
			"Adda Event",
			filters={"title": ["like", "Room Coord Perm Test%"]},
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
			"room_name": self.room1_name,
			"mode": "Offline",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Pending Review",
		})
		event.insert(ignore_permissions=True)
		frappe.set_user(prev_user)
		return event

	# --- Event Permissions Tests ---

	def test_01_coordinator_creates_event_allowed(self):
		"""1. Room Coordinator creates event: Allowed"""
		frappe.set_user(self.coord1_email)
		now = now_datetime()
		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Room Coord Perm Test Create Own",
			"type": "Adda",
			"description": "Created by coordinator.",
			"start_date_time": add_to_date(now, days=11, hours=10),
			"end_date_time": add_to_date(now, days=11, hours=12),
			"city": "Bengaluru",
			"room_name": self.room1_name,
			"mode": "Offline",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
		})
		event.insert()
		self.assertTrue(event.name)
		self.assertEqual(event.owner, self.coord1_email)

	def test_02_coordinator_views_another_users_event_allowed(self):
		"""2. Room Coordinator views another user's event: Allowed"""
		other_event = self._create_event("Room Coord Perm Test View Other", self.coord2_email, days_offset=12)

		frappe.set_user(self.coord1_email)
		has_read = frappe.has_permission("Adda Event", "read", doc=other_event)
		self.assertTrue(has_read)

		doc = frappe.get_doc("Adda Event", other_event.name)
		self.assertEqual(doc.title, "Room Coord Perm Test View Other")

	def test_03_coordinator_edits_another_users_event_allowed(self):
		"""3. Room Coordinator edits another user's event: Allowed"""
		other_event = self._create_event("Room Coord Perm Test Edit Other", self.coord2_email, days_offset=13)

		frappe.set_user(self.coord1_email)
		has_write = frappe.has_permission("Adda Event", "write", doc=other_event)
		self.assertTrue(has_write)

		doc = frappe.get_doc("Adda Event", other_event.name)
		doc.description = "Updated description by another coordinator."
		doc.save()

		doc.reload()
		self.assertEqual(doc.description, "Updated description by another coordinator.")

	def test_04_coordinator_deletes_own_event_allowed(self):
		"""4. Room Coordinator deletes own event: Allowed (Desk and API)"""
		own_event = self._create_event("Room Coord Perm Test Delete Own", self.coord1_email, days_offset=14)

		frappe.set_user(self.coord1_email)
		has_delete = frappe.has_permission("Adda Event", "delete", doc=own_event)
		self.assertTrue(has_delete)

		# Direct API deletion
		frappe.delete_doc("Adda Event", own_event.name)
		self.assertFalse(frappe.db.exists("Adda Event", own_event.name))

		# Desk client API deletion
		own_event_api = self._create_event("Room Coord Perm Test Delete Own API", self.coord1_email, days_offset=15)
		frappe.call("frappe.client.delete", doctype="Adda Event", name=own_event_api.name)
		self.assertFalse(frappe.db.exists("Adda Event", own_event_api.name))

	def test_05_coordinator_deletes_another_users_event_denied(self):
		"""5. Room Coordinator deletes another user's event: Denied"""
		other_event = self._create_event("Room Coord Perm Test Delete Other Denied", self.coord2_email, days_offset=16)

		frappe.set_user(self.coord1_email)
		has_delete = frappe.has_permission("Adda Event", "delete", doc=other_event)
		self.assertFalse(has_delete)

		with self.assertRaises(frappe.PermissionError):
			frappe.delete_doc("Adda Event", other_event.name)

		with self.assertRaises(frappe.PermissionError):
			frappe.call("frappe.client.delete", doctype="Adda Event", name=other_event.name)

		self.assertTrue(frappe.db.exists("Adda Event", other_event.name))

	def test_06_coordinator_uploads_event_image_allowed(self):
		"""6. Room Coordinator uploads event image: Allowed via File doctype"""
		own_event = self._create_event("Room Coord Perm Test Upload Image", self.coord1_email, days_offset=17)

		frappe.set_user(self.coord1_email)
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

		frappe.set_user("Administrator")
		frappe.delete_doc("File", file_doc.name, force=True, ignore_permissions=True)

	# --- Room Permissions Tests ---

	def test_07_coordinator_views_any_room_allowed(self):
		"""7. Room Coordinator views any room: Allowed"""
		frappe.set_user(self.coord1_email)
		room1 = frappe.get_doc("Adda Room", self.room1_name)
		room2 = frappe.get_doc("Adda Room", self.room2_name)

		self.assertTrue(frappe.has_permission("Adda Room", "read", doc=room1))
		self.assertTrue(frappe.has_permission("Adda Room", "read", doc=room2))

	def test_08_coordinator_edits_assigned_room_allowed(self):
		"""8. Room Coordinator edits assigned room: Allowed"""
		frappe.set_user(self.coord1_email)
		room = frappe.get_doc("Adda Room", self.room1_name)
		self.assertTrue(frappe.has_permission("Adda Room", "write", doc=room))

		room.description = "Updated description for assigned room."
		room.save()

		room.reload()
		self.assertEqual(room.description, "Updated description for assigned room.")

	def test_09_coordinator_edits_unassigned_room_denied(self):
		"""9. Room Coordinator edits unassigned room: Denied"""
		frappe.set_user(self.coord1_email)
		room2 = frappe.get_doc("Adda Room", self.room2_name)
		self.assertFalse(frappe.has_permission("Adda Room", "write", doc=room2))

		room2.description = "Unauthorized edit attempt on Room 2 by coord1"
		with self.assertRaises(frappe.PermissionError):
			room2.save()

	def test_10_coordinator_cannot_reassign_room_coordinator(self):
		"""10. Room Coordinator cannot reassign room coordinator to another user: Denied"""
		frappe.set_user(self.coord1_email)
		room = frappe.get_doc("Adda Room", self.room1_name)
		room.coordinator = self.coord2_email
		with self.assertRaises(frappe.PermissionError):
			room.save()

	def test_11_coordinator_deletes_room_denied(self):
		"""11. Room Coordinator deletes room: Denied"""
		frappe.set_user(self.coord1_email)
		self.assertFalse(frappe.has_permission("Adda Room", "delete", doc=self.room1_name))
		with self.assertRaises(frappe.PermissionError):
			frappe.delete_doc("Adda Room", self.room1_name)

	def test_12_coordinator_creates_room_denied(self):
		"""12. Room Coordinator creates room: Denied"""
		frappe.set_user(self.coord1_email)
		new_room = frappe.get_doc({
			"doctype": "Adda Room",
			"room_name": "Unauthorized New Room",
			"city": "Bengaluru",
			"opening_time": "09:00:00",
			"closing_time": "21:00:00",
			"is_active": 1,
		})
		with self.assertRaises(frappe.PermissionError):
			new_room.insert()

	def test_13_regular_user_permissions_unchanged(self):
		"""13. Regular user permissions: Unchanged (cannot create, edit, or delete events/rooms)"""
		other_event = self._create_event("Room Coord Perm Test Regular User", self.coord1_email, days_offset=18)

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

		# Cannot edit room
		room = frappe.get_doc("Adda Room", self.room1_name)
		room.description = "Regular user edit attempt"
		with self.assertRaises(frappe.PermissionError):
			room.save()
