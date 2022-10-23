import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { GridOptions, GridApi, ColumnApi, RowNode } from 'ag-grid-community';
import { agGridColumnAutoFit } from '@app/shared/utility/config';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router, ActivationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _moment from 'moment';
import { TasksService } from '../tasks.service';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

var APP: any = window['APP'];

/* Grid Status Components */
@Component({
	template: `<div *ngIf="params.data">
					<ng-container *ngIf="params.data.is_enable">
						<div *ngIf="params.data.slug != 'delivery_due_date'" style="position: relative; top: -1px;" [matMenuTriggerFor]="menu" class="empty-status status-pills disable-click task-status-pills status_{{params.data.status}}">
							<span class="disable-click"> {{params.value}}</span>
							<i class="disable-click pixel-icons icon-arrow-down"></i>
						</div>
						<mat-menu #menu="matMenu" xPosition="after" yPosition="below" class="drop-menu-ui">
							<a *ngFor="let st of params.data.status_dropdown" [innerHtml]="st.name"
								(click)="performActions(st)"
								[class.active]="st.id == params.data.status"></a>
						</mat-menu>
					</ng-container>
					<div *ngIf="!params.data.is_enable || params.data.slug == 'delivery_due_date'" style="position: relative; top: -1px;" class="status-pills task-status-pills status_{{params.data.status}}">
						<span [innerHtml]="params.value"></span>
					</div>
				</div>`,
	styles: [`
	.empty-status.status-pills.status_0{
		background: #f4e4d8;
		color: #90574c;
		line-height: normal;
		height: 100%;
		display: inline-flex;
		justify-content: space-between;
		padding: 1px 8px 1px 4px;
	}
	`]
})

export class StatusMenuCell {
	params: any;
	status: Array<any> = [
		{ id: 1, name: 'Active' },
		{ id: 2, name: 'Inprogress' },
		{ id: 3, name: 'Complete' }
	]
	constructor(private _commonService: CommonService, private _taskService: TasksService, private _snackbar: MatSnackBar, private activeRoute: ActivatedRoute) { }
	agInit(params) {
		this.params = params;
	}
	updateModifiedUser(row, keys, data) {
		keys.map(prop => {
			row[prop] = data[prop];
		})
	}
	performActions(st) {console.log('params data', this.params)
		this._commonService.saveApi('taskFlow', {
			jobs_id: this.params.jobs_id,
			id: this.params.data.id,
			status_id: st.id,
			key: st.key,
			task_id: this.params.data.task_id,
			task_type_id: this.params.data.task_type_id
		})
			.then(res => {
				if (res['result'].success) {
					this._commonService.update({ type: 'job_status', data: null });
					if (res['result'].data.status) {
						// if (this.params.data.slug == 'deliver') {
						// 	(<GridApi>this.params.api).getModel().forEachNode((node: RowNode) => {
						// 		if (node.data.slug == 'delivery_due_date' && st.id == 5) {
						// 			node.data.is_enable = false;
						// 			node.data.status = st.id;
						// 			node.data.status_name = st.name;
						// 			node.data.status_dropdown = res['result'].data.status_dropdown || [];
						// 			node.setData(node.data);
						// 		}
						// 	})
						// }
						// if (this.params.data.slug == 'final_bill_due') {
						// 	(<GridApi>this.params.api).getModel().forEachNode((node: RowNode) => {
						// 		if (node.data.slug == 'final_bill_due_date' && st.id == 5) {
						// 			node.data.is_enable = false;
						// 			node.data.status = st.id;
						// 			node.data.status_name = st.name;
						// 			node.data.status_dropdown = res['result'].data.status_dropdown || [];
						// 			node.setData(node.data);
						// 		}
						// 	})
						// }
						this.params.data.is_enable = st.id == 5 ? false : true;
						this.params.data.status = res['result'].data.status_id;
						this.params.data.status_name = res['result'].data.status_name;
						this.params.data.status_dropdown = res['result'].data.status_dropdown || [];
						this.params.data.settings = !this.params.data.settings;
						this.updateModifiedUser(this.params.data, ['last_modified_by', 'last_modified_on'], res['result'].data);
						this.params.node.setData(this.params.data);
						if (this.activeRoute.snapshot.firstChild && this.activeRoute.snapshot.firstChild.params.id == this.params.data.id)
							this._taskService.update({ type: 'task-ag-status-change', data: { trans: st, res: res['result'].data, selected: this.params.data } });
					} else {
						this.snackbarModal('error', false, res['result'].data.message);
					}
				}
			})
	}

