import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss']
})
export class DeleteComponent implements OnInit {

  public deleteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DeleteComponent>,
    public contactsService: ContactsService,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.createForm();
  }

  createForm = () => {
		this.deleteForm = this.fb.group({
      id: this.data.id,
      org_id: this.data.org_id
		});
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

  saveOrganization = () => {
      this.contactsService.deleteApi(this.data.call, this.deleteForm.value)
      .then(response => {
        if (response.result.success) {
          this.dialogRef.close({ success: true, data: response.result.data });
        }
      })
	}

}
