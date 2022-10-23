import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-add-cost-code',
  templateUrl: './add-cost-code.component.html',
  styleUrls: ['./add-cost-code.component.scss']
})
export class AddCostCodeComponent implements OnInit {

  public formGroup: FormGroup;
  public submitted = false;
  public duplicateError = '';
  numberConfig: any = {
    prefix: '',
    suffix: '%',
    limit: 3,
    maxLimit: true,
    maxNumber: 100,
    isCancel: false,
    thousandsSeparator: false
  }

  public xr_codes = [
    { id: 1, name: '123' },
    { id: 2, name: '222' }
  ]

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private dialogRef: MatDialogRef<AddCostCodeComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.createForm();
    this.getXrCodes();
    this.numberConfig = this.data.params.numberConfig;
    if (this.data.item)
      this.setForm(this.data.item);
  }

  getXrCodes() {
    this.adminService.getApi('costCodesList',
      { search: 'xr', org_id: this.data.params.org_id, status: true }).then(response => {
        if (response.result.success) {
          this.xr_codes = response.result.data.items;
          if (this.data.item) {
            this.xr_codes.push({ id: this.data.item.cost_code_id,name:this.data.item.cost_code_name })
          }
        }
      });
  }

  percentageChange() {

  }

  close = () => {
    this.dialogRef.close();
  }

  save = form => {
    this.submitted = true;
    this.duplicateError = '';
    if (form.valid) {
      this.adminService.saveApi('saveCostTemplates',
        {
          ...this.data.params,
          ...form.value,
        }).then(response => {
          if (response.result.success) {
            this.dialogRef.close({ success: true, data: response.result.data });
          } else {
            this.duplicateError = response.result.data.trim();
          }
        });
    }
  }

  createForm = () => {
    this.formGroup = this.fb.group({
      cost_code_id: ['', Validators.required],
      name: ['', Validators.required],
      percentage: ['', Validators.required]
    });
  }

  setForm = (data) => {
    this.formGroup.patchValue({
      cost_code_id: data.cost_code_id,
      name: data.name,
      percentage: data.percentage
    });
  }

}
