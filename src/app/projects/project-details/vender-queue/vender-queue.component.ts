import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GridOptions, GridApi } from 'ag-grid-community';
import { ProductsServicesComponent, capabilityEquipmentComponent, SendScheduleHeaderCell, SendScheduleRowCell } from '@app/projects/post-bids-grid/post-bids-grid.component';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { MatDialog } from '@angular/material';
import { RequestBidsComponent } from './request-bids/request-bids.component';
var APP = window['APP'];
@Component({
	selector: 'app-vender-queue',
	templateUrl: './vender-queue.component.html',
	styleUrls: ['./vender-queue.component.scss']
})
export class VenderQueueComponent implements OnInit, OnDestroy {
	APP = APP;
	public confirmationRef: any;
	state = {
		projectID: null,
		job_status_id: null,
		loader: true,
		title: 'Vendor Queue',
		gridView: 'all',
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
			/* { label: 'Vendor Queue', type: 'text' }, */
		],
		gridViewList: [
			{ value: 'all', label: 'All' },
			{ value: 'selected', label: 'Selected' },
		],
		vendorQueue: []
	}
	/*status*/
	isVisible: boolean = false;
	gridApi: GridApi;
	public gridColumnApi;
	public allowEditable: boolean;
	gridOptions: GridOptions = {
		rowHeight: 38,
		columnDefs: [],
		rowData: [],
		animateRows: true,
		suppressDragLeaveHidesColumns: true,
		groupSelectsChildren: true,
		suppressRowClickSelection:false,
		rowMultiSelectWithClick: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		localeText: { noRowsToShow: '<div class="no-data" style="font-size:14px;">No Vendors in Queue</div>' },
		pagination: true,
		onGridReady: (params) => {
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
			this.gridApi.setRowData(this.state.vendorQueue);
			// if(this.gridColumnApi.getAllDisplayedColumns.length){
			// 	this.gridColumnApi.autoSizeColumns([this.gridColumnApi.getAllDisplayedColumns[0].colDef]);
			// }
			setTimeout(() => {
				this.isVisible = true;
			});
			this.gridApi.sizeColumnsToFit();
		},
		onFilterChanged: params => {
			if (params.api.getDisplayedRowCount() == 0) {
				this.gridApi.showNoRowsOverlay();
			}
			else this.gridApi.hideOverlay();
		}
	}

	subscription: Subscription;
	routerSubscription: Subscription;
	promise: any;

	constructor(
		private _route: Router,
		private _router: ActivatedRoute,
		private _commonService: CommonService,
		private dialog: MatDialog
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			// this.getVendorQueues();
		});

		this.subscription = _commonService.onUpdate().subscribe(obj => {
			if (obj.type == 'projectName' && obj.data && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
				if (obj.data.job_status_id != undefined) {
					this.state.job_status_id = obj.data.job_status_id;
					this.allowEditable = this.checkPermission();
					this.gridOptions.columnDefs = this.setColumnDefs();
					this.gridOptions.suppressRowClickSelection = !this.allowEditable;
					this.getVendorQueues();
				}
			}
		})
	}

	ngOnInit() {
		// this.getVendorQueues();
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.routerSubscription.unsubscribe();
	}

	getVendorQueues() {
		this.state.loader = true;
		this._commonService.saveApi('getVendorsQue', { jobs_id: this.state.projectID })
			.then(res => {
				this.state.loader = false;
				if (res['result'].success) {
					this.state.vendorQueue = res['result'].data || [];
					if (!this.state.vendorQueue.length) {
						this.isVisible = true;
					}
				}
			})
	}

	deleteBids(): void {
		let selectedVendors = [];
		let selectedVendorsList = this.gridApi.getSelectedRows();
		_.map(selectedVendorsList, (value) => {
			selectedVendors.push(value.id);
		});
		this._commonService.update({ type: 'overlay', action: 'start' });
		this._commonService.saveApi('delVendorsQue', {
			jobs_id: this.state.projectID,
			selectedVendors: selectedVendors
		})
			.then(res => {
				if (res['result'] && res['result'].success) {
					selectedVendors.map(o => {
						const indx = _.findIndex(this.state.vendorQueue, ['id', o]);
						if (indx > -1) this.state.vendorQueue.splice(indx, 1);
					})
					this.gridApi.updateRowData({ remove: selectedVendorsList });
					// this.getVendorQueues();
				}
				this._commonService.update({ type: 'overlay', action: 'stop' });
			}).catch(err => {
				this._commonService.update({ type: 'overlay', action: 'stop' });
			});
	}

	onSearch(val) {
		this.gridApi.setQuickFilter(val);
	}

	skipExportRequestBids() {
		let vendors = [];
		this.gridApi.getSelectedRows().map(o => {
			vendors.push({ vendor_id: o.id, jsr_ids: o.jsr_ids });
		});
		this.confirmationRef = this.dialog.open(ConfirmationComponent, {
			panelClass: 'my-dialog',
			width: '500px',
			data: {
				title: 'Skip Export',
				content: 'Are you sure, you want to skip export to Selected Vendor?',
				url: 'saveRequestBids',
				method: 'post',
				params: {
					jobs_id: this.state.projectID,
					selectedVendors: vendors,
					is_skipexport: true
				}
			}
		});

		this.confirmationRef.afterClosed().subscribe(result => {
			if (result && result.success) {
				setTimeout(() => {
					this._route.navigate(['/projects/' + this.state.projectID + '/analyze-bids']);
				}, 500);
			}
		});
	}
	requestBids() {
		let vendors = [];
		let vendor_ids = [];
		this.gridApi.getSelectedRows().map(o => {
			vendor_ids.push(o.id);
			vendors.push({ vendor_id: o.id, jsr_ids: o.jsr_ids, is_schedule: o.schedule });
		});
		this.dialog.open(RequestBidsComponent, {
			panelClass: 'my-dialog',
			width: '700px',
			data: {
				title: 'Request Bids <span class="vendor-count">( ' + (vendors.length > 1 ? vendors.length + ' Vendors' : vendors.length + ' Vendor') + ' )</span>',
				params: {
					jobs_id: this.state.projectID,
					selectedVendors: vendors,
					vendor_ids: vendor_ids
				},
				url: 'saveRequestBids'
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					setTimeout(() => {
						this._route.navigate(['/projects/' + this.state.projectID + '/analyze-bids']);
					}, 500);
				}
			})
	}

	changeGrid(val) {
		const selected_ids = this.gridApi.getSelectedRows().map(o => o.id);
		if (val == 'all') {
			this.gridApi.setRowData(this.state.vendorQueue);
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
	checkPermission() {
		if (this.state.job_status_id == 8 || this.state.job_status_id == 10) {
			if (APP.permissions.job_access['post-completion_estimate'] == 'yes' && APP.permissions.job_access.vendor_queue == 'edit') {
				return true;
			}
		} else if (this.state.job_status_id == 5) {
			if (APP.permissions.job_access['edit_cancelled_jobs'] == 'yes' && APP.permissions.job_access.vendor_queue == 'edit') {
				return true;
			}
		} else if(APP.permissions.job_access.vendor_queue == 'edit'){
			return true;
		}
		return false;
	}

	setColumnDefs() {
		return [
			{
				headerName: 'Vendor Name', width: 300, cellClass: 'vendorname-grid', field: 'name', cellRenderer: 'agGroupCellRenderer', cellRendererParams: {
					checkbox: this.allowEditable,
					innerRenderer: (params) => {
						return '<i style="color: #67c6b0" class="pixel-icons icon-vendor-shape"></i><b>' + params.value + '</b>';
					}
				}, headerCheckboxSelection: this.allowEditable, headerCheckboxSelectionFilteredOnly: true
			},
			{
				headerName: 'Send Schedule', field: 'schedule', width: 145, minWidth: 145, maxWidth: 145, headerComponentFramework: SendScheduleHeaderCell, cellRendererFramework: SendScheduleRowCell, headerComponentParams: {
					selected: true,
					edit: this.allowEditable,
					jobs_id: this.state.projectID
				}
			},
			{
				headerName: '', field: 'products_services', cellClass: "products-services-grid", cellRendererFramework: ProductsServicesComponent, cellRendererParams: {
					edit: this.allowEditable
				}, minWidth: 110, maxWidth: 150
			},
			{ headerName: 'City', field: 'city', minWidth: 100, maxWidth: 150 },
			{ headerName: 'State', field: 'state', minWidth: 100, maxWidth: 120 },
			{ headerName: 'Country', field: 'country', minWidth: 100, maxWidth: 100 },
			{ headerName: '', field: 'capability_equipment', minWidth: 100, maxWidth: 100, cellClass: "capability-equipment-grid", cellRendererFramework: capabilityEquipmentComponent, width: 50 }
		];
	}
}
