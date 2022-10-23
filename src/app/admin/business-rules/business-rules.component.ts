import { Component, OnInit } from '@angular/core';
import { AdminDashboard, FormFieldType, buildForm } from '@app/admin/admin.config';
import { Pagination, SnackBarType } from '@app/shared/utility/types';
import { AdminService } from '@app/admin/admin.service';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import * as _ from 'lodash';
import { ColDef, GridOptions } from 'ag-grid-community';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar } from '@angular/material';
var APP = window['APP'];
@Component({
	selector: 'app-business-rules',
	templateUrl: './business-rules.component.html',
	styleUrls: ['../admin.component.scss', './business-rules.component.scss']
})
export class BusinessRulesComponent implements OnInit {
	APP = APP;
	showView: boolean = false;
	isLoading: boolean = true;
	adminDashboard = AdminDashboard;
	sortBy: string = 'A-Z';
	param: Pagination = {
		page: 1,
		pageSize: 50,
		status: 'true',
		sort: 'asc',
		search: ''
	};
	totalCount = 0;
	duplicateError = '';
	public selectedItem = {
		id: 0
	};
	public leftNav = [];
	public detailsLoader = false;
	detailSearch = '';
	markups = [];
	breadcrumbs = [
		{ label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
		{ label: 'Business Rules', type: 'text' },
	];
	businessRuleForm: FormGroup;
	public tasks = [];
	public submitted = false;
	public formBuild = {};
	public gridApi: any;
	public selectedIds = [];

	public columnDefs: Array<ColDef> = [
		{
			headerName: 'Products/Services',
			field: 'name',
			resizable: false,
			pinned: 'left',
			width: 500,
			cellRenderer: "agGroupCellRenderer",
			cellRendererParams: {
				checkbox: true
			},
			headerCheckboxSelection: true
		}
	];

	public gridOptions: GridOptions = {
		columnDefs: this.columnDefs,
		animateRows: false,
		groupSelectsChildren: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		rowHeight: 40,
		rowData: this.markups,
		getNodeChildDetails: this.getNodeChildDetails,
		defaultColDef: {
			resizable: false
		},
		onGridReady: (params) => {
			this.gridApi = params.api;
			this.gridApi.sizeColumnsToFit();
			let ids = this.selectedIds;
			setTimeout(() => {
				this.gridApi.forEachNodeAfterFilter((node) => {
					if (node.data && node.data.form_id && ids.indexOf(node.data.form_id) > -1) {
						node.setSelected(true);
					}
				});
			}, 100);
		}
	};

	numberConfig: any = {
		prefix: '',
		limit: 20,
		centsLimit: 0,
		isCancel: false,
		centsSeparator: false,
		thousandsSeparator: false
	}

	numberConfigLimit: any = {
		prefix: '',
		limit: 3,
		centsLimit: 0,
		isCancel: false,
		centsSeparator: false,
		thousandsSeparator: false
	}

	public billingTypes = [];
	public formData = [];
	public departments = [];
	public clientsList = [];
	public job_status = [
		{ id: 1, name: "Open" },
		{ id: 2, name: "Active" },
		{ id: 4, name: "Estimate Approved" },
		{ id: 5, name: "Cancelled" },
		{ id: 6, name: "Cancelled & Reconciled" },
		{ id: 7, name: "Delivered" },
		{ id: 8, name: "Complete" },
		{ id: 10, name: "Final Invoice" }
	]

	separatorKeysCodes: number[] = [13];
	prepressForm: FormGroup;
	prepressData: Array<any> = [];

	constructor(
		private adminService: AdminService,
		private fb: FormBuilder,
		private _snackbar: MatSnackBar
	) { }

	ngOnInit() {
		this.getBusinessRules();
		this.createForm();
	}

	createForm(data?: any) {
		let formObj = {};
		if (data) {
			this.formData.map((value) => {
				if (value.required) {
					formObj[value.name] = [value.type == 'auto-suggest' ? [] : '', Validators.required];
				} else {
					formObj[value.name] = value.type == 'auto-suggest' ? [] : '';
				}
			});
		}
		this.businessRuleForm = this.fb.group(formObj);
		this.setForm(data);
	}

	createNewForm(data) {
		let controls = [];
		data.map(o => {
			controls.push(this.formBuilder(o));
		})
		this.prepressForm = this.fb.group({
			form: this.fb.array(controls)
		});
	}

	formBuilder(data?) {
		return this.fb.group({
			clients: data ? [data.clients, Validators.required] : '',
			emails: this.fb.array(data ? data.emails : [])
		})
	}

	removeChip(form: FormArray, i) {
		form.removeAt(i);
	}

	emailValidation(str) {
		return str.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
	}

	addChip(form: FormArray, event) {
		const input = event.input;
		const value = event.value;
		if ((value || '').trim()) {
			if (this.emailValidation(value.trim())) {
				if(form.value.indexOf(value.trim().toLowerCase()) == -1)
					form.push(new FormControl(value.trim()));
			} else {
				input.value = '';
			}
		}
		if (input) {
			input.value = '';
		}
	}

	removeControl(i) {
		this.prepressData.splice(i, 1);
		(<FormArray>this.prepressForm.controls.form).removeAt(i);
	}

	addControl() {
		if (this.prepressForm.valid) {
			this.prepressData.push({
				clients: '', emails: []
			});
			(<FormArray>this.prepressForm.controls.form).push(this.formBuilder({ clients: '', emails: [] }))
		}
	}

	setForm(data?: any) {
		let formObj = {};
		this.formData.map((value) => {
			if (value.required) {
				formObj[value.name] = data[value.name] ? data[value.name] : '';
			} else {
				formObj[value.name] = data[value.name] ? data[value.name] : '';
			}
		});
		this.businessRuleForm.patchValue(formObj);
	}

	resetForm() {
		if (this.selectedItem['id'] == 10) {
		} else {
			let formObj = {};
			this.formData.map((value) => {
				if (value.required) {
					formObj[value.name] = this.formBuild[value.name];
				} else {
					formObj[value.name] = this.formBuild[value.name];
				}
			});
			this.businessRuleForm.reset(formObj);
		}
	}

	saveBusinessRules() {
		this.submitted = true;
		let params: any = {
			rule_id: this.selectedItem['id']
		}, isValid = false;
		if (this.selectedItem['id'] == 10) {
			params = { ...params, ...{ selected: this.prepressForm.controls.form.value } };
			isValid = this.prepressForm.valid;
		} else {
			params = { ...params, ...this.businessRuleForm.value };
			isValid = this.businessRuleForm.valid;
		}
		if (isValid) {
			this.adminService
				.saveApi('saveBusinessRulesData', params)
				.then(response => {
					if (params.rule_id == 10) {
					} else {
						if (response.result.success) {
							this.formBuild = response.result.data;
							const selected = _.find(this.leftNav, ['id', this.selectedItem['id']])
							const name = selected ? selected.name : 'Business Rule'
							this.openSnackBar({status: 'success', msg: name + ' Updated Successfully'});
						}
					}
					this.submitted = false;
					this.detailsLoader = false;
				});
		}
	}

	changeMasterView() {
		this.showView = !this.showView;
	}

	onSelectItem(item) {
		this.duplicateError = '';
		this.selectedItem = item;
		this.getDetails();
	}

	getDetails() {
		this.detailsLoader = true;
		switch (this.selectedItem['id']) {
			case 1:
				this.detailsLoader = false;
				break;
			case 2:
				this.detailsLoader = false;
				break;
			case 3:
				this.formData = [
					{ name: "selected_tasks", type: "auto-suggest" }
				];
				this.getTasksList();
				break;
			case 4:
				this.formData = [
					{ name: "selected_tasks", type: "auto-suggest", required: true }
				];
				this.getTasksList();
				break;
			case 5:
				this.formData = [
					{ name: "job_status", type: "select" },
					{ name: "internal_survey_who", type: "auto-suggest" },
					{ name: "internal_survey_whom", type: "auto-suggest" },
					{ name: "survey_hours", type: "text", required: true },
					{ name: "initial_survey_hours", type: "text", required: true }
				];
				this.getDepartments();
				break;
			case 7:
				this.formData = [
					{ name: "selected_tasks", type: "auto-suggest" },
					{ name: "months", type: "text", required: true }
				];
				this.getTasksList();
				break;
			case 8:
				this.formData = [
					{ name: "clients", type: "auto-suggest", required: true },
					{ name: "access_count", type: "text", required: true }
				];
				this.getClients();
				break;

			case 11:
				this.formData = [
					{ name: "selected_tasks", type: "auto-suggest", required: true }
				];
				this.getTasksList();
				break;
			case 12:
				this.formData = [
					{ name: "billing_types", type: "auto-suggest", required: true }
				];
				this.getBillingTypes();
				break;
			case 13:
				this.formData = [
					{ name: "clients", type: "auto-suggest", required: true }
				];
				this.getClients();
				break;

			case 10:
				this.getClients();
			/*case 10:
			  this.getProductServices();
			  break;*/
		}
	}

	getProductServices() {
		this.detailsLoader = true;
		this.adminService.getApi('getBusinessRulesMarkups', {
			search: this.detailSearch
		}).then(response => {
			if (response.result.success) {
				this.markups = response.result.data;
				this.gridOptions.rowData = this.markups;
				this.getFormData();
			}
		});
	}

	resetMarkups(): void {
		let ids = this.selectedIds;
		this.gridApi.forEachNodeAfterFilter((node) => {
			if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
				node.setSelected(true);
			} else {
				node.setSelected(false);
			}
		});
	}

