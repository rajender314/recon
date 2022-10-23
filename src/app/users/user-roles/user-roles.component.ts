import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { UsersService } from '@app/users/users.service';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder } from '@angular/forms';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AddUserComponent } from '@app/users/add-user/add-user.component';
import { StatusFilter, SortFilter } from '@app/shared/utility/dummyJson';
var APP: any = window['APP'];
@Component({
	selector: 'app-user-roles',
	templateUrl: './user-roles.component.html',
	styleUrls: ['../users.component.scss', './user-roles.component.scss']
})
export class UserRolesComponent implements OnInit {

	public state: any = {
		statusBy: 'Active',
		sortBy: 'A-Z',
		loader: true,
		detailsLoader: true,
		showDetail: false,
		param: {
			page: 1,
			pageSize: 50,
			sort: 'asc',
			status: 'true'
		},
		totalCount: 0,
		totalPages: 0,
		userRolesList: [],
		selectedUserRole: {},
		activeTab: 0,
		userRoleTabs: [
			{ label: "System Access", type: 0 },
			{ label: "Project Access", type: 1 },
			{ label: "Users", type: 2 }
		],

		tabs: [
			{ id: 0, label: "User Roles", displayLabel: "User Roles", show: (APP.permissions.system_access.user_roles=='yes')?true:false, route: "users/user_roles" },
			{ id: 1, label: "Ivie", displayLabel: "Ivie Users", show: (APP.permissions.system_access.ivie_users=='yes')?true:false, route: "users/ivie" },
			{ id: 2, label: "Clients", displayLabel: "Clients", show: (APP.permissions.system_access.client_users=='yes')?true:false, route: "users/clients" },
			{ id: 3, label: "Vendors", displayLabel: "Vendors", show: (APP.permissions.system_access.vendor_users=='yes')?true:false, route: "users/vendors" }
		],
		selectedTab: { id: 0, label: "User Roles", displayLabel: "User Roles", route: "users/user_roles" },

		permissions: {},

		jobAccess: [],
		jobAccessPermissions: [],
		users: []

	};

