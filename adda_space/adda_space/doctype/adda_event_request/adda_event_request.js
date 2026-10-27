// Copyright (c) 2026, reap_benefit and contributors
// For license information, please see license.txt

frappe.ui.form.on('Adda Event Request', {
	refresh: function(frm) {
		if (!frm.is_new()) {
			if (frm.doc.status === 'Pending Review') {
				frm.add_custom_button(__('Approve Proposal'), function() {
					frappe.confirm(
						__('Are you sure you want to approve this proposal and publish the Adda Event?'),
						function() {
							frappe.call({
								method: 'approve',
								doc: frm.doc,
								freeze: true,
								freeze_message: __('Approving proposal and creating event...'),
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

				frm.add_custom_button(__('Reject Proposal'), function() {
					frappe.prompt(
						[
							{
								label: __('Rejection Reason / Admin Notes'),
								fieldname: 'admin_notes',
								fieldtype: 'Small Text',
								reqd: 1
							}
						],
						function(values) {
							frappe.call({
								method: 'reject',
								doc: frm.doc,
								args: {
									admin_notes: values.admin_notes
								},
								freeze: true,
								freeze_message: __('Rejecting proposal...'),
								callback: function(r) {
									if (!r.exc) {
										frm.reload_doc();
										frappe.show_alert({
											message: __('Proposal marked as Rejected.'),
											indicator: 'orange'
										});
									}
								}
							});
						},
						__('Reject Event Proposal')
					);
				}).addClass('btn-danger');
			}

			if (frm.doc.event) {
				frm.add_custom_button(__('View Created Event'), function() {
					frappe.set_route('Form', 'Adda Event', frm.doc.event);
				});
			}
		}
	}
});

