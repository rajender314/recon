import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { AddTaskComponent } from '@app/projects/project-details/add-task/add-task.component';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';
import { NumericCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/numeric-cell-editor/numeric-cell-editor.component';
import { CostAnalysisGridComponent } from '@app/projects/project-details/cost-analysis-grid/cost-analysis-grid.component';
import { forkJoin, Subscription } from 'rxjs';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { SelectCellEditorComponent } from '@app/shared/components/ag-grid/cell-editors/select-cell-editor/select-cell-editor.component';
import { agGridColumnAutoFit } from '@app/shared/utility/config';
import { ActivatedRoute } from '@angular/router';
import { GridOptions, GridApi } from 'ag-grid-community';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';

var APP = window['APP'];

@Component({
  template: `<ng-container *ngIf="params.data">
              <div class="product" *ngIf="params.value">
                <span class="product-title" matTooltip="{{params.value}}"> 
                  <i class="pixel-icons {{params.data.product_is_cancel ? 'icon-cancelled-products' : 'icon-products'}}"></i> {{params.value}} 
                </span>
                <div class="ag-cell-custome-actions" style="position: absolute; right: 0; top: 7px;" *ngIf="params.data.estimates_expense_id == 0 && params.column.colDef.cellRendererParams.edit">
                <ul style="padding-top: 0;">
                <li matTooltip="Delete Cost Item" class="m-0" (click)="deleteRow()" ><i class="pixel-icons icon-delete"></i></li>
                </ul>
                </div></div>
            </ng-container>`,
  styles: [`
    .product{position: relative}
    .product-title{padding-right: 20px;}
    i.icon-delete{position: relative; width: 16px; height: 16px; font-size: 14px; top: 1px; left: 1px; cursor: pointer;     opacity: .7;}
    i.icon-delete:hover{opacity: 1;}
    `]
})
export class CostAnalysisProductCell {
  params: any;
  ajaxProgress: any = undefined;
  constructor(
    private _commonService: CommonService,
    private _snackbar: MatSnackBar,
    private _dialog: MatDialog
  ) { }

  agInit(params) {
    this.params = params;
  }

  deleteRow() {
    this._dialog.open(ConfirmationComponent, {
      panelClass: ["recon-dialog", "confirmation-dialog"],
      width: '600px',
      data: {
        title: 'Remove Cost Item',
        action: 'remove',
        url: 'rmCostAnalysis',
        params: {
          id: this.params.data.id
        },
        content: 'Are you sure, you want to remove this Cost Item'
      }
    })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          (<GridApi>this.params.api).updateRowData({ remove: [this.params.data] });
          this.snackbarModal('success', false, 'Cost Item Removed Successfully');
        }
      })
  }

  snackbarModal(status = 'success', isNew = true, msg?) {
    this._snackbar.openFromComponent(SnackbarComponent, {
      data: { status: status, msg: msg ? msg : ('Task ' + (isNew ? 'Created ' : 'Updated ') + ' Successfully') },
      verticalPosition: 'top',
      horizontalPosition: 'right',
      panelClass: status
    });
  }
}

