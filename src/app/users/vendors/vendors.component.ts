import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ContactsService } from '@app/contacts/contacts.service';
import * as _ from 'lodash';
import { UsersService } from '@app/users/users.service';

import { MatSnackBar, MatDialog } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { AddNewUserComponent } from '@app/users/add-new-user/add-new-user.component';
import { UploaderComponent } from '@app/shared/components/uploader/uploader.component';
import { StatusFilter } from '@app/shared/utility/dummyJson';
var APP: any = window['APP'];
@Component({
  selector: 'app-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['../users.component.scss', './vendors.component.scss']
})
export class VendorsComponent implements OnInit {
  public duplicateError = false;
  public duplicateErrorMsg = '';
  public ivieForm: FormGroup;
  public emailPattern = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  public submitted: boolean = false;
  public dialogRef: any;
  dropdowns = {
    jobAccess: [
      { label: 'Job Access', key: 'name' },
      { label: 'Job Specific to User', key: 'job_specific_user' },
      { label: 'Job Specific to Others', key: 'job_specific_others' },
    ],
    headers: [
      { label: 'Access', key: 'name' },
      { label: 'Permission', key: 'options' }
    ]
  };
  public phoneNumberPattern = /^[0-9]{10}$/;

  public phoneNumberConfig: any = {
    prefix: '',
    limit: 10,
    centsLimit: 0,
    isCancel: false,
    centsSeparator: false,
    thousandsSeparator: false
  }

  public mailListArray: FormArray;
  public numberListArray: FormArray;
  public deletedEmailArray = [];
  public deletedPhoneNumberArray = [];

  public emailAddressTypes = [
    { id: "Email", name: "Email" },
    { id: "Work", name: "Work Email" }
  ];
  public phoneNumberTypes = [
    { id: "Phone", name: "Phone" },
    { id: "Fax", name: "Fax" },
    { id: "Mobile", name: "Mobile" }
  ];
  public state = {
    loader: true,
    detailsLoader: true,
    showDetail: false,
    leftNavList: [],
    totalleftNavList: [],
    perPage: 25,
    leftNavCount: 0,
    statusFilter: StatusFilter,
    selectedFilter: { label: "Active", value: "true" },
    tabs: [
      { id: 0, label: "User Roles", displayLabel: "User Roles", show: (APP.permissions.system_access.user_roles == 'yes') ? true : false, route: "users/user_roles" },
      { id: 1, label: "Ivie", displayLabel: "Ivie Users", show: (APP.permissions.system_access.ivie_users == 'yes') ? true : false, route: "users/ivie" },
      { id: 2, label: "Clients", displayLabel: "Clients", show: (APP.permissions.system_access.client_users == 'yes') ? true : false, route: "users/clients" },
      { id: 3, label: "Vendors", displayLabel: "Vendors", show: (APP.permissions.system_access.vendor_users == 'yes') ? true : false, route: "users/vendors" }
    ],
    selectedTab: { id: 3, label: "Vendors", displayLabel: "Vendors", route: "users/vendors" },
    selectedItem: {
      logo: '',
      name: '',
      status: false,
      css: ''
    },
    detailTabs: [
      { label: "Contact Profile", type: 0 },
      { label: "System Access", type: 1, method: 'system_access' }
    ],
    activeTab: { label: "Contact Profile", type: 0 },
    search: {
      placeHolder: "Search",
      value: ''
    },
    searchList: [],
    contact_profile: [
      {
        id: 1, is_editable: true, section: [
          { id: 1, name: "name", type: "text", label: "Name", value: "Abbi Harli" },
          { id: 1, name: "company", type: "select", label: "Company", value: "Ivie USA", options: "companies" },
          { id: 1, name: "designation", type: "select", label: "Designation", value: "A/P Coordinator", options: "designations" },
          { id: 1, name: "department", type: "select", label: "Department", value: "Bentonville Creative/Production", options: "departments" },
          { id: 1, name: "user_role", type: "select", label: "User Role", value: "HDFC", options: "user_roles" },
          { id: 1, name: "primary_email", type: "text", label: "Primary Email", value: "admin@gmail.com" },
        ]
      }
    ],
    companies: [
      { id: "1", name: "Ivie USA" },
      { id: "2", name: "Ivie Asia" },
      { id: "3", name: "Graphic Image" },
      { id: "5", name: "Blueleaf Digital, LLC" },
      { id: "7", name: "GreenLeaf" },
      { id: "8", name: "Ivie Test" },
      { id: "9", name: "RD&F" },
      { id: "10", name: "CLM" },
      { id: "11", name: "BuzzShift" }
    ],
    designations: [
      { id: "5", name: "A/P Coordinator" },
      { id: "282", name: "A/R Coordinator" },
      { id: "795", name: "Account Development Director" },
      { id: "794", name: "Account Development Manager" },
      { id: "923", name: "Accounting chief executive" },
      { id: "276", name: "Accounting Director" },
      { id: "19", name: "Accounting Manager" },
      { id: "713", name: "Advertising Coordinator" },
      { id: "817", name: "Advertising Director" },
      { id: "323", name: "Advertising Manager" },
      { id: "707", name: "Advertising Specialist" }
    ],
    contact_types: [],
    departments: [
      { id: "50", name: "Bentonville Creative/Production" },
      { id: "59", name: "Boise Creative" },
      { id: "14", name: "Business Development" },
      { id: "60", name: "BuzzShift" },
      { id: "35", name: "Call Center" },
      { id: "18", name: "China Printing Solutions" },
      { id: "5", name: "Client Services" },
      { id: "20", name: "Communications" },
      { id: "2", name: "Corporate Services" },
      { id: "1", name: "Creative" }
    ],
    user_roles: [],
    permissions: {}
  };

