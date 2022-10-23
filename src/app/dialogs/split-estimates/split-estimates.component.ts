import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { agGridColumnAutoFit } from '@app/shared/utility/config';
import { SplitCellEditComponent, SplitCellViewComponent, BalanceViewComponent, AddOrganizationsComponent, RemoveOrganizationComponent, OrganizationComponent } from '@app/dialogs/split-estimates-grid/split-estimates-grid.component';
import { CommonService } from '@app/common/common.service';
import { GridApi, ColumnApi, GridOptions, ColDef, RowNode } from 'ag-grid-community';
import * as _ from 'lodash';
import { AgPiSelect, AgPiPriceFormat, AgPiInput } from '@app/shared/components/ag-grid/custom-cell-editor';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { DeleteMenuCell } from '@app/shared/components/ag-grid/custom-cell-renderer';

@Component({
  selector: 'app-split-manual-first-column',
  template: '<i class="pixel-icons icon-company-codes"></i><span class="ag-header-cell-text">{{params.displayName}}</span>',
  styles:[`
  .icon-company-codes{
    font-size: 16px;
    width: 16px;
    height: 16px;
    line-height: 16px;
    margin-right: 8px;
    color: #172B4D;
    opacity: 0.7;
    position: relative;
    top: 3px;
  }
  `]
})

export class SplitManualFirstColumn {
  params: any;

  agInit(params: any): void {
    this.params = params;
  }
}

@Component({
  selector: 'app-split-estimates',
  templateUrl: './split-estimates.component.html',
  styleUrls: ['./split-estimates.component.scss']
})
export class SplitEstimatesComponent implements OnInit {
  public gridApi: GridApi;
  public columnApi: ColumnApi;
  public manualGridApi: GridApi;
  public manualColumnApi: ColumnApi;
  @ViewChild('stepper') stepper: ElementRef;
  public state = {
    loader: true,
    splitOrgCount: 0,
    duplicateRows: 0,
    reviewBalance: 0,
    splitType: 3,
    gridOptions: {
      columnDefs: [],
      onCellValueChanged: (gridApi) => {
        if (gridApi.oldValue != gridApi.newValue) {
        }
      },
      rowHeight: 34,
      headerHeight: 27,
      groupHeaderHeight: 40,
      animateRows: true,
      rowSelection: 'multiple',
      deltaRowDataMode: true,
      groupIncludeTotalFooter: true,
      stopEditingWhenGridLosesFocus: true,
      suppressDragLeaveHidesColumns: true,
      suppressMakeColumnVisibleAfterUnGroup: false,
      suppressAggFuncInHeader: true,
      autoGroupColumnDef: {
        cellRendererParams: {
        }
      },
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
          this.getSplitEstimates();
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
  };

  public subscription: any;

  gridOptionsManually: GridOptions = {
    columnDefs: [
      { headerName: "Company", field: 'company', width: 250 },
      { headerName: "Secondary Split", field: 'secondary_split' },
      { headerName: "100%", field: 'percentage',headerClass: "right-header-cell", cellClass: "text-right", aggFunc: this.columnSum },
      { headerName: "Amount", field: 'amount', headerClass: "right-header-cell", cellClass: "text-right", aggFunc: this.columnSum },
      { headerName: " ", field: 'delete', width: 50 }
    ],
    onCellValueChanged: (gridApi) => {
      if (gridApi.oldValue != gridApi.newValue) {
      }
    },
    rowHeight: 39,
    headerHeight: 36,
    groupHeaderHeight: 36,
    animateRows: true,
    rowSelection: 'multiple',
    deltaRowDataMode: true,
    groupIncludeTotalFooter: true,
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
      this.manualGridApi = params.api;
      this.manualColumnApi = params.columnApi;
      setTimeout(() => {
        this.manualGridApi.sizeColumnsToFit();
        this.getSplitEstimatesManually();
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private _dialog: MatDialog,
    private _dialogRef: MatDialogRef<SplitEstimatesComponent>,
    private commonService: CommonService
  ) {
    this.subscription = commonService.onUpdate().subscribe(ev => {
      if (ev.type && ev.type == 'split-estimate') {
        this.getSplitEstimatesData();
      }
    });
  }

  ngOnInit() {
    this.state.loader = false;
    this.stepper['selectedIndex'] = this.data.split;
  }

  getSplitEstimatesData() {
    this.commonService.getApi('splitEstimates', {
      id: this.data.estimate_id,
      type: this.state.splitType
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.state.loader = false;
          this.buildEstimateColumns(res['result'].data);
        }
      });
  }

  getSplitEstimates() {
    this.state.loader = true;
    this.getSplitEstimatesData();
  }

  manual = {
    headers: [
      { key: 'org_id', name: 'Clybourn & Halsted BB 2018 P13', type: 'select', editable: true, option: 'organizations' },
      { key: 'secondary_split', name: 'Secondary Split', editable: true, type: 'text' },
      { key: 'percent', name: '100%', editable: true, type: 'price' },
      { key: 'gross', name: '$150.000', editable: true, type: 'price' },
    ],
    data: [
      { id: 1, org_id: 1, secondary_split: 'test', percent: 10, gross: 15.000 },
      { id: 2, org_id: 1, secondary_split: 'test', percent: 10, gross: 15.000 },
      { id: 3, org_id: 1, secondary_split: 'test', percent: 10, gross: 14.000 },
      { id: 4, org_id: 1, secondary_split: 'test', percent: 10, gross: 15.000 },
      { id: 5, org_id: 1, secondary_split: 'test', percent: 10, gross: 30.000 },
      { id: 6, org_id: 1, secondary_split: 'test', percent: 10, gross: 7.000 },
      { id: 7, org_id: 1, secondary_split: 'test', percent: 10, gross: 7.000 }
    ],
    organizations: [
      { id: 1, name: 'Albertsons-Denver ABS' },
      { id: 2, name: 'Albertsons-Denver ABS 1' },
      { id: 3, name: 'Albertsons-Denver ABS 2' },
      { id: 4, name: 'Albertsons-Denver ABS 3' },
      { id: 5, name: 'Albertsons-Denver ABS 4' }
    ],
    values: {
      percent: 100,
      gross: 150.000
    }
  }

  getSplitEstimatesManually() {
    // this.state.loader = false;
    this.commonService.getApi('orgSplitsManual', {
      estimates_id: this.data.estimate_id,
      jobs_id: this.data.job_id
    })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this.state.loader = false;
          this.manual = res['result'].data;
          this.buildEstimateColumnsManually(res['result'].data);
        }
      });


