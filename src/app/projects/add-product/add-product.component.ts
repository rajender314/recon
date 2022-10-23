import { Component, OnInit, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';

import * as _ from 'lodash';
import { clearFormGroup } from '@app/admin/admin.config';
import { MatDialog } from '@angular/material';
import { AddSpecDialogComponent } from '@app/dialogs/add-spec-dialog/add-spec-dialog.component';
import { AddOptionComponent } from '@app/projects/project-products/add-option/add-option.component';

@Component({
	selector: 'app-add-product',
	templateUrl: './add-product.component.html',
	styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit, OnChanges {

	@Input('form') form: FormGroup;
	@Input('jobId') jobId: number = null;
	@Input('products') productsList: Array<any> = [];
	@Input('disabled') disabled: boolean = false;


	@Input('multi') multi: boolean = true;

	state = {
		fetchingData: false,
		fetchingSpecs: true,
		selectedOption: '',
		isExists: false,
		dropdowns: {
			productTypes: []
		},
		products: [],
		selectedServices: []
	}

	constructor(
		private fb: FormBuilder,
		private dialog: MatDialog,
		private commonService: CommonService
	) { }

	ngOnInit() {
		this.getApiCalls();
	}


	get products() {
		return this.form.get('products') as FormArray;
	}

	randomId(): string {
		let rand = Math.random().toString().substr(5);
		return 'new_' + rand;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes) {
			if (changes.form) {
				if (this.productsList.length) {
					this.state.isExists = true;
					this.createJobProducts();
				} else {
					this.createForm();
				}
			}
		}
	}

	createForm() {
		this.form.addControl('products', this.fb.array([this.productBuilder()]));
		this.state.products.push(this.dummyProduct());
	}

	createJobProducts() {
		let controls = [], products = [];
		this.productsList.map((prod, i) => {
			products.push(this.dummyProduct(prod, i + 1));
			controls.push(this.productBuilder(prod));
		});
		this.form.addControl('products', this.fb.array(controls));
		this.state.products = [...products];
	}

	dummyProduct(data?, order = 1) {
		let services = [], selected = [];
		if(data && data.services) {
			data.services.map(serv => {
				if(!serv.is_check) serv.options = [
					{ id: 1, name: 1, spec_ids: [], specs: [] }
				];
				else selected.push(serv.form_id);
			});
			services = [...data.services];
		}
		return {
			id: data ? data.id : '',
			order: order,
			product_name: data ? data.product_name : '',
			products_id: data ? data.products_id : '',
			isOpen: order == 1 ? true : false,
			services: services || [],
			selectedServices: selected
		}
	}

	productBuilder(data?) {
		return this.fb.group({
			id: data ? data.id : '',
			product_name: data ? data.product_name : '',
			products_id: data ? [data.products_id, Validators.required] : ['', Validators.required],
			services: this.fb.group({})
		});
	}

	serviceBuilder(data) {
		let control: any = {};
		const arr = Object.keys(data);
		arr.map(key => {
			if (key != 'options' && key != 'isOpen' && key != 'is_check')
				control[key] = data[key];
		});
		control['is_main'] = data.is_new ? false : true;
		control.options = this.fb.array([]);
		control.layout = 1;
		return this.fb.group(control);
	}

	getApiCalls() {
		this.commonService.getApi('products', { status: true, is_dropdown: true })
			.then(res => {
				if (res['result'].success) this.state.dropdowns.productTypes = res['result'].data.items;
			})
	}

	toggleProduct(prod) {
		this.closePrevProduct(prod.order);
		const productID = (<FormGroup>this.products.controls[prod.order - 1]).controls.products_id.value;
		prod.isOpen = !prod.isOpen;
		if (prod.isOpen && !this.disabled) {
			if (!prod.services.length) {
				if (prod.id) {
					if (productID == prod.products_id) this.getSelectedServices(prod.id);
					else this.changeProductType(productID, prod);
				}
				else this.changeProductType(productID, prod);
			}
		}
	}

	closePrevProduct(order) {
		let prev = _.find(this.state.products, ['isOpen', true]);
		if (prev && order != prev.order)
			delete prev.isOpen;
	}

	changeProductType(val, prod) {
		if (val && !this.disabled) {
			clearFormGroup((<FormGroup>(<FormGroup>this.products.controls[prod.order - 1]).controls.services));
			if (prod.isOpen) {
				if (this.state.isExists) {
					this.getSelectedServices(prod.id);
					this.state.isExists = false;
				} else {
					this.getServices(prod.order, val);
				}
			}
		}
	}

	defaultOptions(prod) {
		let selected = [];
		prod.services.map(serv => {
			if(!serv.is_check) serv.options = [
				{ id: 1, name: 1, spec_ids: [], specs: [] }
			];
			else selected.push(serv.form_id);
		});
		prod.selectedServices = selected;
	}

	getSelectedServices(id) {
		let product = _.find(this.state.products, ['id', id]);
		this.state.fetchingData = true;
		this.commonService.getApi('selectedPrdSrv', { id: id })
			.then(res => {
				this.state.fetchingData = false;
				if (res['result'].success) {
					product.services = res['result'].data.services;
					this.defaultOptions(product);
				}
			})
	}

	getServices(order, id) {
		let product = _.find(this.state.products, ['order', order]);
		this.state.fetchingData = true;
		this.commonService.getApi('productServices', { id: id })
			.then(res => {
				this.state.fetchingData = false;
				if (res['result'].success) {
					product.services = res['result'].data.items;
					product.services.map(serv => {
						serv.options = [
							{ id: 1, name: 1, spec_ids: [], specs: [] }
						];
					})
				}
			})
	}

	isChecked(prod, service) {
		const key = service.hasOwnProperty('jobs_service_revisions_id') ? service['jobs_service_revisions_id'] : service['form_id'];
		this.closeService(prod, service);
		service.isOpen = !service.isOpen;
		const indx = prod.selectedServices.indexOf(key);
		if (indx == -1) {
			prod.selectedServices.push(key);
			(<FormGroup>(<FormArray>this.products.controls[prod.order - 1]).controls['services']).addControl(key, this.serviceBuilder(service));
		} else {
			prod.selectedServices.splice(indx, 1);
			(<FormGroup>(<FormArray>this.products.controls[prod.order - 1]).controls['services']).removeControl(key);
		}
		if (service.isOpen) {
			this.onTabChange(key, prod, service, 0);
		}
	}

	closeService(prod, serv) {
		const key = serv.hasOwnProperty('jobs_service_revisions_id') ? 'jobs_service_revisions_id' : 'form_id';
		const prev = _.find(prod.services, ['isOpen', true]);
		if (prev && serv[key] != prev[key])
			delete prev.isOpen;
	}

	frameLayout = (layout, specs, flag = 'init') => {
		let arr = [];

		for (let i = 0; i < specs.length; i++) {
			let spec = specs[i];
			spec.index = flag == 'add' ? spec.index : i;
			let defaultSpec = spec ? spec.form_save_values : {};
			let nextSpec = specs[i + 1];
			if(nextSpec) nextSpec.index = i+1;
			let nextDefaultSpec = nextSpec ? nextSpec.form_save_values : {};
			if (spec) {
				if (layout == 1 || layout == 3) {
					if (defaultSpec.layout == 1 || defaultSpec.layout == '') {
						arr.push([spec]);
					} else {
						if (nextDefaultSpec && nextDefaultSpec.layout == 2) {
							arr.push([spec, nextSpec]);
							i++;
						} else {
							arr.push([spec, null])
						}
					}
				} else if (layout == 2) {
					if (defaultSpec.layout == 1) {
						arr.push([spec]);
					} else {
						if (nextDefaultSpec && nextDefaultSpec.layout == 2) {
							arr.push([spec, nextSpec]);
							i++;
						} else {
							arr.push([spec, null])
						}
					}
				}
			}
		}
		return arr;
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

	onTabChange(key, prod, serv, option) {
		this.state.fetchingSpecs = true;
		this.commonService.getApi('formsSpec', { form_id: serv.form_id })
			.then(res => {
				this.state.fetchingSpecs = false;
				if (res['result'].success) {
					serv.options[option].layout = res['result'].data.layout;
					serv.options[option].spec_ids = res['result'].data.spec_ids;
					serv.options[option].specs = res['result'].data.specs;
					serv.options[option].formLayout = this.frameLayout(serv.options[option].layout, serv.options[option].specs);
					(<FormGroup>(<FormArray>this.products.controls[prod.order - 1]).controls['services']).controls[key].patchValue({
						layout: serv.options[option].layout
					})
					this.createSpecsControls(prod.order - 1, serv, option);
				}
			})
	}

	createSpecsControls(prod, serv, option) {
		const key = serv.hasOwnProperty('jobs_service_revisions_id') ? serv['jobs_service_revisions_id'] : serv['form_id'];
		let controls = this.fb.group({
			option_no: option + 1,
			spec_ids: this.fb.array(serv.options[option].spec_ids),
			form_save_values: this.fb.array([])
		});
		serv.options[option].specs.map(spec => {
			(<FormArray>controls.controls.form_save_values).push(this.fb.group(this.createFormBuilder(spec.form_save_values, spec)))
		});
		(<FormArray>(<FormGroup>(<FormGroup>(<FormArray>this.products.controls[prod]).controls['services']).controls[key]).controls.options).push(controls);
	}


	performAction(flag, prod, i?) {
		if (flag == 'delete') {
			if (this.state.products.length > 1) {
				this.state.products.splice(i, 1);
				this.products.removeAt(i);
			}
		} else if (flag == 'add') {
			this.products.push(this.productBuilder());
			this.state.products.push(this.dummyProduct({}, this.state.products.length + 1));
			this.closePrevProduct(this.state.products.length + 1);
		}
	}

	addOption(prod, serv) {
		this.dialog.open(AddOptionComponent, {
			panelClass: ['my-dialog', 'add-options'],
			width: '600px',
			data: {
				title: 'Add Options',
				options: serv.options,
				key: 'name'
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res) {
					let newOption = { ...serv.options[res - 1] };
					newOption.id = newOption.name = serv.options.length + 1;
					serv.options.push(newOption);
					this.createSpecsControls(prod.order - 1, serv, serv.options.length - 1);
				}
			})
	}

	addSpecs(prod, serv) {
		const key = serv.hasOwnProperty('jobs_service_revisions_id') ? serv['jobs_service_revisions_id'] : serv['form_id'];
		const selectedoOtion = 0;
		this.dialog.open(AddSpecDialogComponent, {
			panelClass: 'my-dialog',
			width: '600px',
			data: { title: 'Add Form Specs', type: 1, id: '', url: '' }
		})
			.afterClosed()
			.subscribe(res => {
				if (res.success) {
					serv.options[selectedoOtion].spec_ids = [...serv.options[selectedoOtion].spec_ids, ...res.data.spec_ids];
					res.data.specs.map(spec => {
						spec.form_save_values = _.find(res.data.values, ['id', spec.id]) || {};
						(<FormArray>(<FormGroup>(<FormArray>(<FormGroup>(<FormGroup>(<FormArray>this.products.controls[prod.order - 1]).controls['services']).controls[key]).controls.options).controls[0]).controls.spec_ids).push(new FormControl(spec.id));
						(<FormArray>(<FormGroup>(<FormArray>(<FormGroup>(<FormGroup>(<FormArray>this.products.controls[prod.order - 1]).controls['services']).controls[key]).controls.options).controls[0]).controls.form_save_values).push(this.fb.group(this.createFormBuilder(spec.form_save_values, spec)));
					})
					res.data.specs.map((o, i) => {
						o.index = serv.options[selectedoOtion].specs.length + i;
					})
					serv.options[selectedoOtion].specs = [...serv.options[selectedoOtion].specs, ...res.data.specs];
					serv.options[selectedoOtion].formLayout = [...serv.options[selectedoOtion].formLayout, ...this.frameLayout(serv.options[selectedoOtion].layout, res.data.specs, 'add')];
				}
			})
	}

	onChangeOption(ev) {
		this.state.selectedOption = ev;
	}


	addNewService(prod, serv) {
		const key = serv.hasOwnProperty('jobs_service_revisions_id') ? serv['job_service_name'] : serv['services_name'];
		const newService = { ...serv };
		newService.old_services_name = key;
		newService.services_name = key + ' 1';
		newService.is_new = this.randomId();
		(<FormGroup>(<FormArray>this.products.controls[prod.order - 1]).controls['services']).addControl(newService.is_new, this.serviceBuilder(newService));
		prod.services.push(newService)
	}

	deleteService(service, indx) {
		// this.services.removeControl(service.is_new);
		// this.state.services.splice(indx, 1);
	}

}
