import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { objectToArray } from '@app/admin/admin.config';
import { CommonService } from '@app/common/common.service';
import { GridOptions, GridApi } from 'ag-grid-community';

@Component({
	selector: 'app-actions-dialog',
	templateUrl: './actions-dialog.component.html',
	styleUrls: ['./actions-dialog.component.scss']
})
export class ActionsDialogComponent implements OnInit {

	isLoading: boolean = false;
	actionsForm: FormGroup;
	gridApi: GridApi;
	treeGridApi: GridApi;
	promise: any;

	state = {
		pagination: {
			pageSize: 100,
			page: 1,
			type: 'all',
			from: 'import'
		},
		stepper: 0,
		isLoading: false,
		fetching: true,
		jobs: {},
		fetchingSpecs: null,
		selectedOptionSpecs: {
			values: []
		},
		selectedService: ''
	}

	products: Array<any> = [];

	gridOptions: GridOptions = {
		rowHeight: 50,
		columnDefs: [
			{
				headerName: 'Project Name', field: 'job_title', cellRenderer: (params) => {
					return params.value ?
						`<div class="project-card">
							<div class="pro-logo" style="background-image: url('`+ params.data.logo +`');"></div>
						<div class="project-name-id">							
						<span class="ellipsis-text" title="`+ params.value + `">`+ params.value + `</span>
						<span class="muted ellipsis-text" title="`+ params.data.job_no + `">`+ params.data.job_no + `</span>
					</div>
							
						</div>`
						: ''
				}
			},
			{
				headerName: 'Company Name', field: 'company_name', minWidth: 200, maxWidth: 200, cellRenderer: (params) => {
					return params.value ?
						`<div style="display: flex;flex-direction: column; line-height: 1.3;  position: relative; top: 9px;">
							<span class="ellipsis-text" title="`+ params.value + `">`+ params.value + `</span>
							<span class="muted ellipsis-text" title="`+ params.data.coordinator_name + `">`+ params.data.coordinator_name + `</span>
						</div>`
						: ''
				}
			},
			{ headerName: 'Start Date', field: 'start_date',minWidth: 150, maxWidth: 146, cellRenderer: (params) => {
				return params.value ?
					`<div style="display: flex;flex-direction: column; line-height: 1.1;  position: relative; top: 9px;">
						<span class="ellipsis-text" title="`+ params.value + `">`+ params.value + `</span>
						<div class="vertical-center-ui">
							<div class="products-count">
								<i class="pixel-icons icon-products"></i>
								<span class="count">`+params.data.prd_cnt+`</span>
							</div>
							<div class="service-count">
								<i class="pixel-icons icon-orders"></i>
								<span class="count">`+params.data.srv_cnt+`</span>
							</div>
						</div>
					</div>`
					: ''
			} },
			{ headerName: 'Delivery Due Date', field: 'delivery_due_date', minWidth: 180,maxWidth: 180  }
		],

		rowSelection: 'single',
		rowDeselection: true,

		rowModelType: 'infinite',
		infiniteInitialRowCount: 100,
		cacheOverflowSize: 2,
		maxConcurrentDatasourceRequests: 2,
		maxBlocksInCache: 2,
		/*getRowNodeId: (item) => {
			return item.id
		},*/
		// overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Please wait while the projects are loading</span>',
		localeText: { noRowsToShow: 'No Projects Found' },

		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		onGridReady: (params) => {
			this.gridApi = params.api;
			params.api.sizeColumnsToFit();
			this.gridApi.showLoadingOverlay();
			this.commonService.saveApi('jobLists', this.state.pagination)
				.then(res => {
					if (res['result'].success) {
						this.gridInitialize(res['result'].data);
					}
				})
		},
	}

	treeGridOptions: GridOptions = {
		columnDefs: [
			{
				headerName: 'All Products & Services',
				field: 'name',
				/*width: 100, */
				cellRenderer: "agGroupCellRenderer",
				
				cellRendererParams: {
					checkbox: true,
					
					innerRenderer: params => {
						if(params.data.hasOwnProperty('products_id')){
							return '<span title="'+ params.value+'"><i class="pixel-icons icon-products"></i>' + params.value+ '</span>';
						}
						if(params.data.hasOwnProperty('jobs_service_revisions_id')){	
							return '<span title="'+ params.value+'"><i class="pixel-icons icon-orders"></i>' + params.value+ '</span>';
						}
						if(params.data.hasOwnProperty('option_no')){
							return '<span class="pointer " title="Option '+ params.value+'">Option ' + params.value+'</span>';
						}
					}
				},
				headerCheckboxSelection: true,
				headerCheckboxSelectionFilteredOnly: true
			}
		],
		groupSelectsChildren: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		rowHeight: 38,
		rowData: [],
		getNodeChildDetails: this.getNodeChildDetails,
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		onGridReady: (params) => {
			this.treeGridApi = params.api;
			this.treeGridApi.sizeColumnsToFit();
		},
		onCellClicked: params => {
			if (params.data.hasOwnProperty('option_no')) {
				this.getSpecs(params);
			}
		}
	}

	constructor(
		private commonService: CommonService,
		private fb: FormBuilder,
		private dialogRef: MatDialogRef<ActionsDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.createForm();
		if (this.data.flag == 'add') {
		} else if (this.data.flag == 'import') {
		} else if (this.data.flag == 'clone') {
			this.getProductsList(this.data.jobs_id);
		} else if (this.data.flag == 'addService') {
			this.isLoading = true;
			this.getServices(this.data.prodID);
		}
	}

