import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { GridOptions, GridApi } from 'ag-grid-community';
import { JobNameComponent } from '@app/projects/post-bids-grid/post-bids-grid.component';
import { CommonService } from '@app/common/common.service';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
	selector: 'app-global-search',
	templateUrl: './global-search.component.html',
	styleUrls: ['./global-search.component.scss']
})
export class GlobalSearchComponent implements OnInit {

	gridApi: GridApi;
	gridOptions: GridOptions = {
		rowHeight: 48,
		headerHeight: 42,
		columnDefs: [
			// { headerName: 'Job Name', headerClass:'bg-skyblue', field: 'job_title', cellRendererFramework: JobNameComponent },
			// { headerName: 'Project Number', field: 'job_no', headerClass:'bg-skyblue' },
			// { headerName: 'Delivery Due Date', field: 'delivery_due_date', headerClass:'bg-skyblue' },
			{ headerName: 'Project Name', lockVisible: true, autoHeight: true, headerClass: 'project-name-header-grid bg-skyblue', width: 240, field: 'job_title', cellClass: 'project-name-grid', cellRendererFramework: JobNameComponent },
			{ headerName: 'Start Date', width: 120, field: 'start_date', headerClass: 'bg-skyblue', sort: 'desc' },
			{ headerName: 'Delivery Due Date', width: 120, field: 'delivery_due_date', headerClass: 'bg-skyblue' },
			{ headerName: 'Company Name', field: 'company_name', headerClass: 'bg-skyblue' },
			{
				headerName: 'Status', width: 120, field: 'status_name', headerClass: 'bg-skyblue', cellRenderer: (params) => {
					if (params.value) {
						const className = this.convertToClass(params.value);
						return `<div class="status ` + className + `">` + params.value + `</div>`;
					} else {
						return ''
					}
				}
			},
			// {
			// 	headerName: 'Company Name', field: 'company_name',headerClass:'bg-skyblue', cellRenderer: (params) => {
			// 		return params.value ?
			// 			`<div class="job-info cmpy-info">
			// 				<span>`+ params.value + `</span>
			// 				<span><i>`+ params.data.coordinator_name + `</i></span>
			// 			</div>`
			// 			: ''
			// 	}
			// }
		],

		rowSelection: 'single',
		rowDeselection: true,

		rowModelType: 'serverSide',
		enableServerSideFilter: true,

		pagination: true,

		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],

		defaultColDef: {
			resizable: true,
			sortable: true,
		},

		onGridReady: (params) => {
			this.gridApi = params.api;
			params.api.sizeColumnsToFit();
			var dataSource = {
				rowCount: null,
				getRows: (params) => {
					if (params.request.sortModel.length) {
						this.state.pagination.column = params.request.sortModel[0].colId;
						this.state.pagination.sort = params.request.sortModel[0].sort;
					}

					setTimeout(() => {
						if (this.state.pagination.page == 1 && !this.state.isSort) {
							params.successCallback([], 0);
						} else {
							this.state.isSort = false;
							if (this.state.pagination.search.length) {
								this._commonService.saveApi(this.data.fetchUrl, this.state.pagination)
									.then(res => {
										if (res['result'].success) {
											this.state.pagination.page++;
											this.state.favJobs = res['result'].data.favJobs;
											if (this.state.pagination.page == 1) this.state.jobList = res['result'].data.list;
											else this.state.jobList = [...this.state.jobList, ...res['result'].data.list];
											var lastRow = -1;
											if (res['result'].data['tot_cnt'] <= params.request.endRow) lastRow = res['result'].data['tot_cnt'];
											params.successCallback(res['result'].data.list, lastRow);
											if (!res['result'].data['list'].length) this.gridApi.showNoRowsOverlay();
											else this.gridApi.hideOverlay();
										}
									})
							} else {
								params.successCallback([], 0);
							}
						}
					}, 20);
				}
			};
			params.api.setServerSideDatasource(dataSource);
		},
		onSortChanged: (params) => {
			this.resetGrid();
		},
		onCellClicked: (params) => {
			if (params.event.target['className'] == 'pixel-icons icon-favorites' || params.event.target['className'] == 'pixel-icons icon-favorites-filled') {
				if (this.state.snackbarPromise) clearTimeout(this.state.snackbarPromise);
				this.state.snackbarPromise = setTimeout(() => {
					this.openSnackBar({ status: 'success', msg: 'Project Updated Successfully' });
				}, 500);
				this.queueRequest(this.state.favJobs, this.state.jobList[params.rowIndex]);
			}
		}
	}

	state = {
		isSort: false,
		promise: null,
		snackbarPromise: null,
		pagination: {
			pageSize: 50,
			page: 1,
			type: 'all',
			search: '',
			column: '',
			sort: ''
		},
		jobList: [],
		favJobs: [],
		savedFavJobs: []
	}

	constructor(
		private _commonService: CommonService,
		private _snackbar: MatSnackBar,
		private dialogRef: MatDialogRef<GlobalSearchComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	convertToClass(val) {
		const arr = val.trim().toLowerCase().split(' ');
		return arr.length > 1 ? arr.join('_') : arr.join('');
	}
	ngOnInit() {
	}

	resetGrid() {
		this.state.isSort = true;
		this.state.pagination.page = 1;
	}

	close() {
		this.dialogRef.close();
	}

	onSearch(val) {
		this.resetGrid();
		this.state.pagination.search = val;
		this.gridApi.onFilterChanged();
	}

	queueRequest(data, row) {
		const favorites = data.jobs_ids;
		this.state.savedFavJobs = favorites;
		let selected = row;
		const indx = favorites.indexOf(selected.id);
		if (indx > -1) {
			favorites.splice(indx, 1);
		} else {
			favorites.push(selected.id);
		}
		if (this.state.promise) clearTimeout(this.state.promise);
		this.state.promise = setTimeout(() => {
			this.saveFavorites(this.state.savedFavJobs);
		}, 3000);
	}

	saveFavorites(fav?) {
		const params = {
			id: this.state.favJobs['id'],
			jobs_ids: fav ? fav : this.state.favJobs['jobs_ids'],
			users_id: this.state.favJobs['users_id']
		}
		this._commonService.saveApi('saveFavJobs', params)
			.then(res => {
				if (res['result'].success) {
					this.state.promise = null;
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