  constructor(
    private fb: FormBuilder,
    public usersService: UsersService,
    public contactsService: ContactsService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getDropDownMaster();
  }

  changeFilter(status: any): void {
    this.state.selectedFilter = status;
    this.getLeftNavData();
  }

  getDropDownMaster = () => {
    this.contactsService.getDropdownMaster({ org_type: 3, status: true }).then(response => {
      if (response.result.success) {
        this.state.departments = response.result.data.departments || [];
        this.state.designations = response.result.data.designations || [];
        this.state.contact_types = response.result.data.contact_types || [];
        this.usersService.userRolesDp({ flag: 'dropdown', status: true }).then(response => {
          if (response.result.success) {
            this.state.user_roles = response.result.data || [];
            this.getLeftNavData();
          }
        });
      }
    });
  }

  getSelectionData(list, value): any {
    return _.find(this.state[list], function (item) { return String(item.id) == String(value) });
  }

  setActiveTab(tab): void {
    this.state.detailsLoader = true;
    this.state.activeTab = tab;
    setTimeout(() => {
      if (tab.type == 0) {
        this.createForm();
      } else if (tab.type == 1) {
        this.getPermissions(tab.method);
      } else {
        this.state.detailsLoader = false;
      }
    }, 500);
  }

  saveRoleUsers(form: any): void {
    this.submitted = true;
    if (form.valid) {
      let params = {};
      let method = this.state.activeTab['method'];
      params['user_id'] = this.state.selectedItem['contact_id'];
      params['userrole_id'] = this.state.selectedItem['user_role'];
      params['org_type'] = 3;
      params['method'] = method;
      params[method] = form.value[method];
      this.usersService.saveVendorSystemAccess(params).then(response => {
        if (response.result.success) {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Permissions Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          this.submitted = false;
          this.roleUsers();
        }
      });
    }
  }

