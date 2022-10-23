import { Component, OnInit, Inject } from '@angular/core';
import { GridOptions, GridApi, RowNode } from 'ag-grid-community';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
	selector: 'app-reorder-services',
	templateUrl: './reorder-services.component.html',
	styleUrls: ['./reorder-services.component.scss']
})
export class ReorderServicesComponent implements OnInit {

	gridApi: GridApi;
	gridOptions: GridOptions = {
		rowHeight: 40,
		animateRows: true,
		columnDefs: [
			{ headerName: "", field: "", rowDrag: true, minWidth: 35, maxWidth: 35, suppressMenu: true },
			{ headerName: "Label", field: "label" },
			{
				headerName: "Type", field: "key", cellRenderer: (params) => {
					return params.value ? params.value.split('_').join(' ') : ''
				}
			}
		],
		rowDragManaged: true,
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],

		defaultColDef: {
			resizable: true
		},
		
		onGridReady: (params) => {
			params.api.sizeColumnsToFit();
			this.gridApi = params.api;

			setTimeout(() => {
				this.gridApi.setRowData(this.data.specs.values);
			}, 20);
		},
		onRowDragEnd: (params) => {
			this.orderedSpecs = [];
			let counter = 0;
			this.gridApi.forEachNode((row: RowNode) => {
				this.orderedSpecs.push({...row.data, ...{order: counter}})
				counter++;
			});
		}
	}
	orderedSpecs: Array<any> = [];

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<ReorderServicesComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() { }

	saveChanges() {
		const params = {
			id: this.data.specs.id,
			jobs_service_revisions_id: this.data.revisionId,
			option_no: this.data.specs.option_no,
			spec_ids: this.orderedSpecs.map(o => o.id),
			type: 'reorder'
		}
		// this._commonService.saveApi('saveJobFormSpec', {})
		this._dialogRef.close({success: true, data: this.orderedSpecs});
	}

}
