// Copyright (c) 2026, reap_benefit and contributors
// For license information, please see license.txt

frappe.ui.form.on('City Coordinator', {
	refresh: function(frm) {
		// Desk form setup
	},
	validate: function(frm) {
		if (frm.doc.is_active) {
			if (!frm.doc.opening_time || !frm.doc.closing_time) {
				frappe.msgprint(__('Opening time and closing time are mandatory for an active coordinator.'));
			}
		}
	}
});

