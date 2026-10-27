import re
import frappe


def get_context(context):
	"""
	Context preprocessor for event details and participant registration.

	If the routed identifier is a date (YYYY-MM-DD / DD-MM-YYYY) or hosting keyword
	('host', 'new', 'create'), redirect to the hosting workflow on the calendar
	with that date prefilled instead of rendering the participant registration form.
	"""
	event_id = frappe.form_dict.get("event_id")
	if event_id:
		event_id_str = str(event_id).strip()
		if event_id_str.lower() in ("host", "new", "create"):
			frappe.local.flags.redirect_location = "/events?open_host=1"
			raise frappe.Redirect
		if re.match(r"^\d{4}-\d{2}-\d{2}$", event_id_str) or re.match(r"^\d{2}-\d{2}-\d{4}$", event_id_str):
			frappe.local.flags.redirect_location = f"/events?date={event_id_str}&open_host=1"
			raise frappe.Redirect

