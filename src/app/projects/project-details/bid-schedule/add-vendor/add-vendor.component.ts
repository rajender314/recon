import { Component, OnInit, Inject } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GridOptions, GridApi } from 'ag-grid-community';
import { capabilityEquipmentComponent, ProductsServicesComponent } from '@app/projects/post-bids-grid/post-bids-grid.component';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { checkedLength } from '@app/shared/utility/dummyJson';
import { trigger, style, animate, transition } from '@angular/animations';

import * as _ from 'lodash';
import { agGridColumnAutoFit } from '@app/shared/utility/config';
import { DomSearchPipe } from '@app/shared/pipes/dom-search.pipe';
var APP: any = window['APP'];

@Component({
	selector: 'app-add-vendor',
	templateUrl: './add-vendor.component.html',
	styleUrls: ['./add-vendor.component.scss'],
	providers: [DomSearchPipe],
	animations: [
		trigger('slideAnimation', [
			transition(':enter', [
				style({ opacity: 0 }),
				animate('0.45s ease', style({ opacity: 1 }))
			]),
			transition(':leave', [
				style({ opacity: 1 }),
				animate('0.15s ease', style({ opacity: 0 }))
			])
		])
	]
})
export class AddVendorComponent implements OnInit {

	gridApi: GridApi;
	public gridColumnApi;
	gridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight: 38,
		columnDefs: [],
		rowData: [],
		animateRows: true,
		suppressDragLeaveHidesColumns: true,
		groupSelectsChildren: true,
		rowMultiSelectWithClick: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		localeText: { noRowsToShow: 'No Vendors Found' },

		defaultColDef: {
			resizable: true
		},

		pagination: true,

		rowClassRules: {
			'bid-requested': params => { return params.data.products > 0; }
		},

