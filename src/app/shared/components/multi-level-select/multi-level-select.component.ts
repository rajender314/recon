import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as _ from 'lodash';
import { AdminService } from '@app/admin/admin.service';
import { GridOptions, GridApi } from 'ag-grid-community';

@Component({
  selector: 'app-multi-level-select',
  templateUrl: './multi-level-select.component.html',
  styleUrls: ['./multi-level-select.component.scss']
})
export class MultiLevelSelectComponent implements OnInit {

  public options = {
    data: [
      {id: 1, name: '1111', status: false},
      {id: 2, name: '2222', status: false},
      {id: 3, name: '3333', status: false},
      {id: 4, name: '4444', status: false},
      {id: 5, name: '5555', status: false},
      {id: 6, name: '6666', status: false},
      {id: 7, name: '7777', status: false},
      {id: 8, name: '8888', status: false},
      {id: 9, name: '9999', status: false},
    ],
    header: '',
    selectionCheck: false,
    navs : [
      { label: 'All', value: 'All' },
      { label: 'Selected', value: 'Selected' }
    ],
    selectedNav: 'All',
  }
  public isLoading = true;
  url: string = '';
  params: any;

  isVisible: boolean = false;
  gridApi: GridApi;
	gridOptions: GridOptions = {
		rowHeight: 40,
		columnDefs: [
			{
				headerName: 'All Tasks', field: 'name', cellRenderer: 'agGroupCellRenderer', cellRendererParams: {
					checkbox: true
				},
				headerCheckboxSelection: true,
				headerCheckboxSelectionFilteredOnly: true
			}
		],
		suppressRowClickSelection: true,
		rowSelection: 'multiple',
		animateRows: true,
		suppressDragLeaveHidesColumns: true,
		rowData: [],
		onGridReady: params => {
      this.gridApi = params.api;
      this.gridApi.setRowData(this.options.data);
      setTimeout(() => {
        params.api.sizeColumnsToFit();
      }, 200);
		}
	}

  constructor(
    private dialogRef: MatDialogRef<MultiLevelSelectComponent>,
    private adminService: AdminService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { 
    this.options.header = 'All ' + (data.tab || 'Tasks')
  }

  ngOnInit() {
    if(this.data.type == 'list'){
      this.url = 'vendorTemplateTasks';
      this.params = {id: this.data.id};
    }else {
      this.url = 'tasklist';
      this.params = {status: true};
    }
    setTimeout(() => {
      this.getList();
    },500);
  }

  getList() {
    this.adminService.getApi(this.url, this.params)
    .then((response) => {
      this.isLoading = false;
      if(this.data.type == 'list') {
        this.options.data = response.result.data;
      } else {
        this.options.data = response.result.data.items || [];
      }
    });
  }

  searchList(val) {
    this.gridApi.setQuickFilter(val);
  }

  changeSelection(val) {
    const selected_ids = this.gridApi.getSelectedRows().map(o => o.id);
		if (val == 'All') {
			this.gridApi.setRowData(this.options.data);
			this.defaultCheckForms(selected_ids, this.gridApi);
		} else if (val == 'Selected') {
			const data = this.gridApi.getSelectedRows().map(o => o);
			this.gridApi.setRowData(data);
			this.defaultCheckForms(selected_ids, this.gridApi);
		}
  }

  defaultCheckForms(selectedIds, gridApi) {
		let ids = selectedIds;
		setTimeout(() => {
			gridApi.forEachNodeAfterFilter((node) => {
				if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
					node.setSelected(true);
				} else {
					node.setSelected(false);
				}
			});
		}, 100);
	}

  cancel = () => {
		this.dialogRef.close();
  }
  
  save() {
    let task_ids = [], selectedList = [];
    if(this.data.type == 'list') {
      _.map(this.options.data, (value) => {
        if(value.checked)
          task_ids.push(value.id);
      });
      selectedList = _.filter(this.options.data, (value) => {
        return value.checked;
      });
    } else {
      task_ids = this.gridApi.getSelectedRows().map(o => o.id);
      selectedList = this.gridApi.getSelectedRows().map(o => o.id);
    }
    this.adminService.saveApi(this.data.saveApi, 
      Object.assign(this.data.params,{task_ids: task_ids}))
      .then((response) => {
      this.dialogRef.close({success: true, data: selectedList});
    });
    
  }

}
