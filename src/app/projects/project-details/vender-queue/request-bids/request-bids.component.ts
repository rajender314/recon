import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ApiCallBase } from '@app/shared/utility/config';
import { forkJoin } from 'rxjs';
import { CommonService } from '@app/common/common.service';
import { buildForm } from '@app/admin/admin.config';
import { Router } from '@angular/router';
import { GridOptions, GridApi, RowNode } from 'ag-grid-community';

import * as _moment from 'moment';
import { OwlDateTimeComponent } from 'ng-pick-datetime';

var APP: any = window['APP'];

@Component({
	template: `
    <div [class]="params.data.type">
      <span>
        <i *ngIf="params.data.type == 'product'" class="pixel-icons icon-products"></i>
        <i *ngIf="params.data.type == 'service'" class="pixel-icons icon-orders" ></i>
        {{params.value}}
      </span>
    </div>`,
	styles: [`
    .product{
      display: flex;justify-content: space-between;align-items: center;
    }
    .icon-orders, .icon-cancelled-services{   
      color: #dc4f66;font-size: 16px;height: 16px;width: 16px;margin-right: 2px;
      position: relative;top: 3px; 
    }
    .icon-vendor-shape{   
      color: rgba(23,43,77,0.5);font-size: 18px;height: 18px;width: 18px;
      margin-right: 1px;position: relative;top: 3px;
   }
    .product span:nth-child(1){text-overflow: ellipsis;overflow: hidden;white-space: nowrap;}
    .product span:nth-child(2){
      height: 16px;border-radius: 2px;background: #ebedf9;padding: 0 2px;
      font-size: 10px;font-weight: 600;color: rgba(23, 43, 77, 0.6);letter-spacing: 0.5px;
      display:flex;align-items:center;
    }
    .product span:nth-child(2):hover{
      color: rgba(23, 43, 77, 0.8);
    }
    .avg,.service{padding-left: 0px;}
    .avg{text-align: right;}
    .service{overflow: hidden;white-space: nowrap;text-overflow: ellipsis;}
  `]
})

export class ProductServiceCell {
	params: any;
	agInit(params) {
		this.params = params;
	}
}

@Component({
	template: `<ng-container *ngIf="params.data && params.data.type == 'service'">
			<pi-form-field [label]=" " class="date-field plain-date-field">
				<input pi-input matInput [min]="minDate" [max]="maxDate" [owlDateTime]="picker" 
					[(ngModel)]="value" [owlDateTimeTrigger]="picker" (dateTimeChange)="onSelectChange()" 
					placeholder="Choose a date" readonly>
				<div class="owl-picker-toggle">
					<i class="pixel-icons icon-calendar" [owlDateTimeTrigger]="picker"></i>
				</div>
				<owl-date-time #picker [hour12Timer]="true"></owl-date-time>
			</pi-form-field>
		</ng-container>`,
	styles: [`
	::ng-host {
		display: flex;
	}
	.date-field {
		margin: 0;
		width: 100%;
	}
	.owl-picker-toggle{
		left: 0;
		top: 0;
		right: 100%;
	}
`]
})

export class VendorDateCell {
	@ViewChild('picker', { read: OwlDateTimeComponent }) picker: OwlDateTimeComponent<Date>;
	params: any;
	value: any;
	minDate = new Date();
	maxDate = null;
	agInit(params) {
		this.params = params;
		if (this.params.data.type == 'service')
			if (!this.params.value) this.params.setValue(_moment().format('YYYY-MM-DD hh:mm:ss A'));
		this.value = this.params.value ? new Date(this.params.value) : new Date();
	}
	openPicker() {
		setTimeout(() => {
			this.picker.open()
		}, 20);
	}
	onSelectChange(): void {
		this.params.setValue(_moment(this.value).format('YYYY-MM-DD hh:mm:ss A'));
	}
}

@Component({
	template: `<ng-container>
			<pi-form-field [label]=" " class="date-field plain-date-field">
				<input pi-input matInput [min]="minDate" [max]="maxDate" [owlDateTime]="picker" 
					[(ngModel)]="value" [owlDateTimeTrigger]="picker" (dateTimeChange)="onSelectChange()" 
					placeholder="Choose a date" readonly>
				<div class="owl-picker-toggle">
					<i class="pixel-icons icon-calendar" [owlDateTimeTrigger]="picker"></i>
				</div>
				<owl-date-time #picker [hour12Timer]="true"></owl-date-time>
			</pi-form-field>
		</ng-container>`,
	styles: [`
	::ng-host {
		display: flex;
	}
	.date-field {
		margin: 0;
		width: 100%;
	}
	.owl-picker-toggle{
		left: 0;
		top: 0;
		right: 100%;
	}
`]
})

export class VendorHeaderDateCell {
	params: any;
	value: any;
	minDate = new Date();
	maxDate = null;
	agInit(params) {
		this.params = params;
		this.value = this.params.value ? new Date(this.params.value) : null
	}
	onSelectChange(): void {
		this.params.api.forEachNode((node: RowNode) => {
			if (node.data && node.data.type == 'service') {
				node.data.bid_deadline = _moment(this.value).format('YYYY-MM-DD hh:mm:ss A');
				node.setData(node.data);
			}
		})
	}
}


@Component({
	selector: 'app-request-bids',
	templateUrl: './request-bids.component.html',
	styleUrls: ['./request-bids.component.scss']
})
export class RequestBidsComponent implements OnInit {