  onSearch(event: any): void {
    this.state.search.value = event;
    this.getUsersList();
    /*if(event!=''){
      _.filter(this.state.totalleftNavList, function(o){
        if(o.name.toLowerCase().indexOf(event.toLowerCase())==-1){
          o.search = true;
        }else{
          o.search = false;
        }
      });
    }else{
      _.filter(this.state.totalleftNavList, function(o){
        o.search = false;
      });
    }
    this.state.searchList = _.filter(this.state.totalleftNavList, {search: false});
    this.state.leftNavList = [];
    this.appendUsers();
    if(this.state.searchList.length){
        this.getSelectedUser(this.state.searchList[0]);
    }else{
        this.getSelectedUser({});
    }*/
  }

  getSelectedTab(tab): void {
    this.state.selectedTab = tab;
    this.getLeftNavData();
  }

  getLeftNavData(): void {
    this.getUsersList();
  }

  hideDetails(): void {
    this.state.showDetail = false;
  }

  showDetails(): void {
    this.state.showDetail = true;
  }

  getSelectedUser(item: any): void {
    this.state.detailsLoader = true;
    this.state.selectedItem = item;
    if (item && item.css == 'user') {
      this.usersService.getUserData({
        id: item['contact_id'],
        org_type: 3
      }).then(response => {
        if (response.result.success) {
          this.state.contact_profile = response.result.data;
          if (this.state.activeTab.type == 0) {
            this.createForm();
          } else if (this.state.activeTab.type == 1) {
            this.getPermissions(this.state.activeTab['method']);
          } else {
            this.state.detailsLoader = false;
          }
        }
      });
    } else if (item) {
      this.state.activeTab = { label: "Contact Profile", type: 0 };
      this.usersService.getOrgGroups({
        org_id: item['id']
      }).then(response => {
        if (response.result.success) {
          this.state.contact_profile = response.result.data;
          this.createForm();
          this.state.detailsLoader = false;
        }
      });
    } else {
      this.state.activeTab = { label: "Contact Profile", type: 0 };
      this.state.detailsLoader = false;
    }
  }

  appendUsers(): void {
    let data = this.state.totalleftNavList.slice(this.state.leftNavList.length, this.state.leftNavList.length + this.state.perPage);
    this.state.leftNavList = this.state.leftNavList.concat(data);
  }

  onScroll(): void {
    if (this.state.leftNavList.length < this.totalCount && this.totalCount != 0) {
      this.appendUsers();
    }
  }

