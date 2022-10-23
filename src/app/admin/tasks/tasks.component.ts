import { Component, OnInit } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SortFilter, StatusFilter, checkedLength, buildParam, StatusList, Statuses } from '@app/shared/utility/dummyJson';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { CreateTasksComponent } from '@app/admin/dialogs/create-tasks/create-tasks.component';
import { AdminDashboard } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
	selector: 'app-tasks',
	templateUrl: './tasks.component.html',
	styleUrls: ['../admin.component.scss', './tasks.component.scss']
})
export class TasksComponent implements OnInit {
	APP = APP;
	statusBy: string = 'Active';
	sortBy: string = 'A-Z';
	param: Pagination = {
		page: 1,
		pageSize: 50,
		sort: 'asc',
		status: 'true',
		from: 'admin'
	}
	showView: boolean = false;
	isLoading: boolean = false;
	submitted: boolean = false;
	duplicateError: string = '';
	tasksList: Array<any>;
	totalCount: number = 0;
	totalPages: number = 0;
	selectedTask: any;
	promise: any;
	fetchingDetails: boolean = false;

	tasksForm: FormGroup;
	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		status: Statuses,
		statusList: StatusList,
		milestoneTypes: [
			{ name: 'Project Milestone', label: 'Project Milestones', value: 1 },
			{ name: 'Vendor Milestone', label: 'Vendor Milestones', value: 2 }
		],
		departments: [],
		organizations: [],
		headers: [
			{ label: 'User Type', key: 'name' },
			{ label: 'Access', key: 'options' }
		]
	}
	selectedMilestoneType: any;

	adminDashboard = AdminDashboard;

	/* 1 = 'Tasks', 2 = 'Milestone' */
	whichSchedule: number;
	scheduleName: string;

	breadcrumbs = [];

	constructor(
		private activeRoute: ActivatedRoute,
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService
	) {
		this.whichSchedule = activeRoute.snapshot.data.is_milestone;
		if (this.whichSchedule == 1) {
			this.scheduleName = 'Task';
			this.breadcrumbs = [
				{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
				{ label: 'Tasks', type: 'text' },
			]
			this.loadApiCalls();
		}
		else {
			this.scheduleName = 'Milestone';
			this.breadcrumbs = [
				{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
				{ label: 'Milestones', type: 'text' },
			]
		}
		activeRoute.queryParamMap.subscribe(query => {
			let type = query.get('type');
			if (type) {
				this.param.page = 1;
				this.param.milestone_type = type;
				this.selectedMilestoneType = this.getMilestoneType(Number(type));
				if(this.breadcrumbs.length > 2) this.breadcrumbs.pop();
				this.breadcrumbs = [...this.breadcrumbs, ...[{ label: this.selectedMilestoneType.label, type: 'text' }] ];
				this.loadApiCalls();
			}
		})
	}

	ngOnInit() {
	}

	loadApiCalls = () => {
		this.isLoading = true;
		forkJoin(this.adminService.getApi('getDepartments', { org_type: 1, pageSize: 100000, status: true }), this.adminService.getOrganizationTypes())
		.subscribe(data => {
			this.dropdowns.departments = data[0].result.success ? data[0].result.data.departments : [];
			this.dropdowns.organizations = data[1].result.success ? data[1].result.data : [];
			if (this.dropdowns.organizations) this.generateFormat(this.dropdowns.organizations);
			this.createForm();
			this.getTasks();
		})
	}

	// getter
	get f() { return this.tasksForm.controls; }

	export = () => {
		let param = Object.assign(this.param, { is_milestone: this.whichSchedule})
		let url = APP.api_url + 'exportTasks?' + buildParam(param) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		window.location.href = url;
	}

	generateFormat = data => {
		data.map(org => {
			org.type = 'radio';
			if (org.id != 1) {
				org.options = [
					{ label: 'None', value: 0 },
					{ label: 'View', value: 1 },
					{ label: 'Edit', value: 2 }
				]
			} else {
				org.options = [
					// { label: 'None', value: 0 },
					{ label: 'View', value: 1 },
					{ label: 'Edit', value: 2 }
				]
			}
		})
	}

	getTasks = (flag?) => {
		if (!flag) this.isLoading = true;
		this.param['is_milestone'] = this.whichSchedule;
		this.adminService
			.getApi('getTasks', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.totalCount = res.result.data.total;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination') {
						this.tasksList = [...this.tasksList, ...res.result.data.items];
					} else {
						this.tasksList = res.result.data.items;
						if (this.tasksList.length) this.onSelectItem(this.tasksList[0]);
						else this.selectedTask = {};
					}
				}
			})
			.catch(err => {
				this.isLoading = false;
			})
	}

	getMilestoneType = type => {
		let res = this.dropdowns.milestoneTypes.filter(val => val.value === type);
		if (res.length)
			return res[0];
		else
			return {};
	}

	createForm = () => {
		this.tasksForm = this.fb.group({
			id: '',
			name: ['', Validators.required],
			status: null,
			description: '',
			org_type_id: this.fb.group({
				Ivie: [1],
				Client: [0],
				Vendor: [0]
			}),
			department_ids: this.fb.group(this.createDepartmentControls())
		})
	}

	setForm = data => {
		this.tasksForm.patchValue({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			org_type_id: data.org_type_id,
			department_ids: this.createDepartmentControls(data)
		});
	}

	createDepartmentControls = (data?) => {
		let departmentIds = {};
		this.dropdowns.departments.map(dept => {
			let indx = data ? data.department_ids.indexOf(dept.id) : -1;
			if (indx > -1) departmentIds[dept.id] = true;
			else departmentIds[dept.id] = false;
		})
		return departmentIds;
	}

	openAddDialog = (data?) => {
		let title = this.whichSchedule == 1 ? 'Add New Task' : 'Add New ' + this.selectedMilestoneType.label.substring(0, (this.selectedMilestoneType.label.length - 1));
		this.dialog
			.open(CreateTasksComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: {
					title: title,
					dropdowns: this.dropdowns, name: data ? data : '',
					is_milestone: this.whichSchedule,
					milestone_type: this.param.milestone_type
				}
			}).afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: this.scheduleName + ' Added Successfully' });
					this.param.page = 1;
					this.getTasks();
				}
			})
	}

	changeMasterView = () => {
		this.showView = !this.showView;
	}

	onSelectItem = item => {
		this.duplicateError = '';
		if (!item.org_type_id) item.org_type_id = {};
		this.selectedTask = item;
		this.fetchingDetails = true;
		this.adminService
			.getApi('getTasks', { id: this.selectedTask.id })
			.then(res => {
				this.fetchingDetails = false;
				if (res.result.success && res.result.data.items.length) {
					this.selectedTask = res.result.data.items[0];

					this.setForm(this.selectedTask);
					this.tasksForm.markAsPristine();
				}
			})
	
	}

	onSearch = val => {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getTasks();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getTasks();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getTasks();
			}
		}
	}

	saveDetails = form => {
		if(!this.promise){
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			form.value.is_milestone = this.whichSchedule;
			form.value.department_ids = Object.keys(checkedLength(form.value.department_ids));
			if (this.whichSchedule == 2) form.value.milestone_type = Number(this.param.milestone_type);
			this.promise = this.adminService.saveApi('saveTasks', form.value)
				.then(res => {
					this.promise = undefined;
					if (res.result.success) {
						if (!res.result.data[0].org_type_id) res.result.data[0].org_type_id = {};
						this.openSnackBar({ status: 'success', msg: this.scheduleName + ' Updated Successfully' });
						let indx = _.findIndex(this.tasksList, { id: form.value.id });
						if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
							this.tasksList[indx] = { ...res.result.data[0] };
							this.selectedTask = { ...res.result.data[0] };
							this.tasksForm.markAsPristine();
						} else {
							this.tasksList.splice(indx, 1);
							this.totalCount--;
							if(this.tasksList.length) this.onSelectItem(this.tasksList[0]);
						}
					} else {
						this.duplicateError = res.result.data;
					}
				})
				.catch(err =>{
					this.promise = undefined;
				})
		}
	}
	}

	resetForm = data => {
		this.tasksForm.reset({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			org_type_id: data.org_type_id,
			department_ids: this.createDepartmentControls(this.selectedTask)
		});
		this.tasksForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	onScroll = () => {
		if (this.param.page < this.totalPages && this.totalPages != 0) {
			this.param.page++;
			this.getTasks('pagination')
		}
	}

	openSnackBar = (obj) => {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this.snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

}
