import { Component, OnInit, Input } from '@angular/core';
import { AdminService } from '@app/admin/admin.service';
import { MatDialog } from '@angular/material';
import { AddAdminDialogComponent } from '@app/admin/dialogs/add-admin-dialog/add-admin-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { FormFieldType, AddDialogLocalType } from '@app/admin/admin.config';

@Component({
  selector: 'app-base-admin',
  templateUrl: './base-admin.component.html',
  styleUrls: ['./base-admin.component.scss']
})
export class BaseAdminComponent implements OnInit {

  @Input() config: any;

  inProgress: boolean = true;
  isLoading: boolean = true;
  showView: boolean = false;
  selectedListItem: any;
  search: string;

  params: any = {};
  dropdowns: any = {};

  addFormFields: Array<FormFieldType> = [
    { key: 'name', label: '', type: 'text', validations: { required: true }, default: '' },
    { key: 'status', label: 'Status', type: 'select', multi: false, options: 'statusList', default: true },
    { key: 'description', label: 'Description', type: 'textarea', default: '' }
  ];

  constructor(
    private activeRoute: ActivatedRoute,
    private adminService: AdminService,
    private dialog: MatDialog
  ) {
    if (activeRoute.snapshot.data)
      if (activeRoute.snapshot.data.config)
        this.config = activeRoute.snapshot.data.config;
  }

  ngOnInit() { }

  onListUpdate(obj) {
    this.inProgress = false;
    this.params = { ...obj.params };
    this.dropdowns = { ...obj.dropdowns };
  }

  changeMasterView = () => {
    this.showView = !this.showView;
  }

  onSelect(item) {
    if (item.type == 'spinner') {
      this.isLoading = item.data;
    } else {
      this.selectedListItem = item.data;
      this.isLoading = false;
      this.changeMasterView();
    }
  }

  onSearch(search) {
    this.search = search;
  }

  onAdd() {
    this.addFormFields[0].label = this.config.name + ' Name';
    let locals: AddDialogLocalType = {
      title: 'Add New ' + this.config['name'],
      label: this.config['name'],
      apiCall: this.config['save'],
      dropdowns: this.dropdowns,
      name: this.search ? this.search : '',
      formFields: this.addFormFields
    }
    if (this.params.org_type) locals['org_type'] = this.params.org_type;
    this.dialog
      .open(AddAdminDialogComponent, {
        panelClass: 'recon-dialog',
        width: '600px',
        data: locals
      })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          const status = this.params.status ? this.params.status == 'true' : '';
          const snackBar = { status: 'success', msg: this.config['name'] + ' Added Successfully' };
          this.adminService.update({ flag: 'add', item: res.data, status: status, snackBar: snackBar });
        }
      })
  }

  onUpdate(item) {
    if (item.type == 'reload') {
      this.adminService.update({ flag: 'reload', item: item });
    } else {
      this.onSelect(item);
      this.adminService.update({ flag: 'update', item: item });
    }
  }

}
