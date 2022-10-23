import { Component, OnInit } from '@angular/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { ButtonGroupComponent, ProgressBarComponent } from '@app/admin/workflow/grid-frameworks/grid-frameworks.component';
import { CommonService } from '@app/common/common.service';

import * as _ from 'lodash';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material';

var APP = window['APP'];

@Component({
	selector: 'app-task-statuses',
	templateUrl: './task-statuses.component.html',
	styleUrls: ['./task-statuses.component.scss']
})
export class TaskStatusesComponent implements OnInit {

	gridApi: GridApi;
	promise: any;
	snackbarPromise: any;
	params: Array<any> = [];

	gridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight: 38,
		columnDefs: [
			{ headerName: "Status Name", field: "name" },
			{ headerName: "Progress", field: "percentage", cellRendererFramework: ProgressBarComponent ,cellRendererParams:{isDisable:(APP.permissions.system_access.task_statuses=='edit')?false:true}},
			{ headerName: "status", field: "status", cellRendererFramework: ButtonGroupComponent ,cellRendererParams:{isDisable:(APP.permissions.system_access.task_statuses=='edit')?false:true}},
		],
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowModelType: 'serverSide',
		rowData: [],

		defaultColDef: {
			resizable: true
		},

		onGridReady: (params) => {
			params.api.sizeColumnsToFit();
			this.gridApi = params.api;

			this._commonService.getApi('getTaskStatuses', { search: '' })
				.then(res => {
					var dataSource = {
						rowCount: null,
						getRows: (params) => {
							setTimeout(() => {
								params.successCallback(res['result'].data, res['result'].data.length);
							}, 20);
						}
					}
					params.api.setServerSideDatasource(dataSource);
				})
		},
		onCellClicked: (params) => {
			if (params.colDef.field == 'percentage' || params.colDef.field == 'status') {
				if (params.value != params.data[params.colDef.field]) {
					const indx = _.findIndex(this.params, { id: params.data.id });
					if (indx > -1) this.params[indx] = params.data;
					else this.params.push(params.data)
				}
				if (this.params.length) {
					if (this.snackbarPromise) clearTimeout(this.snackbarPromise);
					this.snackbarPromise = setTimeout(() => {
						this.openSnackBar({ status: 'success', msg: 'Task Statuses Updated Successfully' });
					}, 500);
					this.queueRequest(this.params)
				}
			}
		}
	}

	constructor(
		private _commonService: CommonService,
		private _snackbar: MatSnackBar
	) { }

	ngOnInit() {
	}

	queueRequest(params) {
		if (this.promise) clearTimeout(this.promise);
		this.promise = setTimeout(() => {
			this._commonService.saveApi('saveTaskStatuses', { task_statuses: params })
				.then(res => {
					this.params = [];
				})
		}, 3000);
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
