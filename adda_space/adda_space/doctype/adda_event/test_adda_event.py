# Copyright (c) 2026, reap_benefit and Contributors
# See license.txt

import datetime
import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, now_datetime
from adda_space.api.events import get_adda_events, register_adda_event, get_adda_room_availability


class TestAddaEvent(IntegrationTestCase):
	def setUp(self):
		if not frappe.db.exists("Adda City", "Bengaluru"):
			frappe.get_doc({
				"doctype": "Adda City",
				"city_name": "Bengaluru",
				"is_active": 1,
			}).insert(ignore_permissions=True)

		if not frappe.db.exists("Adda Room", "Test Event Room"):
			frappe.get_doc({
				"doctype": "Adda Room",
				"room_name": "Test Event Room",
				"city": "Bengaluru",
				"capacity": 50,
			}).insert(ignore_permissions=True)

	def tearDown(self):
		# Clean up any test events
		events = frappe.get_all(
			"Adda Event",
			filters={"title": ["like", "Test Event%"]},
			pluck="name",
		)
		for ev in events:
			frappe.delete_doc("Adda Event", ev, force=True, ignore_permissions=True)

	def test_create_valid_event(self):
		now = now_datetime()
		start = add_to_date(now, days=2)
		end = add_to_date(now, days=2, hours=2)

		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event 1",
			"type": "Adda",
			"description": "A community gathering for solvers.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"mode": "Offline",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		self.assertTrue(event.name)
		self.assertTrue(event.unique_id)
		self.assertEqual(event.approval_status, "Approved")

	def test_invalid_dates_rejected(self):
		now = now_datetime()
		# Start after End
		start = add_to_date(now, days=2, hours=2)
		end = add_to_date(now, days=2)

		event = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Invalid Dates",
			"type": "Adda",
			"description": "Invalid date test.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
		})
		with self.assertRaises(frappe.ValidationError):
			event.insert(ignore_permissions=True)

	def test_room_clash_prevented(self):
		now = now_datetime()
		start1 = add_to_date(now, days=5, hours=10)
		end1 = add_to_date(now, days=5, hours=12)

		frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Booking 1",
			"type": "Adda",
			"description": "Room booking 1",
			"start_date_time": start1,
			"end_date_time": end1,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		# Overlapping time booking in the same room
		start2 = add_to_date(now, days=5, hours=11)
		end2 = add_to_date(now, days=5, hours=13)

		clashing = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Booking 2 Clashing",
			"type": "Adda",
			"description": "Room booking clash",
			"start_date_time": start2,
			"end_date_time": end2,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		})
		with self.assertRaises(frappe.ValidationError):
			clashing.insert(ignore_permissions=True)

	def test_unapproved_request_does_not_block_desk_event(self):
		now = now_datetime()
		start = add_to_date(now, days=6, hours=10)
		end = add_to_date(now, days=6, hours=12)

		# Create an unapproved proposal in Adda Event Request
		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Test Event Proposal Unapproved",
			"event_type": "Adda",
			"description": "Pending proposal",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"status": "Pending Review",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"people_expected": 20,
		}).insert(ignore_permissions=True)

		try:
			# Creating an Adda Event via Desk for the same slot must SUCCEED
			# Unapproved request must not lock the room
			desk_event = frappe.get_doc({
				"doctype": "Adda Event",
				"title": "Test Event Created From Desk",
				"type": "Adda",
				"description": "Created from Desk while request is pending.",
				"start_date_time": start,
				"end_date_time": end,
				"city": "Bengaluru",
				"room_name": "Test Event Room",
				"cover_image": "/assets/adda_space/images/adda_space_logo.png",
				"approval_status": "Approved",
			}).insert(ignore_permissions=True)
			self.assertTrue(desk_event.name)
		finally:
			frappe.delete_doc("Adda Event Request", req.name, force=True, ignore_permissions=True)

	def test_approved_request_creates_event_and_blocks_desk_event(self):
		now = now_datetime()
		start = add_to_date(now, days=7, hours=10)
		end = add_to_date(now, days=7, hours=12)

		frappe.set_user("Administrator")
		req = frappe.get_doc({
			"doctype": "Adda Event Request",
			"title": "Test Event Proposal To Approve",
			"event_type": "Adda",
			"description": "Proposal being approved",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"status": "Pending Review",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"people_expected": 20,
		}).insert(ignore_permissions=True)

		try:
			# Approve proposal -> creates an Adda Event
			req.approve()
			self.assertEqual(req.status, "Approved")
			self.assertTrue(req.event)

			# Now creating an overlapping Adda Event from Desk must be BLOCKED
			clash = frappe.get_doc({
				"doctype": "Adda Event",
				"title": "Test Event Desk Clash",
				"type": "Adda",
				"description": "Should clash with approved request.",
				"start_date_time": start,
				"end_date_time": end,
				"city": "Bengaluru",
				"room_name": "Test Event Room",
				"cover_image": "/assets/adda_space/images/adda_space_logo.png",
				"approval_status": "Approved",
			})
			with self.assertRaises(frappe.ValidationError):
				clash.insert(ignore_permissions=True)
		finally:
			if req.event and frappe.db.exists("Adda Event", req.event):
				frappe.delete_doc("Adda Event", req.event, force=True, ignore_permissions=True)
			frappe.delete_doc("Adda Event Request", req.name, force=True, ignore_permissions=True)

	def test_exact_boundary_desk_events(self):
		now = now_datetime()
		start1 = add_to_date(now, days=8, hours=10)
		end1 = add_to_date(now, days=8, hours=12)
		start2 = add_to_date(now, days=8, hours=12)
		end2 = add_to_date(now, days=8, hours=14)

		ev1 = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Boundary 1",
			"type": "Adda",
			"description": "10 to 12 slot",
			"start_date_time": start1,
			"end_date_time": end1,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		# Exact boundary: 12:00 to 14:00 must succeed
		ev2 = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Boundary 2",
			"type": "Adda",
			"description": "12 to 14 slot",
			"start_date_time": start2,
			"end_date_time": end2,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		self.assertTrue(ev1.name)
		self.assertTrue(ev2.name)

	def test_desk_save_draft_and_submit_lifecycle(self):
		now = now_datetime()
		start = add_to_date(now, days=14, hours=10)
		end = add_to_date(now, days=14, hours=12)

		# 1. Create event through Desk (defaults to Pending Review)
		ev = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Desk Lifecycle",
			"type": "Adda",
			"description": "Desk event created for review.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Pending Review",
		}).insert(ignore_permissions=True)

		# Verify approval_status is Pending Review and record reference ID
		self.assertEqual(ev.approval_status, "Pending Review")
		initial_ref_id = ev.name
		self.assertTrue(initial_ref_id)

		# Pending events must NOT appear on public calendar without include_pending
		cal_before = get_adda_events(time_scope="upcoming")
		self.assertNotIn(initial_ref_id, [e["name"] for e in cal_before.get("events", [])])

		# 2. Approve the event
		ev.approve()
		ev.reload()

		# Verify reference ID has NOT changed
		self.assertEqual(ev.name, initial_ref_id)

		# Verify approval_status transitions to Approved
		self.assertEqual(ev.approval_status, "Approved")

		# Check Adda Space calendar and confirm event appears
		cal_after = get_adda_events(time_scope="upcoming")
		event_names_after = [e["name"] for e in cal_after.get("events", [])]
		self.assertIn(initial_ref_id, event_names_after)

	def test_desk_status_persists_on_subsequent_saves(self):
		now = now_datetime()
		start = add_to_date(now, days=15, hours=10)
		end = add_to_date(now, days=15, hours=12)

		ev = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Persist Status",
			"type": "Adda",
			"description": "Initial text.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		self.assertEqual(ev.approval_status, "Approved")

		# Modifying and saving must NOT change approval_status
		ev.description = "Updated text."
		ev.save(ignore_permissions=True)
		ev.reload()

		self.assertEqual(ev.approval_status, "Approved")
		self.assertEqual(ev.description, "Updated text.")

	def test_room_booking_collision_and_registration(self):
		start = "2026-11-14 10:00:00"
		end = "2026-11-14 12:00:00"

		# 1. Create an approved event in room
		ev = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Booked Room",
			"type": "Adda",
			"description": "Room booking test.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		}).insert(ignore_permissions=True)

		# 2. Verify room availability detects room as booked
		avail = get_adda_room_availability(
			date=str(start)[:10],
			city="Bengaluru",
			room_name="Test Event Room",
			start_time="10:00",
			end_time="12:00",
		)
		self.assertFalse(avail.get("is_available"))
		self.assertIsNotNone(avail.get("collision"))

		# 3. Verify double-booking is rejected by controller
		clashing = frappe.get_doc({
			"doctype": "Adda Event",
			"title": "Test Event Double Booking",
			"type": "Adda",
			"description": "Attempted clash.",
			"start_date_time": start,
			"end_date_time": end,
			"city": "Bengaluru",
			"room_name": "Test Event Room",
			"cover_image": "/assets/adda_space/images/adda_space_logo.png",
			"approval_status": "Approved",
		})
		with self.assertRaises(frappe.ValidationError):
			clashing.insert(ignore_permissions=True)

		# 4. Check event registration works for the newly created event
		reg = register_adda_event(
			event=ev.name,
			full_name="Test Registrant One",
			mobile="9876543210",
		)
		self.assertTrue(reg.get("success"))
		self.assertEqual(reg.get("status"), "Registered")

