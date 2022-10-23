import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { GridApi, ColumnApi, GridOptions, RowNode, ColDef } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { agGridColumnAutoFit, ProjectSubNav } from '@app/shared/utility/config';
import { FileUploader, FileLikeObject } from 'ng2-file-upload';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { UploadInvoiceComponent } from '../upload-invoice/upload-invoice.component';
import { HttpClient } from '@angular/common/http';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';

import * as _moment from 'moment';
import * as _ from 'lodash';

import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { forkJoin, Subscription } from 'rxjs';
import { buildForm, updateForm } from '@app/admin/admin.config';
import { ChangeAddressComponent } from '@app/projects/change-address/change-address.component';
import { AddPoComponent } from '../add-po/add-po.component';
import { RequestApprovalComponent } from '../request-approval/request-approval.component';
import { AddMilestoneComponent } from '../add-milestone/add-milestone.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectDetailsService } from '../../project-details.service';
import { AgPiSelect } from '@app/shared/components/ag-grid/custom-cell-editor';

var APP: any = window['APP'];


/* Preview Grid Components */
@Component({
	template: `<div class="include-cost-cell">
					<span class="ag-header-cell-text" [innerHtml]="params.column.colDef.headerName"></span>
					<pi-form-field label=" ">
						<input type="checkbox" pi-input (change)="headerCheck()" [(ngModel)]="params.column.colDef.headerComponentParams.selected" [disabled]="!params.isEditable" />
					</pi-form-field>
				</div>`,
	styles: [`
		.include-cost-cell{display: flex; justify-content: flex-end}
		.include-cost-cell .title{margin-right: 15px;}
		.pi-form-field.checkbox{margin-top:0;}
	`]
})

export class IncludeCostHeaderCell {
	params: any;
	constructor(private _commonService: CommonService, private _snackbar: MatSnackBar) { }
	agInit(params) {
		this.params = params;
	}
	headerCheck() {
		const params = [];
		this.params.api.forEachNode((node: RowNode) => {
			if (node.data) {
				node.data.include_cost = this.params.column.colDef.headerComponentParams.selected;
				node.setData(node.data);
				params.push({
					id: node.data.id,
					is_include_cost: node.data.include_cost
				})
			}
		})
		this.save(params);
	}

	snackbarModal(msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: 'success', msg: msg ? msg : 'Purchase Order Updated Successfully' },
			verticalPosition: 'top',
			horizontalPosition: 'right'
		});
	}

	save(params) {
		this._commonService.saveApi('savePoIncludeCost', { include_cost: params })
			.then(res => {
				if (res['result'].success) {
					this.snackbarModal();
					this._commonService.update({ type: 'invoice-cost-update', data: null });
				}
			})
	}
}

@Component({
	template: `<div class="include-cost-cell">
					<pi-form-field label=" ">
						<input type="checkbox" pi-input (change)="cellCheck()" [(ngModel)]="params.data.include_cost" [disabled]="!params.colDef.headerComponentParams.isEditable" />
					</pi-form-field>
				</div>`,
	styles: ['.include-cost-cell{display: flex;justify-content: flex-end;align-items: center} .pi-form-field.checkbox{margin-top:0;}']
})

export class IncludeCostRowCell {
	params: any;
	constructor(private _commonService: CommonService, private _snackbar: MatSnackBar) { }
	agInit(params: any): void {
		this.params = params;
	}
	cellCheck() {
		this.save([{ id: this.params.data.id, is_include_cost: this.params.data.include_cost }])
		this.isHeaderChecked();
	}
	isHeaderChecked() {
		let rowCount = 0, selectedCount = 0, isEnter = false;
		(<GridApi>this.params.api).forEachNode(p => {
			if (p.data) {
				isEnter = false;
				if (p.data.include_cost) selectedCount++;
				rowCount++;
			}
		})
		if (rowCount == selectedCount && rowCount != 0) {
			this.params.column.colDef.headerComponentParams.selected = true;
		} else {
			this.params.column.colDef.headerComponentParams.selected = false;
		}
	}

	snackbarModal(msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: 'success', msg: msg ? msg : 'Purchase Order Updated Successfully' },
			verticalPosition: 'top',
			horizontalPosition: 'right'
		});
	}

	save(params) {
		this._commonService.saveApi('savePoIncludeCost', { include_cost: params })
			.then(res => {
				if (res['result'].success) {
					this.snackbarModal();
					this._commonService.update({ type: 'invoice-cost-update', data: null });
				}
			})
	}
}
// <span class="spec-icon" (menuOpened)="getSpecs()" [matMenuTriggerFor]="specificationMenu" #specification="matMenuTrigger">s</span>
/* Service Cell Renderer */
@Component({
	template: `<div class="multi-container" *ngIf="params.data">
					<span class="service-title" title="{{params.value}}"><i class="pixel-icons icon-orders"></i>{{params.value}}</span>
				
					<!-- <span [innerHtml]="params.data.revision" class="revision"></span>-->
					<span class="revision">R{{params.data.revision_no}}</span>
					<span class="icon_spec" (menuOpened)="getSpecs()" [matMenuTriggerFor]="specificationMenu" #specification="matMenuTrigger"><i class="pixel-icons notes icon-specs"></i></span>
					<i class="pixel-icons icon-notes"></i>
					<mat-menu #specificationMenu="matMenu" class="onplace-dialog specs-menu  1111 custom-addvendor-small-menu">
							<div class="my-dialog" (click)="$event.stopPropagation();">
								<div class="d-heading">
									<h2>Specifications</h2>
									<button mat-icon-button (click)="specification.closeMenu();">
										<i class="pixel-icons  icon-close-slim"></i>
									</button>
								</div>
								<div class="d-content" [class.is-loading]="isLoading">
									<mat-spinner diameter="45" class="md" *ngIf="isLoading"></mat-spinner>
									<div *ngIf="!isLoading">
									<div class="specs-list-container">
									<ul>
										<li *ngFor="let spec of specifications?.values" class="spec-labels">
											<ng-container>
												<div [innerHtml]="spec.label"></div>
												<div [innerHtml]="spec.value || '---'"></div>
											</ng-container>
										</li>
										</ul>
									</div>
										<div style="height: 100px;  display: flex; align-items: center; justify-content: center;" *ngIf="!specifications?.values.length">No Specifications Found</div>
									</div>
								</div>
							</div>
					</mat-menu>
				</div>`,
	styles: [`
						.icon_spec{display:inline-flex;text-align:center;}
						.icon_spec i.icon-specs{width:16px;height:16px;line-height:16px;margin-right:6px;font-size:16px;opacity:0.6;}
						::ng-deep .onplace-dialog .mat-menu-content ul li:last-child{margin-bottom:15px;}
				`],
})

