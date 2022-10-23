import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';
var APP: any = window['APP'];

@Component({
  selector: 'app-add-organization',
  templateUrl: './add-organization.component.html',
  styleUrls: ['./add-organization.component.scss']
})
export class AddOrganizationComponent implements OnInit {

  public organizationForm: FormGroup;
  public submitted: boolean = false;
  public duplicateError: String = '';

  public organizations = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddOrganizationComponent>,
    private contactsService: ContactsService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.createForm();
    if (APP.permissions.system_access.vendor == 'edit') {
      this.organizations.push({ id: 3, name: "Vendor" });
    }
    if (APP.permissions.system_access.client == 'edit') {
      this.organizations.push({ id: 2, name: "Client" });
    }
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
      this.contactsService.addOrganization(form.value)
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
      org_type: ['', Validators.required],
      name: ['', Validators.required]
    });
  }

}
