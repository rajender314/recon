import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminDashboard, checkedLength } from '@app/admin/admin.config';
import { Pagination } from '@app/shared/utility/types';
import { SortFilter, Statuses, StatusFilter } from '@app/shared/utility/dummyJson';
import { LicenseManager } from "ag-grid-enterprise";
import { ContactsService } from '@app/contacts/contacts.service';
import { MarkupGridComponent } from '../markup-grid/markup-grid.component';
import { MatSnackBar, MatDialog, MatMenuTrigger } from '@angular/material';
import { EditMarkupComponent } from '@app/admin/edit-markup/edit-markup.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import * as _ from 'lodash';
import { AdminService } from '@app/admin/admin.service';
import { AddCostCodeComponent } from '@app/admin/dialogs/add-cost-code/add-cost-code.component';
import { ActionsDialogComponent } from '@app/admin/markups/actions-dialog/actions-dialog.component';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
import { GridApi, GridOptions } from 'ag-grid-community';
LicenseManager.setLicenseKey("Enterpi_Software_Solutions_Private_Limited_MultiApp_1Devs21_August_2019__MTU2NjM0MjAwMDAwMA==f0a6adf3f22452a5a3102029b1a87a43");

var APP: any = window['APP'];

@Component({
  selector: 'app-markups',
  templateUrl: './markups.component.html',
  styleUrls: ['../admin.component.scss', './markups.component.scss']
})
export class MarkupsComponent implements OnInit {
  @ViewChild(MatMenuTrigger) noteMenuTrigger: MatMenuTrigger;
  APP = APP;
  showView: boolean = false;
  isLoading: boolean = true;
  detailsLoader: boolean = true;
  adminDashboard = AdminDashboard;
  selectedCompanyCode = {
    name: ''
  };
  duplicateError = '';
  activeTab: number = 0;
  categories = [];
  costTemplates = [];
  param = {
    status: 'true',
    sort: 'asc',
    search: ''
  };
  companyCodesList: Array<any> = [];
  markupsList: Array<any> = [];
  breadcrumbs = [
    { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
    { label: 'Markups', type: 'text' },
  ];
  public state = {
    tabs: [
      { type: 'markups', label: 'Markups' },
      { type: 'cost_templates', label: 'Cost Templates' }
    ],
    activeTab: { type: 'markups', label: 'Markups' },
    settings: [
      { id: 0, label: "Clone", show: true },
      { id: 1, label: "Reset Default", show: true },
      { id: 2, label: "Export to Box", show: (APP.permissions.system_access.export_markups_to_box == 'yes') ? true : false }
    ],
    activeSetting: { id: 0, label: "Clone" },
    detailSearch: ''
  }
  selectedService: any;
  statusBy: string = 'Active';
  sortBy: string = 'A-Z';
  totalCount: number = 0;
  totalPages: number = 0;
  StatusFilter = [
    { label: 'All', value: '' },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  dropdowns = {
    sortFilter: SortFilter,
    statusFilter: StatusFilter,
    status: Statuses,
    addOns: []
  };
  public defaultValues: any;
  public gridApi: GridApi;

  public markups = [];
  public columnDefs = [
    {
      headerName: 'Products/Services',
      field: 'name',
      /*suppressResize: true,*/
      suppressSizeToFit: true,
      width: 260,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: true
      },
      headerCheckboxSelection: true
    },
    {
      headerName: 'Markups',
      field: 'markup',
      cellRenderer: (param) => {
        return param.hasOwnProperty('value') ? (param.value ? (param.value + '%') : '0.000%') : '';
      },
      width: 120
    },
    {
      headerName: 'Recovery',
      field: 'recover',
      cellRenderer: (param) => {
        return param.hasOwnProperty('value') ? (param.value ? (param.value + '%') : '0.000%') : '';
      },
      width: 120
    },
    {
      headerName: 'Include Net',
      field: 'count_net',
      cellRenderer: (param) => {
        return param.hasOwnProperty('value') ? (param.value == 1 ? 'Y' : 'N') : '';
      }/*,
      width: 100*/
    },
    {
      headerName: 'XR Applicable',
      field: 'xr_applicable',
      cellRenderer: (param) => {
        return param.hasOwnProperty('value') ? (param.value == 1 ? 'Y' : 'N') : '';
      }/*,
      width: 100*/
    },
    {
      headerName: 'Category',
      field: 'category_name'/*,
      width: 200*/
    },
    {
      headerName: 'Min($)',
      field: 'min_net',
      cellRenderer: (param) => {
        return param.hasOwnProperty('value') ? (param.value ? ('$' + param.value) : '$0.00') : '';
      },
      width: 120
    },
    {
      headerName: 'Max($)',
      field: 'max_applied',
      cellRenderer: (param) => {
        return param.hasOwnProperty('value') ? (param.value ? ('$' + param.value) : '$0.00') : '';
      },
      width: 120
    },
    {
      headerName: '',
      field: 'edit',
      width: 50,
      cellRenderer: (event) => {
        if (event.data.children && event.data.children.length) {
          return '';
        }
        return '<div class="ag-cell-custome-actions">' +
          '<ul><li><i class="pixel-icons icon-pencil"></i></li></ul>' +
          '</div>';
      }
    }
  ];
  public gridOptions: GridOptions = {
    columnDefs: this.columnDefs,
    animateRows: false,
    groupSelectsChildren: true,
    rowSelection: 'multiple',
    /*suppressResize: true,*/
    icons: {
      groupExpanded: false,
      groupContracted: false
    },
    rowHeight: 40,
    rowData: this.markups,
    getNodeChildDetails: this.getNodeChildDetails,

    defaultColDef: {
      resizable: true
    },

    onGridReady: (params) => {
      this.gridApi = params.api;
      //this.gridApi.sizeColumnsToFit();
    },
    // onHeaderCellClicked: (event) => {
    //   if (event.column.colId == 'edit') {
    //     if (event.event.target.className == 'edit') {
    //       this.editService(event);
    //     }
    //   }
    // },
    onCellClicked: (event) => {
      if (event.column['colId'] == 'edit') {
        // if (event.event.target['className'] == 'pixel-icons icon-pencil') {
        this.editService(event);
        // }
      }
    },
    onCellFocused: params => {
      if (params.column && params.column['colId'] == 'edit') {
        this.gridOptions.suppressRowClickSelection = true;
      } else {
        this.gridOptions.suppressRowClickSelection = false;
      }
    }
  };

  public showDefaultValues = false;

  checkAll: boolean = false;
  indeterminate: boolean = false;
  categoryForm: FormGroup;
  noteFormControl = new FormControl('');
  promise: any;

  constructor(
    private fb: FormBuilder,
    private contactsService: ContactsService,
    private adminService: AdminService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.getCompanyCodesList();
    this.getCategories();
  }

  showDefault() {
    this.showDefaultValues = !this.showDefaultValues;
  }

  resetMarkupNote() {
    const note = this.defaultValues.notes ? this.defaultValues.notes : '';
    this.noteFormControl.reset(note);
  }

  saveMarkupNotes() {
    if (!this.promise)
      this.promise = this.adminService.saveApi('saveOrgMarkupNotes', { org_id: this.selectedService.id, company_code: this.selectedCompanyCode['id'], notes: this.noteFormControl.value })
        .then(res => {
          this.promise = undefined;
          if (res.result.success) {
            this.snackbar.openFromComponent(SnackbarComponent, {
              data: { status: 'success', msg: 'Markup Notes Saved Successfully' },
              verticalPosition: 'top',
              horizontalPosition: 'right'
            });
          }
        })
        .catch(err => {
          this.promise = undefined;
        })
  }

  performAction(flag) {
    if (flag == 'export') {
      window.location.href = APP.api_url + 'exportMarkups?' + 'token=' + APP.access_token + '&jwt=' + APP.j_token;
    } else if (flag == 'import' || flag == 'clone') {
      const locals = {
        title: flag == 'import' ? 'Import Excel' : 'Clone Markup',
        button: { yes: (flag == 'import' ? 'Import' : 'Clone'), no: 'cancel' },
        flag: flag,
        companyCode: this.selectedCompanyCode['id'],
        orgID: this.selectedService.id
      }
      this.dialog.open(ActionsDialogComponent, {
        panelClass: 'recon-dialog',
        width: '600px',
        data: locals
      })
        .afterClosed()
        .subscribe(res => {
        })
    }
  }

  changeSettings(item) {
    this.state.activeSetting = item;
    if (item.label == 'Clone') this.performAction(item.label.toLowerCase());
  }

  setActiveTab(tab) {
    this.state.activeTab = tab;
    this.getSelectedTab();
  }

  getSelectedTab() {
    switch (this.state.activeTab.type) {
      case "markups":
        this.getDefaultValues();
        break;
      case "cost_templates":
        this.getCostTemplates();
        break;
    }
  }

  public dialogRef: any;
  editService = (event) => {
    this.dialogRef = this.dialog.open(EditMarkupComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: 'Edit Service',
        row: event.data,
        categories: this.categories,
        company_code: this.selectedCompanyCode['id'],
        saveUrl: 'saveServiceMarkup',
        org_id: this.selectedService.id,
        ids: [event.data.id]
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Service Updated Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        event.node.setData(result.data);
      }
    });

  }

  editServices = () => {
    let selectedRows = this.gridApi.getSelectedRows();
    let ids = [];
    _.map(selectedRows, (value) => {
      ids.push(value.id);
    });
    let obj = {
      row: {
        "name": '',
        "markup": "",
        "recover": "",
        "count_net": 1,
        "xr_applicable": 1,
        "category_id": "",
        "min_net": "",
        "max_applied": ""
      },
      "company_code": this.selectedCompanyCode['id'],
      "org_id": this.selectedService.id,
      saveUrl: 'saveServiceMarkup',
      categories: this.categories,
      title: 'Edit Service',
      ids: ids
    };
    this.dialogRef = this.dialog.open(EditMarkupComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: obj
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Service Updated Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getProductServices();
      }
    });
  }

  resetDefaults() {
    this.dialog.open(ConfirmationComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: 'Reset Default',
        action: 'reset',
        tab: 'Markups',
        url: '',
        params: {},
        content: 'Are you sure, you want to reset this Markup'
      }
    })
      .afterClosed()
      .subscribe(res => {
      })
  }

  editDefaultValues = () => {
    let selectedRows = this.gridApi.getSelectedRows();
    let ids = [];
    _.map(selectedRows, (value) => {
      ids.push(value.id);
    });
    this.dialogRef = this.dialog.open(EditMarkupComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: 'Edit Service',
        row: this.defaultValues,
        categories: this.categories,
        company_code: this.selectedCompanyCode['id'],
        saveUrl: 'saveGeneralMarkups',
        org_id: this.selectedService.id,
        ids: ids
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Default Values Updated Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getDefaultValues();
      }
    });
  }

  onTabChange = (index) => {
    this.activeTab = index;
    this.detailsLoader = true;
    setTimeout(() => {
      this.detailsLoader = false;
    }, 1000);
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

  changeMasterView() {
    this.showView = !this.showView;
  }

  onSearch(val, flag?) {
    // this.param.page = 1;
    if (val) this.param.search = val;
    else delete this.param.search;
    this.getList();
  }

  onApplyFilter = (prop, obj?) => {
    // this.param.page = 1;
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

  getCompanyCodesList() {
    this.adminService
      .saveApi('getCompanyCodesList', {
        sort: 'asc',
        status: true,
        search: ''
      })
      .then(res => {
        if (res.result.success) {
          this.companyCodesList = res.result.data;
          if (this.companyCodesList.length) {
            this.selectedCompanyCode = this.companyCodesList[0];
            this.getList();
          }
        }
      });
  }

  getCategories() {
    this.adminService
      .getApi('getCategories', {
        sort: 'asc',
        status: true,
        search: ''
      })
      .then(res => {
        if (res.result.success) {
          this.categories = res.result.data.categories;
          let controls = {};
          this.categories.map(ctg => {
            controls[ctg.id] = false;
          })
          this.categoryForm = this.fb.group(controls);
        }
      });
  }

  menuActions(flag, val) {
    if (flag == 'all') {
      let values = {};
      this.categories.map(ctg => {
        values[ctg.id] = val
      })
      this.categoryForm.patchValue(values, { emitEvent: false });
    } else if (flag == 'apply' || flag == 'cancel') {
      const values = checkedLength(this.categoryForm.value);
      this.getProductServices(flag == 'cancel' ? [] : Object.keys(values));
    } else if (flag == 'clear') {
      this.categoryForm.reset();
      this.checkAll = false;
    }
  }

  changeCompanyCode(item) {
    this.selectedCompanyCode = item;
    this.getList();
  }

  selectAll() {
    this.menuActions('all', this.checkAll)
  }

  changeCategory() {
    this.checkFlag();
  }

  isAllChecked = (checked) => {
    return Object.keys(checked).length && Object.keys(checked).length == this.categories.length;
  }

  checkFlag = () => {
    let checkedArra = checkedLength(this.categoryForm.value);
    this.checkAll = this.isAllChecked(checkedArra);
    this.indeterminate = Object.keys(checkedArra).length ? !this.checkAll : false;
  }

  onSelectItem(item) {
    this.duplicateError = '';
    this.selectedService = item;
    this.getSelectedTab();
  }

  getDefaultValues() {
    this.detailsLoader = true;
    this.adminService.getApi('getGeneralMarkups', {
      org_id: this.selectedService.id,
      company_code: this.selectedCompanyCode['id']
    }).then(response => {
      if (response.result.success) {
        this.defaultValues = response.result.data;
        const note = this.defaultValues.notes ? this.defaultValues.notes : '';
        this.noteFormControl.setValue(note);
      }
      this.getProductServices();
    });
  }

  getCostTemplates() {
    this.detailsLoader = true;
    this.adminService.getApi('costTemplatesList', {
      org_id: this.selectedService.id,
      company_code: this.selectedCompanyCode['id']
    }).then(response => {
      this.detailsLoader = false;
      if (response.result.success) {
        this.costTemplates = response.result.data;
      }
      //this.getProductServices();
    });
  }

  deleteCostCode(item?: any) {
    this.adminService.deleteApi('deleteCostTemplate', {
      id: item.id
    }).then(response => {
      if (response.result.success) {
        this.costTemplates = _.filter(this.costTemplates, (value) => {
          if (value.id == item.id) {
            return false;
          }
          return true;
        })
      }
    });
  }

  addCostCodes(item?: any) {
    let maxVal = 0;
    _.map(this.costTemplates, (template) => {
      maxVal = maxVal + parseFloat(template.percentage);
    });
    let allowedMaxVal = 100 - maxVal;
    if (item && item.id) {
      allowedMaxVal = allowedMaxVal + parseFloat(item.percentage);
    }
    let numberConfig: any = {
      prefix: '',
      suffix: '%',
      limit: 3,
      maxLimit: true,
      maxNumber: allowedMaxVal,
      isCancel: false,
      thousandsSeparator: false
    }
    this.dialogRef = this.dialog.open(AddCostCodeComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: (item && item.id) ? 'Edit Cost Template' : 'Add Cost Template',
        item: item,
        params: {
          org_id: this.selectedService.id,
          company_code: this.selectedCompanyCode['id'],
          id: (item && item.id) ? item.id : '',
          numberConfig: numberConfig
        }
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Cost Code Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getCostTemplates();
      }
    });
  }

  getProductServices(ctg?) {
    this.detailsLoader = true;
    this.adminService.getApi('getMarkupProductServices', {
      org_id: this.selectedService.id,
      company_code: this.selectedCompanyCode['id'],
      search: this.state.detailSearch,
      categories: ctg ? ctg.toString() : ''
    }).then(response => {
      this.detailsLoader = false;
      if (response.result.success) {
        this.markups = response.result.data;
        this.gridOptions.rowData = this.markups;
      }
    });
  }

  searchProducts(search: string): void {
    this.state.detailSearch = search;
    this.getProductServices();
  }

  getList(flag?) {
    this.isLoading = true;
    this.adminService
      .getApi('getOrgs', Object.assign({
        ...{
          org_type: 2,
          search: '',
          status: true,
          company_code: this.selectedCompanyCode['id']
        }, ...this.param
      })).then(response => {
        this.isLoading = false;
        this.markupsList = [];
        if (response.result.success) {
          this.markupsList = response.result.data;
          // this.totalCount = response.result.data.count;
          this.totalCount = this.markupsList.length;
          if (this.markupsList && this.markupsList.length) {
            this.onSelectItem(this.markupsList[0]);
          } else {
            this.onSelectItem({});
            this.detailsLoader = false;
          }
          this.markupsList.unshift({ id: '0', name: "Default Markup" });
        } else {
          this.markupsList.unshift({ id: '0', name: "Default Markup" });
          this.detailsLoader = false;
        }
      });
    // setTimeout(()=>{
    //   this.isLoading = false;
    // },1000);    
  }

  toggleChildCompanyCodes(code: any, event: any): void {
    event.stopImmediatePropagation();
    code['showChildren'] = !code['showChildren'];
  }

}
