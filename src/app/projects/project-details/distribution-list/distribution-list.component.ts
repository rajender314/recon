import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { FormFieldType, AddDialogLocalType } from '@app/admin/admin.config';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddDialogComponent } from '@app/projects/project-details/distribution-list/add-dialog/add-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { EditDialogComponent } from '@app/projects/project-details/distribution-list/edit-dialog/edit-dialog.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { ProjectDetailsService } from '../project-details.service';

var APP: any = window['APP'];

@Component({
	selector: 'app-distribution-list',
	templateUrl: './distribution-list.component.html',
	styleUrls: ['../project-details.component.scss', './distribution-list.component.scss'],
	animations: [
		trigger('listAnimate', [
			transition(':enter', [
				style({ transform: 'translateX(-100px)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			])
		])
	]
})
export class DistributionListComponent implements OnInit, OnDestroy {

	@ViewChild('myInput') myInput: ElementRef;
	distroName = new FormControl(['', Validators.required]);

	state = {
		isLoading: true,
		submitted: false,
		allowEditable: false,
		title: 'Distribution List',
		projectID: null,
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: 'Name', type: 'text' },
			/* { label: 'Distribution List', type: 'text' }, */
		],
		get: 'distributionsList',
		distributionList: [],
		kitList: [],
		selectedItem: {}
	}

	subscription: Subscription;
	promise: any;

	addDistFields: Array<FormFieldType> = [
		{ key: 'distro_id', label: '', type: 'none', default: '' },
		{ key: 'distro_name', label: 'Distro Name', type: 'text', validations: { required: true }, default: '' },
		{ key: 'job_comp_ids', label: 'Product', type: 'select', multi: true, options: 'productList', validations: { required: true }, default: '' },
		{ key: 'job_file', label: 'Distribution List', type: 'select', multi: false, options: 'jobFiles', validations: { required: true }, default: '' }
	];

	addKitFields: Array<FormFieldType> = [
		{ key: 'distro_id', label: '', type: 'none', default: '' },
		{ key: 'distro_name', label: 'Distro Name', type: 'text', validations: { required: true }, default: '' },
		// { key: 'job_comp_ids', label: 'Kitting Product', type: 'select', multi: false, options: 'productList', default: '' },
		{ key: 'kit_name', label: 'Kit Name', type: 'text', validations: { required: true }, default: '' },
		{ key: 'job_file', label: 'Kit List', type: 'select', multi: false, options: 'jobFiles', default: '' }
	]

	gridApi: GridApi;
	public gridColumnApi;
	gridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight: 0,
		overlayNoRowsTemplate: '<div class="no-data">No Distribution</div>',
		columnDefs: [
			{
				field: 'category',
				rowGroupIndex: 1,
				hide: true
			},
			{
				headerName: "Versions", width: 180, field: "versions", cellRenderer: (params) => {
					return '<div class="text-right">' + (params.hasOwnProperty('data') ? params.value + ' Versions' : '') + '</div>';
				}
			},
			{
				headerName: "Rows", width: 150, field: "rows", cellRenderer: (params) => {
					return '<div class="text-right">' + (params.hasOwnProperty('data') ? params.value + ' Rows' : '') + '</div>';
				}
			},
			{
				headerName: "Quantity", width: 90, field: "quantity", cellRenderer: (params) => {
					return '<div class="text-right">' + (params.hasOwnProperty('data') ? params.value ? params.value + ' Qty' : 0 + ' Qty' : '') + '</div>';
				}
			},
			{
				headerName: "Errors", width: 90, field: "is_error", cellRenderer: (params) => {
					return '<div class="text-right">' + (params.hasOwnProperty('data') ? params.value ? params.value + ' Errors' : 0 + ' Errors' : '') + '</div>';
				}
			},
			{
				headerName: '', field: 'action', filter: false, width: 40, cellRenderer: (params) => {
					return params.hasOwnProperty('data') ? (params.data.hasOwnProperty('kit_id') || (!params.data.hasOwnProperty('is_prod_list') && !params.data.hasOwnProperty('id')) ? '<i class="pixel-icons icon-delete" />' : '') :
						(params.node.allLeafChildren.length ? (params.node.allLeafChildren[0].data.hasOwnProperty('kit_id') ? '<i class="pixel-icons icon-delete" />' : '') : '')
				}, cellClass: 'action'
			}
		],
		groupDefaultExpanded: 1,
		rememberGroupStateWhenNewData: true,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		groupSelectsChildren: true,
		suppressCellSelection: true,
		autoGroupColumnDef: {
			headerName: "Products/Kits", width: 300, cellClass: "kits-grid", field: "name", cellRenderer: "agGroupCellRenderer", cellRendererParams: {
				innerRenderer: (params) => {
					let cond = '';
					if (params.hasOwnProperty('data')) {
						cond = params.data.hasOwnProperty('kit_id') ? '<div class="kits-title m-left"><i class="pixel-icons '+(params.data.is_cancel?"icon-cancelled-products":"icon-products")+'"></i> <span>' + params.value + ' </span></div>' : '<i class="pixel-icons '+(params.data.is_cancel?"icon-cancelled-products":"icon-products")+'"></i>' + params.value;
					} else {
						if (params.node.allLeafChildren.length) {
							const data: any = params.node.allLeafChildren[0].data;
							if (data.hasOwnProperty('kit_id')) {
								cond = '<div class="kits-title m-left"><i class="pixel-icons icon-breifcase-broken"></i> <span> ' + params.value + '</span></div>';
							} else {
								cond = '<div class="m-left"> ' + params.value + '</div>';
							}
						}
					}
					return cond;
				}
			},
			suppressSizeToFit: true,
			rowGroupIndex: 1
		},
		icons: {
			groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
			groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
		},
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		pagination: true,
		// getNodeChildDetails: this.getNodeChildDetails,

		defaultColDef: {
			resizable: true
		},

		onGridReady: (params) => {
			this.gridColumnApi = params.columnApi;
			if (window.innerWidth > 1420) {
				params.api.sizeColumnsToFit();
			}
			window.onresize = () => {
				if (window.innerWidth > 1420) {
					params.api.sizeColumnsToFit();
				}
				else {

					var allColumnIds = [];
					this.gridColumnApi.getAllColumns().forEach(function (column) {
						allColumnIds.push(column.colId);
					});
					this.gridColumnApi.autoSizeColumns(allColumnIds);

				}
			};

			this.gridApi = params.api;
			// this.gridApi.setDomLayout('autoHeight');
		},
		onRowClicked: (params) => {
			if (params.event.target['className'] != 'pixel-icons icon-delete' && this.state.allowEditable) {
				if (params.data) {
					if (params.data.hasOwnProperty('is_prod_list')) {
						this.editDialog(params.data);
					}
				} else {
					if (params.node.allLeafChildren.length) {
						const data: any = params.node.allLeafChildren[0].data;
						if (data.hasOwnProperty('kit_id')) {
							this.editDialog({ distro_id: data.distro_id, kit_id: data.kit_id, name: params.node.key })
						}
					}
				}
			}
		},
		onCellClicked: (params) => {
			if (params.event.target['className'] == 'pixel-icons icon-delete' && this.state.allowEditable) {
				if (params.data) {
					this.performActions('delete', params.data, 0, params.data.kit_id, params.data.hasOwnProperty('job_comp_id') ? params.data.job_comp_id : '');
				} else {
					const childNodes = params.node.allLeafChildren.map(o => o.data);
					if (params.node.allLeafChildren.length) {
						const data: any = params.node.allLeafChildren[0].data;
						if (data.hasOwnProperty('kit_id')) {
							this.performActions('delete', { distro_id: data.distro_id, kit_id: data.kit_id, name: params.node.key }, 0, data.kit_id, '', childNodes);
						}
					}
				}
			}
		}
	}

	routerSubscription: Subscription;

	constructor(
		private _router: ActivatedRoute,
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _commonService: CommonService,
		private _projectDetailService: ProjectDetailsService
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			this.getList();
		});

		this.subscription = _commonService.onUpdate().subscribe(obj => {
			if (obj.type == 'projectName' && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
					if ([8, 10].includes(obj.data.job_status_id)) {
						this.state.allowEditable = APP.permissions.job_access['post-completion_estimate'] == 'yes';
					} else {
						this.state.allowEditable = true;
					}
			}
			if (obj.type && obj.type == 'importDistro') {
				if (obj.data.hasOwnProperty('kit_id')) {
					this.addDialog('kit', obj.parentRow);
				} else {
					this.addDialog('list', obj.parentRow);
				}
			}else if(obj.type && obj.type=='distroRefresh'){
				this.getList();
			}
		});
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	getNodeChildDetails(rowItem) {
		if (rowItem.components) {
			return {
				group: true,
				children: rowItem.components,
				expanded: true,
				key: rowItem.name
			};
		} else {
			return null;
		}
	};

	ngOnInit() {
		// this.getList();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.routerSubscription.unsubscribe();
	}

	resetControl() {
		const checkPrev = _.find(this.state.distributionList, ['is_edit', true]);
		if (checkPrev) {
			delete checkPrev.is_edit;
			this.state.submitted = false;
		}
	}

	performActions(flag, data, indx, kitID = '', job_comp_id = '', childNodes?) {
		if (flag == 'edit') {
			const checkPrev = _.find(this.state.distributionList, ['is_edit', true]);
			if (!checkPrev) {
				data.is_edit = true;
				this.distroName.patchValue(data.name);
				this.distroName.setValidators(Validators.required);
			}
			setTimeout(() => {
				this.myInput.nativeElement.focus();
			}, 20);
		} else if (flag == 'delete') {
			const locals = {
				title: 'Delete Distribution List',
				action: 'delete',
				url: 'deleteDistributionList',
				tab: 'Distribution',
				params: {
					jobs_id: this.state.projectID,
					distro_id: kitID ? data.distro_id : data.id,
					kitting_id: kitID,
					job_comp_id: job_comp_id
				},
				content: 'Are you sure, you want to delete this Distribution'
			}
			this.confirmationDialog(locals, () => {
				const deleteRecords = childNodes ? childNodes : [data];
				if (!kitID) {
					this.state.distributionList.splice(indx, 1);
					if (!this.state.distributionList.length) this.gridApi.setRowData([]);
				}
				else this.gridApi.updateRowData({ remove: deleteRecords });
			});
		}
	}

	updateDistroName(control: FormControl, data) {
		if (!this.promise) {
			this.state.submitted = true;
			if (control.valid) {
				this.state.submitted = false;
				if (control.value != data.name)
					this.promise = this._commonService.saveApi('saveDistributionName', { jobs_id: this.state.projectID, distro_id: data.id, distro_name: control.value })
						.then(res => {
							this.promise = undefined;
							if (res['result'].success) {
								this.openSnackBar({ status: 'success', msg: 'Distro Name Updated Successfully' });
								data.name = control.value;
								delete data.is_edit;
							}
						})
						.catch(err => {
							this.promise = undefined;
						})
				else delete data.is_edit;
			}
		}
	}

	confirmationDialog(locals, cb?) {
		this.resetControl();
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'my-dialog',
			width: '500px',
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (cb) cb();
				}
			})
	}

	getList(id?: any) {
		this.state.isLoading = true;
		this._commonService.update({ type: 'left-nav-count', data: {} });
		this._commonService.getApi(this.state.get, { jobs_id: this.state.projectID })
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.distributionList = res['result'].data;
					if (this.state.distributionList.length) {
						if (id) {
							let distro = _.find(this.state.distributionList, { id: id });
							this.selectItem(distro, true);
						} else {
							this.selectItem(this.state.distributionList[0]);
						}
					} else {
						this.state.isLoading = false;
					}
				} else {
					this.state.isLoading = false;
				}
			})
	}

	addDialog(flag, selectedRow?) {
		this.resetControl();
		const locals: AddDialogLocalType = {
			title: flag == 'list' ? 'Add Distribution List' : 'Add a Kit List',
			label: flag == 'list' ? 'Distribution List' : 'Kit List',
			name: '',
			apiCall: flag == 'list' ? 'importDistTemTable' : '',
			dropdowns: {},
			formFields: flag == 'list' ? this.addDistFields : this.addKitFields,
			flag: flag,
			breadcrumbs: [...this.state.breadcrumbs, ...[{ label: 'Distribution List', type: 'link', route: '/projects/' + this.state.projectID + '/distribution-list' }]]
		}
		locals['apiCalls'] = [
			{ key: 'productList', url: 'getDistProducts', params: { jobs_id: this.state.projectID } },
			{ key: 'jobFiles', url: '', params: {} }
		];
		if (selectedRow) locals['selectedRow'] = selectedRow;
		locals['jobs_id'] = this.state.projectID;
		locals['parentRow'] = this.state.selectedItem;
		this._dialog.open(AddDialogComponent, {
			panelClass: ['my-dialog', 'add-distro-kit', 'full-modal-box-ui', 'padding-0'],
			width: '100vw',
			maxWidth: '100vw',
			height: '100vh',
			disableClose: false,
			data: locals
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if(selectedRow){
						this._commonService.update({ type: 'updateImportDistro', data: {} });
					}
					this.updateJobStatus();
					this.getList(res.data.id);
				}
			})
	}

	editDialog(data) {
		this.resetControl();
		this._dialog.open(EditDialogComponent, {
			panelClass: ['full-width-modal', 'full-modal-box-ui', 'padding-0'],
			width: '100vw',
			height: '100vh',
			maxWidth: '100vw',
			disableClose: false,
			data: {
				title: data.name,
				jobs_id: this.state.projectID,
				selectedRow: data,
				parentRow: this.state.selectedItem,
				breadcrumbs: [...this.state.breadcrumbs, ...[{ label: 'Distribution List', type: 'link', route: '/projects/' + this.state.projectID + '/distribution-list' }]]
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.isChange) {
					this.updateJobStatus();
					this.getDetails(data.distro_id);
				}
			})
	}

	updateJobStatus() {
		this._commonService.getApi('getJobInfo', { id: this.state.projectID, type: 'status' })
			.then(res => {
				if (res['result'].success) {
					this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
				}
			})
	}

	getDetails(id) {
		if (this.gridApi) this.gridApi.showLoadingOverlay();
		this._commonService.getApi('getDistProductsList', { distro_id: id, jobs_id: this.state.projectID })
			.then(res => {
				this.gridApi.hideOverlay();
				if (res['result'].success) {
					let data = [];
					this.state.kitList = [];
					if (res['result'].data.kits.length) {
						this.state.kitList = res['result'].data.kits;
						res['result'].data.kits.map(o => {
							if (o.components.length) {
								o.components.map(p => {
									data.push(this.createRowData(o.name, p));
								})
							}
						})
					}
					if (res['result'].data.products.length) {
						res['result'].data.products.map(o => {
							data.push(this.createRowData('Products', o));
						})
					}
					this.gridApi.setRowData(data);
				}
			})
	}

	createRowData(category, data) {
		return {
			category: category,
			...data
		}
	}

	selectItem(item, reload?: any) {
		const checkPrev = _.find(this.state.distributionList, ['is_edit', true]);
		if (!checkPrev || reload) {
			if ((this.state.selectedItem['id'] != item.id) || reload) {
				this.state.selectedItem = { ...item };
				this.state.isLoading = false;
				this.getDetails(item.id);
			}
		} else {
			delete checkPrev.is_edit;
			this.state.submitted = false;
			this.state.isLoading = false;
		}

	}

	openSnackBar(obj) {
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
