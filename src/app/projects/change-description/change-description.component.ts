import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonService } from '@app/common/common.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

@Component({
  selector: 'app-change-description',
  templateUrl: './change-description.component.html',
  styleUrls: ['./change-description.component.scss']
})
export class ChangeDescriptionComponent implements OnInit {

  createFormGroup: FormGroup;
	submitted: boolean = false;
	duplicateError: String = '';
	serverError: String = '';
	aliasValidation: any = {};
  promise: any;
  public loader = true;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private snackbar: MatSnackBar,
		private dialogRef: MatDialogRef<ChangeDescriptionComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.createForm();
  }

  createForm = () => {
    this.createFormGroup = this.fb.group({
      description: this.data.description
    });
    this.loader = false;
	}

	closeDialog = () => {
		this.dialogRef.close();
	}

	saveDetails = form => {
		this.submitted = true;
		this.commonService.saveApi('createEstimate', {
      jobs_id: this.data.jobs_id,
      description: this.createFormGroup.value.description,
      distribution_id: this.data.distribution_id,
      id: this.data.estimate_id,
      type: 'overview'
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.dialogRef.close({success: true, description: this.createFormGroup.value.description});
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Estimate Description Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
        }
      });
	}

}
