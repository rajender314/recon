import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from "@app/admin/admin.service";
import { CreateDesignationComponent } from '@app/admin/dialogs/create-designation/create-designation.component';
import { AdminInterface } from '@app/admin/admin-interface';

import * as _ from 'lodash';
import { updateForm } from '@app/admin/admin.config';
var APP = window['APP'];
@Component({
	selector: 'app-designations',
	templateUrl: './designations.component.html',
	styleUrls: ['../admin.component.scss', './designations.component.scss']
})
export class DesignationsComponent extends AdminInterface implements OnInit {
	APP = APP;
	selectedDesignationType: any;

	formConfig: any = [
		{ key: 'bill_rate', validations: { required: true }, default: '0.00' },
		{ key: 'org_type', default: '' },
		{ key: 'created_by', default: null },
		{ key: 'created_date', default: null },
		{ key: 'last_modified_by', default: null },
		{ key: 'last_modified_date', default: null }
	]

	priceConfig: any = {
		prefix: '$',
		limit: 3,
		centsLimit: 2,
		isCancel: false
	}

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Designations', type: 'text' }
	]

	constructor(
		private activeRoute: ActivatedRoute,
		dialog: MatDialog,
		adminService: AdminService,
		fb: FormBuilder,
		snackbar: MatSnackBar
	) {
		super({ title: 'Designation', prop: 'designations', export: 'exportDesignations', get: 'getDesignations', save: 'addDesignations' }, adminService, fb, snackbar, dialog);
		this.dropdowns.departmentTypes = [
			{ label: 'Client Designations', value: 2, name: 'Client Designation' },
			{ label: 'Company Designations', value: 1, name: 'Company Designation' },
			{ label: 'Vendor Designations', value: 3, name: 'Vendor Designation' },
		];
		
		activeRoute.queryParamMap.subscribe(query => {
			let org_type = query.get('type');
			if (org_type) {
				this.param.page = 1;
				this.param.org_type = org_type;
				this.selectedDesignationType = this.getDesignationType(Number(org_type));
				if(this.breadcrumbs.length > 2) this.breadcrumbs.pop();
				this.breadcrumbs = [...this.breadcrumbs, ...[{ label: this.selectedDesignationType.label, type: 'text' }]];
				this.getList();
			}
		})
	}

	ngOnInit() {
		this.createForm(this.formConfig);
	}

	getDesignationType = org_type => {
		let res = this.dropdowns.departmentTypes.filter(val => val.value === org_type);
		if (res.length)
			return res[0];
		else
			return {};
	}

	setForm = data => {
		this.adminForm.patchValue(updateForm(this.formFields, data));
		this.priceConfig = { ...this.priceConfig };
	}

	resetForm = (data) => {
		this.adminForm.reset(updateForm(this.formFields, data));
		this.adminForm.markAsPristine();
		this.submitted = false;
        this.duplicateError = '';
		this.priceConfig.isCancel = !this.priceConfig.isCancel;
		this.priceConfig = {...this.priceConfig}
	}

	openAddDialog = (data?) => {
		const label = this.selectedDesignationType ? this.selectedDesignationType.label.substring(0, (this.selectedDesignationType.label.length - 1)) : 'Designation';
		this.dialog
			.open(CreateDesignationComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: {
					title: 'Add New ' + label,
					label: label,
					dropdowns: this.dropdowns,
					name: data ? data : '',
					org_type: this.param.org_type
				}
			})
			.afterClosed().subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Designation Added Successfully' });
					this.param.page = 1;
					this.getList();
				}
			})
	}

}
