import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContactsService } from '@app/contacts/contacts.service';
import { ScrollToConfigOptions, ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import { AddDialogComponent } from '@app/contacts/add-dialog/add-dialog.component';

import * as _ from 'lodash';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar, MatDialog } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';

var APP = window['APP'];

@Component({
	selector: 'app-vendor-info',
	templateUrl: './vendor-info.component.html',
	styleUrls: ['./vendor-info.component.scss']
})
export class VendorInfoComponent implements OnInit, OnDestroy {

	state = {
		loader: false,
		org_id: null,
		showFooter: false,
		editable: false,
		selectedTab: null,
		selected: null,
		search: '',
		details: {
			list: [],
			selected: null,
			modelValues: {}
		}
	}

	equipmentForm: FormGroup;
	clientInfoSubscription: Subscription;

	constructor(
		private _fb: FormBuilder,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _activeRouter: ActivatedRoute,
		private _contactService: ContactsService,
		private _scrollToService: ScrollToService,
	) {
		this.state.selectedTab = this._activeRouter.snapshot.data.tabIndex;
		this.state.org_id = this._activeRouter.parent.snapshot.params.id ? Number(this._activeRouter.parent.snapshot.params.id) : null;
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

	ngOnDestroy() {
		this.clientInfoSubscription.unsubscribe();
	}

	noData(bol = false) {
		this._contactService.update({ type: 'no-data', data: bol });
	}

	createForm() {
		this.equipmentForm = this._fb.group({
			spec_ids: this._fb.array([]),
			defaults: this._fb.group({})
		});
	}

	getTabDetails() {
		switch (this.state.selectedTab) {
			case 9:
				this.getVendorCapabilities();
				break;
			case 10:
				this.createForm();
				this.getVendorEquipments();
				break;
			default:
				break;
		}
	}

	getVendorCapabilities(): void {
		this.state.loader = true;
		this._contactService.getApi('masterCapbCatg', {})
			.then(res => {
				this.state.loader = false;
				if (res.result.success) {
					this.state.details.list = res.result.data;
					this.getOrgCapabilities();
				}
			})
	}

	getOrgCapabilities(): void {
		this._contactService.getApi('orgCapabilities', { org_id: this._activeRouter.parent.snapshot.params.id })
			.then(res => {
				if (res.result.success) {
					if (res.result.data) {
						this.state.details = { ...this.state.details, ...res.result.data };
						// test case
						if (!this.state.details.selected) this.state.details.selected = {};
						if (!this.state.details.selected['selected_copy']) this.state.details.selected['selected_copy'] = {};
					} else {
						this.state.details.selected = {};
						this.state.details.selected['selected_copy'] = {};
					}
				}
			})
	}

	checkEqList(value) {
		this.noData(value);
	}

	afterUpdate(flag) {
		if (flag == 'update') {
			this.openSnackBar({ status: 'success', msg: 'Equipment Updated Successfully' });
		} else {
			this.openSnackBar({ status: 'success', msg: 'Equipment Deleted Successfully' });
		}
	}

	addRelatedTab(row?: any): void {
		const locals: any = {
			org_id: this._activeRouter.parent.snapshot.params.id ? Number(this._activeRouter.parent.snapshot.params.id) : null,
			dropdowns: [],
			selectedRow: (row ? row : null)
		}
		if (row) this.state.details.selected = row;
		switch (this.state.selectedTab) {
			case 10:
				locals.title = 'Add Equipment';
				locals.label = 'Vendor Equipment';
				locals.formFields = [
					{ key: 'equip_ctg_id', label: 'Category', type: 'select', validations: { required: true }, multi: false, options: 'categories', default: '' },
					{ key: 'name', label: 'Name the Equipment', type: 'text', default: '' }
				];
				locals.url = 'saveOrgEquipSpec';
				locals.apiCalls = [
					{ key: 'categories', url: 'equipmentCategory', params: { status: true } }
				]
				break;
		}
		if (this.state.selectedTab == 10) {
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

	closePrev(item) {
		const prev = _.find(this.state.details.list, ['isOpen', true]);
		if (prev && prev.id != item.id) delete prev.isOpen;
	}

	triggerScroll(indx) {
		const config: ScrollToConfigOptions = {
			target: 'capb_' + indx
		};

		this._scrollToService.scrollTo(config);
	}

	showChildren(obj, i): void {
		this.closePrev(obj);
		obj.isOpen = !obj.isOpen;
		setTimeout(() => {
			this.triggerScroll(i);
		}, 20);
		if (!this.state.details.modelValues[obj.id]) {
			this.state.details.modelValues[obj.id] = {};
			if (this.state.details.selected[obj.id])
				this.state.details.selected[obj.id].map(id => {
					this.state.details.modelValues[obj.id][id] = true;
				});
		}
	}

	onSelectCapability(parentId, capId): void {
		let selected: Array<any>;
		if (this.state.details.selected[parentId]) {
			selected = this.state.details.selected[parentId];
		} else {
			this.state.details.selected[parentId] = [];
			selected = this.state.details.selected[parentId];
		}
		const indx = selected.indexOf(capId);
		if (indx > -1) {
			selected.splice(indx, 1);
		} else {
			selected.push(capId);
		}
		/* test case */
		if(!this.state.details.selected[parentId].length) delete this.state.details.selected[parentId];
		if(Object.keys(this.state.details.selected).length) {
			// enable here
			this.state.showFooter = true;
		}else {
			// disable here
			this.state.showFooter = false;
		}
	}

	getVendorEquipments(): void {
		this.state.loader = true;
			this._contactService.getApi('OrgEquipCtgSpec', { org_id: this._activeRouter.parent.snapshot.params.id })
				.then(res => {
					this.state.loader = false;
					if (res.result.success) {
						if (!res.result.data.length) this.noData(true);
						this.state.details.list = res.result.data;
					}
				})
	}

	reset(): void {
		switch (this.state.selectedTab) {
			case 9:
				const keys = Object.keys(this.state.details.modelValues);
				keys.map(key => {
					this.state.details.modelValues[key] = {};
					if (this.state.details['selected_copy'][key])
						this.state.details['selected_copy'][key].map(id => {
							this.state.details.modelValues[key][id] = true;
						})
				});
				break;
		}
		this.state.showFooter = false;
	}

	save(): void {
		let param: any = {}, url: string = '', title: string = '';
		switch (this.state.selectedTab) {
			case 9:
				param = {
					org_id: this._activeRouter.parent.snapshot.params.id ? Number(this._activeRouter.parent.snapshot.params.id) : null,
					id: this.state.details['id'],
					selected: this.state.details.selected
				}, url = 'saveOrgCapability', title = 'Capabilities';
				break;
		}
		this.saveApiCall(url, param, title);
	}

	saveApiCall(url, param, title): void {
		this._contactService.saveApi(url, param)
			.then(res => {
				if (res.result.success) {
					this.openSnackBar({ status: 'success', msg: title + ' Updated Successfully' });
					this.state.details = { ...this.state.details, ...res.result.data };
					this.state.showFooter = false;
					// this.state.details['showEdit'] = false;
				}
			})
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
