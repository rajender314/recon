import { Component, OnInit, Output } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { StatusFilter, Statuses, SortFilter, buildParam, StatusList } from '@app/shared/utility/dummyJson';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { AdminDashboard, updateForm, FormFieldType } from '@app/admin/admin.config';

import { CreateCapabilityComponent } from '@app/admin/dialogs/create-capability/create-capability.component';
import { AdminInterface } from '@app/admin/admin-interface';


var APP: any = window['APP'];


@Component({
	selector: 'app-capabilities',
	templateUrl: './capabilities.component.html',
	styleUrls: ['../admin.component.scss', './capabilities.component.scss']
})
export class CapabilitiesComponent extends AdminInterface implements OnInit {
	APP = APP;
	promise: any;
	fetchingDetails: boolean = false;
	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Capabilities', type: 'text' },
	];

	addFormFields: Array<FormFieldType> = [
		{key: 'name', label: 'Capability Name', type: 'text', validations: {required: true}, default: ''},
		{key: 'status', label: 'Status', type: 'none', default: true}
	];
	

	constructor(
		fb: FormBuilder,
		dialog: MatDialog,
		snackbar: MatSnackBar,
		adminService: AdminService
	) {
		super({ title: 'Capability', prop: 'items', export: 'exportCapabilities', get: 'capabilities', details: 'capabilitiesDetails', save: 'saveCapabilities' }, adminService, fb, snackbar, dialog);
		this.getConfig(this.addFormFields);
	}

	ngOnInit() {
		this.createForm();
		this.getList();
		this.adminService.getApi('capabilityCategory', { status: true })
			.then(res => {
				if (res.result.success) this.dropdowns['catCapabilties'] = res.result.data.items;
				else this.dropdowns['catCapabilties'] = [];
				this.dropdowns['copyCatCapabilities'] = [...this.dropdowns['catCapabilties']];
			})

	}

	updateCategories(list) {
		list.map((catg, i) => {
			if (this.selectedDetails.categories_id.indexOf(catg.id) > -1) catg['selected'] = true;
			else delete catg['selected'];
		})
	}

	onSelectItem = item => {
		this.fetchingDetails = true;
		this.adminService.getApi(this.config['details'], { id: item.id })
			.then(res => {
				this.fetchingDetails = false;
				if (res.result.success) {
					this.duplicateError = '';
					this.selectedDetails = res.result.data[0];
					this.setForm(this.selectedDetails);
					this.updateCategories(this.dropdowns['catCapabilties']);
					this.adminForm.markAsPristine();
				}
			})
	}

	resetForm = data => {
		this.adminForm.reset(updateForm(this.formFields, data));
		this.updateCategories(this.dropdowns['catCapabilties']);
		this.adminForm.markAsPristine();
        this.submitted = false;
        this.duplicateError = '';
    }

	saveDetails = form => {
		if(!this.promise){
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			form.value.categories = _.map(this.getSelected['data'], 'id');
			this.promise = this.adminService.saveApi('saveCapabilities', form.value)
				.then(res => {
					this.promise = undefined;
					if (res.result.success) {
						this.openSnackBar({ status: 'success', msg: 'Capability Saved Successfully' });
						let indx = _.findIndex(this.adminList, { id: form.value.id });
						if (this.statusBy == '' ||
							(JSON.parse(form.value.status) && this.statusBy == 'Active') ||
							(!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
							this.adminList[indx] = { ...res.result.data };
							this.selectedDetails = { ...res.result.data };
							this.adminForm.markAsPristine();
						} else {
							this.adminList.splice(indx, 1);
							this.totalCount--;
							this.onSelectItem(this.adminList[0]);
						}

					} else {
						this.duplicateError = res.result.data;
					}
				})
				.catch(err =>{
					this.promise = undefined;
				})
		}
	}
	}

	DOMSearch(ev) {
		if(ev)
		this.dropdowns['catCapabilties'] = _.filter(this.dropdowns['copyCatCapabilities'], (o) => {
			return !o.selected &&  o.name.toLowerCase().indexOf(ev.toLowerCase()) > -1 || o.selected;
		});
		else this.dropdowns['catCapabilties'] = [...this.dropdowns['copyCatCapabilities']];
	}

	/* list, action, prop */
	performAction(list, action, prop) {
		if (list) {
			if (action == 'delete') delete list[prop];
			else list[prop] = true;
		} else {
			this.dropdowns['catCapabilties'].map(catg => {
				if (action == 'delete') delete catg[prop];
				else catg[prop] = true;
			})
		}
		this.adminForm.markAsDirty();
	}


	public get getSelected(): Object {
		let arr = _.filter(this.dropdowns['catCapabilties'], (catg) => {
			return catg.selected == true;
		});
		return {
			data: arr,
			length: arr.length
		}
	}


}
