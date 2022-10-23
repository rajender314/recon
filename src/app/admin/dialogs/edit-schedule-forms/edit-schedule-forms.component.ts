import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminService } from '@app/admin/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { forkJoin } from 'rxjs';
import * as _ from 'lodash';
import { LicenseManager } from "ag-grid-enterprise";
import { ColDef, GridOptions } from 'ag-grid-community';
LicenseManager.setLicenseKey("Enterpi_Software_Solutions_Private_Limited_MultiApp_1Devs21_August_2019__MTU2NjM0MjAwMDAwMA==f0a6adf3f22452a5a3102029b1a87a43");

@Component({
  selector: 'app-edit-schedule-forms',
  templateUrl: './edit-schedule-forms.component.html',
  styleUrls: ['./edit-schedule-forms.component.scss']
})
export class EditScheduleFormsComponent implements OnInit {

  public forms = [];
  public loader = true;
  public gridApi;
  public search = '';

  public columnDefs: Array<ColDef> = [
    {
      headerName: 'Products/Services',
      field: 'name',
      resizable: true,
      width: 300,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: true
      },
      headerCheckboxSelection: true
    }
  ];
  public gridOptions: GridOptions = {
    columnDefs: this.columnDefs,
    animateRows: false,
    groupSelectsChildren: true,
    rowSelection: 'multiple',
    icons: {
      groupExpanded: false,
      groupContracted: false
    },
    rowHeight: 40,
    rowData: this.forms,
    getNodeChildDetails: this.getNodeChildDetails,
    defaultColDef: {
      resizable: false
    },
    onGridReady: (params) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
      setTimeout(()=>{
        let ids = this.data.selectedForms;
        this.gridApi.forEachNodeAfterFilter( (node) => {
          if(node.data && node.data.id && ids.indexOf(node.data.id)>-1){
            node.setSelected(true);
          }
        });
      },100);
    }
  };

  constructor(
    private fb: FormBuilder,
		private adminService: AdminService,
		private dialogRef: MatDialogRef<EditScheduleFormsComponent>,
		@Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    this.getForms();
  }

  getForms() {
    this.loader = true;
    this.adminService.getApi('getBusinessRulesMarkups', {
      org_id: 41,
      company_code: 4,
      search: this.search
    }).then(response => {
      this.loader = false;
      if (response.result.success) {
        this.forms = response.result.data;
        this.gridOptions.rowData = this.forms;
      }
    });
  }

  close = () => {
		this.dialogRef.close();
  }

  save = () => {
    let selectedRows = this.gridApi.getSelectedRows();
    let ids = [];
    _.map(selectedRows, (value) => {
      ids.push(value.id);
    });
    this.adminService.saveApi('saveScheduleForms', Object.assign({form_ids: ids}, this.data.params))
				.then(response => {
					if (response.result.success) {
						this.dialogRef.close({ success: true, data: response.result.data });
					}
    });
  }

  getNodeChildDetails(rowItem) {
    if (rowItem.children) {
      return {
        group: true,
        children: rowItem.children,
        expanded: true,
        key: rowItem.label
      };
    } else {
      return null;
    }
  };

}
