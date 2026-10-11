# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

from typing import Any, Dict, List, Optional, Union
import frappe
from frappe import _
from frappe.utils import get_url, now_datetime

EVENT_TYPE = "Adda"
APPROVAL_STATUS = "Approved"

PUBLIC_EVENT_FIELDS = [
	"name",
	"unique_id",
	"title",
	"description",
	"start_date_time",
	"end_date_time",
	"city",
	"venue_details",
	"room_name",
	"mode",
	"cover_image",
]


def fetch_supported_cities() -> List[str]:
	"""
	Retrieve all supported cities dynamically from the existing 'Samaaja Cities' master data.
	Falls back gracefully to approved Adda event cities or default list if master is inaccessible.
	"""
	try:
		cities = frappe.get_all("Samaaja Cities", pluck="name", order_by="name asc")
		if cities:
			cleaned = [str(c).strip() for c in cities if str(c).strip()]
			if cleaned:
				return cleaned
	except Exception:
		pass

	try:
		cities = frappe.db.get_all(
			"Solve Event",
			filters={"type": EVENT_TYPE, "approval_status": APPROVAL_STATUS},
			pluck="city",
			distinct=True,
		)
		if cities:
			cleaned = sorted([str(c).strip() for c in cities if str(c).strip()])
			if cleaned:
				return cleaned
	except Exception:
		pass

	return ["Bengaluru", "Mysuru"]


def _format_event_payload(event: Dict[str, Any]) -> Dict[str, Any]:
	"""Format and sanitize event dictionary for public consumption."""
	if not event:
		return {}

	cover_image = event.get("cover_image")
	if cover_image is None or not str(cover_image).strip():
		event["cover_image"] = None
	else:
		cover_str = str(cover_image).strip()
		# Do not prepend base URL to URLs that are already absolute or protocol-relative
		if not cover_str.startswith(("http://", "https://", "//")):
			path = cover_str if cover_str.startswith("/") else f"/{cover_str}"
			base_url = get_url().rstrip("/") if get_url() else ""
			event["cover_image"] = f"{base_url}{path}"
		else:
			event["cover_image"] = cover_str

	return event


@frappe.whitelist(allow_guest=True)
def get_supported_cities() -> Dict[str, Any]:
	"""
	Return the dynamic list of supported cities for Adda Space events from Samaaja Cities.
	"""
	cities = fetch_supported_cities()
	return {
		"success": True,
		"cities": cities,
	}


