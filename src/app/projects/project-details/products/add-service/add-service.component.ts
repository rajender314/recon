import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { objectToArray } from '@app/admin/admin.config';

@Component({
	selector: 'app-add-service',
	templateUrl: './add-service.component.html',
	styleUrls: ['./add-service.component.scss']
})
export class AddServiceComponent implements OnInit {
	addProductForm: FormGroup;
	promise: any;
	state = {
		isLoading: false,
		product: {
			product_name: '',
			selectedServices: []
		},
		services: []
	}

	constructor(
		private _fb: FormBuilder,
		private _commonService: CommonService,
		private _dialogRef: MatDialogRef<AddServiceComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.state.isLoading = true;
		this.getSelectedProductDetails();		
	}

	getSelectedProductDetails() {
		this._commonService.getApi('selectedPrdSrv', { id: this.data.selectedProduct.products_id })
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.product = res['result'].data.products;
					this.state.product['selectedServices'] = [];
					this.state.services = res['result'].data.services;
					this.addProductForm = this.productBuilder(this.state.product);
				}
			})
	}

	randomId(): string {
		let rand = Math.random().toString().substr(5);
		return 'new_' + rand;
	}

	productBuilder(data?) {
		return this._fb.group({
			id: data ? data.id : '',
			product_name: data ? data.product_name : '',
			products_id: data ? [data.products_id, Validators.required] : ['', Validators.required],
			services: this._fb.group({})
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
		control.layout = 1;
		return this._fb.group(control);
	}

	addNewService(serv) {
		const key = serv.hasOwnProperty('jobs_service_revisions_id') ? serv['job_service_name'] : serv['services_name'];
		const newService = { ...serv };
		newService.old_services_name = key;
		newService.services_name = key + ' 1';
		newService.is_new = this.randomId();
		delete newService.is_check;
		newService.selected = true;
		(<FormGroup>this.addProductForm.controls['services']).addControl(newService.is_new, this.serviceBuilder(newService));
		this.state.services.push(newService);
		this.isChecked(newService);
	}

	isChecked(service) {
		const key = service.hasOwnProperty('is_new') ? service['is_new'] : service['form_id'];
		const prod: any = this.state.product;
		const indx = prod.selectedServices.indexOf(key);
		if (indx == -1) {
			prod.selectedServices.push(key);
			(<FormGroup>this.addProductForm.controls['services']).addControl(key, this.serviceBuilder(service));
		} else {
			prod.selectedServices.splice(indx, 1);
			(<FormGroup>this.addProductForm.controls['services']).removeControl(key);
		}
	}

	saveChanges() {
		if (!this.promise) {
			this._commonService.update({ type: 'overlay', action: 'start' });
			this.addProductForm.value.services = objectToArray(Object.keys(this.addProductForm.value.services), this.addProductForm.value.services);
			const params = {
				type: 'edit',
				jobs_id: this.data.jobs_id,
				products: [this.addProductForm.value]
			}
			this.promise = this._commonService.saveApi('addJobProducts', params)
				.then(res => {
					if (res['result'].success) {
						this._dialogRef.close({ success: true, data: true });
					} else {
						this.promise = undefined;
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
