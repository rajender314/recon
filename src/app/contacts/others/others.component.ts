import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ContactsService } from '@app/contacts/contacts.service';
import * as _ from 'lodash';

import { MatSnackBar, MatDialog } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { AddBookKeeperComponent } from '@app/contacts/add-book-keeper/add-book-keeper.component';
import { forkJoin } from 'rxjs';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';

var APP = window['APP'];

@Component({
  selector: 'app-others',
  templateUrl: './others.component.html',
  styleUrls: ['./others.component.scss']
})
export class OthersComponent implements OnInit {

  public othersForm: FormGroup;
  @Input() organization;
  @Input() users;

  priceConfig: any = {
    prefix: '$',
    limit: 10,
    centsLimit: 2,
    isCancel: false
  }

  numberConfig: any = {
    prefix: '',
    limit: 3,
    centsLimit: 0,
    isCancel: false,
    centsSeparator: false
  }

  public state = {
    organization: {},
    loader: true,
    editable: true,
    attributes: [
      { "id": "3", "name": "Pending Credit Approval", selected: false },
      { "id": "4", "name": "This Organization is a Client Vendor", selected: false },
      { "id": "222", "name": "Looks PO's in final invoice", selected: false }
    ],
    // list: [
    //   {id: 1, is_editable: false, section: [
    //     {id:1, name: "job_no_prefix", label: "Job No Prefix", value: "ALC"},
    //   ]},
    //   {id: 2, is_editable: true, section: [
    //     {id:1, name: "final_bill_due_date", type: "number", label: "Final Bill Due Date", value: "5", suggestion: " days from delivery date"},
    //   ]},
    //   {id: 3, is_editable: true, section: [
    //     {id:1, name: "account_dir", type: "select", label: "Account Director", value: "Abby Rice", options: "users"},
    //     {id:2, name: "account_vp", type: "select", label: "Account VP", value: "Abby Rice", options: "users"},
    //     {id:3, name: "tax", type: "readonly", label: "Tax", value: "7.500%"},
    //   ]},
    //   {id: 4, is_editable: true, section: [
    //     {id:1, name: "prebill_task", type: "select", label: "Prebill Task", value: "1st Proof", options: "tasks"},
    //     {id:2, name: "threshold", type: "currency", label: "Threshold", value: "$0.00"},
    //     {id:3, name: "book_keeper", type: "select", addMore: true, label: "Bookkeeper", value: "Abby Rice", options: "users", dataObj: ["company_codes", "users"], selectors: [
    //       {id: 1, type: "select", name: "company_codes", options: [
    //         { value: "BuzzShift", type: "company_codes"},
    //         { value: "Abby Rice", type: "users"}
    //       ]},
    //       {id: 2, type: "select", name: "company_codes", options: [
    //         { value: "BuzzShift", type: "company_codes"},
    //         { value: "Abby Rice", type: "users"}
    //       ]}
    //     ]},
    //   ]},
    //   {id: 5, is_editable: true, section: [
    //     {id:1, name: "default_company_code", type: "select", label: "Default Company Code", value: "BuzzShift", options: "company_codes"}
    //   ]}
    // ],
    list: [],
    company_codes: [
      { id: 5, label: "Blueleaf Digital, LLC" },
      { id: 11, label: "BuzzShift" },
      { id: 10, label: "CLM" },
      { id: 16, label: "Dev Team" },
      { id: 3, label: "Graphic Image" },
      { id: 7, label: "GreenLeaf" }
    ],
    tasks: [
      { id: 1, label: "1st Proof" },
      { id: 2, label: "2nd Proof" },
      { id: 3, label: "3602 Reports Due" },
      { id: 4, label: "3rd Proof" },
      { id: 5, label: "Account Management" }
    ],
    users: [
      { id: 1, label: "Abbi Harlin" },
      { id: 2, label: "Abby Rice" },
      { id: 3, label: "Adam Gudgeon" },
      { id: 4, label: "Adam Oldham" },
      { id: 5, label: "Al Chabayta" }
    ]
  };

  public dialogRef: any;

  constructor(
    private fb: FormBuilder,
    public contactsService: ContactsService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.getApiCalls();
  }

  ngOnChanges() {
    if (this.organization) {
      this.state.organization = Object.assign([], this.organization);
      if (this.state.organization['org_type'] == 2) {
        this.state.editable = APP.permissions.system_access.client == 'edit';
      } else if (this.state.organization['org_type'] == 3) {
        // IF current route is a vendor
        this.state.editable = APP.permissions.system_access.vendor == 'edit';
      }
      this.getOthersData();
    }
    if (this.users) {
      this.state.users = Object.assign([], this.users);
      this.state.users.map(o => {
        o['name'] = o.label;
      })
    }
  }

  getApiCalls() {
    forkJoin(
      this.contactsService.getApi('getTasks', { page: 1, pageSize: 1000, sort: 'asc', status: true, is_milestone: 1 }),
      this.contactsService.getApi('getCompanyCodes', { page: 1, pageSize: 1000, status: true, sort: 'asc' })
    )
      .subscribe(([res1, res2]) => {
        if (res1.result.success) this.state.tasks = res1.result.data.items || [];
        if (res2.result.success) this.state.company_codes = (res2.result.data.items && res2.result.data.items.length) ? (res2.result.data.items[0].children || []) : [];
      })
  }

