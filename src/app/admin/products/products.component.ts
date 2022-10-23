import { Component, OnInit } from '@angular/core';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { SortFilter, StatusFilter, Statuses, MAX_ALIASES, StatusList, buildParam } from '@app/shared/utility/dummyJson';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { AddAdminDialogComponent } from '@app/admin/dialogs/add-admin-dialog/add-admin-dialog.component';
import { AdminDashboard, AddDialogLocalType, FormFieldType } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
	selector: 'app-products',
	templateUrl: './products.component.html',
	styleUrls: ['../admin.component.scss', './products.component.scss']
})
export class ProductsComponent implements OnInit {
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
	productsList: Array<any>;
	totalCount: number = 0;
	totalPages: number = 0;
	selectedProduct: any;
	fetchingDetails: boolean = false;
	promise: any;

	productsForm: FormGroup;
	dropdowns = {
		sortfilter: SortFilter,
		statusFilter: StatusFilter,
		statusList: StatusList,
		status: Statuses
	}
	
	adminDashboard = AdminDashboard;
	maxAliases = MAX_ALIASES;

	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Products', type: 'text' },
	]

	addFormFields: Array<FormFieldType> = [
		{ key: 'name', label: 'Product Name', type: 'text', validations: { required: true }, default: '' },
		{ key: 'status', label: 'Status', type: 'select', multi: false, options: 'statusList', default: true },
		{ key: 'description', label: 'Description', type: 'textarea', default: '' }
	];

	deletedIds: Array<number> = [];
	aliasValidation: any = {};

	constructor(
		private router: Router,
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private adminService: AdminService
	) { }

	ngOnInit() {
		this.createForm();
		this.getProducts();
	}

	// getter
	get f() { return this.productsForm.controls; }

	get aliases() { return this.productsForm.get('alias') as FormArray }

	export = () => {
		let url = APP.api_url + 'exportProducts?' + buildParam(this.param) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
		window.location.href = url;
	}

	getProducts = (flag?) => {
		if (!flag) this.isLoading = true;
		this.adminService
			.getApi('products', this.param)
			.then(res => {
				this.isLoading = false;
				if (res.result.success) {
					// this.totalCount = res.result.data.total;
					this.totalCount = res.result.data.items.length;
					if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
					if (flag == 'pagination') {
						this.productsList = [...this.productsList, ...res.result.data.items];
					} else {
						this.productsList = res.result.data.items;
						if (this.productsList.length) this.onSelectItem(this.productsList[0]);
						else this.selectedProduct = {};
					}
				}
			})
	}

	createForm = () => {
		this.productsForm = this.fb.group({
			id: '',
			name: ['', Validators.required],
			status: null,
			description: '',
			alias: this.fb.array([])
		})
	}

	setForm = data => {
		this.productsForm.patchValue({
			id: data.id,
			name: data.name,
			status: data.status,
			description: data.description
		});
		this.buildAliases(data.alias || []);
	}

	openAddDialog = (data?) => {
		let locals: AddDialogLocalType = {
			title: 'Add New Product',
			label: 'Product',
			apiCall: 'saveProduct',
			dropdowns: this.dropdowns,
			name: data ? data : '',
			flag: 'products',
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
					this.openSnackBar({ status: 'success', msg: 'Product Added Successfully' });
					this.param.page = 1;
					this.getProducts();
				}
			})
	}

	changeMasterView = () => {
		this.showView = !this.showView;
	}

	onSelectItem = item => {
		this.clearAlias();
		this.duplicateError = '';
		this.selectedProduct = item;
		this.fetchingDetails = true;
		this.adminService
			.getApi('products', {id: this.selectedProduct.id})
			.then(res => {
				this.fetchingDetails = false;
                if (res.result.success) {
                    this.selectedProduct = res.result.data.items[0];
                    
                    this.setForm(this.selectedProduct);
                    this.productsForm.markAsPristine();
                }			
			})
	
	}

	onSearch = val => {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getProducts();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getProducts();
		} else {
			if (obj.label != this.statusBy) {
				this.param[prop] = obj.value;
				if (obj.label == 'All') this.statusBy = '';
				else this.statusBy = obj.label;
				this.getProducts();
			}
		}
	}

	saveDetails = form => {	
		if(!this.promise){
		this.submitted = true;
		this.duplicateError = '';
		if (form.valid) {
			this.submitted = false;
			let arr = [], indxs = [];
			form.value.alias.map((alias, indx) => {
				if (alias.name && alias.name.length) {
					arr.push(alias);
				} else {
					indxs.push(indx);
				}
			});
			form.value.alias = arr;
			if (this.deletedIds.length && form.value.alias.length)
				form.value.deleted_ids = this.deletedIds;
			this.promise = this.adminService.saveApi('saveProduct', form.value)
				.then(res => {
					this.promise = undefined;
					if (res.result.success) {
						if (res.result.data.status) {
							this.openSnackBar({ status: 'success', msg: 'Product Updated Successfully' });
							let indx = _.findIndex(this.productsList, { id: form.value.id });
							if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
								this.productsList[indx] = { ...res.result.data.items };
								this.selectedProduct = { ...res.result.data.items };
								this.productsForm.markAsPristine();
								this.clearAlias();
								this.buildAliases(this.selectedProduct.alias || []);
							} else {
								this.productsList.splice(indx, 1);
								this.totalCount--;
								if(this.productsList.length) this.onSelectItem(this.productsList[0]);
							}
						} else {
							this.aliasValidation = {};
							this.aliasValidation[res.result.data.items.id] = res.result.data.items.error_msg;
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
		this.productsForm.reset({
			id: data.id,
			name: data.name,
			status: String(data.status),
			description: data.description
		})
		this.clearAlias();
		this.buildAliases(data.alias || []);
		this.productsForm.markAsPristine();
		this.submitted = false;
		this.duplicateError = '';
	}

	onScroll = () => {
		if (this.param.page < this.totalPages && this.totalPages != 0) {
			this.param.page++;
			this.getProducts('pagination')
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

	createAlias = (data?) => {
		return this.fb.group({
			id: data.id || '',
			name: [data ? data.name : ''],
			status: [data ? data.status : true]
		})
	}

	buildAliases = (alias) => {
		if (alias.length) {
			alias.map(alias => {
				this.aliases.push(this.createAlias(alias))
			})
		} else {
			this.aliases.push(this.createAlias(this.randomId()));
		}
	}

	clearAlias = () => {
		this.aliasValidation = {};
		while (this.aliases.length != 0) {
			this.aliases.removeAt(0)
		}
	}

	randomId = () => {
		let rand = Math.random().toString().substr(5);
		let obj = {
			id: 'new_' + rand,
			name: '',
			status: true
		}
		return obj;
	}

	addControl = () => {
		if (this.aliases.length < MAX_ALIASES) {
			this.productsForm.markAsDirty();
			this.aliases.push(this.createAlias(this.randomId()));
		}
	}

	removeControl = indx => {
		if (this.aliases.length > 1) {
			this.productsForm.markAsDirty();
			let id = this.aliases.controls[indx].get('id').value;
			if (typeof id == 'number') this.deletedIds.push(id);
			this.aliases.removeAt(indx);
		}
	}


}