  createForm(): void {
    let method = this.state.activeTab['method'];
    if (!this.state.activeTab['method']) {
      let formGroup = {
        id: (this.state.selectedItem['css'] == 'user' ? this.state.selectedItem['contact_id'] : this.state.selectedItem['id']),
      };
      let emailsList = [],
        phoneNumberList = [];
      let fb = this.fb;
      this.state.contact_profile.map(function (group) {
        if (group.emails && group.emails.length) {
          group.emails.map(function (value) {
            value.invalid = false;
            emailsList.push(fb.group(value));
          });
        } else {
          if (this.state.selectedItem.css == 'user')
            emailsList.push(fb.group({
              email: "",
              type: "Email",
              invalid: false
            }));
        }
        if (group.phone_numbers && group.phone_numbers.length) {
          group.phone_numbers.map(function (value) {
            phoneNumberList.push(fb.group(value));
            value.invalid = false;
          });
        } else {
          if (this.state.selectedItem.css == 'user')
            phoneNumberList.push(fb.group({
              phone: "",
              type: "Phone",
              invalid: false
            }));
        }
        group.section.map(function (field) {
          if (field.addMore) {
            let selectGroup = [];
            field.selectors.map(function (select) {
              let selectObj = {};
              select.options.map(function (option) {
                selectObj[option.type] = option.value;
              });
              selectGroup.push(this.fb.group(selectObj));
            }.bind(this));
            formGroup[field.name] = this.fb.array(selectGroup);
          } else {
            if (field.required) {
              if (field.type == 'email') {
                formGroup[field.name] = [field.value, [Validators.required, Validators.pattern(this.emailPattern)]];
              } else {
                formGroup[field.name] = [field.value, Validators.required];
              }
            } else {
              formGroup[field.name] = field.value;
            }
          }
        }.bind(this));
      }.bind(this));
      formGroup['emails'] = this.fb.array(emailsList);
      formGroup['phone_numbers'] = this.fb.array(phoneNumberList);
      this.ivieForm = this.fb.group(formGroup);
      this.numberListArray = this.ivieForm.get('phone_numbers') as FormArray;
      this.mailListArray = this.ivieForm.get('emails') as FormArray;
      this.state.detailsLoader = false;
    } else {
      let controls = {}, groupControl;
      this.state.permissions[method][0].items.map(item => {
        controls[item.key] = '';
        if (item.children && item.children.length)
          controls = { ...controls, ...this.createChildControls(item.children) };
      });
      this.ivieForm.addControl(method, this.fb.group(controls));
    }
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

  createChildControls = items => {
    let controls = {};
    items.map(item => {
      controls[item.key] = '';
      if (item.radio_group && item.radio_group.length) {
        controls[item.key + '_option'] = '';
      }
      if (item.children && item.children.length) {
        controls = { ...controls, ...this.createChildControls(item.children) }
      }
    })

    return controls;
  }

  editSection(section): void {
    section.edit = true;
  }

  cancelChanges(section): void {
    this.resetForm();
    section.edit = false;
    this.submitted = false;
    this.duplicateError = false;
  }

  resetForm(): void {
    this.state.detailsLoader = true;
    if (this.state.activeTab.type == 0) {
      this.createForm();
    } else if (this.state.activeTab.type == 1) {
      this.getPermissions(this.state.activeTab['method']);
    } else {
      this.state.detailsLoader = false;
    }
  }

  removeDuplicateError(): void {
    this.duplicateError = false;
    this.duplicateErrorMsg = '';
  }

  /* set default value for generated controls */
  setDefaultValues = prop => {
    let value = {};
    if (prop == 'job_access' && this.state.permissions[prop]) {
      this.state.permissions[prop][0].items.map(item => {
        if (item.cells) {
          value[item.key] = {};
          item.cells.map(cell => {
            value[item.key][cell.key] = cell.options[0].value;
          })
        }
      });
      this.state.permissions[prop][1].items.map(item => {
        if (item.type == 'radio' || item.type == 'select') value[item.key] = item.options.length == 3 ? item.options[0].value : item.options[1].value;
        else if (item.type == 'checkbox') value[item.key] = false;
        else if (item.type == 'textbox') value[item.key] = '';
        if (item.children && item.children.length)
          value = { ...value, ...this.setChildrenDefaultValues(item.children) };
      })
    } else if (prop && this.state.permissions[prop]) {
      this.state.permissions[prop][0].items.map(item => {
        value[item.key] = item.options.length == 3 ? item.options[0].value : item.options[1].value;
        if (item.children && item.children.length)
          value = { ...value, ...this.setChildrenDefaultValues(item.children) };
      })
    }
    return value;
  }

  setChildrenDefaultValues = items => {
    let value = {};
    items.map(item => {
      if (item.type == 'radio' || item.type == 'select') value[item.key] = item.options.length == 3 ? item.options[0].value : item.options[1].value;
      else if (item.type == 'checkbox') value[item.key] = false;
      else if (item.type == 'textbox') value[item.key] = '';
      if (item.radio_group && item.radio_group.length)
        value[item.key + '_option'] = item.radio_group[0].key;
      if (item.children && item.children.length)
        value = { ...value, ...this.setChildrenDefaultValues(item.children) };
    })
    return value;
  }

  setForm = data => {
    this.ivieForm.patchValue({
      id: this.state.selectedItem['contact_id'],
      job_access: data.job_access || this.setDefaultValues('job_access'),
      system_access: data.system_access || this.setDefaultValues('system_access'),
      external_apps: data.external_apps || this.setDefaultValues('system_access')
    });
  }

  roleUsers(): void {
    this.usersService.getVendorSystemAccess({ method: this.state.activeTab['method'], user_id: this.state.selectedItem['contact_id'], org_type: 3 }).then(response => {
      if (response.result.success) {
        this.setForm(response.result.data);
      }
    });
  }

  getPermissions = method => {
    if (Object.keys(this.state.permissions).length) {
      if (this.state.permissions[method] && Object.keys(this.state.permissions[method]).length) {
        this.createForm();
        this.state.detailsLoader = false;
        this.roleUsers();
        return;
      }
    }
    this.state.detailsLoader = true;
    this.usersService.getPermissions({ method: method, id: this.state.selectedItem['contact_id'], org_type: 3 })
      .then(res => {
        if (res.result.success) {
          this.state.permissions[method] = res.result.data.items;
          this.createForm();
          this.state.detailsLoader = false;
          this.roleUsers();
        }
      });
  }

  save(form, section): void {
    this.submitted = true;
    if (form.valid) {
      if (this.state.selectedItem['css'] == 'user') {
        this.usersService.saveUser({...form.value, ...{org_type: 3}})
          .then(response => {
            if (response.result.success) {
              this.snackbar.openFromComponent(SnackbarComponent, {
                data: { status: 'success', msg: 'User Details Updated Successfully' },
                verticalPosition: 'top',
                horizontalPosition: 'right'
              });
              section.edit = false;
              this.submitted = false;
              this.state.contact_profile = response.result.data;
              this.createForm();
              this.state.detailsLoader = false;
              this.state.selectedItem['name'] = form.value.first_name + " " + form.value.last_name;
              this.state.selectedItem['user_role'] = form.value.user_role;
            } else {
              this.duplicateError = true;
              this.duplicateErrorMsg = response.result.data;
            }
          });
      } else {
        this.usersService.updateOrgGroups(form.value)
          .then(response => {
            if (response.result.success) {
              this.snackbar.openFromComponent(SnackbarComponent, {
                data: { status: 'success', msg: 'User Details Updated Successfully' },
                verticalPosition: 'top',
                horizontalPosition: 'right'
              });
              section.edit = false;
              this.submitted = false;
              this.state.contact_profile = response.result.data;
              this.createForm();
              this.state.detailsLoader = false;
            } else {
              this.duplicateError = true;
              this.duplicateErrorMsg = response.result.data;
            }
          });
      }
    }
  }

  addUser(): void {
    this.dialogRef = this.dialog.open(AddNewUserComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      data: {
        title: "Add User",
        departments: this.state.departments,
        designations: this.state.designations,
        user_roles: this.state.user_roles,
        org_type: this.state.selectedTab.id,
        contact_types: this.state.contact_types,
        org_id: (this.state.selectedItem['org_id'] ? this.state.selectedItem['org_id'] : this.state.selectedItem['parent_id'] != 0 ? this.state.selectedItem['parent_id'] : this.state.selectedItem['id']),
        users: [],
        emailAddressTypes: this.emailAddressTypes,
        phoneNumberTypes: this.phoneNumberTypes
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.getSelectedUser(result.data);
      } else if (result && result.reload) {
        this.getUsersList();
      }
    });
  }

