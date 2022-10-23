import { Component, OnInit } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { StatusFilter, Statuses, SortFilter, buildParam, StatusList } from '@app/shared/utility/dummyJson';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { CreateCapabilityCategoryComponent } from '@app/admin/dialogs/create-capability-category/create-capability-category.component';
import { AdminDashboard } from '@app/admin/admin.config';

var APP: any = window['APP'];
@Component({
  selector: 'app-capability-category',
  templateUrl: './capability-category.component.html',
  styleUrls: ['../admin.component.scss','./capability-category.component.scss']
})
export class CapabilityCategoryComponent implements OnInit {
	statusBy: string = 'Active';
	sortBy: string = 'A-Z';
	param: Pagination = {
		page: 1,
		pageSize: 50,
		sort: 'asc',
		status: 'true'
	}
	APP = APP;
	showView: boolean = false;
	isLoading: boolean = false;
	fetchingDetails: boolean = false;
	submitted: boolean = false;
	duplicateError: string = '';
	capabilityCategoryList: Array<any>;
	totalCount: number = 0;
	totalPages: number = 0;
	selectedcapabilityCategory: any;
	username = APP.user.first_name + ' ' + APP.user.last_name;
	promise: any;

	capabilityCategoryForm: FormGroup;
	dropdowns = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		status: Statuses,
		statusList: StatusList,
		serviceList: [],
		capabilityList: []
	}

	adminDashboard = AdminDashboard;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'capability Category', type: 'text' },
	]

  	constructor(
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService
	) { }

  	ngOnInit() {
		this.createForm();		
		this.adminService.getApi('services', {status: true})
		.then(res => {
			if (res.result.success) {
				this.dropdowns.serviceList = res.result.data.items;
			}
		});
		this.adminService.getApi('capabilities', {status: true})
		.then(res => {
			if (res.result.success) {
				this.dropdowns.capabilityList = res.result.data.items;
			}
		});
		this.getCapabilityCategory();
  	}

	// getter
	get f() { return this.capabilityCategoryForm.controls; }

  	export = () => {
		let url = APP.api_url + 'exportCapabilityCtg?' + buildParam(this.param) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		window.location.href = url;
	}

	getCapabilityCategory = (flag?) => {
		if (!flag) this.isLoading = true;
		this.adminService
			.getApi('capabilityCategory', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					this.totalCount = res.result.data.total;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination')
						this.capabilityCategoryList = [...this.capabilityCategoryList, ...res.result.data.items];
					else {
						this.capabilityCategoryList = res.result.data.items;
						if (this.capabilityCategoryList.length) this.onSelectItem(this.capabilityCategoryList[0]);
						else this.selectedcapabilityCategory = {};
					}
				}
			})
			.catch(err => {
				this.isLoading = false;
			})
	}

	createForm = () => {
		this.capabilityCategoryForm = this.fb.group({
			id: '',
			name: ['', Validators.required],
			status: true,
			description: '',
			capabilities: [],
			services_ids: []
		})
	}

	setForm = data => {
		this.capabilityCategoryForm.patchValue({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			capabilities: data.capabilities || [],
			services_ids: data.services_ids || []
		});
	}

  	openAddDialog = (data?) => {
		this.dialog
			.open(CreateCapabilityCategoryComponent, {
				panelClass: 'recon-dialog',
				width: '500px',
				data: { title: 'Add New Capability Category', dropdowns: this.dropdowns, name: data ? data : '' }
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Capability Category Added Successfully' });
					this.param.page = 1;
					this.getCapabilityCategory();
				}
			})
	}
	
	changeMasterView = () => {
		this.showView = !this.showView;
	}

	onSelectItem = item => {
		this.fetchingDetails = true;
		this.duplicateError = '';
		// this.selectedcapabilityCategory = item;
		this.adminService.getApi('capabilityCatgDetails',{ id:item.id })
		.then(res => {
			this.fetchingDetails = false;
			if(res.result.success){
				this.selectedcapabilityCategory = res.result.data[0];
				this.setForm(this.selectedcapabilityCategory);
				this.capabilityCategoryForm.markAsPristine();
			}
		})
	}
	
	onSearch = val => {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getCapabilityCategory();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getCapabilityCategory();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getCapabilityCategory();
			}
		}
	}

	saveDetails = form => {
		if(!this.promise){
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			this.promise = this.adminService.saveApi('saveCapabilityCatg', form.value)
				.then(res => {
					this.promise = undefined;
					if (res.result.success) {
						this.openSnackBar({ status: 'success', msg: 'Capability Category Saved Successfully' });
						let indx = _.findIndex(this.capabilityCategoryList, { id: form.value.id });
						if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
							this.capabilityCategoryList[indx] = { ...res.result.data };
							this.selectedcapabilityCategory = { ...res.result.data };
							this.capabilityCategoryForm.markAsPristine();
						} else {
							this.capabilityCategoryList.splice(indx, 1);
							this.totalCount--;
							if(this.capabilityCategoryList.length) this.onSelectItem(this.capabilityCategoryList[0]);
						}

					} else {
						this.duplicateError = res.result.data;
					}
				})
				.catch(err=>{
					this.promise = undefined;
				})
		}
	}
	}

	resetForm = data => {
		this.capabilityCategoryForm.reset({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description,
			capabilities: data.capabilities || [],
			services_ids: data.services_ids || []
		});
		this.capabilityCategoryForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	onScroll = () => {
		if (this.param.page < this.totalPages && this.totalPages != 0) {
			this.param.page++;
			this.getCapabilityCategory('pagination')
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
