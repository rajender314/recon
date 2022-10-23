import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { GridOptions, GridApi, ColumnApi } from 'ag-grid-community';
import { forkJoin } from 'rxjs';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
let APP = window['APP'];
@Component({
  selector: 'app-create-related-projects',
  templateUrl: './create-related-projects.component.html',
  styleUrls: ['./create-related-projects.component.scss']
})
export class CreateRelatedProjectsComponent implements OnInit {

  public submitted = false;
  public loader = true;
  @ViewChild('stepper') stepper: ElementRef;
  public state = {
    links: [
      { label: "Select Projects", type: 0 },
      { label: "Add a New Project", type: 1 }
    ],
    activeTab: { label: "Select Projects", type: 0 },
    companyCodes: [],
    company_code: [],
    jobsList: []
  }

  public gridApi: GridApi;
  public columnApi: ColumnApi;
  public gridOptions: GridOptions = {
    columnDefs: [
      { headerName: "Project Name", field: 'job_no', cellRenderer: "agGroupCellRenderer",
        cellRendererParams: {
          checkbox: true,
          suppressCount: true,
          innerRenderer: (params) => {
            return `
            <div class="project-card">
							<div class="pro-logo" style="background-image: url('${params.data.logo}');"></div>
						<div class="project-name-id">							
						<span class="ellipsis-text" title="${params.data.job_title}">${params.data.job_title}</span>
						<span class="muted ellipsis-text" title="${params.data.job_no}">${params.data.job_no}</span>
					</div>							
            </div>
            `;
          },
        },
        headerCheckboxSelection: true 
      },
      { headerName: "Company Name / Code", field: 'company_name',cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        innerRenderer: (params) => {
          return `
          <div style="display: flex;flex-direction: column; line-height: 1.3;  position: relative; top: 0px;">
          <span class="ellipsis-text" title="${params.data.company_name}">${params.data.company_name}</span>
          <span class="muted ellipsis-text" title="${params.data.company_code}">${params.data.company_code}</span>
        </div>
          `;
        },
      }, 
    }
    ],
    rowHeight: 48,
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
      this.gridApi = params.api;
      this.columnApi = params.columnApi;
      setTimeout(() => {
        this.gridApi.sizeColumnsToFit();
        this.setJobsData();
      }, 100);
    },
    sortingOrder: ["asc", "desc"],
    enableRangeSelection: true,
    floatingFilter: false,
    rowGroupPanelShow: 'never',
    pivotPanelShow: 'never',
    sideBar: false,
    rowData: []
  }

  promise: any = undefined;

  constructor(
    private dialogRef: MatDialogRef<CreateRelatedProjectsComponent>,
    private commonService: CommonService,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.getCompanyCodes();
  }

  setJobsData(){
    (<GridApi>this.gridApi).setRowData(this.state.jobsList);
  }

  search(ev){
    this.gridApi.setQuickFilter(ev);
  }

  addRelatedJobs(){
    if(!this.promise) {
      let params = {
        jobs_id: this.data.jobs_id
      };
      let selectedProjects = [];
      this.gridApi.getSelectedRows().map((job)=>{
        selectedProjects.push(job.id);
      });
      if(this.state.activeTab.type==0){
        params['relate_job_ids'] = selectedProjects;
      }else if(this.state.activeTab.type==1){
        params['company_code_ids'] = this.state.company_code;
      }
      this.commonService.update({ type: 'overlay', action: 'start' });
      this.promise = this.commonService.saveApi('saveRelatedJob', params).then((res) => {
        if (res && res['result'] && res['result'].success) {
          this.commonService.update({ type: 'overlay', action: 'stop' });
          this.dialogRef.close({success: true});
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Related Projects Added Successfully.' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
        }
        this.promise = undefined;
      }).catch(err => {
        this.promise = undefined;
        this.commonService.update({ type: 'overlay', action: 'stop' });
      });
    }
  }

  getCompanyCodes() {
    forkJoin(
      this.commonService.getApi('getUserJobCompanyCode', {
        id: APP.recon_user[0].id,
        status: true
      }),
      this.commonService.saveApi('jobLists', {
        column: "start_date",
        page: 1,
        pageSize: 100,
        search: "",
        sort: "desc",
        type: "all",
        flag: 'related_projects',
        id: this.data.jobs_id
      })
    ).subscribe(([res1, res2]) => {
      if (res1['result'].success) {
        this.state.company_code = [res1['result'].data.default_company];
        this.state.companyCodes = res1['result'].data.items;
      }
      if (res2['result'].success) {
        this.state.jobsList = res2['result'].data.list;
      }
      if(res1['result'].success && res2['result'].success){
        this.loader = false;
      }
    });
  }

  setActiveTab(tab): void {
    this.state.activeTab = tab;
    this.stepper['selectedIndex'] = tab.type;
  }

  closeDialog = () => {
    this.dialogRef.close();
  }

  saveDetails = () => {
    this.submitted = true;
  }

}
