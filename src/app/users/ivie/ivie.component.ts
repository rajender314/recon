import { Component, OnInit, ɵConsole } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ContactsService } from '@app/contacts/contacts.service';
import * as _ from 'lodash';
import { UsersService } from '@app/users/users.service';

import { forkJoin, of, throwError } from 'rxjs';

import { MatSnackBar, MatDialog } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { AddNewUserComponent } from '@app/users/add-new-user/add-new-user.component';
import { FileUploader } from 'ng2-file-upload';
import { UploaderComponent } from '@app/shared/components/uploader/uploader.component';
import { StatusFilter } from '@app/shared/utility/dummyJson';
import { AdminService } from '@app/admin/admin.service';
import { RowComp } from 'ag-grid-community';
var APP: any = window['APP'];
@Component({
	selector: 'app-ivie',
	templateUrl: './ivie.component.html',
	styleUrls: ['../users.component.scss', './ivie.component.scss']
})
export class IvieComponent implements OnInit {
	public duplicateError = false;
	public duplicateErrorMsg = '';
	public ivieForm: FormGroup;
	public emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

	public submitted: boolean = false;
	public dialogRef: any;
	public cloneEnabled = true;

	public phoneNumberPattern = /^[0-9]{10}$/;

	public phoneNumberConfig: any = {
		prefix: '',
		limit: 10,
		centsLimit: 0,
		isCancel: false,
		centsSeparator: false,
		thousandsSeparator: false
	}

	public currencyConfig: any = {
		prefix: '$',
		limit: 3,
	}

	public mailListArray: FormArray;
	public numberListArray: FormArray;
	public billingListArray: FormArray
	public deletedEmailArray = [];
	public deletedPhoneNumberArray = [];
	public selectedIndex = [];
	private savedBillingData: any;
	private SavedRateData: any;

	public emailAddressTypes = [
		{ id: "Email", name: "Email" },
		{ id: "Work", name: "Work Email" }
	];
	public phoneNumberTypes = [
		{ id: "Phone", name: "Phone" },
		{ id: "Fax", name: "Fax" },
		{ id: "Mobile", name: "Mobile" }
	];





	private imageUploadUrl = APP.api_url + 'uploadAttachments?container=images';
	private hasDropZoneOver: boolean = false;
	private uploader: FileUploader = new FileUploader({
		url: this.imageUploadUrl,
		allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});
	uploadError = false;
	sizeError: boolean;
	uploads = [];


	deleteItem(index: number): void {
		this.sizeError = false;

		this.uploads.splice(index, 1);
	}

	fileOverBase(event): void {
		this.hasDropZoneOver = event;
	}

	fileDrop(event): void {
	}

	fileSelected(event): void {
	}

	dropdowns = {
		jobAccess: [
			{ label: 'Project Access', key: 'name' },
			{ label: 'Project Specific to User', key: 'job_specific_user' },
			{ label: 'Project Specific to Others', key: 'job_specific_others' },
		],
		headers: [
			{ label: 'Access', key: 'name' },
			{ label: 'Permission', key: 'options' }
		]
	};