    // this.buildEstimateColumnsManually(this.manual);
  }

  buildEstimateColumnsManually(layout: any) {
    let columns = [];
    layout.headers.map((col, i) => {
      let column: ColDef = {
        headerName:col.name,
        cellClass:'sub-org-cell',
        field: col.key,
        editable: col.editable
      }
      if (i == 0) {
        column.headerComponentFramework = SplitManualFirstColumn;
        column.aggFunc = this.columnSumTotal;
        column.width=390;

        }
      if (i == 1) {
        column.cellClassRules = {
          'ag-has-change': params => params.data && params.data.has_change
        }
        column.suppressCellFlash = true;
        column.onCellValueChanged = params => {
          if (params.oldValue != params.newValue) {
            delete params.data.has_change;
            (<GridApi>params.api).updateRowData({ update: [params.data] });
          }
        }
      }
      if (col.type == 'select') {
        column.cellEditorFramework = AgPiSelect;
        column.cellEditorParams = params => {
          return {
            options: layout[col.option] || []
          }
        }
        column.onCellValueChanged = params => {
          if (params.oldValue != params.newValue) {
            delete params.data.has_change;
            params.data.org_name = this.getOrgName(params.newValue);
            (<GridApi>params.api).updateRowData({ update: [params.data] });
          }
          if (document.querySelector('.pi-select-list')) {
            document.body.removeChild(document.querySelector('.pi-select-list'));
          }
        }
        column.cellRenderer = params => {
          return params.data ? (params.value ? this.getOrgName(params.value) : '') : params.value;
        }
      } else if (col.type == 'price') {
        let config = {};
        if (col.key == 'percent') config = { prefix: '', limit: false, thousandsSeparator: '', centsLimit: 4 }
        else config = { prifix: '$', limit: false, centsLimit: 4 };
        column.cellEditorFramework = AgPiPriceFormat;
        column.cellEditorParams = {
          priceConfig: config
        };
        column.aggFunc = this.columnSum;
        column.cellRenderer = params => {
          return params.value ? (col.key == 'percent' ? (params.value + '%') : ('$' + params.value)) : '--';
        }
        column.headerClass='right-header-cell';
        column.cellClass = 'edit split-edit-cell';
        column.cellRendererParams = {
          percent: layout.values.percent,
          gross: layout.values.gross
        }
        column.onCellValueChanged = params => {
          if (params.data) {
            if (params.oldValue != params.newValue) {
              if (params.colDef.field == 'percent') {
                const value = params.colDef.cellRendererParams.gross * (parseInt(params.newValue) / params.colDef.cellRendererParams.percent);
                params.data.gross = value?value.toFixed(4):'0.0000';
              } else if (params.colDef.field == 'gross') {
                const value = (params.newValue / params.colDef.cellRendererParams.gross) * params.colDef.cellRendererParams.percent;
                params.data.percent = value?value.toFixed(4):'0.0000';
              }
              (<GridApi>params.api).updateRowData({ update: [params.data] });
            }
          }
        }
      } else if (col.type == 'text') {
        column.cellEditorFramework = AgPiInput
        column.cellClass = 'edit split-edit-cell';
      }
      columns.push(column);
    })
    columns.push({
      headerName: " ",
      field: 'delete',
      width: 50,
      pinned: 'right',
      cellClass: 'delete-organization',
      cellRendererFramework: DeleteMenuCell,
      cellRendererParams: {
        tooltip: 'Remove Organization',
        url: 'rmColSplitEst',
        deleteParams: {
          jobs_id: this.data.job_id,
          estimate_id: this.data.estimate_id
        }
      },
      onCellClicked: params => {
        if (params.data) {
          (<RowNode>params.node).data.org_name = this.getOrgName(params.data.org_id);
          (<RowNode>params.node).data.org_display_name = this.getOrgName(params.data.org_id,'name');
          (<RowNode>params.node).setData((<RowNode>params.node).data);
        }
      }
    });
    this.manualGridApi.setColumnDefs([]);
    this.manualGridApi.setColumnDefs(columns);
    if (layout.data.length) this.manualGridApi.setRowData(layout.data);
    
  }

  getOrgName(id, name: any = 'icon') {
    const obj = _.find(this.manual.organizations, ['id', id]);
    if (obj) return (name=='icon')?"<i class='pixel-icons icon-sub-organisations'></i>" + obj.name: obj.name;
    else return '---';
  }

  addOrganization() {
    const dummyRow = {
      id: 'new_' + Math.random().toString().substr(5),
      org_id: (this.manual.organizations.length)?this.manual.organizations[0].id:'',
      secondary_split: '',
      gross: '',
      percent: ''
    }
    this.manualGridApi.updateRowData({ add: [dummyRow] });
  }

  deleteRow(data) {
    let isNew = true;
    if (typeof data.id == 'string') isNew = true;
    else isNew = false;
    if (!isNew) {
      const locals = {
        title: 'Delete Organization',
        action: 'delete',
        url: '',
        tab: 'Organization',
        params: {
          id: data.id
        },
        content: 'Are you sure, you want to delete this Organization'
      }
      this._dialog.open(ConfirmationComponent, {
        panelClass: 'my-dialog',
        width: '600px',
        data: locals
      })
        .afterClosed()
        .subscribe(res => {
          if (res && res.success) this.manualGridApi.updateRowData({ remove: [data] });
        });
    } else {
      this.manualGridApi.updateRowData({ remove: [data] });
    }
  }

  buildEstimateColumns(layout: any) {
    let columns = [];
    if (layout.headers.length > 2) {
      this.state.splitOrgCount = layout.headers.length - 2;
    }
    _.map(layout.headers, (col, i) => {
      switch (i) {
        case 0:
          columns.push({
            headerName: col.org_name,
            resizable: true,
            children: [
              {
                headerName: col.est_name, field: col.id,resizable: true, headerClass: false, cellClass: false, cellRenderer: (params) => {
                  return (params.data) ? '<div class="split-cell-view"><i class="pixel-icons icon-products"></i>' + params.value + '</div>' : '<div class="split-cell-view">' + params.value + '</div>';
                }, aggFunc: this.columnSumTotal, width: 350, pinned: 'left'
              }
            ]
          });
          break;
        case 1:
          columns.push({
            headerName: col.org_name,
            resizable: true,
            children: [
              {
                headerName: col.est_name, field: col.id,resizable: true, headerClass: "right-header-cell", cellClass: "text-right", cellRendererFramework: OrganizationComponent, cellRendererParams: {
                  headers: layout.headers,
                  parent_org: layout.headers['1'].id,
                  split_count: (layout.headers.length - 2),
                  job_id: this.data.job_id,
                  estimate_id: this.data.estimate_id,
                  org_id: col.id
                }, aggFunc: this.columnSum, width: 220, pinned: 'left'
              }
            ]
          });
          break;
        default:
          columns.push({
            headerName: col.org_name,
            headerGroupComponentFramework: RemoveOrganizationComponent,
            headerClass: "organization-title",
            headerGroupComponentParams: {
              job_id: this.data.job_id,
              estimate_id: this.data.estimate_id,
              org_id: col.id
            },
            children: [
              {
                headerName: col.xid + "-" + col.est_name, headerClass: "header-cell-center", cellClass: params => {
                  return (params.data) ? 'edit' : '';
                }, editable: true, valueGetter: (params) => {
                  return params.data[col.id];
                }, cellEditorParams: {
                  headers: layout.headers,
                  parent_org: layout.headers['1'].id,
                  org_id: col.id,
                  estimate_id: this.data.estimate_id
                }, cellRendererFramework: SplitCellViewComponent, cellEditorFramework: SplitCellEditComponent, aggFunc: this.columnSum, field: col.id, width: 240,
                onCellClicked: params => {
                  if(params.data){
                    params.data['target'] = params.event.target.className;
                  }
                }
              }
            ]
          });
          break;
      }
    });
    columns.push({
      headerName: 'Add Organization',
      headerClass:'balence-header',
      headerGroupComponentFramework: AddOrganizationsComponent,
      resizable: true,
      headerGroupComponentParams: {
        split_count: (layout.headers.length - 2),
        headers: layout.headers,
        job_id: this.data.job_id,
        estimate_id: this.data.estimate_id,
        orgs: layout.org_data,
        org_id: '',
        estimate_costs: [
          { id: 1, name: 'Use percentage of parent estimate' },
          { id: 2, name: 'Use Remaining Costs' }
        ],
        estimate_cost_id: 1,
        secondary_split: '',
        percentage: ''
      },
      children: [
        {
          headerName: 'Balance', field: "balance",resizable: true, headerClass: "right-header-cell", width: 180, cellRendererParams: {
            headers: layout.headers,
            parent_org: layout.headers['1'].id
          }, cellRendererFramework: BalanceViewComponent, pinned: 'left'
        }
      ]
    });
    (<GridApi>this.gridApi).setColumnDefs([]);
    (<GridApi>this.gridApi).setColumnDefs(columns);
    (<GridApi>this.gridApi).setRowData(layout.gridDt);
  }

  back(stepper: any) {
    this.state.loader = true;
    stepper.selectedIndex = stepper.selectedIndex - 1;
    setTimeout(() => {
      this.state.loader = false;
    }, 500);
  }

  regenerateEstimate(){
    this.commonService.getApi('generateSplitEst', {
      id: this.data.estimate_id,
      type: this.state.splitType
    })
    .then(res => {
      if (res['result'] && res['result'].success) {
        this.getSplitEstimates();
      }
    });
  }

  splitEstimate(){
    let rowData = [];
    this.gridApi.forEachNode((node: RowNode) => {
      if (node.data && node.data.balance_value!='' && node.data.balance_value!='0.0000' && node.data.balance_value!='0'){
        rowData.push(node.data)
      }
    });
    this.state.reviewBalance = rowData.length;
    if(!rowData.length){
      this.state.loader = true;
      this.commonService.saveApi('addSplitEst', {
        estimates_id: this.data.estimate_id
      })
      .then(res => {
        if (res['result'] && res['result'].success) {
          this._dialogRef.close({success: true});
        }
      });
    }
  }

  next(stepper: any, index: any) {
    if (index == 2) {
      let rowData = [];
      this.manualGridApi.forEachNode((node: RowNode) => {
        if (node.data)
          rowData.push(node.data)
      });
      var duplicateRows = _.filter(
        _.uniq(
          _.map(rowData, function (item) {
            if (_.filter(rowData, { org_id: item.org_id, secondary_split: item.secondary_split }).length > 1) {
              return item.id;
            }
            item['has_change'] = false;
            return false;
          })),
        (value) => { return value; });
      let rows = [];
      duplicateRows.map(id => {
        const row: RowNode = this.manualGridApi.getRowNode(id);
        if (row) {
          row.data.has_change = true;
          rows.push(row.data);
        }
      });
      this.manualGridApi.updateRowData({ update: rows });
      this.state.duplicateRows = duplicateRows.length;
      if (!duplicateRows.length) {
        this.state.loader = true;
        this.commonService.saveApi('saveManualEst', {
          estimates_id: this.data.estimate_id,
          jobs_id: this.data.job_id,
          organization: rowData
        })
        .then(res => {
          if (res['result'] && res['result'].success) {
            this.state.splitType = 1;
            this.goToNextStepper(stepper, index);
          }else{
            this.state.loader = false;
          }
        });
      }
    } else {
      this.goToNextStepper(stepper, index);
    }
  }

  goToNextStepper(stepper: any, index: any) {
    this.state.loader = true;
    stepper.selectedIndex = index;
  }

  useDistroList(stepper: any, index: any) {
    this.state.loader = true;
    this.state.splitType = 2;
    stepper.selectedIndex = index;
  }

  formatNumber(number) {
    if (number) {
      let x = number.split('.');
      let x1 = x[0];
      x1 = isNaN(x1) ? "0" : Number(x1);
      x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
      var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
      return x1 + x2;
    }
    return '0.0000';
  }

  columnSum(values) {
    return values.reduce((a, b) => {
      return (a ? parseFloat(a) : 0) + (b ? parseFloat(b) : 0);
    }, 0).toFixed(4);
  }

  columnSumTotal() {
    return 'Total';
  }

  closeDialog() {
    this._dialogRef.close();
  }

}