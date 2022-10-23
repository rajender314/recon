import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { MatDialog, MatSnackBar } from '@angular/material';

import { AdminService } from "@app/admin/admin.service";
import { AdminInterface } from '@app/admin/admin-interface';
import { AddAdminDialogComponent } from '@app/admin/dialogs/add-admin-dialog/add-admin-dialog.component';

import { GridOptions, GridApi } from 'ag-grid-community';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { DescriptionRendererComponent } from '@app/shared/components/ag-grid/cell-renderers/description-renderer/description-renderer.component';

import * as _ from 'lodash';
import { FormFieldType } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
	selector: 'app-distribution-types',
	templateUrl: './distribution-types.component.html',
	styleUrls: ['../admin.component.scss', './distribution-types.component.scss']
})
export class DistributionTypesComponent extends AdminInterface implements OnInit {
	APP = APP;
	activeTab: number = 0;
	formConfig: any = [
		{ key: 'departments', default: null }
	];

	addFormFields: Array<FormFieldType> = [
		{ key: 'name', label: 'Distribution Type Name', type: 'text', validations: { required: true }, default: '' },
		{ key: 'status', label: 'Status', type: 'select', multi: false, options: 'statusList', default: true },
		{ key: 'description', label: 'Description', type: 'textarea', default: '' }
	];

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Distribution Types', type: 'text' },
	];

	gridSearchValue: string = '';
	gridApi: GridApi;

	gridOptions: GridOptions = {
		rowHeight: 35,
		columnDefs: [
			{ headerName: "Form", field: "name" },
			{
				headerName: "Code", field: "tax_code", editable: (APP.permissions.system_access.distribution_types=='edit')?true:false,
				cellRenderer: (param) => {
					return param.value ? param.value : '---'
				}
			},
			{
				headerName: "Description", field: "description", editable: (APP.permissions.system_access.distribution_types=='edit')?true:false,
				cellEditor: 'agLargeTextCellEditor',
				cellRenderer: 'description',
				cellEditorParams: {
					maxLength: '300',
					cols: '50',
					rows: '6'
				}
			}
		],
		rowData: [],
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		// isExternalFilterPresent: () => { return true },
		// doesExternalFilterPass: (o) => {
		// 	return o.data.name.toLowerCase().indexOf(this.gridSearchValue.toLowerCase()) > -1;
		// },
		frameworkComponents: {
			numericEditor: NumericCellEditorComponent,
			description: DescriptionRendererComponent
		},
		onGridReady: (params) => {
			this.gridApi = params.api;
			params.api.sizeColumnsToFit();
		},

		defaultColDef: {
			resizable: true
		},

		onCellValueChanged: (gridApi) => {
			let params = {
				id: this.selectedDetails.id,
				distribution_ids: []
			}
			if (gridApi.oldValue != gridApi.newValue) {
				params.distribution_ids.push(gridApi.data);
				this.saveDistributionForms(params);
			}
		}
	}

	state = {
		tabs: [
		  { label: 'Details', type: 'details' },
		  { label: 'Forms', type: 'forms' }
		]
	  }

	constructor(
		fb: FormBuilder,
		dialog: MatDialog,
		snackbar: MatSnackBar,
		adminService: AdminService
	) {
		super({ title: 'Distribution Type', flag: 'departments', prop: 'items', export: '', get: 'distributionTypes', save: 'saveDistributionTypes' }, adminService, fb, snackbar, dialog);
		this.getConfig(this.addFormFields);
	}

	ngOnInit() {
		this.createForm(this.formConfig);
		this.getDepartments();
		this.getList();
	}

	getDepartments = () => {
		this.adminService.getApi('getDepartments', { status: true, org_type: 1, pageSize: 100000 })
			.then(data => {
				this.dropdowns.departments = data.result.success ? data.result.data.departments : [];
				this.adminForm.setControl('departments', this.fb.group(this.createDepartmentGroup()));
			})
	}

	createDepartmentGroup = () => {
		const controls = {};
		this.dropdowns.departments.map(dept => {
			controls[dept.id] = false;
		})
		return controls;
	}

	onSelectItem = item => {
		this.duplicateError = '';
		this.selectedDetails = item;
		this.onTabChange(this.activeTab);
	}

	onTabChange(val) {
		this.activeTab = val;
		this.fetchingDetails = true;
		if (this.activeTab == 0) {
			this.adminService.getApi('distributionTypes', { id: this.selectedDetails.id })
				.then(res => {
					this.fetchingDetails = false;
					if (res.result.success) {
						this.selectedDetails = res.result.data.items[0];
						this.setForm(this.selectedDetails);
						this.adminForm.markAsPristine();
					}
				})
		} else if (this.activeTab == 1) {
			this.getDistributionForms();
		}
	}

	getDistributionForms() {
		this.adminService.getApi('formDistributions', { id: this.selectedDetails.id, type: 'distribution' })
			.then(res => {
				this.fetchingDetails = false;
				if (res.result.success) {
					this.gridOptions.rowData = res.result.data.items;
				}
			})
	}

	saveDistributionForms(param) {
		this.adminService.saveApi('updateFmDstrb', param)
			.then(res => {
				if (res.result.success) this.openSnackBar({ status: 'success', msg: 'Distribution Type Updated Successfully' });
			})
	}

	gridSearch(val) {
		this.gridSearchValue = val;
		// this.gridApi.onFilterChanged();
		this.gridApi.setQuickFilter(val);
	}

}

