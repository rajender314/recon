import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ContactsService } from '@app/contacts/contacts.service';

@Component({
  selector: 'app-add-contact',
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.scss']
})
export class AddContactComponent implements OnInit {

  public dropdown = [];
  public contactsForm: FormGroup;
  public submitted: boolean = false;
  public emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public phoneNumberPattern = /^[0-9]{10}$/;
  public mailListArray: FormArray;
  public numberListArray: FormArray;
  public deletedEmailArray = [];
  public deletedPhoneNumberArray = [];
  public duplicateError = false;
  public duplicateErrorMsg = '';

  numberConfig: any = {
    prefix: '',
    limit: 10,
    centsLimit: 0,
    isCancel: false,
    centsSeparator: false,
    thousandsSeparator: false
}

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddContactComponent>,
    private contactsService: ContactsService,
		@Inject(MAT_DIALOG_DATA) public data
  ) {
    
  }

  ngOnInit() {
    this.createForm();
  }
  createForm = () => {
    let emailsList = [],
    phoneNumberList = [];
    let fb = this.fb;

    if (this.data.row.emails && this.data.row.emails.length) {
        this.data.row.emails.map(function (value) {
            value.invalid = false;
            emailsList.push(fb.group(value));
        });
    } else {
        emailsList.push(fb.group({
            email: "",
            type: "Email",
            invalid: false
        }));
    }
    if (this.data.row.phone_numbers && this.data.row.phone_numbers.length) {
        this.data.row.phone_numbers.map(function (value) {
            phoneNumberList.push(fb.group(value));
            value.invalid = false;
        });
    } else {
        phoneNumberList.push(fb.group({
            phone: "",
            type: "Phone",
            invalid: false
        }));
    }
    this.contactsForm = this.fb.group({
      org_id: this.data.org_id,
      org_type: this.data.org_type,
      id: this.data.row.id,
      timezone: this.data.row.timezone,
      parent_org: this.data.row.parent_org,
      first_name: [this.data.row.first_name, Validators.required],
      last_name: [this.data.row.last_name, Validators.required],
      designations_id: [this.data.row.designations_id],
      departments_id: [this.data.row.departments_id],
      contact_types_id: [this.data.row.contact_types_id],
      primary_email: [this.data.row.primary_email, [Validators.required, Validators.pattern(this.emailPattern)]],
      emails: this.fb.array(emailsList),
      phone_numbers: this.fb.array(phoneNumberList),
      sub_orgs: [this.data.row.sub_orgs]
    });
    this.numberListArray = this.contactsForm.get('phone_numbers') as FormArray;
    this.mailListArray = this.contactsForm.get('emails') as FormArray;
    
  }

  saveContact = form => {
    this.submitted = true;
    let validForm = true;
    this.duplicateError = false;
    this.contactsForm.value.emails.map(function (value, index) {
        if (value != '' && value.invalid) {
            validForm = false;
        }else if(value.valid){ 
            validForm = true;
        }
    });

    this.contactsForm.value.phone_numbers.map(function (value, index) {
        if (value != '' && value.invalid) {
            validForm = false;
        }else if(value.valid){
            validForm = true;
        }
    });
    form.value.org_type = this.data.row.org_type;
    if (form.valid && validForm) {
        this.contactsForm.markAsPristine();
        this.submitted = false;
        this.contactsService.addContact(form.value)
        .then(response => {
            if (response.result.success) {
                this.dialogRef.close({ success: true, data: response.result.data });
            }else{
                this.duplicateError = true;
                this.duplicateErrorMsg = response.result.data;
            }
        });
    }
  }

  removeError(): void{
      this.duplicateError = false
  }
  
  addMail() {
      let formGroup: FormGroup = this.fb.group({
          type: "Email",
          email: ''
      });
      this.mailListArray.push(formGroup);
  }

  addNumber() {
      let formGroup: FormGroup = this.fb.group({
          type: "Phone",
          phone: ''
      });
      this.numberListArray.push(formGroup);

  }

  removeMail(index) {
      if (this.mailListArray.length > 1) {
          if (this.mailListArray.value[index].email_id) {
              this.deletedEmailArray.push(this.mailListArray.value[index].email_id);
          }
          this.mailListArray.removeAt(index);
      }
  }

  removeNumber(index) {
      if (this.numberListArray.length > 1) {
          if (this.numberListArray.value[index].phone_id) {
              this.deletedPhoneNumberArray.push(this.numberListArray.value[index].phone_id);
          }
          this.numberListArray.removeAt(index);
      }
  }

  emailValidation(event: any) {
      if (event.value.email == '' || this.emailPattern.test(event.value.email)) {
          event.value.invalid = false;
      } else {
          event.value.invalid = true;
      }
  }

  phoneNumberValidation(event: any, list: any) {
      let inputChar = String.fromCharCode(event.charCode);
    
      if (list.value.phone_number == '') {
          list.value.invalid = true;
      } else {
          list.value.invalid = false;
      }
      if (event.keyCode != 8 && !this.phoneNumberPattern.test(inputChar)) {
          event.preventDefault();
      }
  }
  phonenumber(event: any) {
      const pattern = /^[0-9-]*$/;
      let inputChar = String.fromCharCode(event.charCode);
      if (event.keyCode != 8 && !pattern.test(inputChar)) {
          event.preventDefault();
      }
  }

  closeDialog = () => {
		this.dialogRef.close();
  }

}
