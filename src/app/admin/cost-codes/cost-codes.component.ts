import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from "@app/admin/admin.service";
import { CreateDialogComponent } from '@app/admin/dialogs/create-dialog/create-dialog.component';
import { AdminInterface } from '@app/admin/admin-interface';

import { Statuses, StatusFilter, SortFilter } from "@app/shared/utility/dummyJson";

import * as _ from 'lodash';
import { updateForm } from '@app/admin/admin.config';

var APP: any = window['APP'];


@Component({
	selector: 'app-cost-codes',
	templateUrl: './cost-codes.component.html',
	styleUrls: ['../admin.component.scss', './cost-codes.component.scss']
})
export class CostCodesComponent extends AdminInterface implements OnInit {
	APP = APP;
	formConfig: any = [
		{ key: 'gl_income', default: null },
		{ key: 'gl_expense', default: null },
		{ key: 'category_id', default: null },
		{ key: 'cost_code_type', default: null },
		{ key: 'cost_code_tax_type', default: null },
	];
	
	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Cost Codes', type: 'text' },
	]

	constructor(
		fb: FormBuilder,
		dialog: MatDialog,
		snackbar: MatSnackBar,
		adminService: AdminService
	) {
		super({ title: 'Cost Code', prop: 'items', export: 'exportCstCds', get: 'getCostCodes', save: 'saveCostCodes' }, adminService, fb, snackbar, dialog);
	}

	ngOnInit() {
		this.createForm(this.formConfig);
		
	
		this.getList('init', data => {
			this.dropdowns.categories = data.categories;
			this.dropdowns.types = data.costcodetype;
			this.dropdowns.taxTypes = data.costcodetax;
		});
	}

	setForm = data => {
		this.adminForm.patchValue(updateForm(this.formFields, this.frameObj(data)));
	}

	frameObj = data => {
		return {
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			gl_income: data.gl_income || '',
			gl_expense: data.gl_expense || '',
			category_id: data.category_id ? this.checkActivity(data.category_id) : this.dropdowns.categories[0].id,
			cost_code_type: data.cost_code_type || this.dropdowns.types[0].id,
			cost_code_tax_type: data.cost_code_tax_type || this.dropdowns.taxTypes[0].id,
		}
	}
	

	openAddDialog = (data?) => {
		this.dialog
			.open(CreateDialogComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: { title: 'Add New Cost Code', dropdowns: this.dropdowns, name: data ? data : '' }
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Cost Code Added Successfully' });
					this.param.page = 1;
					this.getList();
				}
			})
	}

	resetForm = (data) => {
		this.adminForm.reset(updateForm(this.formFields, this.frameObj(data)));
		this.adminForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	checkActivity = (value) => {
		let id = '', isExists = false;
		this.dropdowns.categories.map(item => {
			if (item.id == value) isExists = true;
		})
		return id = isExists ? value : this.dropdowns.categories[0].id
	}

}
