# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from adda_space.setup import setup_adda_space


def execute():
	"""Setup Room Coordinator role, migrate existing users, and sync permissions into DocPerm and Custom DocPerm."""
	setup_adda_space()
