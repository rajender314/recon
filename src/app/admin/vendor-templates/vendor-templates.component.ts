import { Component, OnInit } from '@angular/core';
import { AdminDashboard } from '@app/admin/admin.config';
import { Pagination } from '@app/shared/utility/types';
import { AdminService } from '@app/admin/admin.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SortFilter, StatusFilter, Statuses, StatusList } from '@app/shared/utility/dummyJson';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AddTemplateComponent } from '@app/admin/dialogs/add-template/add-template.component';
import * as _ from 'lodash';
import { MultiLevelSelectComponent } from '@app/shared/components/multi-level-select/multi-level-select.component';
var APP: any = window['APP'];
@Component({
  selector: 'app-vendor-templates',
  templateUrl: './vendor-templates.component.html',
  styleUrls: ['../admin.component.scss', './vendor-templates.component.scss']
})
export class VendorTemplatesComponent implements OnInit {
  APP = APP;
  showView: boolean = false;
  isLoading: boolean = true;
  detailsLoader: boolean = false;
  adminDashboard = AdminDashboard;
  promise: any;
  param: Pagination = {
    page: 1,
    pageSize: 50,
    status: 'true',
    sort: 'asc',
    search: ''
  };
  totalCount = 0;
  sortBy: string = 'A-Z';
  public leftNav = [];
  breadcrumbs = [
    { label: 'Admin', type: 'link', route: '/admin', icon: 'icon-pn-settings' },
    { label: 'Vendor Templates', type: 'text' },
  ];
  activeTab: number = 0;
  public duplicateError = '';
  public selectedItem = {
    id: 0
  };
  public selectedParent = {};
  templatesForm: FormGroup;
  statusBy: string = 'Active';
  dropdowns = {
    sortFilter: SortFilter,
    statusFilter: StatusFilter,
    status: Statuses,
    addOns: []
  };
  public dialogRef: any;
  StatusFilter = [
    { label: 'All', value: '' },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  detailStatusFilter = StatusList;
  public milestones = [];
  public milestonesRef = [];
  public submitted = false;
  state = {
		tabs: [
		  { label: 'Details', type: 'details' },
		  { label: 'Milestones', type: 'milestones' }
		]
	  }
  constructor(
    private adminService: AdminService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.getTemplates();
  }

  createForm() {
    this.templatesForm = this.fb.group({
      name: ['', Validators.required],
      status: null
    });
  }

  removeDuplicate() {
    this.duplicateError = '';
  }

  resetForm() {
    this.getTabData();
  }

  onTabChange = (index) => {
    this.activeTab = index;
    this.getTabData();
  }

  getTabData(): void {
    this.detailsLoader = true;
    switch (this.activeTab) {
      case 0:
        this.createForm();
        this.getTemplateDetails();
        break;
      case 1:
        this.getMilestones();
        break;
    }
  }

  getMilestones() {
    this.detailsLoader = true;
    this.adminService
      .getApi('vendorTemplateTaskDetails', { id: this.selectedItem['id'] }).then(response => {
        this.detailsLoader = false;
        if (response.result.success) {
          this.milestones = response.result.data;
          this.milestonesRef = response.result.data;
        }
      });

  }

  addMilestones() {
    this.dialogRef = this.dialog.open(MultiLevelSelectComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: 'Add Milestones',
        id: this.selectedItem['id'],
        saveApi: 'saveVendorTemplateTasks',
        tab: 'Milestones',
        params: {
          id: this.selectedItem['id'],
          action_type: 'add',
          search: true
        },
        type: 'list'
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Milestones Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        // this.milestones = [...this.milestones, ...result.data];
        this.getMilestones();
      }
    });
  }

  changeMasterView() {
    this.showView = !this.showView;
  }

  onApplyFilter = (prop, obj?) => {
    this.param.page = 1;
    if (prop == 'sort') {
      this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
      this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
      this.getTemplates();
    } else {
      if (obj.label != this.statusBy) {
        this.param[prop] = obj.value;
        if (obj.label == 'All') this.statusBy = '';
        else this.statusBy = obj.label;
        this.getTemplates();
      }
    }
  }

  onSearch(val, flag?) {
    this.param.page = 1;
    if (val) this.param.search = val;
    else delete this.param.search;
    this.getTemplates();
  }

  export = () => {
    window.location.href = APP.api_url + 'exportVendorTemplates' + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
  }

  addTemplate = (item: any) => {
    this.dialogRef = this.dialog.open(AddTemplateComponent, {
      panelClass: 'recon-dialog',
      width: '500px',
      data: {
        title: 'Add Template - (' + item.label + ')',
        saveApi: 'saveVendorTemplates',
        params: {
          department_id: item['id']
        }
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Template Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getTemplates();
      }
    });

  }

  getTemplates(type?: any) {
    this.isLoading = true;
    this.adminService
      .getApi('getVendorTemplatesList', this.param).then(response => {
        this.isLoading = false;
        this.selectedItem = {
          id: 0
        };
        if (response.result.success) {
          this.leftNav = response.result.data.items;
          this.totalCount = response.result.data.count;
        }
      });
  }

  toggleChildOrgs(item: any, event: any): void {
    event.stopImmediatePropagation();
    item['showChildren'] = !item['showChildren'];
  }

  onSelectItem(item, parent) {
    this.duplicateError = '';
    this.selectedItem = item;
    this.selectedParent = parent;
    this.getTabData();
  }

  setForm(data) {
    this.templatesForm.patchValue({
      name: data.name,
      status: data.status,
      created_date: data.created_date,
      last_modified_date: data.last_modified_date,
      created_by: data.created_by,
      last_modified_by: data.last_modified_by
    });
  }
  saveDetails() {
    if (!this.promise) {
      this.submitted = true;
      this.promise = this.adminService
        .saveApi('saveVendorTemplates', { ...{ department_id: this.selectedParent['id'], id: this.selectedItem['id'] }, ...this.templatesForm.value })
        .then(res => {
          this.submitted = false;
          if (res.result.success) {
            this.promise = undefined;
            this.snackbar.openFromComponent(SnackbarComponent, {
              data: { status: 'success', msg: 'Template Updated Successfully' },
              verticalPosition: 'top',
              horizontalPosition: 'right'
            });
            if (this.statusBy == '' || this.selectedItem['status'] == this.templatesForm.value.status) {
              this.selectedItem['label'] = this.templatesForm.value.name;
              this.setForm(res.result.data);
            } else {
              this.getTemplates();
            }
          } else {
            this.duplicateError = res.result.data;
          }
        })
        .catch(err => {
          this.promise = undefined;
        })

    }
  }

  getTemplateDetails() {
    this.detailsLoader = true;
    this.adminService
      .getApi('getVendorTemplatesDetails', { id: this.selectedItem['id'] })
      .then(res => {
        this.detailsLoader = false;
        if (res.result.success) {
          this.setForm(res.result.data[0]);
        }
      });
  }

  removeMilestone(milestone) {
    this.milestones = _.filter(this.milestones, (value) => {
      return value['id'] != milestone['id'];
    });
  }

  removeAllMilestones() {
    this.milestones = [];
  }

  // addMilestones() {
  //   let taskId = Math.round(Math.random() * 100);
  //   this.milestones.push({
  //     "id": String(taskId),
  //     "label": "1st Proof",
  //     "css":"dept",
  //     "children":[ ]
  //   });
  // }

  duplicateMilestone() {
    this.dialogRef = this.dialog.open(AddTemplateComponent, {
      panelClass: 'recon-dialog',
      width: '500px',
      data: {
        title: 'Add Template',
        saveApi: 'duplicateVendorTemplates',
        params: {
          id: this.selectedItem['id'],
          department_id: this.selectedParent['id']
        }
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Template Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getTemplates();
      }
    });
  }

  resetMilestones() {
    this.milestones = _.cloneDeep(this.milestonesRef);
  }

  saveMilestones() {
    let task_ids = [];
    _.map(this.milestones, (value) => {
      task_ids.push(value.id);
    });
    this.adminService.saveApi('saveVendorTemplateTasks', {
      template_id: this.selectedItem['id'],
      action_type: 'edit',
      task_ids: task_ids
    }).then(() => {
      this.getMilestones();
    });
  }

}
