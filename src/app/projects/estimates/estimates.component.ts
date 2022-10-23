import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ChangeEstimateComponent } from '@app/projects/change-estimate/change-estimate.component';
import { AddEstimateComponent } from '@app/projects/add-estimate/add-estimate.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '@app/common/common.service';
import { GridOptions, GridApi, ColumnApi, RowNode } from 'ag-grid-community';
import { EstimateHeaderCheck, EstimateCheck } from '@app/projects/estimates-grid/estimates-grid.component';
import { findSafariExecutable } from 'selenium-webdriver/safari';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import * as _ from 'lodash';
import { DeleteComponent } from '@app/shared/components/delete/delete.component';
import { SendEstimateComponent } from '@app/projects/send-estimate/send-estimate.component';
import { Subscription, forkJoin } from 'rxjs';
import { ProjectSubNav } from '@app/shared/utility/config';
import { ProjectDetailsService } from '../project-details/project-details.service';
import { CloneEstimateComponent } from '@app/projects/clone-estimate/clone-estimate.component';
import { EstimatingCompleteComponent } from '../estimating-complete/estimating-complete.component';
var APP: any = window['APP'];
@Component({
  selector: 'app-estimates',
  templateUrl: './estimates.component.html',
  styleUrls: ['./estimates.component.scss'],
  host: {
    //class: 'estimates-container'
  },
})
export class EstimatesComponent implements OnInit, OnDestroy {
  APP = APP;
  public dialogRef: any;
  projectDetails: any;
  public state = {
    jobActive: false,
    allowEditable: false,
    projectID: null,
    projectStatusID: null,
    loader: true,
    preview: false,
    estimates: [],
    revisions: [],
    selectedRevision: '',
    selectedEstimate: null,
    breadcrumbs: [
      { label: 'Projects', type: 'link', route: '/projects' },
      { label: 'Name', type: 'text' },
      /*  { label: 'Estimates', type: 'text' }, */
    ],
    allowEditEstimates: false,
    search: {
      placeHolder: "Search",
      value: ''
    },
    estimatesCount: 0,
    enablePostEstimate: false,
    enableSendEstimate: false,
    enableApproveEstimate: false,
    enableUnapproveEstimate: false
  };
  subNav: ProjectSubNav = {
    icons: 'icon-pn-estimates',
    title: 'Back to Project',
    allText: 'All Estimates',
    className: 'estimate',
    noData: 'No Estimates Generated',
    idKey: 'id',
    displayKey: 'estimate_no',
    statusClass: 'estimate-status',
    statusIdKey: 'status_id',
    statusNameKey: 'status_name',
    costKey: 'cost',
    count: 0,
    prefix: '',
    list: []
  }
  subscription: Subscription;
  commonSubscription: Subscription;
  navBarSubscription: Subscription;
  routerSubscription: Subscription;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private activatedRoute: Router,
    private commonService: CommonService,
    private router: Router,
    private _projectDetailService: ProjectDetailsService
  ) {
    this.state.breadcrumbs[0].route = commonService.projectState ? ('/projects/' + commonService.projectState) : '/projects';
    this.commonSubscription = this.commonService.onUpdate().subscribe((obj) => {
      if (obj.hasOwnProperty('allEstimatesChk')) {
        this.checkAllEstimates(obj.allEstimatesChk);
      } else if (obj.hasOwnProperty('estimateChk')) {
        this.checkEstimate(obj.estimateChk);
      } else if (obj.type == 'job_status') {
        this.state.projectStatusID = obj.data.job_status_id;
        this.getEstimatesList();
      }
    });
    this.subscription = commonService.onUpdate().subscribe(obj => {
      if (obj && obj.type == 'projectName' && obj.data && Object.keys(obj.data).length) {
        this.state.projectStatusID = obj.data.job_status_id;
        this.state.breadcrumbs[1].label = obj.data.job_title || '----';
        this.projectDetails = obj.data;
        if ([8, 10].includes(obj.data.job_status_id)) {
          this.state.allowEditable = APP.permissions.job_access['post-completion_estimate'] == 'yes';
        } else if (obj.data.job_status_id == 5) {
          this.state.allowEditable = APP.permissions.job_access.edit_cancelled_jobs == 'yes';
        } else {
          this.state.allowEditable = true;
        }
      }
    })

    this.navBarSubscription = commonService.onUpdate().subscribe(ev => {
      if (ev.type == 'grid-view') {
        if (ev.data.isActive) this.state.selectedEstimate = null;
      } else if (ev.type == 'preview') {
        if (!this.state.selectedEstimate || this.state.selectedEstimate.id != ev.data.id) {
          this.state.selectedEstimate = ev.data;
          this.getEstimateDetails({ data: ev.data });
        }
      }

      if (ev.type == 'estimate-posted') {
        this.updateJobStatus();
        let estimateIds = [];
        _.map(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Draft") {
            estimateIds.push(estimate.id);
          }
        });
        if (estimateIds.length) {
          this.getEstimatesList();
          this.commonService.saveApi('avalaraTaxCalc', {
            jobs_id: this.route.parent.snapshot.params.id,
            estimate_ids: estimateIds,
            is_estimate: true
          })
        }
      } else if (ev.type == 'estimate-approved') {
        this.updateJobStatus();
        let estimateIds = [];
        _.map(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Sent") {
            estimateIds.push(estimate.id);
          }
        });
        if (estimateIds.length) {
          this.getEstimatesList();
          this.commonService.saveApi('avalaraTaxCalc', {
            jobs_id: this.route.parent.snapshot.params.id,
            estimate_ids: estimateIds.join(','),
            is_estimate: true
          });
          this._projectDetailService.update({
            type: 'subnav-status', data: {
              selected: {
                id: this.state.selectedEstimate.id,
                status_id: 4,
                status_name: 'Approved',
              }
            }
          });
          this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
            status_id: 4,
            status_name: 'Approved'
          });
        }
      }
    })

    this.routerSubscription = route.parent.params.subscribe(param => {
      this.state.projectID = param.id ? param.id : null;
      this.getEstimatesList();
    });
  }

  ngOnInit() {
    // this.getEstimatesList();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.commonSubscription.unsubscribe();
    this.navBarSubscription.unsubscribe();
    this.routerSubscription.unsubscribe();
  }

  public gridApi: GridApi;
  public columnApi: ColumnApi;
  public columnDefs = [];
  public gridColumnApi;
  public gridOptions: GridOptions;

  buildEstimatesGrid(): void {
    this.columnDefs = [
      {
        headerName: 'ESTIMATES',
        field: 'name',
        width: 300,
        resizable: false,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        cellClass: (params) => { return (params.data.parent_id == '0' ? 'test' : 'test split-child-estimate'); },
        checkboxSelection: (params) => {
          return (params.data.parent_id == '0') ? true : false;
          // return true;
        },
        cellRendererFramework: EstimateCheck
      },
      {
        headerName: ' ',
        field: 'products_services',
        width: 80,
        headerClass: 'products-services',
        cellClass: 'products-services-cell',
        cellRenderer: (param) => {
          return '<div class="user-product-service"><span class="d-flex align-items-center"><i class="pixel-icons icon-products"></i><span>' + param.data.product_cnt + '</span></span> <span class="d-flex align-items-center m-l-15"><i class="pixel-icons icon-orders"></i><span>' + param.data.services_cnt + '</span></span></div>';
        }
      },
      {
        headerName: 'Status',
        field: 'status',
        cellClass: 'estimates-status status-cell',
        width: 80,
        cellRenderer: (param) => {
          return (param.data.parent_id == '0') ? '<span class="status estimate-status status_' + param.data.status_id + '">' + param.data.status_name + '</span>' : '';
        }
      },
      // {
      //   headerName: 'LAST MODIFIED',
      //   field: 'last_modified',
      //   cellClass: 'modified-grid',
      //   cellRenderer: (param) => {
      //     return '<div class="estimate-cell modified-grid-sec">' + param.data.last_modified_date + '</div>';
      //   }
      // },
      // {
      //   headerName: 'NO. OF TASKS',
      //   field: 'task',
      //   width: 126,
      //   headerClass: 'right-header-cell',
      //   cellClass: 'right-text-cell',
      //   cellRenderer: (param) => {
      //     return '<div class="estimate-cell task-grid-sec">' + param.data.task_count + '</div>';
      //   }
      // },
      {
        headerName: 'COST',
        field: 'cost',
        width: 80,
        headerClass: 'right-header-cell',
        cellClass: 'right-text-cell cost-cell color-dark medium-font',
        cellRenderer: (param) => {
          return '<div class="estimate-cell cost-grid-sec">' + param.data.cost + '</div>';
        }
      }
    ];
    this.gridOptions = {
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      animateRows: true,
      groupSelectsChildren: true,
      headerHeight: 38,
      rowSelection: 'multiple',
      icons: {
        groupExpanded: false,
        groupContracted: false
      },
      defaultColDef: {
        resizable: true,
        sortable: true
      },
      getRowHeight: (params) => {
        return 62;
      },
      rowData: this.state.estimates,
      pagination: true,
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
        if (this.columnApi.getAllDisplayedColumns.length) {
          this.columnApi.autoSizeColumns([this.columnApi.getAllDisplayedColumns[0].colDef]);
        }
        this.gridApi.sizeColumnsToFit();
      },
      onSelectionChanged: () => {
        let draftLIst = _.filter(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Draft") {
            return true;
          }
          return false;
        });
        let sentList = _.filter(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Posted" && estimate.est_sync_avalara == 2) {
            return true;
          }
          return false;
        });
        let approveList = _.filter(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Sent") {
            return true;
          }
          return false;
        });
        let unapproveList = _.filter(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Approved") {
            return true;
          }
          return false;
        });
        this.state.enablePostEstimate = false;
        this.state.enableSendEstimate = false;
        this.state.enableApproveEstimate = false;
        this.state.enableUnapproveEstimate = false;
        if (draftLIst.length == this.gridApi.getSelectedRows().length) {
          this.state.enablePostEstimate = true;
        } else if (sentList.length == this.gridApi.getSelectedRows().length) {
          this.state.enableSendEstimate = true;
        } else if (approveList.length == this.gridApi.getSelectedRows().length && approveList.length == 1) {
          this.state.enableApproveEstimate = true;
        } else if (unapproveList.length == this.gridApi.getSelectedRows().length && unapproveList.length == 1) {
          this.state.enableUnapproveEstimate = true;
        }
      },
      onRowClicked: (params) => {
        this.state.selectedEstimate = params.data;
        this.getEstimateDetails(params);
      }
    };
  }

  postEstimate() {
    let estimateIds = [];
    _.map(this.gridApi.getSelectedRows(), (estimate) => {
      if (estimate.status_name == "Draft") {
        estimateIds.push(estimate.id);
      }
    });
    this.estimatingComplete('Post', estimateIds);
  }

  updateJobStatus() {
    this.commonService.getApi('getJobInfo', { id: this.state.projectID, type: 'status' })
      .then(res => {
        if (res['result'].success) {
          this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
        }
      })
  }

  sendEstimate() {
    let estimateIds = [];
    let rev = 0;
    _.map(this.gridApi.getSelectedRows(), (estimate) => {
      if (estimate.status_name != "Draft") {
        rev = estimate.estimate_revision || 0;
        estimateIds.push(estimate.id);
      }
    });
    this.dialogRef = this.dialog.open(SendEstimateComponent, {
      panelClass: ['my-dialog', 'send-estimate'], //['confirmation-dialog', 'recon-dialog'], 
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        title: 'Send Estimate',
        msg: 'The estimates in Draft status will be posted?',
        selectedEstimates: this.gridApi.getSelectedRows(),
        selectedRevision: rev || 0,
        estimateIds: estimateIds,
        jobs_id: this.state.projectID,
        job: this.projectDetails
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.updateJobStatus();
        if (estimateIds.length) {
          // this.commonService.saveApi('updateEstStatus', {
          //   estimates_status_id: 2,
          //   ids: estimateIds
          // })
          //   .then(res => {
          //     if (res['result'] && res['result'].success) {
          this.getEstimatesList();
          //   }
          // });
        }
      }
    });
  }

  approveEstimate() {
    let estimateIds = [];
    _.map(this.gridApi.getSelectedRows(), (estimate) => {
      if (estimate.status_name == "Sent") {
        estimateIds.push(estimate.id);
      }
    });
    this.estimatingComplete('Approve', estimateIds);
  }

  estimatingComplete(flag = 'Post', ids = []) {
    const locals: any = {
      title: flag + ' ' + 'Estimate',
      msg: '',
      btnTxt: '',
      flag: flag,
      jobs_id: this.state.projectID,
      estimates_id: ids ? ids[0] : null,
      org_id: this.projectDetails.org_id
    };
    if (flag == 'Post') {
      locals.msg = 'Do you want to post costs to Estimates?';
      locals.btnTxt = 'Post Costs to Estimate';
      locals.url = 'updateEstStatus';
      locals.breadcrumbs = [...this.state.breadcrumbs, ...[{ label: 'Post Cost to Estimate', type: 'text'}]];
      locals.params = {
        estimates_status_id: 2,
        ids: ids
      }
    } else if (flag == 'Approve') {
      locals.msg = 'Do you want to Approve this Estimate?';
      locals.btnTxt = 'Approve Estimate';
      locals.url = 'estimateStatus';
      locals.breadcrumbs = [...this.state.breadcrumbs, ...[{ label: 'Approve Estimate', type: 'text' }]];
      locals.params = {
        estimates_status_id: 4,
        id: ids ? ids.join(',') : null,
        jobs_id: this.state.projectID
      }
    }
    this.dialog.open(EstimatingCompleteComponent, {
      panelClass: ['full-width-modal' , 'full-modal-box-ui'],
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: locals
    })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          if (!res.success && res.data) {
            this.dialogRef = this.dialog.open(DeleteComponent, {
              panelClass: ['my-dialog', 'test-2'],
              width: '600px',
              data: {
                title: 'Go To Estimate',
                msg: 'The services already approved in another estimate(' + res.data.estimateDt.estimate_no + ')',
              }
            });
            this.dialogRef.afterClosed().subscribe(result => {
              if (result && result.success) {
                this.activatedRoute.navigate(['/projects/' + this.state.projectID + '/estimates/' + res.data.estimateDt.id]);
              }
            });
          }
        }
      })
  }

  unapproveEstimate() {
    this.dialogRef = this.dialog.open(DeleteComponent, {
      panelClass: ['confirmation-dialog', 'recon-dialog'],
      width: '600px',
      data: {
        title: 'Unapprove Estimate',
        msg: 'The estimates in Approve status will be Changed to Sent?',
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.updateJobStatus();
        let estimateIds = [];
        _.map(this.gridApi.getSelectedRows(), (estimate) => {
          if (estimate.status_name == "Approved") {
            estimateIds.push(estimate.id);
          }
        });
        if (estimateIds.length) {
          this.state.loader = true;
          forkJoin(
            this.commonService.saveApi('estimateStatus', {
              estimates_status_id: 3,
              id: estimateIds.join(','),
              jobs_id: this.route.parent.snapshot.params.id
            })
          ).subscribe(([res]) => {
            if (res['result'] && res['result'].success) {
              this.getEstimatesList();
              this.commonService.saveApi('avalaraTaxCalc', {
                jobs_id: this.route.parent.snapshot.params.id,
                estimate_ids: estimateIds.join(','),
                is_estimate: true
              })
            }
          });
        }
      }
    });
  }

  getEstimateDetails(params): void {
    this.subNav['selectedItem'] = this.state.selectedEstimate;
    this.subNav['is_job_active'] = this.state.jobActive;
    this.subNav['count'] = this.state.estimatesCount;
    if (this.subNav.list.length > 1) this.commonService.update({ type: 'sub-nav', data: this.subNav });
    this.router.navigate(['/projects/' + this.state.projectID + '/estimates/' + params.data.id])
  }

  searchList(search: string, event?: any): void {
    this.state.search.value = search;
    this.getEstimatesList();
  }

  allowEstimateEdit(status) {
    this.state.allowEditEstimates = status;
  }

  exportEstimate() {
    let estimateIds = [];
    _.map(this.gridApi.getSelectedRows(), (estimate) => {
      // if(estimate.status_name=="Draft"){
      estimateIds.push(estimate.id);
      // }
    });
    if (estimateIds.length) {
      this.commonService.saveApi('exportEstimate', {
        ids: estimateIds,
        jobs_id: this.state.projectID,
        type: 'download'
      }).then(res => {
        if (res['result'] && res['result'].success) {
          window.location.href = res['result'].link + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
        }
      });
    }
  }

  checkAllEstimates(status: any): void {
    let selected = false;
    this.state.estimates.map((estimate) => {
      estimate['selected'] = status;
      if (status) {
        selected = true;
      }
    });
    this.allowEstimateEdit(selected);
  }

  checkEstimate(status: any): void {
    let selected = false;
    this.state.estimates.map((estimate) => {
      if (estimate.selected) {
        selected = true;
      }
    });
    this.allowEstimateEdit(selected);
  }

  revisionChange() {
    setTimeout(() => {
      this.getEstimatesList();
    });
  }

  getEstimatesList(id?: any): void {
    this.state.loader = true;
    this.commonService.update({ type: 'left-nav-count', data: {} });
    this.commonService.getApi('estimatesLists', {
      jobs_id: this.state.projectID,
      search: this.state.search.value,
      rev_no: this.state.selectedRevision
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.state.jobActive = res['result'].data.is_active;
          this.state.estimatesCount = res['result'].data.list.length;
          this.state.estimates = [];
          _.map(res['result'].data.list, (estimate) => {
            this.state.estimates.push(estimate);
            if (estimate.child && estimate.child.length) {
              _.map(estimate.child, (child) => {
                this.state.estimates.push(child);
              });
            }
          });
          if (res['result'].data.dropRevision && res['result'].data.dropRevision.length && !this.state.revisions.length) {
            this.state.selectedRevision = res['result'].data.dropRevision[0];
            res['result'].data.dropRevision.map((rev) => {
              this.state.revisions.push({ id: rev, name: 'R' + rev });
            });
          }
          this.state.estimates.map((estimate) => {
            estimate['selected'] = false;
          });
          this.buildEstimatesGrid();
          this.state.loader = false;
          this.subNav.list = this.state.estimates;
          if (id) {
            this.subNav['selectedItem'] = { id: id };
          } else {
            this.subNav['selectedItem'] = null;
          }
          if (this.state.estimates.length > 1) {
            this.subNav['count'] = this.state.estimatesCount;
            this.commonService.update({ type: 'sub-nav', data: this.subNav });
          } else if (this.state.estimates.length == 1) {
            this.state.selectedEstimate = this.state.estimates[0];
            this.getEstimateDetails({ data: this.state.selectedEstimate });
          }
          this._projectDetailService.setSubNav(this.subNav);
        } else {
          this.state.loader = false;
        }
      });
  }

  addEstimate(): void {
    this.dialogRef = this.dialog.open(AddEstimateComponent, {
      panelClass: ['confirmation-dialog', 'full-width-modal', 'add_estimate', 'full-modal-box-ui'],
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      data: {
        title: 'Add Estimate',
        type: 'add',
        job_id: this.state.projectID,
        estimate_id: 0,
        // breadcrumbPath:this.state.breadcrumbs
        breadcrumbs: [...this.state.breadcrumbs, ...[{ label: 'Add Estimate', type: 'link', route: '/projects/' + this.state.projectID + '/estimates' }]]

      }
    });





    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.getEstimatesList(result.response.data);
        this.activatedRoute.navigate(['/projects/' + this.state.projectID + '/estimates/' + result.response.data]);
      }
    });
  }

  changeEstimate(): void {
    this.dialogRef = this.dialog.open(ChangeEstimateComponent, {
      panelClass: 'change-estimate-popup',
      backdropClass: 'back-class',
      disableClose: true,
      position: { left: '60px', top: '0px', right: '0px', bottom: '0px' },
      data: {
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
      }
    });
  }

  cloneEstimate() {
    this.dialog.open(CloneEstimateComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      disableClose: false,
      data: {
        job_id: this.state.projectID,
        title: 'Clone Estimate',
        estimates: this.state.estimates
      }
    })
      .afterClosed()
      .subscribe(result => {
        if (result && result.success) {
          this.getEstimatesList(result.response.data);
          this.activatedRoute.navigate(['/projects/' + this.state.projectID + '/estimates/' + result.response.data]);
        }
      });
  }

}