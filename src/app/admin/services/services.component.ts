import { Component, OnInit } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { SortFilter, StatusFilter, Statuses, StatusList, buildParam } from '@app/shared/utility/dummyJson';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { AddAdminDialogComponent } from '@app/admin/dialogs/add-admin-dialog/add-admin-dialog.component';
import { AdminDashboard, FormFieldType, AddDialogLocalType } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
	selector: 'app-services',
	templateUrl: './services.component.html',
	styleUrls: ['../admin.component.scss', './services.component.scss']
})
export class ServicesComponent implements OnInit {
	APP = APP;
	statusBy: string = 'Active';
	sortBy: string = 'A-Z';
	param: Pagination = {
		page: 1,
		pageSize: 50,
		status: 'true',
		sort: 'asc'
	}
	showView: boolean = false;
	isLoading: boolean = false;
	submitted: boolean = false;
	duplicateError: string = '';
	servicesList: Array<any>;
	totalCount: number = 0;
	totalPages: number = 0;
	fetchingDetails: boolean = false;
	selectedService: any;
	promise: any;

	servicesForm: FormGroup;
	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		statusList: StatusList,
		status: Statuses,
		departments: [],
		headers: [
			{ label: 'Department Type', key: 'name' },
			{ label: 'Access', key: 'options' }
		]
	}

	adminDashboard = AdminDashboard;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Services', type: 'text' },
	]

	addFormFields: Array<FormFieldType> = [
		{ key: 'name', label: 'Service Name', type: 'text', validations: { required: true }, default: '' },
		{ key: 'status', label: 'Status', type: 'select', multi: false, options: 'statusList', default: true },
		{ key: 'description', label: 'Description', type: 'textarea', default: '' }
	];

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService
	) { }

	ngOnInit() {
		this.createForm();
		this.isLoading = true;
		this.getDepartments()
			.then(() => {
				this.createDepartmentGroup();
				this.getServices();
			})
	}

	// getter
	get f() { return this.servicesForm.controls; }

	export = () => {
		let url = APP.api_url + 'exportServices?' + buildParam(this.param) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		window.location.href = url;
	}

	getServices = (flag?) => {
		if (!flag) this.isLoading = true;
		this.adminService
			.getApi('services', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.totalCount = res.result.data.total;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination') {
						this.servicesList = [...this.servicesList, ...res.result.data.items];
					} else {
						this.servicesList = res.result.data.items;
						if (this.servicesList.length) this.onSelectItem(this.servicesList[0]);
						else this.selectedService = {};
					}
				}
			})
	}

	getDepartments = () => {
		return this.adminService.getApi('getDepartments', { org_type: 1, status: true })
			.then(data => {
				this.dropdowns.departments = data.result.success ? this.generateFormat(data.result.data.departments) : [];
				this.dropdowns.departments.map(dept => {
					dept.type = 'radio';
				});
			})
	}

	generateFormat = depts => {
		depts.map(dept => {
			dept.type = 'radio';
			dept.options = [{ label: 'None', value: 0 },
			{ label: 'View', value: 1 },
			{ label: 'Edit', value: 2 }]
		});

		
		return depts;
	}

	// default value: 2 (EDIT)
	updateDepartments = depts => {
		const values = {};
		this.dropdowns.departments.map(dept => {
		values[dept.id] = depts[dept.id] != null ? depts[dept.id] : 2;
		})
		return values;
	}

	createForm = () => {
		this.servicesForm = this.fb.group({
			id: '',
			name: ['', Validators.required],
			status: null,
			description: ''
		})
	}

	createDepartmentGroup = () => {
		const controls = {};
		this.dropdowns.departments.map(dept => {
			controls[dept.id] = 2
		})
		this.servicesForm.setControl(
			'departments', this.fb.group(controls)
		);
	}

	setForm = data => {
		this.servicesForm.patchValue({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			departments: this.updateDepartments(data.service_departments_ui || {})
		})
	}

	openAddDialog = (data?) => {
		let locals: AddDialogLocalType = {
			title: 'Add New Service',
			label: 'Service',
			apiCall: 'saveServices',
			dropdowns: this.dropdowns,
			name: data ? data : '',
			flag: 'services',
			formFields: this.addFormFields
		}
		this.dialog
			.open(AddAdminDialogComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: locals
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Service Added Successfully' });
					this.param.page = 1;
					this.getServices();
				}
			})
	}

	changeMasterView = () => {
		this.showView = !this.showView;
	}

	onSelectItem = item => {
		this.duplicateError = '';
		this.selectedService = item;
		this.fetchingDetails = true;
		this.adminService
			.getApi('services', { id: this.selectedService.id })
			.then(res => {
				this.fetchingDetails = false;
				if (res.result.success) {
					this.selectedService = res.result.data.items[0];

					this.setForm(this.selectedService);
					this.servicesForm.markAsPristine();
				}
			})
	}

	onSearch = val => {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getServices();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getServices();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getServices();
			}
		}
	}

	saveDetails = form => {
		if(!this.promise){
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			this.promise = this.adminService.saveApi('saveServices', form.value)
				.then(res => {
					this.promise = undefined
					if (res.result.success) {
						this.openSnackBar({ status: 'success', msg: 'Service Updated Successfully' });
						let indx = _.findIndex(this.servicesList, { id: form.value.id });
						if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
							this.servicesList[indx] = { ...res.result.data[0] };
							this.selectedService = { ...res.result.data[0] };
							this.servicesForm.markAsPristine();
						} else {
							this.servicesList.splice(indx, 1);
							this.totalCount--;
							if (this.servicesList.length) this.onSelectItem(this.servicesList[0]);
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
		this.servicesForm.reset({
			id: data.id,
			name: data.name,
			status: String(data.status),
			description: data.description,
			departments: this.updateDepartments(data.service_departments_ui || {})
		})
		this.servicesForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	onScroll = () => {
		if (this.param.page < this.totalPages && this.totalPages != 0) {
			this.param.page++;
			this.getServices('pagination')
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