	specificationsForm: FormGroup
	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		jobAccess: [
			{ label: 'Project Access', key: 'name' },
			{ label: 'Project Specific to User', key: 'job_specific_user' },
			{ label: 'Project Specific to Others', key: 'job_specific_others' },
		],
		headers: [
			{ label: 'Access', key: 'name' },
			{ label: 'Permission', key: 'options' }
		]
	}

	constructor(
		private usersService: UsersService,
		private fb: FormBuilder,
		private snackbar: MatSnackBar,
		private dialog: MatDialog
	) {
		this.specificationsForm = this.fb.group({
			id: '',
			name: '',
			status: null
		})
	}

	ngOnInit() {
		this.getUserRolesList();
	}

	changeMasterView = () => {
		this.state.showDetail = !this.state.showDetail;
	}

	hideDetails(): void {
		this.state.showDetail = false;
	}

	changeStatus() {
		this.specificationsForm.markAsPristine();
		this.saveDetails(this.specificationsForm);
	}

	/* generate controls */
	createForm = method => {
		let controls = {}, groupControl, jobAccess = [], jobAccessPermissions = [];
		if (method == 'job_access') {
			/* job access */
			this.state.permissions[method][0].items.map(item => {
				if (item.cells) {
					groupControl = {};
					item.cells.map(cell => {
						groupControl[cell.key] = '';
					})
					controls[item.key] = this.fb.group(groupControl);
				}
			});
			this.state.permissions[method][1].items.map(item => {
				controls[item.key] = '';
				if (item.children && item.children.length)
					controls = { ...controls, ...this.createChildControls(item.children) };
			})
		} else {
			this.state.permissions[method][0].items.map(item => {
				controls[item.key] = '';
				if (item.children && item.children.length)
					controls = { ...controls, ...this.createChildControls(item.children) };
			});
		}
		this.specificationsForm.addControl(method, this.fb.group(controls));
	}

	createChildControls = items => {
		let controls = {};
		items.map(item => {
			controls[item.key] = '';
			if (item.radio_group && item.radio_group.length) {
				controls[item.key + '_option'] = '';
			}
			if (item.children && item.children.length) {
				controls = { ...controls, ...this.createChildControls(item.children) }
			}
		})

		return controls;
	}

	/* set default value for generated controls */
	setDefaultValues = prop => {
		let value = {};
		if (prop == 'job_access' && this.state.permissions[prop]) {
			this.state.permissions[prop][0].items.map(item => {
				if (item.cells) {
					value[item.key] = {};
					item.cells.map(cell => {
						value[item.key][cell.key] = cell.options[0].value;
					})
				}
			});
			this.state.permissions[prop][1].items.map(item => {
				if (item.type == 'radio' || item.type == 'select') value[item.key] = item.options.length == 3 ? item.options[0].value : item.options[1].value;
				else if (item.type == 'checkbox') value[item.key] = false;
				else if (item.type == 'textbox') value[item.key] = '';
				if (item.children && item.children.length)
					value = { ...value, ...this.setChildrenDefaultValues(item.children) };
			})
		} else if (prop && this.state.permissions[prop]) {
			this.state.permissions[prop][0].items.map(item => {
				value[item.key] = item.options.length == 3 ? item.options[0].value : item.options[1].value;
				if (item.children && item.children.length)
					value = { ...value, ...this.setChildrenDefaultValues(item.children) };
			})
		}
		return value;
	}

	setChildrenDefaultValues = items => {
		let value = {};
		items.map(item => {
			if (item.type == 'radio' || item.type == 'select') value[item.key] = item.options.length == 3 ? item.options[0].value : item.options[1].value;
			else if (item.type == 'checkbox') value[item.key] = false;
			else if (item.type == 'textbox') value[item.key] = '';
			if (item.radio_group && item.radio_group.length)
				value[item.key + '_option'] = item.radio_group[0].key;
			if (item.children && item.children.length)
				value = { ...value, ...this.setChildrenDefaultValues(item.children) };
		})
		return value;
	}

	setForm = data => {
		this.specificationsForm.patchValue({
			id: data._id,
			name: data.name,
			status: data.status
		});

		const method = this.state.activeTab == 0 ? 'system_access' : this.state.activeTab == 1 ? 'job_access' : 'users';
		this.patchValue(data, method);
	}

	patchValue = (data, method) => {
		this.specificationsForm.controls[method].patchValue(data[method] || this.setDefaultValues(method), { emitEvent: false });
	}

	resetForm = data => {
		this.specificationsForm.reset({
			id: data._id,
			name: data.name,
			status: data.status
		})
		
		const method = this.state.activeTab == 0 ? 'system_access' : this.state.activeTab == 1 ? 'job_access' : 'users';
		this.patchValue(data, method);
	}

	getUserRolesList = (flag?) => {
		this.usersService.getUserRoles(this.state.param)
			.then(res => {
				this.state.loader = false;
				if (res.result.success) {
					this.state.totalCount = res.result.data.total;
					if (this.state.param.page == 1) this.state.totalPages = Math.ceil(Number(this.state.totalCount) / this.state.param.pageSize);
					if (flag == 'pagination') {
						this.state.userRolesList = [...this.state.userRolesList, ...res.result.data.items];
					} else {
						this.state.userRolesList = res.result.data.items;
						if (this.state.userRolesList.length) this.onSelectItem(this.state.userRolesList[0]);
						else this.state.selectedUserRole = {};
					}
				}
			})
	}

	getUsers(): void{
		this.usersService.getUserRoleContacts({user_role_id: this.state.selectedUserRole._id})
		.then(res => {
			this.state.detailsLoader = false;
			if (res.result.success) {
				this.state.users = res.result.data;
			}
		});
	}

	toggleChild(org: any, event: any): void{
		event.stopImmediatePropagation();
		org['showChildren'] = !org['showChildren'];
	}

	onScroll(): void{

	}

	getPermissions = method => {
		if (Object.keys(this.state.permissions).length) {
			if (this.state.permissions[method] && Object.keys(this.state.permissions[method]).length) {
				this.state.detailsLoader = false;
				this.setForm(this.state.selectedUserRole);
				return;
			}
		}
		this.usersService.getPermissions({ method: method, org_type: 1 })
			.then(res => {
				if (res.result.success) {
					this.state.permissions[method] = res.result.data.items;
					this.createForm(method);
					this.state.detailsLoader = false;
					this.setForm(this.state.selectedUserRole);
					this.state.detailsLoader = false;
				}
			})
	}

	onSelectItem = item => {
		this.state.selectedUserRole = item;
		//this.state.activeTab = 0;
		this.onTabChange(this.state.activeTab);
	}

	onSearch = val => {
		this.state.param.page = 1;
		if (val) this.state.param.search = val;
		else delete this.state.param.search;
		this.getUserRolesList();
	}

	onApplyFilter = (prop, obj?) => {
		this.state.param.page = 1;
		if (prop == 'sort') {
			this.state.sortBy = this.state.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.state.param[prop] = this.state.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getUserRolesList();
		} else {
			if (obj.label != this.state.statusBy) {
				this.state.param[prop] = obj.value;
				if (obj.label == 'All') this.state.statusBy = '';
				else this.state.statusBy = obj.label;
				this.getUserRolesList();
			}
		}
	}

	onTabChange = tabIndex => {
		this.state.activeTab = tabIndex;
		this.state.detailsLoader = true;
		setTimeout(() => {
			switch (tabIndex) {
				case 0:
					this.getPermissions('system_access');
					break;
				case 1:
					this.getPermissions('job_access');
					break;
				case 2:
					this.getUsers();
					break;
				default:
					this.state.detailsLoader = false;
					break;
			}
		},500);
	}

	openAddDialog = (data?) => {
		this.dialog
			.open(AddUserComponent, {
				panelClass: 'my-dialog',
				width: '500px',
				data: { title: 'Add New User Role', dropdwons: this.dropdowns }
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.state.param.status ? this.state.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'User Role Added Successfully' });
					this.state.param.page = 1;
					this.getUserRolesList();
					/*if (status != '') {
						if (status === res.data.status) {
							this.state.userRolesList.unshift(res.data);
							this.state.totalCount++;
							this.onSelectItem(this.state.userRolesList[0]);
						}
					} else {
						this.state.userRolesList.unshift(res.data);
						this.state.totalCount++;
						this.onSelectItem(this.state.userRolesList[0]);
					}*/
				}
			})
	}

	saveDetails = form => {
		if (form.valid) {
			this.usersService.saveUserRole(form.value)
				.then(res => {
					if (res.result.success) {
						this.openSnackBar({ status: 'success', msg: 'User Role Saved Successfully' });
						let indx = _.findIndex(this.state.userRolesList, { _id: form.value.id });
						if (indx > -1) {
							if (this.state.statusBy == '' || (JSON.parse(form.value.status) && this.state.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.state.statusBy == 'Inactive')) {
								this.state.userRolesList[indx] = { ...res.result.data };
								this.state.selectedUserRole = { ...res.result.data };
								this.specificationsForm.markAsPristine();
							} else {
								this.state.userRolesList.splice(indx, 1);
								this.state.totalCount--;
								this.onSelectItem(this.state.userRolesList[0]);
							}
						}
					}
				})
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
