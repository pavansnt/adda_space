# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import io
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import get_datetime


def is_adda_admin(user=None) -> bool:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return False
	roles = frappe.get_roles(user)
	return "System Manager" in roles or "Adda Space Admin" in roles or user == "Administrator"


class AddaEvent(Document):
	def validate(self):
		if not self.approval_status:
			self.approval_status = "Pending Review"
		self.validate_dates()
		self.validate_room_clash()
		self.handle_unique_id()
		self.update_checkin_url()
		self.handle_qr_code()
		self.sync_image_fields()

	def validate_dates(self):
		if not self.start_date_time or not self.end_date_time:
			frappe.throw(_("Both Start Date Time and End Date Time are mandatory."))

		start_dt = get_datetime(self.start_date_time).replace(microsecond=0)
		end_dt = get_datetime(self.end_date_time).replace(microsecond=0)

		if start_dt >= end_dt:
			frappe.throw(_("Start Date Time must be strictly before End Date Time."))

		self.start_date_time = start_dt
		self.end_date_time = end_dt

	def validate_room_clash(self):
		if not self.room_name:
			return
		if self.get("approval_status") not in ("Approved", "Pending Review"):
			return

		start = str(self.start_date_time)[:19]
		end = str(self.end_date_time)[:19]

		# Check against other authoritative Adda Event records using interval overlap:
		# existing_start < requested_end AND existing_end > requested_start
		clashes = frappe.get_all(
			"Adda Event",
			filters={
				"name": ["!=", self.name or ""],
				"room_name": self.room_name,
				"approval_status": "Approved",
				"start_date_time": ["<", end],
				"end_date_time": [">", start],
			},
			fields=["name", "title"],
			limit=1,
		)
		if clashes:
			clash = clashes[0]
			frappe.throw(
				_("Room '{0}' is already booked for this time ({1}). Pick another room or time.").format(
					self.room_name, clash.get("title") or clash.get("name")
				)
			)

	def handle_unique_id(self):
		doc_before_save = self.get_doc_before_save()
		should_regenerate = False
		if doc_before_save:
			for field in ("type", "city", "start_date_time"):
				if doc_before_save.get(field) != self.get(field):
					should_regenerate = True
					break

		if not self.unique_id or should_regenerate:
			self.generate_unique_id()

	def subtype_code(self, val):
		v = str(val or "").strip().lower()
		if "jam" in v:
			return "SJ"
		if "con" in v:
			return "SC"
		if "adda" in v:
			return "ADD"
		return "EVT"

	def city_two_letters(self, val):
		text = str(val or "")
		letters = "".join([c for c in text if c.isalpha()]).upper()
		if len(letters) >= 2:
			return letters[:2]
		if len(letters) == 1:
			return letters + "X"
		return "XX"

	def generate_unique_id(self):
		try:
			code = self.subtype_code(self.type)
			city_code = self.city_two_letters(self.city)
			dt = get_datetime(self.start_date_time)
			date_str = dt.strftime("%d%m%Y")
			base = f"{code}{city_code}{date_str}"

			candidate = base
			i = 2
			while True:
				exists = frappe.db.exists("Adda Event", {"unique_id": candidate, "name": ["!=", self.name or ""]})
				if not exists:
					self.unique_id = candidate
					break
				candidate = f"{base}-{i}"
				i += 1
		except Exception as e:
			frappe.log_error(f"Error generating unique_id: {e}", "Adda Event ID Gen")

	def update_checkin_url(self):
		if not self.unique_id:
			return
		try:
			base_url = None
			if frappe.db.table_exists("Adda Space Settings"):
				base_url = frappe.db.get_single_value("Adda Space Settings", "checkin_base_url")
			if not base_url:
				return
			sep = "&" if "?" in base_url else "?"
			self.checkin_url = f"{base_url}{sep}text={self.unique_id}"
		except Exception:
			pass

	def handle_qr_code(self):
		if not self.checkin_url:
			return
		doc_before_save = self.get_doc_before_save()
		old_url = doc_before_save.get("checkin_url") if doc_before_save else None
		if (not self.checkin_qr) or (old_url != self.checkin_url):
			self.generate_qr_code(self.checkin_url)

	def generate_qr_code(self, url):
		try:
			from pyqrcode import create as qrcreate
			from frappe.utils.file_manager import save_file

			doc_name = self.name or frappe.generate_hash(length=10)
			file_name = f"qr_{doc_name}.png"

			qr = qrcreate(url)
			buf = io.BytesIO()
			qr.png(buf, scale=8, module_color=[0, 0, 0, 180], background=[0xFF, 0xFF, 0xFF])
			buf.seek(0)
			file_content = buf.read()

			if self.checkin_qr:
				old_file = frappe.db.get_value("File", {"file_url": self.checkin_qr}, "name")
				if old_file:
					try:
						frappe.delete_doc("File", old_file, ignore_permissions=True, force=True)
					except Exception:
						pass

			file_doc = save_file(
				fname=file_name,
				content=file_content,
				dt=self.doctype,
				dn=doc_name,
				folder=None,
				is_private=0,
				df="checkin_qr",
			)
			self.checkin_qr = file_doc.file_url
		except Exception as e:
			frappe.log_error(f"Error generating QR code: {e}", "Adda Event QR Code")

	def sync_image_fields(self):
		if self.cover_image and not self.image:
			self.image = self.cover_image
		elif self.image and not self.cover_image:
			self.cover_image = self.image

	@frappe.whitelist()
	def submit(self):
		"""Ensure event is Pending Review (or Approved for Admins)."""
		if is_adda_admin():
			self.approval_status = "Approved"
		else:
			self.approval_status = "Pending Review"
		self.save()
		return self

	@frappe.whitelist()
	def submit_event(self):
		return self.submit()

	@frappe.whitelist()
	def approve(self):
		"""Admin action to approve event and publish it to the calendar."""
		if not is_adda_admin():
			frappe.throw(_("Only Adda Space administrators can approve events."), frappe.PermissionError)
		self.approval_status = "Approved"
		self.save()
		return self

	@frappe.whitelist()
	def approve_event(self):
		return self.approve()

	@frappe.whitelist()
	def reject(self, reason=None):
		"""Admin action to reject event."""
		if not is_adda_admin():
			frappe.throw(_("Only Adda Space administrators can reject events."), frappe.PermissionError)
		self.approval_status = "Rejected"
		self.save()
		return self

	@frappe.whitelist()
	def reject_event(self, reason=None):
		return self.reject(reason=reason)
