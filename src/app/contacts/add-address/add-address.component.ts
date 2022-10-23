import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';
import { DeleteComponent } from '@app/admin/dialogs/delete/delete.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-add-address',
  templateUrl: './add-address.component.html',
  styleUrls: ['./add-address.component.scss']
})
export class AddAddressComponent implements OnInit {

  public addressForm: FormGroup;
  public submitted: boolean = false;
  public confirmationRef: any;
  public selected: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<AddAddressComponent>,
    private contactsService: ContactsService,
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

  ngOnInit() {
    this.selected = this.contactsService.getOrganization();
    this.createForm();
    this.getCountries();
  }

  getCountries = () => {
    this.contactsService.getCountries()
      .then(response => {
        if (response.result.success) {
          this.countries = response.result.data;
          this.getStates(this.data.row.country_id);
        }
      })
  }

  getStates = (countryId?) => {
    this.contactsService.getStates({ id: countryId || this.addressForm.value.country })
      .then(response => {
        if (response.result.success) {
          this.states = response.result.data;
          if (this.data.isEdit) {
            this.addressForm.patchValue({
              state: this.data.row.state_id
            });
          } else if (this.states.length) {
            this.addressForm.patchValue({
              state: this.states[0].id
            });
          }
        }
      })
  }

  createForm = () => {
    this.addressForm = this.fb.group({
      id: this.data.row.id,
      org_id: this.data.org_id,
      default_shipping: this.data.row.default_shipping == '1' ? true : false,
      address_type: [this.data.row.address_type_id],
      address1: [this.data.row.address1, Validators.required],
      address2: [this.data.row.address2],
      city: [this.data.row.city],
      state: [this.data.row.state_id],
      country: [this.data.row.country_id],
      postal_code: [this.data.row.postal_code]
    });
  }

  changeDefaultAddress() {
    //this.data.defaultShippingId
    // if(this.addressForm.value.default_shipping)
    if (this.data.defaultShippingId != '' && this.data.defaultShippingId != this.addressForm.value.id && this.addressForm.controls['default_shipping'].value) {
      this.confirmationRef = this.dialog.open(ConfirmationComponent, {
        panelClass: 'my-dialog',
        width: '500px',
        data: {
          title: 'Change Default Address',
          content: 'Are you sure you want to change default Shipping Address?',
          buttons: {
            no: "Cancel",
            yes: "Change Default Address"
          }
        }
      });

      this.confirmationRef.afterClosed().subscribe(result => {
        if (result && result.success) {
        } else {
          this.addressForm.controls['default_shipping'].setValue(false);
        }
      });
    }
    // this.addressForm.controls['default_shipping'].setValue(true);
  }

  saveAddress = form => {
    this.submitted = true;
    if (form.valid) {
      this.addressForm.markAsPristine();
      this.submitted = false;
      this.contactsService.addAddress(form.value)
        .then(response => {
          if (response.result.success) {
            this.dialogRef.close({ success: true, data: response.result.data[0] });
          }
        });
    }
  }

  closeDialog = () => {
    this.dialogRef.close();
  }

}