export class ServiceOptionsCell {
	isLoading: boolean = false;
	params: any;
	specifications: any;
	constructor(
		private _commonService: CommonService
	) { }
	agInit(params) {
		this.params = params;
	}
	getSpecs() {
		this.isLoading = true;
		this._commonService.getApi('jobPrdSpecs', { id: this.params.data.jobs_forms_id, type: 'string' })
			.then(res => {
				this.isLoading = false;
				if (res['result'].success) this.specifications = res['result'].data[0];
				else this.specifications = null;
			})
	}
}

@Component({
	selector: 'app-detail-view',
	templateUrl: './detail-view.component.html',
	styleUrls: ['./detail-view.component.scss']
})
export class DetailViewComponent implements OnInit, OnDestroy {
	APP = APP;
	@ViewChild('messageListSection') private messageListContainer: ElementRef;
	public poThreadId: any;
	state = {
		initialLoading: true,
		isLoading: true,
		isEditable: false,
		allowEditable:false,
		showSideNav: false,
		sideNavView: '',
		projectID: null,
		jobInfo: null,
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
			{ label: 'Purchase Orders', type: 'link', route: '' }
		],
		tabs: [
			{ id: 1, label: 'Purchase Order' },
			{ id: 2, label: 'Vendor Invoices' }
		],
		activeTab: 1,
		detailActions: [
			{ key: 'message', show: true, type: 'icon', icon_name: 'icon-messages', icon_title: 'Discussion', visible: true },
			{ key: 'print', show: true, label: 'Print', type: 'icon', icon_name: 'icon-print', icon_title: 'Print', visible: true },
			{ key: 'upload', show: true, label: 'Upload Invoice', type: 'icon', icon_name: 'icon-upload-new', icon_title: 'Upload Invoice', visible: false },
			{ key: 'edit', show: (APP.permissions.job_access.allow_editing_cost_in_po == 'yes' || APP.permissions.job_access.edit_pos_of_all_departments == 'edit') ? true : false, label: 'Edit', type: 'icon', icon_name: 'icon-pencil', icon_title: 'Edit', visible: true },

			// { key: 'print', show: true, label: 'Print', type: 'icon', icon_name:'icon-print', visible: true },
			{ key: 'export', show: true, label: 'Export', type: 'icon', icon_name: 'icon-export-pdf', icon_title: 'Export as PDF', visible: true },
			{ key: 'cancel_po', show: true, label: 'Cancel PO', type: 'button', visible: true },
			{ key: 'approve', show: (APP.permissions.job_access.approve_po_any_time == 'yes') ? true : false, label: 'Approve PO', type: 'button', color: 'primary', visible: true },
			{ key: 'request', show: true, label: 'Request Approval', type: 'button', color: 'primary', visible: true },
			{ key: 'edit_request', show: true, label: 'Edit Request Approval', type: 'button', color: 'primary', visible: true },
			{ key: 'send_po', show: (APP.permissions.job_access.send_po == 'yes') ? true : false, label: 'Send PO', type: 'button', color: 'primary', visible: false },
		],
		editActions: [
			{ key: 'cancel', type: 'button', label: 'Back', visible: true, show: true },
			// { key: 'cancel', type: 'button', label: 'Cancel', visible: true, show: true },
			// { key: 'save', type: 'button', label: 'Save Changes', isDisable: true, visible: true, show: true }
		],
		dateKeys: ['issue_date', 'process_date'],
		dateFields: [
			{ can_edit: true, key: 'issue_date', label: 'Issue Date', maxDate: new Date(), type: 'date', default: null },
			{ can_edit: true, key: 'process_date', label: 'Process Date', minDate: new Date(), type: 'date', default: null },
			{ can_edit: true, display_name: 'po_status_name', key: 'po_status_id', label: 'Status', type: 'select', validations: { required: true }, multi: false, options: 'poStatuses', default: 1 },

		],
		formFields: [
			{ key: 'id', type: 'none' },
			{ key: 'vendor_id', type: 'none' },
			{ key: 'vendor_address_id', type: 'none' },
			{ key: 'po_status_name', type: 'none' },
			{ key: 'vendor_name', type: 'none' },
			{ key: 'purchasing_contact', type: 'none' },
			/*{ key: 'client_name', type: 'none' },
			{ can_edit: false, display_name: 'client_name', key: 'client_id', label: 'Client Name', type: 'select', validations: { required: true }, multi: false, options: 'clientList', default: '' },*/
			{ can_edit: false, key: 'org_name', label: 'Client Name', type: 'visible' },
			{ can_edit: true, display_name: 'purchasing_contact', key: 'purchasing_contact_id', label: 'Purchase Contact', nameKey: 'label', type: 'select', validations: { required: true }, multi: false, options: 'purchaseContactList', default: '' },
			// { can_edit: true, display_name: 'converted_description', key: 'description', label: 'Description', type: 'textarea', default: '' },
			// { can_edit: true, key: 'notify', label: 'Notify me before closing the Job', type: 'checkbox', default: false },
		],
		formFieldsNew: [{ can_edit: true, display_name: 'converted_description', key: 'description', label: 'Description', type: 'textarea', default: '' }, { key: 'notify_me', type: 'none' }],
		productServices: [],
		timeline: {
			isLoading: true,
			list: [
				{ id: 1, name: 'Paper LDC Date', time: 'Mar 21, 2019' },
				{ id: 2, name: 'Proof of install', time: 'Mar 24, 2019' }
			]
		},
		miscExpenses: [],
		minDate: new Date(),

		disableActions: ['cancel_po', 'edit', 'approve', 'cancel', 'save', 'request', 'edit_request'],
		cancelDisable: ['cancel_po', 'edit', 'approve', 'request' , 'edit_request'],

