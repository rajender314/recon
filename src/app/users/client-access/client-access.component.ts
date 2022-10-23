import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { UsersService } from '@app/users/users.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import * as _ from 'lodash';
import { LicenseManager } from "ag-grid-enterprise";
import { ContactsService } from '@app/contacts/contacts.service';
import { Statuses } from '@app/shared/utility/dummyJson';
import { GridApi, GridOptions } from 'ag-grid-community';
LicenseManager.setLicenseKey("Enterpi_Software_Solutions_Private_Limited_MultiApp_1Devs21_August_2019__MTU2NjM0MjAwMDAwMA==f0a6adf3f22452a5a3102029b1a87a43");
var APP = window['APP'];
@Component({
  selector: 'app-client-access',
  templateUrl: './client-access.component.html',
  styleUrls: ['./client-access.component.scss']
})
export class ClientAccessComponent implements OnInit, OnChanges {

  @Input() organizations;
  @Input() id;
  @Input() getApi;
  @Input() saveApi;
  @Input() readonly;
  @Output() trigger = new EventEmitter<object>();

  public state = {
    organizations: [],
    cloneOrgs: [],
    org_id: '',
    selectedFilter: 'Active',
    statusFilter: [
      { label: 'All', value: '' },
      { label: 'Active', value: true },
      { label: 'Inactive', value: false }
    ],
    clientAccess: [],
    selectedIds: [],
    loader: false,
    getApi: 'getClientAccess',
    saveApi: 'saveClientAccess',
    gridView: 'all',
    gridViewList: [
      { value: 'all', label: 'All' },
      { value: 'selected', label: 'Selected' },
    ]
  };

