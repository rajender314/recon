import { Component, OnInit } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { StatusFilter, Statuses, SortFilter, buildParam, StatusList } from '@app/shared/utility/dummyJson';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { CreateGroupComponent } from '@app/admin/dialogs/create-group/create-group.component';
import { AdminDashboard } from '@app/admin/admin.config';


var APP: any = window['APP'];

@Component({
	selector: 'app-groups',
	templateUrl: './groups.component.html',
	styleUrls: ['../admin.component.scss', './groups.component.scss']
})
export class GroupsComponent implements OnInit {
	APP = APP;
	statusBy: string = 'Active';
	sortBy: string = 'A-Z';
	param: Pagination = {
		page: 1,
		pageSize: 50,
		sort: 'asc',
		status: 'true'
	}
	showView: boolean = false;
	isLoading: boolean = false;
	submitted: boolean = false;
	duplicateError: string = '';
	groupsList: Array<any>;
	totalCount: number = 0;
	totalPages: number = 0;
	selectedGroup: any;
	fetchingDetails: boolean = false;
	groupsForm: FormGroup;
	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		status: Statuses,
		statusList: StatusList,
		usersList: []
	}
	promise: any;
	adminDashboard = AdminDashboard;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Groups', type: 'text' },
	]

	constructor(
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService
	) { }

	ngOnInit() {
		this.createForm();
		this.adminService.getApi('getOrgUser', { org_type: 1, status: true })
			.then(res => {
				if (res.result.success) {
					this.dropdowns.usersList = res.result.data;
				}
			})
		this.getGroups();
	}

	// getter
	get f() { return this.groupsForm.controls; }

	export = () => {
		let url = APP.api_url + 'exportGroups?' + buildParam(this.param) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		window.location.href = url;
	}

	getGroups = (flag?) => {
		if (!flag) this.isLoading = true;
		this.adminService
			.getApi('getGroups', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.totalCount = res.result.data.total;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination')
						this.groupsList = [...this.groupsList, ...res.result.data.groups];
					else {
						this.groupsList = res.result.data.groups;
						if (this.groupsList.length)
							this.onSelectItem(this.groupsList[0]);
						else this.selectedGroup = {};
					}

				}
			})
			.catch(err => {
				this.isLoading = false;
			})
	}

	createForm = () => {
		this.groupsForm = this.fb.group({
			id: '',
			name: ['', Validators.required],
			status: null,
			description: '',
			users_id: []
		})
	}

	setForm = data => {
		this.groupsForm.patchValue({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			users_id: data.users_id || []
		});
	}

	openAddDialog = (data?) => {
		this.dialog
			.open(CreateGroupComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: { title: 'Add New Group', dropdowns: this.dropdowns, name: data ? data : '' }
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Group Added Successfully' });
					this.param.page = 1;
					this.getGroups();
				}
			})
	}

	changeMasterView = () => {
		this.showView = !this.showView;
	}

	onSelectItem = item => {
		this.duplicateError = '';
		this.selectedGroup = item;
		this.fetchingDetails = true;
		this.adminService
			.getApi('getGroups', { id: this.selectedGroup.id })
			.then(res => {
				this.fetchingDetails = false;
				if (res.result.success) {
					this.selectedGroup = res.result.data.groups[0];

					this.setForm(this.selectedGroup);
					this.groupsForm.markAsPristine();
				}
			})
	}

	onSearch = val => {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getGroups();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getGroups();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getGroups();
			}
		}
	}

	saveDetails = form => {
		if (!this.promise) {
			this.submitted = true;
			this.duplicateError = '';
			if (form.valid) {
				this.submitted = false;
				this.promise = this.adminService.saveApi('saveGroups', form.value)
					.then(res => {
						this.promise = undefined;
						if (res.result.success) {
							this.openSnackBar({ status: 'success', msg: 'Group Updated Successfully' });
							let indx = _.findIndex(this.groupsList, { id: form.value.id });
							if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
								this.groupsList[indx] = { ...res.result.data };
								this.selectedGroup = { ...res.result.data };
								this.groupsForm.markAsPristine();
							} else {
								this.groupsList.splice(indx, 1);
								this.totalCount--;
								if (this.groupsList.length) this.onSelectItem(this.groupsList[0]);
							}

						} else {
							this.duplicateError = res.result.data;
						}

					})
					.catch(err => {
						this.promise = undefined;
					})

			}
		}
	}

	resetForm = data => {
		this.groupsForm.reset({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			users_id: data.users_id || []
		});
		this.groupsForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	onScroll = () => {
		if (this.param.page < this.totalPages && this.totalPages != 0) {
			this.param.page++;
			this.getGroups('pagination')
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
