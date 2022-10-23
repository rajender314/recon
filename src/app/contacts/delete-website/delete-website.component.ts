import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';

@Component({
  selector: 'app-delete-website',
  templateUrl: './delete-website.component.html',
  styleUrls: ['./delete-website.component.scss']
})
export class DeleteWebsiteComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DeleteWebsiteComponent>,
    public contactsService: ContactsService,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

  saveOrganization = () => {
    this.dialogRef.close({ success: true });
	}

}
