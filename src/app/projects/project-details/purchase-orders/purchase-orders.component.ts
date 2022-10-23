import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { GridOptions, GridApi, ColumnApi, RowNode, ColDef } from 'ag-grid-community';
import { Subscription, forkJoin } from 'rxjs';
import { AddPoComponent } from '@app/projects/project-details/purchase-orders/add-po/add-po.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { buildForm, updateForm } from '@app/admin/admin.config';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import * as _ from 'lodash';
import * as _moment from 'moment';
import { AddMilestoneComponent } from '@app/projects/project-details/purchase-orders/add-milestone/add-milestone.component';
import { ChangeAddressComponent } from '@app/projects/change-address/change-address.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { agGridColumnAutoFit, ProjectSubNav, agGridDateSort, agGridNumberSort } from '@app/shared/utility/config';
import { UploadInvoiceComponent } from './upload-invoice/upload-invoice.component';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { HttpClient } from '@angular/common/http';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';
import { RequestApprovalComponent } from './request-approval/request-approval.component';
import { ProjectDetailsService } from '../project-details.service';

var APP: any = window['APP'];

@Component({
	template:
		`<div class="user-media">
	<div class="figure">
	<pi-icon name="icon-vendor-shape" size="lg" background="#e6753d" color="#fff"></pi-icon> 
	</div>
	<div class="user-media-body line-height-2 long-and-truncated">
	  <div class="estimate-no-status">
		<p class="user-name color-dark medium-font"  >
		  <a  >{{params.value}}</a>
		</p>
	  </div>
	  <small matTooltip="{{params.data.po_no}}">{{params.data.po_no}}</small>
	</div>    
  </div>`,
	styles: [`
	  .pi-form-field.checkbox{
		  margin-top:4px;
	  }
	  .estimate-no-status{
		display: flex;
		align-items: center;
	  }
	  .status{
		height: 18px;
		display: flex;
		align-items: center;
	  }
	`]
})
export class POCheck implements OnInit {
	// <div class="user-product-service"><span class="d-flex align-items-center"><i class="pixel-icons icon-products"></i><span>{{params.data.product_cnt}}</span></span> <span class="d-flex align-items-center m-l-15"><i class="pixel-icons icon-orders"></i><span>{{params.data.services_cnt}}</span></span></div>
	public params: any;
	public checkbox = false;

	constructor() { }

	ngOnInit() {
	}

	agInit(params: any): void {
		this.params = params;
	}

}