	saveMarkups(): void {
		this.detailsLoader = true;
		let selectedRows = this.gridApi.getSelectedRows();
		if (selectedRows && selectedRows.length) {
			let ids = [];
			let postParams = {
				rule_id: this.selectedItem['id']
			};
			_.map(selectedRows, (value) => {
				// if(!ids[value.product_id]){
				//   ids[value.product_id] = [];
				// }
				// ids[value.product_id].push(value.id);
				ids.push(value.form_id);
			});
			postParams['selected_services'] = ids;
			this.adminService
				.saveApi('saveBusinessRulesData',
					postParams
				).then(response => {
					if (response.result.success) {
						this.selectedIds = response.result.data.services;
						this.resetMarkups()
					}
					this.submitted = false;
					this.detailsLoader = false;
				});
		}
	}

	// getMarkups() {
	//   this.detailsLoader = true;
	//   this.adminService.getApi('getMarkupProductServices', {
	//     org_id: this.selectedItem['id'],
	//     company_code: 1,
	//     search: this.detailSearch
	//   }).then(response => {
	//     this.detailsLoader = false;
	//     if (response.result.success) {
	//       this.markups = response.result.data;
	//     }
	//   });
	// }

	getClients() {
		this.detailsLoader = true;
		this.adminService
			.getApi('getOrgList', {
				status: true,
				sort: 'asc',
				org_type: 2
			}).then(response => {
				if (response.result.success) {
					this.clientsList = response.result.data;
				}
				this.getFormData();
			});
	}

