import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { UsersService } from '@app/users/users.service';

import * as _ from 'lodash';
import { AdminService } from '@app/admin/admin.service';
import { ContactsService } from '@app/contacts/contacts.service';

@Component({
  selector: 'app-add-new-user',
  templateUrl: './add-new-user.component.html',
  styleUrls: ['./add-new-user.component.scss']
})
export class AddNewUserComponent implements OnInit {

  createFormGroup: FormGroup;
  public emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public phoneNumberPattern = /^[0-9]{10}$/;
  public mailListArray: FormArray;
  public numberListArray: FormArray;
  public deletedEmailArray = [];
  public deletedPhoneNumberArray = [];
  numberConfig: any = {
    prefix: '',
    limit: 10,
    centsLimit: 0,
    isCancel: false,
    centsSeparator: false,
    thousandsSeparator: false
  };
  public state = {
    submitted: false,
    errorMsg: '',
    searchForm: [
      { name: "first_name", type: "text", required: true, label: "First Name", value: "" },
      { name: "last_name", type: "text", required: true, label: "Last Name", value: "" },
      { name: "primary_email", type: "email", required: true, label: "Primary Email", value: "" }
    ],
    list: [
      { name: "first_name", type: "text", required: true, label: "First Name", value: "" },
      { name: "last_name", type: "text", required: true, label: "Last Name", value: "" },
      { name: "company", type: "select", label: "Company", value: "", options: "companies" },
      { name: "designation", type: "select", label: "Designation", value: "", options: "designations" },
      { name: "department", type: "select", label: "Department", value: "", options: "departments" },
      { name: "user_role", type:"select", label: "User Role", value: "", options: "user_roles" },
      { name: "clone_from", type:"select", label: "Clone Permissions From", value: "", options: "users" },
      { name: "client_access", type:"checkbox", label: "Client Access", value: false },
      { name: "primary_email", type: "email", required: true, label: "Primary Email", value: "" },
      { name: "email", type: "email", label: "Email", value: "", addMore: true }
    ],
    clientList: [
      { name: "first_name", type: "text", required: true, label: "First Name", value: "" },
      { name: "last_name", type: "text", required: true, label: "Last Name", value: "" },
      { name: "company", type: "select", label: "Company", value: "", options: "companies" },
      { name: "designation", type: "select", label: "Designation", value: "", options: "designations" },
      { name: "department", type: "select", label: "Department", value: "", options: "departments" },
      { name: "contacts_type", type: "select", label: "Contacts Type", value: "", options: "contact_types" },
      { name: "primary_email", type: "email", required: true, label: "Primary Email", value: "" },
      { name: "email", type: "email", label: "Email", value: "", addMore: true }
    ],
    vendorList: [
      { name: "first_name", type: "text", required: true, label: "First Name", value: "" },
      { name: "last_name", type: "text", required: true, label: "Last Name", value: "" },
      { name: "designation", type: "select", label: "Designation", value: "", options: "designations" },
      { name: "department", type: "select", label: "Department", value: "", options: "departments" },
      { name: "sub_categorization", type: "text", label: "Sub Categorization", value: "" },
      { name: "contacts_type", type: "select", label: "Contacts Type", value: "", options: "contact_types" },
      { name: "primary_email", type: "email", required: true, label: "Primary Email", value: "" },
      { name: "phone", type: "phone", label: "Phone", value: "", addMore: true }
    ],
    user_details: {
      is_user: 0
    },
    designations: [],
    departments: [],
    user_roles: [],
    companies: [],
    contact_types: [],
    users: [],
    org_id: false,
    addNewUser: true,
    createNewUser: false,
    createUserDisable: true
  };

  constructor(
    private fb: FormBuilder,
    private userService: UsersService,
    private dialogRef: MatDialogRef<AddNewUserComponent>,
    private usersService: UsersService,
    private adminService: AdminService,
    private contactsService: ContactsService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.getCompanyCodesList();
    Object.assign(this.state, this.data);
    this.createForm(this.state.searchForm);
  }

