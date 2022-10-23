import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContactsService } from '@app/contacts/contacts.service';
import { DeleteComponent } from '@app/contacts/delete/delete.component';
import { AddDialogComponent } from '@app/contacts/add-dialog/add-dialog.component';

import * as _ from 'lodash';
import { MatDialog, MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { SnackBarType } from '@app/shared/utility/types';
import { Subscription } from 'rxjs';

var APP = window['APP'];

@Component({
	selector: 'app-client-info',
	templateUrl: './client-info.component.html',
	styleUrls: ['./client-info.component.scss']
})
export class ClientInfoComponent implements OnInit, OnDestroy {

	state = {
		loader: false,
		editable: false,
		selectedTab: null,
		selected: null,
		search: '',
		details: {
			list: [],
			selected: null
		},
		dropdowns: {
			users: [],
			syncOptions: [
				{ id: 0, name: 'None', disabled: true },
				{ id: 1, name: 'User Defined 1', disabled: false },
				{ id: 2, name: 'User Defined 2', disabled: true },
				{ id: 3, name: 'User Defined 3', disabled: false },
				{ id: 4, name: 'User Defined 4', disabled: true },
				{ id: 5, name: 'User Defined 5', disabled: true },
				{ id: 6, name: 'User Defined 6', disabled: false }
			]
		}
	}

	clientInfoSubscription: Subscription;

	sortOptions: any = {
		handle: '.handle',
		onUpdate: (event: any) => {
			let param = [];
			this.state.details.list.map((o, i) => {
				param.push({
					id: o.id,
					order_id: i + 1
				})
			});
			this._contactService.saveApi('saveCustAttributes', { orders_ids: param, type: 'order' })
				.then(res => {
				})
		}
	}

	constructor(
		private _activeRouter: ActivatedRoute,
		private _contactService: ContactsService,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar
	) {
		this.state.selectedTab = this._activeRouter.snapshot.data.tabIndex;
		this.clientInfoSubscription = _contactService.onUpdate().subscribe(ev => {
			if (ev.type == 'add') this.addRelatedTab();
			else if (ev.type == 'search') {
				this.state.search = ev.data || '';
				this.getTabDetails();
			}
		})
	}

	ngOnInit() {
		this.noData();
		this.state.selected = this._contactService.getOrganization();
		if (this.state.selected['org_type'] == 2) {
			this.state.editable = APP.permissions.system_access.client == 'edit';
		} else if (this.state.selected['org_type'] == 3) {
			// IF current route is a vendor
			this.state.editable = APP.permissions.system_access.vendor == 'edit';
		}
		this.getTabDetails();
	}

	getTabDetails() {
		switch (this.state.selectedTab) {
			case 5:
				this.getCustomAttributes();
				break;
			case 6:
				this.getInternalInvoice();
				break;
			case 7:
				this.getUsers();
				break;
			default:
				break;
		}
	}

	ngOnDestroy() {
		this.clientInfoSubscription.unsubscribe();
	}

	getUsers() {
		this.state.loader = true;
		this._contactService.getDropdownMaster({ org_type: this.state.selected.org_type, org_id: this.state.selected.org_id, master_type: 5 })
			.then(res => {
				this.state.loader = false;
				if (res.result.success) {
					this.state.dropdowns.users = res.result.data.users || [];
				}
			})
	}

	getSyncLabel(id): string {
		const sync = _.find(this.state.dropdowns.syncOptions, ['id', id]);
		return sync.name;
	}

	noData(bol = false) {
		this._contactService.update({ type: 'no-data', data: bol });
	}

	getCustomAttributes(): void {
		this.state.loader = true;
		this._contactService.getApi('custAttributes', { org_id: this._activeRouter.parent.snapshot.params.id, search: this.state.search })
			.then(res => {
				this.state.loader = false;
				if (res.result.success) {
					this.state.details.list = res.result.data.items || [];
				}
				if (!this.state.details.list.length) {
					if (!this.state.search) this.noData(true);
				} else this.noData();
			})
	}

	getInternalInvoice(): void {
		this.state.loader = true;
		this._contactService.getApi('internalInvoice', { org_id: this._activeRouter.parent.snapshot.params.id, search: this.state.search })
			.then(res => {
				this.state.loader = false;
				if (res.result.success) {
					this.state.details.list = res.result.data.items || [];
				}
				if (!this.state.details.list.length) {
					if (!this.state.search) this.noData(true);
				} else this.noData();
			})

	}

	deleteRelatedTab(row?: any): void {
		switch (this.state.selectedTab) {
			case 5: // Custom Attributes
				this._dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: row['id'],
						org_id: this._activeRouter.parent.snapshot.params.id ? Number(this._activeRouter.parent.snapshot.params.id) : null,
						title: 'Delete Custom Attribute',
						name: row['label'],
						call: 'delCustAttributes'
					}
				})
					.afterClosed()
					.subscribe(res => {
						if (res && res.success) {
							const indx = _.findIndex(this.state.details.list, { id: row['id'] });
							if (indx > -1) this.state.details.list.splice(indx, 1);
							if (!this.state.details.list.length && !this.state.search) this.noData(true);
							this.openSnackBar({ status: 'success', msg: 'Custom Attribute Deleted Successfully' });
						}
					});

				break;
			case 6: // internal invoice
				this._dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: row['id'],
						org_id: this._activeRouter.parent.snapshot.params.id ? Number(this._activeRouter.parent.snapshot.params.id) : null,
						title: 'Delete Internal Invoice',
						name: row['name'],
						call: 'deleteIntInv'
					}
				})
					.afterClosed()
					.subscribe(res => {
						if (res && res.success) {
							const indx = _.findIndex(this.state.details.list, { id: row['id'] });
							if (indx > -1) this.state.details.list.splice(indx, 1);
							if (!this.state.details.list.length && !this.state.search) this.noData(true);
							this.openSnackBar({ status: 'success', msg: 'Internal Invoice Deleted Successfully' });
						}
					});

				break;
		}
	}

	addRelatedTab(row?: any): void {
		const locals: any = {
			org_id: this._activeRouter.parent.snapshot.params.id ? Number(this._activeRouter.parent.snapshot.params.id) : null,
			dropdowns: this.state.dropdowns,
			selectedRow: (row ? row : null)
		}
		if (row) this.state.details.selected = row;
		switch (this.state.selectedTab) {
			case 5: // Custom Attributes
				locals.title = 'Add Custom Attribute';
				locals.label = 'Custom Attribute';
				locals.formFields = [
					{ key: 'label', label: 'Label', type: 'text', validations: { required: true }, default: '' },
					{ key: 'ui_element_id', label: 'Type', type: 'select', multi: false, options: 'UIElements', default: '', isChange: true },
					{ key: 'value', label: 'Value', type: 'text', default: '' },
					{ key: 'description', label: 'Description', type: 'textarea', default: '' },
					{ key: 'settings', label: '', type: 'checkbox_grp', options: [{ key: 'print_in_estimate', label: 'Print in Estimate' }, { key: 'edit_in_job', label: 'Edit in Job' }], default: {} },
					{ key: 'sync', label: 'Sync with Accounting Software', type: 'select', options: 'syncOptions', default: '' }
				];
				locals.url = 'saveCustAttributes';
				locals.apiCalls = [
					{ key: 'UIElements', url: 'uielements', params: { status: true, custom_att: true } }
				],
					locals.order = this.state.details.list.length;
				break;
			case 6: // internal invoice
				locals.title = 'Add Internal Invoice';
				locals.label = 'Internal Invoice';
				locals.formFields = [
					{ key: 'cost_code_id', label: 'XR Code', type: 'select', validations: { required: true }, multi: false, options: 'XRCodes', default: '' },
					{ key: 'name', label: 'Title', type: 'text', validations: { required: true, maxlength: 64 }, default: '' },
					{ key: 'description', label: 'Description', type: 'textarea', default: '' }
				];
				locals.url = 'saveIntInvoice';
				locals.apiCalls = [
					{ key: 'XRCodes', url: 'getCostCodes', params: { status: true, search: 'XR' } }
				]
				break;
		}
		if (this.state.selectedTab == 5 || this.state.selectedTab == 6) {
			this._dialog.open(AddDialogComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: locals
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						if (row) {
							const indx = _.findIndex(this.state.details.list, { id: row['id'] });
							if (indx > -1) this.state.details.list[indx] = res.data;
						} else {
							this.state.details.list.push(res.data);
							if (this.state.details.list.length) this.noData();
						}

						this.openSnackBar({ status: 'success', msg: locals.label + (row ? 'Updated' : 'Added') + ' Successfully' });
					}
				})
		}
	}

	performAction(flag, indx) {
		let row = this.state.details.list[indx];
		if (flag == 'delete') {
			this.deleteRelatedTab(row);
		} else if (flag == 'edit') {
			this.addRelatedTab(row);
		}
	}

	openSnackBar = (obj) => {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

}
