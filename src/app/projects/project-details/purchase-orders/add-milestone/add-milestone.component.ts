import { Component, OnInit, Inject } from '@angular/core';
import { CommonService } from '@app/common/common.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GridOptions, GridApi, RowNode } from 'ag-grid-community';
import { AgSearchHeaderCell } from '@app/shared/components/ag-grid/custom-header-renderer';

import * as _moment from 'moment';

@Component({
  selector: 'app-add-milestone',
  templateUrl: './add-milestone.component.html',
  styleUrls: ['./add-milestone.component.scss']
})
export class AddMilestoneComponent implements OnInit {

  loader: boolean = false;
  POTimelines: Array<any> = [];
  gridApi: GridApi;
  gridOptions: GridOptions = {
    rowHeight: 40,
    headerHeight: 38,
    columnDefs: [
      {
        headerName: 'Vendor Milestones', field: 'task_name', cellRenderer: 'agGroupCellRenderer', cellRendererParams: {
          checkbox: true
        },
        width: 400,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
      },
      {
        headerName: '', field: 'due_date', width: 250, cellRenderer: params => {
          return params.value ? params.value : '--';
        }, headerComponentFramework: AgSearchHeaderCell
      }
    ],
    animateRows: true,
    rowSelection: 'multiple',
    rowData: [],
    onGridReady: params => {
      this.gridApi = params.api;
    },
    onFilterChanged: params => {
      if (params.api.getDisplayedRowCount() == 0) params.api.showNoRowsOverlay();
      else params.api.hideOverlay();
    }
  }

  addMilestonePromise: any;

  constructor(
    private _dialogRef: MatDialogRef<AddMilestoneComponent>,
    private _commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.getPOTimelines();
  }

  getPOTimelines() {
    this.loader = true;
    this._commonService.getApi('poTimeLine', { jobs_id: this.data.jobs_id, vendors_id: this.data.selectedRow.vendor_id, po_id: this.data.selectedRow.id })
      .then(res => {
        this.loader = false;
        if (res['result'].success) {
          this.POTimelines = res['result'].data.masterDt || [];
          this.gridApi.setRowData(this.POTimelines);
          setTimeout(() => {
            this.gridApi.sizeColumnsToFit();
          }, 20);
        }
      })
  }

  addMilestones() {
    if (!this.addMilestonePromise) {
      let tasks = [];
      this.gridApi.getSelectedRows().map(o => {
        tasks.push({ id: o.id, due_date: o.due_date ? _moment(o.due_date).format('YYYY-MM-DD HH:mm:ss') : null });
      })
      this.addMilestonePromise = this._commonService.saveApi('savePoTimeLine', { jobs_id: this.data.jobs_id, po_id: this.data.selectedRow.id, jobs_tasks_id: tasks })
        .then(res => {
          this.addMilestonePromise = undefined;
          if (res['result'].success) {
            this._dialogRef.close({ success: true, data: res['result'].data });
          }
        })
        .catch(err => {
          this.addMilestonePromise = undefined;
        })
    }
  }

}
