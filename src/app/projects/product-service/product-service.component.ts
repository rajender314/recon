import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { clearFormGroup, objectToArray } from '@app/admin/admin.config';
import { MatDialog, MatSnackBar } from '@angular/material';

import { ImportProjectDataComponent } from '@app/projects/import-project-data/import-project-data.component';
import { CommonService } from '@app/common/common.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';


@Component({
	selector: 'app-product-service',
	templateUrl: './product-service.component.html',
	styleUrls: ['./product-service.component.scss']
})
export class ProductServiceComponent implements OnInit {

	isProduct: boolean = false;
	projectID: number;
	productsList = [];
	productService: FormGroup;
	type: string = 'add';

	constructor(
		private router: Router,
		private activedRoute: ActivatedRoute,
		private commonService: CommonService,
		private fb: FormBuilder,
		private dialog: MatDialog,
		private snackbar: MatSnackBar
	) {
		activedRoute.params.subscribe(param => {
			this.projectID = param.id ? param.id : null;
		});

		if (this.projectID) this.getJobProducts(this.projectID);
	}

	ngOnInit() {
		this.createForm();
	}

	get products() {
		return this.productService.get('products') as FormArray;
	}

	checkLength(form) {
		let isValid = false;
		if (form.value.products)
			form.value.products.map(prod => {
				if (objectToArray(Object.keys(prod.services), prod.services).length && !isValid) {
					isValid = true;
				}
			});
		return isValid;
	}

	createForm() {
		this.productService = this.fb.group({
			jobs_id: this.projectID
		})
	}

	showProduct() {
		this.isProduct = true;
	}

	getJobProducts(id) {
		this.commonService.getApi('jobProducts', { jobs_id: id })
			.then(res => {
				if (res['result'].success) {
					this.productsList = res['result'].data;
					if (this.productsList.length) {
						this.type = 'edit';
						this.showProduct();
					}
				}
			})
	}

	addProduct(form) {
		if (form.valid && this.checkLength(form)) {
			form.value.products.map(prod => {
				prod.services = objectToArray(Object.keys(prod.services), prod.services);
			})
			form.value.type = this.type;
			this.commonService.saveApi('addJobProducts', form.value)
				.then(res => {
					if (res['result'].success) {
						if (res['result'].data) {
							this.openSnackBar({ status: 'success', msg: 'Product(s) ' + (this.productsList.length ? 'Updated' : 'Added') + 'Successfully' });
							setTimeout(() => {
								this.router.navigate(['/projects/create-project/' + this.projectID + '/review']);
							}, 500);
						}
					}
				})
		}
	}


	reset() {
		this.productService.reset();
		// clearFormGroup(this.services);
		this.isProduct = false;
	}


	importDialog() {
		this.dialog
			.open(ImportProjectDataComponent, {
				panelClass: 'my-dialog',
				width: '600px',
				data: { title: 'Import External Job Data' }
			})
			.afterClosed()
			.subscribe(res => {
				/*if (res && res.success) {
					const status = this.param.status ? this.param.status == 'true' : '';
					this.openSnackBar({ status: 'success', msg: 'Cost Code Added Successfully' });
					this.param.page = 1;
					this.getList();
				}*/
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

}
