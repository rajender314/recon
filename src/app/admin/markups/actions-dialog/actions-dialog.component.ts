import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { GridOptions, GridApi } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';

var APP: any = window['APP'];
@Component({
	selector: 'app-actions-dialog',
	templateUrl: './actions-dialog.component.html',
	styleUrls: ['./actions-dialog.component.scss']
})
export class ActionsDialogComponent implements OnInit {

	public uploadUrl = APP.api_url + 'importMarkups?X-Auth-Token=' + APP.access_token;
	allowedMimeType = ['.pdf', '.xls', '.xlsx'];
	allowedFileType = ["pdf", "xls", "xlsx"];
	public hasDropZoneOver: boolean = false;
	public uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedFileType: this.allowedFileType,
		maxFileSize: 2 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});
	uploadData: any = {};

	fetchingData: boolean = false;
	gridApi: GridApi;
	gridOptions: GridOptions = {
		columnDefs: [
			{
				headerName: 'Organizations',
				field: 'name',
				width: 100,
				cellRenderer: "agGroupCellRenderer",
				cellRendererParams: {
					checkbox: true
				},
				headerCheckboxSelection: true
			}
		],
		animateRows: false,
		enableFilter: true,
		groupSelectsChildren: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		rowHeight: 40,
		rowData: [],
		getNodeChildDetails: this.getNodeChildDetails,

		defaultColDef: {
			resizable: true
		},

		onGridReady: (params) => {
			this.gridApi = params.api;
			params.api.sizeColumnsToFit();
		}
	};

	constructor(
		private commonService: CommonService,
		private dialogRef: MatDialogRef<ActionsDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
			if (item.size >= options.maxFileSize) this.uploadData.validation = { size: true };
			else this.uploadData.error = this.uploadData.validation = { invalid: true };
		}

		this.uploader.onAfterAddingFile = (item) => { }

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				// let obj = JSON.parse(response);
				// if (obj.result.success) {
				// let type = obj.result.data.original_name.split('.').pop();
				// this.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
				// this.uploadData.error = '';
				// }
			}
	}

	ngOnInit() {
		if (this.data.flag == 'clone') this.getOrgs();
	}

	getNodeChildDetails(rowItem) {
		if (rowItem.children) {
			return {
				group: true,
				children: rowItem.children,
				expanded: true,
				key: rowItem.name
			};
		} else {
			return null;
		}
	}

	onSearch(val) {
		this.gridApi.setQuickFilter(val);
	}

	getOrgs() {
		this.fetchingData = true;
		this.commonService.getApi('getOrgs', { status: true, org_type: 2, company_code: this.data.companyCode })
			.then(res => {
				this.fetchingData = false;
				if (res['result'].success) {
					this.gridOptions.rowData = res['result'].data;
				}
			})
	}

	save() {
		this.commonService.saveApi('cloneMarkups', { company_code: this.data.companyCode, org_id: this.data.orgID, selected_orgs: this.gridApi.getSelectedRows().map(o => o.id) })
			.then(res => {
				if (res['result'].success) {
					this.dialogRef.close({ success: true, data: [] });
				}
			})
	}

}
