import { Component, OnInit, Inject, OnDestroy, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { CommonService } from '@app/common/common.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CoProductService, displaySpecs, CoProductServiceLineItems } from '@app/projects/estimates-grid/estimates-grid.component';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { EditOrderComponent } from '@app/projects/edit-order/edit-order.component';
import { AddEstimateComponent } from '@app/projects/add-estimate/add-estimate.component';
import { forkJoin, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DeleteComponent } from '@app/shared/components/delete/delete.component';
import { agGridColumnAutoFit, ProjectSubNav } from '@app/shared/utility/config';
import { ProjectDetailsService } from '../project-details/project-details.service';
import { SendEstimateComponent } from '../send-estimate/send-estimate.component';
import { GridOptions, GridApi, ColDef, ColumnApi, RowNode } from 'ag-grid-community';
import * as _ from 'lodash';
import { SplitEstimatesComponent } from '@app/dialogs/split-estimates/split-estimates.component';
import { CloneEstimateComponent } from '@app/projects/clone-estimate/clone-estimate.component';
import { EstimatingCompleteComponent } from '../estimating-complete/estimating-complete.component';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';
var APP: any = window['APP'];
@Component({
  selector: 'app-change-estimate',
  templateUrl: './change-estimate.component.html',
  styleUrls: ['./change-estimate.component.scss']
})
export class ChangeEstimateComponent implements OnInit, OnDestroy {
  public APP = APP;
  public coGridApi: any;
  public dialogRef: any;
  public jobActive: boolean = false;
  public tasks = [];
  public designations = [];
  public users = {};
  public miscExpense = [];
  public vendors = [];
  public prefilMarkups = {};
  public prefilRates = {};
  projectDetails: any;

  public state = {
    revision: '',
    disablePrebill: false,
    allowEditable: false,
    links: [
      { label: "Overview", type: 3 },
      { label: "Configure Estimate", type: 0 },
      // { label: "Timeline", type:1 },
      { label: "Preview", type: 2 }
    ],
    breadcrumbs: [
      { label: 'Projects', type: 'link', route: '/projects' },
      { label: 'Estimates', type: 'link', route: '/estimates' },
    ],
    splitBreadCrumbs: [
      { label: 'Projects', type: 'link', route: '/projects' },
      { label: 'Name', type: 'text' },
      { label: 'Estimates', type: 'link', route: '/estimates' },
    ],
    previewPage: {},
    estimate_no: '',
    projectInfo: {},
    activeTab: { label: "Configure Estimate", type: 0 },
    estimates: [],
    estimatesCount: 0,
    revisions: [],
    selectedRevision: '',
    selectedEstimate: null,
    projectStatusID: null,
    hideCancelledProducts: false,
    showHideProductIcon: false,
    expandAll: true,
    co: {
      gridOptions: {
        headerHeight: 38,
        columnDefs: [],
        onRowDoubleClicked: (gridApi) => {
          if (this.state.estimates_status_id != '6' && this.state.estimates_status_id != '4' && this.state.estimates_status_id != '3' && this.state.estimates_status_id != '5' && this.state.selectedEstimate.id == this.state.selectedEstimate.selected_revision && this.state.selectedEstimate.parent_id == '0' && (gridApi.data.type == 'addCredit' ? APP.permissions.job_access.credit_costs == 'yes' : true)) {
            gridApi.data.is_edit = true;
            gridApi.node.updateData(gridApi.data);
            gridApi.api.resetRowHeights();
          }
        },
        rowClassRules: {
          'row-edit': (params) => { return (params.data && params.data.is_edit && (params.data.type == 'task' || params.data.type == 'misc' || params.data.type == 'cost')) }
        },
        onCellValueChanged: (gridApi) => {
          if (gridApi.oldValue != gridApi.newValue) {
            switch (gridApi.colDef.field) {
              case 'units':
                if (gridApi.data &&
                  (gridApi.data.type == 'misc' || gridApi.data.type == 'task') &&
                  gridApi.data.rate != '0.00' && gridApi.data.units != 0) {
                  gridApi.data.net_amount = (parseFloat(gridApi.data.rate) * parseFloat(gridApi.data.units));
                  gridApi.data.gross_amount = (parseFloat(gridApi.data.rate) * parseFloat(gridApi.data.units));
                  gridApi.data.total = gridApi.data.gross_amount;
                } else if (gridApi.data &&
                  (gridApi.data.type == 'cost') &&
                  gridApi.data.rate != '0.00' && gridApi.data.units != 0) {
                  gridApi.data.net_amount = (parseFloat(gridApi.data.rate) * parseFloat(gridApi.data.units));
                  let serviceMarkup = gridApi.node.parent.data.client_services_markup.markup_value || 0;
                  gridApi.data.gross_amount = ((parseFloat(gridApi.data.net_amount) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net_amount));
                  gridApi.data.total = gridApi.data.gross_amount;
                }
                gridApi.node.setData(gridApi.data);
                break;
              case 'rate':
                if (gridApi.data && gridApi.data.type == 'cost' && gridApi.data.rate != '0.00' && gridApi.data.units != 0) {
                  gridApi.data.net_amount = (parseFloat(gridApi.data.rate) * parseFloat(gridApi.data.units));
                  let serviceMarkup = gridApi.node.parent.data.client_services_markup.markup_value || 0;
                  gridApi.data.gross_amount = ((parseFloat(gridApi.data.net_amount) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net_amount));
                  gridApi.data.total = gridApi.data.gross_amount;
                }
                gridApi.node.setData(gridApi.data);
                break;
              case 'net_amount':
                if (gridApi.data && gridApi.data.type == 'misc' && gridApi.data.misc_type && gridApi.data.misc_type == 'Markup' && gridApi.data.misc_type_id != 0) {
                  let serviceMarkup = (<ColumnApi>gridApi.columnApi).getColumn('ag-Grid-AutoColumn').getColDef().cellRendererParams.prefilMarkups[gridApi.data.misc_type_id];//gridApi.node.parent.data.client_services_markup.markup_value;
                  if (serviceMarkup) {
                    gridApi.data.gross_amount = ((parseFloat(gridApi.data.net_amount) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net_amount));
                    gridApi.data.total = gridApi.data.gross_amount;
                  }
                } else if (gridApi.data && gridApi.data.type == 'cost') {
                  let serviceMarkup = gridApi.node.parent.data.client_services_markup.markup_value || 0;
                  gridApi.data.gross_amount = ((parseFloat(gridApi.data.net_amount) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net_amount));
                  gridApi.data.total = gridApi.data.gross_amount;
                }
                gridApi.node.setData(gridApi.data);
                this.commonService.update({ grandTotal: true });
                break;
              case 'gross_amount':
                this.commonService.update({ grandTotal: true });
                break;
            }
          }
        },
        getRowHeight: (params) => {
          if (params.node.data && params.node.data.hide) {
            return 0;
          }
          if (params.node.data && params.node.data.type == "task") {
            if (params.node.data.is_edit) {
              return 183;
            } else if (!params.node.data.users_id && params.node.data.users_id == '') {
              return 65;
            } else {
              return 90;
            }
          } else if (params.node.data && params.node.data.type == "misc") {
            let dropdowns = 1;
            if (params.node.data.users_id && params.node.data.users_id != '') {
              dropdowns = dropdowns + 1;
            }
            if (params.node.data.vendors_id && params.node.data.vendors_id != '') {
              dropdowns = dropdowns + 1;
            }
            if (params.node.data.designation_id && params.node.data.designation_id != '') {
              dropdowns = dropdowns + 1;
            }
            if (params.node.data.is_edit) {
              return 225;
            } else if (dropdowns == 1) {
              return 38;
            } else if (dropdowns == 2) {
              return 70;
            } else if (dropdowns == 3) {
              return 90;
            } else {
              return 110;
            }
          } else if (params.node.data && params.node.data.type == "internalcost") {
            if (params.node.data.is_edit) {
              return 140;
            } else {
              return 38;
            }
          } else if (params.node.data && params.node.data.type == "cost") {
            if (params.node.data.is_edit) {
              return 140;
            } else {
              return 70;
            }
          } else {
            return 38;
          }
        },
        suppressDragLeaveHidesColumns: true,
        animateRows: true,
        rowSelection: 'multiple',
        deltaRowDataMode: true,
        groupDefaultExpanded: 2,
        treeData: true,
        getDataPath: (data) => {
          return data.hierarchy;
        },
        icons: {
          groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
          groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
        },
        defaultColDef: {
          resizable: true
        },
        autoGroupColumnDef: {
          headerName: 'Products/Services - Vendors',
          field: 'name',
          headerClass: 'product-service-header-grid',
          cellClass: 'products-grid',
          pinned: 'left',
          width: 480,
          autoHeight: true,
          resizable: false,
          cellRenderer: 'agGroupCellRenderer',
          cellRendererParams: {
            innerRendererFramework: CoProductService,
            tasks: this.tasks,
            designations: this.designations,
            users: this.users,
            miscExpense: this.miscExpense,
            prefilMarkups: this.prefilMarkups,
            prefilRates: this.prefilRates,
            vendors: this.vendors,
            estimates_id: this.activeRoute.snapshot.params.estimate_id,
            estimates_status_id: '',
            estimate: {},
            projectStatusID: null,
            allowEditable: true
          }
        },
        onGridReady: (params) => {
          this.coGridApi = params.api;
          setTimeout(() => {
            // params.columnApi.autoSizeColumns([params.columnApi.columnController.allDisplayedColumns[0].colDef]);
            var allColumnIds = [];
            params.columnApi.getAllColumns().forEach((column: any) => {
              if (column.colId != 'notes') {
                allColumnIds.push(column.colId);
              }
            });
            // params.columnApi.autoSizeColumns(allColumnIds);
            // (<ColumnApi>params.columnApi).sizeColumnsToFit(allColumnIds);
            (<GridApi>this.coGridApi).sizeColumnsToFit();
            params.api.resetRowHeights();
            this.state.showCoGrid = false;
          }, 100);
          window.onresize = () => {
            // params.columnApi.autoSizeColumns([params.columnApi.columnController.allDisplayedColumns[0].colDef]);
            var allColumnIds = [];
            params.columnApi.getAllColumns().forEach((column: any) => {
              if (column.colId != 'notes') {
                allColumnIds.push(column.colId);
              }
            });
            (<GridApi>this.coGridApi).sizeColumnsToFit();
          };
        },
        rowData: []
      }
    },
    estimates_status_id: '',
    is_internal_cost: true,
    disableInternalCost: false,
    estimates_status: '',
    timeline: {},
    preview: {},
    overview: {},
    loader: true,
    showCoGrid: true,
    buttons: {
      preview: [
        { key: 'print', label: 'Print', visible: true, type: 'icon', icon: 'icon-print' },
        { key: 'export', label: 'Export as pdf', visible: false, type: 'icon', icon: 'icon-export-pdf' }
      ],
      menu: (APP.permissions.job_access.clone_estimates == 'yes' || APP.permissions.job_access.add_estimate == 'yes') ? [
        { key: 'clone', label: 'Clone Estimate', visible: (APP.permissions.job_access.clone_estimates == 'yes' ? true : false), type: 'button', icon: '' },
        { key: 'add', label: 'Add Estimate', visible: (APP.permissions.job_access.add_estimate == 'yes' ? true : false), type: 'button', icon: '' },
      ] : []
    },
    actions: [
      // { key: 'add', label: 'Add Estimate', visible: true, type: 'button', icon: 'icon-plus' },
      { key: 'post', label: 'Post Estimate', visible: false, type: 'button' },
      { key: 'send', label: 'Send Estimate', visible: false, type: 'button' },
    ]
  };

  subNav: ProjectSubNav = {
    icons: 'icon-pn-estimates',
    title: 'Back to Project',
    allText: 'All Estimates',
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

  sub1: Subscription;
  sub2: Subscription;
  sub3: Subscription;
  subscription: Subscription;
  navBarSubscription: Subscription;
  xs: boolean = false;

  resizeSubscription: Subscription;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private route: Router,
    private activeRoute: ActivatedRoute,
    private dialog: MatDialog,
    public _http: HttpClient,
    private _projectDetailService: ProjectDetailsService
  ) {
    this.state.breadcrumbs[0].route = commonService.projectState ? ('/projects/' + commonService.projectState) : '/projects';
    this.state.splitBreadCrumbs[0].route = commonService.projectState ? ('/projects/' + commonService.projectState) : '/projects';
    if (window.innerWidth <= 1286) {
      this.state.actions[0].type = 'icon';
      this.xs = true;

    } else {
      this.state.actions[0].type = 'button';
      this.xs = false;
    }
    window.onresize = () => {
      if (window.innerWidth <= 1286) {
        this.state.actions[0].type = 'icon';
        this.xs = true;
      } else {
        this.state.actions[0].type = 'button';
        this.xs = false;
      }
    }

    this.navBarSubscription = commonService.onUpdate().subscribe(ev => {
      if (ev.type == 'projectName') {
        this.state.projectStatusID = ev.data.job_status_id;
        this.projectDetails = ev.data;
      } else if (ev.type == 'grid-view') {
        if (ev.data.isActive) {
          this.state.selectedEstimate = null;
          this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates']);
        }
      } else if (ev.type == 'preview') {
        if (!this.state.selectedEstimate || this.state.selectedEstimate.id != ev.data.id) {
          this.state.selectedEstimate = ev.data;
          if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
            this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
          }
          this.state.estimates_status_id = ev.data.status_id;
          this.state.estimates_status = ev.data.status_name;
          this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + this.state.selectedEstimate.id]);
        }
      } else if (ev.type == 'open-split-estimate') {
        this.splitEstimate(false, ev.id);
      } else if (ev.type == 'estimate-status-change') {
        // this.getEstimatesList(() => {
        // if(_.find(this.state.estimates, {id:Number(this.activeRoute.snapshot.params.estimate_id)})){
        // this.state.selectedEstimate = _.find(this.state.estimates, {id:Number(this.activeRoute.snapshot.params.estimate_id)});
        this.state.selectedEstimate.status_id = ev.data.status_id;
        this.state.selectedEstimate.status_name = ev.data.status_name;
        this.state.estimates_status_id = this.state.selectedEstimate.status_id;
        this.state.estimates_status = this.state.selectedEstimate.status_name;
        this.state.is_internal_cost = false;
        this._projectDetailService.update({
          type: 'subnav-status', data: {
            selected: {
              id: this.state.selectedEstimate.id,
              status_id: this.state.estimates_status_id,
              status_name: this.state.estimates_status,
            }
          }
        });
        this.updateEstimateStatus();
        // this.state.estimate_no = this.state.selectedEstimate.estimate_no;
        // this.setActiveTab(this.state.activeTab);
        // }
        // });
      }
      else if (ev.type == 'job_status') {
        this.state.projectStatusID = ev.data.job_status_id;
        this.init(true);
      }
    });

    this.sub1 = commonService.onUpdate().subscribe(ev => {
      if (ev.type == 'estimatesActiveTab') {
        this.state.activeTab = ev.tab;
      }
    });

    this.sub2 = activeRoute.params.subscribe(param => {
      this.state.selectedEstimate = {
        id: param.estimate_id
      };
      this.init();
    })

    this.sub3 = this.commonService.onUpdate().subscribe((obj) => {
      if (obj.hasOwnProperty('tasks')) {
        this.tasks = obj.tasks;
      } else if (obj.hasOwnProperty('designations')) {
        this.designations = obj.designations;
      } else if (obj.hasOwnProperty('users')) {
        this.users = obj.users;
      } else if (obj.hasOwnProperty('miscExpense')) {
        this.miscExpense = obj.miscExpense;
        this.prefilMarkups = obj.prefilMarkups;
        this.prefilRates = obj.prefilRates;
      } else if (obj.hasOwnProperty('vendors')) {
        this.vendors = obj.vendors;
      } else if (obj.hasOwnProperty('reloadCo')) {
        this.getConfigureOptions();
      }
    });
    this.subscription = commonService.onUpdate().subscribe(obj => {
      if (obj.hasOwnProperty('type') && obj.type == 'projectName') {
        if (obj.data.job_title) {
          this.state.projectInfo = obj.data;
        }
      }
      if (obj && obj.type == 'projectName' && Object.keys(obj.data).length) {
        this.state.breadcrumbs[0].label = obj.data.job_title || '----';
        this.state.breadcrumbs[1]['route'] = '/projects/' + obj.data.id + '/estimates';
        this.state.splitBreadCrumbs[1].label = obj.data.job_title || '----';
        if ([8, 10].includes(obj.data.job_status_id)) {
          this.state.allowEditable = APP.permissions.job_access['post-completion_estimate'] == 'yes';
        } else if (obj.data.job_status_id == 5) {
          this.state.allowEditable = APP.permissions.job_access['edit_cancelled_jobs'] == 'yes';
        } else {
          this.state.allowEditable = true;
        }
      }

      if (obj.type == 'estimate-posted') {
        (<any>this.state.estimates_status_id) = 2;
        (<any>this.state.estimates_status) = 'POSTED';
        this.updateStatusInRevision();
        this.updateEstimateStatus();
        this.updateJobStatus();
        this.commonService.saveApi('avalaraTaxCalc', {
          jobs_id: this.activeRoute.parent.snapshot.params.id,
          estimate_ids: [this.state.selectedEstimate.id],
          is_estimate: true
        })
        this._projectDetailService.update({
          type: 'subnav-status', data: {
            selected: {
              id: this.state.selectedEstimate.id,
              status_id: 2,
              status_name: 'POSTED',
            }
          }
        });
        this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
          status_id: 2,
          status_name: 'POSTED'
        });
        if (this.state.activeTab.type == 2) {
          this.getPreviewData();
        }
      } else if (obj.type == 'estimate-approved') {
        this.updateJobStatus();
        this.getSelectedTabDetails();
        this._projectDetailService.update({
          type: 'subnav-status', data: {
            selected: {
              id: this.state.selectedEstimate.id,
              status_id: (this.state.estimates_status_id == '3' ? '4' : '3'),
              status_name: (this.state.estimates_status_id == '3' ? 'Approved' : 'Sent'),
            }
          }
        });
        this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
          status_id: (this.state.estimates_status_id == '3' ? '4' : '3'),
          status_name: (this.state.estimates_status_id == '3' ? 'Approved' : 'Sent')
        });
        (<any>this.state.estimates_status_id) = this.state.selectedEstimate.status_id;
        (<any>this.state.estimates_status) = this.state.selectedEstimate.status_name;
        this.updateStatusInRevision();
        if (this.state.activeTab.type == 2) {
          this.getPreviewData();
        }
      }
    });
  }

  init(flag = false) {
    if (!this._projectDetailService.getSubNav().list.length || flag) {
      this.getEstimatesList(() => {
        this.setActiveTab({ label: "Configure Estimate", type: 0 });
        if (_.find(this.state.estimates, { id: Number(this.state.selectedEstimate.id) })) {
          this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.state.selectedEstimate.id) });
          if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
            this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
          }
          this.state.estimates_status_id = this.state.selectedEstimate.status_id;
          this.state.estimates_status = this.state.selectedEstimate.status_name;
          this.state.estimate_no = this.state.selectedEstimate.estimate_no;
        }
      });
    } else {
      this.subNav = { ...this.subNav, ...this._projectDetailService.getSubNav() };
      this.state.estimates = this.subNav.list;
      if (_.find(this.state.estimates, ['id', Number(this.state.selectedEstimate.id)])) {
        this.state.selectedEstimate = _.find(this.state.estimates, ['id', Number(this.state.selectedEstimate.id)]);
        if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
          this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
        }
        this.state.estimates_status_id = this.state.selectedEstimate.status_id;
        this.state.estimates_status = this.state.selectedEstimate.status_name;
        this.state.estimate_no = this.state.selectedEstimate.estimate_no;
        this.setActiveTab(this.state.activeTab);
      } else {
        this.getEstimatesList(() => {
          this.setActiveTab({ label: "Configure Estimate", type: 0 });
          if (_.find(this.state.estimates, { id: Number(this.state.selectedEstimate.id) })) {
            this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.state.selectedEstimate.id) });
            if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
              this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
            }
            this.state.estimates_status_id = this.state.selectedEstimate.status_id;
            this.state.estimates_status = this.state.selectedEstimate.status_name;
            this.state.estimate_no = this.state.selectedEstimate.estimate_no;
            this.setActiveTab(this.state.activeTab);
          }
        });
      }

    }
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    ['sub1', 'sub2', 'sub3'].map(prop => {
      this[prop].unsubscribe();
    })
    this._projectDetailService.emptyList();
    this.subscription.unsubscribe();
    this.navBarSubscription.unsubscribe();
  }

  hideCancelledProducts() {
    this.coGridApi.forEachNode((node) => {
      if (node.data.is_cancel) {
        _.map(node.allLeafChildren, (leaf) => {
          leaf.data['hide'] = !this.state.hideCancelledProducts;
        });
      }
    });
    this.coGridApi.resetRowHeights();
    this.state.hideCancelledProducts = !this.state.hideCancelledProducts;
  }

  setActiveTab(tab): void {
    this.commonService.update({ type: 'estimatesActiveTab', tab: tab });
    this.state.activeTab = tab;
    this.setPermissions();
    this.getSelectedTabDetails();
    this.subNav['selectedItem'] = this.state.selectedEstimate;
    this.subNav['count'] = this.state.estimatesCount;
    if (this.subNav.list.length > 1) this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
  }

  setPermissions() {
    switch (this.state.activeTab.type) {
      case 0:

        break;

      case 1:

        break;

      case 2:
        const exportButton = _.find(this.state.buttons.preview, ['key', 'export']);
        if (exportButton) exportButton.visible = APP.permissions.job_access.export_estimate == 'yes' ? true : false;
        break;

      default:
        break;
    }
  }

  backToEstimates(): void {
    this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates']);
  }

  performActions(action) {
    if (action.key == 'post') {
      this.postEstimate();
    } else if (action.key == 'send') {
      this.sendEstimate();
    } else if (action.key == 'add') {
      this.addEstimate();
    } else if (action.key == 'rev') {
      this.addEstimate(true);
    } else if (action.key == 'clone') {
      this.cloneEstimate();
    }

  }

  buttonActions(flag, action) {
    switch (flag) {
      case 'preview':
        if (action.key == 'print') this.printEstimate();
        if (action.key == 'export') this.exportEstimate();
        break;

      default:
        break;
    }
  }

  postEstimate() {
    this.estimatingComplete();
  }

  // postEstimate() {
  //   this.dialog.open(DeleteComponent, {
  //     panelClass: 'my-dialog',
  //     width: '600px',
  //     data: {
  //       title: 'Post Estimate',
  //       msg: 'The estimates in Draft status will be posted?',
  //     }
  //   })
  //     .afterClosed()
  //     .subscribe(result => {
  //       if (result && result.success) {
  //         (<any>this.state.estimates_status_id) = 2;
  //         (<any>this.state.estimates_status) = 'POSTED';
  //         this.updateEstimateStatus();
  //         this.updateJobStatus()
  //         let estimateIds = [this.state.selectedEstimate.id];
  //         if (estimateIds.length) {
  //           forkJoin(
  //             this.commonService.saveApi('updateEstStatus', {
  //               estimates_status_id: 2,
  //               ids: estimateIds
  //             }),
  //             this.commonService.saveApi('avalaraTaxCalc', {
  //               jobs_id: this.activeRoute.parent.snapshot.params.id,
  //               estimate_ids: estimateIds,
  //               is_estimate: true
  //             })
  //           ).subscribe(([res1, res2])=>{
  //             if(res1 && res1['result'] && res1['result'].success){
  //               this._projectDetailService.update({ type: 'subnav-status', data: { selected: {
  //                 id: this.state.selectedEstimate.id,
  //                 status_id: 2,
  //                 status_name: 'POSTED',
  //               } } });
  //               this.state.selectedEstimate = Object.assign(this.state.selectedEstimate,{
  //                 status_id: 2,
  //                 status_name: 'POSTED'
  //               });
  //               if(this.state.activeTab.type==2){
  //                 this.getPreviewData();
  //               }
  //             }
  //           });
  //         }
  //       }
  //     });
  // }

  sendEstimate() {
    let estimateIds = [this.state.selectedEstimate.id];
    this.dialog.open(SendEstimateComponent, {
      panelClass: ['my-dialog', 'send-estimate'],
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: {
        title: 'Send Estimate',
        msg: 'The estimates in Draft status will be posted?',
        selectedEstimates: [this.state.selectedEstimate],
        selectedRevision: this.state.selectedEstimate.estimate_revision || 0,
        estimateIds: estimateIds,
        jobs_id: this.activeRoute.parent.snapshot.params.id,
        job: this.projectDetails
      }
    })
      .afterClosed()
      .subscribe(result => {
        if (result && result.success) {
          (<any>this.state.estimates_status_id) = 3;
          (<any>this.state.estimates_status) = 'SENT';
          this.updateStatusInRevision();
          this._projectDetailService.update({
            type: 'subnav-status', data: {
              selected: {
                id: this.state.selectedEstimate.id,
                status_id: 3,
                status_name: 'SENT',
              }
            }
          });
          this.updateEstimateStatus();
          this.updateJobStatus();
          this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
            status_id: 3,
            status_name: 'SENT'
          });
          this.setActiveTab(this.state.activeTab);
          // if (this.state.activeTab.type == 2) {
          // this.getPreviewData();
          // }
        }
      });
  }

  revisionChange() {
    setTimeout(() => {
      this.getEstimatesList();
    });
  }

  getEstimatesList(cb?): void {
    this.state.loader = true;
    this.commonService.update({ type: 'left-nav-count', data: {} });
    this.commonService.getApi('estimatesLists', {
      jobs_id: this.activeRoute.parent.snapshot.params.id,
      search: '',
      rev_no: this.state.selectedRevision
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.state.loader = false;
          this.jobActive = res['result'].data.is_active;
          this.state.estimates = [];
          // this.state.estimates = res['result'].data.list;
          this.state.estimatesCount = res['result'].data.list.length;
          _.map(res['result'].data.list, (estimate) => {
            this.state.estimates.push(estimate);
            if (estimate.child && estimate.child.length && APP.permissions.job_access.split_estimate && APP.permissions.job_access.split_estimate == 'yes') {
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
          this.subNav.list = this.state.estimates;
          this.subNav['selectedItem'] = null;
          if (this.state.estimates.length > 1) {
            this.subNav['count'] = this.state.estimatesCount;
            this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
          }
          this._projectDetailService.setSubNav(this.subNav);
          this.subNav = { ...this.subNav, ...this._projectDetailService.getSubNav() };
          if (cb) cb();
        }
      });
  }

  addEstimate(revision: any = false): void {
    this.dialogRef = this.dialog.open(AddEstimateComponent, {
      panelClass: ['full-width-modal', 'add_estimate', 'full-modal-box-ui'],
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      data: {
        title: (revision) ? 'Create Revision' : 'Add Estimate',
        is_revision: revision,
        estimate: this.state.selectedEstimate,
        type: 'add',
        job_id: this.activeRoute.parent.snapshot.params.id,
        estimate_id: 0
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // this.state.estimates.push([{id: result.response.data}]);
        this.getEstimatesList(() => {
          this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(result.response.data) });
          if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
            this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
          }
          // this.state.selectedEstimate['parent_id'] = 0;
          this.state.estimates_status_id = this.state.selectedEstimate.status_id;
          this.state.estimates_status = this.state.selectedEstimate.status_name;
          this.state.estimate_no = this.state.selectedEstimate.estimate_no;
          this.subNav['selectedItem'] = { id: result.response.data };
          this.subNav['count'] = this.state.estimatesCount;
          this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
        });
        this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + result.response.data]);
      }
    });
  }

  getRevisionEstimate(estimate_no: string, rev) {
    let est = estimate_no.split('-');
    let r = rev.rev_no;
    est.splice(est.length - 1, 1, r.slice(-1));
    return est.join('-')
  }

  updateStatusInRevision() {
    const revision = _.find(this.state.selectedEstimate.revDropDwn, ['id', this.state.selectedEstimate.selected_revision]);
    if (revision) {
      revision.estimates_status = this.state.estimates_status;
      revision.estimates_status_id = this.state.estimates_status_id;
    }
  }

  updateSideNav(obj) {
    this.state.selectedEstimate.estimate_no = obj.estimate_no;
    this.state.selectedEstimate.status_id = obj.estimates_status_id;
    this.state.selectedEstimate.status_name = obj.estimates_status;

    this.state.estimate_no = obj.estimate_no;
    this.state.estimates_status_id = obj.estimates_status_id;
    this.state.estimates_status = obj.estimates_status;
  }

  getSelectedTabDetails = () => {
    switch (this.state.activeTab.type) {
      case 0:
        this.getConfigureOptions();
        break;
      case 1:
        this.getTimelineDetails();
        this.updateEstimateStatus();
        break;
      case 2:
        this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) });
        if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
          this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
        }
        if (this.state.selectedEstimate) {
          const revision = _.find(this.state.selectedEstimate.revDropDwn, ['id', this.state.selectedEstimate.selected_revision]);
          if (revision) this.updateSideNav(revision);
          // this.state.selectedEstimate['parent_id'] = 0;
          this.updateEstimateStatus();
          this.getPreviewData();
        } else {
          this.getEstimatesList(() => {
            if (_.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) })) {
              this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) });
              if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
                this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
              }
              const revision = _.find(this.state.selectedEstimate.revDropDwn, ['id', this.state.selectedEstimate.selected_revision]);
              if (revision) this.updateSideNav(revision);
              // this.state.selectedEstimate['parent_id'] = 0;
              this.subNav['selectedItem'] = { id: this.activeRoute.snapshot.params.estimate_id };
              this.subNav['count'] = this.state.estimatesCount;
              this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
              this.getPreviewData();
            }
          });
        }

        break;
      case 3:
        this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) });
        if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
          this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
        }
        if (this.state.selectedEstimate) {
          const revision = _.find(this.state.selectedEstimate.revDropDwn, ['id', this.state.selectedEstimate.selected_revision]);
          if (revision) this.updateSideNav(revision);
          // this.state.selectedEstimate['parent_id'] = 0;
          this.updateEstimateStatus();
          this.getPreviewData();
        } else {
          this.getEstimatesList(() => {
            if (_.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) })) {
              this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) });
              if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
                this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
              }
              const revision = _.find(this.state.selectedEstimate.revDropDwn, ['id', this.state.selectedEstimate.selected_revision]);
              if (revision) this.updateSideNav(revision);
              // this.state.selectedEstimate['parent_id'] = 0;
              this.subNav['selectedItem'] = { id: this.activeRoute.snapshot.params.estimate_id };
              this.subNav['count'] = this.state.estimatesCount;
              this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
              this.getPreviewData();
            }
          });
        }

        break;
    }
  }

  editOrder = () => {
    this.dialog.open(EditOrderComponent, {
      panelClass: 'my-dialog',
      width: '500px',
      data: {
        title: 'Edit Order',
        msg: 'Are you sure',
        saveApi: 'saveEstmBundle',
        postParams: {},
        jobs_id: this.activeRoute.parent.snapshot.params.id,
        id: this.activeRoute.snapshot.params.estimate_id
      }
    })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          this.getConfigureOptions();
        }
      });
  }

  updateEstimateStatus() {
    //if(this.jobActive){
    if ((<any>this.state.estimates_status_id) == 1) {
      this.state.actions[0].visible = APP.permissions.job_access.post_estimates == 'yes';
      this.state.actions[1].visible = false;
      this._projectDetailService.update({
        type: 'subnav-status', data: {
          selected: {
            id: this.state.selectedEstimate.id,
            status_id: this.state.estimates_status_id,
            status_name: 'Draft',
          }
        }
      });
      this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
        status_id: this.state.estimates_status_id,
        status_name: 'Draft'
      });
      if (this.state.activeTab.type == 2) {
        this.getPreviewData();
      }
    }
    else if ((<any>this.state.estimates_status_id) == 2) {
      this.state.actions[0].visible = false;
      this.state.actions[1].visible = APP.permissions.job_access.send_estimate == 'yes';
      this._projectDetailService.update({
        type: 'subnav-status', data: {
          selected: {
            id: this.state.selectedEstimate.id,
            status_id: this.state.estimates_status_id,
            status_name: 'POSTED',
          }
        }
      });
      this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
        status_id: this.state.estimates_status_id,
        status_name: 'POSTED'
      });
      if (this.state.activeTab.type == 2) {
        this.getPreviewData();
      }
    } else {
      this.state.actions[0].visible = false;
      this.state.actions[1].visible = false;
    }
    // }else {
    //   [1, 2].map(i => {
    //     this.state.actions[i].visible = false;
    //   })
    // }
  }

  updateJobStatus() {
    this.commonService.update({ type: 'overlay', action: 'start' });
    this.commonService.getApi('getJobInfo', { id: this.activeRoute.parent.snapshot.params.id, type: 'status' })
      .then(res => {
        if (res['result'].success) {
          this._projectDetailService.update({ type: 'job_status', data: res['result'].data[0] });
        }
        this.commonService.update({ type: 'overlay', action: 'stop' });
      }).catch(err => {
        this.commonService.update({ type: 'overlay', action: 'stop' });
      })
  }

  approveEstimate() {
    if (this.state.estimates_status_id == '3') {
      this.estimatingComplete('Approve');
    } else {
      this.dialogRef = this.dialog.open(DeleteComponent, {
        panelClass: 'my-dialog',
        width: '600px',
        data: {
          title: (this.state.estimates_status_id == '3' ? 'Approve Estimate' : 'Unapprove Estimate'),
          msg: 'Are you sure you want to ' + (this.state.estimates_status_id == '3' ? 'Approve' : 'Unapprove') + ' estimate?',
        }
      });

      this.dialogRef.afterClosed().subscribe(result => {
        if (result && result.success) {
          this.commonService.update({ type: 'overlay', action: 'start' });
          this.commonService.saveApi('estimateStatus', {
            estimates_status_id: (this.state.estimates_status_id == '3' ? '4' : '3'),
            id: this.activeRoute.snapshot.params.estimate_id,
            jobs_id: this.activeRoute.parent.snapshot.params.id
          })
            .then(res => {
              this.commonService.update({ type: 'overlay', action: 'stop' });
              if (res['result'] && res['result'].success) {
                this.updateJobStatus();
                if (res['result'].data && !res['result'].data.status && this.state.estimates_status_id == '3') {
                  this.dialogRef = this.dialog.open(DeleteComponent, {
                    panelClass: 'my-dialog',
                    width: '600px',
                    data: {
                      title: 'Go To Estimate',
                      msg: 'The services already approved in another estimate(' + res['result'].data.estimateDt.estimate_no + ')',
                    }
                  });
                  this.dialogRef.afterClosed().subscribe(result => {
                    if (result && result.success) {
                      this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + res['result'].data.estimateDt.id]);
                      setTimeout(() => {
                        this.getSelectedTabDetails();
                      }, 500);
                    }
                  });
                } else { 
                  this.getSelectedTabDetails();
                  this._projectDetailService.update({
                    type: 'subnav-status', data: {
                      selected: {
                        id: this.state.selectedEstimate.id,
                        status_id: (this.state.estimates_status_id == '3' ? '4' : '3'),
                        status_name: (this.state.estimates_status_id == '3' ? 'Approved' : 'Sent'),
                      }
                    }
                  });
                  this.state.selectedEstimate = Object.assign(this.state.selectedEstimate, {
                    status_id: (this.state.estimates_status_id == '3' ? '4' : '3'),
                    status_name: (this.state.estimates_status_id == '3' ? 'Approved' : 'Sent')
                  });
                  (<any>this.state.estimates_status_id) = this.state.selectedEstimate.status_id;
                  (<any>this.state.estimates_status) = this.state.selectedEstimate.status_name;
                  this.updateStatusInRevision();
                  if (this.state.activeTab.type == 2) {
                    this.getPreviewData();
                  }
                }
              }
            }).catch(err => {
              this.commonService.update({ type: 'overlay', action: 'stop' });
            });
        }
      });
    }
  }
  public estimatePromise: any;
  getConfigureOptions = () => {
    this.state.loader = true;
    this.state.showCoGrid = true;
    this.state.showHideProductIcon = false;
    if (this.estimatePromise) {
      this.estimatePromise.unsubscribe();
    }
    this.estimatePromise = forkJoin(
      this.commonService.getApi('estimatesDetails', {
        jobs_id: this.activeRoute.parent.snapshot.params.id,
        id: this.state.selectedEstimate.selected_revision ? this.state.selectedEstimate.selected_revision : this.activeRoute.snapshot.params.estimate_id
        // id: this.activeRoute.snapshot.params.estimate_id
      }),
    ).subscribe(([res, res2, res3, res4, res5, res6]: any) => {
      this.state.loader = false;
      if (res['result'] && res['result'].success) {
        let gridData = [];
        let estimatesDetails = res['result'].data;
        res['result'].data.list.map((product) => {
          gridData.push({ ...product, ...{ hierarchy: [product.product_id], name: product.product_name, type: 'product' }, revision: estimatesDetails.estimate_revision });
          if (product.children && product.children.length) {
            product.children.map((service) => {
              gridData.push({ ...service, ...{ hierarchy: [product.product_id, service.jobs_service_revisions_id], name: service.job_service_name, type: 'service', id: service.notes_id, revision: estimatesDetails.estimate_revision } });

              if (service.children && service.children.length) {
                service.children.map((child) => {
                  gridData.push({
                    ...{
                      jobs_service_revisions_id: service.jobs_service_revisions_id,
                      jsr_rev_no: service.jsr_rev_no,
                      is_cancel: service.is_cancel,
                      product_id: product.product_id,
                      estimates_id: service.estimates_id,
                      product_name: product.product_name,
                      job_service_name: service.job_service_name,
                      name: child.id,
                      hierarchy: [product.product_id, service.jobs_service_revisions_id, child.id],
                      revision: estimatesDetails.estimate_revision
                    }, ...child
                  });
                });
              }
            });
          }
          if (product.is_cancel) {
            this.state.showHideProductIcon = true;
          }
        });
        this.state.co.gridOptions.rowData = gridData;
        this.jobActive = res['result'].data.is_active;

        this.updateSideNav(res['result'].data);

        this.state.is_internal_cost = res['result'].data.is_internal_cost;
        this.updateEstimateStatus();
      }
      this.buildEstimateColumns();
    });
  }

  printEstimate() {
    let windowPrint = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(document.getElementsByClassName('preview-wrapper')[0].innerHTML);
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  }

  getPreviewData = () => {
    this.state.loader = true;
    setTimeout(() => {
      this.state.loader = false;
    }, 100);
  }

  exportEstimate() {
    const dt = new Date();
    window.location.href = APP.api_url + 'estimatePreviewPdf?id=' + this.activeRoute.snapshot.params.estimate_id + '&jobs_id=' + this.activeRoute.parent.snapshot.params.id + '&token=' + APP.access_token + '&jwt=' + APP.j_token + '&time_zone=' + String(dt.getTimezoneOffset());
  }

  buildEstimateColumns() {
    this.state.co.gridOptions.autoGroupColumnDef = {
      headerName: 'Products/Services - Vendors',
      field: 'name',
      headerClass: 'product-service-header-grid',
      cellClass: 'products-grid',
      pinned: 'left',
      width: 480,
      autoHeight: true,
      resizable: false,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRendererFramework: CoProductService,
        tasks: this.tasks,
        designations: this.designations,
        users: this.users,
        miscExpense: this.miscExpense,
        prefilMarkups: this.prefilMarkups,
        prefilRates: this.prefilRates,
        vendors: this.vendors,
        estimates_id: this.state.selectedEstimate.selected_revision,
        // estimates_id: this.activeRoute.snapshot.params.estimate_id,
        estimates_status_id: this.state.estimates_status_id,
        estimate: this.state.selectedEstimate,
        projectStatusID: this.state.projectStatusID,
        allowEditable: this.state.allowEditable
      }
    };
    this.state.co.gridOptions.columnDefs = [
      { headerName: ' ', field: 'notes', autoHeight: true, cellClass: 'note-grid right-text-cell', cellRendererParams: { estimates_status_id: this.state.estimates_status_id, estimate: this.state.selectedEstimate }, cellRendererFramework: displaySpecs, headerClass: 'note-grid right-header-cell', width: 50 },
      {
        headerName: 'RATE(S)', field: 'rate', cellClass: (params) => { return (params.data && params.data.is_edit) ? 'rate-grid edit dark-cell right-text-cell' : 'right-text-cell dark-cell'; }, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (params.data && params.data.type && params.data.type == 'addCredit') {
            return '';
          }
          if (params.value != '' && params.value != null) {
            return '$' + this.formatNumber(parseFloat(params.value).toFixed(2));
          }
          if (typeof (params.value) == "number") {
            return '$' + parseFloat(params.value).toFixed(2);
          }
          return params.value;
        }, headerClass: 'right-header-cell', cellClassRules: {
          'edit': (params) => {
            return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") &&
              (params.data && params.data.type && params.data.type == 'cost' && params.data.is_edit);
          }
        }, editable: (params) => {
          return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") &&
            (params.data && params.data.type && params.data.type == 'cost' && params.data.is_edit && this.state.selectedEstimate.parent_id == '0');
        }, width: 100
      },
      {
        headerName: 'UNIT(S)', field: 'units', cellClass: (params) => { return (params.data && params.data.is_edit) ? 'units-grid edit dark-cell right-text-cell' : 'right-text-cell dark-cell'; }, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (params.data && params.data.type && params.data.type == 'addCredit') {
            return '';
          }
          return params.value;
        }, headerClass: 'right-header-cell', cellClassRules: {
          'edit': (params) => {
            return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") &&
              (params.data && params.data.type && (params.data.type == 'task' || params.data.type == 'cost' || (params.data.type == 'misc' && params.data.misc_type && params.data.misc_type == 'Rate') || (params.data.type == 'internalcost' && params.data.misc_type && params.data.misc_type == 'Rate')) && params.data.is_edit);
          }
        }, editable: (params) => {
          return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") && (params.data && params.data.type && this.state.selectedEstimate.parent_id == '0' && (params.data.type == 'task' || params.data.type == 'cost' || (params.data.type == 'misc' && params.data.misc_type && params.data.misc_type == 'Rate') || (params.data.type == 'internalcost' && params.data.misc_type && params.data.misc_type == 'Rate')) && params.data.is_edit);
        }, width: 100
      },
      {
        headerName: 'NET', field: 'net_amount', cellClass: (params) => { return (params.data && params.data.is_edit) ? 'net-grid edit dark-cell right-text-cell' : 'right-text-cell dark-cell'; }, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (params.data && params.data.type && params.data.type == 'service') {
            return '';
          }
          if (params.data && params.data.type && params.data.type == 'addCredit') {
            return '';
          }
          if (params.value != '' && params.value != null) {
            return '<div class="text-right">$' + this.formatNumber(parseFloat(params.value).toFixed(2)) + '</div>';
          }
          if (typeof (params.value) == "number") {
            return '$' + parseFloat(params.value).toFixed(2);
          }
          return params.value;
        }, headerClass: 'right-header-cell', cellClassRules: {
          'edit': (params) => {
            return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") && (params.data && params.data.type && ((params.data.type == 'misc' && params.data.misc_type && params.data.misc_type == 'Markup') || (params.data.type == 'internalcost' && params.data.misc_type && params.data.misc_type == 'Markup') || params.data.type == 'cost') && params.data.is_edit);
          }
        }, editable: (params) => {
          return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") && (params.data && params.data.type && this.state.selectedEstimate.parent_id == '0' && ((params.data.type == 'misc' && params.data.misc_type && params.data.misc_type == 'Markup') || (params.data.type == 'internalcost' && params.data.misc_type && params.data.misc_type == 'Markup') || params.data.type == 'cost') && params.data.is_edit);
        }, width: 100
      },
      {
        headerName: 'GROSS', pinned: 'right', field: 'gross_amount', cellClass: (params) => { return (params.data && params.data.is_edit) ? 'gross-grid edit dark-cell semibold-text-cell right-text-cell' : 'right-text-cell dark-cell semibold-text-cell '; }, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (params.data && params.data.type && params.data.type == 'service') {
            return '';
          }
          if (params.data && params.data.type && params.data.type == 'addCredit') {
            let gross_amount = params.value.toString();
            if (gross_amount.indexOf('-') > -1) {
              return '<div class="text-right">-$' + this.formatNumber(parseFloat(gross_amount.split('-')[1]).toFixed(2)) + '</div>';
            }
            return '<div class="text-right">-$' + this.formatNumber(parseFloat(params.value).toFixed(2)) + '</div>';
          }
          if (params.value != '' && params.value != null) {
            return '<div class="text-right">$' + this.formatNumber(parseFloat(params.value).toFixed(2)) + '</div>';
          }
          if (typeof (params.value) == "number") {
            return '$' + parseFloat(params.value).toFixed(2);
          }
          return params.value;
        }, headerClass: 'right-header-cell', cellClassRules: {
          'edit': (params) => {
            return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") &&
              (params.data && params.data.type && (params.data.type == 'task' || params.data.type == 'misc' || params.data.type == 'internalcost' || params.data.type == 'cost' || (params.data.type == 'addCredit' && APP.permissions.job_access.credit_costs == 'yes')) && params.data.is_edit);
          }
        }, editable: (params) => {
          return this.state.allowEditable && ((this.APP.permissions.job_access.edit_cancelled_jobs == "yes" && this.state.projectStatusID == "5") || this.state.projectStatusID != "5") &&
            (params.data && params.data.type && this.state.selectedEstimate.parent_id == '0' && (params.data.type == 'task' || params.data.type == 'misc' || params.data.type == 'internalcost' || params.data.type == 'cost' || (params.data.type == 'addCredit' && APP.permissions.job_access.credit_costs == 'yes')) && params.data.is_edit);
        }, width: 180
      }
    ];
  }

  formatNumber(number) {
    let x = number.split('.');
    let x1 = x[0];
    x1 = isNaN(x1) ? "0" : Number(x1);
    x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
    return x1 + x2;
  }

  columnSum(values) {
    return values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(2);
  }

  getTimelineDetails = () => {
    // this.state.loader = true;
    // setTimeout(() => {
    //   this.state.loader = false;
    // }, 1000);
  }

  editEstimate(): void {
    this.dialogRef = this.dialog.open(AddEstimateComponent, {
      panelClass: ['full-width-modal', 'edit_estimate', 'full-modal-box-ui'],
      maxWidth: '100vw',
      width: '100vw',
      height: '100vh',
      data: {
        title: 'Edit Estimate',
        type: 'edit',
        estimate: this.state.selectedEstimate,
        estimate_id: this.activeRoute.snapshot.params.estimate_id,
        job_id: this.activeRoute.parent.snapshot.params.id
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        this.getSelectedTabDetails();
      }
    });
  }

  getNodeChildDetails(rowItem) {
    if (rowItem.children) {
      return {
        group: true,
        children: (rowItem.children && rowItem.children.length) ? rowItem.children : [],
        expanded: true,
        empty: (rowItem.children && rowItem.children.length) ? false : true,
        key: rowItem.label
      };
    } else {
      return null;
    }
  }

  shortView() {
    this.state.expandAll = !this.state.expandAll;
    this.coGridApi.forEachNode((node) => {
      if (node.data.type == 'product') {
        node.setExpanded(this.state.expandAll);
      }
    });
  }

  applyInternalCost() {
    this.dialog.open(ConfirmationComponent, {
      panelClass: ['recon-dialog', 'confirmation-dialog'],
      width: '570px',
      data: {
        title: 'Apply Internal Cost',
        content: `<p class="error-content"><i class="pixel-icons icon-exclamation"></i><span>This will add/update Miscellaneous Expense(s) to all the Products. All the cost rules will be based on the Templates applied to the Client, Company Code & the Product/Services in the Project</span></p>`,
      }
    })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          this.state.disableInternalCost = true;
          this.commonService.update({ type: 'overlay', action: 'start' });
          this.commonService.saveApi('saveEstInternalCost', {
            estimates_id: this.activeRoute.snapshot.params.estimate_id,
            jobs_id: this.activeRoute.parent.snapshot.params.id
          })
            .then(res => {
              this.commonService.update({ type: 'overlay', action: 'stop' });
              this.state.disableInternalCost = false;
              this.state.is_internal_cost = true;
              this.getSelectedTabDetails();
            }).catch(err => {
              this.commonService.update({ type: 'overlay', action: 'stop' });
            });
        }
      });
  }

  cloneEstimate() {
    this.dialog.open(CloneEstimateComponent, {
      panelClass: 'my-dialog',
      width: '600px',
      disableClose: false,
      data: {
        job_id: this.activeRoute.parent.snapshot.params.id,
        title: 'Clone Estimate',
        estimates: this.state.estimates
      }
    })
      .afterClosed()
      .subscribe(result => {
        if (result && result.success) {
          this.getEstimatesList(() => {
            this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(result.response.data) });
            if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
              this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
            }
            this.state.estimates_status_id = this.state.selectedEstimate.status_id;
            this.state.estimates_status = this.state.selectedEstimate.status_name;
            this.state.estimate_no = this.state.selectedEstimate.estimate_no;
            this.subNav['selectedItem'] = { id: result.response.data };
            this.subNav['count'] = this.state.estimatesCount;
            this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
          });
          this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + result.response.data]);
        }
      });
  }

  splitEstimate(split: any = true, id?: any) {
    if (this.state.selectedEstimate && this.state.selectedEstimate.child && this.state.selectedEstimate.child.length && split) {
      this.dialog.open(DeleteComponent, {
        panelClass: 'my-dialog',
        width: '600px',
        data: {
          title: 'Consolidate Estimate',
          msg: 'Are you sure you want to consolidate the Estimate?',
        }
      })
        .afterClosed()
        .subscribe(result => {
          if (result && result.success) {
            this.commonService.update({ type: 'overlay', action: 'start' });
            this.commonService.getApi('generateSplitEst', {
              id: this.activeRoute.snapshot.params.estimate_id,
              is_gen: true
            }).then(res => {
              if (res['result'] && res['result'].success) {
                this.getEstimatesList(() => {
                  if (_.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) })) {
                    this.state.selectedEstimate = _.find(this.state.estimates, { id: Number(this.activeRoute.snapshot.params.estimate_id) });
                    if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
                      this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
                    }
                    this.state.estimates_status_id = this.state.selectedEstimate.status_id;
                    this.state.estimates_status = this.state.selectedEstimate.status_name;
                    this.state.estimate_no = this.state.selectedEstimate.estimate_no;
                    this.subNav['selectedItem'] = { id: this.activeRoute.snapshot.params.estimate_id };
                    this.subNav['count'] = this.state.estimatesCount;
                    this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
                  }
                });
              }
              this.commonService.update({ type: 'overlay', action: 'stop' });
            }).catch(err => {
              this.commonService.update({ type: 'overlay', action: 'stop' });
            });
          }
        });
    } else {
      this.dialog.open(SplitEstimatesComponent, {
        panelClass: ['full-width-modal', 'full-modal-box-ui'],
        maxWidth: '100vw',
        maxHeight: '100vh',
        disableClose: false,
        data: {
          job_id: this.activeRoute.parent.snapshot.params.id,
          estimate_id: (id) ? id : this.activeRoute.snapshot.params.estimate_id,
          title: 'Split Estimate',
          split: split ? 0 : 2,
          breadcrumbs: this.state.splitBreadCrumbs,
          estimate_no: this.state.estimate_no,
          is_distro: (this.state.selectedEstimate && this.state.selectedEstimate.is_distro) ? this.state.selectedEstimate.is_distro : false
        }
      })
        .afterClosed()
        .subscribe(result => {
          if (result && result.success) {
            this.getEstimatesList(() => {
              if (_.find(this.state.estimates, { id: Number((id) ? id : this.activeRoute.snapshot.params.estimate_id) })) {
                this.state.selectedEstimate = _.find(this.state.estimates, { id: Number((id) ? id : this.activeRoute.snapshot.params.estimate_id) });
                if (this.state.selectedEstimate && this.state.selectedEstimate.revDropDwn && this.state.selectedEstimate.revDropDwn.length && this.state.revision == '') {
                  this.state.revision = this.state.selectedEstimate.revDropDwn[0].id;
                }
                this.state.estimates_status_id = this.state.selectedEstimate.status_id;
                this.state.estimates_status = this.state.selectedEstimate.status_name;
                this.state.estimate_no = this.state.selectedEstimate.estimate_no;
                this.subNav['selectedItem'] = { id: Number((id) ? id : this.activeRoute.snapshot.params.estimate_id) };
                this.subNav['count'] = this.state.estimatesCount;
                this.commonService.update({ type: 'sub-nav', data: this.subNav, count: this.state.estimatesCount });
              }
            });
          }
        });
    }
  }

  getSelectedRevision() {
    let selectedItem = this.state.selectedEstimate.revDropDwn.filter((rev) => {
      return rev.id == this.state.selectedEstimate.selected_revision;
    });
    if (selectedItem.length) {
      return selectedItem[0].rev_no;
    }
    return '';
  }

  changeRevision(rev: any) {
    // window.location.hash = "/projects/"+this.activeRoute.parent.snapshot.params.id+"/estimates/"+this.state.revision;
    // this.state.selectedEstimate['id'] = this.state.revision;
    // this.state.selectedEstimate['id'] = this.state.selectedEstimate.selected_revision;
    this.state.selectedEstimate.selected_revision = rev.id;
    setTimeout(() => {
      this.getSelectedTabDetails();
    }, 200);
  }

  prebillEstimate() {
    this.state.disablePrebill = true;
    this.commonService.update({ type: 'overlay', action: 'start' });
    this.commonService.getApi('gpSyncEstimates', {
      estimates_id: this.activeRoute.snapshot.params.estimate_id,
      jobs_id: this.activeRoute.parent.snapshot.params.id
    })
      .then(res => {
        this.commonService.update({ type: 'overlay', action: 'stop' });
        if (res['result'] && res['result'].success) {
        }
      }).catch(err => {
        this.commonService.update({ type: 'overlay', action: 'stop' });
      });
  }

  /** Button Action 
   * Preview Actions (Estimating Complete)
  */
  estimatingComplete(flag = 'Post') {
    const locals: any = {
      title: flag + ' ' + 'Estimate',
      msg: '',
      btnTxt: '',
      flag: flag,
      jobs_id: this.activeRoute.parent.snapshot.params.id,
      estimates_id: this.activeRoute.snapshot.params.estimate_id,
      org_id: this.projectDetails.org_id,
    };
    if (flag == 'Post') {
      locals.msg = 'Do you want to post costs to Estimates?';
      locals.btnTxt = 'Post Costs to Estimate';
      locals.url = 'updateEstStatus';
      locals.params = {
        estimates_status_id: 2,
        ids: [this.state.selectedEstimate.id]
      }
    } else if (flag == 'Approve') {
      locals.msg = 'Do you want to Approve this Estimate?';
      locals.btnTxt = 'Approve Estimate';
      locals.url = 'estimateStatus';
      locals.params = {
        estimates_status_id: 4,
        id: this.activeRoute.snapshot.params.estimate_id,
        jobs_id: this.activeRoute.parent.snapshot.params.id
      }
    }
    this.dialog.open(EstimatingCompleteComponent, {
      panelClass: ['full-width-modal', 'full-modal-box-ui'],
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: locals
    })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          if (!res.success && res.data) {
            this.dialogRef = this.dialog.open(DeleteComponent, {
              panelClass: 'my-dialog',
              width: '600px',
              data: {
                title: 'Go To Estimate',
                msg: 'The services already approved in another estimate(' + res.data.estimateDt.estimate_no + ')',
              }
            });
            this.dialogRef.afterClosed().subscribe(result => {
              if (result && result.success) {
                this.route.navigate(['/projects/' + this.activeRoute.parent.snapshot.params.id + '/estimates/' + res.data.estimateDt.id]);
                setTimeout(() => {
                  this.getSelectedTabDetails();
                }, 500);
              }
            });
          }
        }
      })
  }

}