	getDepartments() {
		this.detailsLoader = true;
		this.adminService
			.getApi('getDepartments', {
				status: true,
				sort: 'asc',
				org_type: 1
			}).then(response => {
				if (response.result.success) {
					this.departments = response.result.data.departments;
				}
				this.getFormData();
			});
	}

	getBillingTypes() {
		this.detailsLoader = true;
		this.adminService
			.getApi('getBillingTypes', {
				status: true,
				job_list: true
			}).then(response => {
				if (response.result.success) {
					this.billingTypes = response.result.data;
				}
				this.getFormData();
			});
	}

	getFormData() {
		this.adminService
			.getApi('getBusinessRulesData', {
				rule_id: this.selectedItem['id']
			}).then(response => {
				this.detailsLoader = false;
				if (response.result.success) {
					/*if (this.selectedItem['id'] == 10) {
					  this.selectedIds = response.result.data.services;
					  //this.resetMarkups();
					} */
					if (this.selectedItem['id'] == 10) {
						this.prepressData = [
							{ clients: 11766, emails: ['shiva@gmail.com'] },
							{ clients: 12386, emails: ['kumar@gmail.com'] },
							{ clients: 48, emails: ['kudikala@gmail.com'] },
						]
						if(!this.prepressData.length) {
							this.prepressData.push({
								clients: '', emails: []
							})
						}
						this.createNewForm(this.prepressData);
					} else {
						this.formBuild = response.result.data;
						this.createForm(response.result.data);
					}

				}
			});
	}

	getTasksList() {
		this.detailsLoader = true;
		this.adminService
			.getApi('getTasksList', {
				status: true,
				job_list: true
			}).then(response => {
				if (response.result.success) {
					this.tasks = response.result.data;
				}
				this.getFormData();
			});
	}

	getBusinessRules() {
		this.isLoading = true;
		this.adminService
			.getApi('getBusinessRulesList', this.param).then(response => {
				this.isLoading = false;
				if (response.result.success) {
					this.leftNav = response.result.data;
					if(this.leftNav.length){
						this.onSelectItem(this.leftNav[0]);
						this.changeMasterView();
					}
					/*this.leftNav = _.filter(response.result.data, (value) => {
					  return value.id != 10;
					});*/
					this.totalCount = this.leftNav.length;
				}
			});
	}

	onSearch(val, flag?) {
		this.param.page = 1;
		if (val) this.param.search = val;
		else delete this.param.search;
		this.getBusinessRules();
	}

	onApplyFilter = (prop, obj?) => {
		this.param.page = 1;
		if (prop == 'sort') {
			this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
			this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
			this.getBusinessRules();
		}
	}

	searchProducts(search: string): void {
		this.detailSearch = search;
		this.getProductServices();
	}

	getNodeChildDetails(rowItem) {
		if (rowItem.children) {
			return {
				group: true,
				children: rowItem.children,
				expanded: true,
				key: rowItem.label
			};
		} else {
			return null;
		}
	};

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