  getCompanyCodesList() {
    if (this.data.org_type == 2) {
      this.contactsService.getOrganizationsList({ org_type: 2, search: '' }).then(response => {
        if (response.result.success) {
          this.state.companies = response.result.data;
        }
      });
    } else {
      this.adminService
        .saveApi('getCompanyCodesList', {
          sort: 'asc',
          status: true,
          search: ''
        })
        .then(res => {
          if (res.result.success) {
            this.state.companies = res.result.data;
          }
        });
    }
  }

  createForm = (list) => {
    let formGroup = {
      org_type: this.data.org_type,
    };
    if (this.state.org_id) {
      formGroup['org_id'] = this.state.org_id;
    }
    if (this.state.addNewUser) {
      formGroup['is_contact'] = false;
    }
    _.map(list, (field) => {
      let fieldVal = '';
      if (this.createFormGroup && this.createFormGroup.value && this.createFormGroup.value[field.name]) {
        fieldVal = this.createFormGroup.value[field.name];
      } else {
        fieldVal = field.value;
      }

      if ((field.type == 'email' || field.type == 'phone') && field.addMore) {
        let emailsList = [],
          phoneNumberList = [];
        let fb = this.fb;
        emailsList.push(fb.group({
          email: "",
          type: "Email",
          invalid: false
        }));
        phoneNumberList.push(fb.group({
          phone: "",
          type: "Phone",
          invalid: false
        }));
        formGroup['emails'] = this.fb.array(emailsList);
        formGroup['phone_numbers'] = this.fb.array(phoneNumberList);
      } else if (field.required && field.type == 'email') {
        formGroup[field.name] = [fieldVal, [Validators.required, Validators.pattern(this.emailPattern)]];
      } else if (field.required) {
        formGroup[field.name] = [fieldVal, Validators.required];
      } else {
        formGroup[field.name] = fieldVal;
      }
    });
    this.createFormGroup = this.fb.group(formGroup);
    this.numberListArray = this.createFormGroup.get('phone_numbers') as FormArray;
    this.mailListArray = this.createFormGroup.get('emails') as FormArray;
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

  BackToAdd(stepper): void {
    this.state.createUserDisable = true;
    stepper.previous();
  }

  goToUser(): void {
    this.dialogRef.close({ success: true, data: this.state.user_details });
  }

  searchDetails(form: any, stepper: any): void {
    this.state.submitted = true;
    if (form.valid) {
      this.usersService.searchContact(form.value).then(response => {
        if (response.result.success) {
          this.state.user_details = response.result.data;
          this.state.user_details['org_type'] = this.data.org_type;
          this.state.addNewUser = false;
        } else {
          this.state.user_details = {
            is_user: 0
          };
          this.state.addNewUser = true;
        }
        this.state.submitted = false;
        stepper.next();
      });
    }
  }

  createUser(): void {
    this.state.createUserDisable = false;
  }

  createNewUser(form: any, stepper: any): void {
    if (this.data.org_type == 3) {
      this.createForm(this.state.vendorList);
    } else if(this.data.org_type == 2){
      this.createForm(this.state.clientList);
    } else {
      this.createForm(this.state.list);
    }
    this.state.createNewUser = true;
    stepper.next();
  }

  saveAsUser(): void {
    this.state.user_details['is_contact'] = true;
    this.usersService.addContactUser(this.state.user_details).then(response => {
      if (response.result.success) {
        this.state.submitted = false;
        this.dialogRef.close({ reload: true });
      }
    });
  }

  saveDetails = (form) => {
    this.state.submitted = true;
    let validForm = true;
    form.value.emails.map(function (value, index) {
        if (value != '' && value.invalid) {
            validForm = false;
        }else if(value.valid){ 
            validForm = true;
        }
    });

    form.value.phone_numbers.map(function (value, index) {
        if (value != '' && value.invalid) {
            validForm = false;
        }else if(value.valid){
            validForm = true;
        }
    });
    if (form.valid && validForm) {
      this.usersService.createUser(form.value).then(response => {
        if (response.result.success) {
          this.state.submitted = false;
          this.dialogRef.close({ reload: true });
        } else {
          this.state.errorMsg = response.result.data.trim();
        }
      });
    }
  }

}
