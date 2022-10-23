import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { LicenseManager } from "ag-grid-enterprise";
import { SUPER_ADMIN_HEADERS } from "./super-admin.config";

LicenseManager.setLicenseKey("Enterpi_Software_Solutions_Private_Limited_MultiApp_1Devs21_August_2019__MTU2NjM0MjAwMDAwMA==f0a6adf3f22452a5a3102029b1a87a43");
@Component({
  selector: 'app-super-admin',
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SuperAdminComponent implements OnInit {
  public showDetail = true;
  adminList: Array<any> = [
    { key: 'settings', name: 'General Settings' },
    { key: 'emails', name: 'Email Controller' },
    { key: 'sent-mail', name: 'Sent Mail' },
    { key: 'crons', name: 'Crons' },
    { key: 'system-errors', name: 'System Errors' },
    { key: 'access-report', name: 'Access Report' },
    { key: 'error-report', name: 'Error Report' },
    { key: 'access-call-delay', name: 'Access Call Delay' }
  ];
  selectedListItem: any;
  gridApi: GridApi;
  gridOptions: GridOptions = {
    columnDefs: [],
    animateRows: true,
    rowHeight: 40,
    headerHeight: 38,
    rowData: [],
    defaultColDef: {
      resizable: true
    },
    onGridReady: params => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
    }
  };
  state = {
    settings: {
      columnDefs: [
        { headerName: 'ID', field: 'id', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'From', field: 'from' },
        { headerName: 'To', field: 'to' },
        { headerName: 'Subject', field: 'subject' },
        { headerName: 'Send Data', field: 'send data' },
        { headerName: 'Status', field: 'status' },
        { headerName: 'Show mail', field: 'show mail' },
        { headerName: 'Send mail', field: 'send mail' },
      ]
    },

    emails: {
      columnDefs: [
        { headerName: 'ID', field: 'name', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'From', field: 'from' },
        { headerName: 'To', field: 'to' },
        { headerName: 'Subject', field: 'subject' },
        { headerName: 'Send Data', field: 'send data' },
        { headerName: 'Status', field: 'status' },
        { headerName: 'Show mail', field: 'show mail' },
        { headerName: 'Send mail', field: 'send mail' },
      ]
    },
    sentmail: {
      columnDefs: [
        { headerName: 'ID', field: 'id', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'Email From', field: 'emailfrom' },
        { headerName: 'Email To', field: 'emailto' },
        { headerName: 'Subject', field: 'subject' },
        { headerName: 'Data', field: ' data' },
        { headerName: 'Show mail', field: 'show mail' },
      ]
    },


    crons: {
      columnDefs: [
        { headerName: 'CRON Name', field: 'cron name', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'Action', field: 'action' },
      ]
    },
    user: {
      columnDefs: [
        { headerName: 'User', field: 'user', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'Browser', field: 'browser' },
        { headerName: 'OS', field: 'os' },
        { headerName: 'Login Time', field: 'login time' },
        { headerName: 'Logout Time', field: 'logout time' },
      ]
    },
    errors: {
      columnDefs: [
        { headerName: 'File Name', field: 'filename', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'View File', field: 'view file' },
      ]
    },
    systemerrors: {
      columnDefs: [
        { headerName: 'ID', field: 'id', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'User Name', field: 'username' },
        { headerName: 'Message', field: 'message' },
        { headerName: 'Date added', field: 'date added' },
        { headerName: 'Status', field: 'status' },
      ]

    },
    importexportlogs: {
      columnDefs: [
        { headerName: 'User Name', field: 'username', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
        { headerName: 'Action', field: 'action' },
        { headerName: 'File Name', field: 'filename' },
        { headerName: 'Params', field: 'Params' },
        { headerName: 'Message', field: 'message' },
        { headerName: 'Response', field: 'response' },
        { headerName: 'Date Added', field: 'dateadded' },
      ]

    }


  };
  showTable: boolean;
  rowData: Array<any> = [];
  constructor(private activateRoute: ActivatedRoute) {}

  ngOnInit() {
  }

  onSelectItem(list) {
    this.selectedListItem = list;
  }

  getList(type) {
    switch (type) {
      case 'settings':
        this.getSettings();
        break;
      case 'errors':
        this.getErrors();
        break;
      case 'emails':
        this.getEmails();
        break;
      case 'user':
        this.getUsers();
        break;
      case 'systemerrors':
        this.getSystemAccessData();
        break;
      case 'importexportlogs':
        this.getAccessData();
        break;
      case 'sentmail':
        this.getSentMail();
        break;
      case 'crons':
        this.getCrons();
        break;
      default:
        break;
    }
  }

  getSettings() {
    const list = [
      {
        "id": "1",
        "from": "Settings",
        "to": "71 Stevenson Street, Suite 300",
        "subject": "San Francisco",
        "sentdata": "Imported from Lighthouse(Main (LH))",
        "showmail": "California",
        "send mail": "United States"
      }];
    this.rowData = list;
    this.showTable = true;
  }
  getErrors() {
    const listData = [ {  
      "filename":"Error List",
      "view file":"None"
    }];
    this.rowData = listData;
    this.showTable = true;
  }

  getEmails() {
    const list = [{
      "id":"2",
      "from":"Email controller",
      "to":"71 Stevenson Street, Suite 300",
      "subject":"San Francisco",
      "description":"Imported from Lighthouse(Main (LH))",
      "state":"California",
      "country":"United States",
    }];
    this.rowData = list;
    this.showTable = true;
  }
  getUsers() {
    const list = [
      {  
          "id":"4",
          "user":"User Logs",
         "browser":"71 Stevenson Street, Suite 300",
          "os":"San Francisco",
       "description":"Imported from Lighthouse(Main (LH))",
          "state":"California",
          "country":"United States",
       },
    ];
    this.rowData = list;
    this.showTable = true;
  }
  getSystemAccessData() {
    const lists = [{
      "id":"8",
      "username":"systemAccess",
        "message":"71 Stevenson Street, Suite 300",
        "dateadded":"San Francisco",
        "description":"Imported from Lighthouse(Main (LH))",
        "state":"California",
        "country":"United States",
    }];
    this.rowData = lists;
    this.showTable = true;
  }
  getAccessData() {
    const lists = [
        {  
            "id":"3",
            "emailfrom":"Access Login",
            "emailto":"71 Stevenson Street, Suite 300",
            "subject":"San Francisco",
            "data":"Imported from Lighthouse(Main (LH))",
            "state":"California",
            "country":"United States",
          }
      ];
    this.rowData = lists;
    this.showTable = true;
  }
  getSentMail() {
    const lists = [
      {  
          "id":"3",
          "emailfrom":"Access Login",
          "emailto":"71 Stevenson Street, Suite 300",
          "subject":"San Francisco",
          "data":"Imported from Lighthouse(Main (LH))",
          "state":"California",
          "country":"United States",
        }
    ];
    this.rowData = lists;
    this.showTable = true;
  }
  getCrons() {
    const lists = [
      {  
          "id":"3",
          "emailfrom":"Access Login",
          "emailto":"71 Stevenson Street, Suite 300",
          "subject":"San Francisco",
          "data":"Imported from Lighthouse(Main (LH))",
          "state":"California",
          "country":"United States",
        }
    ];
    this.rowData = lists;
    this.showTable = true;
  }
}