	snackbarModal(status = 'success', isNew = true, msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: status, msg: msg ? msg : ('Task ' + (isNew ? 'Created ' : 'Updated ') + ' Successfully') },
			verticalPosition: 'top',
			horizontalPosition: 'right',
			panelClass: status
		});
	}
}

@Component({
	template: `<ng-container *ngIf="params.data">
					<div class="box">
						<pi-avatar size="md" [user]="userObj" appearance="circle"></pi-avatar>
						<span [innerHtml]="params.value"></span>
					</div>
				</ng-container>`,
	styles: [``]
})

export class AssigneeCell {
	params: any;
	userObj = {
		firstName: '',
		lastName: '',
		imageUrl: ''
	}
	constructor() { }
	agInit(params) {
		this.userObj.firstName = params.value.split(' ')[0];
		this.userObj.lastName = params.value.split(' ').length > 1 ? params.value.split(' ')[1] : '';
		this.params = params;
	}
}
@Component({
	template: `<ng-container *ngIf="params.data && params.value">
					<div  class="user-media">
						<div  class="figure align-items-center d-flex">
							<pi-icon name="icon-task-fill" size="md" background="#8082f7" color="#FFF"></pi-icon>
						</div>
						<div class="user-media-body line-height-1-5 long-and-truncated" style="padding-top: 7px;">
							<div class="estimate-no-status">
								<p class="user-name color-dark medium-font" ><a matTooltip="{{params.value}}">{{params.value}}</a></p>
							</div>
							<small matTooltip="{{params.data.job_title}}" style="color: #606787;">{{params.data.job_title}}</small>
						</div>
					</div> 
				</ng-container>`,
	styles: [``]
})

export class userMedia {
	params: any;
	userObj = {
		firstName: '',
		lastName: '',
		imageUrl: ''
	}
	constructor() { }
	agInit(params) {
		this.params = params;
		if(params.value) {
			this.userObj.firstName = params.value.split(' ')[0];
			this.userObj.lastName = params.value.split(' ').length > 1 ? params.value.split(' ')[1] : '';
		}
	}
}

@Component({
	selector: 'app-task-grid',
	templateUrl: './task-grid.component.html',
	styles: [`
		:ng-host{
			height: 100%;
		}
	`]
})
export class TaskGridComponent implements OnInit {

	isVisible: boolean = false;
	pagination = {
		page: 1,
		pageSize: 100,
		search: '',
		column: 'due_date',
		sort: 'desc',
		type: 'all'
	};

	state = {
		isLoading: true,
		init: true,
		isSort: false,
		tasksDetails: {
			list: [],
			user_filters: {},
			total: 0
		},
		selectedTask: null
	}

