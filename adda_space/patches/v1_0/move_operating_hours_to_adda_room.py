# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe


def execute():
	"""
	Safe migration to move operating hours from City Coordinator to Adda Room.
	- Identifies relationship between each coordinator and its Adda Room.
	- Preserves existing configured hours where relationship is unambiguous.
	- Reports records where the correct room cannot be determined.
	- Does not delete existing values before confirming they have been migrated.
	"""
	frappe.reload_doc("adda_space", "doctype", "adda_room")

	if not frappe.db.table_exists("City Coordinator") or not frappe.db.table_exists("Adda Room"):
		return

	coord_cols = frappe.db.get_table_columns("City Coordinator")
	if "opening_time" not in coord_cols or "closing_time" not in coord_cols:
		return

	room_cols = frappe.db.get_table_columns("Adda Room")
	if "opening_time" not in room_cols or "closing_time" not in room_cols:
		return

	coord = frappe.qb.DocType("City Coordinator")
	coordinators = (
		frappe.qb.from_(coord)
		.select(coord.name, coord.coordinator_name, coord.city, coord.opening_time, coord.closing_time)
		.where((coord.is_active == 1) & coord.opening_time.isnotnull() & coord.closing_time.isnotnull())
	).run(as_dict=True)

	coords_by_city = {}
	for c in coordinators:
		city = (c.get("city") or "").strip()
		if city:
			coords_by_city.setdefault(city, []).append(c)

	for city, coords in coords_by_city.items():
		active_rooms = frappe.get_all(
			"Adda Room",
			filters={"city": city, "is_active": 1},
			fields=["name", "room_name", "opening_time", "closing_time"],
		)

		if len(coords) == 1 and len(active_rooms) == 1:
			coord_record = coords[0]
			room = active_rooms[0]

			frappe.db.set_value(
				"Adda Room",
				room["name"],
				{
					"opening_time": coord_record["opening_time"],
					"closing_time": coord_record["closing_time"],
				},
				update_modified=False,
			)
			print(
				f"[Adda Space Migration] Migrated operating hours from coordinator '{coord_record['name']}' to room '{room['name']}' ({coord_record['opening_time']} - {coord_record['closing_time']})"
			)
		elif len(active_rooms) == 0:
			print(
				f"[Adda Space Migration WARNING] City '{city}' has coordinator '{coords[0]['name']}' with hours, but no active room found. Operating hours could not be migrated."
			)
		else:
			room_names = [r["name"] for r in active_rooms]
			coord_names = [c["name"] for c in coords]
			print(
				f"[Adda Space Migration WARNING] Ambiguous relationship in city '{city}': {len(coords)} coordinators ({coord_names}) and {len(active_rooms)} active rooms ({room_names}). Operating hours not automatically migrated."
			)

	frappe.db.commit()

