import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, FormArray, Validators } from '@angular/forms';
import { CommonService } from '@app/common/common.service';
import { buildForm, updateForm, clearFormArray } from '@app/admin/admin.config';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatSnackBar, MatChipInputEvent } from '@angular/material';
import { ChangeAddressComponent } from '@app/projects/change-address/change-address.component';


import * as _ from 'lodash';
import * as _moment from 'moment';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { SnackBarType } from '@app/shared/utility/types';

var APP: any = window['APP'];

@Component({
	selector: 'app-project-info',
	templateUrl: './project-info.component.html',
	styleUrls: ['./project-info.component.scss']
})
export class ProjectInfoComponent implements OnInit {
	APP = APP;
	projectInfo: FormGroup;
	promise: any;
	dropdowns: any = {};
	separatorKeysCodes: number[] = [186];
	isEdit = false;
	inactiveCompanyCodes: Array<any> = [];
	state: any = {
		fetchingAddress: false,
		loader: false,
		fetchingAttributes: false,
		noChange: false,
		projectID: '',
		projectDetails: {
			custom_attributes: [],
			address: {}
		},
		defaults: {
			id: '',
			job_prefix: '',
			org_name: '',
			org_xid: '',

			job_title: '',
			project_type: '',
			org_id: '',
			client_initiator: '',
			billing_type: 1,
			company_code: '',
			job_coordinators: [],
			add_billing_address: false,
			vendor_funded: false,
			distribution_type: '',
			create_related_jobs: false,
			job_in_client_portal: false,
			account_director: '',
			account_vp: '',
			campaign: '',
			org_tax: '',

			start_date: new Date(),
			delivery_due_date: null,
			event_date: null,
			final_due_date: null
		},
		is_alb_company: false,
		submitted: false,
		minDate: new Date(),
		has_poet_access: false,
		job_type_campaigns: 0,
		poet_url: '',
		formFields: [
			/* defaults */
			{ key: 'id', label: '', type: 'none', default: '' },
			{ key: 'job_prefix', label: '', type: 'none', default: '' },
			{ key: 'org_name', label: '', type: 'none', default: '' },
			{ key: 'org_xid', label: '', type: 'none', default: '' },

			{ key: 'job_title', label: 'Project Name', type: 'text', validations: { required: true }, default: '' },
			{ key: 'project_type', label: 'Project Type', type: 'select', multi: false, options: 'projectTypes', default: '' },
			{ key: 'org_id', label: 'Client Company', type: 'select', validations: { required: true }, multi: false, options: 'clientCompanies', default: '' },
			{ key: 'client_initiator', label: 'Client Initiator', type: 'select', multi: false, options: 'clientInitiators', default: '' },
			{ key: 'billing_type', label: 'Billing Type', type: 'select', multi: false, options: 'billingTypes', default: 1 },
			{ key: 'jobs_types_id', label: 'Project Type', type: 'select', multi: false, options: 'job_types', default: '' }, //validations: { required: true },
			{ key: 'campaign_id', label: 'Campaign', type: 'select', multi: false, options: 'campaigns', default: '' },
			{ key: 'company_code', label: 'Company Code', type: 'select', validations: { required: true }, multi: false, options: 'companyCodes', default: '' },
			{ key: 'job_coordinators', label: 'Job Coordinator(s)', type: 'select', validations: { required: true }, multi: true, options: 'users', default: [] },
			{ key: 'add_billing_address', label: 'Add Billing Address', type: 'checkbox', default: false },
			{ key: 'vendor_funded', label: 'Vendor Funded', type: 'checkbox', default: false },
			{ key: 'distribution_type', label: 'Distribution Type', type: 'select', multi: false, options: 'distributionTypes', default: '' },
			{ key: 'create_related_jobs', label: 'Create Related Jobs', type: 'checkbox', default: false },
			{ key: 'job_in_client_portal', label: 'Show Job in Client Portal', type: 'checkbox', default: false },
			{ key: 'account_director', label: 'Account Director', type: 'select', multi: false, options: 'users', default: '' },
			{ key: 'account_vp', label: 'Account VP', type: 'select', multi: false, options: 'users', default: '' },
			{ key: 'campaign', label: 'Campaign', type: 'text', default: '' },
			{ key: 'org_tax', label: 'Org Tax', type: 'none', default: '' }
		],
		dateFields: [
			{ key: 'start_date', label: 'Start Date', type: 'date', validations: { required: true }, default: new Date() },
			{ key: 'delivery_due_date', label: 'Delivery Due Date', type: 'date', validations: { required: true }, default: null },
			{ key: 'event_date', label: 'Event Date', type: 'date', default: null },
			{ key: 'final_due_date', label: 'Final Bill Due Date', type: 'date', default: null }
		],
		get: 'getJobInfo',
		save: 'saveJobInfo',
		dropdowns: ['projectTypes', 'distributionTypes', 'clientCompanies', 'billingTypes', 'companyCodes', 'users', 'clientInitiators', 'job_types', 'campaigns'], //jobCoordinators
		disableFields: ['client_initiator', 'job_coordinators', 'add_billing_address', 'vendor_funded', 'account_director', 'account_vp'],
		apiCalls: [
			{ key: 'distributionTypes', url: 'distributionTypes', method: 'get', responseKey: 'items', params: { status: true } },
			// { key: 'clientCompanies', url: 'getUserJobOrgs', method: 'get', responseKey: '', params: { status: true, id: APP.recon_user[0].id, sort: 'asc' } },
			{ key: 'companyCodes', url: 'getUserJobCompanyCode', method: 'get', responseKey: 'items', params: { status: true, id: APP.recon_user[0].id } },
			{ key: 'billingTypes', url: 'getBillingTypes', method: 'get', responseKey: '', params: {} },
			{ key: 'projectTypes', url: 'projectTypes', method: 'get', responseKey: '', params: {} }
		],

		addressForm: [
			{ key: 'id', label: '', type: 'none', default: '' },
			{ key: 'address1', label: '', type: 'text', validations: { required: true }, default: '' },
			{ key: 'city', label: '', type: 'text', validations: { required: true }, default: '' },
			{ key: 'state_id', label: '', type: 'select', multi: false, options: 'states', validations: { required: true }, default: '' },
			{ key: 'postal_code', label: '', type: 'text', validations: { required: true }, default: '' },
			{ key: 'country_id', label: '', type: 'select', multi: false, options: 'countries', validations: { required: true }, default: '' }
		],
		addressApiCalls: [
			{ key: 'countries', url: 'getCountries', method: 'get', responseKey: '', params: {} }
		]
	}