	@ViewChild('stepper') stepper: ElementRef;

	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	allowedMimeType = ['.jpeg', '.jpg', '.png', '.zip', '.tiff', '.bmp', '.pptx', '.ppsm', '.ppsx', '.ppt', '.pptm', '.txt', '.rar', '.gif', '.mp4', '.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.pdf', '.svg'];
	allowedFileType = ["image", "pdf", "txt", "doc", "docx", "xls", "xlsx", "compress"];
	uploader: FileUploader = new FileUploader({
		allowedFileType: this.allowedFileType,
		isHTML5: true,
		url: this.uploadUrl,
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	hasDropZoneOver: boolean = false;
	uploadData = {
		error: '',
		files: []
	}

	formGroup: FormGroup;

	formFields = [
		{ key: 'id', label: 'Id', type: 'none', default: '' },
		{ key: 'message', label: 'Message', type: 'text', default: null },
		{ key: 'files', label: 'Attachments', type: 'select', multi: true, options: 'jobFiles', default: [] }
	];

	dropdowns = {
		jobFiles: []
	};

	apiCalls: Array<ApiCallBase> = [
		{ key: 'jobFiles', url: 'getFilesLists', responseKey: 'files', method: 'get', params: { jobs_id: this.data.params.jobs_id, type: 'dropdown' } }
	];

	promise: any;

	gridApi: GridApi;
	gridData: Array<any> = [];
	gridOptions: GridOptions = {
		rowHeight: 40,
		headerHeight: 38,
		columnDefs: [
			{
				headerName: '', field: 'revision', minWidth: 40, maxWidth: 40, cellRenderer: params => {
					return params.data && params.data.type == 'service' ? 'R' + params.value : '';
				}
			},
			{ headerName: 'Bids Due', field: 'bid_deadline', cellRendererFramework: VendorDateCell, headerComponentFramework: VendorHeaderDateCell }
		],
		groupDefaultExpanded: -1,
		animateRows: true,
		suppressAggFuncInHeader: true,
		autoGroupColumnDef: {
			headerName: 'All Products & Services',
			field: 'name',
			cellRenderer: 'agGroupCellRenderer',
			cellRendererParams: {
				innerRendererFramework: ProductServiceCell,
				suppressCount: true
			}
		},

		treeData: true,
		getDataPath: data => {
			return data.hireracy;
		},
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		icons: {
			groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
			groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
		},
		onGridReady: params => {
			this.gridApi = params.api;
			this.getVendorServiceBids(() => {
				this.gridApi.sizeColumnsToFit();
			});
		}
	}

	constructor(
		private _route: Router,
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private dialogRef: MatDialogRef<RequestBidsComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		this.uploader
			.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
				if (item.size >= options.maxFileSize) this.uploadData.error = 'Exceeds Max. Size';
				else this.uploadData.error = 'Invalid File Upload';
			}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					let type = obj.result.data.original_name.split('.').pop();
					this.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
					this.uploadData.error = '';
				}
			}
	}

	ngOnInit() {
		if (this.apiCalls) this.getApiCalls(this.apiCalls);
		this.createForm();
	}

	getApiCalls(arr) {
		let apiCalls = [];
		arr.map(api => {
			if (api.method == 'get')
				apiCalls.push(this._commonService.getApi(api.url, api.params))
			else if (api.method == 'post')
				apiCalls.push(this._commonService.saveApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					if (o['result'].success) {
						if (arr[i].responseKey) {
							this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
						} else {
							this.dropdowns[arr[i].key] = o['result'].data || [];
						}
					}
				});
			})
	}

	createForm() {
		this.formGroup = this._fb.group(buildForm(this.formFields));
	}

	getVendorServiceBids(cb?) {
		this._commonService.saveApi('getVendorServicesBidDeadline', {
			job_id: this.data.params.jobs_id,
			vendor_ids: this.data.params.vendor_ids,
			added_from: true
		})
			.then(res => {
				if (res['result'].success) {
					this.gridData = this.treeData(res['result'].data.products || []);
					this.gridApi.setRowData(this.gridData);
					if (cb) setTimeout(() => {
						cb();
					}, 200);
				}
			})
	}

	treeData(data) {
		let arr = [];
		data.map(o => {
			arr.push({ ...o, ...{ hireracy: [o.id], type: 'product' } })
			if (o.services.length) {
				o.services.map(s => {
					arr.push({ ...s, ...{ hireracy: [o.id, s.job_service_revisions_id], type: 'service' } })
				})
			}
		})
		return arr;
	}

	sendRequest() {
		if (!this.promise) {
			let params = [];
			this.gridApi.forEachNode((node: RowNode) => {
				if (node.data && node.data.type == 'service') {
					params.push({
						job_service_revisions_id: node.data.job_service_revisions_id,
						bid_deadline: node.data.bid_deadline
					})
				}
			})
			this._commonService.update({ type: 'overlay', action: 'start' });
			this.promise = this._commonService.saveApi('saveRequestBids', {
				...this.data.params,
				...{ bids: params, message_data: { ...this.formGroup.value, attachment: this.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } }) } }
			})
				.then(res => {
					if (res['result'].success)
						this.dialogRef.close({ success: true, data: null });
					else this.promise = undefined;
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
				.catch(err => {
					this.promise = undefined;
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
		}
	}

	removeAttachment(i) {
		this.uploadData.files.splice(i, 1);
	  }
}
