import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SUPER_ADMIN_HEADERS } from "../super-admin.config";
import { GridApi, GridOptions } from 'ag-grid-community';
import { CommonService } from '@app/common/common.service';
import { FormGroup, FormBuilder } from '@angular/forms';
@Component({
  selector: 'app-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss']
})
export class DetailViewComponent implements OnInit {

  public tab: any;
  public headers = SUPER_ADMIN_HEADERS;
  public formGroup: FormGroup;
  gridApi: GridApi;
  gridOptions: GridOptions = {
    columnDefs: [],
    animateRows: true,
    rowHeight: 40,
    headerHeight: 38,
    rowData: [],
    sortingOrder: ['asc', 'desc'],
		rowSelection: 'single',
		paginationPageSize: 100,
		pagination: true,
    defaultColDef: {
      resizable: true
    },
    onGridReady: params => {
      this.gridApi = params.api;
      this.setGridColumns();
      this.gridApi.sizeColumnsToFit();
    }
  };
  public state = {
    email_notifications: '1'
  }
  public loading = true;
  constructor(
    private activatedRoute: ActivatedRoute,
    private commonService: CommonService,
    private fb: FormBuilder
  ) {
    this.tab = activatedRoute.snapshot.data;
    if(!this.tab.grid){
      this.createForm();
      this.getEmailNotification();
    }
  }

  ngOnInit() {
    
  }

  getEmailNotification(){
    this.loading = true;
    this.commonService.getApi('isMailStopped',{}).then(response => {
      this.loading = false;
      if (response['result'].success) {
        this.state.email_notifications = response['result'].data.email_notifications?'0':'1';
        this.setForm();
      }
    });
  }

  createForm(){
    this.formGroup = this.fb.group({
      email_notification: this.state.email_notifications
    });
  }

  setGridColumns(){
    this.loading = true;
    this.gridApi.setColumnDefs(this.headers[this.tab.header_key]);
    this.getRowData();
  }

  getRowData(){
    this.commonService.getApi(this.tab.url, { sort: 'asc' , perPage: 25 , page:1 })
    .then(res => {
        if (res['result'].success) {
            this.gridApi.setRowData(res['result'].data.items);
        }
        this.loading = false;
    });
  }

  setForm(){
    this.formGroup.patchValue({
      email_notification: this.state.email_notifications
    });
  }

  cancel(){
    this.setForm();
  }

  save(){
    this.commonService.getApi('stopSendingMails',this.formGroup.value).then(response => {
      
    });
  }

}
