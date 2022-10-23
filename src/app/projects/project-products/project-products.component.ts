import { Component, OnInit, TemplateRef } from '@angular/core';

import * as _ from 'lodash';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { objectToArray } from '@app/admin/admin.config';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar, MatDialog } from '@angular/material';
import { ActionsDialogComponent } from '@app/projects/project-products/actions-dialog/actions-dialog.component';
import { AddSpecDialogComponent } from '@app/dialogs/add-spec-dialog/add-spec-dialog.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { AddOptionComponent } from '@app/projects/project-products/add-option/add-option.component';

@Component({
	selector: 'app-project-products',
	templateUrl: './project-products.component.html',
	styleUrls: ['./project-products.component.scss']
})
export class ProjectProductsComponent implements OnInit {

	serviceForm: FormGroup;

	state = {
		isLoading: true,
		fetchingData: false,
		fetchingSpecs: true,
		projectID: null,
		allProducts: [],
		products: [],
		selectedServices: [],
		selectedOption: null
	}

	constructor(
		private route: ActivatedRoute,
		private commonService: CommonService,
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar
	) {
		this.route.parent.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : null;
		});
	}

	get optionsGroup() {
		return this.serviceForm.get('options') as FormGroup;
	}

	ngOnInit() {
		this.getProducts(this.state.projectID);
		this.getProductsList(this.state.projectID);
	}

	getProductsList(id) {
		this.commonService.getApi('jobProductList', { jobs_id: id })
			.then(res => {
				if (res['result'].success) {
					this.state.allProducts = res['result'].data;
				}
			})
	}

	productActions(flag, comp, prod?, serv?) {
		let locals: any = {
			title: '',
			jobs_id: this.state.projectID
		};
		switch (flag) {
			case 'clone':
				locals.title = 'Clone Products';
				locals.flag = 'clone';
				break;
			case 'import':
				locals.title = 'Import Products';
				locals.flag = 'import';
				break;
			case 'add':
				locals.title = 'Add Product';
				locals.flag = 'add';
				locals.url = 'addJobProducts';
				break;

			case 'addService':
				locals.title = 'Add Service';
				locals.flag = 'addService';
				locals.url = 'addJobProducts';
				locals.prodID = prod.id;
				break;

			case 'removeProduct':
				locals.title = 'Remove Product';
				locals.action = 'remove';
				locals.tab = 'Product';
				locals.url = 'delJobPrdtSrv';
				locals.params = {
					id: this.state.products[prod].id,
					type: 'product'
				};
				locals.content = 'Are you sure, you want to remove this Product';
				break;

			case 'removeService':
				locals.title = 'Remove Service';
				locals.action = 'remove';
				locals.tab = 'Service';
				locals.url = 'delJobPrdtSrv';
				locals.params = {
					id: this.state.products[prod].services[serv].jobs_service_revisions_id,
					type: 'service'
				};
				locals.content = 'Are you sure, you want to remove this Service';
				break;

			case 'default':

		}

		if (comp == 'add') {
			this.dialog.open(ActionsDialogComponent, {
				panelClass: 'my-dialog',
				width: '800px',
				data: locals
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						this.getProducts(this.state.projectID);
					}
				})
		} else if (comp == 'remove') {
			this.dialog.open(ConfirmationComponent, {
				panelClass: 'my-dialog',
				width: '600px',
				data: locals
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						if (flag == 'removeProduct') {
							this.state.products.splice(prod, 1);
						} else if (flag == 'removeService') {
							this.state.products[prod].services.splice(serv, 1);
						}
					}
				})
		}
	}

	search(val) {
		this.getProducts(this.state.projectID, val)
	}

	serviceBuilder(data) {
		this.serviceForm = this.fb.group({
			id: data.jobs_service_revisions_id,
			name: data.job_service_name,
			options: this.fb.group({})
		})
	}

	getProducts(id, search = '') {
		this.state.isLoading = true;
		this.commonService.getApi('jobProducts', { jobs_id: id, search: search })
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.products = res['result'].data;
				}
			})
	}

	onSelectItem(flag, prod, serv?, isOpen?, cb?) {
		if (flag == 'product') {
			this.closeProduct(prod);
			prod.isOpen = !prod.isOpen;
			prod.services = [];
			if (prod.isOpen)
				this.getSelectedServices(prod.id);
		} else {
			this.closeService(prod, serv);
			serv.isOpen = isOpen ? isOpen : !serv.isOpen;
			if (serv.isOpen) {
				this.serviceBuilder(serv);
				serv.options.map(o => {
					o.spec_ids = o.specs = [];
				})
				this.onTabChange(prod, serv, 0, cb);
			}
		}

	}

	getSelectedServices(id) {
		let product = _.find(this.state.products, ['id', id]);
		this.state.fetchingData = true;
		this.commonService.getApi('jobPrdtDtls', { id: id })
			.then(res => {
				this.state.fetchingData = false;
				if (res['result'].success) {
					product.services = res['result'].data;
					// remove after done
					product.services.map(ser => {
						ser.revisions = _.range(5);
					})
				}
			})
	}

	closeProduct(prod) {
		const prev = _.find(this.state.products, ['isOpen', true]);
		if (prev && prod.id != prev.id)
			delete prev.isOpen;
		this.closeService(prod);
	}

	closeService(prod, serv?) {
		if (serv) {
			const prevServ = _.find(prod.services, ['isOpen', true]);
			if (prevServ && serv.jobs_service_revisions_id != prevServ.jobs_service_revisions_id) delete prevServ.isOpen;
		} else {
			if (prod.services)
				prod.services.map(o => {
					delete o.isOpen;
				})
		}
	}


	onTabChange(prod, serv, tabIndex, cb?) {
		serv.selectedIndex = tabIndex;
		this.state.fetchingSpecs = true;
		this.commonService.getApi('jobPrdSpecs', { id: serv.options[tabIndex].id, option_no: serv.options[tabIndex].option_no, revision_no: serv.selectedRevision || serv.revisions.length - 1 })
			.then(res => {
				this.state.fetchingSpecs = false;
				if (res['result'].success) {
					serv.options[tabIndex] = { ...serv.options[tabIndex], ...res['result'].data[0] };
					this.createSpecsControls(serv.options[tabIndex]);
					if(cb) cb();
					else this.optionsGroup.controls[serv.options[tabIndex].id].disable();
				}
			})
	}

	createSpecsControls(option) {
		let controls = this.fb.group({
			id: option.id,
			jobs_service_revisions_id: option.jobs_service_revisions_id,
			option_no: option.option_no,
			form_save_values: this.fb.array([]),
			spec_ids: this.fb.array(option.spec_ids || [])
		});
		option.specs.map(spec => {
			(<FormArray>controls.controls.form_save_values).push(this.fb.group(this.createFormBuilder(spec.form_save_values, spec)))
		});
		this.optionsGroup.addControl(option.id, controls);
	}


	createFormBuilder(data, spec) {
		let controls = {
			id: data.id,
			layout: data.layout || 1
		};

		const settings: any = {};
		if (spec.settings) {
			Object.keys(spec.settings).map(key => {
				settings[key] = data.settings[key] || false;
			})
		}
		controls['settings'] = this.fb.group(settings);

		if (spec.key == 'checkboxes') {
			const group = {};
			spec.options.map(option => {
				group[option.id] = Object.keys(data.value).length ? data.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
			});
			controls['value'] = this.fb.group(group);
		} else if (spec.key == 'group') {
			const groupControls = [];
			spec.options.map((option, i) => {
				const res = _.find(data.value, ['id', option.id]);
				if (res) groupControls.push(this.fb.group((this.createFormBuilder(res, option))));
				else {
					const defaultValues = {
						id: option.id,
						layout: 1,
						settings: {},
						value: spec.key == 'auto_suggest' ? [] : spec.key == 'checkboxes' ? {} : ''
					}
					if (option.settings) {
						Object.keys(option.settings).map(key => {
							defaultValues.settings[key] = false;
						})
					}
					groupControls.push(this.fb.group((this.createFormBuilder(defaultValues, option))));
				}
			})
			controls['value'] = this.fb.array(groupControls);
		} else {
			controls['value'] = spec.template_id == 3 ? [data.value] || [spec.value] : data.value || spec.value;
		}
		if (spec.template_id == 3 || spec.key == 'dropdown') spec.options.map(opt => { opt.name = opt.value; })
		return controls;
	}

	performAction(flag, serv, prod?) {
		if (flag == 'edit') {
			if(!serv.isOpen) this.onSelectItem('service', prod, serv, true, () => {
				this.optionsGroup.controls[serv.options[serv.selectedIndex].id].enable();
			});
			else this.optionsGroup.controls[serv.options[serv.selectedIndex].id].enable();
		} else if (flag == 'cancel') {
		} else if (flag == 'save' || flag == 'new') {
			this.saveSeviceSpecs(serv, (flag == 'new' ? true : false));
		}
	}

	changeRevision(rev, prod, serv) {
		serv.selectedRevision = rev;
		this.onSelectItem('service', prod, serv, true);
	}

	saveSeviceSpecs(serv, isNew = false) {
		let data = {
			url: '',
			params: {}
		}
		if(isNew) {
			data.url = 'updateJobSrv';
			data.params = this.serviceForm.value;
			data.params['options'] = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options);
			data['is_revision'] = isNew;
		}else {
			data.url = 'saveJobFormSpec';
			const options = objectToArray(Object.keys(this.serviceForm.value.options), this.serviceForm.value.options)
			data.params = _.find(options, ['id', serv.options[serv.selectedIndex].id]);
		}
		this.commonService.saveApi(data.url, data.params)
			.then(res => {
				if (res['result'].success) {
					this.openSnackBar({ status: 'success', msg: res['result'].message });
					this.optionsGroup.disable();
				}
			})
	}

	addSpecs(prod, serv) {
		this.dialog.open(AddSpecDialogComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: { title: 'Add Form Specs', type: 1, id: '', url: '' }
		})
			.afterClosed()
			.subscribe(res => {
				if (res.success) {
					serv.options[serv.selectedIndex].spec_ids = [...serv.options[serv.selectedIndex].spec_ids, ...res.data.spec_ids];
					res.data.specs.map(spec => {
						spec.form_save_values = _.find(res.data.values, ['id', spec.id]) || {};
						(<FormArray>(<FormGroup>this.optionsGroup.controls[serv.options[serv.selectedIndex].id]).controls.spec_ids).push(new FormControl(spec.id));
						(<FormArray>(<FormGroup>this.optionsGroup.controls[serv.options[serv.selectedIndex].id]).controls.form_save_values).push(this.fb.group(this.createFormBuilder(spec.form_save_values, spec)));
					})
					serv.options[serv.selectedIndex].specs = [...serv.options[serv.selectedIndex].specs, ...res.data.specs];
				}
			})
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



	/* Inline mat-modal  */

	get randomId(): string {
		let rand = Math.random().toString().substr(5);
		return 'new_' + rand;
	}

	addOption(prod, serv) {
		this.dialog.open(AddOptionComponent, {
			panelClass: ['my-dialog', 'add-options'],
			width: '600px',
			data: {
				title: 'Add Options',
				options: serv.options,
				key: 'option_no'
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					const option = _.find(serv.options, ['id', res]) || {};
					let newOption: any = { ...option };
					newOption.id = this.randomId;
					newOption.option_no = serv.options.length + 1;
					serv.options.push(newOption);
					serv.selectedIndex = serv.options.length - 1;
					this.createSpecsControls(serv.options[serv.selectedIndex]);
				}
			})
	}

}