@frappe.whitelist(allow_guest=True)
def get_adda_events(
	city: Optional[str] = None,
	time_scope: str = "upcoming",
	start_date: Optional[str] = None,
	end_date: Optional[str] = None,
	start: Union[int, str] = 0,
	page_length: Union[int, str] = 20,
) -> Dict[str, Any]:
	"""
	Retrieve approved Adda events across all supported cities or for a specified city,
	with pagination and time scope grouping or custom date range (for calendar view).

	Args:
		city: Optional city name (case-insensitive, matched against Samaaja Cities).
		      If omitted or empty, events across all supported cities are returned.
		time_scope: "upcoming" (start_date_time >= now) or "past" (start_date_time < now).
		            Only used when start_date and end_date are omitted.
		start_date: Optional start date string (YYYY-MM-DD) for range queries.
		end_date: Optional end date string (YYYY-MM-DD) for range queries.
		start: Offset index for pagination (0-indexed integer >= 0).
		page_length: Number of events per page (integer between 1 and 100).

	Returns:
		Dict containing events list, pagination metadata, and applied filters.
	"""
	# 1. Validate time_scope
	if time_scope is None or not str(time_scope).strip():
		time_scope_clean = "upcoming"
	else:
		time_scope_clean = str(time_scope).strip().lower()
		if time_scope_clean not in ("upcoming", "past"):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'time_scope' parameter '{0}'. Must be 'upcoming' or 'past'.").format(time_scope),
				"events": [],
				"pagination": None,
				"filters": None,
			}

	# 2. Validate start parameter
	if start is None or start == "":
		parsed_start = 0
	else:
		if isinstance(start, bool):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'start' parameter '{0}'. Must be an integer >= 0.").format(start),
				"events": [],
				"pagination": None,
				"filters": None,
			}
		try:
			if isinstance(start, str):
				parsed_start = int(start.strip())
			elif isinstance(start, int):
				parsed_start = start
			else:
				raise ValueError()
		except (ValueError, TypeError):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'start' parameter '{0}'. Must be an integer >= 0.").format(start),
				"events": [],
				"pagination": None,
				"filters": None,
			}

		if parsed_start < 0:
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'start' parameter '{0}'. Must be an integer >= 0.").format(start),
				"events": [],
				"pagination": None,
				"filters": None,
			}

	# 3. Validate page_length parameter
	if page_length is None or page_length == "":
		parsed_page_length = 20
	else:
		if isinstance(page_length, bool):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'page_length' parameter '{0}'. Must be an integer between 1 and 100.").format(page_length),
				"events": [],
				"pagination": None,
				"filters": None,
			}
		try:
			if isinstance(page_length, str):
				parsed_page_length = int(page_length.strip())
			elif isinstance(page_length, int):
				parsed_page_length = page_length
			else:
				raise ValueError()
		except (ValueError, TypeError):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'page_length' parameter '{0}'. Must be an integer between 1 and 100.").format(page_length),
				"events": [],
				"pagination": None,
				"filters": None,
			}

		if parsed_page_length < 1 or parsed_page_length > 100:
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'page_length' parameter '{0}'. Must be an integer between 1 and 100.").format(page_length),
				"events": [],
				"pagination": None,
				"filters": None,
			}

	# Base filters enforcing Adda event type and Approved status
	filters: Dict[str, Any] = {
		"type": EVENT_TYPE,
		"approval_status": APPROVAL_STATUS,
	}

	# 4. Dynamic city handling from Samaaja Cities master
	supported_cities = fetch_supported_cities()
	city_clean = None
	if city is not None and str(city).strip():
		city_input = str(city).strip()
		city_map = {c.lower(): c for c in supported_cities}
		matched_city = city_map.get(city_input.lower())
		if not matched_city:
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'city' parameter '{0}'. Supported cities are: {1}.").format(
					city, ", ".join(supported_cities)
				),
				"events": [],
				"pagination": None,
				"filters": None,
			}
		city_clean = matched_city
		filters["city"] = city_clean
	else:
		# If city omitted, filter by all supported cities if list exists
		if supported_cities:
			filters["city"] = ["in", supported_cities]

	# 5. Date range handling (takes precedence over time_scope when either is specified)
	clean_start_date = None
	clean_end_date = None
	if start_date is not None and str(start_date).strip():
		s_str = str(start_date).strip()
		try:
			from datetime import datetime
			datetime.strptime(s_str, "%Y-%m-%d")
			clean_start_date = s_str
		except (ValueError, TypeError):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'start_date' parameter '{0}'. Expected format YYYY-MM-DD.").format(start_date),
				"events": [],
				"pagination": None,
				"filters": None,
			}

	if end_date is not None and str(end_date).strip():
		e_str = str(end_date).strip()
		try:
			from datetime import datetime
			datetime.strptime(e_str, "%Y-%m-%d")
			clean_end_date = e_str
		except (ValueError, TypeError):
			if hasattr(frappe, "response"):
				frappe.response["http_status_code"] = 400
			return {
				"success": False,
				"error": _("Invalid 'end_date' parameter '{0}'. Expected format YYYY-MM-DD.").format(end_date),
				"events": [],
				"pagination": None,
				"filters": None,
			}

	if clean_start_date and clean_end_date and clean_start_date > clean_end_date:
		if hasattr(frappe, "response"):
			frappe.response["http_status_code"] = 400
		return {
			"success": False,
			"error": _("Invalid date range: start_date '{0}' cannot be after end_date '{1}'.").format(
				clean_start_date, clean_end_date
			),
			"events": [],
			"pagination": None,
			"filters": None,
		}

	if clean_start_date and clean_end_date:
		filters["start_date_time"] = ["between", [f"{clean_start_date} 00:00:00", f"{clean_end_date} 23:59:59"]]
		order_by = "start_date_time asc"
	elif clean_start_date:
		filters["start_date_time"] = [">=", f"{clean_start_date} 00:00:00"]
		order_by = "start_date_time asc"
	elif clean_end_date:
		filters["start_date_time"] = ["<=", f"{clean_end_date} 23:59:59"]
		order_by = "start_date_time asc"
	else:
		# Time scope grouping based strictly on event start date time
		now = now_datetime()
		if time_scope_clean == "past":
			filters["start_date_time"] = ["<", now]
			order_by = "start_date_time desc"
		else:
			filters["start_date_time"] = [">=", now]
			order_by = "start_date_time asc"

	# Get total matching count
	total_count = frappe.db.count("Solve Event", filters=filters)

	# Fetch public event rows
	events: List[Dict[str, Any]] = frappe.get_all(
		"Solve Event",
		filters=filters,
		fields=PUBLIC_EVENT_FIELDS,
		start=parsed_start,
		page_length=parsed_page_length,
		order_by=order_by,
	)

	formatted_events = [_format_event_payload(ev) for ev in events]

	return {
		"success": True,
		"events": formatted_events,
		"pagination": {
			"total_count": total_count,
			"start": parsed_start,
			"page_length": parsed_page_length,
			"has_next": (parsed_start + parsed_page_length) < total_count,
			"has_prev": parsed_start > 0,
		},
		"filters": {
			"city": city_clean,
			"time_scope": time_scope_clean if not (clean_start_date or clean_end_date) else None,
			"start_date": clean_start_date,
			"end_date": clean_end_date,
			"supported_cities": supported_cities,
		},
	}


