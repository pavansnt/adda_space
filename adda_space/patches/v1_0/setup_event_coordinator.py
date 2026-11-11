# Copyright (c) 2026, reap_benefit and contributors
# For license information, please see license.txt

import frappe
from adda_space.setup import setup_adda_space


def execute():
	"""Setup Event Coordinator role and sync permissions into DocPerm and Custom DocPerm."""
	setup_adda_space()