  totalCount: number = 0;
  getUsersList(): void {
    this.state.loader = true;
    this.state.detailsLoader = true;
    this.usersService.getUsers({
      org_type: this.state.selectedTab.id,
      search: this.state.search.value,
      status: this.state.selectedFilter.value,
      count: true
    }).then(response => {
      if (response.result.success) {
        this.state.totalleftNavList = response.result.data.org_users;
        this.totalCount = this.state.totalleftNavList.length;
        this.state.leftNavCount = response.result.data.count;
        this.state.leftNavList = this.state.totalleftNavList.slice(0, this.state.perPage);
        if (this.state.totalleftNavList.length) {
          this.getSelectedUser(this.state.totalleftNavList[0])
        } else {
          this.getSelectedUser({});
          this.state.detailsLoader = false;
        }
        this.state.loader = false;
      }
    });
  }

  uploadLogo(): void {
    this.dialogRef = this.dialog.open(UploaderComponent, {
      panelClass: 'my-dialog',
      width: '500px',
      data: {
        title: "Upload Logo",
        id: (this.state.selectedItem['css'] == 'user' ? this.state.selectedItem['contact_id'] : this.state.selectedItem['id']),
        image: this.state.selectedItem['logo'],
        saveUrl: (this.state.selectedItem['css'] == 'user' ? 'uploadLogo' : 'saveOrgLogo'),
        removeUrl: 'removeLogo',
        isUser: true
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.state.selectedItem['logo'] = result.data.filename;
      } else if (result && result.remove) {
        this.state.selectedItem['logo'] = '';
      }
    });
  }

