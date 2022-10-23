import { Component, OnInit, OnDestroy, HostListener, ViewChildren } from '@angular/core';
import { GridOptions, GridApi, ColumnApi, ColDef } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { JobNameComponent } from '@app/projects/post-bids-grid/post-bids-grid.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { GlobalSearchComponent } from '@app/dialogs/global-search/global-search.component';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { forkJoin } from 'rxjs';
import { checkedLength } from '@app/admin/admin.config';

import * as _ from 'lodash';
import { trigger, transition, style, animate } from '@angular/animations';
import { PiSearchInputFocus } from '@app/shared/utility/config';

var APP: any = window['APP'];

@Component({
	selector: 'app-detail-view',
	templateUrl: './detail-view.component.html',
	styleUrls: ['./detail-view.component.scss'],
	animations: [
		trigger('InLeft', [
			transition(':enter', [
				style({ transform: 'translateX(-100px)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 0 }),
				animate('50ms cubic-bezier(0.35, 1, 0.25, 1)', style({ transform: 'translateX(-100px)' }))
			])
		])
	]
})
export class DetailViewComponent implements OnInit, OnDestroy {
	APP = APP;
	displayFilter = false;
	panelOpenState = false;

	@HostListener('window:resize', ['$event'])
	onWindowResize(event) {
		this.calculateLimit(event.target);
	}

	@ViewChildren('formSearchInput') formSearchInput: any;
	@ViewChildren('clientSearchInput') clientSearchInput: any;


	savedFavJobs: Array<any> = [];

	showFilter(flag) {
		if (flag == 'show') {
			this.displayFilter = !this.displayFilter;
		}
	}

	gridApi: GridApi;
	columnApi: ColumnApi;

	state: any = {
		hasFilter: false,
		favouritesLoader: true,
		promise: null,
		snackbarPromise: null,
		isSort: '',
		loader: true,
		url: 'jobLists',
		jobsEmpty: {},
		pagination: {
			pageSize: 100,
			page: 1,
			type: 'all',
			sort: 'desc',
			column: 'start_date',
			search: ''
		},
		limit: 9,
		denominator: 9,
		framedFormsArray: [],
		filterKeys: ['status_filter', 'forms_filter', 'clients_filter', 'company_filter', 'headers'],
		savedFilters: {},
		gridView: 'all',
		filters: {
			selectAll: {
				status_filter: false,
				clients_filter: false,
				company_filter: false
			},
			status_filter: {},
			forms_filter: {},
			clients_filter: {},
			company_filter: {
				parent: {},
				child: {}
			},
			expansionPanel: {
				status_filter: false,
				clients_filter: false,
				company_filter: false
			}
		},
		dropdowns: {},
		apiCalls: [
			{ key: 'company_code_access', method: 'get', url: 'getUserCompanyCodeAccess', params: { id: APP.recon_user[0].id }, responseKey: '' },
			{ key: 'company_filter', method: 'get', url: 'getCompanyCodes', params: { status: true }, responseKey: 'items' },
			{ key: 'forms', method: 'get', url: 'formList', params: {}, responseKey: 'items' },
			{ key: 'clients_filter', method: 'get', url: 'getOrgList', params: { org_type: 2 }, responseKey: '' },
			{ key: 'status_filter', method: 'get', url: 'jobStatuses', params: {}, responseKey: '' },
		],
		activeState: {},
		isLoading: false,
		jobs: {
			list: []
		},
		favJobs: {
			list: []
		},
		columnVisible: (ev)=>{
		},
		queuedList: []
	}

	defaultColumns: ColDef[] = [
		{ headerName: 'Project Name', lockVisible: true, headerClass: 'project-name-header-grid bg-color', minWidth: 360, width: 360, pinned: 'left', field: 'job_title', cellClass: 'project-name-grid', cellRendererFramework: JobNameComponent },
		// { headerName: 'Project No', field: 'job_no' },
		{
			headerName: 'Status', lockVisible: true, field: 'status_name', headerClass: 'bg-color', minWidth: 180, width: 180, cellClass: 'vertical-align-top-cell', cellRenderer: (params) => {
				if (params.value) {
					// const className = this.convertToClass(params.value);
					return `<div class="job_status status_` + params.data.status_id + `">` + params.value + `</div>`;
				} else {
					return ''
				}
			}
		},
		{ headerName: 'Start Date', lockVisible: true, field: 'start_date', headerClass: 'bg-color', sort: 'desc', minWidth: 140, width: 140, cellClass: 'regularFont  second-grid-color vertical-align-top-cell' },
		{ headerName: 'Delivery Due Date', lockVisible: true, field: 'delivery_due_date', headerClass: 'bg-color', minWidth: 164, width: 164, cellClass: 'regularFont second-grid-color vertical-align-top-cell' },
		{
			headerName: 'Company Name', lockVisible: true, field: 'company_name', minWidth: 192, width: 192, cellClass: 'vertical-align-top-cell', headerClass: 'bg-color'/*, cellRenderer: (params) => {
					return params.value ?
						`<div class="job-info cmpy-info">
							<span>`+ params.value + `</span>
							<span><i>`+ params.data.coordinator_name + `</i></span>
						</div>`
						: ''
				}*/
		},
		{ headerName: 'Coordinators', lockVisible: true, field: 'coordinator_name', minWidth: 192, width: 192, cellClass: 'vertical-align-top-cell', headerClass: 'bg-color' },
	];
	extraColumns: ColDef[] = [];

	gridOptions: GridOptions = {
		rowHeight: 52,
		// sideBar: true,
		sideBar: {
			toolPanels: [
				{
					id: 'columns',
					labelDefault: 'Columns',
					labelKey: 'columns',
					iconKey: 'columns',
					toolPanel: 'agColumnsToolPanel'
				}/*,
				{
					id: 'filters',
					labelDefault: 'Filters',
					labelKey: 'filters',
					iconKey: 'filter',
					toolPanel: 'agFiltersToolPanel'
				}*/
			]
		},
		columnDefs: [], //this.defaultColumns,
		sortingOrder: ['asc', 'desc'],
		rowSelection: 'single',
		paginationPageSize: 100,
		pagination: true,
		// suppressPaginationPanel: true,
		rowDeselection: true,
		rowModelType: 'serverSide',
		overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Please wait while your rows are loading</span>',
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		localeText: { noRowsToShow: 'No Projects Found' },
		defaultColDef: {
			resizable: true,
			sortable: true
		},
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		onColumnVisible: (ev)=>{
			const indx = this.state.jobs.user_filters.headers.indexOf(ev.column['colId']);
			if(indx > -1) this.state.jobs.user_filters.headers.splice(indx, 1);
			else this.state.jobs.user_filters.headers.push(ev.column['colId']);
			this.saveFilterToBackend();
		},
		onGridReady: (params) => {
			this.gridApi = params.api;
			this.columnApi = params.columnApi;

			setTimeout(() => {
				// if(this.columnApi.getAllDisplayedColumns.length){
				//   this.columnApi.autoSizeColumns([this.columnApi.getAllDisplayedColumns[0].colDef]);
				// }
				this.gridApi.sizeColumnsToFit();
				// params.api.resetRowHeights();
				// (<GridApi>this.gridApi).sizeColumnsToFit();
			}, 500);
			var dataSource = {
				rowCount: null,
				getRows: (params) => {
					if (params.request.sortModel.length) {
						this.state.pagination.column = params.request.sortModel[0].colId;
						this.state.pagination.sort = params.request.sortModel[0].sort;
					}
					setTimeout(() => {
						if (this.state.pagination.page == 1 && !this.state.isSort) {
							this.state.savedFilters = this.state.jobs.user_filters || {};
							this.state.pagination.page++;
							var lastRow = -1;
							if (this.state.jobs['tot_cnt'] <= params.request.endRow) lastRow = this.state.jobs['tot_cnt'];
							params.successCallback(this.state.jobs.list, this.state.jobs['tot_cnt']);

							if (!this.state.jobs['list'].length) this.gridApi.showNoRowsOverlay();
							else this.gridApi.hideOverlay();

							this._commonService.update({ type: 'recentJobs', list: this.state.jobs.hasOwnProperty('favJobs') ? (this.state.jobs.favJobs.recent_jobs || []) : [] });
						} else {
							this.state.isSort = false;
							if (this.state.savedFilters) this.state.pagination = { ...this.state.savedFilters, ...this.state.pagination };
							this._commonService.saveApi(this.state.url, this.state.pagination)
								.then(res => {
									if (res['result'].success) {
										// if (this.state.pagination.page == 1) {
										// 	this.state.jobs = res['result'].data;
										// } else {
										// 	this.state.jobs['tot_cnt'] = res['result'].data.tot_cnt;
										// 	this.state.jobs['list'].push(res['result'].data.list);
										// }
										this.state.jobs['favJobs'] = res['result'].data.favJobs;
										this.state.jobs['tot_cnt'] = res['result'].data.tot_cnt;
										this.state.savedFilters = res['result'].data.user_filters || {};
										this.state.pagination.page++;
										var lastRow = -1;
										if (this.state.jobs['tot_cnt'] <= params.request.endRow) lastRow = this.state.jobs['tot_cnt'];
										params.successCallback(res['result'].data.list, this.state.jobs['tot_cnt']);
										if (!res['result'].data.list.length) this.gridApi.showNoRowsOverlay();
										else this.gridApi.hideOverlay();
									}
								})
						}
					}, 20);
				}
			};
			params.api.setServerSideDatasource(dataSource);
			// params.api.sizeColumnsToFit();
			/*this.state.pagination.type = this.state.activeState['flag'];
			if (this.state.activeState.flag == 'favorites') {
				this.state.pagination.type = 'recent';
				//this.gridApi.setDomLayout('autoHeight');
			}
			this.state.loader = true;*/
			// if (this.state.savedFilters) this.state.pagination = {...this.state.pagination, ...this.state.savedFilters };
			/*this._commonService.saveApi(this.state.url, this.state.pagination)
				.then(res => {
					var dataSource = {
						rowCount: null,
						getRows: (params) => {
							if (params.request.sortModel.length) {
								this.state.pagination.column = params.request.sortModel[0].colId;
								this.state.pagination.sort = params.request.sortModel[0].sort;
							}
							setTimeout(() => {
								if (this.state.pagination.page == 1 && !this.state.isSort) {
									this.state.jobs = res['result'].data;
									this.state.savedFilters = res['result'].data.user_filters || {};
									this.state.pagination.page++;
									var lastRow = -1;
									if (this.state.jobs['tot_cnt'] <= params.request.endRow) lastRow = this.state.jobs['tot_cnt'];
									params.successCallback(res['result'].data.list, this.state.jobs['tot_cnt']);

									if (!this.state.jobs['list'].length) this.gridApi.showNoRowsOverlay();
									else this.gridApi.hideOverlay();

									this._commonService.update({ type: 'recentJobs', list: res['result'].data.favJobs.recent_jobs || [] });
									this.state.loader = false;
								} else {
									this.state.loader = true;
									this.state.isSort = false;
									if (this.state.savedFilters) this.state.pagination = { ...this.state.savedFilters, ...this.state.pagination };
									this._commonService.saveApi(this.state.url, this.state.pagination)
										.then(res => {
											this.state.loader = false;
											if (res['result'].success) {
												if (this.state.pagination.page == 1) {
													this.state.jobs = res['result'].data;
												} else {
													this.state.jobs['tot_cnt'] = res['result'].data.tot_cnt;
													this.state.jobs['list'].push(res['result'].data.list);
												}
												this.state.savedFilters = res['result'].data.user_filters || {};
												this.state.pagination.page++;
												var lastRow = -1;
												if (this.state.jobs['tot_cnt'] <= params.request.endRow) lastRow = this.state.jobs['tot_cnt'];
												params.successCallback(res['result'].data.list, this.state.jobs['tot_cnt']);
												if (!this.state.jobs['list'].length) this.gridApi.showNoRowsOverlay();
												else this.gridApi.hideOverlay();
											}
										})
								}
							}, 20);
						}
					};
					params.api.setServerSideDatasource(dataSource);
				})*/
		},
		onSortChanged: (params) => {
			this.resetGrid();
		},
		onCellClicked: (params) => {
			if (params.event.target['className'] == 'pixel-icons icon-favorites' || params.event.target['className'] == 'pixel-icons icon-favorites-filled') {
				this.addRemoveFav(params.data);
				if (this.state.snackbarPromise) clearTimeout(this.state.snackbarPromise);
				this.state.snackbarPromise = setTimeout(() => {
					this.openSnackBar({ status: 'success', msg: 'Project Updated Successfully' });
				}, 500);
				this.queueRequest(this.state.jobs, params.data);
			}
		},
		onRowClicked: params => {
			if (params.event.target['className'] != 'pixel-icons icon-favorites-filled' && params.event.target['className'] != 'pixel-icons icon-favorites') {
				this._commonService.projectState = this.state.activeState.flag;
				this._router.navigate(['/projects/' + params.data.id + '/overview']);
			}
		}
	}

	formsGridApi: GridApi;
	formFilterGrid: GridOptions = {
		rowHeight: 40,
		// colWidth: 312,
		columnDefs: [
			{ field: 'product', rowGroupIndex: 1, hide: true },
		],
		groupDefaultExpanded: 1,
		rememberGroupStateWhenNewData: true,
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		groupSelectsChildren: true,
		autoGroupColumnDef: {
			headerName: 'Products/Services', headerClass: 'forms-header-grid', cellClass: 'forms-grid', field: 'name', cellRenderer: 'agGroupCellRenderer', cellRendererParams: {
				checkbox: true,
				innerRenderer: (params) => {
					return params.hasOwnProperty("data") ? '<i class="pixel-icons icon-orders"></i>' + params.value : '<i class="pixel-icons icon-products"></i>' + params.value
				},
				// headerCheckboxSelection: true,
				// headerCheckboxSelectionFilteredOnly: true,
			},

			headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true, rowGroupIndex: 1
		},
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		onGridReady: params => {
			params.api.sizeColumnsToFit();
			this.formsGridApi = params.api;
		}
	}

	clientsGridApi: GridApi;
	clientsFilterGrid: GridOptions = {
		rowHeight: 40,
		columnDefs: [
			{
				headerName: 'Select All', field: 'name', cellRenderer: 'agGroupCellRenderer', cellRendererParams: {
					checkbox: true
				},
				headerCheckboxSelection: true,
				headerCheckboxSelectionFilteredOnly: true
			}
		],
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		onGridReady: params => {
			params.api.sizeColumnsToFit();
			this.clientsGridApi = params.api;
		}
	}

	constructor(
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _router: Router,
		private activeRoute: ActivatedRoute,
		private _commonService: CommonService
	) {
		activeRoute.data.subscribe(data => {
			// all, my, favorites
			this.state.activeState = data;
			if (this.state.activeState.flag == 'my') this.state.pagination.users_id = APP.recon_user[0].id;
			else delete this.state.pagination.users_id;
			if (this.state.activeState.flag == 'favorites') {
				this.state.url = 'favJobLists';
				this.state.pagination.users_id = APP.recon_user[0].id;
			}
		})

	}

	calculateLimit(window) {
		if (window.innerWidth > 1367)
			this.state.limit = this.state.denominator = 12;
		else if (window.innerWidth <= 1367 && window.innerWidth >= 1200)
			this.state.limit = this.state.denominator = 9;
		else if (window.innerWidth >= 861 && window.innerWidth < 1200)
			this.state.limit = this.state.denominator = 6;
		else if (window.innerWidth <= 860)
			this.state.limit = this.state.denominator = 3;
	}

	changeLimit() {
		const nextLimit = this.state.limit / this.state.denominator;
		this.state.limit = this.state.denominator * (nextLimit + 1);
	}

	addRemoveFav(row) {
		const indx = _.findIndex(this.state.favJobs['list'], ['id', row.id]);
		if (indx > -1) {
			this.state.favJobs['list'].splice(indx, 1);
		} else {
			this.state.favJobs['list'].push(row);
		}
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	menuOpened(prop) {
		this.state.filters.expansionPanel[prop] = true;
		if (prop == 'company_filter') {
			this.state.filters[prop].parent = {};
			this.state.filters[prop].child = {};
		}
		else this.state.filters[prop] = {};
		if (this.state.savedFilters[prop]) {
			this.state.savedFilters[prop].map(o => {
				if (prop == 'company_filter')
					this.state.filters[prop].child[o] = true;
				else this.state.filters[prop][o] = true
			})
			if (prop == 'company_filter') {
				this.checkCompanyFilters(prop, this.state.savedFilters[prop]);
			} else if (prop == 'forms_filter') {
				this.formsMenuOpen(prop);
			} else if (prop == 'clients_filter') {
				this.clientsMenuOpen(prop);
			} else {
				if (this.state.savedFilters[prop].length == this.state.dropdowns[prop].length) {
					this.state.filters.selectAll[prop] = true;
				}
			}
		}
	}

	checkCompanyFilters(prop, selectedIds) {
		let parentCounter = 0;
		this.state.dropdowns[prop].map(parent => {
			let counter = 0;
			parent.children.map(child => {
				if (selectedIds.indexOf(child.id) > -1) counter++;
			})
			if (counter > 0) this.state.filters[prop].parent[parent.id] = true;
			if (counter == parent.children.length) parentCounter++;
		})
		if (parentCounter == this.state.dropdowns[prop].length) this.state.filters.selectAll[prop] = true;
	}

	changeGrid(val) {
		const selected_ids = this.formsGridApi.getSelectedRows().map(o => o.id);
		if (val == 'all') {
			this.formsGridApi.setRowData(this.state.framedFormsArray);
			this.defaultCheckForms(selected_ids, this.formsGridApi);
		} else if (val == 'selected') {
			const data = this.formsGridApi.getSelectedRows().map(o => o);
			this.formsGridApi.setRowData(data);
			this.defaultCheckForms(selected_ids, this.formsGridApi);
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

	formsMenuOpen(prop) {
		setTimeout(() => {
			PiSearchInputFocus(this.formSearchInput);
			this.formsGridApi.setRowData(this.state.framedFormsArray);
			this.defaultCheckForms(this.state.savedFilters[prop], this.formsGridApi)
		}, 200);
	}

	clientsMenuOpen(prop) {
		setTimeout(() => {
			PiSearchInputFocus(this.clientSearchInput);
			this.clientsGridApi.setRowData(this.state.dropdowns[prop]);
			this.defaultCheckForms(this.state.savedFilters[prop], this.clientsGridApi);
			setTimeout(() => {
				this.clientsGridApi.sizeColumnsToFit();
			}, 200);
		}, 200);
	}

	menuSearch(api: GridApi, val) {
		api.setQuickFilter(val);
	}

	resetGrid() {
		this.state.isSort = true;
		this.state.pagination.page = 1;
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
						this.state.dropdowns[arr[i].key] = o['result'].data.items || [];
					} else {
						this.state.dropdowns[arr[i].key] = o['result'].data || [];
					}
				});
				this.state.dropdowns.company_filter.map(o => {
					if(this.state.dropdowns.company_code_access.indexOf(o.id) > -1) {
						o.is_visible = true;
						o.children.map(p => {
							if(this.state.dropdowns.company_code_access.indexOf(p.id) > -1) p.is_visible = true;
							else p.is_visible = false;
						})
					} else {
						o.is_visible = false;
					}
				})
				if (this.state.dropdowns.forms.length) this.state.framedFormsArray = this.frameGridData(this.state.dropdowns.forms);
			})
	}

	openGlobalSearch() {
		this._dialog.open(GlobalSearchComponent, {
			width: '100vw',
			maxWidth: '100vw',
			height: '100vh',
			panelClass: 'global-search-dialog',
			/*position: { left: '300px', top: '0px', right: '0px', bottom: '0px' },*/
			disableClose: true,
			data: {
				fetchUrl: this.state.url
			}
		})
			.afterClosed()
			.subscribe(res => {
			})
	}

	convertToClass(val) {
		const arr = val.trim().toLowerCase().split(' ');
		return arr.length > 1 ? arr.join('_') : arr.join('');
	}

	ngOnInit() {
		this.calculateLimit(window);
		if (this.state.activeState.flag == 'favorites') {
			setTimeout(() => {
				this.getFavJobs();
			}, 20);
		}
		this.getApiCalls(this.state.apiCalls);
		this.state.loader = true;
		this.getProjectGridList();
	}

	getProjectGridList() {
		this.state.pagination.type = this.state.activeState['flag'];
		if (this.state.activeState.flag == 'favorites') {
			this.state.pagination.type = 'recent';
		}
		this._commonService.saveApi(this.state.url, this.state.pagination)
			.then(res => {
				this.state.loader = false;
				if (res['result'].success) {
					this.state.jobs = res['result'].data;
					this.generateColumns(this.state.jobs.headers, this.state.jobs.user_filters.headers);
					this.state.hasFilter = this.isFilter();
				}
			})
	}

	generateColumns(column, visibleHeaders = []) {
		this.extraColumns = [];
		column = column || [];
		column.map(o => {
			this.extraColumns.push({
				headerName: o.headerName,
				field: o.field,
				minWidth: 180, 
				width: 180,
				hide: visibleHeaders.indexOf(o.field) == -1
			})
		})

		this.gridOptions.columnDefs = [...this.defaultColumns, ...this.extraColumns];
	}

	isFilter(): boolean {
		let hasFilter = false;
		['clients_filter', 'company_filter', 'forms_filter', 'status_filter', 'headers'].map(prop => {
			if (this.state.jobs.user_filters[prop].length) hasFilter = true;
		})
		return hasFilter;
	}

	queueRequest(data, row) {
		const favorites = data['favJobs'].jobs_ids;
		this.savedFavJobs = favorites;
		let selected = row;
		const indx = favorites.indexOf(selected.id);
		if (indx > -1) {
			favorites.splice(indx, 1);
		} else {
			favorites.push(selected.id);
		}
		if (this.state.promise) clearTimeout(this.state.promise);
		this.state.promise = setTimeout(() => {
			this.saveFavorites(this.savedFavJobs);
		}, 3000);
	}

	getFavJobs() {
		this.state.favouritesLoader = true;
		const params = { ...this.state.pagination, ...{ type: '' } };
		this._commonService.saveApi(this.state.url, params)
			.then(res => {
				this.state.favouritesLoader = false;
				if (res['result'].success) {
					this.state.favJobs = res['result'].data;
				}
			})
	}

	changeFav(obj, i) {
		this.gridApi.forEachNode(o => {
			if (o.data.id == this.state.favJobs.list[i].id) {
				var updated = o.data;
				updated.is_favorite = false;
				o.setData(updated);
			}
		});
		this.state.favJobs.list.splice(i, 1);
		this.queueRequest(this.state.favJobs, obj);
	}

	ngOnDestroy() {
		if (this.state.promise) {
			clearTimeout(this.state.promise);
			this.saveFavorites(this.savedFavJobs);
		}
	}

	saveFavorites(fav?) {
		const key = this.state.activeState.flag == 'favorites' ? 'favJobs' : 'jobs';
		const params = {
			id: this.state[key]['favJobs'].id,
			jobs_ids: fav ? fav : this.state[key]['favJobs'].jobs_ids,
			users_id: this.state[key]['favJobs'].users_id
		}
		this._commonService.saveApi('saveFavJobs', params)
			.then(res => {
				if (res['result'].success) {
					this.state.promise = null;
				}
			})
	}

	frameGridData(data) {
		const arr = [];
		data.map(o => {
			o.children.map(p => {
				arr.push({
					product: o.name,
					...p
				})
			})
		});
		return arr;
	}

	menuActions(flag, prop) {
		if (flag == 'clear') {
			if (prop == 'company_filter') {
				this.state.dropdowns[prop].map(o => {
					delete this.state.filters[prop].parent[o.id];
					o.children.map(p => {
						delete this.state.filters[prop].child[p.id];
					})
				})
			} else if (prop == 'clients_filter') {
				this.clearChecked(this.clientsGridApi);
			} else if (prop == 'forms_filter') {
				this.clearChecked(this.formsGridApi);
			} else {
				this.state.dropdowns[prop].map(o => {
					delete this.state.filters[prop][o.id];
				})
			}

			this.state.filters.selectAll[prop] = false;
			// if ((this.state.pagination[prop] ? this.state.pagination[prop].length : false || this.state.savedFilters[prop].length))
			// 	setTimeout(() => {
			// 		this.saveFilter(prop);
			// 	}, 200);
		}
	}

	clearChecked(gridApi) {
		setTimeout(() => {
			gridApi.forEachNodeAfterFilter((node) => {
				node.setSelected(false);
			});
		}, 100);
	}

	isCheckAll(prop) {
		if (Object.keys(checkedLength(this.state.filters[prop])).length == this.state.dropdowns[prop].length) this.state.filters.selectAll[prop] = true;
		else this.state.filters.selectAll[prop] = false;
	}

	selectAll(prop) {
		if (prop == 'company_filter') {
			this.state.dropdowns[prop].map(o => {
				this.state.filters[prop].parent[o.id] = this.state.filters.selectAll[prop];
				o.children.map(p => {
					this.state.filters[prop].child[p.id] = this.state.filters.selectAll[prop];
				})
			})
		} else {
			this.state.dropdowns[prop].map(o => {
				this.state.filters[prop][o.id] = this.state.filters.selectAll[prop];
			})
		}
	}

	change(prop) {
		this.isCheckAll(prop);
	}

	changeParent(parent) {
		parent.children.map(o => {
			this.state.filters.company_filter.child[o.id] = this.state.filters.company_filter.parent[parent.id];
		})
	}

	changeChild(parent, child) {
		if (this.state.filters.company_filter.child[child.id]) this.state.filters.company_filter.parent[parent.id] = true;
	}

	searchList(val) {
		this.resetGrid();
		this.state.pagination.search = val;
		this.gridApi.onFilterChanged();
		setTimeout(() => {
			this.gridApi.forEachNode((leafNode) => {
				this.state.jobsEmpty = leafNode.data;
			});
		}, 1000);
	}

	saveFilter(prop) {
		this.resetGrid();
		if (prop == 'forms') {
			this.state.pagination['forms_filter'] = this.formsGridApi.getSelectedRows().map(o => o.id);
		} else if (prop == 'clients_filter') {
			this.state.pagination[prop] = this.clientsGridApi.getSelectedRows().map(o => o.id);
		} else if (prop == 'company_filter') {
			this.state.pagination[prop] = Object.keys(checkedLength(this.state.filters[prop].child)).map(Number);
		} else {
			this.state.pagination[prop] = Object.keys(checkedLength(this.state.filters[prop])).map(Number);
		}
		this.gridApi.onFilterChanged();
		this.saveFilterToBackend();
	}

	saveFilterToBackend() {
		const params = {};
		this.state.filterKeys.map(key => {
			params[key] = this.state.pagination[key] || this.state.savedFilters[key] || [];
		})
		this._commonService.saveApi('saveUserJobFilters', params)
			.then(res => {
				if (res['result'].success) {
					  this._snackbar.openFromComponent(SnackbarComponent, {
						data: { status: 'success', msg: 'Filters applied successfully' },
						verticalPosition: 'top',
						horizontalPosition: 'right'
					  });
					}
			})
	}

	openSnackBar = (obj) => {
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
