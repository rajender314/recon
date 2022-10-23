import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AdminService } from "@app/admin/admin.service";
import { AdminInterface } from '@app/admin/admin-interface';

import * as _ from 'lodash';
import { updateForm } from '@app/admin/admin.config';
import { CreateDepartmentComponent } from '@app/admin/dialogs/create-department/create-department.component';
import { GridOptions } from 'ag-grid-community';
import { AgPiSelect } from '@app/shared/components/ag-grid/custom-cell-editor';
var APP = window['APP'];
@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['../admin.component.scss', './departments.component.scss']
})
export class DepartmentsComponent extends AdminInterface implements OnInit {
  APP = APP;
  selectedDepartmentType: any;
  activeTab = 0;
  formConfig: any = [
    { label: 'Id', key: 'id', type: 'none', default: '' },
    { label: 'Name', key: 'name', type: 'text', validations: { required: true }, default: '' },
    { label: 'Status', key: 'status', type: 'select', multi: false, options: 'statusList', default: null },
    { label: 'Description', key: 'description', type: 'textarea', default: '' },
    { key: 'org_type', type: 'none', default: null },
		{ key: 'created_by', default: null },
		{ key: 'created_date', default: null },
		{ key: 'last_modified_by', default: null },
		{ key: 'last_modified_date', default: null }
  ]

  priceConfig: any = {
    prefix: '$',
    limit: 3,
    centsLimit: 2,
    isCancel: false
  }

  breadcrumbs = [
    { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
    { label: 'Departments', type: 'text' },
  ];
  public gridOptions: GridOptions = {
    animateRows: false,
    rowHeight: 40,
    defaultColDef: {
      resizable: true,
      sortable: true
    },
    onGridReady: (params) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
    },
    onCellValueChanged: (gridApi) => {
      let params: any = {
        id: gridApi.data.id
      };
      if (gridApi.oldValue != gridApi.newValue) {
        params.access = gridApi.data.access;
        if (false)
          this.adminService
            .saveApi('updateService', params)
            .then(res => {
              if (res.result.success) {
                this.openSnackBar({ status: 'success', msg: 'Service Updated Successfully' });
              } else {

              }
            });
      }
    }
  };
  gridApi: any;
  isTabLoading = false;
  servicesList: Array<any> = [];
  columnDefs: Array<any> = [];
  usersList: Array<any> = [];
  accessTypes: Array<any> = [
    { id: 0, name: 'None' },
    { id: 1, name: 'View' },
    { id: 2, name: 'Edit' },
  ];

  state = {
		tabs: [
		  { label: 'Details', type: 'details' },
		  // { label: 'Services', type: 'services' }
		]
    }
    
  constructor(
    private activeRoute: ActivatedRoute,
    dialog: MatDialog,
    adminService: AdminService,
    fb: FormBuilder,
    snackbar: MatSnackBar
  ) {
    super({ title: 'Departments', prop: 'departments', export: 'exportDepartments', get: 'getDepartments', save: 'addDepartments' }, adminService, fb, snackbar, dialog);
    this.dropdowns.departmentTypes = [
      { label: 'Client Departments', value: 2, name: 'Client Departments' },
      { label: 'Company Departments', value: 1, name: 'Company Departments' },
      { label: 'Vendor Departments', value: 3, name: 'Vendor Departments' }
    ];

    activeRoute.queryParamMap.subscribe(query => {
      let org_type = query.get('type');
      if (org_type) {
        this.param.page = 1;
        this.param.org_type = org_type;
        this.selectedDepartmentType = this.getDepartmentType(Number(org_type));
        if (this.breadcrumbs.length > 2) this.breadcrumbs.pop();
        this.breadcrumbs = [...this.breadcrumbs, ...[{ label: this.selectedDepartmentType.label, type: 'text' }]];
        this.getList();
      }
    })
  }

  ngOnInit() {
    this.createForm(this.formConfig);
  }

  getDepartmentType = org_type => {
    let res = this.dropdowns.departmentTypes.filter(val => val.value === org_type);
    if (res.length)
      return res[0];
    else
      return {};
  }

