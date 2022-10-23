import { Component, OnInit } from '@angular/core';
import { GridOptions, RowNode, GridApi } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { FormFieldType } from '@app/admin/admin.config';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddDialogComponent } from '@app/admin/workflow/add-dialog/add-dialog.component';
import * as _ from 'lodash';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import * as _moment from 'moment';
import { AgPiSelect, AgPiInput } from '@app/shared/components/ag-grid/custom-cell-editor';

var APP = window['APP'];

@Component({
	selector: 'app-task-types',
	templateUrl: './task-types.component.html',
	styleUrls: ['./task-types.component.scss']
})
export class TaskTypesComponent implements OnInit {

	gridApi: GridApi;
	dropdowns: any = {};
	promise: any;
	snackbarPromise: any;
	APP = APP;
	params: Array<any> = [];

	gridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight:38,
		columnDefs: [
			{
				headerName: "Task Type", field: "name", cellClass:"right-text-cell left-text-cell", editable: (APP.permissions.system_access.task_types=='edit')?true:false, cellEditorFramework: AgPiInput, newValueHandler: (params) => {
					if (params.newValue) {
						params.data[params.colDef.field] = params.newValue;
						return true;
					}
					else return false;
				}
			},
			{
				headerName: "Effort", cellClass:"right-text-cell left-text-cell inline_edit", field: "billing_type_id", editable: (APP.permissions.system_access.task_types=='edit')?true:false, cellEditorFramework: AgPiSelect, /* cellEditor: 'agSelectCellEditor',*/
				cellEditorParams: (params) => {
					return {
						options:  this.dropdowns.billingTypes 
					}
				}, cellRenderer: params => {
					return this.getEfforName(params.value);
				}, onCellValueChanged: params => {
					if(document.querySelector('.pi-select-list')){
						document.body.removeChild(document.querySelector('.pi-select-list'));
					}
				}
				/*cellRendererParams: params => {
					return {
						options:  this.dropdowns.billingTypes 
					}
				}*/
			},
			{
				headerName: "Associated", cellClass:"right-text-cell left-text-cell inline_edit", field: "workflow_id", editable: (APP.permissions.system_access.task_types=='edit')?true:false, cellEditorFramework: AgPiSelect, /* cellEditor: 'agSelectCellEditor', */
				cellEditorParams: (params) => {
					return {
						options: this.dropdowns.workflows
					}
				},
				cellRenderer: params => {
					return this.getWorkflowName(params.value);
				}, onCellValueChanged: params => {
					if(document.querySelector('.pi-select-list')){
						document.body.removeChild(document.querySelector('.pi-select-list'));
					}
				}
			},
			{ headerName: "Last Modified", field: "last_modified_date", valueFormatter: params => {
				return params.value ? _moment(params.value).format('MMM DD, YYYY HH:MM A') : '';
			} },
		],
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		localeText: { noRowsToShow: 'No Task Types Found' },

		/*rowModelType: 'infinite',
		enableServerSideSorting: true,
		enableServerSideFilter: true,
		enableSorting: true,*/

		rowData: [],

		defaultColDef: {
			resizable: true
		},

		onGridReady: (params) => {
			params.api.sizeColumnsToFit();
			this.gridApi = params.api;
			this.getList();
			/*this._commonService.getApi('getTaskTypes', { search: '' })
				.then(res => {
					var dataSource = {
						rowCount: null,
						getRows: (params) => {
							setTimeout(() => {
								var lastRow = -1;
								params.successCallback(res['result'].data, res['result'].data.length);
							}, 20);
						}
					}
					params.api.setDatasource(dataSource);
				})*/
		},
		onCellValueChanged: (gridApi) => {
			let params: any = {
				id: gridApi.data.id
			};
			if (gridApi.oldValue != gridApi.newValue) {

				params.name = gridApi.data.name;
				params.workflow_id = gridApi.data.workflow_id;
				params.billing_type_id = gridApi.data.billing_type_id;

				const indx = _.findIndex(this.params, { id: gridApi.data.id });
				if (indx > -1) this.params[indx] = params;
				else this.params.push(params);

				if (this.params.length) {
					if (this.snackbarPromise) clearTimeout(this.snackbarPromise);
					this.snackbarPromise = setTimeout(() => {
						this.openSnackBar({ status: 'success', msg: 'Task Type Updated Successfully' });
					}, 500);
					this.queueRequest(this.params)
				}
			}
		},
		onFilterChanged: (params) => {
			if (params.api.getDisplayedRowCount() == 0) {
				this.gridApi.showNoRowsOverlay();
			}
			else this.gridApi.hideOverlay();
		}
	}

	addDialogFields: Array<FormFieldType> = [
		{ key: 'id', label: '', type: 'none', default: '' },
		{ key: 'status', label: '', type: 'none', default: true },
		{ key: 'name', label: 'Task Type', type: 'text', validations: { required: true }, default: '' },
		{ key: 'billing_type_id', label: 'Effort', type: 'select', multi: false, options: 'billingTypes', default: '' },
		{ key: 'workflow_id', label: 'Associated', type: 'select', multi: false, options: 'workflows', default: 1 },
	];

	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar
	) { }

	ngOnInit() {
		this.getApiCalls();
	}

	getApiCalls() {
		this.getBillableTypes();
		setTimeout(() => {
			this.dropdowns.workflows = [
				{ id: 0, name: 'Approval Workflow 1' },
				{ id: 1, name: 'Approval Workflow' },
				{ id: 2, name: 'Approval 2' },
				{ id: 3, name: 'Approval Workflow 3' },
				{ id: 4, name: 'Approval 3' },
				{ id: 5, name: 'Approval 4' },
			];
		}, 10);
	}

	getWorkflowName(id) {
		const obj = _.find(this.dropdowns.workflows, ['id', id]);
		if (obj) return obj.name;
		else return '';
	}

	getEfforName(id) {
		const obj = _.find(this.dropdowns.billingTypes, ['id', id]);
		if (obj) return obj.name;
		else return '';
	}

	getBillableTypes() {
		this._commonService.getApi('getBillingTypes', { status: true })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.billingTypes = res['result'].data || [];
				}
			})
	}

	queueRequest(data) {
		if (this.promise) clearTimeout(this.promise);
		this.promise = setTimeout(() => {
			this.params = [];
			this._commonService.saveApi('saveTaskTypes', { task_types: data })
				.then(res => {
					this.params = [];
				})
		}, 3500);
	}

	getList(search = '') {
		this.gridApi.showLoadingOverlay();
		this._commonService.getApi('getTaskTypes', { search: search })
			.then(res => {
				this.gridApi.hideOverlay();
				if (res['result'].success) {
					this.gridOptions.rowData = res['result'].data;
					this.gridApi.setRowData(this.gridOptions.rowData);
				}
			})
	}

	add() {
		this._dialog.open(AddDialogComponent, {
			panelClass: 'recon-dialog',
			width: '600px',
			data: {
				title: 'Add Task Type',
				formFields: this.addDialogFields,
				url: 'saveTaskTypes',
				apiCalls: [
					// { key: 'billingTypes', url: 'getBillingTypes', params: { status: true } },
					// { key: 'workflows', url: '', params: { status: true } },
				],
				dropdowns: { ...this.dropdowns }
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.gridApi.updateRowData({ add: [res.data], addIndex: 0 });
					this.openSnackBar({ status: 'success', msg: 'Task Type Added Successfully' });
				}
			})
	}

	onSearch(val) {
		this.gridApi.setQuickFilter(val);
	}

	save(params) {
		this._commonService.saveApi('', params)
			.then(res => {
				this.params = [];
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