	gridApi: GridApi;
	gridColumnApi: ColumnApi;
	gridOptions: GridOptions = {
		rowHeight: 52,
		headerHeight: 38,
		columnDefs: [
			
			{ headerName: 'Tasks/Milestone', field: 'task_name', lockVisible: true, cellRenderer: 'agGroupCellRenderer', cellClass: 'medium-font top-align' },
			{
				headerName: 'Project Number', field: 'job_no', lockVisible: true, onCellClicked: params => {
					if (params.data && params.data.jobs_id) this._router.navigate(['/projects/' + params.data.jobs_id]);
				}, cellStyle: { color: '#3955a0' }, cellRendererFramework:userMedia
			},
			{
				headerName: 'Status', field: 'status_name', cellRendererFramework: StatusMenuCell, cellRendererParams: {
					isGlobal: true
				}, sortable: false, cellClass: 'disable-click', onCellValueChanged: params => {
					if (params.data) {
						this._taskService.update({ type: 'gridStatusChange', data: { is_enable: params.data.is_enable, status: params.data.status, status_name: params.data.status_name, status_dropdown: params.data.status_dropdown, status_buttons: params.data.status_buttons } });
					}
				}
			},
			{ headerName: 'Assignee', field: 'assignee_name', hide: true /*cellRendererFramework: AssigneeCell*/ },
			// { headerName: 'Task Name', field: 'task_type_name' },
			{
				headerName: 'Due Date', field: 'due_date', sort: 'desc', valueFormatter: params => {
					if (params.value)
						return _moment(new Date(params.value)).format('MMM DD, YYYY hh:mm');
					else return '--';
				}
			}

		],
		rowSelection: 'single',
		animateRows: true,
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		localeText: { noRowsToShow: 'No Tasks/Milestone Found' },
		suppressColumnVirtualisation: true,

		getRowNodeId: params => {
			return params.id;
		},

		defaultColDef: {
			resizable: true,
			sortable: true
		},

		pagination: true,
		paginationPageSize: 100,
		rowModelType: 'serverSide',

		sideBar: {
			toolPanels: [
				{ id: 'columns', labelDefault: 'Columns', labelKey: 'columns', iconKey: 'columns', toolPanel: 'agColumnsToolPanel' }
			]
		},

		onGridReady: params => {
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
			if (this.pagination.type == 'my') {
				this.gridColumnApi.setColumnVisible('assignee_name', false);
			} else {
				this.gridColumnApi.setColumnVisible('assignee_name', true);
			}
			var dataSource = {
				rowCount: null,
				getRows: params => {
					if (params.request.sortModel.length) {
						this.pagination.column = params.request.sortModel[0].colId;
						this.pagination.sort = params.request.sortModel[0].sort;
					}
					setTimeout(() => {
						if (this.pagination.page == 1 && this.state.init && !this.state.isSort) {
							this.pagination.page++;
							params.successCallback(this.state.tasksDetails.list, this.state.tasksDetails.total);
							if (this.state.selectedTask && this.state.selectedTask.id) {
								this.setSideBarVisible(false);
								this.setSelection(this.state.selectedTask.id, true);
							} else {
								this.setSideBarVisible(true);
							}
							setTimeout(() => {
								agGridColumnAutoFit(this.gridApi, this.gridColumnApi, false);
								this.isVisible = true;
							});

							if (!this.state.tasksDetails.list.length) this.gridApi.showNoRowsOverlay();
							else this.gridApi.hideOverlay();
						} else {
							this.state.init = false;
							this.state.isSort = false;
							this._commonService.saveApi('getAllTasks', this.pagination)
								.then(res => {
									params.successCallback(res['result'].data.list, res['result'].data.total);
									if (this.pagination.page == 1) {
										if (!res['result'].data.list.length) this.gridApi.showNoRowsOverlay();
										else this.gridApi.hideOverlay();
									}
									setTimeout(() => {
										agGridColumnAutoFit(this.gridApi, this.gridColumnApi, false);
									});
									this.pagination.page++;
								})
						}
					}, 20);
				}
			}
			params.api.setServerSideDatasource(dataSource);
		},

		onSortChanged: params => {
			this.state.isSort = true;
			this.pagination.page = 1;
		},

		onRowClicked: params => {
			if (params.data) {
				let indx = -1;
				if ((<any>params.event.target).className.search('disable-click') != -1) indx = 0;
				else if ((<any>params.event.target).offsetParent.className.search('disable-click') != -1) indx = 0
				else indx = -1;
				if (indx == -1) {
					if (!this.state.selectedTask || (this.state.selectedTask.id != params.data.id)) {
						this.state.selectedTask = params.data.id;
						this._router.navigate(['/tasks/' + this.pagination.type + '/list/' + params.data.id]);
					}
				}
			}
		}
	}

	taskSubscription: Subscription;

