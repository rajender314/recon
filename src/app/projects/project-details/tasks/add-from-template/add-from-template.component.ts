import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GridApi, GridOptions, RowNode, ColDef, ColumnApi, Column } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { TemplateNameCell, AgOwlDatePickerCell, AgNoteCell, TemplateAssigneeCell, TemplateOrderCell, TemplateTaskTypeCell, TemplateProductServiceCell } from './add-form-template.ag-grid';

import * as _ from 'lodash';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-add-from-template',
  templateUrl: './add-from-template.component.html',
  styleUrls: ['./add-from-template.component.scss']
})
export class AddFromTemplateComponent implements OnInit {

  selectedRowId: any;
  userTypes: Array<any> = [
    { id: 1, name: "Group", key: 'group' },
    // { id: 3, name: "Job Specific", key: 'job_specific' },
    { id: 2, name: "User", key: 'user' }
  ];
  breadcrumbs = [
    { label: 'Projects', type: 'link', route: '/projects' },
    { label: this.data.jobDetails.job_title, type: 'link', route: '/projects/'+this.data.jobDetails.id+'/tasks/list' },
    { label: 'Add from Template', type: 'text' },
  ];
  usersList: any = {
    group: [],
    // job_specific: [{ id: 1, name: 'The person adding Template' }, { id: 2, name: 'Job Coordinator' }],
    user: []
  }
  taskTypes: any = {
    list: []
  };

  promise: any = undefined;

  gridApi: GridApi;
  gridData: Array<any> = [];
  gridOptions: GridOptions = {
    rowHeight: 40,
    headerHeight: 38,
    columnDefs: [
      { headerName: 'Description', field: 'description' }
    ],
    groupDefaultExpanded: -1,
    animateRows: true,
    suppressAggFuncInHeader: true,
    autoGroupColumnDef: {
      headerName: 'Template Name',
      field: 'name',
      minWidth: 200,
      maxWidth: 500,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRendererFramework: TemplateNameCell,
        suppressCount: true,
        selectedId: null
      }
    },

    treeData: true,
    getDataPath: data => {
      return data.hireracy;
    },