  ngOnInit() {
    // this.getOthersData();
  }

  editSection(section): void {
    section.edit = true;
  }

  editSectionValue(section, field): void {
    section.edit = true;
    this.othersForm.controls['show_' + field].patchValue(true);
    // field = true;
  }

  editSectionValuePop(field): void {
    this.dialogRef = this.dialog.open(AddBookKeeperComponent, {
      panelClass: 'recon-dialog',
      width: '678px',
      data: {
        title: 'Book Keeper',
        field: field,
        state: this.state,
        form: this.othersForm
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.save(this.othersForm, field.name);
      } else {
        this.resetForm();
      }
    });
  }

  cancelChanges(section): void {
    this.resetForm();
    section.edit = false;
  }

  resetForm(): void {
    this.createForm();
  }

  checkAlphaNumeric(e) {
    let formVal = this.othersForm.controls[e].value;
    this.othersForm.controls[e].patchValue(formVal.replace(/\W*/g, '').replace(/_*/g, ''));
  }

  save(form, fieldName): void {
    if (this.state.editable) {
      let postData = {};
      this.state.list.map((section) => {
        section.map(function (group) {
          group.section.map(function (field) {
            postData[field.name] = form.value[field.name];
            if (field.addMore) {
              postData[field.name + "_array"] = form.value[field.name + "_array"];
            }
          }.bind(this));
        }.bind(this));
      });
      _.find(this.state.attributes, function (group) {
        group.selected = form.value['attributes[' + group.id + ']'];
      });
      postData['attributes'] = this.state.attributes;
      postData['org_id'] = this.state.organization['id'];
      postData['org_type'] = this.state.organization['org_type'];
      this.contactsService.saveClientOthers(postData)
        .then(response => {
          if (fieldName)
            this.othersForm.controls['show_' + fieldName].patchValue(false);
          if (response.result.success) {
            this.snackbar.openFromComponent(SnackbarComponent, {
              data: { status: 'success', msg: 'Others Tab Details Updated Successfully' },
              verticalPosition: 'top',
              horizontalPosition: 'right'
            });
            this.state.list = response.result.data.list;
            this.state.attributes = response.result.data.attributes;
          }
        });
    }
  }

  addBookKeeper(): void {
    this.othersForm.markAsDirty();
    this.state['book_keeper_array'].push(this.fb.group({
      company_codes: '',
      users: ''
    }));
  }

  removeBookKeeper(index): void {
    this.othersForm.markAsDirty();
    let webIndex = 0;
    _.find(this.state['book_keeper_array'].value, function (o, i) {
      if (i == index) {
        webIndex = i;
      }
    });
    this.state['book_keeper_array'].removeAt(webIndex);
  }

  getSelectionData(list, value, type): any {
    return _.find(this.state[list], { id: Number(value) });
  }

  getSelectionLable(type): any {
    switch (type) {
      case 'company_codes':
        return 'Company Code';
      case 'users':
        return 'Bookkeeper';
    }
  }

  createForm(): void {
    let formGroup = {};
    this.state.list.map((section) => {
      section.map(function (group) {
        group.section.map(function (field) {
          if (field.required) {
            formGroup[field.name] = [field.value, Validators.required];
            formGroup['show_' + field.name] = false;
          } else {
            if (field.type == 'select') {
              if (!field.value) {
                formGroup[field.name] = this.state[field.options][0].id;
                formGroup['show_' + field.name] = false;
              } else {
                formGroup[field.name] = field.value;
                formGroup['show_' + field.name] = false;
              }
            } else {
              formGroup[field.name] = field.value;
              formGroup['show_' + field.name] = false;
            }
          }
          let selectGroup = [];
          if (field.addMore) {
            field.selectors.map(function (select) {
              let selectObj = {};
              select.options.map(function (option) {
                selectObj[option.type] = option.value;
              });
              selectGroup.push(this.fb.group(selectObj));
            }.bind(this));
            formGroup[field.name + "_array"] = this.fb.array(selectGroup);
          }
        }.bind(this));
      }.bind(this));
    });
    this.state.attributes.map(function (group) {
      formGroup['attributes[' + group.id + ']'] = group.selected ? true : false;
    });
    this.othersForm = this.fb.group(formGroup);
    for (let key in this.othersForm.value) {
      if (Array.isArray(this.othersForm.value[key])) {
        this.state[key] = this.othersForm.get(key) as FormArray;
      }
    }
  }

  getOthersData(): void {
    this.state.loader = true;
    this.contactsService.getOrgOthers({
      org_id: this.state.organization['id'],
      org_type: this.state.organization['org_type']
    }).then(response => {
      if (response.result.success) {
        this.state.list = response.result.data.list;
        this.state.attributes = response.result.data.attributes;
        this.createForm();
        this.state.loader = false;
      }
    });
  }

  resetFinalDueDate(form, field) {
    const confirmationRef = this.dialog.open(ConfirmationComponent, {
      panelClass: 'my-dialog',
      width: '500px',
      data: {
        title: 'Change Final Bill Due Date',
        content: 'Are you sure you want to revert Final Bill Due Date to previous value?',
        buttons: {
          no: "Cancel",
          yes: "Change Final Bill Due Date"
        }
      }
    });

    confirmationRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        let value = field['oldValue'] || field.value;
        form.get(field.name).setValue(value);
        this.save(form, field.name)
      }
    });
  }
}