@frappe.whitelist(allow_guest=True)
def get_adda_event_detail(event_id: str) -> Dict[str, Any]:
	"""
	Retrieve public details for a single approved Adda event using either its
	document name (e.g. 10-character hash) or unique_id (e.g. ADDA-BLR-12102026).

	Args:
		event_id: Document name or unique_id string.

	Returns:
		Dict containing event object on success, or 404 error details if not found.
	"""
	if not event_id or not str(event_id).strip():
		if hasattr(frappe, "response"):
			frappe.response["http_status_code"] = 400
		return {
			"success": False,
			"error": _("Event ID is required."),
			"event": None,
		}

	event_id_clean = str(event_id).strip()
	supported_cities = fetch_supported_cities()

	base_filters: Dict[str, Any] = {
		"type": EVENT_TYPE,
		"approval_status": APPROVAL_STATUS,
	}
	if supported_cities:
		base_filters["city"] = ["in", supported_cities]

	# 1. Attempt match by document name
	event = frappe.db.get_value(
		"Solve Event",
		{"name": event_id_clean, **base_filters},
		PUBLIC_EVENT_FIELDS,
		as_dict=True,
	)

	# 2. If not found, attempt match by unique_id (exact or uppercase)
	if not event:
		event = frappe.db.get_value(
			"Solve Event",
			{"unique_id": event_id_clean, **base_filters},
			PUBLIC_EVENT_FIELDS,
			as_dict=True,
		)

	if not event and event_id_clean.upper() != event_id_clean:
		event = frappe.db.get_value(
			"Solve Event",
			{"unique_id": event_id_clean.upper(), **base_filters},
			PUBLIC_EVENT_FIELDS,
			as_dict=True,
		)

	if not event:
		if hasattr(frappe, "response"):
			frappe.response["http_status_code"] = 404
		return {
			"success": False,
			"error": _("Event '{0}' not found or is not an approved Adda Space event.").format(
				event_id_clean
			),
			"event": None,
		}

	return {
		"success": True,
		"event": _format_event_payload(event),
	}