    rowSelection: 'single',
    stopEditingWhenGridLosesFocus: true,
    suppressDragLeaveHidesColumns: true,
    rowData: [],
    icons: {
      groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
      groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
    },
    onGridReady: params => {
      this.gridApi = params.api;
      this.getTemplates(() => {
        this.gridApi.sizeColumnsToFit();
      });
    },
    onRowClicked: ev => {
      if (ev.data && ev.data.type == 'template') {
        ev.columnApi.getAllDisplayedColumns().map(o => {
          if (o.getColId() == 'ag-Grid-AutoColumn') {
            const params = o.getColDef();
            params.cellRendererParams.selectedId = ev.data.id;
            o.setColDef(params, {})
          }
        })
      }
    },
    isRowSelectable : params => {
      return params.data && params.data.hasOwnProperty('id') && params.data.type == 'template' ? true : false;
    }
  }

  columns: Array<string> = ['task_type_id', 'user_id', 'start_date', 'due_date'];
  templateGrid: GridApi;
  templateGridColumn: ColumnApi;
  templateGridData: Array<any> = [];
  importTemplateData: any;
  templateGridOptions: GridOptions = {
    rowHeight: 50,
    headerHeight: 38,
    columnDefs: [
      { headerName: 'Import', pinned: 'left', field: 'order', minWidth: 90, width: 90, maxWidth: 90, cellClass:' lh-50', cellRendererFramework: TemplateOrderCell },
      {
        headerName: 'Tasks/Milestones', pinned: 'left', field: 'label', minWidth: 200, width: 200, cellClass:' lh-50', maxWidth: 200, cellRenderer: params => {
          return params.data ? (params.data.task_type == 2 ? '<div style="display: flex; align-items: center;"><span class="my-pixel-icon yellow" style="width: 25px;height: 25px;margin-right: 10px;"><i class="pixel-icons icon-milestones"></i></span>' + params.value + '</div>' : params.value) : ''
        }
      },
      {
        headerName: 'Task Type', field: 'task_type_id', cellClass:'lh-50', minWidth: 200, width: 200, maxWidth: 200, cellRendererFramework: TemplateTaskTypeCell, cellRendererParams: {
          taskTypes: this.taskTypes,
          submitted: false
        }
      },
     
      {
        headerName: 'Assigned to', field: 'user_id', minWidth: 300, cellClass:'lh-50', width: 300, maxWidth: 300, cellRendererFramework: TemplateAssigneeCell, cellRendererParams: {
          userTypes: this.userTypes,
          usersList: this.usersList,
          jobCoordinators: this.data.jobDetails.job_coordinators,
          submitted: false
        }
      },
      {
        headerName: 'Activation Date', cellClass:'lh-50',  field: 'start_date', cellRendererFramework: AgOwlDatePickerCell, minWidth: 220, width: 220, maxWidth: 230, cellRendererParams: {
          field: 'start_date',
          submitted: false
        }
      },
      {
        headerName: 'Due Date', field: 'due_date',  cellClass:'lh-50',  cellRendererFramework: AgOwlDatePickerCell, minWidth: 220,  width: 220, maxWidth: 230, cellRendererParams: {
          field: 'due_date',
          submitted: false
        }
      },
      { headerName: 'Products', field: 'products', cellClass:'lh-50', width: 120, cellRendererFramework: TemplateProductServiceCell, cellRendererParams: {
        jobs_id: this.data.jobs_id,
        edit: true
      } },
      { headerName: 'Notes', field: 'note',  cellClass:' lh-50', cellRendererFramework: AgNoteCell, minWidth: 100, width: 100, maxWidth: 100 }
    ],
    rowData: [],

    getRowNodeId: data => {
      return data.id
    },

    onGridReady: params => {
      this.templateGrid = params.api;
      this.templateGridColumn = params.columnApi;
    }
  }

  constructor(
    private _commonService: CommonService,
    private _taskService: TaskService,
    private _dialogRef: MatDialogRef<AddFromTemplateComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.getScheduleUsers();
    this.getTaskTypes();
  }

  getTaskTypes() {
    this._commonService.getApi('getTaskTypes', { type: 'dropdown' })
      .then(res => {
        if (res['result'].success) {
          this.taskTypes.list = res['result'].data;
        }
      })
  }

  closeDialog(){
    this._dialogRef.close();
  }

  getScheduleUsers() {
    this._commonService.getApi('scheduleTemplateUsers', { status: true })
      .then(res => {
        if (res['result'].success) {
          this.usersList.group = res['result'].data.groups || [];
          this.usersList.user = res['result'].data.users || [];
          // this.userTypes.map(u => {
          //   if (u.id != 3)
          //     this.usersList[u.key] = res['result'].data.filter(o => {
          //       if (o.type == u.id) return true;
          //       else return false;
          //     })
          // })
        }
      })
  }

  searchTemplates(event){
    if (this.gridApi) {
      let templateData = {
        orgs: [],
        otherOrgs: []
      };
      templateData.orgs = this.importTemplateData.orgs.filter((template)=>{
        return template.name.toLowerCase().includes(event.toLowerCase());
      });
      templateData.otherOrgs = this.importTemplateData.otherOrgs.filter((template)=>{
        return template.name.toLowerCase().includes(event.toLowerCase());
      });
      let gridData = this.treeData(templateData, event!='');
      this.gridApi.setRowData(gridData);
    }
  }

  getTemplates(cb?) {
    this._commonService.getApi('getClientTemplates', { orgId: this.data.jobDetails.org_id })
      .then(res => {
        if (res['result'].success) {
          this.importTemplateData = res['result'].data;
          this.gridData = this.treeData(res['result'].data);
          if (this.gridApi) this.gridApi.setRowData(this.gridData);
          if (cb) cb();
        }
      })
  }

  treeData(data, search?: any) {
    let arr = [];
    arr.push({
      id: this.data.jobDetails.org_id,
      name: this.data.jobDetails.org_name,
      hireracy: [this.data.jobDetails.org_id],
      type: 'parent'
    })
    if(data.orgs.length) {
      data.orgs.map(o => {
        arr.push({ ...o, ...{ hireracy: [this.data.jobDetails.org_id, o.id], type: 'template' } })
      })
    } else {
      arr.push({...{ name: (search)?'No Templates Found':'No Templates Added', hireracy: [this.data.jobDetails.org_id, 'no-orgs'], type: 'no-data' }})
    }
    arr.push({
      id: 'new*#*123',
      name: 'Other Organization',
      hireracy: ['new*#*123'],
      type: 'parent'
    })
    if(data.otherOrgs.length) {
      data.otherOrgs.map(o => {
        arr.push({ ...o, ...{ hireracy: ['new*#*123', o.id], type: 'template' } });
      })
    } else {
      arr.push({...{ name: (search)?'No Templates Found':'No Templates Added', hireracy: ['new*#*123', 'no-other-orgs'], type: 'no-data' }})
    }
    return arr;
  }

  selectionChange(stepper) {
    this.data.title = 'Import Template';
    if (stepper.selectedIndex == 1) {
      const selected = this.gridApi.getSelectedRows()[0];
      this.data.title = this.data.title + ' - ' + selected.name;
      this.getSelectedTemplateTasks(selected.id);
    }
  }

  getSelectedTemplateTasks(id) {
    this._commonService.getApi('scheduleTemplateTasksDetails', { id: id })
      .then(res => {
        if (res['result'].success) {
          this.templateGridData = this.frameTreeData(res['result'].data);
          if (this.templateGrid) {
            this.templateGrid.setRowData(this.templateGridData);
          }
        }
      })
  }

  frameTreeData(data) {
    let arr = [];
    data.map((o, i) => {
      o.selected = true;
      arr.push({ ...o, ...{ hireracy: [o.id], type: 'parent', order: i + 1 } });
      if (o.hasOwnProperty('subtask_list') && o.subtask_list.length) {
        o.subtask_list.map((p, j) => {
          p.selected = true;
          arr.push({ ...p, ...{ hireracy: [o.id, p.id], type: 'child', order: (i + 1) + '.' + (j + 1),parentLabel:o.label } });
        })
      }
    })
    return arr;
  }

  getSelectedRows() {
    const rows = [];
    this.templateGrid.forEachNode((o: RowNode) => {
      if (o.data.selected) rows.push(o.data);
    });
    return rows;
  }

  importTemplate() {
    if(!this.promise) {
      const params = []; let valid = true;
      this.templateGrid.forEachNode((o: RowNode) => {
        if (o.data.selected) {
          let row = {
            id: '',
            assignee_id: o.data.user_id,
            assignee_type: o.data.user_type == 1 ? 2 : 1,
            assignee_name: o.data.user_name,
            associate_products: o.data.associate_products || [],
            due_date: o.data.due_date || null,
            is_milestone: o.data.task_type == 1 ? false : true,
            jobs_id: this.data.jobDetails.id,
            note: o.data.note || '',
            products: o.data.products || {},
            slug: '',
            start_date: o.data.start_date || null,
            task_id: o.data.id,
            task_name: o.data.label,
            task_type_id: o.data.task_type_id,
            task_type_name: o.data.task_type_name,
            billing_type_id: o.data.billing_type_id,
            status_ids: o.data.status_ids,
            subTasks: []
          }
          if (!o.data.task_type_id || (o.data.task_type == 1 && !o.data.user_id) || !o.data.due_date || (!o.data.associate_products && o.data.task_type_id=='1')) valid = false;
          if (o.data.type == 'child') {
            const parent = _.find(params, ['task_id', o.data.hireracy[0]]);
            if (parent) {
              if (parent.hasOwnProperty('subTasks')) {
                parent.subTasks.push(row);
              } else {
                parent.subTasks = [row];
              }
            }
          } else {
            params.push(row);
          }
        }
      })
      
      if(!params.length) valid = false;

      this._taskService.update({ type: 'template-grid-validation', data: !valid });
      this.templateGridColumn.getAllColumns().map((o: Column) => {
        if (this.columns.indexOf(o.getColId()) > -1) {
          const params = o.getColDef();
          params.cellRendererParams.submitted = !valid;
          o.setColDef(params, {})
        }
      })
      if (valid) {
        this._commonService.update({ type: 'overlay', action: 'start' });
        this._taskService.update({ type: 'template-grid-validation', data: valid });
        this.promise = this._commonService.saveApi('saveTemplatesTasks', { taskTemp: params })
          .then(res => {
            this.promise = undefined;
            if (res['result'].success) {
              this._dialogRef.close({ succes: true, data: res['result'].data });
            }
            this._commonService.update({ type: 'overlay', action: 'stop' });
          })
          .catch(err => {
            this.promise = undefined;
            this._commonService.update({ type: 'overlay', action: 'stop' });
          })
      }
    }
  }
}
