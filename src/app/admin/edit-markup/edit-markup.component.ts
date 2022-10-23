import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AdminService } from '@app/admin/admin.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-edit-markup',
  templateUrl: './edit-markup.component.html',
  styleUrls: ['./edit-markup.component.scss']
})
export class EditMarkupComponent implements OnInit {

  public addressForm: FormGroup;
  public submitted: boolean = false;

  numberConfig: any = {
    prefix: '',
    limit: 2,
    centsLimit: 3,
    isCancel: false,
    thousandsSeparator: false
  }

  currencyConfig: any = {
    prefix: '$',
    limit: 20,
    centsLimit: 2,
    isCancel: false,
    thousandsSeparator: ','
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditMarkupComponent>,
    private adminService: AdminService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  public countries = [
    { id: 1, name: "India" },
    { id: 2, name: "Pakistan" }
  ];

  public states = [
    { id: 1, name: "ap" },
    { id: 2, name: "telangana" }
  ];

  public statusSelection = [
    { id: 1, name: "Y" },
    { id: 0, name: "N" }
  ];

  ngOnInit() {
    this.createForm();
  }

  getCountries = () => {
  }

  getStates = () => {
  }

  createForm = () => {
    this.addressForm = this.fb.group({
      "name": this.data.row.name,
      "markup": [this.data.row.markup],
      "recover": [this.data.row.recover],
      "count_net": this.data.row.count_net,
      "xr_applicable": this.data.row.xr_applicable,
      "category": this.data.row.category_id,
      "category_name": this.data.row.category_name,
      "min_net": [this.data.row.min_net],
      "max_applied": [this.data.row.max_applied],
      "company_code": this.data.company_code,
      "org_id": this.data.org_id,
      "notes":''
    });
    this.addressForm.controls.category.valueChanges.subscribe(val => {
      this.updateCategoryName(val);
    });
    this.resetForm();
  }

  updateCategoryName(id) {
    const category = _.find(this.data.categories, ['id', Number(id)]);
    if(category) this.addressForm.patchValue({
      'category_name': category.name
    }, {emitEvent: false})
  }

  resetForm(){
    this.addressForm.get('markup').markAsTouched({ onlySelf: true });
    this.addressForm.get('recover').markAsTouched({ onlySelf: true });
    this.addressForm.get('min_net').markAsTouched({ onlySelf: true });
    this.addressForm.get('max_applied').markAsTouched({ onlySelf: true });
  }

  saveAddress = form => {
    this.submitted = true;
    this.addressForm.markAsPristine();
    if (form.valid) {
      this.addressForm.value['markup'] = parseFloat(this.addressForm.value['markup']);
      this.addressForm.value['recover'] = parseFloat(this.addressForm.value['recover']);
      this.addressForm.value['min_net'] = parseFloat(this.addressForm.value['min_net']);
      this.addressForm.value['max_applied'] = parseFloat(this.addressForm.value['max_applied']);
      this.adminService
        .saveApi(this.data.saveUrl, Object.assign({...{"ids": this.data.ids}, ...this.addressForm.value}))
        .then(res => {
          if (res.result.success) {
            this.submitted = false;
            this.dialogRef.close({ success: true, data: this.addressForm.value });
          }
        });
    }
  }

  closeDialog = () => {
    this.dialogRef.close();
  }

}