	constructor(
		private _commonService: CommonService,
		private activeRoute: ActivatedRoute,
		private _router: Router,
		private _taskService: TasksService
	) {
		activeRoute.parent.data.subscribe(data => {
			this.pagination.type = data.flag;
			if (data.flag == 'my' || data.flag == 'group')
				this.pagination = { ...this.pagination, ...{ users_id: APP.recon_user[0].id } };
		});
		activeRoute.url.subscribe(() => {
			if (activeRoute.snapshot.firstChild) {
				this.state.selectedTask = { id: activeRoute.snapshot.firstChild.params.id };
				this.setSideBarVisible(false);
			} else {
				this.state.selectedTask = null;
				this.setSideBarVisible(true);
			}
		})
		this.taskSubscription = _taskService.onUpdate().subscribe(ev => {
			if (ev.type == 'route-change') {
				setTimeout(() => {
					if (activeRoute.snapshot.firstChild) {
						this.state.selectedTask = { id: activeRoute.snapshot.firstChild.params.id };
					} else {
						this.state.selectedTask = null;
						this.setSelection(ev.data, false);
					}
				}, 20);
			} else if (ev.type == 'confirm-schedule') {
				if (ev.data.res.data.from == 'no') {
				} else {
					ev.data.selected.ids.map(id => {
						let row: RowNode = this.gridApi.getRowNode(id) ? this.gridApi.getRowNode(id) : null;
						if (row) {
							row.data.due_date = _moment(new Date(row.data.due_date)).add(ev.data.selected.interval, 'day').format('MMM DD, YYYY');
							row.setData(row.data);
						}
					});
				}
			} else if (ev.type == 'check-schedule') {
				ev.data.list.map(o => {
					let row = this.gridApi.getRowNode(o.id) ? this.gridApi.getRowNode(o.id) : null;
					if (row) {
						if (o.new_start_date) row.data.start_date = o.new_start_date;
						if (o.new_due_date) row.data.due_date = o.new_due_date;
						row.setData(row.data);
					}
				});
			} else if (ev.type == 'detail-trans') {
				const row = this.gridApi.getRowNode(ev.data.selected.id) ? this.gridApi.getRowNode(ev.data.selected.id) : null;
				if (row) {
					row.data.is_enable = ev.data.trans.id == 5 ? false : true;
					row.data.status = ev.data.res.status_id;
					row.data.status_name = ev.data.res.status_name;
					row.data.status_dropdown = ev.data.res.status_dropdown;
					row.data.settings = !row.data.settings;
					row.setData(row.data);
				}
			} else if (ev.type == 'save-selected') {
				const parentIndx = _.findIndex(this.state.tasksDetails.list, ['id', ev.data.selected.id]);
				if (parentIndx) this.state.tasksDetails.list[parentIndx] = { ...this.state.tasksDetails.list[parentIndx], ...ev.data.selected };

				const row = this.gridApi.getRowNode(ev.data.selected.id) ? this.gridApi.getRowNode(ev.data.selected.id) : null;
				if (row) {
					row.data.due_date = _moment(ev.data.form.due_date).format('MMM DD, YYYY');
					if (ev.data.selected.task_id != ev.data.form.task_id) {
						row.data.task_id = ev.data.form.task_id;
						row.data.task_name = ev.data.selected.task_name;
					}
					if (ev.data.selected.assignee_id != ev.data.form.assignee_id) {
						row.data.assignee_id = ev.data.form.assignee_id;
						row.data.assignee_name = ev.data.selected.assignee_name;
					}
					if (ev.data.selected.status != ev.data.form.status) {
						ev.data.selected.status = row.data.status = ev.data.form.status;
						ev.data.selected.status_name = row.data.status_name = ev.data.form.status_name;
					}
					row.data.product_cnt = ev.data.selected.product_cnt;
					row.data.service_cnt = ev.data.selected.service_cnt;

					row.setData(row.data);
				}
			} else if (ev.type == 'go-to-parent') {
				this.state.selectedTask = { id: ev.data };
				if (this.state.selectedTask && this.state.selectedTask.id) {
					this.setSelection(this.state.selectedTask.id, true);
				}
			} else if (ev.type == 'search') {
				if(this.gridApi) {
					this.state.isSort = true;
					this.pagination.page = 1;
					this.pagination.search = ev.data;
					this.gridApi.onFilterChanged();
				}
			}
		})
	}

	ngOnInit() {
		this.getTaskList();
	}

	setSelection(id, bol) {
		const row: RowNode = this.gridApi.getRowNode(id);
		if (row) row.setSelected(bol);
	}

	setSideBarVisible(bol) {
		if (this.gridApi) {
			this.gridApi.setSideBarVisible(bol);
		}
	}

	getTaskList() {
		this.state.isLoading = true;
		this._commonService.saveApi('getAllTasks', this.pagination)
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.tasksDetails = res['result'].data;
				}
			})
	}

}
