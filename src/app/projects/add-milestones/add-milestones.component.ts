import { Component, OnInit, ViewChild, ElementRef, Input, Inject } from '@angular/core';
import { MatDialogRef, MatDialogContent, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { GridApi, ColumnApi, GridOptions } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';

import * as _ from 'lodash';
import { AgSearchHeaderCell } from '@app/shared/components/ag-grid/custom-header-renderer';

@Component({
  selector: 'app-add-milestones',
  templateUrl: './add-milestones.component.html',
  styleUrls: ['./add-milestones.component.scss']
})
export class AddMilestonesComponent implements OnInit {

  public submitted = false;
  public loader = false;
  @ViewChild('stepper') stepper: ElementRef;
  public state = {
    links: [
      { label: "Project", type: 0 },
      { label: "Vendor", type: 1 }
    ],
    activeTab: { label: "Job", type: 0 },
    jobsList: [],
    cloneList: []
  }

  public jobsGridApi: GridApi;
  public jobsColumnApi: ColumnApi;

  public gridOptions: GridOptions = {
    columnDefs: [
      {
        headerName: "Project Tasks/Milestones", field: 'task_name', cellRenderer: "agGroupCellRenderer",
        cellRendererParams: {
          checkbox: true,
          suppressCount: true,
          innerRenderer: (params) => {
            return `
              <div class="task-name d-flex align-items-center window-task-types"><span class="sub-tasks-grid-icon"><i class="pixel-icons icon-${params.data.is_milestones ? 'milestones' : 'task-fill'}"></i></span> <span>${params.data.task_name}<span></div>
            `;
          },
        },
        headerCheckboxSelection: true
      },
      { headerName: "", field: 'due_date', headerComponentFramework: AgSearchHeaderCell }
    ],
    rowHeight: 38,
    headerHeight: 36,
    animateRows: true,
    rowMultiSelectWithClick: true,
    rowSelection: 'multiple',
    deltaRowDataMode: true,
    stopEditingWhenGridLosesFocus: true,
    suppressDragLeaveHidesColumns: true,
    suppressMakeColumnVisibleAfterUnGroup: false,
    suppressAggFuncInHeader: true,
    enableCellChangeFlash: true,
    getRowNodeId: data => {
      return data.id;
    },
    defaultColDef: {
      sortable: true,
      resizable: false,
      filter: false,
      suppressMovable: true
    },
    onGridReady: (params) => {
      this.jobsGridApi = params.api;
      this.jobsColumnApi = params.columnApi;
      setTimeout(() => {
        this.jobsGridApi.sizeColumnsToFit();
        // this.setJobsData();
      }, 100);
    },
    onFilterChanged: params => {
      if (params.api.getDisplayedRowCount() == 0) {
        this.jobsGridApi.showNoRowsOverlay();
      }
      else this.jobsGridApi.hideOverlay();
    },
    sortingOrder: ["asc", "desc"],
    enableRangeSelection: true,
    floatingFilter: false,
    rowGroupPanelShow: 'never',
    pivotPanelShow: 'never',
    sideBar: false,
    rowData: []
  }
  public vendorGridOptions: GridOptions;
  public vendorsGridApi: GridApi;
  public vendorsColumnApi: ColumnApi;

  constructor(
    private dialogRef: MatDialogRef<AddMilestonesComponent>,
    private commonService: CommonService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.vendorGridOptions = _.cloneDeep(this.gridOptions);
    this.vendorGridOptions.onGridReady = (params) => {
      this.vendorsGridApi = params.api;
      this.vendorsColumnApi = params.columnApi;
      setTimeout(() => {
        this.vendorsGridApi.sizeColumnsToFit();
      }, 100);
    },
      this.getTasks();
    // this.setJobsData();
  }

  getTasks() {
    this.loader = true;
    /*this.commonService.saveApi('getAllTasks', {type: "dropdown", jobs_id: this.data.jobs_id}).then((res) => {
      this.loader = false;
      if (res && res['result'] && res['result'].success) {
        this.state.jobsList = res['result'].data;
        this.setJobsData();
      }
    });*/
    this.commonService.getApi('estTimeLine', {
      jobs_id: this.data.jobs_id,
      estimates_id: this.data.estimates_id
    }).then(res => {
      if (res['result'].success) {
        this.loader = false;
        this.state.cloneList = _.cloneDeep(res['result'].data.masterDt);
        this.state.jobsList = res['result'].data.masterDt;
        this.gridOptions.rowData = _.cloneDeep(this.state.cloneList.filter((item) => {
          return (item.jobs_task_type == 1) ? true : false;
        }));
        this.vendorGridOptions.rowData = _.cloneDeep(this.state.cloneList.filter((item) => {
          return (item.jobs_task_type == 2) ? true : false;
        }));
        this.visibility = true;
        // this.onTabChange();
      }
    });
  }

  setActiveTab(tab): void {
    this.state.activeTab = tab;
    this.stepper['selectedIndex'] = tab.type;
    // this.onTabChange();
  }

  visibility: boolean = false;
  onTabChange() {
    // this.visibility = false;
    // if (this.state.activeTab.type == 0) { // Job
    //   this.gridOptions.rowData = _.cloneDeep(this.state.cloneList.filter((item) => {
    //     return (item.jobs_task_type == 1) ? true : false;
    //   }));
    // } else if (this.state.activeTab.type == 1) { // Vendor
    //   this.gridOptions.rowData = _.cloneDeep(this.state.cloneList.filter((item) => {
    //     return (item.jobs_task_type == 2) ? true : false;
    //   }));
    // }

    // setTimeout(() => {
    //   this.jobsGridApi.setRowData(this.gridOptions.rowData || []);
    //   setTimeout(() => {
    //     this.visibility = true;
    //   }, 500);
    // }, 200);
  }

  search(ev) {
    this.jobsGridApi.setQuickFilter(ev);
  }

  closeDialog = () => {
    this.dialogRef.close();
  }

  addMilestones = () => {
    this.loader = true;
    let params = {
      id: 0,
      jobs_id: this.data.jobs_id,
      estimates_id: this.data.estimates_id
    };
    let jobIds = [];
    this.jobsGridApi.getSelectedRows().map((job) => {
      jobIds.push({ id: job.id, due_date: job.due_date });
    });
    this.vendorsGridApi.getSelectedRows().map((job) => {
      jobIds.push({ id: job.id, due_date: job.due_date });
    });
    params['jobs_tasks_id'] = jobIds;
    this.commonService.saveApi('saveEstTimeLn', params).then((res) => {
      this.loader = false;
      if (res && res['result'] && res['result'].success) {
        this.dialogRef.close({ success: true });
        this.snackbar.openFromComponent(SnackbarComponent, {
          data: { status: 'success', msg: 'Tasks/Milestones Added Successfully.' },
          verticalPosition: 'top',
          horizontalPosition: 'right'
        });
      }
    });
  }

}
