import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { Pagination } from '@app/shared/utility/types';
import { FormBuilder, FormControl } from '@angular/forms';
import { GridOptions, GridApi } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

import * as _ from 'lodash';

@Component({
	selector: 'app-add-spec-dialog',
	templateUrl: './add-spec-dialog.component.html',
	styleUrls: ['./add-spec-dialog.component.scss']
})
export class AddSpecDialogComponent implements OnInit {

	@ViewChild('agGrid') agGrid: AgGridAngular;

	params: Pagination = {
		page: 1,
		pageSize: 50,
		status: true
	}
	isLoading: boolean = true;
	gridSearch: string = '';
	gridType: string = '';
	specs: Array<any> = [];
	gridApi: GridApi;

	UIElements: Array<any> = [
		{ id: '', name: 'All Specs' },
		{ id: 'auto_suggest', name: 'Auto Suggest' },
		{ id: 'multiple_choice', name: 'Multiple Choice' },
		{ id: 'dropdown', name: 'Drop Down' },
		{ id: 'paragraph_text', name: 'Paragraph Text' },
		{ id: 'single_line_text', name: 'Single Line Text' },
		{ id: 'checkboxes', name: 'Checkboxes' },
		{ id: 'number', name: 'Number' },
		{ id: 'group', name: 'Group' }
	]

	type = new FormControl('');

	gridOptions: GridOptions = {
		rowHeight: 35,
		columnDefs: [
			{
				headerName: 'Label',
				field: 'label',
				cellRenderer: "agGroupCellRenderer",
				cellRendererParams: { checkbox: true },
				sort: 'asc',
				sortingOrder: ["asc", "desc"]
			}, {
				headerName: 'Type',
				field: 'type'
			}
		],
		defaultColDef: {
			sortable: true
		},
		rowData: [],
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,

		suppressNoRowsOverlay: false,
		localeText: { noRowsToShow: 'No Specs Found' },

		rowSelection: 'multiple',
		isExternalFilterPresent: () => { return true },
		doesExternalFilterPass: (o) => {
			if (this.gridType)
				return o.data.label.toLowerCase().indexOf(this.gridSearch.toLowerCase()) > -1 && o.data.key == this.gridType;
			return o.data.label.toLowerCase().indexOf(this.gridSearch.toLowerCase()) > -1;
		},
		onGridReady: (params) => {
			this.gridApi = params.api;
			params.api.sizeColumnsToFit();
		},
		onFilterChanged: (params) => {
			if (params.api.getDisplayedRowCount() == 0) {
				this.gridApi.showNoRowsOverlay();
			}
			else this.gridApi.hideOverlay();
		}
	}

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<AddSpecDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if(data.spec_ids) this.params['spec_ids'] = data.spec_ids.join(',');
		else delete this.params['spec_ids'];
		this.type.valueChanges.subscribe(val => {
			this.gridType = val;
			this.gridApi.onFilterChanged();
		})
	}

	ngOnInit() {
		this.params['type'] = this.data.type;
		this.params['form_id'] = this.data.id;
		this.getSpecs();
	}

	getSpecs() {
		this.isLoading = true;
		this.adminService.getApi('getSpecsDropDown', this.params)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.gridOptions.rowData = res.result.data;
				}
			})
	}

	promise: any = undefined;
	saveDetails() {
		if(!this.promise) {
			const specs = this.agGrid.api.getSelectedNodes().map((o) => o.data);
			const param = {
				type: 'add',
				spec_ids: specs.map((p) => p.id),
				values: []
			}
			if (this.data.type == 2) param['equip_ctg_id'] = this.data.id;
			else if (this.data.type == 3) param['generic_id'] = this.data.id;
			specs.map((data, i) => {
				const obj = {
					id: data.id,
					settings: {},
					layout: this.data.layout || ''
				}
				if (data.key == 'checkboxes') {
					obj['value'] = data.value ? data.value : [];
				} else if (data.key == 'group') {
					obj['value'] = data.value ? data.value : [];
				} else {
					obj['value'] = (data.template_id == 3 || data.template_id == 1) ? data.value || [] : data.value || '';
				}
				param.values.push(obj)
			})
			if (specs.length) {
				if (this.data.url) {
					this.promise = this.adminService.saveApi(this.data.url, param)
						.then(res => {
							this.promise = undefined;
							if (res.result.success) {
								this.dialogRef.close({ success: true, data: { spec_ids: param.spec_ids, specs: res.result.data, values: param.values } });
							}
						})
						.catch(err => {
							this.promise = undefined;
						})
				} else {
					this.promise = this.adminService.getApi('getSpecifications', { ids: param.spec_ids.toString() })
						.then(res => {
							if (res.result.success) {
								res.result.data.items.map((o, i) => {
									o.index = this.data.total + i;
									const obj = {
										id: o.id,
										settings: o.settings,
										layout: this.data.layout || 1
									}
									if (o.key == 'checkboxes') {
										obj['value'] = {};
									} else if (o.key == 'group') {
										obj['value'] = [];
									} else {
										obj['value'] = o.template_id == 3 ? o.value || [] : o.value || '';
									}
									o.form_save_values = obj;
								})
								this.dialogRef.close({ success: true, data: { spec_ids: param.spec_ids, specs: res.result.data.items } });
							}
							this.promise = undefined;
						})
						.catch(err => {
							this.promise = undefined;
						})
				}
			} else {
				// selected atleast one id
			}
		}
	}

	search(val) {
		this.gridSearch = val;
		// this.gridApi.onFilterChanged();
		this.gridApi.setQuickFilter(val);
	}

}