@Component({
	selector: 'app-purchase-orders',
	templateUrl: './purchase-orders.component.html',
	styleUrls: ['./purchase-orders.component.scss'],
	providers: [SafeHtmlPipe],
	host: {
		//class: 'app-purchase-orders'
	}
})
export class PurchaseOrdersComponent implements OnInit, OnDestroy {
	APP = APP;
	isVisible: boolean = false;
	enableHold: boolean = false;
	enableApprove: boolean = false;
	gridApi: GridApi;
	gridColumnApi: ColumnApi;
	gridOptions: GridOptions = {
		rowHeight: 62,
		headerHeight: 38,

		sortingOrder: ["asc", "desc"],
		animateRows: true,

		columnDefs: [
			{
				headerName: 'VENDOR / PO NUMBER', field: 'vendor_name',
				headerCheckboxSelection: true,
				headerCheckboxSelectionFilteredOnly: true,
				checkboxSelection: true,
				cellRendererFramework: POCheck,
				minWidth: 220,
				// cellRenderer: 'agGroupCellRenderer',
				// cellRendererParams: {
				// 	checkbox: true,
				// 	innerRenderer: params => {
				// 		return `<div class="user-media">
				// 		<div class="figure">
				// 		<pi-icon name="icon-vendor-shape" size="lg" background="#e6753d" color="#fff"></pi-icon> 
				// 		</div>
				// 		<div class="user-media-body line-height-2 long-and-truncated">
				// 		  <div class="estimate-no-status">
				// 			<p class="user-name color-dark medium-font"  >
				// 			  <a  >${params.value}</a>
				// 			</p>
				// 		  </div>
				// 		  <small matTooltip="${params.data.po_no}">${params.data.po_no}</small>
				// 		</div>    
				// 	  </div>`;
				// 		// return ' <i class="pixel-icons icon-vendor-shape"></i><b>' + params.value + '</b>';
				// 	}
				// }, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true
			},
			{
				headerName: 'STATUS', field: 'po_status_id',
				minWidth: 140,
				cellRenderer: params => {
					return '<div><span class="status po_status status_' + params.data.po_status_id + '">' + params.data.po_status_name + '</span></div>';
				}
			},
			{ headerName: 'ISSUE DATE', minWidth: 120, field: 'issue_date' },
			{ headerName: 'PROCESS DATE', minWidth: 120, field: 'process_date', sort: 'desc' },
			{
				headerName: 'TOTAL AMOUNT', minWidth: 140, field: 'value', headerClass: 'right-text-cell', cellClass: 'right-text-cell color-dark medium-font', cellStyle: { textAlign: 'right' }, cellRenderer: params => {
					return params.value ? '$ ' + this.formatNumber(parseFloat(params.value).toFixed(2)) : '--';
				}, comparator: agGridNumberSort
			},
			{
				headerName: 'ACTUAL AMOUNT', minWidth: 140, headerClass: 'right-text-cell', cellClass: 'right-text-cell color-dark medium-font', field: 'actual_amount', cellStyle: { textAlign: 'right' }, cellRenderer: params => {
					return params.value ? '$ ' + this.formatNumber(parseFloat(params.value).toFixed(2)) : '--';
				}, comparator: agGridNumberSort
			}
		],

		defaultColDef: {
			suppressMenu: true,
			resizable: true,
			sortable: true
		},

		suppressDragLeaveHidesColumns: true,
		rowSelection: 'multiple',

		pagination: true,

		rowData: [],
		onGridReady: (params) => {
			this.isVisible = false;
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
			if (this.state.poList.length) {
				this.gridApi.setRowData(this.state.poList);
				setTimeout(() => {
					// agGridColumnAutoFit(this.gridApi, this.gridColumnApi, false);
					this.isVisible = true;
				}, 20);
				if (this.gridColumnApi.getAllDisplayedColumns.length) {
					this.gridColumnApi.autoSizeColumns([this.gridColumnApi.getAllDisplayedColumns[0].colDef]);
				}
				this.gridApi.sizeColumnsToFit();
			}
			// window.onresize = () => {
			// 	agGridColumnAutoFit(this.gridApi, this.gridColumnApi, false);
			// };
		},
		onSelectionChanged: () => {
			this.enableHold = false;
			this.enableApprove = false;
			let draftLIst = _.filter(this.gridApi.getSelectedRows(), (po) => {
				if (po.po_status_id == 1) {
					return true;
				}
				return false;
			});
			let holdLIst = _.filter(this.gridApi.getSelectedRows(), (po) => {
				if (po.po_status_id == 2) {
					return true;
				}
				return false;
			});
			if (draftLIst.length == this.gridApi.getSelectedRows().length) {
				this.enableHold = true;
			}
			if (holdLIst.length == this.gridApi.getSelectedRows().length) {
				this.enableApprove = true;
			}
			if (this.enableHold) {
				this.state.POActions[0].show = true;
				this.state.POActions[1].show = APP.permissions.job_access.approve_all_pos == 'yes';
			} else if (this.enableApprove) {
				this.state.POActions[0].show = false;
				this.state.POActions[1].show = APP.permissions.job_access.approve_all_pos == 'yes';
			} else {
				this.state.POActions[0].show = false;
				this.state.POActions[1].show = APP.permissions.job_access.approve_all_pos == 'yes' && false;
			}
		},
		onRowClicked: params => {
			this.state.selectedPO = params.data;
			this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders/' + this.state.selectedPO.id]);
		}
	}

