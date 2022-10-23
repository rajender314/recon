import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { agGridColumnAutoFit, agGridDateSort } from '@app/shared/utility/config';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { GridApi, GridOptions, ColDef, ColumnApi, Column, RowNode } from 'ag-grid-community';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { FromNowPipe } from '@app/shared/pipes/from-now.pipe';
import { OwlDateTimeComponent } from 'ng-pick-datetime';
import { CheckScheduleComponent } from '../check-schedule/check-schedule.component';
import { ProjectDetailsService } from '../../project-details.service';
import { TaskService } from '../task.service';

import * as _ from 'lodash';
import * as _moment from 'moment';
import { CreateTaskComponent } from '@app/dialogs/create-task/create-task.component';
import { filter, map, switchMap } from 'rxjs/operators';
import { AddFromTemplateComponent } from '../add-from-template/add-from-template.component';
var APP: any = window['APP'];

export function checkPermissions(that) {
	let isRelatedToProject = that._commonService.is_related_to_project;
	let job_status_id = that._commonService.job_status_id;
	let isMilestone = that.params.data ? that.params.data.is_milestones : false;
	let taskKey = isRelatedToProject ? 'tasks_assigned_me' : 'tasks_assigned_others';
	taskKey = isMilestone ? 'milestones' : taskKey;
	let permKey = isRelatedToProject ? 'job_specific_user' : isMilestone ? 'job_specific_others' : 'job_specific_others';
	if (job_status_id == 8 || job_status_id == 10) {
		if (APP.permissions.job_access['post-completion_estimate'] != 'yes') {
			return false;
		}
		return APP.permissions.job_access[taskKey][permKey] == 'edit';
	}
	return APP.permissions.job_access[taskKey][permKey] == 'edit';
}
/* Grid Status Components */
@Component({
	template: `<div *ngIf="params.data">
					<div *ngIf="allowEdit && params.data.is_enable && params.data.slug != 'delivery_due_date'" [matMenuTriggerFor]="menu" class="empty-status status-pills task-status-pills status_{{params.data.status}}">
						<span class="{{params.value | lowercase}}"> {{params.value}}</span>
						<i class="pixel-icons icon-arrow-down"></i>
					</div>
					<div *ngIf="!allowEdit || !params.data.is_enable || params.data.slug == 'delivery_due_date'" class="status-pills task-status-pills status_{{params.data.status}}">
						<span [innerHtml]="params.value"></span>
					</div>
					<mat-menu #menu="matMenu" xPosition="after" yPosition="below" class="drop-menu-ui status-list-menu">
						<div *ngFor="let st of params.data.status_dropdown" (click)="performActions(st)" style="display: inline-block;"><a [innerHtml]="st.name"
								[class.active]="st.id == params.data.status" class="status_{{st.id}}"></a></div>
						</mat-menu>
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
	allowEdit: boolean;
	status: Array<any> = [
		{ id: 1, name: 'Active' },
		{ id: 2, name: 'Inprogress' },
		{ id: 3, name: 'Complete' }
	]
	constructor(private _commonService: CommonService, private _taskService: TaskService, private _snackbar: MatSnackBar, private activeRoute: ActivatedRoute) { }
	agInit(params) {
		this.params = params;
		this.allowEdit = checkPermissions(this);
	}
	updateModifiedUser(row, keys, data) {
		keys.map(prop => {
			row[prop] = data[prop];
		})
	}
	performActions(st) {console.log('task flow', this.params)
		this._commonService.saveApi('taskFlow', {
			jobs_id: this.params.jobs_id,
			id: this.params.data.id,
			parent_id: this.params.data.parent_id,
			status_id: st.id,
			key: st.key,
			task_id: this.params.data.task_id,
			task_type_id: this.params.data.task_type_id
		})
			.then(res => {
				if (res['result'].success) {
					this._commonService.update({ type: 'job_status', data: null });
					if (res['result'].data.status) {
						if (this.params.data.slug == 'deliver') {
							(<GridApi>this.params.api).getModel().forEachNode((node: RowNode) => {
								if (node.data.slug == 'delivery_due_date' && st.id == 5) {
									node.data.is_enable = st.id == 5 ? false : true;
									node.data.status = res['result'].data.status_id;
									node.data.status_name = res['result'].data.status_name;
									node.data.status_dropdown = res['result'].data.status_dropdown || [];
									this.updateModifiedUser(node.data, ['last_modified_by', 'last_modified_on'], res['result'].data);
									node.setData(node.data);
								}
							})
						}
						if (this.params.data.slug == 'final_bill_due') {
							(<GridApi>this.params.api).getModel().forEachNode((node: RowNode) => {
								if (node.data.slug == 'final_bill_due_date' && st.id == 5) {
									node.data.is_enable = st.id == 5 ? false : true;;
									node.data.status = res['result'].data.status_id;
									node.data.status_name = res['result'].data.status_name;
									node.data.status_dropdown = res['result'].data.status_dropdown || [];
									this.updateModifiedUser(node.data, ['last_modified_by', 'last_modified_on'], res['result'].data);
									node.setData(node.data);
								}
							})
						}
						this.params.data.is_enable = st.id == 5 ? false : true;
						this.params.data.status = res['result'].data.status_id;
						this.params.data.status_name = res['result'].data.status_name;
						this.params.data.status_dropdown = res['result'].data.status_dropdown || [];
						this.params.data.settings = !this.params.data.settings;
						this.updateModifiedUser(this.params.data, ['last_modified_by', 'last_modified_on'], res['result'].data);
						this.params.node.setData(this.params.data);
						this.snackbarModal('success', false, 'Task Updated Successfully');
						if (this.activeRoute.snapshot.firstChild && this.activeRoute.snapshot.firstChild.params.id == this.params.data.id)
							this._taskService.update({ type: 'task-ag-status-change', data: { trans: st, res: res['result'].data, selected: this.params.data } });
					} else {
						this.snackbarModal('error', false, res['result'].data.message);
					}
				} else {
					this.snackbarModal('error', false, res['result'].data.message);
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
	template: `<div class="d-flex" *ngIf="params.data" style="justify-content: flex-start; line-height: 24px;">
			
	<ng-container *ngIf="params.data.parent_id != 0">
					<span class="sub-tasks-grid-icon"><i class="pixel-icons   icon-sub-task" [matTooltip]="params.data.parent_name"></i></span>			
					<span class="medium-font truncate"  style="line-height: 38px;" [innerHtml]="params.value"></span>
					<span class="detail-btn" > <span>Details</span><i class="pixel-icons icon-arrow-right" style="font-size: 9px;height: 8px;width: 16px;text-align: center;"></i></span>
				</ng-container>
				<ng-container *ngIf="params.data.parent_id == 0" class="w-100">	
				<span class="sub-tasks-grid-icon" *ngIf="!params.data.is_milestones"><i class="pixel-icons icon-task-fill" matTooltip="Task"></i></span>
				<span class="sub-tasks-grid-icon" *ngIf="params.data.is_milestones" ><i class="pixel-icons icon-milestones" matTooltip="Milestone"></i></span>
				<span class="medium-font truncate"  style="line-height: 38px;" [innerHtml]="params.value" [matTooltip]="params.value"></span>
				<span class="detail-btn" > <span>Details</span><i class="pixel-icons icon-arrow-right" style="font-size: 9px;height: 8px;width: 16px;text-align: center;"></i></span>
				</ng-container>
				<!-- <span *ngIf="params.data.billing_type_id == 3"> : <b>Round {{params.data.round_id}}</b></span> -->
			</div>`,
	styles: [`
	.icon-sub-task{color:#8082f7;}
	.icon-delete-lined{color:#ef2720;}
	.icon-duplicate{color:#0195a2;}

	`]
})

export class TaskNameCell {
	params: any;
	actions = [
		{ key: 'add', label: 'Add Sub Task', icon: 'sub-task', is_visible: true },
		{ key: 'delete', label: 'Delete', icon: 'delete-lined', is_visible: true },
		{ key: 'duplicate', label: 'Duplicate', icon: 'duplicate', is_visible: true }
	]
	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog
	) { }
	agInit(params) {
		this.params = params;
		this.enableActions();
	}
	enableActions() {
		if (this.params.data) {
			if (this.params.data.is_milestones || this.params.data.parent_id) this.actions[0].is_visible = false;
			if (this.params.data.is_enable) {
				if (this.params.data.slug == 'final_bill_due') {
					this.actions[2].is_visible = true;//!this.params.data.is_enable;
				} else {
					this.actions[2].is_visible = true;
				}
				if (this.params.data.slug == 'delivery_due_date') {
					this.actions[1].is_visible = false;
				} else if (this.params.data.slug == 'deliver') {
					this.actions[1].is_visible = this.params.data.is_enable;
				}
			} else {
				this.actions.map(o => {
					if (o.key == 'duplicate') o.is_visible = true;
					else o.is_visible = false;
				})
			}
		}
	}
	performActions(action) {
		if (action.key == 'add') {
			this._commonService.update({ type: 'task_ag_add_sub', data: this.params.data });
		} else if (action.key == 'delete') {
			let msg = '';
			if (this.params.data.slug == 'deliver' || this.params.data.slug == 'final_bill_due') msg = 'Deleting this task will Sever its dependencies with other tasks/milestones. Are you sure you want to continue?';
			else if (this.params.data.is_milestones) msg = 'Are you sure, you want to delete this Milestone?';
			else msg = 'Are you sure, you want to delete this Task?'
			const locals = {
				title: this.params.data.is_milestones ? 'Delete Milestone' : 'Delete Task',
				url: 'removeJobsTasks',
				method: 'delete',
				params: {
					id: this.params.data.id,
					is_delivery: this.params.data.is_delivery,
					slug: this.params.data.slug || ''
				},
				content: `<div class="po-dialog">
							<div class="">
								<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
							</div>
							<div class="">
								<p>${msg}</p>
							</div>
						</div>`,
				buttonText: 'Delete'
			}
			this._dialog.open(ConfirmationComponent, {
				panelClass: 'recon-dialog',
				width: '570px',
				data: { ...locals }
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						let rows = [];
						rows.push(this.params.data);
						if (this.params.data.parent_id == 0 && this.params.data.hasOwnProperty('child')) {
							this.params.data.child.map((child, i) => {
								rows.push((<GridApi>this.params.api).getRowNode(child.id));
							})
						}
						(<GridApi>this.params.api).updateRowData({ remove: rows });
						this._commonService.update({ type: 'task_ag_remove', data: this.params.data })
					}
				})
		} else if (action.key == 'duplicate') {
			this._commonService.update({ type: 'task_ag_add_dup', data: this.params.data })
			/* Do this after success service */
			/*let rows = [];
			rows.push(this.params.data);
			if (this.params.data.parent_id == 0 && this.params.data.hasOwnProperty('child')) {
				this.params.data.child.map((child, i) => {
					rows.push((<GridApi>this.params.api).getRowNode(child.id));
				})
			}
			(<GridApi>this.params.api).updateRowData({ add: rows });*/
		}
	}
}

@Component({
	template: `<ng-container *ngIf="params.data && allowEdit && actionsCount"> 
					<div class="ag-cell-custome-actions" style="display:flex;align-items:center; height: 37px;" *ngIf="params.data.slug != 'job_start_date'">
						<ul style="padding-top:0;">
							<li class="disable-click" style="margin-left: 0px; background: rgb(228, 231, 241);" [matMenuTriggerFor]="menu"><i class="pixel-icons icon-more-horizontal" ></i></li>
						</ul>
						<mat-menu #menu="matMenu" xPosition="after" yPosition="below" class="grid-cell-drop-menu-ui cust-ui-menu">
							<ng-container *ngFor="let act of actions">
								<a *ngIf="act.is_visible" (click)="performActions(act)"><i class="pixel-icons  icon-{{act.icon}}"></i> <span>{{act.label}}</span></a>
							</ng-container>
						</mat-menu>
					</div>
				</ng-container>`,
	styles: [`.icon-sub-task{color:#8082f7;}
	.icon-delete-lined{color:#ef2720;}
	.icon-duplicate{color:#0195a2;}`]
})

export class TaskSettings {
	params: any;
	allowEdit: boolean;
	actions = [
		{ key: 'add', label: 'Add Sub Task', icon: 'sub-task', is_visible: true },
		{ key: 'delete', label: 'Delete', icon: 'delete-lined', is_visible: true },
		{ key: 'duplicate', label: 'Duplicate', icon: 'duplicate', is_visible: true }
	];
	actionsCount: number = 3;
	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog
	) { }
	agInit(params) {
		this.params = params;
		this.enableActions();
		this.allowEdit = checkPermissions(this);
	}
	enableActions() {
		if (this.params.data) {
			if (this.params.data.status == 2) {
				// this.actions.map(o => o.is_visible = false);
				this.actions[0].is_visible = false;
				this.actions[1].is_visible = false;
				this.actionsCount = 1;
				return;
			}
			if (this.params.data.is_milestones || this.params.data.parent_id || this.params.data.jobs_task_type == 2) this.actions[0].is_visible = false;
			if (this.params.data.is_enable) {
				if (this.params.data.jobs_task_type == 2) {
					this.actions[1].is_visible = true;
					this.actions[2].is_visible = false;
				} else {
					if (this.params.data.slug == 'final_bill_due') {
						this.actions[2].is_visible = true;//!this.params.data.is_enable;
						this.actions[1].is_visible = (APP.permissions.job_access.delete_final_bill_due_task == 'yes') ? true : false;
					} else {
						this.actions[2].is_visible = true;
					}
					if (this.params.data.slug == 'delivery_due_date') {
						this.actions[1].is_visible = false;
					} else if (this.params.data.slug == 'deliver') {
						this.actions[1].is_visible = this.params.data.is_enable;
					}
				}
			} else {
				this.actions.map(o => {
					if (o.key == 'duplicate' && this.params.data.jobs_task_type != 2) o.is_visible = true;
					else o.is_visible = false;
				})
			}

			this.actionsCount = this.actions.filter(o => o.is_visible).length;
		}
	}
	performActions(action) {
		if (action.key == 'add') {
			this._commonService.update({ type: 'task_ag_add_sub', data: this.params.data });
		} else if (action.key == 'delete') {
			let msg = '';
			if (this.params.data.slug == 'deliver' || this.params.data.slug == 'final_bill_due') msg = 'Deleting this task will Sever its dependencies with other tasks/milestones. Are you sure you want to continue?';
			else if (this.params.data.is_milestones) msg = 'Are you sure, you want to delete this Milestone?';
			else msg = 'Are you sure, you want to delete this Task?'
			const locals = {
				title: this.params.data.is_milestones ? 'Delete Milestone' : 'Delete Task',
				url: 'removeJobsTasks',
				method: 'delete',
				params: {
					id: this.params.data.id,
					is_delivery: this.params.data.is_delivery,
					slug: this.params.data.slug || '',
					task_type_id: this.params.data.task_type_id
				},
				content: `<div class="po-dialog">
							<div class="">
								<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
							</div>
							<div class="">
								<p>${msg}</p>
							</div>
						</div>`,
				buttonText: 'Delete'
			}
			this._dialog.open(ConfirmationComponent, {
				panelClass: 'recon-dialog',
				width: '570px',
				data: { ...locals }
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						let rows = [];
						rows.push(this.params.data);
						if (this.params.data.parent_id == 0 && this.params.data.hasOwnProperty('child')) {
							this.params.data.child.map((child, i) => {
								rows.push((<GridApi>this.params.api).getRowNode(child.id));
							})
						}
						(<GridApi>this.params.api).updateRowData({ remove: rows });
						this._commonService.update({ type: 'task_ag_remove', data: this.params.data })
					}
				})
		} else if (action.key == 'duplicate') {
			this._commonService.update({ type: 'task_ag_add_dup', data: this.params.data })
			/* Do this after success service */
			/*let rows = [];
			rows.push(this.params.data);
			if (this.params.data.parent_id == 0 && this.params.data.hasOwnProperty('child')) {
				this.params.data.child.map((child, i) => {
					rows.push((<GridApi>this.params.api).getRowNode(child.id));
				})
			}
			(<GridApi>this.params.api).updateRowData({ add: rows });*/
		}
	}
}

@Component({
	template: `<div *ngIf="params.data" [class.edit]="isEditable">
					<div [innerHtml]="params.valueFormatted" *ngIf="!isEditable || !allowEdit" (click)="allowEdit && toggleInlineEdit()"></div>
					<pi-form-field [label]=" " class="date-field" *ngIf="isEditable && allowEdit" >
						<input pi-input matInput 
							[min]="minDate" [max]="maxDate" 
							[owlDateTime]="picker" 
							[(ngModel)]="value" 
							placeholder="MM-DD-YYYY HH:MM"
							[owlDateTimeTrigger]="picker"
							(dateTimeChange)="onSelectChange()"
							placeholder="Choose a date">
							<div class="owl-picker-toggle">
						<i class="pixel-icons icon-calendar" [owlDateTimeTrigger]="picker"></i>
						</div>
						<owl-date-time #picker (afterPickerClosed)="closePicker()" [hour12Timer]="true"></owl-date-time>
						<!--<input #dateInput pi-input matInput [min]="minDate" [max]="maxDate"
							[matDatepicker]="picker" [(ngModel)]="value" (dateChange)="onSelectChange()" (focus)="picker.open()"
							placeholder="Choose a date" readonly>
						<mat-datepicker-toggle matSuffix [for]="picker">
							<i class="pixel-icons icon-calendar"
								matDatepickerToggleIcon></i>
						</mat-datepicker-toggle>
						<mat-datepicker #picker (closed)="closePicker()"></mat-datepicker> -->
					</pi-form-field>
				</div>`,
	styles: [``]
})

export class DueDateCell {
	@ViewChild('picker', { read: OwlDateTimeComponent }) picker: OwlDateTimeComponent<Date>;
	params: any;
	isEditable: boolean = false;
	allowEdit: boolean;
	minDate = new Date();
	maxDate = null;
	value: any;
	constructor(private _commonService: CommonService) { }
	agInit(params) {
		this.params = params;
		this.value = this.params.value?new Date(this.params.value):'';
		this.allowEdit = checkPermissions(this);
	}
	toggleInlineEdit() {
		if (this.params.data.parent_id != 0) {
			const parentRow = (<GridApi>this.params.api).getRowNode(this.params.data.parent_id).data;
			if (this.params.colDef.field == 'due_date') {
				this.maxDate = new Date(parentRow[this.params.colDef.field]);
			}
		}
		if (this.params.data[this.params.isEditProp] && this.params.data.is_enable) {
			this.isEditable = !this.isEditable;
			if (this.isEditable) setTimeout(() => {
				this.picker.open();
			}, 200);
		}
	}
	onSelectChange(): void {
		this.params.setValue(this.value?_moment(this.value).format('MMM DD, YYYY hh:mm:ss'):'');
		this.isEditable = false;
	}
	closePicker() {
		this.isEditable = false;
	}

}

@Component({
	selector: 'app-list',
	templateUrl: './list.component.html',
	styleUrls: ['./list.component.scss'],
	providers: [FromNowPipe]
})
export class ListComponent implements OnInit, OnDestroy {

	isVisible: boolean = false;

	state = {
		projectID: null,
		projectDetails: null,
		isLoading: true,
		sortActions: [
			{ key: 'due_date', label: 'Due Date' },
			{ key: 'assignee_name', label: 'Assignee' },
			{ key: 'task_name', label: 'Task' },
		],
		selectedFilter: (APP.permissions.job_access.vendor_schedule == 'yes') ? { label: "All", key: 0 } : { label: "My Tasks", key: 1 },
		selectedSort: { key: 'due_date', label: 'Due Date', display: 'Due Date', sort: 'asc' },
		actions: {
			type: 'group', label: 'Group By', options: [
				{ key: 'default', label: 'Default', type: 'group' },
				{ key: 'assignee_name', label: 'Assignee', type: 'group' },
				{ key: 'due_date', label: 'Due Date', type: 'group' },
				// { key: 'section', label: 'Section', type: 'group' },
				// { key: 'outstanding', label: 'OutStanding', type: 'group' }
			]
		},
		selectedGroup: { key: 'default', label: 'Default', type: 'group' },
		tasksDetails: {
			list: [],
			framedList: [],
			total: 0
		},
		selectedTask: null,
		hasRoute: false
	}

	gridApi: GridApi;
	gridColumnApi: ColumnApi;
	gridOptions: GridOptions = {
		rowHeight: 38,
		headerHeight: 38,
		columnDefs: [],
		// suppressRowClickSelection: true,
		rowSelection: 'single',
		animateRows: true,
		stopEditingWhenGridLosesFocus: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		localeText: { noRowsToShow: 'No Tasks Found' },
		suppressColumnVirtualisation: true,

		getRowNodeId: params => {
			return params.id;
		},

		defaultColDef: {
			resizable: true,
			sortingOrder: ['asc', 'desc']
		},

		pagination: true,

		postSort: rowNodes => {
			for (let x in rowNodes) {
				rowNodes[x].data && rowNodes[x].data.slug == 'job_start_date' && rowNodes.unshift(rowNodes.splice(Number(x), 1)[0]);
			}
		},

		groupDefaultExpanded: 1,
		autoGroupColumnDef: {
			cellClass: 'd-flex',
			cellRenderer: 'agGroupCellRenderer',
			width: 260,
			cellRendererParams: {
				suppressCount: true,
				innerRenderer: params => {
					if (this.state.selectedGroup) {
						if (this.state.selectedGroup.key != 'due_date') {
							if (this.state.selectedGroup.key == 'assignee_name') {
								let assignName: any;
								let assigneeText = '';
								if (params.value) {
									assignName = params.value;
									assignName = assignName.split(' ');
									assignName.map(function (value, index) {
										if (index <= 1) {
											assigneeText = assigneeText + value.charAt(0);
										}
									});
									return `<div style="display: flex;align-items: center;">
										<span class="letter-icon">${assigneeText} </span> <span style="margin-left: 6px; position:relative; top: 1px;">${params.value}</span>
									</div>`;
								}
							}
							return params.value;
						} else {
							return params.valueFormatted;
						}
					}
				},
			},
		},

		icons: {
			groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
			groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
		},

		onGridReady: params => {
			this.gridApi = params.api;
			this.gridColumnApi = params.columnApi;
			setTimeout(() => {
				this.gridColumnApi = params.columnApi;
				this.gridApi.sizeColumnsToFit();
			});
			setTimeout(() => {
				if (this.activeRoute.snapshot.firstChild) {
					this.state.selectedTask = { id: this.activeRoute.snapshot.firstChild.params.id };
					this.generateColumns('half', true);
				} else {
					this.state.selectedTask = null;
					this.generateColumns('full', true);
				}
			}, 20);
			this.gridApi.setRowData(this.state.tasksDetails.framedList);
			if (this.state.selectedTask && this.state.selectedTask.id) {
				const row: RowNode = this.gridApi.getRowNode(this.state.selectedTask.id);
				if (row) row.setSelected(true);
			}
			setTimeout(() => {
				agGridColumnAutoFit(this.gridApi, this.gridColumnApi, false);
			}, 20);
		},

		// onRowClicked: params => {
		// 	if (params.data) {
		// 		let indx = -1;
		// 		if ((<any>params.event.target).className.search('disable-click') != -1) indx = 0;
		// 		else if ((<any>params.event.target).offsetParent.className.search('disable-click') != -1) indx = 0
		// 		else indx = -1;
		// 		if (indx == -1 && params.event.target['className'] != 'pixel-icons icon-more-horizontal') {
		// 			if (!this.state.selectedTask || (this.state.selectedTask.id != params.data.id)) {
		// 				if (!this.state.selectedTask) {
		// 					this.generateColumns('half', true);
		// 				}
		// 				this.state.selectedTask = params.data;
		// 				this.state.hasRoute = true;
		// 				this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
		// 			}
		// 		}
		// 	}
		// },

		onColumnRowGroupChanged: params => {
			if (!params.column) {
				this.state.selectedGroup = { key: 'default', label: 'Default', type: 'group' };
			} else {
				let action = this.state.actions.options;
				const group = _.find(action, ['key', params.column['colId']]);
				if (group) this.state.selectedGroup = group;
				(<ColumnApi>params.columnApi).setColumnsVisible([params.column['colId']], false);
			}
		},

		onSortChanged: params => {
			const sort = this.gridApi.getSortModel();
			if (sort.length) {
				const sortOption = _.find(this.state.sortActions, ['key', sort[0].colId]);
				this.state.selectedSort = sortOption;
				this.state.selectedSort.display = sortOption.label + '(' + sort[0].sort + ')';
				this.state.selectedSort.sort = sort[0].sort;

			} else {
				this.state.selectedSort = { key: 'due_date', label: 'Due Date', display: 'Due Date', sort: 'asc' };
			}
		},

		onCellClicked: params => {
			if (params.data && params.column) {
				let isDisable = this.showSelection(params);
				if (!isDisable) {
					if (!this.state.selectedTask || (this.state.selectedTask.id != params.data.id)) {
						if (!this.state.selectedTask) {
							this.generateColumns('half', true);
						}
						this.state.selectedTask = params.data;
						this.state.hasRoute = true;
						this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
					}
				}
			}
		},

		onCellValueChanged: params => {
			if (params.oldValue != params.newValue) {
				if (params.colDef.field == 'due_date' || params.colDef.field == 'start_date') {
					let changedDate = _moment(new Date(params.newValue));
					let oldDate = params.oldValue?_moment(new Date(params.oldValue)):'';
					if (!changedDate.isSame(oldDate)) {
						const isStart = params.colDef.field == 'due_date' ? false : true;
						this.updateDueDate(params.data, oldDate, changedDate, isStart, () => {
							(<RowNode>params.node).updateData({ ...params.data, ...{ [params.colDef.field]: params.oldValue } });
						});
					}
				}
			}
		},

		onFilterChanged: ev => {
			if (ev.api.getDisplayedRowCount()) {
				ev.api.hideOverlay();
			} else {
				ev.api.showNoRowsOverlay();
			}
		},

		onCellFocused: params => {
			if (params.column) {
				let isDisable = this.showSelection(params);
				if (!isDisable) {
					this.gridOptions.suppressRowClickSelection = false;
				} else {
					this.gridOptions.suppressRowClickSelection = true;
				}
			}
		}
	}

	routerSubscription: Subscription;
	breadcrumbSubscription: Subscription;
	taskSubscription: Subscription;

	constructor(
		private _commonService: CommonService,
		private _dialog: MatDialog,
		private _router: Router,
		private _snackbar: MatSnackBar,
		private activeRoute: ActivatedRoute,
		private fromNowPipe: FromNowPipe,

		private _taskService: TaskService,
		private _projectDetailService: ProjectDetailsService
	) {

		activeRoute.url.subscribe(val => {
			if (!this.state.hasRoute)
				setTimeout(() => {
					if (activeRoute.snapshot.firstChild) {
						this.state.selectedTask = { id: activeRoute.snapshot.firstChild.params.id };
					} else {
						this.state.selectedTask = null;
					}
					this.state.hasRoute = false;
				}, 20);
		})

		this.routerSubscription = activeRoute.parent.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			this.getTaskList(this.state.projectID, 'init');
		});

		this.breadcrumbSubscription = _commonService.onUpdate().subscribe(obj => {
			if (obj) {
				if (obj.type == 'projectName') {
					this.state.projectDetails = obj.data
				} else if (obj.type == 'task_ag_remove') {
					let parentIndx = null, childIndex = null;
					if (obj.data.parent_id == 0) {
						parentIndx = _.findIndex(this.state.tasksDetails.list, ['id', obj.data.id]);
					} else {
						parentIndx = _.findIndex(this.state.tasksDetails.list, ['id', obj.data.parent_id]);
						childIndex = _.findIndex(this.state.tasksDetails.list[parentIndx].child, ['id', obj.data.id]);
					}
					if (childIndex != null) {
						if (this.state.selectedTask && this.state.selectedTask.id == this.state.tasksDetails.list[parentIndx].child[childIndex].id) {
							this.state.tasksDetails.list[parentIndx].child.splice(childIndex, 1);

							if (this.state.tasksDetails.list[parentIndx].child.length) {
								this.state.selectedTask = this.state.tasksDetails.list[parentIndx].child[0];
							} else {
								this.state.selectedTask = this.state.tasksDetails.list[parentIndx];
								this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
							}
						} else {
							this.state.tasksDetails.list[parentIndx].child.splice(childIndex, 1);
						}
					} else {
						if (this.state.selectedTask && this.state.selectedTask.id == this.state.tasksDetails.list[parentIndx].id) {
							this.state.tasksDetails.list.splice(parentIndx, 1);

							if (this.state.tasksDetails.list.length) {
								this.state.selectedTask = this.state.tasksDetails.list[0];
								this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
							}
						} else {
							this.state.tasksDetails.list.splice(parentIndx, 1);
						}
					}
					this._commonService.update({ type: 'left-nav-count', data: {} });
					if (!this.state.tasksDetails.list.length) this.resetDetailView('list');
					this.snackbarModal('success', false, 'Task Deleted Successfully');
				} else if (obj.type == 'task_ag_add_sub') {
					this.addTask('sub', obj.data);
				} else if (obj.type == 'task_ag_add_dup') {
					this.addTask('dup', obj.data);
				} else if (obj.type == 'job_status') {
					this.updateJobStatus();
					if (obj.hasOwnProperty('flag')) {
						this.getTaskList(this.state.projectID, 'statusChange');
					}
				}
			}
		})

		this.taskSubscription = _taskService.onUpdate().subscribe(ev => {
			if (ev.type == 'route-change') {
				setTimeout(() => {
					if (activeRoute.snapshot.firstChild) {
						this.state.selectedTask = { id: activeRoute.snapshot.firstChild.params.id };
						if (this.gridApi) this.generateColumns('half', true);
					} else {
						this.state.selectedTask = null;
						this.setSelection(ev.data, false);
						if (this.gridApi) this.generateColumns('full', true);
					}
				}, 20);
			} else if (ev.type == 'init-add') {
				this.addTask();
			} else if (ev.type == 'init-add-template') {
				this.addFromTemplate();
			} else if (ev.type == 'add-sub-task') {
				this.addTask('sub', ev.data);
			} else if (ev.type == 'group') {
				this.state.selectedGroup = ev.data;
				if (this.state.tasksDetails.framedList.length) this.gridColumnApi.setRowGroupColumns([ev.data.key]);
			} else if (ev.type == 'search') {
				if (this.state.tasksDetails.framedList.length) this.gridApi.setQuickFilter(ev.data);
			} else if (ev.type == 'sort') {
				if (this.state.tasksDetails.framedList.length) {
					const sort = this.gridApi.getSortModel();
					if (sort.length) {
						let sortOrder = 'asc';
						if (sort[0].colId == ev.data.key)
							sortOrder = sort[0].sort == 'asc' ? 'desc' : 'asc';
						this.state.selectedSort.display = ev.data.label + '(' + sortOrder + ')';
						this.state.selectedSort.sort = sortOrder;
						this.gridApi.setSortModel([{ colId: ev.data.key, sort: sortOrder }])
					} else {
						this.state.selectedSort.display = ev.data.label;
						this.state.selectedSort.sort = 'asc';
						this.gridApi.setSortModel([{ colId: ev.data.key, sort: 'asc' }])
					}
				}
			} else if (ev.type == 'filter') {
				this.state.selectedFilter = ev.data;
				this.getTaskList(this.state.projectID, 'filter');
			} else if (ev.type == 'confirm-schedule') {
				if (ev.data.res.from == 'no') {
				} else {
					let rows = [];
					ev.data.selected.ids.map(id => {
						let row = this.gridApi.getRowNode(id) ? this.gridApi.getRowNode(id).data : null;
						if (row) {
							row.due_date = _moment(new Date(row.due_date)).add(ev.data.selected.interval, 'day').format('MMM DD, YYYY');
							this.updateModifiedUser(row, ['last_modified_by', 'last_modified_on'], ev.data.res.result);
							rows.push(row);
						}
					});
					this.gridApi.updateRowData({ update: rows });
				}
			} else if (ev.type == 'check-schedule') {
				let rows = [];
				ev.data.list.map(o => {
					let row = this.gridApi.getRowNode(o.id).data;
					if (row) {
						if (o.new_start_date) row.start_date = o.new_start_date;
						if (o.new_due_date) row.due_date = o.new_due_date;
						this.updateModifiedUser(row, ['last_modified_by', 'last_modified_on'], ev.data.result);
						rows.push(row);
					}
				});
				this.gridApi.updateRowData({ update: rows });
			} else if (ev.type == 'save-selected') {
				const parentIndx = _.findIndex(this.state.tasksDetails.list, ['id', ev.data.selected.id]);
				if (parentIndx) this.state.tasksDetails.list[parentIndx] = { ...this.state.tasksDetails.list[parentIndx], ...ev.data.selected };
				let updateKey = 'update';
				const row = this.gridApi.getRowNode(ev.data.selected.id).data;
				if (row) {
					row.due_date = _moment(ev.data.form.due_date).format('MMM DD, YYYY');
					if (ev.data.selected.task_id != ev.data.form.task_id) {
						row.task_id = ev.data.form.task_id;
						row.task_name = ev.data.selected.task_name;
					}
					if (ev.data.selected.assignee_id != ev.data.form.assignee_id) {console.log(ev.data.selected)
						row.assignee_id = ev.data.form.assignee_id;
						row.assignee_name = ev.data.selected.assignee_name;
						if(ev.data.selected.assignee_dept){
							row.assignee_dept = ev.data.selected.assignee_dept;
						}
						//TO remove task from grid if task type is mytask and changed assignee type
						if (this.state.selectedFilter.key == 1)
							updateKey = 'remove';
					}
					if (ev.data.selected.status != ev.data.form.status) {
						ev.data.selected.status = row.status = ev.data.form.status;
						ev.data.selected.status_name = row.status_name = ev.data.form.status_name;
					}
					row.note = ev.data.selected.note;
					row.product_cnt = ev.data.selected.product_cnt;
					row.service_cnt = ev.data.selected.service_cnt;
					this.updateModifiedUser(row, ['last_modified_by', 'last_modified_on'], ev.data.selected);
					this.gridApi.updateRowData({ [updateKey]: [row] });
					if(updateKey == 'remove'){
						const list = [];
						this.gridApi.forEachNode(x =>list.push(x));
						this.state.tasksDetails.list = list;
						if(list.length){
							this.state.selectedTask = list[0];
							this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
						}else{
							this.state.selectedTask = null;
							this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list']);
						}
					}
				}
			} else if (ev.type == 'detail-trans') {
				const row = this.gridApi.getRowNode(ev.data.selected.id).data;
				if (row) {
					row.is_enable = ev.data.trans.id == 5 ? false : true;
					row.status = ev.data.res.status_id;
					row.status_name = ev.data.res.status_name;
					row.status_dropdown = ev.data.res.status_dropdown;
					row.settings = !row.settings;
					this.updateModifiedUser(row, ['last_modified_by', 'last_modified_on'], ev.data.res);
					this.gridApi.updateRowData({ update: [row] });
				}
				if (ev.data.selected.slug == 'deliver') {
					this.gridApi.getModel().forEachNode((node: RowNode) => {
						if (node.data.slug == 'delivery_due_date' && ev.data.trans.id == 5) {
							node.data.is_enable = ev.data.trans.id == 5 ? false : true;;
							node.data.status = ev.data.res.status_id;
							node.data.status_name = ev.data.res.status_name;
							node.data.status_dropdown = ev.data.res.status_dropdown || [];
							this.updateModifiedUser(node.data, ['last_modified_by', 'last_modified_on'], ev.data.res);
							node.setData(node.data);
						}
					})
				}
				if (ev.data.selected.slug == 'final_bill_due') {
					this.gridApi.getModel().forEachNode((node: RowNode) => {
						if (node.data.slug == 'final_bill_due_date' && ev.data.trans.id == 5) {
							node.data.is_enable = ev.data.trans.id == 5 ? false : true;;
							node.data.status = ev.data.res.status_id;
							node.data.status_name = ev.data.res.status_name;
							node.data.status_dropdown = ev.data.res.status_dropdown || [];
							this.updateModifiedUser(node.data, ['last_modified_by', 'last_modified_on'], ev.data.res);
							node.setData(node.data);
						}
					})
				}
			} else if (ev.type == 'add-log-time') {
				const row: RowNode = this.gridApi.getRowNode(ev.data.selected.id);
				if (row) {
					row.setData({ ...row.data, ...{ track_time_total: ev.data.duration } });
				}
			} else if (ev.type == 'go-to-parent') {
				this.state.selectedTask = { id: ev.data };
				if (this.state.selectedTask && this.state.selectedTask.id) {
					this.setSelection(this.state.selectedTask.id, true);
				}
			}
		})
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		this.routerSubscription.unsubscribe();
		this.breadcrumbSubscription.unsubscribe();
		this.taskSubscription.unsubscribe();
	}

	showSelection(params) {
		let isDisable = true;
		if (params.column['colId'] == 'status_name') isDisable = true;
		else if (params.column['colId'] == 'settings') isDisable = true;
		else if (params.column['colId'] == 'due_date') {
			if (params.data && params.data.due_date_edit && params.data.is_enable) isDisable = true;
			else isDisable = false
		}
		else if (params.column['colId'] == 'start_date') {
			if (params.data && params.data.start_date_edit && params.data.is_enable) isDisable = true;
			else isDisable = false
		} else {
			isDisable = false;
		}
		return isDisable;
	}

	setSelection(id, bol) {
		const row: RowNode = this.gridApi.getRowNode(id);
		if (row) row.setSelected(bol);
	}

	generateColumns(flag = 'full', isVisible = false) {
		this.gridApi.setColumnDefs([]);
		let primaryColumns: Array<ColDef> = [
			{
				headerName: ' ', cellClass: 'task-optns', colId: 'settings', minWidth: 40, maxWidth: 40, field: 'settings', cellRendererFramework: TaskSettings
				//params => {
				// 	return `<div class="ag-cell-custome-actions" style="display:flex;align-items:center;" *ngIf="params.data.slug != 'job_start_date'">
				// 	<ul style="padding-top:0;">
				// 		<li class="disable-click" style="margin-left: 0px; background: rgb(228, 231, 241);" [matMenuTriggerFor]="menu"><i class="pixel-icons icon-more-horizontal" ></i></li>
				// 	</ul>
				// 	<mat-menu #menu="matMenu" xPosition="after" yPosition="below" class="grid-cell-drop-menu-ui cust-ui-menu">
				// 	<ng-container *ngFor="let act of actions">
				// 		<a *ngIf="act.is_visible" (click)="performActions(act)"><i class="pixel-icons  icon-{{act.icon}}"></i> <span>{{act.label}}</span></a>
				// 	</ng-container>
				// </mat-menu>
				// </div>`;
				// }
			},
			{ headerName: 'Task ID/Task Name', colId: 'task_name', field: 'task_name', cellClass: 'd-flex full-width-cell', cellRendererFramework: TaskNameCell, sortable: true }, /*hide: true },*/
			{ headerName: 'Status', minWidth: 200, colId: 'status_name', field: 'status_name', cellRendererFramework: StatusMenuCell, cellClass: 'status-cell', cellRendererParams: { jobs_id: this.state.projectID } },
			{
				headerName: 'Due Date', minWidth: 200, colId: 'due_date', field: 'due_date', sortable: true, cellClass: 'editable-cell',
				cellRendererFramework: DueDateCell, comparator: agGridDateSort, valueFormatter: params => {
					return (params.value)?_moment(new Date(params.value)).format('MMM DD, YYYY'):'MMM DD, YYYY';
				},
				cellRendererParams: {
					isEditProp: 'due_date_edit'
				},
				cellClassRules: {
					'ag-edit-cell': params => {
						return params.data && params.data.is_enable && params.data.due_date_edit
					}
				}
				/* editable: true, cellEditorFramework: DateCellEditorComponent, comparator: agGridDateSort, cellRenderer: params => {
					if (params.data) {
						if (params.value) return _moment(new Date(params.value)).format('MMM DD, YYYY');
					}
				}*/
			},
			{
				headerName: 'Log Time', width: 100, colId: 'track_time_total', field: 'track_time_total', cellClass: 'log-time', cellRenderer: params => {
					if (params.data) {
						if (params.data.is_milestones) {
							return `<div style="display: flex;align-items: center;">
										<span>--</span>
									</div>`
						} else {
							return `<div style="display: flex;align-items: center;">
										<i class="pixel-icons icon-clock"></i>
										<span style="margin-left: 6px; ">${params.value}</span>
									</div>`
						}
					}
				}
			},
			// { headerName: 'Task Type', colId: 'task_type_name', field: 'task_type_name', /*sortable: true*/ },
			// { headerName: 'Assignee', colId: 'assignee_name', field: 'assignee_name', sortable: true },
			{
				headerName: 'Assignee', minWidth: 200, colId: 'assignee_name', field: 'assignee_name', sortable: true, cellRenderer: params => {
					let assignName: any;
					let assigneeText = '';
					if (params.data && params.data.assignee_name) {
						assignName = params.data.assignee_name;
						assignName = assignName.split(' ');
						assignName.map(function (value, index) {
							if (index <= 1) {
								assigneeText = assigneeText + value.charAt(0);
							}
						});
						return `<div style="display: flex;align-items: center;">
							 <span class="letter-icon">${assigneeText} </span> <span style="margin-left: 6px; position:relative; top: 1px;">${params.value}</span>
						</div>`;
					}
				}
			},
			{ headerName: 'Assignee Department', colId: 'assignee_dept', field: 'assignee_dept', sortable: true },
			{
				headerName: 'Start Date', minWidth: 200, colId: 'start_date', field: 'start_date', /*sortable: true,*/ cellClass: 'editable-cell',
				cellRendererFramework: DueDateCell, comparator: agGridDateSort, valueFormatter: params => {
					if (params.value)
						return _moment(new Date(params.value)).format('MMM DD, YYYY');
				},
				cellRendererParams: {
					isEditProp: 'start_date_edit'
				},
				cellClassRules: {
					'ag-edit-cell': params => {
						return params.data && params.data.is_enable && params.data.start_date_edit
					}
				}
				/*comparator: agGridDateSort, cellRenderer: params => {
					if (params.data) {
						if (params.value) return _moment(new Date(params.value)).format('MMM DD, YYYY');
					}
				}*/
			},
			// { headerName: 'Dependencies', colId: 'dependencies', field: 'dependencies' },
			/*{ headerName: 'PO', colId: 'po_no', field: 'po_no' },
			{ headerName: 'Estimate', colId: 'est_no', field: 'est_no' },*/
			{
				headerName: 'Updated On', width: 180, colId: 'updated_on', field: 'last_modified_on', cellRenderer: params => {
					if (params.data) {
						if (params.value) {
							const value = this.fromNowPipe.transform(new Date(params.value));
							return _moment(new Date(params.value)).format('MMM DD, YYYY');
						}
					}
				}
			},
			{ headerName: 'Updated By', colId: 'updated_by', field: 'last_modified_by' },
			{
				headerName: 'Product/Service', colId: 'product_services', field: 'product_services', cellRenderer: params => {
					return params.data ?
						`<div style="display: flex;align-items: center"> <div class="product m-r-15">
						<!-- *ngIf="params.data.product_cnt" -->
							<i class="pixel-icons icon-products"></i>
							<span class="count">${params.data.product_cnt}</span>
						</div>
						<div class="service-title">
						<!-- *ngIf="params.data.service_cnt" -->
							<i class="pixel-icons icon-orders"></i>
							<span class="count">${params.data.service_cnt}</span>
						</div></div>`
						: '';
				}
			}

		];

		let secondaryColumns: Array<ColDef> = [
			{ headerName: ' ', colId: 'settings', minWidth: 40, maxWidth: 40, field: 'settings', cellClass: 'task-optns', cellRendererFramework: TaskSettings },
			{ headerName: 'Task ID/Task Name', colId: 'task_name', field: 'task_name', cellClass: 'd-flex full-width-cell', sortable: true, cellRendererFramework: TaskNameCell }, /*hide: true },*/
			{ headerName: 'Status', minWidth: 200, colId: 'status_name', field: 'status_name', cellRendererFramework: StatusMenuCell, cellClass: 'status-cell', cellRendererParams: { jobs_id: this.state.projectID } },
			{
				headerName: 'Due Date', minWidth: 220, colId: 'due_date', field: 'due_date', sortable: true, cellClass: 'editable-cell',
				cellRendererFramework: DueDateCell, comparator: agGridDateSort, valueFormatter: params => {
					return (params.value)?_moment(new Date(params.value)).format('MMM DD, YYYY'):'MMM DD, YYYY';
				},
				cellRendererParams: {
					isEditProp: 'due_date_edit'
				},
				cellClassRules: {
					'ag-edit-cell': params => {
						return params.data && params.data.is_enable && params.data.due_date_edit
					}
				}
			},
			{
				headerName: 'Log Time', colId: 'track_time_total', width: 100, field: 'track_time_total', cellClass: 'log-time', cellRenderer: params => {
					if (params.data) {
						if (params.data.is_milestones) {
							return `<div style="display: flex;align-items: center;">
										<span>--</span>
									</div>`
						} else {
							return `<div style="display: flex;align-items: center;">
										<i class="pixel-icons icon-clock"></i>
										<span style="margin-left: 6px; ">${params.value}</span>
									</div>`
						}
					}
				}
			},
			{
				headerName: 'Assignee', colId: 'assignee_name', width: 40, maxWidth: 50, field: 'assignee_name', sortable: true, cellRenderer: params => {
					let assignName: any;
					let assigneeText = '';
					if (params.data && params.data.assignee_name) {
						assignName = params.data.assignee_name;
						assignName = assignName.split(' ');
						assignName.map(function (value, index) {
							if (index <= 1) {
								assigneeText = assigneeText + value.charAt(0);
							}
						});
						return `<div style="display: flex;align-items: center; height: 37px;">
							 <span class="letter-icon" title="${params.value}">${assigneeText}</span>
						</div>`;
					}
				}
			}
			// {
			// 	headerName: 'Start Date', colId: 'start_date', field: 'start_date', /*sortable: true,*/ cellClass: 'disable-click editable-cell',
			// 	cellRendererFramework: DueDateCell, comparator: agGridDateSort, valueFormatter: params => {
			// 		if (params.value)
			// 			return _moment(new Date(params.value)).format('MMM DD, YYYY');
			// 	},
			// 	cellRendererParams: {
			// 		isEditProp: 'start_date_edit'
			// 	}
			// },

		];

		if (this.state.selectedSort) {
			const column = _.find((flag == 'full' ? primaryColumns : secondaryColumns), ['field', this.state.selectedSort.key])
			if (column) column.sort = this.state.selectedSort.sort;
		}

		this.gridApi.setColumnDefs(flag == 'full' ? primaryColumns : secondaryColumns);
		if (flag == 'half') {
			// this.performActions('sort', this.state.selectedSort);
			this.gridApi.setHeaderHeight(0);
		}
		else {
			// this.performActions('task', this.state.selectedGroup);
			this.gridApi.setHeaderHeight(34);
		}

		this.performActions('task', this.state.selectedGroup);
		// this.performActions('sort', this.state.selectedSort, false);

		if (isVisible) agGridColumnAutoFit(this.gridApi, this.gridColumnApi, false);
		setTimeout(() => {
			this.isVisible = true;
		}, 500);
	}

	getTaskList(id, flag) {
		this.state.isLoading = true;
		this.isVisible = false;
		this._commonService.getApi('jobsTasksLists', { from: 'tasks', jobs_id: id, jobs_task_type: this.state.selectedFilter.key })
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.tasksDetails.framedList = [];
					this.state.tasksDetails.list = res['result'].data || [];
					this.state.tasksDetails.list.map((item, i) => {
						this.state.tasksDetails.framedList.push({ ...item, ...{ taskHierarchy: [item.id] } });
						if (item.hasOwnProperty('child') && item.child.length) {
							item.child.map((subItem, j) => {
								this.state.tasksDetails.framedList.push({ ...subItem, ...{ taskHierarchy: [item.id, subItem.id], parent_name: item.task_name } });
							})
						}
					});

					this._taskService.update({ type: 'init', data: this.state.tasksDetails, flag: flag });
					if (flag != 'init') {
						if (this.activeRoute.snapshot.firstChild) {
							if (this.state.tasksDetails.list.length) {
								const findIndx = _.findIndex(this.state.tasksDetails.list, ['id', this.state.selectedTask.id]);
								if (findIndx == -1) {
									this.state.selectedTask = this.state.tasksDetails.list[0];
									this._taskService.update({ type: 'go-to-parent', data: this.state.selectedTask.id });
									this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
								}
							} else {
								this.state.selectedTask = null;
								this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/']);
							}
						}
					} else {
						if (this.activeRoute.snapshot.firstChild) {
							this.state.selectedTask = null;
							this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/']);
						}
					}
				}
				if (res['result'].success && !res['result'].data.length) {
					this.isVisible = true;
				}
			})
	}

	resetDetailView(flag = 'details') {
		if (flag == 'list') this._taskService.update({ type: 'init', data: this.state.tasksDetails });
		// this.state.submitted = false;
		// this.state.showButtons = false;
		// this.toggleEdit(false);
	}

	snackbarModal(status = 'success', isNew = true, msg?) {
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: { status: status, msg: msg ? msg : ('Task ' + (isNew ? 'Created ' : 'Updated ') + ' Successfully') },
			verticalPosition: 'top',
			horizontalPosition: 'right',
			panelClass: status
		});
	}

	performActions(flag, option, isChange = true) {
		if (this.state.tasksDetails.framedList.length) {
			if (flag == 'task') {
				if (option.type == 'group') {
					this.state.selectedGroup = option;
					this.gridColumnApi.setRowGroupColumns([option.key]);
				}
			} else if (flag == 'sort') {
				this.state.selectedSort = option;
				const sort = this.gridApi.getSortModel();
				if (sort.length) {
					let sortOrder = 'asc';
					if (sort[0].colId == option.key)
						sortOrder = isChange ? (sort[0].sort == 'asc' ? 'desc' : 'asc') : sort[0].sort;
					this.state.selectedSort.display = option.label + '(' + sortOrder + ')';
					this.state.selectedSort.sort = sortOrder;
					this.gridApi.setSortModel([{ colId: option.key, sort: sortOrder }])
				} else {
					this.state.selectedSort.display = option.label;
					this.state.selectedSort.sort = 'asc';
					this.gridApi.setSortModel([{ colId: option.key, sort: 'asc' }])
				}
			}
		}
	}

	updateJobStatus() {
		this._commonService.getApi('getJobInfo', { id: this.state.projectID, type: 'status' })
			.then(res => {
				if (res['result'].success) {
					this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
				}
			})
	}


	addTask(type = 'add', data = null) {
		let rowIndex = null;
		if (data) {
			rowIndex = this.gridApi.getRowNode(data.id).rowIndex + 1;
			if (!data['task_type_id']) {
				data['task_type_id'] = data['is_milestones'] ? 39 : 1;
			}
		}
		this._dialog.open(CreateTaskComponent, {
			panelClass: 'recon-dialog',
			width: '880px',
			data: {
				title: type == 'dup' ? 'Create Duplicate Task' : (type == 'sub' ? 'Add Sub Task' : 'Create New Task'),
				jobs_id: this.state.projectID,
				jobs_name: this._taskService.breadcrumbData[1]['job_no'],
				selectedRow: (type == 'sub' || type == 'dup') ? data : null,
				type: type
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (res.data) {
						res.data.is_enable = true;
						const taskHierarchy = type == 'sub' ? [res.data.parent_id, res.data.id] : [res.data.id];
						if (this.state.tasksDetails.list.length) {
							this.state.selectedTask = res.data;
							setTimeout(() => {
								if (rowIndex)
									this.gridApi.updateRowData({ add: [{ ...res.data, ...{ taskHierarchy: taskHierarchy, parent_name: res.data.parent_name } }], addIndex: rowIndex });
								else
									this.gridApi.updateRowData({ add: [{ ...res.data, ...{ taskHierarchy: taskHierarchy, parent_name: res.data.parent_name } }] });

								const row: RowNode = this.gridApi.getRowNode(this.state.selectedTask.id);
								if (row) row.setSelected(true);
							}, 20);
						}
						if (type == 'sub') {
							const parentIndx = _.findIndex(this.state.tasksDetails.list, ['id', res.data.parent_id]);
							if (this.state.tasksDetails.list[parentIndx].hasOwnProperty('child')) this.state.tasksDetails.list[parentIndx].child.push(res.data);
							else this.state.tasksDetails.list[parentIndx].child = [res.data];
							const row: RowNode = this.gridApi.getRowNode(res.data.parent_id);
							if (row) {
								row.data = this.state.tasksDetails.list[parentIndx];
								row.setData(row.data);
							}
						} else {
							this.state.tasksDetails.list.push(res.data);
						}
						this.state.tasksDetails.framedList.push({ ...res.data, ...{ taskHierarchy: taskHierarchy } });
						this._router.navigate(['/projects/' + this.state.projectID + '/tasks/list/' + this.state.selectedTask.id]);
					}
					this._commonService.update({ type: 'left-nav-count', data: {} });
					this.snackbarModal();
				}
			})
	}

	updateModifiedUser(row, keys, data) {
		keys.map(prop => {
			row[prop] = data[prop];
		})
	}

	confirmSchedule(task, params, data, cb?) {
		let oldDate = _moment(params.old_date).format('MMM DD, YYYY');
		this._dialog.open(ConfirmationComponent, {
			panelClass: ['recon-dialog', 'confirmation-dialog'],
			width: '570px',
			data: {
				title: 'Schedule',
				url: 'updateTaskDueDate',
				method: 'post',
				params: {
					id: task.id,
					jobs_id: this.state.projectID,
					interval: data.interval,
					new_date: data.new_date,
					ids: data.ids,
					type: 'all',
					is_default: params.is_default,
					slug: task.slug
				},
				content: `<div class="po-dialog">
									<div class="">
										<span class="warning"><i class="pixel-icons icon-exclamation"></i></span>
									</div>
									<div class="">
										<p>Do you want to move all the othertasks due after <br /> ${oldDate} by ${params.interval} Days</p>
									</div>
								</div>`,
				buttons: {
					yes: 'Update All Other Tasks',
					no: 'Don\'t Update Other Tasks'
				},
				cancelAction: true
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (res.data.from == 'no') {
					} else {
						let rows = [];
						data.ids.map(id => {
							let row = this.gridApi.getRowNode(id) ? this.gridApi.getRowNode(id).data : null;
							if (row) {
								row.due_date = _moment(new Date(row.due_date)).add(data.interval, 'day').format('MMM DD, YYYY');
								this.updateModifiedUser(row, ['last_modified_by', 'last_modified_on'], res.data.result);
								rows.push(row);
							}
						});
						this.gridApi.updateRowData({ update: rows });
					}
					if (this.state.selectedTask) {
						if (data.id == this.state.selectedTask.id) {
							this.state.selectedTask.due_date = _moment(new Date(this.state.selectedTask.due_date)).add(data.interval, 'day').format('MMM DD, YYYY HH:MM a');
							this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res.data.result);
							this._taskService.update({ type: 'update-due-date', data: this.state.selectedTask });
						}
					}
				} else {
					if (cb) cb();
				}

			})
	}

	checkSchedule(task, params, data, cb?) {
		this._dialog.open(CheckScheduleComponent, {
			panelClass: 'recon-dialog',
			width: '680px',
			data: {
				title: 'Edit Due Date',
				list: data.list, //list
				params: {
					id: task.id,
					jobs_id: this.state.projectID,
					interval: data.interval,
					new_date: data.new_date,
					ids: data.ids,
					list: data.list,
					is_delivery: true,
					slug: task.slug
				}
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					let rows = [];
					data.list.map(o => {
						let row = this.gridApi.getRowNode(o.id).data;
						if (o.new_start_date) row.start_date = o.new_start_date;
						if (o.new_due_date) row.due_date = o.new_due_date;
						this.updateModifiedUser(row, ['last_modified_by', 'last_modified_on'], res.data);
						rows.push(row);
					});
					this.gridApi.updateRowData({ update: rows });
					this.confirmSchedule(task, params, data);
				} else {
					if (cb) cb();
				}
			})
	}

	updateDueDate(task, oldValue, newValue, isStart = false, cb?) {
		const params = {
			id: task.id,
			old_date: oldValue?_moment(oldValue).format('YYYY-MM-DD HH:mm:ss'):'',
			new_date: _moment(newValue).format('YYYY-MM-DD HH:mm:ss'),
			interval: _moment.duration(newValue.diff(oldValue)).days(), // >= 0 ? _moment.duration(newValue.diff(oldValue)).days() + 1 : _moment.duration(newValue.diff(oldValue)).days(),
			jobs_id: this.state.projectID,
			is_delivery: task.is_delivery,
			is_start: isStart,
			slug: task.slug
		}
		if(this.state.selectedFilter['key']==2){
			this._commonService.saveApi('updateTaskDueDate', {
				id: task.id,
				jobs_id: this.state.projectID,
				interval: params.interval,
				new_date: params.new_date,
				type: 'single',
				slug: task.slug
			}).then(res => {
				if (res['result'].success) {
					if (this.state.selectedTask) {
						if (params.id == this.state.selectedTask.id) {
							this.state.selectedTask.due_date = _moment(new Date(this.state.selectedTask.due_date)).add(params.interval, 'day').format('MMM DD, YYYY HH:MM a');
							this.updateModifiedUser(this.state.selectedTask, ['last_modified_by', 'last_modified_on'], res['result'].data);
							this._taskService.update({ type: 'update-due-date', data: this.state.selectedTask });
						}
					}
				}
			});
		}else{
			this._commonService.saveApi('chkTaskDueDates', params)
			.then(res => {
				if (res['result'].success) {
					if (res['result'].data.action) {
						if (res['result'].data.list.length) {
							params['is_default'] = false;
							this.checkSchedule(task, params, res['result'].data, () => {
								if (cb) cb();
							});
						} else {
							params['is_default'] = true;
							this.confirmSchedule(task, params, res['result'].data, () => {
								if (cb) cb();
							});
						}
					}
				} else {
					if (cb) cb();
				}
			})
		}
	}

	addFromTemplate() {
		this._dialog.open(AddFromTemplateComponent, {
			panelClass: ['my-dialog', 'full-modal-box-ui', 'padding-0'],
			maxWidth: '100vw',
			maxHeight: '100vh',
			width: '100%',
			height: '100%',
			data: {
				title: 'Import Template',
				jobDetails: this.state.projectDetails,
				jobs_id: this.state.projectID
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.succes) {
					this.getTaskList(this.state.projectID, 'init');
				}
			})
	}

}