	public state = {
		loader: true,
		detailsLoader: true,
		showDetail: false,
		leftNavList: [],
		totalleftNavList: [],
		perPage: 25,
		leftNavCount: 0,
		statusFilter: StatusFilter,
		selectedFilter: { label: "Active", value: "true" },
		tabs: [
			{ id: 0, label: "User Roles", displayLabel: "User Roles", show: (APP.permissions.system_access.user_roles == 'yes') ? true : false, route: "users/user_roles" },
			{ id: 1, label: "Ivie", displayLabel: "Ivie Users", show: (APP.permissions.system_access.ivie_users == 'yes') ? true : false, route: "users/ivie" },
			{ id: 2, label: "Clients", displayLabel: "Clients", show: (APP.permissions.system_access.client_users == 'yes') ? true : false, route: "users/clients" },
			{ id: 3, label: "Vendors", displayLabel: "Vendors", show: (APP.permissions.system_access.vendor_users == 'yes') ? true : false, route: "users/vendors" }
		],
		selectedTab: { id: 1, label: "Ivie", displayLabel: "Ivie Users", route: "users/ivie" },
		selectedItem: {
			logo: '',
			name: '',
			status: false
		},
		detailTabs: [
			{ label: "Contact Profile", type: 0 },
			{ label: "System Access", type: 1, method: 'system_access' },
			{ label: "Project Access", type: 2, method: 'job_access' },
			{ label: "Client Access", type: 3, method: 'client_access' },
			{ label: "Preferences", type: 4, method: 'preferences' },
			{ label: "External Apps", type: 5, method: 'external_apps' }
		],
		activeTab: { label: "Contact Profile", type: 0 },
		search: {
			placeHolder: "Search",
			value: ''
		},
		searchList: [],
		contact_profile: [],


		companies: [
			{ id: "1", name: "Ivie USA" },
			{ id: "2", name: "Ivie Asia" },
			{ id: "3", name: "Graphic Image" },
			{ id: "5", name: "Blueleaf Digital, LLC" },
			{ id: "7", name: "GreenLeaf" },
			{ id: "8", name: "Ivie Test" },
			{ id: "9", name: "RD&F" },
			{ id: "10", name: "CLM" },
			{ id: "11", name: "BuzzShift" }
		],
		contact_types: [],
		designations: [
			{ id: "5", name: "A/P Coordinator" },
			{ id: "282", name: "A/R Coordinator" },
			{ id: "795", name: "Account Development Director" },
			{ id: "794", name: "Account Development Manager" },
			{ id: "923", name: "Accounting chief executive" },
			{ id: "276", name: "Accounting Director" },
			{ id: "19", name: "Accounting Manager" },
			{ id: "713", name: "Advertising Coordinator" },
			{ id: "817", name: "Advertising Director" },
			{ id: "323", name: "Advertising Manager" },
			{ id: "707", name: "Advertising Specialist" }
		],
		departments: [
			{ id: "50", name: "Bentonville Creative/Production" },
			{ id: "59", name: "Boise Creative" },
			{ id: "14", name: "Business Development" },
			{ id: "60", name: "BuzzShift" },
			{ id: "35", name: "Call Center" },
			{ id: "18", name: "China Printing Solutions" },
			{ id: "5", name: "Client Services" },
			{ id: "20", name: "Communications" },
			{ id: "2", name: "Corporate Services" },
			{ id: "1", name: "Creative" }
		],
		users: [],
		user_roles: [],
		permissions: {},
		clientAccess: [],
		organizations: [],
		preferences: [],
		default_external_apps: {},
		companyCodeUserAccess: [],
		selectedCompanyCodeUserAccess: [],
		copySelectedCompanyCodeUserAccess: [],
		companyCodeUserEdit: false
	};

