import { Component, OnInit } from '@angular/core';
import { AdminDashboard } from '@app/admin/admin.config';
import { Pagination } from '@app/shared/utility/types';
import { SortFilter, StatusFilter, Statuses } from '@app/shared/utility/dummyJson';
import { AdminService } from '@app/admin/admin.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ContactsService } from '@app/contacts/contacts.service';
import { UploaderComponent } from '@app/shared/components/uploader/uploader.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { forkJoin } from 'rxjs';
import { AddCompanyCodeComponent } from '@app/admin/dialogs/add-company-code/add-company-code.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { ValueParserParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { GridOptions } from 'ag-grid-community';
var APP = window['APP'];
@Component({
  selector: 'app-company-codes',
  templateUrl: './company-codes.component.html',
  styleUrls: ['../admin.component.scss', './company-codes.component.scss']
})
export class CompanyCodesComponent implements OnInit {
  APP = APP;
  showView: boolean = false;
  isLoading: boolean = true;
  detailsLoader: boolean = false;
  adminDashboard = AdminDashboard;
  formsGroup: FormGroup;
  submitted: boolean = false;
  distributionTypes = [];
  groupTypes = [];
  companyCodes: Array<any> = [];
  selectedCompanyCode = { name: '' };
  numberConfig: any = {
    prefix: '',
    limit: 3,
    centsLimit: 0,
    isCancel: false,
    centsSeparator: false,
    thousandsSeparator: false
  };
  markupNumberConfig: any = {
    prefix: '',
    limit: 3,
    centsLimit: 3,
    isCancel: false,
    thousandsSeparator: false
  };
  StatusFilter = [
    { name: 'Active', id: true },
    { name: 'Inactive', id: false },
  ];
  syncOptions: any = [
    { id: 1, value: "Sync with LH" },
    { id: 2, value: "Sync with GP" },
    { id: 3, value: "Do not Sync" },
  ];
  formConfig: any = [
    { key: 'name', default: null, validations: { required: true } },
    { key: 'status', default: null, validations: { required: true } },
    { key: 'description', default: null },
    { key: 'job_prefix', default: null, validations: { required: true } },

    { key: 'allow_mio', default: null },
    { key: 'check_avalara', default: null },
    { key: 'corp_co', default: null, validations: { required: true } },
    { key: 'distribution_id', default: null, validations: { required: true } },
    { key: 'due_days', default: null, validations: { required: true } },
    { key: 'group_id', default: null, validations: { required: true } },
    { key: 'invoice_need', default: null },
    { key: 'net_push_gp', default: null },
    { key: 'po_actual_amount', default: null },
    { key: 'no_actual_use_po', default: null },
    { key: 'sync', default: null },
    { key: 'created_date', default: null },
    { key: 'last_modified_date', default: null },
    { key: 'created_by', default: null },
    { key: 'last_modified_by', default: null }
  ];
  companyCodesList: Array<any> = [
    {
      name: "IVIE", children: [
        { id: 1, name: "Blueleaf Digital, LLC" },
        { id: 2, name: "CLM" },
        { id: 3, name: "Dev Team" },
        { id: 4, name: "Graphic Image" },
        { id: 5, name: "GreenLeaf" },
        { id: 6, name: "IVIE" },
        { id: 7, name: "Ivie Asia" },
        { id: 8, name: "Ivie Test" },
        { id: 9, name: "Ivie USA" },
        { id: 10, name: "RD&F" },
        { id: 11, name: "Test Company" },
        { id: 12, name: "Tester" },
        { id: 13, name: "Veritiv" },
      ]
    }
  ];
  statusBy: string = 'Active';
  sortBy: string = 'A-Z';
  totalCount: number = 0;
  totalPages: number = 0;
  activeTab: number = 0;
  param: Pagination = {
    page: 1,
    pageSize: 50,
    status: 'true',
    sort: 'asc'
  };
  duplicateError = '';
  dropdowns = {
    sortFilter: SortFilter,
    statusFilter: StatusFilter,
    status: Statuses,
    addOns: []
  };
  breadcrumbs = [
    { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
    { label: 'Company Codes', type: 'text' },
  ];
  selectedService = {
    id: ''
  };
  clientAccess = [];
  templateData: any;
  dialogRef: any;
  serviceSearch = '';
  markups = [];
  selectedIds = [];
  public gridApi: any;
  public general_markup = '';
  public subsidiary_markups_id = '';

  public columnDefs = [
    {
      headerName: 'Products/Services',
      field: 'name',
      /*suppressResize: true,
      pinned: 'left',*/
      width: 300,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: (APP.permissions.system_access.company_codes == 'edit') ? true : false
      },
      headerCheckboxSelection: (APP.permissions.system_access.company_codes == 'edit') ? true : false
    },
    {
      headerName: 'Markups',
      field: 'markup_value',
      editable: (APP.permissions.system_access.company_codes == 'edit') ? true : false,
      cellEditor: 'numericEditor',
      type: 'price',
      limit: 3,
      centsLimit: 3,
      // onCellValueChanged: (event) => {
      //   var numbers = /^[0-9]+$/;
      //   if (numbers.test(event.newValue)) {
      //     this.saveMarkupValue(event);
      //   } else {
      //     let data = event.data;
      //     data.markup_value = event.oldValue;
      //     event.node.setData(data)
      //   }
      // }
    }
  ];

