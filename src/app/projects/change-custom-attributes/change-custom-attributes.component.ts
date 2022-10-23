import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MAX_ALIASES } from '@app/shared/utility/dummyJson';
import { buildForm } from '@app/admin/admin.config';

@Component({
  selector: 'app-change-custom-attributes',
  templateUrl: './change-custom-attributes.component.html',
  styleUrls: ['./change-custom-attributes.component.scss']
})
export class ChangeCustomAttributesComponent implements OnInit {

  createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';
	serverError: String = '';
	maxAliases = MAX_ALIASES;
	aliasValidation: any = {};
  promise: any;
  public loader = true;

	constructor(
		private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<ChangeCustomAttributesComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
    this.getCustomAttrs();
  }
  
  getCustomAttrs(){
    this.loader = true;
    this.promise = this.adminService.getApi('estCustattributes', {
      id: this.data.estimate_id
    })
    .then(response => {
      this.promise = undefined;
      if (response.result.success) {
        this.data.formFields = response.result.data;
        this.loader = false;
        this.createForm();
      }
    })
    .catch(err => {
      this.promise = undefined;
    });
  }

	createForm = () => {
    let formObj = {};
    this.data.formFields.map((value)=>{
      if(value.key=='dropdown'){
        value['options'] = [];
        value.value.map((option, i)=>{
          value['options'].push({id: i, name: option});
        });
      }
      formObj[value.id] = value.form_save_values;
    });
    this.createFormGroup = this.fb.group(formObj);
	}

	closeDialog = () => {
		this.dialogRef.close();
	}

	saveDetails = form => {
		this.submitted = true;
		this.adminService.saveApi('createEstimate', {
      jobs_id: this.data.jobs_id,
      id: this.data.estimate_id,
      type: 'address',
      split_custom_attributes: form.value
    })
    .then(res => {
      if (res['result'] && res['result'].success) {
        this.dialogRef.close();
      }
    });
	}

}
