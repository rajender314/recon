import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialog } from '@angular/material';

import { MatSnackBar } from "@angular/material";
import { SnackbarComponent } from "@app/shared/material/snackbar/snackbar.component";

import { AdminService } from "@app/admin/admin.service";
/* Types */
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { StatusFilter, Statuses, MiscTypes, SortFilter, buildParam } from '@app/shared/utility/dummyJson';

import * as _ from "lodash";
import { CreateMiscExpenseComponent } from '@app/admin/dialogs/create-misc-expense/create-misc-expense.component';
import { AdminDashboard, updateForm } from '@app/admin/admin.config';
import { AdminInterface } from '@app/admin/admin-interface';

var APP: any = window['APP'];

@Component({
	selector: 'app-misc-expenses',
	templateUrl: './misc-expenses.component.html',
	styleUrls: ['../admin.component.scss', './misc-expenses.component.scss']
})
export class MiscExpensesComponent extends AdminInterface implements OnInit {
	APP = APP;
	formConfig: any = [
		{ key: 'costcode_id', default: null },
		{ key: 'types', default: null },
		{ key: 'rate', default: 0 },
		{ key: 'created_by', default: null },
		{ key: 'created_date', default: null },
		{ key: 'last_modified_by', default: null },
		{ key: 'last_modified_date', default: null }
	]

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Misc Expenses', type: 'text' },
	]

	priceConfig: any = {
		prefix: '',
		limit: 3,
		centsLimit: 3,
		isCancel: false
	}

	constructor(
		fb: FormBuilder,
		dialog: MatDialog,
		snackbar: MatSnackBar,
		adminService: AdminService
	) {
		super({ title: 'Misc - Expense', prop: 'items', export: 'exportMiscExp', get: 'getMiscExpenses', save: 'saveMiscExpenses' }, adminService, fb, snackbar, dialog);
		this.dropdowns.miscTypes = MiscTypes;
	}

	ngOnInit() {
		this.createForm(this.formConfig);
		this.getList('init', data => {
			this.dropdowns.costCodes = data.costCodes;
		});
		this.adminForm.get('types')
			.valueChanges
			.subscribe(val => {
				if(val == 'Markup'){
					this.priceConfig.prefix = '';
					this.priceConfig.suffix = '%';
					this.priceConfig.limit = 3;
				}else if(val == 'Rate'){
					this.priceConfig.prefix = '$';
					this.priceConfig.suffix = ''
					this.priceConfig.limit = 4;
				}
				this.priceConfig = {...this.priceConfig};
				this.adminForm.get('rate').patchValue('');
				this.adminForm.get('rate').setValidators([Validators.required]);
			})
	}

	setForm = data => {
		if (data.types) {
			this.adminForm.get('types').disable();
			this.adminForm.get('rate').setValidators([Validators.required]);
		} else {
			this.adminForm.get('types').enable();
			this.adminForm.get('types').clearValidators();
		}
		if(!data.types || data.types == '0') {
			this.adminForm.patchValue({
				types: this.dropdowns.miscTypes[0].id
			})
		}		
		this.adminForm.patchValue(updateForm(this.formFields, data));
		
	}

	openAddDialog = (data?) => {
		this.dialog
			.open(CreateMiscExpenseComponent, {
				panelClass: 'recon-dialog',
				width: '500px',
				data: {
					title: 'Add New Misc - Expense',
					dropdowns: this.dropdowns,
					name: data ? data : ''
				}
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Misc - Expense Added Successfully' });
					this.param.page = 1;
					this.getList();
				}
			})
	}
}