	state = {
		loader: true,
		projectID: null,
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
		],
		POActions: [
			{ key: 'hold', show: true, label: 'Hold' },
			{ key: 'approve', show: (APP.permissions.job_access.approve_all_pos == 'yes') ? true : false, label: 'Approve' }
		],
		poList: [],
		poStatuses: [],
		jobInfo: null,
		selectedPO: null,
		allowEditable: false
	}



	subNav: ProjectSubNav = {
		icons: 'icon-pn-purchase-orders',
		title: 'Back to Project',
		allText: 'All Purchase Orders',
		className: 'po',
		noData: 'No Purchase Orders Generated',
		idKey: 'id',
		displayKey: 'po_no',
		statusClass: 'po-status',
		statusIdKey: 'po_status_id',
		statusNameKey: 'po_status_name',
		costKey: 'value',
		prefix: '$',
		list: []
	}


	breadcrumbSubscription: Subscription;
	routerSubscription: Subscription;
	navBarSubscription: Subscription;

	constructor(
		private _route: Router,
		private _router: ActivatedRoute,
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private _dialog: MatDialog,
		private _http: HttpClient,
		private snackbar: MatSnackBar,
		private _projectDetailsService: ProjectDetailsService
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.breadcrumbSubscription = _commonService.onUpdate().subscribe(obj => {
			if (obj && obj.type == 'projectName' && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
				if (APP.permissions.job_access.purchase_order == 'edit') {
					if ([8, 10].includes(obj.data.job_status_id)) {
						this.state.allowEditable = APP.permissions.job_access['post-completion_po'] == 'yes';
					} else {
						this.state.allowEditable = true;
					}
				}
			}
		})

		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			this.getPOList(this.state.projectID);
		});

		this.navBarSubscription = _commonService.onUpdate().subscribe(ev => {
			if (ev.type == 'grid-view') {
				if (ev.data.isActive) this.state.selectedPO = null;
			} else if (ev.type == 'preview') {
				if (!this.state.selectedPO || this.state.selectedPO.id != ev.data.id) {
					this.state.selectedPO = ev.data;
					this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders/' + this.state.selectedPO.id]);
				}
			} else if (ev.type && ev.type == 'distroRefresh') {
				this.getPOList(this.state.projectID);
			}
		})
	}

	ngOnInit() {
		// this.getPOList(this.state.projectID);
	}

	ngOnDestroy() {
		this.breadcrumbSubscription.unsubscribe();
		this.routerSubscription.unsubscribe();
		this.navBarSubscription.unsubscribe();
	}

	formatNumber(number) {
		let x = number.toString().split('.');
		let x1 = x[0];
		x1 = isNaN(x1) ? "0" : Number(x1);
		x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
		return x1 + x2;
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	getPOList(id, cb?) {
		this._commonService.update({ type: 'left-nav-count', data: {} });
		this._commonService.getApi('poLists', { jobs_id: id })
			.then(res => {
				this.state.loader = false;
				if (res['result'].success) {
					this.state.poList = res['result'].data.list || [];
					this.state.poStatuses = res['result'].data.statusDt || [];
					this.subNav.list = this.state.poList;
					this.subNav['selectedItem'] = null;
					this.subNav['count'] = this.state.poList.length;
					if (this.state.poList.length > 1) {
						this._commonService.update({ type: 'sub-nav', data: this.subNav });
					} else if (this.state.poList.length == 1) {
						this.state.selectedPO = this.state.poList[0];
						this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders/' + this.state.selectedPO.id]);
					}
					this._projectDetailsService.setSubNav(this.subNav);
					if (cb) cb(this.state.poList);
				}
			});
	}

	onSearch(val) {
		this.gridApi.setQuickFilter(val);
	}


	confirmationModal(cb) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'recon-dialog',
			width: '570px',
			data: {
				title: 'Add Purchase Order',
				url: '',
				params: {},
				content: `<div class="po-dialog"><div class=""><span class="warning"><i class="pixel-icons icon-exclamation"></i></span></div>
				<div class=""><p>There are no Approved Estimates for this Project. Are you sure you want to add Purchase Order?</p>
				<p>Once an Estimate is Approved you might have to edit the selected options for each Service.</p></div></div>`
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) cb();
			})
	}

	addPo(isNew = true) {
		this._commonService.getApi('chkPoEstStatus', { jobs_id: this.state.projectID })
			.then(res => {
				if (res['result'].success) {
					if (res['result'].data.checkStatus) {
						this.addPoModal(isNew);
					} else {
						this.confirmationModal(() => {
							this.addPoModal(isNew);
						});
					}
				}
			})
	}

	addPoModal(isNew) {
		this._dialog.open(AddPoComponent, {
			panelClass: ['full-width-modal', 'full-modal-box-ui'],
			maxWidth: '100vw',
			width: '100vw',
			height: '100vh',
			disableClose: true,
			data: {
				title: 'Add Purchase Order',
				jobs_id: this.state.projectID,
				isNew: isNew,
				vendor: !isNew ? { id: this.state.selectedPO.vendor_id, name: this.state.selectedPO.vendor_name } : null,
				POId: !isNew ? this.state.selectedPO.id : null,
				breadcrumbs: [...this.state.breadcrumbs, ...[{ label: 'purchase-orders', type: 'link', route: '/projects/' + this.state.projectID + '/purchase-orders' }]]
			}
		}).afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.snackbar.openFromComponent(SnackbarComponent, {
						data: { status: 'success', msg: 'Purchase Order Created Successfully' },
						verticalPosition: 'top',
						horizontalPosition: 'right'
					});

					if (isNew) {
						this.getPOList(this.state.projectID, (data = []) => {
							if (this.state.poList.length > 1) this.gridApi.setRowData(data);
							const selected = _.find(this.state.poList, ['id', res.data]);
							if (selected) {
								this.state.selectedPO = selected;
								this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders/' + this.state.selectedPO.id]);
							}
						})
					}
				}
			});
	}

	performActions(key) {
		let locals: any = {}
		const ids = this.gridApi.getSelectedNodes().map(o => o.data.id);
		var params = {
			ids: ids,
			po_status_id: null,
			type: null,
			multi: true
		}
		if (key == 'hold') {
			var status = _.find(this.state.poStatuses, ['name', 'Hold']);
			if (status) {
				params.po_status_id = status.id;
				params.type = status.slug;
			}
			locals = {
				title: 'Hold Selected PO(s)',
				url: 'updatePoStatus',
				method: 'post',
				params: params,
				content: `<div class="po-dialog">
										<div class="">
											<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
										</div>
										<div class="">
											<p>Are you sure, you want to hold selected PO(s)</p>
										</div>
									</div>`,
				buttonText: 'Hold'
			};
			this.confirmModal(locals, () => {
				this.gridApi.getSelectedNodes().map((o: RowNode) => {
					o.data.po_status_id = 2;
					o.data.po_status_name = 'Hold';
					o.setData(o.data);
					this._projectDetailsService.update({ type: 'subnav-status', data: { selected: o.data } });
				})
				this.gridApi.deselectAll();
			});
		} else if (key == 'approve') {
			var status = _.find(this.state.poStatuses, ['name', 'Approved']);
			if (status) {
				params.po_status_id = status.id;
				params.type = status.slug;
			}
			locals = {
				title: 'Approve Selected PO(s)',
				url: 'updatePoStatus',
				method: 'post',
				params: params,
				content: `<div class="po-dialog">
										<div class="">
											<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
										</div>
										<div class="">
											<p>Are you sure, you want to approve selected PO(s)</p>
										</div>
									</div>`,
				buttonText: 'Approve'
			};

			this.confirmModal(locals, () => {
				this.gridApi.getSelectedNodes().map((o: RowNode) => {
					o.data.po_status_id = 4;
					o.data.po_status_name = 'Approved';
					o.setData(o.data);
					this._projectDetailsService.update({ type: 'subnav-status', data: { selected: o.data } });
				})
				this.gridApi.deselectAll();
			});
		}
	}

	confirmModal(locals, cb?) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'recon-dialog',
			width: '570px',
			data: { ...locals }
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) if (cb) cb();
			})
	}

}