		onGridReady: (params) => {
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
			this.getVendors();
			window.onresize = () => {
				agGridColumnAutoFit(this.gridApi, this.gridColumnApi);
			};
		}
	}

	vendorsList: Array<any> = [];
	isSelectAll: boolean = false;
	unlockButton: boolean = false;
	isOpened: boolean = true;

	gridView: string = 'all';
	gridViewList = [
		{ value: 'all', label: 'All' },
		{ value: 'selected', label: 'Selected' }
	];

	pagination = {
		capabilities_filter: [],
		equipment_filter: [],
		vendor_types_filter: [1] // default print (assing print id)
	}

	filterSelection = [
		{ label: 'AND', value: 'AND' },
		{ label: 'OR', value: 'OR' }
	];
	selectedFilter = 'AND';
	filterKeys: ['capabilities_filter', 'equipment_filter', 'vendor_types_filter'];
	filters = {
		search: {
			capabilities_filter: { placeHolder: 'Search', value: '' },
			equipment_filter: { placeHolder: 'Search', value: '' }
		},
		filterCount: { count: 0 },
		selectAll: {
			capabilities_filter: false,
			equipment_filter: false,
			vendor_types_filter: false
		},
		capabilities_filter: {},
		equipment_filter: {},
		vendor_types_filter: { 1: true }
	}
	dropdowns = {
		capabilities_filter: [],
		equipment_filter: [],
		vendor_types_filter: []
	};
	apiCalls = [
		{ key: 'capabilities_filter', method: 'get', url: 'capabilities', params: { status: true }, responseKey: 'items' },
		{ key: 'equipment_filter', method: 'get', url: 'equipmentCategory', params: { status: true }, responseKey: 'items' },
		{ key: 'vendor_types_filter', method: 'get', url: 'VendorTypes', params: { status: true }, responseKey: 'vendor_types' }
	];

	promise: any;

	constructor(
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<AddVendorComponent>,
		private _domSearch: DomSearchPipe,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		if (this.apiCalls) this.getApiCalls(this.apiCalls);
		this.setColumnDefs();
	}
	toggle() {
		this.isOpened = !this.isOpened;
	}

	closeDialog() {
		this._dialogRef.close();
	}

	getName(prop): string {
		const selected = _.find(this.dropdowns[prop], ['id', this.pagination[prop][0]]);
		if (selected)
			return selected.name
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
					if (arr[i].responseKey) {
						this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
					} else {
						this.dropdowns[arr[i].key] = o['result'].data || [];
					}
				});
			})
	}

	changeGrid(val) {
		const selected_ids = this.gridApi.getSelectedRows().map(o => o.id);
		if (val == 'all') {
			this.gridApi.setRowData(this.vendorsList);
			this.defaultCheckForms(selected_ids, this.gridApi);
		} else if (val == 'selected') {
			const data = this.gridApi.getSelectedRows().map(o => o);
			this.gridApi.setRowData(data);
			this.defaultCheckForms(selected_ids, this.gridApi);
		}
	}

	defaultCheckForms(selectedIds, gridApi) {
		let ids = selectedIds;
		setTimeout(() => {
			gridApi.forEachNodeAfterFilter((node) => {
				if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
					node.setSelected(true);
				} else {
					node.setSelected(false);
				}
			});
		}, 100);
	}

	capabilitySearch = {
		placeHolder: "Search",
		value: ''
	}
	equipmentSearch = {
		placeHolder: "Search",
		value: ''
	}

	menuOpened(prop) {
		this.menuActions('search', prop, this.filters.search[prop].value);
	}

	resetFilters() {
		this.filters = {
			search: {
				capabilities_filter: { placeHolder: 'Search', value: this.filters.search.capabilities_filter.value },
				equipment_filter: { placeHolder: 'Search', value: this.filters.search.equipment_filter.value }
			},
			selectAll: {
				capabilities_filter: false,
				equipment_filter: false,
				vendor_types_filter: false
			},
			filterCount: { count: 0 },
			capabilities_filter: {},
			equipment_filter: {},
			vendor_types_filter: { 1: true }
		}
		this.pagination = {
			capabilities_filter: [],
			equipment_filter: [],
			vendor_types_filter: [1]
		};
		this.getVendors();
	}

	menuActions(flag, prop, val = '') {
		if (flag == 'select_all') {
			this.dropdowns[prop].map(o => {
				this.filters[prop][o.id] = this.filters.selectAll[prop];
			})
		} else if (flag == 'clear') {
			this.dropdowns[prop].map(o => {
				delete this.filters[prop][o.id];
			})

			this.filters.selectAll[prop] = false;

			this.saveFilter(prop);
		} else if (flag == 'search') {
			this.filters.search[prop].value = val;
			this.filters.filterCount.count = this._domSearch.transform(this.dropdowns[prop], this.filters.search[prop].value, 'name').length;
		}
	}

	isCheckAll(prop) {
		if (Object.keys(checkedLength(this.filters[prop])).length == this.dropdowns[prop].length) this.filters.selectAll[prop] = true;
		else this.filters.selectAll[prop] = false;
	}

	change(prop) {
		this.isCheckAll(prop);
	}

	saveFilter(prop?) {
		if (prop) this.pagination[prop] = Object.keys(checkedLength(this.filters[prop])).map(Number);
		this.getVendors();
	}

	getVendors() {
		this.gridApi.showLoadingOverlay();
		this._commonService.saveApi('getVendors', {
			job_id: this.data.jobs_id,
			filter_type: this.selectedFilter,
			search: '',
			...this.pagination
		})
			.then(res => {
				this.gridApi.hideOverlay();
				if (res['result'].success) {
					this.vendorsList = res['result'].data;
					this.gridApi.setRowData(this.vendorsList);
					setTimeout(() => {
						agGridColumnAutoFit(this.gridApi, this.gridColumnApi);
					});
				}
			})
	}

	onSearch(val) {
		this.gridApi.setQuickFilter(val);
		if (!this.gridApi.getRenderedNodes().length) this.gridApi.showNoRowsOverlay();
		else this.gridApi.hideOverlay();
	}

	selectAll(status) {
		this.data.bidDeadLines.map(o => {
			o.is_checked = status;
			if (o.services && o.services.length) {
				o.services.map(p => {
					p.is_checked = status;
				})
			}
		})
		this.unlockButton = status;
	}

	isCheckedAll() {
		let counter = 0, childCounter = 0, canEnter = true, childCond = true, hasSelected = false;
		while (canEnter && counter < this.data.bidDeadLines.length) {
			if (!this.data.bidDeadLines[counter].is_checked) {
				canEnter = false;
			} else {
				hasSelected = true;
				if (this.data.bidDeadLines[counter].services && this.data.bidDeadLines[counter].services.length) {
					while (childCond && childCounter < this.data.bidDeadLines[counter].services.length) {
						if (!this.data.bidDeadLines[counter].services[childCounter].is_checked) {
							childCond = false;
						} else hasSelected = true;
						childCounter++;
					}
					childCounter = 0;
					canEnter = childCond;
				}
			}
			counter++;
		}
		this.isSelectAll = canEnter;
		this.enableCondition();
	}

	enableCondition() {
		this.data.bidDeadLines.map(p => {
			if (p.is_checked) this.unlockButton = true;
			else {
				p.services.map(s => {
					if (s.is_checked) this.unlockButton = true;
				})
			}
		});
	}

	checkProduct(item) {
		if (item.services && item.services.length) {
			item.services.map(o => {
				o.is_checked = item.is_checked;
			})
		}
		this.isCheckedAll();
	}

	checkService(item, parent) {
		if (item.is_checked) {
			parent.is_checked = true;
		} else {
			let parentChk = false;
			parent.services.map(o => {
				if (o.is_checked) parentChk = true;
			});

			parent.is_checked = parentChk;
		}

		this.isCheckedAll();
	}

	addToQueue() {
		let vendors = [], services = [];
		if (!this.promise) {
			this.gridApi.getSelectedRows().map(o => {
				vendors.push({
					id: o.id,
					addresses_id: o.addresses_id,
					address_types_id: o.address_types_id
				})
			})

			this.data.bidDeadLines.map(o => {
				if (o.is_checked) {
					o.services.map(p => {
						if (p.is_checked)
							services.push(p.job_service_revisions_id)
					})
				}
			})
			this._commonService.update({ type: 'overlay', action: 'start' });
			this.promise = this._commonService.saveApi('saveVendorsQue', {
				jobs_id: this.data.jobs_id,
				selectedVendors: vendors,
				services: services
			})
				.then(res => {
					if (res['result'].success) {
						this._dialogRef.close({ success: true, data: true });
					} else {
						this.promise = undefined;
					}
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
				.catch(err => {
					this.promise = undefined;
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
		}
	}

	setColumnDefs() {
		this.gridOptions.columnDefs = [
			{
				headerName: 'Vendor Name', cellClass: 'vendorname-grid', field: 'name', minWidth: 450, cellRenderer: 'agGroupCellRenderer', cellRendererParams: {
					checkbox: (p) => {
						return this.checkPermission();
					},
					innerRenderer: (params) => {
						return '<span casss="product"><i style="color: #67c6b0" class="pixel-icons icon-vendor-shape"></i><b><span>' + params.value + '</span></b> </span>';
					}
				}, headerCheckboxSelection: (p) => {
					return this.checkPermission();
				}, headerCheckboxSelectionFilteredOnly: true
			},
			{
				headerName: '', field: 'products_services', cellClass: "products-services-grid", cellRendererFramework: ProductsServicesComponent, cellRendererParams: {
					jobs_id: this.data.jobs_id,
					edit: false
				},
			},
			{ headerName: 'City', field: 'city' },
			{ headerName: 'State', field: 'state' },
			{ headerName: 'Country', field: 'country' },
			{ headerName: '', field: 'capability_equipment', cellClass: "capability-equipment-grid", cellRendererFramework: capabilityEquipmentComponent, maxWidth: 80 }
		];
	}

	checkPermission() {
		if (this._commonService.job_status_id == 8 || this._commonService.job_status_id == 10) {
			if (APP.permissions.job_access['post-completion_estimate'] != 'yes') {
				return false;
			}
		}else if(this._commonService.job_status_id == 5){
			if (APP.permissions.job_access['edit_cancelled_jobs'] != 'yes') {
				return false;
			}
		}
		return true;
	}
}