		poList: [],
		selectedPO: null,
	}

	dropdowns = {
		poStatuses: [],
		clientList: [],
		purchaseContactList: [],
		miscTypes: []
	}
	messages = {
		isNew: true,
		inProgress: true,
		noData: false,
		showButtons: false,
		userName: APP.user.first_name + ' ' + APP.user.last_name,
		uploadData: {
			error: '',
			files: []
		},
		hasThread: false,
		newMessage: '',
		thread: {},
		list: []


	}
	invoices = {
		inProgress: false,
		noData: false,
		list: []
	}
	uploadUrl = APP.api_url + 'uploadAttachments?container=message_files';
	uploader: FileUploader = new FileUploader({
		url: this.uploadUrl,
		allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	POForm: FormGroup;

	priceConfig: any = {
		prefix: '$',
		limit: 10,
		centsLimit: 4,
		isCancel: false
	}

	previewGridApi: GridApi;
	previewColApi: ColumnApi;
	previewGridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight: 38,

		columnDefs: [
			{
				headerName: 'Products', field: 'products_name', cellClass: 'product-cell', cellRenderer: params => {
					return params.value ? '<span class="product"><span class="product-title"> <i class="pixel-icons icon-products"></i>' + params.value + '</span> </span>' : '--';
				}
			},
			{
				headerName: 'Services', field: 'service_name', cellClass: 'service-cell', cellRendererFramework: ServiceOptionsCell
			},
			{
				headerName: 'Options', field: 'jobs_forms_id', cellRenderer: params => {
					return params.data && params.value ? params.data.option_no : '--'
				}, editable: params => {
					return this.state.isEditable;
				}, cellEditorFramework: AgPiSelect, cellEditorParams: {
					isAjax: true,
					ajaxUrl: 'serviceOptionPo',
					extraParams: ['revision_no', 'service_id'],
					nameKey: 'display_name',
					options: []
				}
			},
			{
				headerName: 'Cost Type', field: 'cost_type', cellClass: 'cost-type', cellRenderer: params => {
					return params.value ? '<span class="cost-type">' + params.value + '</span><span class="cost-type-text">' + (params.data.cost_name || "") + '</span>' : '';
				}
			},
			{
				headerName: 'Include Cost', field: 'include_cost', headerClass: 'right-text-cell',
				headerComponentFramework: IncludeCostHeaderCell, cellRendererFramework: IncludeCostRowCell, headerComponentParams: {
					selected: false,
					isEditable: false
				}, cellRendererParams: {
					isEditable: false
				}
			},
			{
				headerName: '', field: 'nothing', width: 50, cellRenderer: params => {
					if (params.data.cost != params.data.vendor_amount) return '<i class="material-icons">settings_backup_restore</i>';
					else return '';
				}, suppressMenu: true
			},
			{
				headerName: 'Cost', field: 'cost', headerClass: 'right-text-cell', cellClass: 'right-text-cell p-r-12 medium-text-cell', cellRenderer: params => {
					return params.value ? '$' + this.formatNumber(parseFloat(params.value).toFixed(2)) : '--';
				}, editable: params => {
					return this.state.isEditable;
				}, cellEditorFramework: NumericCellEditorComponent, cellRendererParams: { allowZero: true, prefix: '$', decimalLimit: 4 }
			}
		],

		pagination: true,

		defaultColDef: {
			resizable: true
		},

		suppressDragLeaveHidesColumns: true,
		stopEditingWhenGridLosesFocus: true,
		suppressCellSelection: true,
		rowSelection: 'multiple',

		rowData: [],
		onGridReady: params => {
			this.previewGridApi = params.api;
			this.previewColApi = params.columnApi;
			this.previewGridApi.setRowData(this.state.productServices);
			setTimeout(() => {
				agGridColumnAutoFit(this.previewGridApi, this.previewColApi);
			}, 200);
			window.onresize = () => {
				agGridColumnAutoFit(this.previewGridApi, this.previewColApi);
			};
		},
		onCellClicked: params => {
			if (this.state.isEditable) {
				if (params.event.target['className'] == 'material-icons') {
					params.data.cost = params.data.vendor_amount;
					params.node.setData(params.data);
					this.updateCost(params.data);
				}
			}
		},
		onCellValueChanged: params => {
			if (params.oldValue != params.newValue) {
				this.updateCost(params.data, params.colDef.field == 'jobs_forms_id' ? 'option' : 'cost');
			}
		}
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

	routerSubscription: Subscription;
	breadcrumbSubscription: Subscription;
	navBarSubscription: Subscription;

	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog,
		private _http: HttpClient,
		private _snackbar: MatSnackBar,
		private _fb: FormBuilder,
		private _router: ActivatedRoute,
		private _route: Router,
		private _projectDetailsService: ProjectDetailsService
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.state.projectID = this._router.parent.snapshot.params.id ? this._router.parent.snapshot.params.id : null;

		this.breadcrumbSubscription = _commonService.onUpdate().subscribe(obj => {
			if (obj.type == 'projectName' && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
				this.state.breadcrumbs[2]['route'] = '/projects/' + obj.data.id + '/purchase-orders' || '----';
				if (APP.permissions.job_access.purchase_order == 'edit') {
					if ([8, 10].includes(obj.data.job_status_id)) {
						this.state.allowEditable = APP.permissions.job_access['post-completion_po'] == 'yes';
					} else {
						this.state.allowEditable = true;
					}
				}

				//purchase-orders
			} else if (obj.type && obj.type == 'distroRefresh') {
				this.getPOList(this._router.parent.snapshot.params.id, () => {
					this.onTabChange({ id: 1, label: 'Purchase Order' });
				});
			}
		})

		this.routerSubscription = _router.params.subscribe(param => {
			this.state.selectedPO = {
				id: param.id
			};
			if (!this._projectDetailsService.getSubNav().list.length) {
				this.getPOList(this._router.parent.snapshot.params.id, () => {
					this.onTabChange({ id: 1, label: 'Purchase Order' });
				});
			} else {
				this.subNav = { ...this.subNav, ...this._projectDetailsService.getSubNav() };
				this.state.poList = this.subNav.list;
				this.state.initialLoading = true;
				this.onTabChange({ id: 1, label: 'Purchase Order' });
			}
		})
		this.uploader.onWhenAddingFileFailed = (item: FileLikeObject, filter: any, options: any) => {
			if (item.size >= options.maxFileSize) this.messages.uploadData.error = 'Exceeds Max. Size';
			else this.messages.uploadData.error = 'Invalid File Upload';
		}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					let type = obj.result.data.original_name.split('.').pop();
					this.messages.uploadData.files.push({ ...obj.result.data, ...{ type: type } });
					this.messages.uploadData.error = '';
				}
			}

		this.navBarSubscription = _commonService.onUpdate().subscribe(ev => {
			if (ev.type == 'grid-view') {
				if (ev.data.isActive) {
					this.state.selectedPO = null;
					this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders']);
				}
			} else if (ev.type == 'preview') {
				if (!this.state.selectedPO || this.state.selectedPO.id != ev.data.id) {
					this.state.selectedPO = ev.data;
					this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders/' + this.state.selectedPO.id]);
				}
			} else if (ev.type == 'invoice-cost-update') {
				this._projectDetailsService.update({ type: 'subnav-value', data: { selected: { ...this.state.selectedPO, ...{ value: this.getGrandTotal() } } } });
			}
		})
	}

	ngOnInit() {
		this.getApiCalls();
	}

	ngOnDestroy() {
		this._projectDetailsService.emptyList();
		this.routerSubscription.unsubscribe();
		this.navBarSubscription.unsubscribe();
		this.breadcrumbSubscription.unsubscribe();
	}

	formatNumber(number) {
		let x = number.toString().split('.');
		let x1 = x[0];
		x1 = isNaN(x1) ? "0" : Number(x1);
		x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
		return x1 + x2;
	}

	getPOList(id, cb?) {
		this._commonService.update({ type: 'left-nav-count', data: {} });
		this._commonService.getApi('poLists', { jobs_id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.poList = res['result'].data.list;
					this.subNav.list = this.state.poList;
					this.subNav['selectedItem'] = null;
					this.subNav['count'] = this.state.poList.length;
					if (this.state.poList.length > 1) {
						this._commonService.update({ type: 'sub-nav', data: this.subNav });
					}
					this._projectDetailsService.setSubNav(this.subNav);
					this.subNav = { ...this.subNav, ...this._projectDetailsService.getSubNav() };
					if (cb) cb();
				}
			});
	}

	updateColParam(isEdit, select = false) {
		(<ColDef>this.previewGridOptions.columnDefs[4]).headerComponentParams = { ...(<ColDef>this.previewGridOptions.columnDefs[4]).headerComponentParams, ...{ isEditable: isEdit, selected: select } };
		(<ColDef>this.previewGridOptions.columnDefs[2]).cellEditorParams.ajaxParams = { jobs_id: this.state.projectID, vendor_id: this.state.selectedPO.vendor_id }
		if (this.previewGridApi) {
			this.previewGridApi.setColumnDefs(this.previewGridOptions.columnDefs);
		}
	}

	removeInlineEdit() {
		[...this.state.formFields, ...this.state.dateFields, ...this.state.formFieldsNew].map(o => {
			if (o['can_edit']) o['is_edit'] = false;
		});
	}

	performActions(action) {
		let locals: any = {}
		switch (action.key) {
			case 'edit':
				this.state.isEditable = true;
				this.updateColParam(this.state.isEditable, this.checkHeaderSelected());
				break;
			case 'cancel':
				this.onTabChange({ id: 1, label: 'Purchase Order' });
				break;
			case 'save':
				this.removeInlineEdit();
				this.saveInlineEdit();
				break;
			case 'upload':
				this.uploadInvoiceModal();
				break;
			case 'print':
				this.printEstimate();
				break;
			case 'export':
				window.location.href = APP.api_url + 'poPreviewPdf?id=' + this.state.selectedPO.id + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
				break;
			case 'message':
				this.toggleSideNav('messages');
				break;
			case 'cancel_po':
				var params = {
					id: this.state.selectedPO.id,
					po_status_id: null,
					type: null
				}
				var status = _.find(this.dropdowns.poStatuses, ['name', 'Cancelled']);
				if (status) {
					params.po_status_id = status.id;
					params.type = status.slug;
				}
				locals = {
					title: 'Cancel Purchase Order',
					url: 'updatePoStatus',
					method: 'post',
					params: params,
					content: `<div class="po-dialog">
											<div class="">
												<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
											</div>
											<div class="">
												<p>Are you sure, you want to  Cancel this PO ?</p>
											</div>
										</div>`
				};
				break;
			case 'send_po':
				var params = {
					id: this.state.selectedPO.id,
					po_status_id: null,
					type: null
				}
				var status = _.find(this.dropdowns.poStatuses, ['name', 'Sent']);
				if (status) {
					params.po_status_id = status.id;
					params.type = status.slug;
				}
				locals = {
					title: 'Send Purchase Order',
					url: 'updatePoStatus',
					method: 'post',
					params: params,
					content: `<div class="po-dialog">
											<div class="">
												<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
											</div>
											<div class="">
												<p>Are you sure, you want to Send PO ?</p>
											</div>
										</div>`
				};
				break;
			case 'approve':
				var params = {
					id: this.state.selectedPO.id,
					po_status_id: null,
					type: null
				}
				var status = _.find(this.dropdowns.poStatuses, ['name', 'Approved']);
				if (status) {
					params.po_status_id = status.id;
					params.type = status.slug;
				}
				locals = {
					title: 'Approve Purchase Order',
					url: 'updatePoStatus',
					method: 'post',
					params: params,
					content: `<div class="po-dialog">
											<div class="">
												<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
											</div>
											<div class="">
												<p>Are you sure, you want to approve this Purchase Order</p>
											</div>
										</div>`,
					buttonText: 'Approve'
				};
				break;

			case 'request':
				this.requestApproval();
				break;
			case 'edit_request':
				this.editRequestApproval();
				break;
			default:
				break;
		}
		if (['cancel_po', 'approve', 'send_po'].indexOf(action.key) > -1) {
			this.confirmModal(locals, () => {
				if (action.key == 'approve') {
					this.state.selectedPO.po_status_id = 4;
					this.state.selectedPO.po_status_name = this.getStatusName(this.state.selectedPO.po_status_id);
					this.hideVisible(['approve']);
				} else if (action.key == 'send_po') {
					this.state.selectedPO.po_status_id = 9;
					this.state.selectedPO.po_status_name = this.getStatusName(this.state.selectedPO.po_status_id);
				} else {
					this.state.selectedPO.po_status_id = 6;
					this.state.selectedPO.po_status_name = this.getStatusName(this.state.selectedPO.po_status_id);
					this.hideVisible(this.state.cancelDisable);
				}
				this._projectDetailsService.update({ type: 'subnav-status', data: { selected: this.state.selectedPO } });
				this.updateGridData(this.state.selectedPO.id);
			});
		}

	}

	updateGridData(id) {
		let res = _.find(this.state.poList, ['id', id]);
		if (res) {
			res.po_status_id = this.state.selectedPO.po_status_id;
			res.po_status_name = this.state.selectedPO.po_status_name;
			const send_po = _.find(this.state.detailActions, ['key', 'send_po']);
			if (this.state.selectedPO.po_status_id == 4) {
				if (send_po) send_po.visible = true;
			} else {
				if (send_po) send_po.visible = false;
			}
		}
	}

	hideVisible(keys, visible = false) {
		keys.map(o => {
			const action = _.find(this.state.detailActions, ['key', o]);
			if (action) action.visible = visible;
		})
	}

	miscPromise: any = undefined;
	miscActions(key, i?, val?) {
		if (key == 'delete') {
			if (this.state.miscExpenses[i].id) {
				this._dialog.open(ConfirmationComponent, {
					panelClass: 'recon-dialog',
					width: '570px',
					data: {
						title: 'Remove Misc Item',
						url: 'removeMiscPo',
						params: { id: this.state.miscExpenses[i].id, type: 'single' },
						content: `<div class="po-dialog"><div class=""><span class="warning"><i class="pixel-icons icon-exclamation"></i></span></div>
						<div class=""><p>Are you sure you want to remove misc item?</p>`
					}
				})
					.afterClosed()
					.subscribe(res => {
						if (res) {
							if (res.success) {
								this.state.miscExpenses.splice(i, 1);
								this._projectDetailsService.update({ type: 'subnav-value', data: { selected: { ...this.state.selectedPO, ...{ value: this.getGrandTotal() } } } });
								this.snackbarModal();
							}
						}
					})
			} else {
				this.state.miscExpenses.splice(i, 1);
			}
			// this._commonService.deleteApi('removeMiscPo', { id: this.state.miscExpenses[i].id, type: 'single' })
			// 	.then(res => {
			// 		if (res['result'].success) {
			// 			this.state.miscExpenses.splice(i, 1);
			// 			this.snackbarModal();
			// 		}
			// 	})
		} else if (key == 'remove') {
			this._dialog.open(ConfirmationComponent, {
				panelClass: 'recon-dialog',
				width: '570px',
				data: {
					title: 'Remove All Misc Items',
					url: 'removeMiscPo',
					params: { jobs_po_id: this.state.selectedPO.id, type: 'all' },
					content: `<div class="po-dialog"><div class=""><span class="warning"><i class="pixel-icons icon-exclamation"></i></span></div>
					<div class=""><p>Are you sure you want to remove all misc items?</p>`
				}
			})
				.afterClosed()
				.subscribe(res => {
					if (res) {
						if (res.success) {
							this.state.miscExpenses = [];
							this._projectDetailsService.update({ type: 'subnav-value', data: { selected: { ...this.state.selectedPO, ...{ value: this.getGrandTotal() } } } });
							this.snackbarModal();
						}
					}
				})
			// this._commonService.deleteApi('removeMiscPo', { jobs_po_id: this.state.selectedPO.id, type: 'all' })
			// 	.then(res => {
			// 		if (res['result'].success) {
			// 			this.state.miscExpenses = [];
			// 			this.snackbarModal();
			// 		}
			// 	})
		} else if (key == 'add') {
			this.state.miscExpenses.push({
				id: 0, misc_id: this.dropdowns.miscTypes[0].id, misc_name: this.dropdowns.miscTypes[0].name, description: '', gross_amount: 0.00
			});
		} else if (key == 'save') {
			if (!this.miscPromise) {
				this.miscPromise = this._commonService.saveApi('saveMiscPo', { ...this.state.miscExpenses[i], ...{ jobs_po_id: this.state.selectedPO.id } })
					.then(res => {
						this.miscPromise = undefined;
						if (res['result'].success) {
							delete this.state.miscExpenses[i].isEdit;
							this.state.miscExpenses[i].id = res['result'].data.id || 0;
							this._projectDetailsService.update({ type: 'subnav-value', data: { selected: { ...this.state.selectedPO, ...{ value: this.getGrandTotal() } } } });
							this.updateRequestActions();
							this.snackbarModal();
						}
					})
					.catch(err => {
						this.miscPromise = undefined;
					})
			}
		} else if (key == 'change') {
			this.state.miscExpenses[i].misc_name = this.getMiscName(val);
		} else if (key == 'edit') {
			this.state.miscExpenses[i].isEdit = true;
		}
	}

	getMiscName(id) {
		const result = _.find(this.dropdowns.miscTypes, ['id', id])
		if (result) return result.name;
		else return '';
	}

	getBidTotal(flag = 'count') {
		let total = 0;
		this.state.productServices.map(o => {
			if (o.cost && o.include_cost) total += parseFloat(o.cost);
		});
		if (flag == 'count') return total.toFixed(2);
		else return this.formatNumber(parseFloat(total.toString()).toFixed(2))
	}

	twoDecimals(gross){
		//formatNumber(misc.gross_amount)
		return this.formatNumber(parseFloat(gross.toString()).toFixed(2))
	}

	getMiscTotal(flag = 'count') {
		let total = 0;
		this.state.miscExpenses.map(o => {
			if (o.gross_amount) total += parseFloat(o.gross_amount)
		});
		if (flag == 'count') return total.toFixed(2);
		else return this.formatNumber(parseFloat(total.toString()).toFixed(2))
	}

	getGrandTotal(flag = 'count') {
		if (flag == 'count') return (parseFloat(this.getBidTotal()) + parseFloat(this.getMiscTotal())).toFixed(2);
		else return this.formatNumber(parseFloat((parseFloat(this.getBidTotal()) + parseFloat(this.getMiscTotal())).toString()).toFixed(2))
	}

	getActualAmount() {
		return this.state.selectedPO.actual_amount && parseFloat(this.state.selectedPO.actual_amount) ? this.formatNumber(parseFloat(this.state.selectedPO.actual_amount)) : '0.00';
	}

	uploadInvoiceModal() {
		this._dialog.open(UploadInvoiceComponent, {
			panelClass: 'recon-dialog',
			width: '600px',
			data: {
				title: 'Upload Invoices',
				jobs_id: this.state.projectID,
				jobs_po_id: this.state.selectedPO.id
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) this.getInvoices();
			})
	}

	printEstimate() {
		this._http.get(APP.api_url + 'poPreviewPdf', { params: { token: APP.access_token, id: this.state.selectedPO.id, type: 'print', jwt: APP.j_token }, responseType: 'text' })
			.subscribe(res => {
				let windowPrint = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
				windowPrint.document.write(res);
				windowPrint.document.close();
				windowPrint.focus();
				windowPrint.print();
				windowPrint.close();
			});
	}

	snackbarModal(msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: 'success', msg: msg ? msg : 'Purchase Order Updated Successfully' },
			verticalPosition: 'top',
			horizontalPosition: 'right'
		});
	}

	toggleSideNav(flag) {
		this.state.showSideNav = !this.state.showSideNav;
		if (this.state.showSideNav) {
			this.state.sideNavView = flag;
			if (flag == 'messages') this.getMessages();
			if (flag == 'invoices') this.getInvoices();
		}
	}

	checkDiscussion(cb?) {
		this._commonService.getApi('checkPoThread', { id: this.state.selectedPO.id, type: 'po' })
			.then(res => {
				if (res['result'].success) {
					if (res['result'].data.threadStatus) {
						if (cb) cb({ success: true, data: res['result'].data });
					} else {
						if (cb) cb({ success: false, data: {} })
					}
				} else {
					this.messages.inProgress = false;
				}
			})
	}

	getMessageList(threadId) {
		this.messages.isNew = false;
		this._commonService.getApi('thread', { thread_id: threadId, type: 'thread' })
			.then((res: any) => {
				if (res.result.success) {
					if (!res.result.data.message.length) this.messages.noData = true;
					else {
						this.messages.noData = false;
						this.messages.list = res.result.data.message[0].message;
						this.messages.thread = res.result.data.message[0].thread;
						this.messages.list.reverse();
						this.messages.list.map(o => {
							o.message = o.message.replace(/\n/g, '<br/>');
						});
						setTimeout(this.scrollToBottom.bind(this), 0);
					}
				} else {
					this.messages.noData = true;
				}
				this.messages.inProgress = false;
			})
	}

	getMessages() {
		this.resetMessage();
		this.messages.inProgress = true;
		this.checkDiscussion(obj => {
			if (obj.success) {
				this.messages.hasThread = true;
				this.getMessageList(obj.data.threadId);
				this.poThreadId = obj.data.threadId;
			} else {
				this.messages.inProgress = false;
				// this.messages.isNew = true;
				this.messages.hasThread = false;
				this.messages.isNew = false;
				this.messages.noData = true;
			}
		});

	}

	createDiscussion() {
		this._dialog.open(CreateThreadComponent, {
			width: '700px',
			data: {
				jobs_id: this.state.projectID,
				id: this.state.selectedPO.id,
				isNew: false,
				from: 'po',
				breadcrum_type: 4
			}
		})
			.afterClosed()
			.subscribe(result => {
				if (result && result.success) {
					this.messages.inProgress = true;
					this.getMessageList(result.data.thread_id);
					this.snackbarModal('Discussion Created Successfully');
				}
			});
	}

	resetMessage() {
		this.messages.showButtons = false;
		this.messages.newMessage = '';
		this.messages.uploadData.files = [];
	}

	onMessageAdd(event) {
		if (this.messages.hasThread) {
			this.messages.list.push((<any>{
				created: event.created,
				message: event.message.replace(/\n/g, '<br />'),
				created_date: _moment(event.created_date).format('MM/DD/YYYY h:mm:ss a')
			}))

			this.resetMessage();

			this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
		} else {
			this._commonService.saveApi('saveProjectThreads', {
				jobs_id: this.state.projectID,
				id: this.state.selectedPO.id,
				type: 'po',
				breadcrum_type: 4,
				message: event.message.replace(/\n/g, '<br />'),
				users: [this.state.selectedPO.vendor_id],
				attachment: event.attachment.map(o => { return { filename: o.preview_path, original_name: o.original_name } })
			})
				.then(res => {
					if (res['result'].success) {
						this.messages.hasThread = true;
						this.resetMessage();
						this.getMessageList(res['result'].data.thread_id);
						this.snackbarModal('Discussion Created Successfully');
					}
				})
		}
	}

	createNewMessage(data) {
		this._commonService.saveApi('saveProjectThreads', {
			jobs_id: this.state.projectID,
			id: this.state.selectedPO.id,
			type: 'po',
			breadcrum_type: 4,
			message: data.message.replace(/\n/g, '<br />'),
			users: [this.state.selectedPO.vendor_id],
			attachment: (data.attachments)?data.files.map(o => { return { filename: o.file_path, original_name: o.file_name } }):[]
		})
		.then(res => {
			if (res['result'].success) {
				this.messages.hasThread = true;
				this.resetMessage();
				this.getMessageList(res['result'].data.thread_id);
				this.snackbarModal('Discussion Created Successfully');
			}
		})
	}

	createMessage() {
		if (this.messages.hasThread) {
			this.messages.list.push((<any>{
				created: this.messages.userName,
				message: this.messages.newMessage.replace(/\n/g, '<br />'),
				created_date: _moment().format('MM/DD/YYYY h:mm:ss a')
			}))

			let params = {
				message: this.messages.newMessage,
				thread_id: this.messages.thread['thread_id'],
				attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
			}

			this._commonService.saveApi('saveMessage', params)
				.then(res => {
					this.messages.list[this.messages.list.length - 1] = res['result'].data[0].message[0];
				});

			this.resetMessage();

			this.messages.thread['thread_count'] = this.messages.thread['thread_count'] + 1;
		} else {
			this._commonService.saveApi('saveProjectThreads', {
				jobs_id: this.state.projectID,
				id: this.state.selectedPO.id,
				type: 'po',
				breadcrum_type: 4,
				message: this.messages.newMessage.replace(/\n/g, '<br />'),
				users: [this.state.selectedPO.vendor_id],
				attachment: this.messages.uploadData.files.map(o => { return { filename: o.filename, original_name: o.original_name } })
			})
				.then(res => {
					if (res['result'].success) {
						this.messages.hasThread = true;
						this.resetMessage();
						this.getMessageList(res['result'].data.thread_id);
						this.snackbarModal('Discussion Created Successfully');
					}
				})
		}
	}

	scrollToBottom(): void {
		try {
			this.messageListContainer.nativeElement.scrollTop = this.messageListContainer.nativeElement.scrollHeight;
		} catch (err) { }
	}

	onKeydown(e) {

		let key = e.which || e.keyCode,
			shiftKey = !!e.shiftKey;

		if (key === 13) {
			if (shiftKey) {
				setTimeout(this.scrollToBottom.bind(this), 0);
			} else if (this.messages.newMessage) {
				e.preventDefault();

				this.createMessage();

				setTimeout(this.scrollToBottom.bind(this), 0);
			}

		}
	}

	removeAttachment(i) {
		this.messages.uploadData.files.splice(i, 1);
	}

	getInvoices() {
		this.invoices.inProgress = true;
		this._commonService.getApi('poAttach', { jobs_po_id: this.state.selectedPO.id })
			.then(res => {
				this.invoices.inProgress = false;
				if (res['result'].success) {
					this.invoices.list = res['result'].data || [];
				}
			})
	}

	delete(flag, i) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: {
				title: 'Delete Invoice',
				url: 'removePoAttachment',
				params: {
					attachments_id: this.invoices.list[i].id
				},
				content: `<div class="first-line">Are you sure, you want to delete Invoice ?</div>`
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success)
					this.invoices.list.splice(i, 1);
			})
	}

	toggleInlineEdit(obj) {
		if (obj) obj.is_edit = true;
	}

	getStatusName(id) {
		const res = _.find(this.dropdowns.poStatuses, ['id', id]);
		if (res) return res.name;
		else null;
	}

	saveInlineEdit(obj?) {
		if (obj) {
			if (obj.type == 'select') {
				const name = this.getDisplayName(obj.options, this.POForm.controls[obj.key].value, obj.idKey || 'id', obj.nameKey || 'name');
				this.state.selectedPO[obj.display_name] = name;
				this.POForm.patchValue({
					[obj.display_name]: name
				}, { emitEvent: false });
			} else if (obj.type == 'textarea') {
				this.state.selectedPO[obj.display_name] = this.POForm.controls[obj.key].value.replace(/\n/g, '<br/>');
			}
			obj.is_edit = false;
		}

		if (obj && obj.key == 'po_status_id') {
			const status = _.find(this.dropdowns[obj.options], ['id', this.POForm.value[obj.key]]);
			let params = {
				id: this.state.selectedPO.id,
				po_status_id: this.POForm.value[obj.key],
				type: ''
			}
			if (status) params.type = status.slug;
			this.savePO('updatePoStatus', params, () => {
				this.state.selectedPO.po_status_id = this.POForm.value['po_status_id'];
				this.state.selectedPO.po_status_name = this.getStatusName(this.POForm.value['po_status_id']);
				this._projectDetailsService.update({ type: 'subnav-status', data: { selected: this.state.selectedPO } });
			})
		} else {
			// Date Formats
			this.state.dateKeys.map(o => {
				if (this.POForm.value[o]) this.POForm.value[o] = _moment(this.POForm.value[o]).format('YYYY-MM-DD HH:mm:ss');
			});

			this.savePO('updatePo', { ...this.POForm.value, ...{ vendor_address: this.state.selectedPO.vendor_address } }, () => {
				if (this.state.selectedPO.po_status_id == 4) {
					this.state.selectedPO.po_status_id = 2;
					this.state.selectedPO.po_status_name = this.getStatusName(this.state.selectedPO.po_status_id);
					this._projectDetailsService.update({ type: 'subnav-status', data: { selected: this.state.selectedPO } });
				}
				if (obj && obj.key == 'po_status_id') {
					this.state.selectedPO.po_status_id = this.POForm.value['po_status_id'];
					this.state.selectedPO.po_status_name = this.getStatusName(this.POForm.value['po_status_id']);
					this._projectDetailsService.update({ type: 'subnav-status', data: { selected: this.state.selectedPO } });
					this.updateGridData(this.state.selectedPO.id);
				}
			});
		}

		// this.state.isEditable = false;
		// this.updateColParam(this.state.isEditable);
	}

	getDisplayName(prop, id, idkey = 'id', nameKey = 'name') {
		const result = _.find(this.dropdowns[prop], [idkey, id]);
		if (result) return result[nameKey];
	}

	cancelInlineEdit(obj) {
		obj.is_edit = false;
		this.POForm.patchValue({
			[obj.key]: obj.type == 'date' ? (this.state.selectedPO[obj.key] ? new Date(this.state.selectedPO[obj.key]) : null) : this.state.selectedPO[obj.key]
		}, { emitEvent: false });
	}


	savePO(url, value, cb?) {
		this._commonService.saveApi(url, value)
			.then(res => {
				if (res['result'].success) {
					if (cb) cb();
					this.snackbarModal();
				}
			})
	}

	updateCost(params, type = 'cost') {
		let param = {
			id: params.id,
			type: type,
			cost: params.cost
		}
		if (type == 'option') param['jobs_forms_id'] = params.jobs_forms_id;
		this._commonService.saveApi('updatePoSrvCost', param)
			.then(res => {
				if (res['result'].success) {
					this.previewGridApi.redrawRows();
					this._projectDetailsService.update({ type: 'subnav-value', data: { selected: { ...this.state.selectedPO, ...{ value: this.getGrandTotal() } } } });
				}
			})
	}

	onTabChange(tab) {
		this.state.activeTab = tab.id;
		const cond = this.state.activeTab == 1 ? true : false;
		this.hideVisible(this.state.disableActions, cond);
		this.hideVisible(['upload'], !cond);

		this.state.isEditable = false;
		// this.updateColParam(this.state.isEditable);
		this.removeInlineEdit(); this.resetJson();
		this.previewGridApi = null;
		if (this.state.activeTab == 2) {
			this.getInvoices();
		} else {
			this.getSelectedPO(this.state.selectedPO.id);
		}
	}

	getApiCalls() {console.log(2)
		forkJoin(
			this._commonService.getApi('getDropdownMaster', { master_type: 5 }),
			this._commonService.getApi('drpDwnMiscExpn', {})
		)
			.subscribe(res => {
				if (res[0]['result'].success) this.dropdowns.purchaseContactList = res[0]['result'].data.users || [];
				if (res[1]['result'].success) this.dropdowns.miscTypes = res[1]['result'].data.MiscDt || [];
			})
	}

	createForm() {
		const formFields = [...this.state.formFields, ...this.state.dateFields, ...this.state.formFieldsNew];
		this.POForm = this._fb.group(buildForm(formFields));
	}

	updateDateFields(data) {
		this.state.dateKeys.map(o => {
			data[o] = data[o] ? new Date(data[o]) : null;
		})
	}

	setForm(data = {}) {
		this.updateDateFields(data);
		const formFields = [...this.state.formFields, ...this.state.dateFields, ...this.state.formFieldsNew];
		this.POForm.patchValue(updateForm(formFields, data));
	}

	updateRequestActions() {
		const approve = _.find(this.state.detailActions, ['key', 'approve']);
		const request = _.find(this.state.detailActions, ['key', 'request']);
		const purLmt = APP.permissions.job_access.purchase_limit ? Number(APP.permissions.job_access.purchase_limit.replace(/[$,]/g, '')) : 0;
		const gTot = Number(this.getGrandTotal());
		if (purLmt > gTot) {
			if (approve) approve.visible = true;
			if (request) request.visible = false;
		} else {
			if (approve) approve.visible = false;
			if (request) request.visible = true;
		}
	}

	getSelectedPO(id) {
		this.state.isLoading = true;
		this.createForm();
		this._commonService.getApi('poDetails', { id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.jobInfo = res['result'].data.jobInfo[0];
					this.state.selectedPO = res['result'].data.poDetails;
					
					this.state.dateFields[0].maxDate = this.state.selectedPO.issue_date ? new Date(this.state.selectedPO.issue_date) : null;
					if (this.state.selectedPO.vendor_address_id) this.getVendorAddress(this.state.selectedPO.vendor_id);
					this.getProductsServices(res['result'].data.poPrdSrv);
					this.state.miscExpenses = res['result'].data.miscDt || [];
					if (this.state.selectedPO.po_status_id == 6) {
						this.hideVisible(this.state.cancelDisable);
					// } else if (this.state.selectedPO.po_status_id == 4 || this.state.selectedPO.po_status_id == 3) {
					} else if (this.state.selectedPO.po_status_id == 3) {
						this.hideVisible(['request', 'edit_request']);
						const approve = _.find(this.state.detailActions, ['key', 'approve']);
						const purLmt = APP.permissions.job_access.purchase_limit ? Number(APP.permissions.job_access.purchase_limit.replace(/[$,]/g, '')) : 0;
						const gTot = Number(this.getGrandTotal());
						if (purLmt > gTot) {
							if (approve) approve.visible = true;
						} else {
							if (approve) approve.visible = false;
						}
					}  else if (this.state.selectedPO.po_status_id == 4) {
						this.hideVisible(['approve', 'request']);
					} else {
						if (this.state.selectedPO.po_status_id == 5 || this.state.selectedPO.po_status_id == 7 || this.state.selectedPO.po_status_id == 8) {
							this.hideVisible(['edit']);
						}
						this.updateRequestActions();
					}
					const send_po = _.find(this.state.detailActions, ['key', 'send_po']);
					if (this.state.selectedPO.po_status_id == 4) {
						if (send_po) send_po.visible = true;
					} else {
						if (send_po) send_po.visible = false;
					}
					//const send_po = _.find(this.state.detailActions, ['key', 'send_po']);
					this.dropdowns.poStatuses = res['result'].data.statusDt || [];
					this.state.selectedPO.converted_description = this.state.selectedPO.description;
					this.state.selectedPO.converted_description = this.state.selectedPO.converted_description ? this.state.selectedPO.converted_description.replace(/\n/g, '<br/>') : null;
					this.setForm({ ...this.state.selectedPO, ...{ org_name: this.state.jobInfo.org_name } });
					this.subNav['selectedItem'] = this.state.selectedPO;
					if (this.subNav.list.length > 1) this._commonService.update({ type: 'sub-nav', data: this.subNav });
					this.state.isLoading = false;
					this.state.initialLoading = false;
					this.getPOTimelineList(this.state.selectedPO.id, this.state.selectedPO.vendor_id);
					if(this.state.selectedPO.is_request){
						const edit_request = _.find(this.state.detailActions, ['key', 'edit_request']);
						const purLmt = APP.permissions.job_access.purchase_limit ? Number(APP.permissions.job_access.purchase_limit.replace(/[$,]/g, '')) : 0;
						const gTot = Number(this.getGrandTotal());
						if (purLmt > gTot) {
							if (edit_request) edit_request.visible = false;
						}else{
							if (edit_request) edit_request.visible = true;
						}
					}else{
						this.hideVisible(['edit_request']);
					}
				}
			})
	}

	getPOTimelineList(id, vendorId) {
		this.state.timeline.isLoading = true;
		this._commonService.getApi('poTimeLine', { jobs_id: this.state.projectID, vendors_id: vendorId, po_id: id })
			.then(res => {
				this.state.timeline.isLoading = false;
				if (res['result'].success) {
					this.state.timeline.list = res['result'].data.list || [];
				}
			})
	}

	getVendorAddress(id) {
		this._commonService.getApi('getOrgAddress', { search: '', org_type: 3, org_id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.selectedPO.vendor_address = res['result'].data[0];
				}
			})
	}

	changeAddress() {
		this._dialog.open(ChangeAddressComponent, {
			panelClass: 'recon-dialog',
			width: '600px',
			height: '422px',
			data: {
				title: 'Select Address - ' + this.state.selectedPO.vendor_name,
				tabIndex: null,
				org_id: this.state.projectID,
				hasTabs: false,
				vendor_id: this.state.selectedPO.vendor_id,
				selectedAddress: this.state.selectedPO.vendor_address || null
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (this.state.selectedPO.vendor_address) this.state.selectedPO.vendor_address = res.data;
					else this.state.selectedPO.vendor_address = { ...res.data };
					this.POForm.patchValue({
						vendor_address_id: res.data.id
					}, { emitEvent: false })
					this.saveInlineEdit();
				}
			})
	}

	checkHeaderSelected(): boolean {
		let counter = 0;
		this.state.productServices.map(o => {
			if (o.include_cost) counter++;
		})
		let selected = false;
		if (counter != 0 && counter == this.state.productServices.length) selected = true;
		return selected;
	}

	getProductsServices(data = []) {
		this.state.productServices = data;
		this.updateColParam(this.state.isEditable, this.checkHeaderSelected());
	}

	onSearch(val) {
		if (this.state.activeTab == 2) {

		}
	}

	resetJson() {
		// this.state.jobInfo = null;
		// this.state.selectedPO = null;
		this.state.miscExpenses = [];
		this.state.productServices = [];
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

	confirmationModal(cb) {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'recon-dialog',
			width: '570px',
			data: {
				title: 'Add Purchase Order',
				url: '',
				params: {},
				content: `<div class="po-dialog"><div class=""><span class="warning"><i class="pixel-icons icon-exclamation"></i></span></div>
				<div class=""><p>There are no Approved Estimates for this Job. Are you sure you want to add Purchase Order?</p>
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
			panelClass: 'full-width-modal',
			maxWidth: '100vw',
			width: '100vw',
			height: '100vh',
			disableClose: true,
			data: {
				title: 'Add Purchase Order.',
				jobs_id: this.state.projectID,
				isNew: isNew,
				vendor: !isNew ? { id: this.state.selectedPO.vendor_id, name: this.state.selectedPO.vendor_name } : null,
				POId: !isNew ? this.state.selectedPO.id : null
			}
		}).afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this._snackbar.openFromComponent(SnackbarComponent, {
						data: { status: 'success', msg: 'Purchase Order Created Successfully' },
						verticalPosition: 'top',
						horizontalPosition: 'right'
					});

					this.state.productServices = res.data || [];
					if (!isNew) {
						if (res.data) {
							this.previewGridApi.setRowData(res.data);
							agGridColumnAutoFit(this.previewGridApi, this.previewColApi);
						}
					} else {
						this.getPOList(this._router.parent.snapshot.params.id, () => {
							this._route.navigate(['/projects/' + this._router.parent.snapshot.params.id + '/purchase-orders/' + res.data]);
						})
					}
				}
			});
	}

	requestApproval() {
		this._dialog.open(RequestApprovalComponent, {
			panelClass: 'recon-dialog',
			width: '650px',
			height: '550px',
			data: {
				title: 'Send for Approval',
				jobs_id: this.state.projectID,
				po_id: this.state.selectedPO.id,
				request_id: this.state.selectedPO.request_id || 635
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					this.state.selectedPO.po_status_id = 3;
					this.state.selectedPO.po_status_name = this.getStatusName(this.state.selectedPO.po_status_id);
					this.hideVisible(['request']);
					this._projectDetailsService.update({ type: 'subnav-status', data: { selected: this.state.selectedPO } });
				}
			})
	}

	editRequestApproval() {
		this._dialog.open(RequestApprovalComponent, {
			panelClass: 'recon-dialog',
			width: '650px',
			height: '550px',
			data: {
				title: 'Edit Request Approval',
				type: 'edit',
				jobs_id: this.state.projectID,
				po_id: this.state.selectedPO.id,
				request_id: this.state.selectedPO.request_id || 635,
				request_date: this.state.selectedPO.request_date || null
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					this.state.selectedPO.po_status_id = 3;
					this.state.selectedPO.po_status_name = this.getStatusName(this.state.selectedPO.po_status_id);
					this.hideVisible(['request']);
					this._projectDetailsService.update({ type: 'subnav-status', data: { selected: this.state.selectedPO } });
				}
			})
	}

	addMilestone() {
		this._dialog.open(AddMilestoneComponent, {
			panelClass: 'my-dialog',
			width: '650px',
			height: '550px',
			data: {
				title: 'Add Milestone',
				jobs_id: this.state.projectID,
				selectedRow: this.state.selectedPO
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.snackbarModal('Purchase Order Updated Successfull');
					this.getPOTimelineList(this.state.selectedPO.id, this.state.selectedPO.vendor_id);
				}
			})
	}

	deleteMilestone(data, i) {
		this._commonService.deleteApi('delPoTimeLine', { id: data.id })
			.then(res => {
				if (res['result'].success) {
					this.state.timeline.list.splice(i, 1);
					this.snackbarModal('Milestone Removed Successfully.');
				}
			})
	}

	saveTimeline(ev, data) {
		const params = {
			jobs_id: this.state.projectID,
			po_id: this.state.selectedPO.id,
			jobs_tasks_id: data.jobs_tasks_id,
			id: data.id,
			timeline_date: data.timeline_date ? _moment(data.timeline_date).format('YYYY-MM-DD HH:mm:ss') : null,
			type: 'edit'
		};
		this._commonService.saveApi('savePoTimeLine', params)
			.then(res => {
				if (res['result'].success) {
					this.snackbarModal('Milestone Updated Successfully.');
				}
			})
	}

}