	goBack() {
		this.state.pagination.page = 1;
		this.state.selectedOptionSpecs = {
			values: []
		};
	}

	getSpecs(param) {
		this.state.fetchingSpecs = true;
		const params = {
			id: param.data.id,
			option_no: param.data.option_no,
			revision_no: 0
		}
		this.state.selectedService = param.node.parent.data.name;
		this.commonService.getApi('jobPrdSpecs', params)
			.then(res => {
				this.state.fetchingSpecs = false;
				if (res['result'].success) {
					this.state.selectedOptionSpecs = res['result'].data ? res['result'].data[0] : {
						values: []
					};
				}
			})
	}

	createForm() {
		this.actionsForm = this.fb.group({
			jobs_id: this.data.jobs_id
		});
	}

	getProductsList(id) {
		this.state.fetching = true;
		this.commonService.getApi('jobProductList', { jobs_id: id })
			.then(res => {
				this.state.fetching = false;
				if (res['result'].success) {
					this.treeGridOptions.rowData = res['result'].data;
				}
			})
	}

	checkLength(form) {
		let isValid = false;
		if (form.value.products)
			form.value.products.map(prod => {
				if (objectToArray(Object.keys(prod.services), prod.services).length && !isValid) {
					isValid = true;
				}
			});
		return isValid;
	}

	getServices(id) {
		this.isLoading = true;
		this.commonService.getApi('selectedPrdSrv', { id: id })
			.then(res => {
				this.isLoading = false;
				if (res['result'].success) {
					this.products.push(res['result'].data.products);
					this.products[0].services = [...res['result'].data.services];
				}
			})
	}

	gridInitialize(data) {
		var dataSource = {
			rowCount: null,
			getRows: (params) => {
				if (this.state.pagination.page == 1) {
					setTimeout(() => {
						if (this.state.pagination.page == 1) {
							this.state.jobs = data;
						} else {
							this.state.jobs['list'].push(data.list);
						}
						this.state.pagination.page++;
						var lastRow = -1;
						if (this.state.jobs['tot_cnt'] <= params.endRow) lastRow = this.state.jobs['tot_cnt'];
						params.successCallback(data.list, lastRow);
						if(data.list.length) this.gridApi.hideOverlay();
						else this.gridApi.showNoRowsOverlay();
					}, 20);
				} else {
					this.gridApi.showLoadingOverlay();
					this.commonService.saveApi('jobLists', this.state.pagination)
						.then(res => {
							if (res['result'].success) {
								if (this.state.pagination.page == 1) {
									this.state.jobs = res['result'].data;
								} else {
									this.state.jobs['list'].push(res['result'].data.list);
								}
								this.state.pagination.page++;
								var lastRow = -1;
								if (this.state.jobs['tot_cnt'] <= params.endRow) lastRow = this.state.jobs['tot_cnt'];
								params.successCallback(res['result'].data.list, lastRow);
								if(this.state.jobs['list'].length)this.gridApi.hideOverlay();
								else this.gridApi.showNoRowsOverlay();
							}
						})
				}

			}
		};
		this.gridApi.setDatasource(dataSource);
	}

	onSearch(val) {
		this.state.pagination.page = 1;
		this.state.pagination['search'] = val;
		this.commonService.saveApi('jobLists', this.state.pagination)
			.then(res => {
				if (res['result'].success) {
					this.gridInitialize(res['result'].data);
				}
			});
	}

	save() {
		switch (this.data.flag) {
			case 'add':
			case 'addService':
				this.onSave(this.actionsForm);
				break;

			case 'import':
				if (this.state.stepper == 0) {
					this.state.stepper = 1;
					this.data.jobName = this.gridApi.getSelectedRows()[0].job_title;
					this.getProductsList(this.gridApi.getSelectedRows()[0].id);
				} else {
					const selectedOptions = this.treeGridApi.getSelectedRows().map(o => o.id);
					this.cloneImportProducts('cloneJobPrd', { jobs_id: this.data.jobs_id, options: selectedOptions });
				}
				break;

			case 'clone':
				const selectedOptions = this.treeGridApi.getSelectedRows().map(o => o.id);
				this.cloneImportProducts('cloneJobPrd', { jobs_id: this.data.jobs_id, options: selectedOptions });
				break;
		}
	}

	cloneImportProducts(url, param) {
		if (!this.promise) {
			this.promise = this.commonService.saveApi(url, param)
				.then(res => {
					this.promise = undefined;
					if (res['result'].success) {
						this.dialogRef.close({ success: true, data: res['result'].data })
					}
				})
				.catch(err => {
					this.promise = undefined;
				})
		}
	}


	onSave(form) {
		if (form.valid && this.checkLength(form)) {
			form.value.products.map(prod => {
				prod.services = objectToArray(Object.keys(prod.services), prod.services);
			});

			if (this.data.flag == 'addService') form.value.type = 'edit';

			this.commonService.saveApi(this.data.url, form.value)
				.then(res => {
					if (res['result'].success) {
						this.dialogRef.close({ success: true, data: true });
					}
				})
		}
	}

	getNodeChildDetails(rowItem) {
		rowItem.name = rowItem.product_name || rowItem.services_name || rowItem.option_no;
		if (rowItem.services || rowItem.options) {
			return {
				group: true,
				children: rowItem.services || rowItem.options,
				expanded: true,
				key: rowItem.name
			};
		} else {
			return null;
		}
	};

}