	editAddressForm: FormGroup;

	constructor(
		private activedRoute: ActivatedRoute,
		private router: Router,
		private dialog: MatDialog,
		private fb: FormBuilder,
		private commonService: CommonService,
		private snackbar: MatSnackBar
	) {
		activedRoute.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : '';
		});
		this.createForm();
		this.state.formFields[0].default = this.state.projectID;
		this.state.defaults.job_prefix = this.state.projectID;
		if (!this.state.projectID) this.disableFields(this.state.disableFields, true);
		else this.getProjectDetails(this.state.projectID);
	}

	get customAttributes() {
		return this.projectInfo.get('custom_attributes') as FormArray;
	}

	getClientCompanyName(id) {
		return _.find(this.dropdowns.clientCompanies, ['id', id]).name;
	}

	ngOnInit() {
		if (this.state.apiCalls) {
			this.createObject(this.state.dropdowns);
			this.getApiCalls(this.state.apiCalls);
		}
	}

	createForm() {
		const fields = [...this.state.formFields, ...this.state.dateFields];
		this.projectInfo = this.fb.group(buildForm(fields));

		this.projectInfo.controls.org_id.valueChanges.subscribe(val => {
			if (val) {
				const selected = _.find(this.dropdowns.clientCompanies, ['id', val]);
				if (selected && !this.state.noChange) {
					this.projectInfo.patchValue({
						org_name: selected.name,
						org_xid: selected.xid
					}, { emitEvent: false })
				}
				this.disableFields(this.state.disableFields, false);
				this.onChangeClientCompany(val)
				this.checkAlbCompany();
			} else {
				this.disableFields(this.state.disableFields, true)
			}
		})

		this.projectInfo.controls.company_code.valueChanges.subscribe(val => {
			if (val) {
				this.getClientCompanies(val);
				const selected = _.find(this.dropdowns.companyCodes, ['id', val]);
				if (selected && !this.state.noChange) {
					this.projectInfo.patchValue({
						distribution_type: selected.distribution_id,
						job_prefix: selected.job_prefix
					}, { emitEvent: false })
				}
			}
		})

		this.projectInfo.controls.create_related_jobs.valueChanges.subscribe(val => {
			if (val) {
				this.projectInfo.addControl('related_company_codes', new FormControl([]))
			} else {
				this.projectInfo.removeControl('related_company_codes');
			}
		});

		this.projectInfo.controls.delivery_due_date.valueChanges.subscribe(val => {
			if (val) {
				const selected = _.find(this.dropdowns.companyCodes, ['id', this.projectInfo.controls.company_code.value]);
				if (selected) {
					this.projectInfo.patchValue({
						final_due_date: _moment(val).add(selected.due_days, 'days')['_d']
					}, { emitEvent: false })
				}
			}
		})

		this.projectInfo.controls.job_coordinators.valueChanges.subscribe(val => {
			if (this.projectInfo.controls.job_coordinators.value.length > 3)
				this.projectInfo.controls.job_coordinators.setValue(this.projectInfo.controls.job_coordinators.value.splice(0, 3), { emitEvent: false });
		})

	}

	getClientCompanies(id) {
		this.commonService.getApi('getUserJobOrgs', { id: APP.recon_user[0].id, company_code: id })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.clientCompanies = res['result'].data || [];
				}
			});

		if (this.projectInfo.value.org_id) {
			this.commonService.getApi('getDropdownMaster', { org_type: 2, org_id: this.projectInfo.value.org_id, master_type: 5, company_code: id, status: true })
				.then(res => {
					if (res['result'].success) {
						this.dropdowns.users = res['result'].data.users;
					}
				});
		}
	}

	setForm(data) {
		this.state.dateFields.map(date => {
			if (data[date.key]) data[date.key] = new Date(data[date.key]);
		})
		const fields = [...this.state.formFields, ...this.state.dateFields];
		this.projectInfo.patchValue(updateForm(fields, data), { emitEvent: false });

		this.projectInfo.markAsPristine();
	}

	clientInitiatorChange(event) {
		if (String(event).indexOf('new*#*') == 0) {
			this.dropdowns.clientInitiators.map((user) => {
				if (user.id == event) {
					this.commonService.saveApi('saveClientIntiator', { org_id: this.projectInfo.value.org_id, first_name: user.fullname })
						.then(res => {
							if (res['result'].success) {
								user['id'] = res['result'].data;
								this.projectInfo.controls.client_initiator.setValue(res['result'].data);
							}
						});
				}
			});
		}
	}

	disableFields(arr, isDisable) {
		arr.map(key => {
			if (isDisable) this.projectInfo.controls[key].disable();
			else this.projectInfo.controls[key].enable();
		})
	}

	createObject(arr) {
		arr.map(key => {
			this.dropdowns[key] = [];
		})
	}

	getApiCalls(arr) {
		let apiCalls = [];
		arr.map(api => {
			if (api.method == 'get')
				apiCalls.push(this.commonService.getApi(api.url, api.params))
			else if (api.method == 'post')
				apiCalls.push(this.commonService.saveApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				this.inactiveCompanyCodes = [];
				data.map((o, i) => {
					if (arr[i].responseKey) {
						this.dropdowns[arr[i].key] = o['result'].data.items || [];
					} else {
						this.dropdowns[arr[i].key] = o['result'].data || [];
					}
					if (arr[i].key == 'companyCodes') {
						this.dropdowns[arr[i].key].map(o => {
							if (!o.job_prefix)
								this.inactiveCompanyCodes.push(o.id);
						})
						if (this.dropdowns[arr[i].key].length) {
							this.state.defaults.company_code = o['result'].data.default_company;
							this.projectInfo.patchValue({
								company_code: o['result'].data.default_company
							}, { emitEvent: false })
						}
					}
					if (arr[i].key == 'billingTypes') {
						this.dropdowns[arr[i].key].map(o => {
							o.inactive = !o.is_selected;
						})
					}
					/*if (Array.isArray(o.result.data)) {
						this.dropdowns[arr[i].key] = o.result.data;
					} else {
						this.dropdowns[arr[i].key] = o.result.data.items;
					}*/
				});
			})
	}

	onChangeClientCompany(id) {
		this.state.fetchingAddress = true;
		this.state.fetchingAttributes = true;

		this.commonService.saveApi('getJobTypesCampaigns', { org_id: id })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.job_types = res['result'].data.job_types || [];
					this.dropdowns.campaigns = res['result'].data.campaigns || [];
					this.state.has_poet_access = res['result'].data.has_poet_access;
					this.state.job_type_campaigns = res['result'].data.job_type_campaigns;
					this.state.poet_url = res['result'].data.poet_url;
					const validators = ['jobs_types_id']
					if (this.state.job_type_campaigns == 1) {
						this.projectInfo.controls.jobs_types_id.setValidators([Validators.required]);
					} else {
						this.projectInfo.controls.jobs_types_id.setValidators([]);
					}
				}
			})

		this.commonService.getApi('getOrgContacts', { search: '', org_type: 2, org_id: id })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.clientInitiators = res['result'].data || [];
				}
			})

		this.commonService.getApi('getDropdownMaster', { org_type: 2, org_id: id, master_type: 5, company_code: this.projectInfo.value.company_code, status: true })
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.users = res['result'].data.users;
				}
				if (!this.state.noChange) {
					this.commonService.getApi('getCompanyJobUsers', { org_id: id })
						.then(res => {
							if (res['result'].success) {
								this.projectInfo.patchValue(res['result'].data, { emitEvent: false });
							}
						});

					this.commonService.getApi('getOrgJobAddress', { org_type: 2, org_id: id })
						.then(res => {
							if (res['result'].success) {
								this.state.fetchingAddress = false;
								this.state.projectDetails.address = res['result'].data;
								this.projectInfo.patchValue({
									add_billing_address: true
								}, { emitEvent: false })
							}
						})
				}
				else {
					this.state.fetchingAddress = false;
				}

				this.commonService.getApi('custAttributes', { org_id: id })
					.then(res => {
						if (res['result'].success) {
							this.state.fetchingAttributes = false;
							this.state.projectDetails.custom_attributes = res['result'].data.items;
							_.map(this.state.projectDetails.custom_attributes, (item) => {
								if (item.key == 'dropdown') {
									item['selected'] = item.value.length ? item.value[0] : '';
									item['options'] = [];
									_.map(item.value, (option, index) => {
										item['options'].push({ id: option, name: option });
									});
									// item['value'] = '';
								}
							});
							if (res['result'].data.items.length) {
								this.customAttributeBuilder(res['result'].data.items, this.state.noChange);
							}
						}
					})
			});
	}

	customAttributeBuilder(data, isChange) {
		this.projectInfo.addControl('custom_attributes', this.fb.array([]));
		clearFormArray(this.customAttributes);
		data.map(item => {
			const saved = isChange && this.state.projectDetails.hasOwnProperty('savedCustomAttr') ?
				_.find(this.state.projectDetails.savedCustomAttr, ['id', item.id])
				: null;
			const controls = {
				id: item.id,
				selected: item.selected ? item.selected : null,
				settings: item.settings,
				key: item.key,
				label: item.label
			}
			if (saved) {
				if (Array.isArray(saved.value)) {
					controls['value'] = this.fb.array(saved.value); //new FormControl([saved.value]); //this.fb.array(saved.value)
				} else {
					controls['value'] = new FormControl({ value: saved.value, disabled: !saved.settings.edit_in_job })
				}
			} else {
				if (Array.isArray(item.value)) {
					controls['value'] = this.fb.array(item.value); //new FormControl([item.value]); //this.fb.array(item.value)
				} else {
					controls['value'] = new FormControl({ value: item.value, disabled: !item.settings.edit_in_job })
				}
			}
			if (!item.settings.edit_in_job) {
				(<FormArray>controls['value']).disable();
			}
			this.customAttributes.push(this.fb.group(controls));
		})
	}

	add(form, event: MatChipInputEvent): void {
		const input = event.input;
		const value = event.value;
		if ((value || '').trim()) {
			(<FormArray>form.get('value')).push(new FormControl(value.trim()));
		}
		if (input) {
			input.value = '';
		}
	}

	remove(form, i) {
		(<FormArray>form.get('value')).removeAt(i)
	}

	getProjectDetails(id) {

		this.commonService.getApi(this.state.get, { id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.projectDetails = res['result'].data || {};
					this.state.projectDetails.savedCustomAttr = res['result'].data.custom_attributes || [];
					this.state.noChange = true;
					this.setForm(this.state.projectDetails);
					this.checkAlbCompany();
					setTimeout(() => {
						this.state.noChange = false;
					}, 500);
				}
			})

	}

	checkAlbCompany() {
		// const clientCompany = _.find(this.dropdowns.clientCompanies, {id:this.projectInfo.controls.org_id.value});
		// if(clientCompany && clientCompany.id=='11514'){
		// 	this.state.is_alb_company = true;
		// }else{
		// 	this.state.is_alb_company = false;
		// }
	}


	changeAddress(type) {console.log('change address 12', this.projectInfo.value, this.projectInfo.value.org_id)
		this.dialog
			.open(ChangeAddressComponent, {
				panelClass: ['recon-dialog', 'info-modal'],
				width: '660px',
				height: '478px',
				data: {
					title: 'Select Address - ' + this.getClientCompanyName(this.projectInfo.value.org_id),
					tabIndex: type == 'shipping' ? 2 : 0,
					org_id: this.projectInfo.value.org_id,
					hasTabs: true,
					selectedAddress: this.state.projectDetails.address[type]
				}
			})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					if (this.state.projectDetails.address[type]) this.state.projectDetails.address[type] = res.data;
					else this.state.projectDetails.address[type] = { ...res.data }
				}
			})
	}

	editAddress(address: any = {}) {
		this.editAddressForm = this.fb.group(buildForm(this.state.addressForm));
		this.editAddressForm.controls.country_id.valueChanges.subscribe(val => {
			this.getCountryState(val);
		})

		if (Object.keys(address).length) {
			if (address.country_id) this.getCountryState(address.country_id);
			this.setAddress(address);
		}
		this.getAddressDropdowns(this.state.addressApiCalls);
	}

	setAddress(data) {
		this.editAddressForm.patchValue(updateForm(this.state.addressForm, data), { emitEvent: false });
	}

	getAddressDropdowns(arr) {
		this.getApiCalls(arr);
	}

	getCountryState(id) {
		this.commonService.getApi('getStates/' + id, {})
			.then(res => {
				if (res['result'].success) {
					this.dropdowns.states = res['result'].data || []
				}
			})
	}


	continue(form) {
		if (!this.promise) {
			this.state.submitted = true;

			if (form.valid && this.state.projectDetails.address.shipping.id) {
				this.state.submitted = false;
				// this.state.loader = true;
				this.commonService.update({ type: 'overlay', action: 'start' });
				if (false) {

				}
				let formData = form.getRawValue();
				if (Object.keys(this.state.projectDetails.address).length)
					formData.address = {
						billing: this.state.projectDetails.address.billing.id,
						shipping: this.state.projectDetails.address.shipping.id
					}
				// Date Formats
				this.state.dateFields.map(date => {
					if (formData[date.key]) formData[date.key] = _moment(formData[date.key]).format('YYYY-MM-DD HH:mm:ss');
				});
				if (this.projectInfo.controls.campaign_id.value && this.projectInfo.controls.campaign_id.value != '') {
					let selectedCampaign = _.find(this.dropdowns.campaigns, { id: this.projectInfo.controls.campaign_id.value });
					formData['campaign'] = selectedCampaign['name'];
				}
				let selectedJobTypeName = '';
				if (this.projectInfo.controls.jobs_types_id.value && this.projectInfo.controls.jobs_types_id.value != '') {
					let selectedJobType = _.find(this.dropdowns.job_types, { id: this.projectInfo.controls.jobs_types_id.value });
					selectedJobTypeName = selectedJobType['name'];
				}
				if (selectedJobTypeName == 'POP Signage' && this.state.has_poet_access) {
					this.promise = this.commonService.saveApi(this.state.save, formData)
						.then(res => {
							this.commonService.update({ type: 'overlay', action: 'stop' });
							if (res['result'].success) {
								this.commonService.update({ type: 'overlay', action: 'stop' });
								window.location.href = this.state.poet_url + res['result'].data.last_inserted_id + '/info';
								this.openSnackBar({ status: 'success', msg: 'Project ' + (form.value.id ? 'Updated' : 'Added') + ' Successfully' });
								setTimeout(() => {
									this.router.navigate(['/projects/' + res['result'].data.last_inserted_id + '/overview']);
								}, 500);
							} else {
								this.promise = undefined;
								this.state.loader = false;
							}
						})
						.catch(err => {
							this.promise = undefined;
							this.state.loader = false;
							this.commonService.update({ type: 'overlay', action: 'stop' });
						})
				} else {
					this.promise = this.commonService.saveApi(this.state.save, formData)
						.then(res => {
							this.commonService.update({ type: 'overlay', action: 'stop' });
							if (res['result'].success) {
								this.openSnackBar({ status: 'success', msg: 'Project ' + (form.value.id ? 'Updated' : 'Added') + ' Successfully' });
								setTimeout(() => {
									this.router.navigate(['/projects/' + res['result'].data.last_inserted_id + '/overview']);
								}, 500);
							} else {
								this.promise = undefined;
								this.state.loader = false;
							}
						})
						.catch(err => {
							this.promise = undefined;
							this.state.loader = false;
							this.commonService.update({ type: 'overlay', action: 'stop' });
						})
				}
			}
		}
	}

	cancel(data) {
		const fields = [...this.state.formFields, ...this.state.dateFields];
		if (this.state.projectID) {
			// need to check once after creating job completed
			this.state.dateFields.map(date => {
				if (data[date.key]) data[date.key] = new Date(data[date.key]);
			})
			this.projectInfo.reset(updateForm(fields, data), { emitEvent: false });
			this.customAttributeBuilder(data.custom_attributes, true);
		} else {
			this.state.projectDetails.address = {};
			this.projectInfo.removeControl('custom_attribute');
			this.state.projectDetails.custom_attributes = [];
			this.projectInfo.reset(updateForm(fields, this.state.defaults), { emitEvent: false });
		}

		this.projectInfo.markAsPristine();
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