  public gridOptions: GridOptions = {
    columnDefs: this.columnDefs,
    animateRows: false,
    groupSelectsChildren: true,
    rowSelection: 'multiple',
    icons: {
      groupExpanded: false,
      groupContracted: false
    },
    frameworkComponents: {
      numericEditor: NumericCellEditorComponent
    },
    rowHeight: 40,
    rowData: this.markups,
    getNodeChildDetails: this.getNodeChildDetails,

    defaultColDef: {
      resizable: true
    },

    onGridReady: (params) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
    },
    onCellValueChanged: (gridApi) => {
      if (gridApi.oldValue != gridApi.newValue) {
        this.saveMarkupValue(gridApi);
      }
    }
  };

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['code-block'],
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      //[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      //[{ 'direction': 'rtl' }],                         // text direction

      //[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      //[{ 'header': [1, 2, 3, 4, 5, 6, false] }],

      //[{ 'font': [] }],
      //[{ 'align': [] }],

      ['clean'],                                         // remove formatting button

      ['link'],
      //['link', 'image', 'video']  
    ],
    autoLink: true,
  };
  state = {
    tabs: [
      { label: 'Details', type: 'details' },
      { label: 'Estimates', type: 'estimates' },
      { label: 'PO', type: 'po' },
      { label: 'Invoice', type: 'invoice' },
      { label: 'Client Access', type: 'clientAccess' },
      { label: 'Markup', type: 'markup' }
    ]
  }
  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private contactsService: ContactsService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {
    //super({ title: 'Cost Code', prop: 'Cost Codes', export: 'exportCstCds', get: 'getCostCodes', save: 'saveCostCodes' }, adminService, fb, snackbar, dialog);
  }

  ngOnInit() {
    // this.getList();
    this.getCompanyCodesList();
  }

  saveMarkupValue(event) {
    this.adminService
      .saveApi('saveCompanyMarkup', {
        company_code: this.selectedService['id'],
        subsidiary_code: this.selectedCompanyCode['id'],
        subsidiary_markups_id: this.subsidiary_markups_id,
        general_markup_value: this.general_markup,
        subsidiary_markup_value: event.newValue,
        form_ids: [event.data.id]
      })
      .then(res => {
        if (res.result.success) {
        }
      });
  }

  getCompanyCodesList() {
    this.adminService
      .saveApi('getCompanyCodesList', {
        sort: 'asc',
        status: true,
        search: ''
      })
      .then(res => {
        if (res.result.success) {
          this.companyCodes = res.result.data;
          if (this.companyCodesList.length) {
            this.selectedCompanyCode = this.companyCodes[0];
            this.getList();
          }
        }
      });
  }

  changeMarkup(event: any): any {
    var numbers = /^[0-9]+$/;
    if (!numbers.test(event.key)) {
      return false;
    }
    if (event.which == 13) {
      return false;
    }
  }

  editOrg(event: any): void {
    if (event.target.innerText != '' && this.general_markup != event.target.innerText) {
      var numbers = /^[0-9]+$/;
      if (numbers.test(event.target.innerText)) {
        this.adminService
          .saveApi('saveCompanyMarkup', {
            company_code: this.selectedService['id'],
            subsidiary_code: this.selectedCompanyCode['id'],
            subsidiary_markups_id: this.subsidiary_markups_id,
            general_markup_value: event.target.innerText
          })
          .then(res => {
            if (res.result.success) {
              this.general_markup = event.target.innerText;
            } else {
              event.target.innerText = this.general_markup;
            }
          });
      } else {
        event.target.innerText = this.general_markup;
      }
    } else {
      event.target.innerText = this.general_markup;
    }
  }

  getDetails(): void {
    this.detailsLoader = true;
    this.adminService
      .getApi('getCompanyCodeDetails', {
        id: this.selectedService['id']
      })
      .then(res => {
        this.detailsLoader = false;
        if (res.result.success) {
          this.setForm(res.result.data[0]);
        }
      });
  }

  createForm() {
    this.formsGroup = this.fb.group({
      name: '',
      description: ''
    });
  }

  changeCompanyCode(item) {
    this.selectedCompanyCode = item;
    this.getGeneralMarkup();
  }

  getGeneralMarkup() {
    this.detailsLoader = true;
    this.adminService
      .getApi('getCompanyMarkup', {
        company_code: this.selectedService['id'],
        subsidiary_code: this.selectedCompanyCode['id'],
        search: this.serviceSearch
      })
      .then(response => {
        this.detailsLoader = false;
        if (response.result.success) {
          //this.getProductServices();
          this.general_markup = response.result.data.general_markup;
          this.subsidiary_markups_id = response.result.data.subsidiary_markups_id;
          this.markups = response.result.data.services;
          this.gridOptions.rowData = this.markups;
        }
      });
  }

  createDetailsForm() {
    let obj = {
      id: this.selectedService['id']
    };
    this.formConfig.map(field => {
      let validations = [];
      if (field.validations && Object.keys(field.validations).length) {
        if (field.validations.required) validations.push(Validators.required);
        if (field.validations.maxlength) validations.push(Validators.maxLength(field.validations.maxlength));
      }
      obj[field.key] = [field.default, validations];
    });
    this.formsGroup = this.fb.group(obj);
  }

  setForm(object?: any): void {
    let obj = {};
    this.formConfig.map(field => {
      obj[field.key] = object[field.key];
    });
    this.formsGroup.patchValue(obj);
  }

  changeMasterView() {
    this.showView = !this.showView;
  }

  openAddDialog(data = '') {
    this.dialogRef = this.dialog.open(AddCompanyCodeComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: "Add Company Code",
        name: data
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Company Code Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getList();
      }
    });
  }

  onSearch(val, flag?) {
    this.param.page = 1;
    if (val) this.param.search = val;
    else delete this.param.search;
    this.getList();
  }

  getTabData(): void {
    //this.detailsLoader = true;
    switch (this.activeTab) {
      case 0:
        this.createDetailsForm();
        this.getDetails();
        break;
      case 1:
        this.createForm();
        this.getCompanyCodeTemplates();
        break;
      case 2:
        this.createForm();
        this.getCompanyCodeTemplates();
        break;
      case 3:
        this.createForm();
        this.getCompanyCodeTemplates();
        break;
      case 4:
        this.getClientAccess();
        break;
      case 5:
        this.serviceSearch = '';
        this.getGeneralMarkup();
        break;
    }
    setTimeout(() => {
      //this.detailsLoader = false;
    }, 1000);
  }

  onTabChange = (index) => {
    this.activeTab = index;
    this.duplicateError = '';
    this.getTabData();
  }

  getCompanyCodeTemplates(): void {
    this.detailsLoader = true;
    this.adminService
      .getApi('getCompanyCodeTemplates', {
        company_code: this.selectedService['id'],
        template_type: this.activeTab
      })
      .then(res => {
        this.detailsLoader = false;
        if (res.result.success) {
          this.templateData = res.result.data;
          this.formsGroup.controls.description.setValue(res.result.data.description);
          this.formsGroup.controls.name.setValue(res.result.data.name);
        }
      });
  }

  onApplyFilter = (prop, obj?) => {
    this.param.page = 1;
    if (prop == 'sort') {
      this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
      this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
      this.getList();
    } else {
      if (obj.label != this.statusBy) {
        this.param[prop] = obj.value;
        if (obj.label == 'All') this.statusBy = '';
        else this.statusBy = obj.label;
        this.getList();
      }
    }
  }

  getList(flag?) {
    this.isLoading = true;
    this.adminService
      .getApi('getCompanyCodes', this.param)
      .then(res => {
        this.isLoading = false;
        if (res.result.success) {
          this.totalCount = res.result.data.count;
          if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
          if (flag == 'pagination') {
            this.companyCodesList = [...this.companyCodesList, ...res.result.data.items];
          } else {
            this.companyCodesList = res.result.data.items;
          }
          if (this.companyCodesList.length) {
            if (this.companyCodesList[0]
              && this.companyCodesList[0].children
              && this.companyCodesList[0].children.length) {
              this.onSelectItem(this.companyCodesList[0].children[0]);
            }
          } else {
            this.selectedService = { id: '' };
          }
        }
      });
  }

  searchProducts(search: string): void {
    this.serviceSearch = search;
    // this.getGeneralMarkup();
    this.gridApi.setQuickFilter(search);
  }

  getProductServices() {
    this.detailsLoader = true;
    this.adminService.getApi('getMarkupProductServices', {
      org_id: 11766,
      company_code: 1,
      search: this.serviceSearch
    }).then(response => {
      if (response.result.success) {
        this.markups = response.result.data;
        this.gridOptions.rowData = this.markups;
      }
      this.detailsLoader = false;
    });
  }

  resetForm() {
    this.getTabData();
  }

  saveDetails() {
    this.submitted = true;
    if (this.formsGroup.valid) {
      this.detailsLoader = true;
      this.adminService
        .saveApi('saveCompanyCodeDetails', this.formsGroup.value
        )
        .then(res => {
          this.detailsLoader = false;
          if (res.result.success) {
            if (this.statusBy == '' || this.selectedService['status'] == this.formsGroup.value.status) {
              this.selectedService['name'] = this.formsGroup.value.name;
              this.setForm(res.result.data);
            } else {
              this.getCompanyCodesList();
            }
          } else {
            this.duplicateError = res.result.data.trim();
          }
        });
    }
  }

  saveTemplate() {
    this.submitted = true;
    if (this.formsGroup.valid) {
      this.detailsLoader = true;
      this.adminService
        .saveApi('saveCompanyCodeTemplates', Object.assign(
          {
            ...this.formsGroup.value, ...{
              company_code: this.selectedService['id'],
              template_type: this.activeTab,
              logo: this.templateData.logo
            }
          })
        )
        .then(res => {
          this.submitted = false;
          this.detailsLoader = false;
          if (res.result.success) {
          } else {
            this.duplicateError = '';
          }
        });
    }
  }

  removeDuplicate() {
    this.duplicateError = '';
  }

  uploadLogo(): void {
    this.dialogRef = this.dialog.open(UploaderComponent, {
      panelClass: 'my-dialog',
      width: '500px',
      data: {
        title: "Upload Logo",
        id: this.selectedService['id'],
        image: this.templateData['logo'],
        saveUrl: 'uploadCompanyCode',
        removeUrl: 'uploadCompanyCode',
        params: Object.assign(
          {
            ...this.formsGroup.value, ...{
              company_code: this.selectedService['id'],
              template_type: this.activeTab,
              logo: this.templateData.logo
            }
          }),
        removeParams: Object.assign(
          {
            ...this.formsGroup.value, ...{
              company_code: this.selectedService['id'],
              template_type: this.activeTab,
              logo: this.templateData.logo,
              remove_logo: true
            }
          })
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.templateData['logo'] = result.data.filename;
      } else if (result && result.remove) {
        this.templateData['logo'] = '';
      }
    });
  }

  getClientAccess = () => {
    // if (Object.keys(this.clientAccess).length) {
    //   if (this.clientAccess && Object.keys(this.clientAccess).length) {
    //     return;
    //   }
    // }
    this.detailsLoader = true;
    this.contactsService.getOrganizations({
      org_type: 2,
      status: true
    })
      .then(res => {
        if (res.result.success) {
          //this.formatClientAccess(res.result.data, 0);
          this.clientAccess = res.result.data;
          this.detailsLoader = false;
        }
      });
  }

  onSelectItem(item) {
    this.serviceSearch = '';
    this.duplicateError = '';
    forkJoin(
      this.adminService.getApi('distributionTypes', { status: true }),
      this.adminService.getApi('getGroups', { status: true })
    ).subscribe(data => {
      this.distributionTypes = [];
      this.groupTypes = [];
      if (data[0].result.success) {
        this.distributionTypes = data[0].result.data.items;
        // this.distributionTypes = data[0].result.data.items.map((prod) => {
        //   return { value: prod.id, label: prod.name };
        // });
      }
      if (data[1].result.success) {
        this.groupTypes = data[1].result.data.groups;
        // this.groupTypes = data[1].result.data.groups.map((prod) => {
        //   return { value: prod.id, label: prod.name };
        // });
      }
      this.selectedService = item;
      this.getTabData();
    });
  }

  toggleChildCompanyCodes(code: any, event: any): void {
    event.stopImmediatePropagation();
    code['showChildren'] = !code['showChildren'];
  }

  getNodeChildDetails(rowItem) {
    if (rowItem.children) {
      return {
        group: true,
        children: rowItem.children,
        expanded: true,
        key: rowItem.label
      };
    } else {
      return null;
    }
  };

}
