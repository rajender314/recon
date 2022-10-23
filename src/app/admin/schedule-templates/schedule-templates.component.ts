import { Component, OnInit } from '@angular/core';
import { AdminDashboard } from '@app/admin/admin.config';
import { Pagination } from '@app/shared/utility/types';
import { AdminService } from '@app/admin/admin.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Statuses, StatusFilter, SortFilter } from '@app/shared/utility/dummyJson';
import { ContactsService } from '@app/contacts/contacts.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddTemplateComponent } from '@app/admin/dialogs/add-template/add-template.component';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import * as _ from 'lodash';
import { MultiLevelSelectComponent } from '@app/shared/components/multi-level-select/multi-level-select.component';
import { AddTaskComponent } from '@app/admin/dialogs/add-task/add-task.component';
import { EditDependenciesComponent } from '@app/admin/dialogs/edit-dependencies/edit-dependencies.component';
import { EditScheduleFormsComponent } from '@app/admin/dialogs/edit-schedule-forms/edit-schedule-forms.component';
var APP: any = window['APP'];
@Component({
  selector: 'app-schedule-templates',
  templateUrl: './schedule-templates.component.html',
  styleUrls: ['../admin.component.scss', './schedule-templates.component.scss']
})
export class ScheduleTemplatesComponent implements OnInit {
  APP = APP;
  showView: boolean = false;
  isLoading: boolean = true;
  detailsLoader: boolean = false;
  promise:any;
  adminDashboard = AdminDashboard;
  public submitted = false;
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
    { label: 'Schedule Templates', type: 'text' },
  ];
  StatusFilter = [
    { label: 'All', value: '' },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  StatusFilterData = [
    { name: 'Active', id: true },
    { name: 'Inactive', id: false },
  ];
  public templateDetails = {
    create_date: "09-28-2018 06:35 PM",
    created_by: "Recon Dev User",
    modify_date: "2018-11-29 09:26:45",
    last_modify_by: "Recon Dev User"
  }; 
  public duplicateError = '';
  public selectedItem = {
    id: 0
  };
  templatesForm: FormGroup;
  statusBy: string = 'Active';
  dropdowns = {
    sortFilter: SortFilter,
    statusFilter: StatusFilter,
    status: Statuses,
    addOns: []
  };
  activeTab: number = 0;
  clientAccess = [];
  public tasks = [];
  public dialogRef: any;
  state = {
		tabs: [
		  { label: 'Details', type: 'details' },
		  { label: 'Clients', type: 'clients' },
		  { label: 'Tasks', type: 'tasks' },
		]
	  };
  constructor(
    private adminService: AdminService,
    private contactsService: ContactsService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) { }

  ngOnInit() {
    this.getTemplates();

  }

  removeDuplicate(){
    this.duplicateError = '';
  }

  addTemplate = () => {
    this.dialogRef = this.dialog.open(AddTemplateComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: 'Add Schedule Template',
        saveApi: 'saveScheduleTemplate',
        params: {}
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

  resetForm() {
    this.getTabData();
  }

  createForm() {
    this.templatesForm = this.fb.group({
      name: ['', Validators.required],
      status: null,
      description: '',
      parentCompany: [true, Validators.required]
    });
  }

  setForm(data) {
    this.templatesForm.patchValue({
      name: data.name,
      status: data.status,
      description: data.description,
      parentCompany: true
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
    this.getTemplates('search');
  }

  getTemplates(type?: any) {
    this.isLoading = true;
    this.adminService
      .getApi('getScheduleTemplateList', this.param).then(response => {
        this.isLoading = false;
        if (response.result.success) {
          this.leftNav = response.result.data;
          this.totalCount = response.result.data.length;
          if (this.leftNav.length) {
            this.onSelectItem(this.leftNav[0]);
          }
        }
      });
  }

  onSelectItem(item) {
    this.duplicateError = '';
    this.selectedItem = item;
    this.getTabData();
  }

  saveDetails(form?: any) {
    if(!this.promise){
    // this.detailsLoader = true;
    this.submitted = true;
    this.duplicateError = '';
		if (form.valid) {
     this.promise = this.adminService
        .saveApi('saveScheduleTemplate', { ...{ id: this.selectedItem['id'] }, ...this.templatesForm.value })
        .then(res => {
          this.promise = undefined;
          // this.detailsLoader = false;
          this.submitted = false;
          if (res.result.success) {
            this.snackbar.openFromComponent(SnackbarComponent, {
              data: { status: 'success', msg: 'Template Updated Successfully' },
              verticalPosition: 'top',
              horizontalPosition: 'right'
            });
            if(this.statusBy=='' || this.selectedItem['status']==this.templatesForm.value.status){
              this.selectedItem['name'] = this.templatesForm.value.name;
              this.setForm(res.result.data);
            }else{
              this.getTemplates('search');
            }
          }else{
            this.duplicateError = res.result.data;
          }
        })
        .catch(err =>{
          this.promise = undefined;
        })
    }
  }
  }

  getTabData(): void {
    this.detailsLoader = true;
    switch (this.activeTab) {
      case 0:
        this.createForm();
        this.getTemplateDetails();
        break;
      case 1:
        this.getClientAccess();
        break;
      case 2:
        this.getTasks();
        break;
    }
  }

  getTasks() {
    this.detailsLoader = true;
    this.adminService
      .getApi('scheduleTemplateTasksDetails', {id: this.selectedItem['id']}).then(response => {
        this.detailsLoader = false;
        if (response.result.success) {
          this.tasks = response.result.data;
        }else{
          this.tasks = [];
        }
      });
  }

  getTemplateDetails() {
    this.detailsLoader = true;
    this.adminService
      .getApi('getScheduleTemplateDetails', { id: this.selectedItem['id'] })
      .then(res => {
        this.detailsLoader = false; 
        if (res.result.success) {
          Object.assign(this.templateDetails, res.result.data[0]);
          this.setForm(res.result.data[0]);
        }
      });
  }

  getClientAccess = () => {
    this.detailsLoader = true;
    this.contactsService.getOrganizations({
      org_type: 2,
      status: true
    }).then(res => {
      if (res.result.success) {
        this.clientAccess = res.result.data;
        this.detailsLoader = false;
      }
    });
  }

  onTabChange = (index) => {
    this.activeTab = index;
    this.getTabData();
  }

  removeAllTasks() {
    this.tasks = [];
    this.saveTasks();
  }

  duplicateTemplate() {
    this.dialogRef = this.dialog.open(AddTemplateComponent, {
      panelClass: 'recon-dialog',
      width: '500px',
      data: {
        title: 'Add Template',
        saveApi: 'cloneScheduleTemplates',
        params: {
          template_id: this.selectedItem['id']
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

  addTask(task?: any, type?: any, parentId?) {
    let title = '';
    if(type) {
      if(task && task.id != parentId) title = 'Edit Sub Task';
      else title = 'Add Sub Task';
    } else if(task) {
      title = 'Edit Task';
    } else {
      title = 'Add Task';
    }
    this.dialogRef = this.dialog.open(AddTaskComponent, {
      panelClass: 'recon-dialog',
      width: '500px',
      data: {
        title: title,
        id: this.selectedItem['id'],
        task: type && type == 'sub' ? (task.id != parentId ? task : null) : task ? task : null, // (task && task.id && !type)?task:'',
        params: {
          template_id:this.selectedItem['id'],
          parent_id: type && type == 'sub' ?  parentId : (task ? task.id : ''),
          id: task && !type ? task.id : '' // (task && task.id && !type)?task.id:''
        }
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Tasks Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getTasks();
      }
    });
  }

  export = () => {  
      window.location.href = APP.api_url + 'exportScheduleTemplates' + '?status=' + this.param.status + '&sort=' + this.param.sort + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
  }
  
  getEditForms(task?: any) {
    this.dialogRef = this.dialog.open(EditScheduleFormsComponent, {
      panelClass: 'recon-dialog',
      width: '500px',
      data: {
        title: 'Edit Forms',
        id: this.selectedItem['id'],
        task: (task && task.id)?task:'',
        selectedForms: task.forms,
        params: {
          id:(task && task.id)?task.id:''
        }
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Forms Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getTasks();
      }
    });
  }

  editDependencies(task?: any, index?: any) {
    let selectedDependencies = [];
    if(task && task.id){
      _.map(task.dependencies, (value) => {
        selectedDependencies.push(value.id);
      });
    }
    let dependencies = _.filter(this.tasks, function(val, i){
      if(selectedDependencies.indexOf(val.id)==-1){
        val.checked = false;
      }else{
        val.checked = true;
      }
      if(i<index && val.task_type==1){
        return true;
      }
      return false;
    });

    this.dialogRef = this.dialog.open(EditDependenciesComponent, {
      panelClass: 'recon-dialog',
      width: '500px',
      data: {
        title: 'Edit Dependencies',
        id: this.selectedItem['id'],
        row: index,
        tasks: dependencies,
        task: (task && task.id)?task:'',
        params: {
          template_id:this.selectedItem['id'],
          parent_id:(task && task.id)?task.id:'',
          id:(task && task.id)?task.id:''
        }
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Dependencies Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getTasks();
      }
    });
  }

  addMultipleTasks() {
    this.dialogRef = this.dialog.open(MultiLevelSelectComponent, {
      panelClass: 'recon-dialog',
      width: '600px',
      data: {
        title: 'Add Task',
        id: this.selectedItem['id'],
        saveApi: 'saveScheduleMultiTasks',
         params: {
          template_id: this.selectedItem['id'],
          task_type: 1,
          user_type: 1,
          header: 'All Tasks',
          search: true
         },
         type: 'grid'
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Tasks Added Successfully' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
        this.getTasks();
      }
    });
  }

  removeTask(list, item) {
    return _.filter(list, (value) => {
      return value['id']!=item['id'];
    });
  }

  resetTasks() {
    this.getTasks();
  }

  saveTasks() {
    let task_ids = [];
    let sub_task_ids = {};
    _.map(this.tasks, (value) => {
        task_ids.push(value.id);
        if(value.subtask_list && value.subtask_list.length){
          sub_task_ids[value.id] = [];
          _.map(value.subtask_list, (sub) => {
            sub_task_ids[value.id].push(sub.id);
          });
        }
    });
    this.adminService.saveApi('saveScheduleTasksOrder', {
      template_id: this.selectedItem['id'], 
      task_ids: task_ids,
      sub_task_ids: sub_task_ids
    }).then(() => {
      this.getTasks();
    });
  }

}