  public columnDefs = [
    {
      headerName: 'All Orgs & Sub Orgs',
      field: 'name',
      /*width: 100, */
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        checkbox: (this.readonly) ? false : true,
        suppressCount: true
      },
      headerCheckboxSelection: (this.readonly) ? false : true
    }
  ];

  public gridApi: GridApi;

  public gridOptions: GridOptions = {
    columnDefs: this.columnDefs,
    animateRows: false,
    groupSelectsChildren: true,
    rowSelection: 'multiple',
		rowMultiSelectWithClick: true,
    icons: {
      groupExpanded: '<i class="pixel-icons icon-arrow-down" />',
      groupContracted: '<i class="pixel-icons icon-arrow-right" />'
    },
    localeText: { noRowsToShow: 'No Orgs/Sub Org Found' },
    rowHeight: 40,
    rowData: this.state.organizations,
    getNodeChildDetails: this.getNodeChildDetails,
    stopEditingWhenGridLosesFocus: true,
    suppressDragLeaveHidesColumns: true,
    defaultColDef: {
      resizable: true
    },
    onGridReady: (params) => {
      this.gridApi = params.api;
      this.gridApi.sizeColumnsToFit();
      setTimeout(() => {
        let ids = this.state.selectedIds;
        this.gridApi.forEachNodeAfterFilter((node) => {
          if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
            node.setSelected(true);
          }
        });
      }, 100);
    },
    onFilterChanged: params => {
      if (params.api.getDisplayedRowCount() == 0) {
        this.gridApi.showNoRowsOverlay();
      }
      else this.gridApi.hideOverlay();
    },
    onRowSelected: (params) => {
      if (params.node['selected']) {
        if (!this.state.selectedIds.includes(params.data.id)) {
          this.state.selectedIds.push(params.data.id)
        }
      } else {
        if (this.state.selectedIds.includes(params.data.id)) {
          this.state.selectedIds.splice(this.state.selectedIds.indexOf(params.data.id), 1);
        }
      }
    },
  };

  constructor(
    private usersService: UsersService,
    private snackbar: MatSnackBar,
    private contactsService: ContactsService
  ) { }

  ngOnInit() {
    this.getSelectedClientAccess();
  }

  onSearch(val) {
    this.gridApi.setQuickFilter(val);
  }

  setColumns() {
    this.gridOptions.columnDefs = [
      {
        headerName: 'All Orgs & Sub Orgs',
        field: 'name',
        /*width: 100, */
        cellRenderer: "agGroupCellRenderer",
        cellRendererParams: {
          checkbox: (this.readonly) ? false : true,
          suppressCount: true
        },
        headerCheckboxSelection: (this.readonly) ? false : true
      }
    ];
  }


  changeFilter(filter: any): void {
    if (filter.label != this.state.selectedFilter) {
      this.state.selectedFilter = filter.label;
      this.getClientAccess(filter.value);
    }
  }

  getClientAccess = (status = true) => {
    this.contactsService.getOrganizations({
      org_type: 2,
      status: status
    })
      .then(res => {
        if (res.result.success) {
          this.state.clientAccess = res.result.data;
          this.state.organizations = res.result.data;
          this.gridApi.setRowData(this.state.organizations);
          this.getSelectedClientAccess(() => {
            this.changeGrid(this.state.gridView);
          });
        }
      })
  }

  getSelectedClientAccess(cb?): void {
    this.usersService[this.state.getApi]({ id: this.state.org_id })
      .then(response => {
        if (response.result.success) {
          this.state.selectedIds = response.result.data;
          this.resetForm(false);
          if (cb) cb();
        }
      });
  }

  resetForm(flag = true): void {
    let ids = this.state.selectedIds;
    if (flag) {
      this.state.gridView = 'all';
      this.gridApi.setRowData(this.state.organizations);
    }
    this.gridApi.forEachNodeAfterFilter((node) => {
      if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
        node.setSelected(true);
      } else {
        node.setSelected(false);
      }
    });
  }

  saveSelectedClientAccess(): void {
    let selectedRows = this.state.selectedIds || [];
    // if (selectedRows && selectedRows.length) {
    this.usersService[this.state.saveApi]({ id: this.state.org_id, org_ids: selectedRows })
      .then(response => {
        if (response.result.success) {
          this.snackbar.openFromComponent(SnackbarComponent, {
            data: { status: 'success', msg: 'Client Access Updated Successfully' },
            verticalPosition: 'top',
            horizontalPosition: 'right'
          });
          this.state.selectedIds = response.result.data;
        }
      });
    // }
  }

  ngOnChanges() {
    if (this.organizations) {
      this.state.organizations = Object.assign([], this.organizations);
      this.gridOptions.rowData = this.state.organizations;
      this.state.cloneOrgs = _.cloneDeep([...this.state.organizations]);
    }
    if (this.id) {
      this.state.org_id = this.id;
    }
    if (this.getApi) {
      this.state.getApi = this.getApi;
    }
    if (this.saveApi) {
      this.state.saveApi = this.saveApi;
    }
    this.setColumns();
  }

  getNodeChildDetails(rowItem) {
    if (rowItem) {
      if (rowItem.children) {
        return {
          group: true,
          children: rowItem.children,
          expanded: true,
          key: rowItem.name
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  selectedOrgs() {
    this.gridApi.getSelectedNodes().map(o => {
      if (o.data.parent_id != 0) {
        if (o.parent.data.parent_id == 0) {
          if (this.selectedParent.indexOf(o.parent.data.id) == -1) {
            this.selectedParent.push(o.parent.data.id);
            const cloneDeep = _.cloneDeep(o.parent.data);
            cloneDeep.children = [o.data];
            this.framedJson.push(cloneDeep);
          } else {
            const row = _.find(this.framedJson, ['id', o.parent.data.id]);
            if (row)
              row.children.push(o.data);
          }
        } else {
          if (this.selectedChild.indexOf(o.parent.data.id) == -1) {
            this.selectedChild.push(o.parent.data.id);
            const cloneDeep = _.cloneDeep(o.parent.data);
            cloneDeep.children = [o.data];
            const parent = _.cloneDeep(_.find(this.state.cloneOrgs, ['id', o.parent.data.parent_id]));
            if (parent) {
              if (this.selectedParent.indexOf(o.parent.data.parent_id) == -1) {
                this.selectedParent.push(o.parent.data.parent_id);
                parent.children = [cloneDeep];
                this.framedJson.push(parent);
              } else {
                const global = _.find(this.framedJson, ['id', o.parent.data.parent_id]);
                if (global) global.children.push(cloneDeep);
              }
            }
          } else {
            const parent = _.find(this.framedJson, ['id', o.parent.data.parent_id]);
            if (parent) {
              const child = _.find(parent.children, ['id', o.parent.data.id]);
              if (child) child.children.push(o.data);
            }
          }

        }
      } else {
        this.framedJson.push(o.data);
      }
    });
  }

  framedJson = [];
  selectedChild = [];
  selectedParent = [];

  resetSelection() {
    this.framedJson = [];
    this.selectedChild = [];
    this.selectedParent = [];
  }

  changeGrid(flag) {
    const selected_ids = this.gridApi.getSelectedRows().map(o => o.id);
    this.resetSelection();
    if (flag == 'selected') {
      this.selectedOrgs();
      // const data = this.gridApi.getSelectedNodes().map(o => {
      //   if (o.parent) return o.parent.data; // this.frameParent(o.parent.data, o.data);
      //   else return o.data;
      // });
      // this.gridApi.setRowData(data);
      this.gridApi.setRowData(this.framedJson);
      this.defaultCheck(selected_ids);
    } else if (flag == 'all') {
      this.gridApi.setRowData(this.state.organizations);
      this.defaultCheck(selected_ids);
    } else { }
  }

  defaultCheck(selectedIds?) {
    let ids = selectedIds ? selectedIds : this.state.selectedIds;
    setTimeout(() => {
      this.gridApi.forEachNodeAfterFilter((node) => {
        if (node.data && node.data.id && ids.indexOf(node.data.id) > -1) {
          node.setSelected(true);
        } else {
          node.setSelected(false);
        }
      });
    }, 100);
  }
}