@frappe.whitelist(allow_guest=True)
def register_adda_event(solve_event=None, mobile=None, full_name=None, **kwargs) -> Dict[str, Any]:
	"""
	Safe Adda Space registration wrapper around solve_ninja.api.solve_event_registration.
	Deterministically checks whether an active registration exists before
	calling the registration backend, resolving the timestamp heuristic limitation.
	Does not modify solve_ninja.
	"""
	from solve_ninja.api.solve_event_registration import register_solve_event
	from solve_ninja.api.event_registration_utils import (
		find_existing_registration,
		resolve_solve_event_name,
	)
	from solve_ninja.utils import find_user_by_mobile

	# Parse request body if JSON passed via fetch
	if frappe.request and getattr(frappe.request, "data", None):
		try:
			import json
			parsed = json.loads(frappe.request.data)
			if isinstance(parsed, dict):
				solve_event = solve_event or parsed.get("solve_event")
				mobile = mobile or parsed.get("mobile")
				full_name = full_name or parsed.get("full_name") or parsed.get("whatsapp_name")
		except Exception:
			pass

	event_name = resolve_solve_event_name(solve_event)
	user_name = None
	if mobile:
		digits = "".join(filter(str.isdigit, str(mobile)))
		if len(digits) >= 10:
			u, *_ = find_user_by_mobile(digits)
			user_name = u

	was_existing = False
	existing_reg_name = None
	if user_name and event_name:
		existing_reg_name = find_existing_registration(user_name, event_name)
		if existing_reg_name:
			was_existing = True

	# Delegate to existing solve_ninja backend
	doc = register_solve_event(solve_event=solve_event, mobile=mobile, full_name=full_name, **kwargs)

	status = (doc.get("status") or "").strip()
	is_rejected = status == "Rejected"
	reason = (doc.get("reason") or "").lower()
	is_duplicate_rejected = is_rejected and ("duplicate" in reason or "already registered" in reason)

	is_duplicate = was_existing or is_duplicate_rejected or doc.get("already_registered") is True
	is_new = not was_existing and not is_rejected

	return {
		"success": True,
		"doc": doc,
		"is_new": is_new,
		"already_registered": is_duplicate,
		"registration_name": doc.get("name") or existing_reg_name,
		"status": status,
		"reason": doc.get("reason"),
	}


@frappe.whitelist()
def get_backend_health() -> Dict[str, Any]:
	"""
	Developer-facing backend health check.
	Distinguishes database status, event counts, and Glific configuration status.
	Does not expose tokens, credentials, or sensitive secrets.
	"""
	status = {
		"web_server": "running",
		"database": "unknown",
		"solve_events": 0,
		"approved_adda_events": 0,
		"supported_cities": [],
		"glific_integration": "unverified",
	}

	try:
		frappe.db.sql("SELECT 1")
		status["database"] = "connected"
	except Exception as e:
		status["database"] = f"disconnected: {e}"

	if status["database"] == "connected":
		try:
			status["solve_events"] = frappe.db.count("Solve Event")
			status["approved_adda_events"] = frappe.db.count(
				"Solve Event",
				filters={"type": EVENT_TYPE, "approval_status": APPROVAL_STATUS},
			)
			status["supported_cities"] = fetch_supported_cities()
		except Exception as e:
			status["error"] = str(e)

		try:
			settings = frappe.get_single("Solve Ninja Settings")
			if getattr(settings, "channel", None) == "Glific" and getattr(settings, "event_registration_template", None):
				status["glific_integration"] = "configured"
			else:
				status["glific_integration"] = "not_configured"
		except Exception:
			status["glific_integration"] = "unavailable"

	return status
