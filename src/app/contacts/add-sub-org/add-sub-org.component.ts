import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';

@Component({
  selector: 'app-add-sub-org',
  templateUrl: './add-sub-org.component.html',
  styleUrls: ['./add-sub-org.component.scss']
})
export class AddSubOrgComponent implements OnInit {

  public organizationForm: FormGroup;
  public submitted: boolean = false;
	public duplicateError: String = '';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddSubOrgComponent>,
    private contactsService: ContactsService,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.createForm();
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

  saveOrganization = form => {
    this.submitted = true;
    this.duplicateError = '';
    if (form.valid) {
      this.organizationForm.markAsPristine();
      this.submitted = false;
			this.contactsService.addSubOrganization(form.value)
				.then(response => {
					if (response.result.success) {
						this.dialogRef.close({ success: true, data: response.result.data });
					} else {
						this.duplicateError = response.result.data.trim();
					}
				})
		}
	}

  createForm = () => {
		this.organizationForm = this.fb.group({
      id: this.data.row.id,
      parent_id: this.data.org_id,
			name: [this.data.row.name, Validators.required]
		});
	}

}