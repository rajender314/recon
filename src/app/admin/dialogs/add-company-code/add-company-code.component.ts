import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { AdminService } from "@app/admin/admin.service";
import { forkJoin } from 'rxjs';
import { StatusList } from '@app/shared/utility/dummyJson';

@Component({
  selector: 'app-add-company-code',
  templateUrl: './add-company-code.component.html',
  styleUrls: ['./add-company-code.component.scss']
})
export class AddCompanyCodeComponent implements OnInit {

  createFormGroup: FormGroup;
  submitted: boolean = false;
  duplicateError: String = '';
  formConfig: any = [
    { key: 'name', default: null, validations: { required: true } },
    { key: 'parentCompany', default: null, validations: { required: true } },
    { key: 'status', default: true, validations: { required: true } },
    { key: 'description', default: null },
    { key: 'job_prefix', default: null, validations: { required: true } },

    { key: 'allow_mio', default: null },
    { key: 'check_avalara', default: null },
    { key: 'corp_co', default: null, validations: { required: true } },
    { key: 'distribution_id', default: null, validations: { required: true } },
    { key: 'due_days', default: null, validations: { required: true } },
    { key: 'group_id', default: null, validations: { required: true } },
    { key: 'invoice_need', default: null },
    { key: 'net_push_gp', default: null },
    { key: 'po_actual_amount', default: null },
    { key: 'no_actual_use_po', default: null },
    { key: 'sync', default: null }
  ];
  syncOptions: any = [
    { id: 1, value: "Sync with LH" },
    { id: 2, value: "Sync with GP" },
    { id: 3, value: "Do not Sync" },
  ];
  numberConfig: any = {
    prefix: '',
    limit: 3,
    centsLimit: 0,
    isCancel: false,
    centsSeparator: false,
    thousandsSeparator: false
  };
  parentCompanyCodes = [
    { id: 1, name: "IVIE" }
  ];
  StatusFilter = StatusList;
  public distributionTypes = [];
  public groupTypes = [];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private dialogRef: MatDialogRef<AddCompanyCodeComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.createForm();
    if (this.data.name) this.setForm(this.data.name);
    this.getFormData();
  }

  getFormData() {
    this.duplicateError = '';
    forkJoin(
      this.adminService.getApi('distributionTypes', {}),
      this.adminService.getApi('getGroups', {})
    ).subscribe(data => {
      this.distributionTypes = [];
      this.groupTypes = [];
      if (data[0].result.success) {
        this.distributionTypes = data[0].result.data.items || [];
        if (this.distributionTypes.length) this.createFormGroup.patchValue({ distribution_id: this.distributionTypes[0].id });
      }
      if (data[1].result.success) {
        this.groupTypes = data[1].result.data.groups || [];
        if (this.groupTypes.length) this.createFormGroup.patchValue({ group_id: this.groupTypes[0].id });
      }
      this.createFormGroup.markAsPristine();
    });
  }

  createForm = () => {
    let obj = {
      id: ''
    };
    this.formConfig.map(field => {
      let validations = [];
      if (field.validations && Object.keys(field.validations).length) {
        if (field.validations.required) validations.push(Validators.required);
        if (field.validations.maxlength) validations.push(Validators.maxLength(field.validations.maxlength));
      }
      obj[field.key] = [field.default, validations];
    });
    this.createFormGroup = this.fb.group(obj);
  }

  // getter
  get f() { return this.createFormGroup.controls; }

  closeDialog = () => {
    this.dialogRef.close();
  }

  saveDetails = form => {
    this.submitted = true;
    this.duplicateError = '';
    if (form.valid) {
      this.adminService.saveApi('saveCompanyCodeDetails', form.value)
        .then(response => {
          if (response.result.success) {
            this.dialogRef.close({ success: true, data: response.result.data });
          } else {
            this.duplicateError = response.result.data.trim();
          }
        });
    }
  }

  removeDuplicate() {
    this.duplicateError = '';
  }

  setForm = name => {
    this.createFormGroup.patchValue({
      name: name
    });
    this.createFormGroup.markAsDirty();
  }

}