  setForm = data => {
    this.adminForm.patchValue(updateForm(this.formFields, data));
    this.priceConfig = { ...this.priceConfig };
  }

  resetForm = (data) => {
    this.adminForm.reset(updateForm(this.formFields, data));
    this.adminForm.markAsPristine();
    this.submitted = false;
    this.duplicateError = '';
    this.priceConfig.isCancel = !this.priceConfig.isCancel;
    this.priceConfig = { ...this.priceConfig }
  }

  openAddDialog = (data?) => {
    const label = this.selectedDepartmentType ? this.selectedDepartmentType.label.substring(0, (this.selectedDepartmentType.label.length - 1)) : 'Department';
    this.dialog
      .open(CreateDepartmentComponent, {
        panelClass: 'recon-dialog',
        width: '600px',
        data: {
          title: 'Add New ' + label,
          label: label,
          dropdowns: this.dropdowns,
          name: data ? data : '',
          org_type: this.param.org_type
        }
      })
      .afterClosed().subscribe(res => {
        if (res && res.success) {
          const status = this.param.status ? this.param.status == 'true' : '';
          this.openSnackBar({ status: 'success', msg: 'Department Added Successfully' });
          this.param.page = 1;
          this.getList();
        }
      })
  }

  onTabChange = (index) => {
    this.activeTab = index;
    switch (this.activeTab) {
      case 0:
        break;
      case 1:
        this.getServicesList();
        break;
      case 2:
        this.getUsersList();
        break;
    }
  }

  getServicesList() {
    this.isTabLoading = true;
    if (false)
      this.adminService
        .saveApi('getDepartmentServices', {
          id: this.selectedDepartmentType['id'],
          org_type: this.selectedDepartmentType['org_type'],
        })
        .then(res => {
          if (res.result.success) {

          } else {

          }
          this.isTabLoading = false;
        }).catch(err => this.isTabLoading = false);
    this.columnDefs = [
      { field: 'service_name', headerName: 'Service' },
      {
        field: 'access', headerName: 'Access', editable: true, cellClass: "right-text-cell left-text-cell inline_edit",
        cellEditorFramework: AgPiSelect,
        cellEditorParams: (params) => {
          return {
            options: this.accessTypes
          }
        }, cellRenderer: params => {
          const obj = _.find(this.accessTypes, ['id', params.value]);
          if (obj) return obj.name;
          else return '';
        }, onCellValueChanged: params => {
          if (document.querySelector('.pi-select-list')) {
            document.body.removeChild(document.querySelector('.pi-select-list'));
          }
        }
      },
    ]
    setTimeout(() => {
      this.servicesList = servicesDAta;
      this.isTabLoading = false;

    }, 1000);

  }

  getUsersList() {
    this.isTabLoading = true;
    if (false)
      this.adminService
        .saveApi('getDepartmentUsers', {
          id: this.selectedDepartmentType['id'],
          org_type: this.selectedDepartmentType['org_type'],
        })
        .then(res => {
          if (res.result.success) {

          } else {

          }
          this.isTabLoading = false;
        }).catch(err => this.isTabLoading = false);
    this.columnDefs = [
      { field: 'user_name', headerName: 'User Name' },
      { field: 'designation', headerName: 'Designation' },
    ];
    setTimeout(() => {
      this.usersList = usersDAta;
      this.isTabLoading = false;
    }, 1000);
  }
}

const servicesDAta = [
  { service_name: 'Aa', access: 0, id: 333 },
  { service_name: 'Ba', access: 0, id: 3333 },
  { service_name: 'Ca', access: 1, id: 33356 },
  { service_name: 'Da', access: 1, id: 33345 },
  { service_name: 'Ea', access: 2, id: 333565 },
  { service_name: 'Fa', access: 2, id: 3332 },
];

const usersDAta = [
  { user_name: 'Aa', designation: 'None' },
  { user_name: 'Ba', designation: 'None' },
  { user_name: 'Ca', designation: 'None' },
  { user_name: 'Da', designation: 'None' },
  { user_name: 'Ea', designation: 'None' },
  { user_name: 'Fa', designation: 'None' },
]