import { Component, OnInit, HostListener, OnDestroy, ViewChildren } from '@angular/core';
import { FormFieldType, buildForm, updateForm, clearFormArray } from '@app/admin/admin.config';
import { FormGroup, FormBuilder, FormControl, FormArray } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute } from '@angular/router';
import { ChangeAddressComponent } from '@app/projects/change-address/change-address.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import * as _moment from 'moment';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import PerfectScrollbar from 'perfect-scrollbar';

var APP: any = window['APP'];

@Component({
	selector: 'app-project-info',
	templateUrl: './project-info.component.html',
	styleUrls: ['./project-info.component.scss']
})
export class ProjectInfoComponent implements OnInit, OnDestroy {
	@ViewChildren('reconscroll') reconScroll;
	state: any = {
		submitted: false,
		isEventChange: false,
		projectID: '',
		breadcrumbs: [
			{ label: 'Projects', type: 'link', route: '/projects' },
			{ label: '...', type: 'text' },
			/* { label: 'Project Info', type: 'text' }, */
		],
		minDate: new Date(),
		get: 'getJobInfo',
		save: 'saveJobInfo',
		projectDetails: {},
		formFields: [],
		displayNames: {
			project_type_name: '',
			org_name: '',
			initiator: '',
			billing_type_name: '',
			company_code_name: '',
			job_coordinators_name: [],
			account_director_name: '',
			account_vp_name: '',
			distribution_type: ''
		},
		sections: [
			{
				name: 'Project Details', display: 'none', formFields: [
					{maxlength:100,is_visible:true, can_edit: true, key: 'job_title', label: 'Project Name', type: 'text', validations: { required: true }, default: '' },
					// {
					// 	children: [
					// 		{ can_edit: false, key: 'project_type', label: 'Project Type', type: 'select', multi: false, options: 'projectTypes', default: '' }
					// 	]
					// },
					// { can_edit: false, key: 'campaign', label: 'Campaign (Optional)', type: 'text', default: '' }
				]
			},
			{
				name: 'Client Details', display: 'visible', formFields: [
					{
						children: [
							{is_visible:true, can_edit: false, display_name: 'org_name', key: 'org_id', label: 'Client Company', type: 'select', validations: { required: true }, multi: false, options: 'clientCompanies', default: '' },
							{is_visible:true, can_edit: true, display_name: 'initiator', key: 'client_initiator', label: 'Client Initiator', nameKey: 'fullname', type: 'select', multi: false, options: 'clientInitiators', default: '' }
						]
					},
					{is_visible: (APP.permissions.job_access.billing_type == 'yes') ? true : false, can_edit: true, display_name: 'billing_type_name', key: 'billing_type', label: 'Billing Type', type: 'select', multi: false, options: 'billingTypes', default: 1 },
					{
						children: [
							{is_visible:true, can_edit: false, display_name: 'project_type_name', key: 'jobs_types_id', label: 'Project Type', type: 'select', multi: false, options: 'job_types', default: '' },
							{is_visible:true, can_edit: false, display_name: 'campaign', key: 'campaign_id', label: 'Campaign', type: 'select', multi: false, options: 'campaigns', default: '' }
						]
					},
				]
			},
			{
				name: 'Company Details', display: 'visible', formFields: [
					{
						children: [
							{is_visible:true, can_edit: false, display_name: 'company_code_name', key: 'company_code', label: 'Company Code', type: 'select', validations: { required: true }, multi: false, options: 'companyCodes', default: '' }
						]
					},
					{is_visible:true, can_edit: true, display_name: 'job_coordinators_name', key: 'job_coordinators', label: 'Project Coordinator(s)  <i title=\'You can select Max. 3 Project Coordinators\' class=\'pixel-icons icon-info-circle\'></i>', nameKey: 'label', type: 'select', validations: { required: true }, multi: true, options: 'users', default: [], errorLabel: 'Project Coordinator(s)' },
					{
						children: [
							{is_visible:true, display_name: 'account_director_name', key: 'account_director', label: 'Account Director', type: 'select', multi: false, options: 'users', default: '' },
							{is_visible:true, display_name: 'account_vp_name', key: 'account_vp', label: 'Account VP', type: 'select', multi: false, options: 'users', default: '' }
						]
					}
				]
			},
			{
				name: 'Dates', display: 'visible', formFields: [
					{
						children: [
							{is_visible:true, can_edit: false, key: 'start_date', label: 'Start Date', type: 'date', validations: { required: true }, default: new Date() },
							{is_visible:true, can_edit: false, key: 'delivery_due_date', label: 'Delivery Due Date', type: 'date', validations: { required: true }, default: null }
						]
					},
					{
						children: [
							{is_visible:true, can_edit: true, key: 'event_date', label: 'Event Date', type: 'date', default: null },
							{is_visible:true, can_edit: false, key: 'final_due_date', label: 'Final Bill Due Date', type: 'date', default: null }
						]
					}
				]
			}
		],
		extraFields: [
			{ key: 'id', label: '', type: 'none', default: '' },
			{ key: 'job_prefix', label: '', type: 'none', default: '' },
			{ key: 'org_name', label: '', type: 'none', default: '' },
			{ key: 'org_xid', label: '', type: 'none', default: '' },
			{ key: 'org_tax', label: 'Org Tax', type: 'none', default: '' },

			{ key: 'distribution_type', label: 'Distribution Type', type: 'select', multi: false, options: 'distributionTypes', default: '' },
			{ key: 'add_billing_address', label: 'Add Billing Address', type: 'checkbox', default: false },
			{ key: 'vendor_funded', label: 'Vendor Funded', type: 'checkbox', default: false },
			{ key: 'create_related_jobs', label: 'Create Related Project', type: 'checkbox', default: false },
			{ key: 'job_in_client_portal', label: 'Show Project in Client Portal', type: 'checkbox', default: false }
		],
		dropdowns: {},
		dropdownsList: ['projectTypes', 'clientCompanies', 'billingTypes', 'companyCodes', 'users', 'distributionTypes', 'clientInitiators', 'countries', 'states'],
		dateFields: ['start_date', 'delivery_due_date', 'event_date', 'final_due_date'],
		apiCalls: [
			{ key: 'distributionTypes', url: 'distributionTypes', method: 'get', responseKey: 'items', params: { status: true } },
			// { key: 'clientCompanies', url: 'getUserJobOrgs', method: 'get', responseKey: '', params: { status: true, id: APP.recon_user[0].id, sort: 'asc' } },
			{ key: 'companyCodes', url: 'getUserJobCompanyCode', method: 'get', responseKey: 'items', params: { status: true, id: APP.recon_user[0].id } },
			{ key: 'billingTypes', url: 'getBillingTypes', method: 'get', responseKey: '', params: {} },
			{ key: 'projectTypes', url: 'projectTypes', method: 'get', responseKey: '', params: {} }
		],
		distribution: { can_edit: true, display_name: 'distribution_types_name', key: 'distribution_type', label: 'Distribution Type', type: 'select', multi: false, options: 'distributionTypes', default: '' },
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
	promise: any;
	projectInfo: FormGroup;
	editAddressForm: FormGroup;

	subscription: Subscription;
	routerSubscription: Subscription;

	constructor(
		private _fb: FormBuilder,
		private _router: ActivatedRoute,
		private _dialog: MatDialog,
		private _commonService: CommonService,
		private snackbar: MatSnackBar
	) {
		this.state.breadcrumbs[0].route = _commonService.projectState ? ('/projects/' + _commonService.projectState) : '/projects';
		this.routerSubscription = _router.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
			if (this.state.projectID) this.getProjectDetails(this.state.projectID);
		});

