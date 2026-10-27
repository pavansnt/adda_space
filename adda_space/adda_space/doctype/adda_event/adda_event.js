// Copyright (c) 2026, reap_benefit and contributors
// For license information, please see license.txt

frappe.ui.form.on('Adda Event', {
	refresh: function(frm) {
		if (!frm.is_new()) {
			var roles = frappe.user_roles || [];
			var is_admin = roles.includes('System Manager') ||
				roles.includes('Adda Space Admin') ||
				frappe.session.user === 'Administrator';

			var cur_status = frm.doc.approval_status || 'Pending Review';

			if (cur_status === 'Pending Review' && is_admin) {
				frm.add_custom_button(__('Approve Event'), function() {
					frappe.confirm(
						__('Are you sure you want to approve this event and publish it to the public calendar?'),
						function() {
							frappe.call({
								method: 'approve',
								doc: frm.doc,
								freeze: true,
								freeze_message: __('Approving event...'),
								callback: function(r) {
									if (!r.exc) {
										frm.reload_doc();
										frappe.show_alert({
											message: __('Event approved and published!'),
											indicator: 'green'
										});
									}
								}
							});
						}
					);
				}).addClass('btn-primary');

				frm.add_custom_button(__('Reject Event'), function() {
					frappe.prompt(
						[
							{
								label: __('Rejection Reason / Admin Notes'),
								fieldname: 'admin_notes',
								fieldtype: 'Small Text',
								reqd: 0
							}
						],
						function(values) {
							frappe.call({
								method: 'reject',
								doc: frm.doc,
								args: {
									reason: values.admin_notes
								},
								freeze: true,
								freeze_message: __('Rejecting event...'),
								callback: function(r) {
									if (!r.exc) {
										frm.reload_doc();
										frappe.show_alert({
											message: __('Event marked as Rejected.'),
											indicator: 'orange'
										});
									}
								}
							});
						},
						__('Reject Event')
					);
				}).addClass('btn-danger');
			} else if (cur_status === 'Approved' && is_admin) {
				frm.add_custom_button(__('Reject / Cancel Event'), function() {
					frappe.confirm(
						__('Are you sure you want to reject or cancel this approved event?'),
						function() {
							frappe.call({
								method: 'reject',
								doc: frm.doc,
								freeze: true,
								freeze_message: __('Updating event...'),
								callback: function(r) {
									if (!r.exc) {
										frm.reload_doc();
										frappe.show_alert({
											message: __('Event rejected.'),
											indicator: 'orange'
										});
									}
								}
							});
						}
					);
				});
			}
		}
	}
});