  changeOrgStatus(): void {
    this.state.selectedItem['status'] = !this.state.selectedItem['status'];
    if (this.state.selectedItem['css'] == 'user') {
      this.usersService.saveUserStatus({
        user_id: this.state.selectedItem['contact_id'],
        org_type: 3,
        name: this.state.selectedItem['name'],
        status: String(this.state.selectedItem['status'])
      }).then(response => {
        if (response.result.success) {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Organization Details Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          const indx = _.findIndex(this.state.leftNavList, { id: this.state.selectedItem['org_id'] });
          if (indx > -1) {
            const userIndx = _.findIndex(this.state.leftNavList[indx].users, { contact_id: this.state.selectedItem['contact_id'] });
            if (this.state.selectedFilter.label == 'All' ||
              (this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Active') ||
              (!this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Inactive')) {
              // do nothing
            } else {
              this.state.leftNavList[indx].users.splice(userIndx, 1);
              if (this.state.leftNavList[indx].users.length) this.getSelectedUser(this.state.leftNavList[indx].users[0]);
              else this.getSelectedUser(this.state.leftNavList[0]);
              this.state.leftNavCount--;
            }
          }
        }
      });
    } else {
      this.contactsService.addOrganization({
        id: this.state.selectedItem['id'],
        org_type: 3,
        name: this.state.selectedItem['name'],
        status: String(this.state.selectedItem['status'])
      }).then(response => {
        if (response.result.success) {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Organization Details Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          if (this.state.selectedItem['css'] == 'org' /* org */) {
            const indx = _.findIndex(this.state.leftNavList, { id: this.state.selectedItem['id'] });
            if (this.state.selectedFilter.label == 'All' ||
              (this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Active') ||
              (!this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Inactive')) {
              // do nothing
            } else {
              this.state.leftNavList.splice(indx, 1);
              this.getSelectedUser(this.state.leftNavList[0]);
              this.state.leftNavCount--;
            }
          } else if (this.state.selectedItem['css'] == 'sub-org' /* sub org */) {
            const indx = _.findIndex(this.state.leftNavList, { id: this.state.selectedItem['parent_id'] });
            if (indx > -1) {
              const orgIndx = _.findIndex(this.state.leftNavList[indx].children, { parent_id: this.state.selectedItem['parent_id'] });
              if (this.state.selectedFilter.label == 'All' ||
                (this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Active') ||
                (!this.state.selectedItem['status'] && this.state.selectedFilter.label == 'Inactive')) {
                // do nothing
              } else {
                this.state.leftNavList[indx].children.splice(orgIndx, 1);
                if (this.state.leftNavList[indx].children.length) this.getSelectedUser(this.state.leftNavList[indx].children[0]);
                else this.getSelectedUser(this.state.leftNavList[0]);
                this.state.leftNavCount--;
              }
            }
          }
        }
      });
    }
  }

}