		this.subscription = _commonService.onUpdate().subscribe(obj => {
			if (obj.type == 'projectName' && Object.keys(obj.data).length) {
				this.state.breadcrumbs[1].label = obj.data.job_title || '----';
			}
		})

		// if (this.state.projectID) this.getProjectDetails(this.state.projectID);
	}

	changeMasterView() {
		this._commonService.onChange();
	}

	ngOnInit() {
		setTimeout(() => {
			if (this.reconScroll._results.length) {
				this.reconScroll._results.map((container) => {
					new PerfectScrollbar(container.nativeElement);
				});
			}
		});

		if (this.state.apiCalls) {
			this.createObject(this.state.dropdownsList);
			this.getApiCalls(this.state.apiCalls);
		}
		this.state.formFields = this.getFormfields;
		this.createForm(this.state.formFields);
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
		this.routerSubscription.unsubscribe();
	}

	createObject(arr) {
		arr.map(key => {
			this.state.dropdowns[key] = [];
		})
	}

	getApiCalls(arr) {
		let apiCalls = [];
		arr.map(api => {
			if (api.method == 'get')
				apiCalls.push(this._commonService.getApi(api.url, api.params))
			else if (api.method == 'post')
				apiCalls.push(this._commonService.saveApi(api.url, api.params))
		});
		forkJoin(apiCalls)
			.subscribe(data => {
				data.map((o, i) => {
					if (arr[i].responseKey) {
						this.state.dropdowns[arr[i].key] = o['result'].data.items || [];
					} else {
						this.state.dropdowns[arr[i].key] = o['result'].data || [];
					}
					if (arr[i].key == 'billingTypes') {
						this.state.dropdowns[arr[i].key].map(o => {
							o.inactive = !o.is_selected;
						})
					}
				});
			})
	}

	get getFormfields(): Array<FormFieldType> {
		let formFields = [];
		this.state.sections.map(o => {
			o.formFields.map(p => {
				if (p.hasOwnProperty('children')) {
					formFields = [...formFields, ...p.children];
				} else {
					formFields.push(p);
				}
			})
		})
		return formFields;
	}

	getClientCompanyName(id) {
		const comp = _.find(this.state.dropdowns.clientCompanies, ['id', id]);
		return comp ? comp.name : '';
	}

	get customAttributes() {
		return this.projectInfo.get('custom_attributes') as FormArray;
	}

	customAttributeBuilder(data, isChange) {
		this.projectInfo.addControl('custom_attributes', this._fb.array([]));
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
					controls['value'] = this._fb.array(saved.value); //new FormControl([saved.value]); //this.fb.array(saved.value)
				} else {
					controls['value'] = new FormControl({ value: saved.value, disabled: !saved.settings.edit_in_job })
				}
			} else {
				if (Array.isArray(item.value)) {
					controls['value'] = this._fb.array(item.value); //new FormControl([item.value]); //this.fb.array(item.value)
				} else {
					controls['value'] = new FormControl({ value: item.value, disabled: !item.settings.edit_in_job })
				}
			}
			if (!item.settings.edit_in_job) {
				(<FormArray>controls['value']).disable();
			}
			this.customAttributes.push(this._fb.group(controls));
		})
	}

	getProjectDetails(id) {

		this._commonService.getApi(this.state.get, { id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.projectDetails = res['result'].data || {};
					this.state.projectDetails.savedCustomAttr = res['result'].data.custom_attributes || [];
					this.updateDates(); this.updateAddress();
					if (this.state.projectDetails.custom_attributes && this.state.projectDetails.custom_attributes.length) {
						_.map(this.state.projectDetails.custom_attributes, (item) => {
							if (item.key == 'dropdown') {
								item['selected'] = item.selected ? item.selected : '';
								item['options'] = [];
								_.map(item.value, (option, index) => {
									item['options'].push({ id: option, name: option });
								});
							}
						});
						this.customAttributeBuilder(this.state.projectDetails.custom_attributes, true);
					}
					this.setForm(this.state.projectDetails);
					if (this.state.projectDetails.address.billing && this.state.projectDetails.address.billing.id) this.projectInfo.patchValue({
						add_billing_address: true
					})

					if (this.state.projectDetails.org_id) {
						this._commonService.getApi('getOrgContacts', { search: '', org_type: 2, org_id: this.state.projectDetails.org_id })
							.then(res => {
								if (res['result'].success) {
									this.state.dropdowns.clientInitiators = res['result'].data || [];
								}
							})
console.log(1)
						this._commonService.getApi('getDropdownMaster', { org_type: 2, org_id: this.state.projectDetails.org_id, master_type: 5 })
							.then(res => {
								if (res['result'].success) {
									this.state.dropdowns.users = res['result'].data ? res['result'].data.users : [];
								}
							})
					}
				}
			})

	}

	updateDates() {
		this.state.dateFields.map(o => {
			this.state.projectDetails[o] = this.state.projectDetails[o] ? new Date(this.state.projectDetails[o]) : null;
		});
	}

	updateAddress() {
		this.state.projectDetails.address = {
			billing: Array.isArray(this.state.projectDetails.billing) ? null : this.state.projectDetails.billing,
			shipping: Array.isArray(this.state.projectDetails.shipping) ? null : this.state.projectDetails.shipping
		}
	}

	editAddress(address: any = {}) {
		this.editAddressForm = this._fb.group(buildForm(this.state.addressForm));

		this.editAddressForm.controls.country_id.valueChanges.subscribe(val => {
			this.getCountryState(val);
		})

		if (Object.keys(address).length) {
			if (address.country_id) this.getCountryState(address.country_id);
			this.setAddress(address);
		}
		this.getAddressDropdowns(this.state.addressApiCalls);

		this.editAddressForm.valueChanges.subscribe(val => {
			this.projectInfo.markAsDirty();
		})
	}

	setAddress(data) {
		this.editAddressForm.patchValue(updateForm(this.state.addressForm, data), { emitEvent: false });
	}

	getAddressDropdowns(arr) {
		this.getApiCalls(arr);
	}

	getCountryState(id) {
		this._commonService.getApi('getStates/' + id, {})
			.then(res => {
				if (res['result'].success) {
					this.state.dropdowns.states = res['result'].data || []
				}
			})
	}

	changeAddress(type) {console.log('change address 1',this.projectInfo.value, this.projectInfo.value.org_id )
		this._dialog
			.open(ChangeAddressComponent, {
				panelClass: ['recon-dialog','info-modal'],
				width: '660px',
				height: '478px',
				data: {
					// title: 'Select Address - ' + this.getClientCompanyName(this.projectInfo.value.org_id),
					title: 'Select Address - ' + this.projectInfo.value.org_name,
					tabIndex: type == 'shipping' ? 2 : 0,
					org_id: this.projectInfo.value.org_id,
					hasTabs: true,
					selectedAddress: this.state.projectDetails.address[type]
				}
			})
			.afterClosed()
			.subscribe(res => {
				if (this.state.projectDetails.address[type]) delete this.state.projectDetails.address[type].is_edit;
				if (res && res.success) {
					if (this.state.projectDetails.address[type]) this.state.projectDetails.address[type] = res.data;
					else this.state.projectDetails.address[type] = { ...res.data };

					this.save(this.projectInfo);
				}
			})
	}

	createForm(formFields) {
		this.projectInfo = this._fb.group(buildForm([...formFields, ...this.state.extraFields]));
		this.projectInfo.controls.create_related_jobs.valueChanges.subscribe(val => {
			if (val) {
				this.projectInfo.addControl('related_company_codes', new FormControl([]))
			} else {
				this.projectInfo.removeControl('related_company_codes');
			}
		});
		this.projectInfo.controls.event_date.valueChanges.subscribe(val => {
			this.state.isEventChange = true;
		})

		this.projectInfo.controls.job_coordinators.valueChanges.subscribe(val => {
			if(this.projectInfo.controls.job_coordinators.value.length > 3) 
			this.projectInfo.controls.job_coordinators.setValue(this.projectInfo.controls.job_coordinators.value.splice(0, 3), {emitEvent: false});
		})
	}

	setForm(data) {
		this.projectInfo.patchValue(updateForm([...this.state.formFields, ...this.state.extraFields], data), { emitEvent: false });
	}

	toggleInlineEdit(obj) {
		if (obj) obj.is_edit = true;
	}

	saveInlineEditCA(obj, index) {
		if (obj.key == 'single_line_text') {
			obj.value = this.projectInfo.controls['custom_attributes'].value[index].value;
		} else if (obj.key == 'dropdown') {
			obj.selected = this.projectInfo.controls['custom_attributes'].value[index].selected;
		}
		this.saveInlineEdit(obj)
	}

	saveInlineEdit(obj) {
		if (!this.promise) {
			this.save(this.projectInfo, () => {
				this.state.isEventChange = false;
				obj.is_edit = false;
				if (obj.type == 'select') {
					let getValue: any;
					if (obj.multi) {
						getValue = [];
						this.projectInfo.controls[obj.key].value.map(o => {
							const val = _.find(this.state.dropdowns[obj.options], ['id', o]);
							if (val) getValue.push(obj.nameKey ? val[obj.nameKey] : val.name);
						});
						if (getValue) this.state.projectDetails[obj.display_name] = getValue;
					}
					else {
						getValue = _.find(this.state.dropdowns[obj.options], ['id', this.projectInfo.controls[obj.key].value]);
						if (getValue) this.state.projectDetails[obj.display_name] = obj.nameKey ? getValue[obj.nameKey] : getValue.name;
					}
				}
				if (obj.key == 'job_title') {
					this.state.projectDetails[obj.key] = this.projectInfo.controls[obj.key].value;
					this._commonService.update({ type: 'projectName', data: this.state.projectDetails });
				}
			})
		}
	}

	cancelInlineEdit(obj) {
		obj.is_edit = false;
		if (obj.key == 'event_date') this.state.isEventChange = false;
		this.projectInfo.patchValue({
			[obj.key]: this.state.projectDetails[obj.key]
		}, { emitEvent: obj.key == 'event_date' ? false : true });
	}

	cancel() {
		this.getProjectDetails(this.state.projectID);
	}

	save(form, cb?) {
		this.state.submitted = true;
		if (form.valid) {
			this.state.submitted = false;
			this._commonService.update({ type: 'overlay', action: 'start' });
			if (Object.keys(this.state.projectDetails.address).length)
				form.value.address = {
					billing: this.state.projectDetails.address.billing ? this.state.projectDetails.address.billing.id : null,
					shipping: this.state.projectDetails.address.shipping ? this.state.projectDetails.address.shipping.id : null
				}

			// Date Formats
			this.state.dateFields.map(o => {
				if (form.value[o]) form.value[o] = _moment(form.value[o]).format('YYYY-MM-DD HH:mm:ss');
			})
			form.value.is_event = this.state.isEventChange;
			form.value.campaign = this.state.projectDetails.campaign;
			this.promise = this._commonService.saveApi(this.state.save, form.value)
				.then(res => {
					this.promise = undefined;
					if (res['result'].success) {
						if (cb) cb();
						this.projectInfo.markAsPristine();
						this.snackbar.openFromComponent(SnackbarComponent, {
							data: { status: 'success', msg: 'Project Details Updated Successfully' },
							verticalPosition: 'top',
							horizontalPosition: 'right'
						});
					}
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
				.catch(err => {
					this.promise = undefined;
					this._commonService.update({ type: 'overlay', action: 'stop' });
				})
		}
	}

}