@Component({
  selector: 'app-cost-analysis',
  templateUrl: './cost-analysis.component.html',
  styleUrls: ['./cost-analysis.component.scss'],
  host: {
    // class: 'cost-analysis-container'
  }
})
export class CostAnalysisComponent implements OnInit, OnDestroy {
  public gridApi: any;
  public ivieUsers = [];
  public otherUsers = [];
  public agGrid: GridOptions;
  public state = {
    projectID: null,
    job_status_id: null,
    loader: true,
    projectInfo: {},
    showView: false,
    activeTab: 0,
    costsList: [],
    costAnalysisTabs: [
      { type: 0, label: 'All' },
      { type: 1, label: 'Billable Tasks' },
      { type: 2, label: 'Expenses' },
      { type: 3, label: 'Bids' },
      { type: 4, label: 'Project Specific Cost' }
    ],
    breadcrumbs: [
      { label: 'Projects', type: 'link', route: '/projects' },
      { label: '', type: 'text' },
      /* { label: 'Cost Analysis', type: 'text' }, */

    ],
    gridOptions: {
      columnDefs: [],
      rowHeight: 38,
      headerHeight: 38,
      // groupHideOpenParents: true,
      onColumnRowGroupChanged: (params) => {
        let visibleColumns = [];
        params.columnApi.columnController.columnDefs.map((column) => {
          visibleColumns.push(column.field);
        });
        params.api.columnController.columnApi.setColumnVisible(visibleColumns, true);
        if (params.columns && params.columns.length) {
          params.columns.map((column) => {
            params.api.columnController.columnApi.setColumnVisible(column.colId, false);
          });
        }
      },
      onCellValueChanged: (gridApi) => {
        switch (gridApi.colDef.field) {
          case 'units':
            if (gridApi.data &&
              (gridApi.data.cost_type == 'Misc' || gridApi.data.cost_type == 'Task') &&
              gridApi.data.rates != '0.00' && gridApi.data.units != 0) {
              gridApi.data.net = (parseFloat(gridApi.data.rates) * parseFloat(gridApi.data.units));
              gridApi.data.gross = (parseFloat(gridApi.data.rates) * parseFloat(gridApi.data.units));
            } else if (gridApi.data &&
              (gridApi.data.cost_type == 'Bids') &&
              gridApi.data.rates != '0.00' && gridApi.data.units != 0) {
              gridApi.data.net = (parseFloat(gridApi.data.rates) * parseFloat(gridApi.data.units));
              let serviceMarkup = this.state.projectInfo['client_markup'];
              gridApi.data.gross = ((parseFloat(gridApi.data.net) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net));
            }
            gridApi.node.setData(gridApi.data);
            // gridApi.api.refreshClientSideRowModel('aggregate');
            break;
          case 'rates':
            if (gridApi.data && gridApi.data.cost_type == 'Bids' && gridApi.data.rates != '0.00' && gridApi.data.units != 0) {
              gridApi.data.net = (parseFloat(gridApi.data.rates) * parseFloat(gridApi.data.units));
              let serviceMarkup = gridApi.data.markup;
              gridApi.data.gross = ((parseFloat(gridApi.data.net) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net));
            }
            gridApi.node.setData(gridApi.data);
            // gridApi.api.refreshClientSideRowModel('aggregate');
            break;
          case 'net':
            if (gridApi.data && gridApi.data.cost_type == 'Misc' && gridApi.data.misc_type == 'Markup') {
              let serviceMarkup = gridApi.data.markup;
              gridApi.data.gross = ((parseFloat(gridApi.data.net) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net));
            } else if (gridApi.data && gridApi.data.cost_type == 'Bids') {
              let serviceMarkup = this.state.projectInfo['client_markup'];
              gridApi.data.gross = ((parseFloat(gridApi.data.net) * (parseFloat(serviceMarkup) / 100)) + parseFloat(gridApi.data.net));
            }
            gridApi.node.setData(gridApi.data);
            // gridApi.api.refreshClientSideRowModel('aggregate');
            break;
          case 'asignee':
            if (document.querySelector('.pi-select-list')) {
              document.body.removeChild(document.querySelector('.pi-select-list'));
            }
            break;
        }
        if (gridApi.oldValue != gridApi.newValue && gridApi.colDef.field != 'asignee') {
          this.updateRowCost(gridApi);
        }
      },
      cellClicked: (params) => {
      },
      // suppressDragLeaveHidesColumns: true,
      animateRows: true,
      rowSelection: 'multiple',
      deltaRowDataMode: true,
      groupIncludeTotalFooter: true,
      // groupMultiAutoColumn: true,
      // groupHideOpenParents:true,
      // suppressDragLeaveHidesColumns: false, // Hide Grouped columns
      stopEditingWhenGridLosesFocus: true,
      suppressDragLeaveHidesColumns: true,
      suppressMakeColumnVisibleAfterUnGroup: false,
      // groupUseEntireRow:true,
      suppressAggFuncInHeader: true,
      autoGroupColumnDef: {
        // headerName: 'Group', // Custom header name
        // field: "product", // Leaf columns
        cellRendererParams: {
          // suppressCount: true, // Removing the grouped rows count
          // checkbox: true // Checkbox for grouped columns
        }
      },
      icons: {
        groupExpanded: '<div class="expand"><i class="pixel-icons icon-arrow-down" /></div>',
        groupContracted: '<div class="contract"><i class="pixel-icons icon-arrow-right" /></div>'
      },

      pagination: true,

      onCellClicked: (params) => {
        if (params.event.target.className == 'pixel-icons icon-revert') {
          params.data.gross = params.data.original_gross_amount;
          params.node.setData(params.data);
          this.updateRowCost(params);
        }
      },
      onGridReady: (params) => {
        this.gridApi = params.api;
        setTimeout(() => {
          // params.api.resetRowHeights();
          // agGridColumnAutoFit(params.api, params.columnApi, false);
        }, 100);
        // window.onresize = () => {
        //     agGridColumnAutoFit(params.api, params.columnApi, false);
        // };
      },
      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: true
      },
      sortingOrder: ["asc", "desc"],
      enableRangeSelection: true,
      floatingFilter: true,
      rowGroupPanelShow: 'always',
      pivotPanelShow: 'always',
      // sideBar: true,
      // sideBar: 'columns',
      sideBar: {
        toolPanels: [{
          id: 'columns',
          labelDefault: 'Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel'
        },
        {
          id: 'filters',
          labelDefault: 'Filters',
          labelKey: 'filters',
          iconKey: 'filter',
          toolPanel: 'agFiltersToolPanel',
        }]
      },
      rowData: []
    }
  };

  subscription: Subscription;
  routerSubscription: Subscription;
  allowEditable: boolean;
  constructor(
    private dialog: MatDialog,
    private commonService: CommonService,
    private snackbar: MatSnackBar,
    private _router: ActivatedRoute
  ) {
    this.state.breadcrumbs[0].route = commonService.projectState ? ('/projects/' + commonService.projectState) : '/projects';
    this.routerSubscription = _router.parent.params.subscribe(param => {
      this.state.projectID = param.id ? param.id : null;
      // this.getUsers();
    });
    this.subscription = commonService.onUpdate().subscribe(obj => {
      if (obj.hasOwnProperty('type') && obj.type == 'projectName') {
        if (obj.data.job_title) {
          this.state.breadcrumbs[1].label = obj.data.job_title || '----';
          this.state.projectInfo = obj.data;
          if (obj.data.job_status_id != undefined) {
            this.state.job_status_id = obj.data.job_status_id;
            this.allowEditable = this.checkPermission();
            this.getUsers();
          }
        }
      } else if (obj.type && obj.type == 'distroRefresh') {
        this.getUsers();
      }
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.routerSubscription.unsubscribe();
  }

  getUsers() {
    forkJoin(
      this.commonService.getApi('desgnUsers', { org_type: 3, type: 'child' }),
      this.commonService.saveApi('getVendors', { org_type: 3 })
    ).subscribe(([response1, response2]) => {
      if (response1['result'].success) {
        this.ivieUsers = response1['result'].data;
        // this.commonService.onChange({ type: 'ivieUsers', data: this.ivieUsers });
      }
      if (response2['result'].success) {
        this.otherUsers = response2['result'].data;
        // this.commonService.onChange({ type: 'otherUsers', data: this.otherUsers });
      }
      if (response1['result'].success && response2['result'].success) {
        this.buildCostListColumns();
        this.getCostList();
      }
    });
  }

  buildCostListColumns() {
    this.state.gridOptions.columnDefs = [
      {
        headerName: 'TASK/EXPENSE/BIDS', field: 'cost_type', filter: "agTextColumnFilter", cellRenderer: (params) => {
          if (params.data && params.data.cost_name) {
            return params.value + " - " + params.data.cost_name;
          }
          return params.value;
        }, enableRowGroup: true
      },
      {
        headerName: 'ASIGNEE', field: 'asignee', /*autoHeight: true,*/
        cellClassRules: {
          'ag-edit-cell ag-edit-cell ag-select-edit': params => {
            return (this.allowEditable && params.data && params.data.cost_type && params.data.cost_type == 'Misc' && (params.data.user_type == '2' || params.data.user_type == '2') && params.data.estimates_expense_id == 0)
          }
        },
        cellRendererParams: {
          ivieUsers: this.ivieUsers,
          otherUsers: this.otherUsers,
          selectType: 'users_id'
        }, editable: (params) => {
          return (this.allowEditable && params.data && params.data.cost_type && params.data.cost_type == 'Misc' && (params.data.user_type == '2' || params.data.user_type == '2') && params.data.estimates_expense_id == 0);
        }, filter: "agTextColumnFilter", cellEditorFramework: SelectCellEditorComponent, cellRendererFramework: CostAnalysisGridComponent, enableRowGroup: true
      },
      {
        headerName: 'UNITS', field: 'units', cellClass: 'right-text-cell ag-edit-input-ui', headerClass: 'right-header-cell', editable: (params) => {
          return (this.allowEditable && params.data && params.data.cost_type && ((params.data.cost_type == 'Misc' && params.data.misc_type == 'Rate') || params.data.cost_type == 'Task') && params.data.estimates_expense_id == 0);
        }, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (this.allowEditable && params.data && params.data.cost_type && ((params.data.cost_type == 'Misc' && params.data.misc_type == 'Rate') || params.data.cost_type == 'Task') && params.data.estimates_expense_id == 0) {
            return '<div class="text-right"><div class="text-edit">' + (params.value ? params.value : '0') + '</div></div>';
          } else {
            return '<div class="text-right">' + (params.value ? params.value : '0') + '</div>';
          }
        }, aggFunc: this.columnSumEmpty, filter: "agTextColumnFilter", width: 120, cellRendererParams: { allowZero: true, decimalLimit: 2 }
      },
      {
        headerName: 'RATES', field: 'rates', cellClass: 'right-text-cell', headerClass: 'right-header-cell', editable: false, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (params.data) {
            return '<div class="text-right">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '</div>';
          } else {
            return ' ';
          }
        }, aggFunc: this.columnSumEmpty, filter: "agTextColumnFilter", width: 120, cellRendererParams: { allowZero: true, decimalLimit: 2 }
      },
      {
        headerName: 'NET', field: 'net', cellClass: 'right-text-cell', headerClass: 'right-header-cell', editable: (params) => {
          return (this.allowEditable && params.data && params.data.cost_type && (params.data.cost_type == 'Misc' && params.data.misc_type == 'Markup') && params.data.estimates_expense_id == 0);
        }, cellEditorFramework: NumericCellEditorComponent,
        cellRenderer: (params) => {
          if (params.data && params.data.isEdited && params.data.cost_type == 'Misc' && params.data.misc_type == 'Markup') {
            let serviceMarkup = params.data.markup;
            params.data.gross = ((parseFloat(params.data.net) * (parseFloat(serviceMarkup) / 100)) + parseFloat(params.data.net));
          }
          if (this.allowEditable && params.data && params.data.cost_type && (params.data.cost_type == 'Misc' && params.data.misc_type == 'Markup') && params.data.estimates_expense_id == 0) {
            return '<div class="text-right"><div class="text-edit">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '</div></div>';
          } else {
            return '<div class="text-right">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '</div>';
          }
        }, aggFunc: this.columnSum, filter: "agTextColumnFilter", width: 120, cellRendererParams: { allowZero: true, decimalLimit: 2 }
      },
      {
        headerName: 'GROSS', cellClass: 'right-text-cell', headerClass: 'right-header-cell', field: 'gross', editable: (params) => {
          return this.allowEditable && APP.permissions.job_access.allow_editing_gross_for_tasks == 'yes' ? (params.data && params.data.cost_type && (params.data.cost_type == 'Misc' || params.data.cost_type == 'Bids' || params.data.cost_type == 'Task') && params.data.estimates_expense_id == 0) : false;
        }, aggFunc: this.columnSum, cellEditorFramework: NumericCellEditorComponent, cellRenderer: (params) => {
          if (params.data && params.data.cost_type == 'Bids') {
            if (params.value > params.data.original_gross_amount) {
              if (this.allowEditable && params.data && params.data.cost_type && (params.data.cost_type == 'Misc' || params.data.cost_type == 'Bids' || params.data.cost_type == 'Task') && params.data.estimates_expense_id == 0) {
                return '<div class="text-right gross-cost"><div class="text-edit">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '<div class="rev-indicators"><i class="pixel-icons icon-upload"></i><i class="pixel-icons icon-revert" title="Revert"></i></div></div></div>';
              } else {
                return '<div class="text-right gross-cost">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '<div class="rev-indicators"><i class="pixel-icons icon-upload"></i><i class="pixel-icons icon-revert" title="Revert"></i></div></div>';
              }
            } else if (params.value < params.data.original_gross_amount) {
              if (this.allowEditable && params.data && params.data.cost_type && (params.data.cost_type == 'Misc' || params.data.cost_type == 'Bids' || params.data.cost_type == 'Task') && params.data.estimates_expense_id == 0) {
                return '<div class="text-right gross-cost"><div class="text-edit">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '<div class="rev-indicators"><i class="pixel-icons icon-down-arrow"></i><i  title="Revert" class="pixel-icons icon-revert"></i></div></div></div>';
              } else {
                return '<div class="text-right gross-cost">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '<div class="rev-indicators"><i class="pixel-icons icon-down-arrow"></i><i class="pixel-icons icon-revert" title="Revert" ></i></div> </div>';
              }
            }
          }
          if (this.allowEditable && APP.permissions.job_access.allow_editing_gross_for_tasks == 'yes' && params.data && params.data.cost_type && (params.data.cost_type == 'Misc' || params.data.cost_type == 'Bids' || params.data.cost_type == 'Task') && params.data.estimates_expense_id == 0) {
            return '<div class="text-right gross-cost"><div class="text-edit">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '</div></div>';
          } else {
            return '<div class="text-right gross-cost">' + (params.value ? '$' + ((params.value != '' && params.value != null && params.value != 0) ? this.formatNumber(parseFloat(params.value).toFixed(2)) : '0.00') : '$0.00') + '</div>';
          }
        }, filter: "agTextColumnFilter", width: 182, cellRendererParams: { allowZero: true, decimalLimit: 2 }
      },
      { headerName: 'PO', field: 'po', filter: "agTextColumnFilter", enableRowGroup: true },
      { headerName: 'ESTIMATE', field: 'estimate', filter: "agTextColumnFilter", enableRowGroup: true }
    ];
    if (this.state.activeTab != 4) {
      this.state.gridOptions.columnDefs.splice(0, 0,
        {
          headerName: 'PRODUCTS', field: 'product', filter: "agTextColumnFilter", enableRowGroup: true,
          cellRendererFramework: CostAnalysisProductCell, aggFunc: this.columnSumTotal, cellRendererParams: { edit: this.allowEditable }
          /*cellRenderer: (params) => {
           if (params.value != undefined) {
             return `<div class="product">
                       <span class="product-title"> 
                         <i class="pixel-icons icon-products"></i> ${params.value} 
                       </span>
                     </div>`;
           }
         }*/
        },
        {
          headerName: 'SERVICES', field: 'service', filter: "agTextColumnFilter", enableRowGroup: true, cellRenderer: (params) => {
            if (params.value != undefined) {
              return params.data && params.data.is_cancel ?
                '<div class="service-type" title="' + params.value + '"><span class="service-title"> <i class="pixel-icons icon-cancelled-services"></i>' + params.value + '</span></div>' :
                '<div class="service-type" title="' + params.value + '"><span class="service-title"> <i class="pixel-icons icon-orders"></i>' + params.value + '</span></div>';
            }
          }
        },
        {
          headerName: 'Revision', field: 'jsr_rev_no', filter: "agTextColumnFilter", width: 100, enableRowGroup: true, cellRenderer: (params) => {
            if (params.value != undefined || params.value != null) {
              return '<div class="text-center" style="text-align:center;">R' + params.value + '</div>';
            }
          }
        },
        {
          headerName: 'OPTIONS', field: 'option', filter: "agTextColumnFilter", cellRenderer: (params) => {
            if (params.value != undefined || params.value != null) {
              return '<div class="text-center" style="text-align:center;">' + params.value + '</div>';
            }
          }, width: 120
        }
      )
    }
  }

  formatNumber(number) {
    //parseFloat(params.value).toFixed(2)
    let x = number.split('.');
    let x1 = x[0];
    x1 = isNaN(x1) ? "0" : Number(x1);
    x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
    return x1 + x2;
    // return Math.floor(number).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
  }

  // border: 1px solid;
  // height: 30px;
  // margin: 4px;
  // overflow: hidden;
  // text-overflow: ellipsis;
  // background-color: #efe7e7;

  columnSum(values) {
    return values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(2);
  }

  columnSumEmpty() {
    return ' ';//values.reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(2);
  }

  columnSumTotal() {
    return 'Total';
  }

  updateRowCost(event) {
    this.gridApi.updateRowData(event.data);
    this.commonService.saveApi('updateCostAnalysis', {
      id: event.data.id,
      unit: event.data.units,
      rate: event.data.rates,
      net_amount: event.data.net,
      gross_amount: event.data.gross,
      users_id: event.data.users_id,
      user_type: event.data.user_type,
      estimates_expense_id: event.data.estimates_expense_id,
      is_others: event.data.is_others
    }).then(res => {
      if (res['result'].success) {
        if (event.data.estimates_expense_id && event.data.estimates_expense_id != 0) {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Updated Cost will reflect in the Estimates' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
        } else {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Cost Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          event.data['asignee'] = res['result'].data.asignee;
          event.data['unit'] = res['result'].data.unit;
          event.data['rate'] = res['result'].data.rate;
          event.data['net_amount'] = res['result'].data.net_amount;
          event.data['gross_amount'] = res['result'].data.gross_amount;
          event.api.updateRowData({ update: [event.data] });
        }
      }
    });
  }

  costTypeChange(event) {
    this.state.loader = true;
    this.state.activeTab = event;
    this.buildCostListColumns();
    switch (event) {
      case 0:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList);
        break;
      case 1:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return (item.cost_type == "Task") ? true : false;
        }));
        break;
      case 2:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return (item.cost_type == "Misc") ? true : false;
        }));
        break;
      case 3:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return (item.cost_type == "Bids") ? true : false;
        }));
        break;
      case 4:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return item.is_others ? true : false;
        }));
        break;
    }
  }

  onTabChange(event) {
    this.state.loader = true;
    this.state.activeTab = event;
    this.buildCostListColumns();
    switch (event) {
      case 0:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList);
        break;
      case 1:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return (item.cost_type == "Task") ? true : false;
        }));
        break;
      case 2:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return (item.cost_type == "Misc") ? true : false;
        }));
        break;
      case 3:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return (item.cost_type == "Bids") ? true : false;
        }));
        break;
      case 4:
        setTimeout(() => {
          this.state.loader = false;
        });
        this.state.gridOptions.rowData = _.cloneDeep(this.state.costsList.filter((item) => {
          return item.is_others ? true : false;
        }));
        break;
    }
  }

  getCostList() {
    this.commonService.getApi('costAnalysisLst', { jobs_id: this.state.projectID }).then(res => {
      if (res['result'].success) {
        this.state.costsList = _.cloneDeep(res['result'].data);
        this.state.gridOptions.rowData = _.cloneDeep(res['result'].data);
        this.onTabChange(this.state.activeTab);
      }
    });
  }

  changeMasterView() {
    this.state.showView = !this.state.showView;
  }

  addTask(): void {
    this.dialog.open(AddTaskComponent, {
      panelClass: ['my-dialog', 'add-cost-item'],
      width: '650px',
      height: '550px',
      disableClose: true,
      data: {
        title: 'Add Cost Item',
        projectInfo: this.state.projectInfo,
        tabIndex: this.state.activeTab
      }
    }).afterClosed()
      .subscribe(res => {
        if (res.success) {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Cost Added Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          this.getCostList();
        }
      });
  }

  checkPermission() {
    if (this.state.job_status_id == 8 || this.state.job_status_id == 10) {
      return APP.permissions.job_access['post-completion_estimate'] == 'yes';
    } else if (this.state.job_status_id == 5) {
      return APP.permissions.job_access['edit_cancelled_jobs'] == 'yes';
    }
    return true;
  }
}