	constructor(
		private fb: FormBuilder,
		public usersService: UsersService,
		public contactsService: ContactsService,
		public adminService: AdminService,
		private snackbar: MatSnackBar,
		private dialog: MatDialog
	) {
		this.uploader
			.onBeforeUploadItem = (fileItem: any) => {
				fileItem.formData.push({ 'container': 'user_profile' });
			}
		this.uploader.onWhenAddingFileFailed = (item: any, filter: any, options: any) => {
			if (item.size >= options.maxFileSize) {
				this.sizeError = true
				this.uploadError = false;
			} else {
				this.uploadError = true;
				this.sizeError = false
			}


		};

		this.uploader
			.onAfterAddingFile = (item: any) => {
				//this.pointerEvent = true;

			}

		this.uploader
			.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
				let obj = JSON.parse(response);
				if (obj.result.success) {
					this.uploadError = false;
					this.sizeError = false;
					this.uploads = [];
					this.uploads.push(obj.result.data);
				}
			}
	}

	ngOnInit() {
		this.getDropDownMaster();
	}

	changeFilter(status: any): void {
		this.state.selectedFilter = status;
		this.getLeftNavData();
	}

	selectAllCompanyCodes(data: any, status: any): void {
		_.map(data, (value) => {
			if (!value['disabled']) {
				value['selected'] = status;
			}
			if (value.children && value.children.length) {
				this.selectAllCompanyCodes(value.children, status);
			}
		});
	}

	listChange(list: any, parent: any): void {
		if (list.selected) {
			parent.selected = true;
		} else {
			let childChk = _.filter(parent.children, (value) => {
				return value['selected'];
			});
			if (!childChk.length) {
				parent.selected = false;
			}
		}
	}

	getDropDownMaster = () => {
		forkJoin(
			this.contactsService.getDropdownMaster({ org_type: 0, status: true }),
			this.adminService.saveApi('getCompanyCodesList', { status: true }),
			this.adminService.getApi('getCompanyCodes', { status: true })
		)
			.subscribe(([response, response2, response3]) => {
				if (response2.result.success) {
					this.state.companies = response2.result.data || [];
				}
				if (response3.result.success) {
					this.state.companyCodeUserAccess = response3.result.data.items || [];
				}
				if (response.result.success) {
					this.state.departments = response.result.data.departments || [];
					this.state.designations = response.result.data.designations || [];
					this.state.users = response.result.data.users || [];
					this.state.contact_types = response.result.data.contact_types || [];
					this.usersService.userRolesDp({ flag: 'dropdown', status: true }).then(response => {
						if (response.result.success) {
							this.state.user_roles = response.result.data || [];
							this.getLeftNavData();
						}
					});
				}
			});
	}

	roleUsers(): void {
		this.usersService.roleUsers({
			id: this.state.selectedItem['id'],
			userrole_id: this.state.selectedItem['user_role'],
			org_type: 1
		}).then(response => {
			if (response.result.success) {
				this.setForm(response.result.data);
			}
		});
	}

	saveRoleUsers(form: FormGroup): void {
		this.submitted = true;
		let isValid = false;
		if ((<FormGroup>form.controls[this.state.activeTab['method']]).valid) {
			// if (form.valid) {
			let params = {};
			let method = this.state.activeTab['method'];
			if (method == 'external_apps') {
				let arr = [];
				params['user_id'] = this.state.selectedItem['id'];
				params['org_type'] = 1;
				let keys = Object.keys(form.value[method]);
				let formObj = {};
				keys.map((item) => {
					let key = item.split('_');
					if (!formObj[key[0]]) {
						formObj[key[0]] = {};
					}
					formObj[key[0]][key[1]] = form.value[method][item];
				});
				this.usersService.saveExternalApps({ ...params, ...formObj }).then(response => {
					if (response.result.success) {
						this.snackbar.openFromComponent(SnackbarComponent, {
							data: { status: 'success', msg: 'Permissions Updated Successfully' },
							verticalPosition: 'top',
							horizontalPosition: 'right'
						});
						this.submitted = false;
						this.getPermissions(method);
						//this.setForm({external_apps: this.state.default_external_apps});
					}
				});
			} else {
				params['id'] = this.state.selectedItem['id'];
				params['userrole_id'] = this.state.selectedItem['user_role'];
				params['org_type'] = 1;
				let formValue=  form.getRawValue();
				params[method] = formValue[method]
				this.usersService.saveRoleUsers(params).then(response => {
					this.ivieForm.markAsPristine();
					if (response.result.success) {
						this.snackbar.openFromComponent(SnackbarComponent, {
							data: { status: 'success', msg: 'Permissions Updated Successfully' },
							verticalPosition: 'top',
							horizontalPosition: 'right'
						});
						this.submitted = false;
						this.roleUsers();
					}
				});
			}
		}
	}




	getSelectionData(list, value): any {
		return _.find(this.state[list], function (item) { return String(item.id) == String(value) });
	}

	setActiveTab(tab): void {
		this.state.detailsLoader = true;
		this.state.activeTab = tab;
		setTimeout(() => {
			if (tab.type == 0) {
				this.createForm();
			} else if (tab.type == 1 || tab.type == 2 || tab.type == 5) {
				this.getPermissions(tab.method);
			} else if (tab.type == 3) {
				this.getClientAccess();
			} else if (tab.type == 4) {
				this.getPreferences();
			} else {
				this.state.detailsLoader = false;
			}
		}, 500);
		this.ivieForm.markAsPristine();
	}

	uploadLogo(): void {
		this.dialogRef = this.dialog.open(UploaderComponent, {
			panelClass: 'my-dialog',
			width: '500px',
			data: {
				title: "Upload Logo",
				id: this.state.selectedItem['id'],
				image: this.state.selectedItem['logo'],
				saveUrl: 'uploadLogo',
				removeUrl: 'removeLogo',
				isUser: true,
				uploadUrl: this.imageUploadUrl
			}
		});
		this.dialogRef.afterClosed().subscribe(result => {
			if (result && result.success) {
				this.state.selectedItem['logo'] = result.data.filename;
			} else if (result && result.remove) {
				this.state.selectedItem['logo'] = '';
			}
		});
	}

	onSearch(event: any): void {
		this.state.search.value = event;
		this.getUsersList();
		/*if(event!=''){
		  _.filter(this.state.totalleftNavList, function(o){
			if(o.name.toLowerCase().indexOf(event.toLowerCase())==-1){
			  o.search = true;
			}else{
			  o.search = false;
			}
		  });
		}else{
		  _.filter(this.state.totalleftNavList, function(o){
			o.search = false;
		  });
		}
		this.state.searchList = _.filter(this.state.totalleftNavList, {search: false});
		this.state.leftNavList = [];
		this.appendUsers();
		if(this.state.searchList.length){
			this.getSelectedUser(this.state.searchList[0]);
		}else{
			this.getSelectedUser({});
		}*/
	}

	getSelectedTab(tab): void {
		this.state.selectedTab = tab;
		this.getLeftNavData();
	}

	getLeftNavData(): void {
		this.getUsersList();
	}

	hideDetails(): void {
		this.state.showDetail = false;
	}

	showDetails(): void {
		this.state.showDetail = true;
	}

	assignSelectedCompanyCodes(data, selectedIds, parent?: any): void {
		_.map(data, (value) => {
			if (selectedIds.indexOf(value.id) > -1) {
				if (value.status) value.selected = true;
				if (parent) {
					parent.selected = true;
				}
			} else {
				value.selected = false;
			}
			if (value.children && value.children.length) {
				this.assignSelectedCompanyCodes(value.children, selectedIds, value);
			}
		});
	}

	getSelectedUser(item: any): void {
		this.state.detailsLoader = true;
		this.state.selectedItem = item;
		this.cloneEnabled = true;
		if (item) {
			forkJoin(
				this.usersService.getUserData({ id: item['id'], org_type: 1 }),
				this.adminService.getApi('getUserCompanyCodeAccess', { id: item['id'] })
			)
				.subscribe(([response, response2]) => {
					if (response.result.success) {
						this.state.selectedCompanyCodeUserAccess = response2.result.data;
						this.state.copySelectedCompanyCodeUserAccess = _.cloneDeep(response2.result.data);
						this.assignSelectedCompanyCodes(this.state.companyCodeUserAccess, this.state.copySelectedCompanyCodeUserAccess);
					}
					if (response.result.success) {
						this.state.contact_profile = response.result.data;
						if (this.state.activeTab.type == 0) {
							this.createForm();
							//this.state.companyCodeUserAccess
						} else if (this.state.activeTab.type == 1 || this.state.activeTab.type == 2 || this.state.activeTab.type == 5) {
							this.getPermissions(this.state.activeTab['method']);
						} else if (this.state.activeTab.type == 3) {
							this.getClientAccess();
						} else if (this.state.activeTab.type == 4) {
							this.getPreferences();
						} else {
							this.state.detailsLoader = false;
						}
					}
				});
		} else {
			this.state.activeTab = { label: "Contact Profile", type: 0 };
			this.state.detailsLoader = false;
		}
	}

	appendUsers(): void {
		let data = this.state.totalleftNavList.slice(this.state.leftNavList.length, this.state.leftNavList.length + this.state.perPage);
		this.state.leftNavList = this.state.leftNavList.concat(data);
	}

	onScroll(): void {
		if (this.state.leftNavList.length < this.state.leftNavCount && this.state.leftNavCount != 0) {
			this.appendUsers();
		}
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
		this.ivieForm.patchValue({
			id: this.state.selectedItem['id'],
			job_access: data.job_access || this.setDefaultValues('job_access'),
			system_access: data.system_access || this.setDefaultValues('system_access'),
			external_apps: data.external_apps || this.setDefaultValues('system_access')
		});
	}

	formatClientAccess(data: any[], stage: any, parent?: any): void {
		_.map(data, (value) => {
			let level = stage;
			value['level'] = level;
			if (value.children && value.children.length) {
				level = level + 1;
				if (parent) {
					if (parent['groups'] && parent['groups'].length) {
						value['groups'] = parent['groups'];
						value['groups'].push(value.name);
						_.map(parent['groups'], (org, i) => {
							if (i == 0) {
								value['org_name'] = org;
							} else {
								value['sub_org' + i] = org;
							}
						});
					} else {
						value['org_name'] = parent.name;
						value['groups'] = [parent.name, value.name];
					}
				} else {
					value['org_name'] = value.name;
					value['groups'] = [value.name];
				}
				this.state.organizations.push(value);
				this.formatClientAccess(value.children, level, value);
			} else {
				if (parent) {
					if (parent['groups'] && parent['groups'].length) {
						value['groups'] = parent['groups'];
						value['groups'].push(value.name);
						_.map(parent['groups'], (org, i) => {
							if (i == 0) {
								value['org_name'] = org;
							} else {
								value['sub_org' + i] = org;
							}
						});
					} else {
						value['org_name'] = parent.name;
						value['groups'] = [parent.name, value.name];
					}
				} else {
					value['org_name'] = value.name;
					value['groups'] = [value.name];
				}
				this.state.organizations.push(value);
			}

		});
	}

	getPreferences(): void {
		this.usersService.getUserPreferences({ id: this.state.selectedItem['id'] })
			.then(res => {
				if (res.result.success) {
					this.state.preferences = res.result.data;
					this.state.detailsLoader = false;
				}
			});
	}

	getClientAccess = () => {
		if (Object.keys(this.state.clientAccess).length) {
			if (this.state.clientAccess && Object.keys(this.state.clientAccess).length) {
				this.state.detailsLoader = false;
				return;
			}
		}
		this.state.detailsLoader = true;
		this.contactsService.getOrganizations({
			org_type: 2,
			status: true
		})
			.then(res => {
				if (res.result.success) {
					//this.formatClientAccess(res.result.data, 0);
					this.state.clientAccess = res.result.data;
					this.state.detailsLoader = false;
				}
			})
	}

	filterExternalApps(data: any): void {
		data.map((item) => {
			if (item.length == 2) {
				item['options'] = [
					{ label: "Yes", value: "yes" },
					{ label: "No", value: "no" }
				];
			} else if (item.length == 3) {
				item['options'] = [
					{ label: "None", value: "none" },
					{ label: "View", value: "view" },
					{ label: "Edit", value: "edit" }
				];
			}
			item['key'] = item.name.split(" ").join('_').toLowerCase();
			if (item.children && item.children.length) {
				this.filterExternalApps(item.children);
			}
		});
	}

	setExternalApps(data): void {
		data.map((item) => {
			if (item.length == 2) {
				this.state.default_external_apps[item.name.split(" ").join('_').toLowerCase()] = 'no';
			} else if (item.length == 3) {
				this.state.default_external_apps[item.name.split(" ").join('_').toLowerCase()] = 'none'
			}
			if (item.children && item.children.length) {
				this.setExternalApps(item.children);
			}
		});
	}

	getPermissions = method => {
		if (method == 'external_apps') {
			this.state.detailsLoader = true;
			this.usersService.getExternalApps({ id: this.state.selectedItem['id'], org_type: 1 })
				.then(res => {
					if (res.result.success) {
						this.state.permissions[method] = res.result.data;
						//this.filterExternalApps(this.state.permissions[method]);
						this.createForm();
						this.state.detailsLoader = false;
						//this.setExternalApps(this.state.permissions[method]);
						//this.setForm({external_apps: this.state.default_external_apps});
					}
				});
		} else {
			if (Object.keys(this.state.permissions).length) {
				if (this.state.permissions[method] && Object.keys(this.state.permissions[method]).length) {
					this.createForm();
					this.state.detailsLoader = false;
					this.roleUsers();
					return;
				}
			}
			this.state.detailsLoader = true;
			this.usersService.getPermissions({ method: method, org_type: 1 })
				.then(res => {
					if (res.result.success) {
						this.state.permissions[method] = res.result.data.items;
						this.createForm();
						this.state.detailsLoader = false;
						this.roleUsers();
					}
				});
		}
	}

	createExternalChildControls = items => {
		let controls = {};
		items.map(item => {
			controls[item.key] = parseInt(item.access);
			if (item.radio_group && item.radio_group.length) {
				controls[item.key + '_option'] = parseInt(item.access);
			}
			if (item.children && item.children.length) {
				controls = { ...controls, ...this.createExternalChildControls(item.children) }
			}
		})

		return controls;
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

	createForm(): void {
		let method = this.state.activeTab['method'];
		if (!this.state.activeTab['method']) {
			let formGroup = {
				id: this.state.selectedItem['id']
			};
			let emailsList = [],
				phoneNumberList = [],
				billinglist = [];
			let fb = this.fb;
			this.state.contact_profile.map(function (group) {
				if (group.emails && group.emails.length) {
					group.emails.map(function (value) {
						value.invalid = false;
						emailsList.push(fb.group(value));
					});
				} else {
					emailsList.push(fb.group({
						email: "",
						type: "Email",
						invalid: false
					}));
				}
				if (group.phone_numbers && group.phone_numbers.length) {
					group.phone_numbers.map(function (value) {
						phoneNumberList.push(fb.group(value));
						value.invalid = false;
					});
				} else {
					phoneNumberList.push(fb.group({
						phone: "",
						type: "Phone",
						invalid: false
					}));
				}
				group.section.map(function (fields) {
					fields.list.map((field) => {
						if (field.addMore) {
							let selectGroup = [];
							field.selectors.map(function (select) {
								let selectObj = {};
								select.options.map(function (option) {
									selectObj[option.type] = option.value;
								});
								selectGroup.push(this.fb.group(selectObj));
							}.bind(this));
							formGroup[field.name] = this.fb.array(selectGroup);
						} else {
							if (field.required) {
								if (field.type == 'email') {
									formGroup[field.name] = [field.value, [Validators.required, Validators.pattern(this.emailPattern)]];
								} else {
									formGroup[field.name] = [field.value, Validators.required];
								}
							} else {
								formGroup[field.name] = field.value;
							}
						}
						if (field.name == 'company') {
							_.map(this.state.companyCodeUserAccess, (value) => {
								if (value.id == field.value) {
									value['disabled'] = true;
								}
								if (value.children && value.children.length) {
									_.map(value.children, (child) => {
										if (child.id == field.value) {
											child['disabled'] = true;
											child['selected'] = true;
										} else {
											child['disabled'] = false;
										}
									});
								}
							});
						}
					});
				}.bind(this));
			}.bind(this));

			formGroup['client_access'] = false;
			formGroup['org_type'] = 1;
			formGroup['emails'] = this.fb.array(emailsList);
			formGroup['phone_numbers'] = this.fb.array(phoneNumberList);



			this.ivieForm = this.fb.group(formGroup);

			// for(let key in this.ivieForm.value){
			//   if(Array.isArray(this.ivieForm.value[key])){
			//     this.state[key] = this.ivieForm.get(key) as FormArray;
			//   }
			// }
			this.numberListArray = this.ivieForm.get('phone_numbers') as FormArray;

			this.mailListArray = this.ivieForm.get('emails') as FormArray;
			this.state.detailsLoader = false;
		} else {
			let controls = {}, groupControl;
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
			} else if (method == 'external_apps') {
				this.state.permissions[method].map(item => {
					controls[item.key] = parseInt(item.access);
					if (item.children && item.children.length)
						controls = { ...controls, ...this.createExternalChildControls(item.children) };
				});
			} else {
				this.state.permissions[method][0].items.map(item => {
					controls[item.key] = '';
					if (item.children && item.children.length)
						controls = { ...controls, ...this.createChildControls(item.children) };
				});
			}
			this.ivieForm.addControl(method, this.fb.group(controls));
		}
	}



	addMail() {
		let formGroup: FormGroup = this.fb.group({
			type: "Email",
			email: ''
		});
		this.mailListArray.push(formGroup);
	}

	addNumber() {
		let formGroup: FormGroup = this.fb.group({
			type: "Phone",
			phone: ''
		});
		this.numberListArray.push(formGroup);

	}

	removeMail(index) {
		if (this.mailListArray.length > 1) {
			if (this.mailListArray.value[index].email_id) {
				this.deletedEmailArray.push(this.mailListArray.value[index].email_id);
			}
			this.mailListArray.removeAt(index);
		}
	}

	removeNumber(index) {
		if (this.numberListArray.length > 1) {
			if (this.numberListArray.value[index].phone_id) {
				this.deletedPhoneNumberArray.push(this.numberListArray.value[index].phone_id);
			}
			this.numberListArray.removeAt(index);
		}
	}

	emailValidation(event: any) {
		if (event.value.email == '' || this.emailPattern.test(event.value.email)) {
			event.value.invalid = false;
		} else {
			event.value.invalid = true;
		}
	}

	phoneNumberValidation(event: any, list: any) {
		let inputChar = String.fromCharCode(event.charCode);

		if (list.value.phone_number == '') {
			list.value.invalid = true;
		} else {
			list.value.invalid = false;
		}
		if (event.keyCode != 8 && !this.phoneNumberPattern.test(inputChar)) {
			event.preventDefault();
		}
	}
	phonenumber(event: any) {
		const pattern = /^[0-9-]*$/;
		let inputChar = String.fromCharCode(event.charCode);
		if (event.keyCode != 8 && !pattern.test(inputChar)) {
			event.preventDefault();
		}
	}

	changeClonePermissions(): void {
		this.cloneEnabled = false;
	}

	editSection(section): void {
		section.edit = true;

	}

	editCompanyCodeUsers(): void {
		this.state.companyCodeUserEdit = true;
	}

	cancelCompanyCodeUsers(): void {
		this.state.companyCodeUserEdit = false;
		this.submitted = false;
		this.assignSelectedCompanyCodes(this.state.companyCodeUserAccess, this.state.copySelectedCompanyCodeUserAccess);
	}

	saveCompanyCodeUsers(): void {
		let company_codes = [];
		_.map(this.state.companyCodeUserAccess, (value) => {
			// if(value.selected){
			//   company_codes.push(value.id);
			// }
			if (value.children && value.children.length) {
				_.map(value.children, (value) => {
					if (value.selected) {
						company_codes.push(value.id);
					}
				});
			}
		});
		this.adminService.saveApi('saveUserCompanyCodeAccess', {
			id: this.state.selectedItem['id'],
			company_codes: company_codes
		}).then(res => {
			this.state.companyCodeUserEdit = false;
			if (res.result.success) {
				this.snackbar.openFromComponent(SnackbarComponent, {
					data: { status: 'success', msg: 'Company Code Access Updated Successfully' },
					verticalPosition: 'top',
					horizontalPosition: 'right'
				});
				this.state.selectedCompanyCodeUserAccess = company_codes;
				this.state.copySelectedCompanyCodeUserAccess = _.cloneDeep(company_codes);
				this.assignSelectedCompanyCodes(this.state.companyCodeUserAccess, this.state.copySelectedCompanyCodeUserAccess);
			}
		});
	}

	cancelChanges(section): void {
		this.resetForm();
		section.edit = false;
		this.submitted = false;

	}


	resetForm(): void {
		if (this.state.activeTab.type == 0) {
			this.createForm();
		} else if (this.state.activeTab.type == 1 || this.state.activeTab.type == 2) {
			this.roleUsers();
		} else if (this.state.activeTab.type == 3) {
			this.getClientAccess();
		} else if (this.state.activeTab.type == 4) {
			this.getPreferences();
		} else if (this.state.activeTab.type == 5) {
			//this.setForm({external_apps: this.state.default_external_apps});
			this.getPermissions(this.state.activeTab['method']);
		} else {
			this.state.detailsLoader = false;
		}
		this.ivieForm.markAsPristine();
	}

	removeDuplicateError(): void {
		this.duplicateError = false;
		this.duplicateErrorMsg = '';
	}

	save(form, section): void {
		this.submitted = true;
		if (form.valid) {
			this.usersService.saveUser(form.value)
				.then(response => {
					if (response.result.success) {
						this.snackbar.openFromComponent(SnackbarComponent, {
							data: { status: 'success', msg: 'User Details Updated Successfully' },
							verticalPosition: 'top',
							horizontalPosition: 'right'
						});
						section.edit = false;
						this.submitted = false;
						this.state.contact_profile = response.result.data;
						// this.createForm();
						this.state.detailsLoader = false;
						this.state.selectedItem['name'] = form.value.first_name + " " + form.value.last_name;
						this.state.selectedItem['user_role'] = form.value.user_role;

						let selectedDepartment = this.getSelectionData('departments', form.value.department);
						this.state.selectedItem['dept'] = selectedDepartment ? selectedDepartment.name : '';
						let selectedDesignation = this.getSelectionData('designations', form.value.designation);
						this.state.selectedItem['designation'] = selectedDesignation ? selectedDesignation.name : '';
						this.state.selectedItem['email'] = form.value.primary_email;
					} else {
						this.duplicateError = true;
						this.duplicateErrorMsg = response.result.data;
					}
				});
		}

	}



	saveData(editableValue, index, value): void {
		this.savedBillingData = value;
		this.snackbar.openFromComponent(SnackbarComponent, {
			data: { status: 'success', msg: 'Updated Successfully' },
			verticalPosition: 'top',
			horizontalPosition: 'right'
		});
		this.ivieForm.controls.billing_types['controls'][index].patchValue({
			is_editable: !editableValue
		});

	}

	backToView(index, editableValue, value, control) {
		if (value != this.savedBillingData) {
			control.patchValue({
				value: this.savedBillingData
			});
		}
		this.ivieForm.controls.billing_types['controls'][index].patchValue({
			is_editable: !editableValue
		});
	}






	addUser(): void {
		this.dialogRef = this.dialog.open(AddNewUserComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: {
				title: "Add User",
				departments: this.state.departments,
				designations: this.state.designations,
				contact_types: this.state.contact_types,
				user_roles: this.state.user_roles,
				org_type: this.state.selectedTab.id,
				users: this.state.users,
				emailAddressTypes: this.emailAddressTypes,
				phoneNumberTypes: this.phoneNumberTypes
			}
		});
		this.dialogRef.afterClosed().subscribe(result => {
			if (result && result.success) {
				this.getSelectedUser(result.data);
			} else if (result && result.reload) {
				this.getUsersList();
			}
		});
	}

	getUsersList(): void {
		this.state.loader = true;
		this.state.detailsLoader = true;
		this.usersService.getUsers({
			org_type: this.state.selectedTab.id,
			search: this.state.search.value,
			status: this.state.selectedFilter.value
		}).then(response => {
			if (response.result.success) {
				this.state.totalleftNavList = response.result.data;
				this.state.leftNavCount = this.state.totalleftNavList.length;
				this.state.leftNavList = this.state.totalleftNavList.slice(0, this.state.perPage);
				if (this.state.totalleftNavList.length) {
					this.getSelectedUser(this.state.totalleftNavList[0]);
				} else {
					this.getSelectedUser({});
					this.state.detailsLoader = false;
				}
				this.state.loader = false;

			}
		});
	}

	changeOrgStatus(): void {
		this.state.selectedItem['status'] = !this.state.selectedItem['status'];
		this.usersService.saveUserStatus({
			user_id: this.state.selectedItem['id'],
			org_type: 1,
			name: this.state.selectedItem['name'],
			status: String(this.state.selectedItem['status'])
		}).then(response => {
			if (response.result.success) {
				this.snackbar.openFromComponent(SnackbarComponent, {
					data: { status: 'success', msg: 'User Details Updated Successfully' },
					verticalPosition: 'top',
					horizontalPosition: 'right'
				});
				let indx = _.findIndex(this.state.leftNavList, { id: this.state.selectedItem['id'] });
				if (this.state.selectedFilter.label == 'All' ||
					(this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Active') ||
					(!this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Inactive')) {
					// do nothing
				} else {
					this.state.leftNavList.splice(indx, 1);
					this.getSelectedUser(this.state.leftNavList[0]);
					this.state.leftNavCount--;
				}
			}
		});
	}


}
