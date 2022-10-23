import { Pagination, SnackBarType } from "@app/shared/utility/types";
import { SortFilter, StatusFilter, Statuses, buildParam, StatusList } from "@app/shared/utility/dummyJson";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { SnackbarComponent } from "@app/shared/material/snackbar/snackbar.component";

import * as _ from 'lodash';
import { AddAdminDialogComponent } from "@app/admin/dialogs/add-admin-dialog/add-admin-dialog.component";
import { AdminDashboard, buildForm, updateForm, FormFieldType, AddDialogLocalType } from "@app/admin/admin.config";

var APP: any = window['APP'];

export class AdminInterface {

    statusBy = 'Active';
    sortBy: string = 'A-Z';
    param: Pagination = {
        page: 1,
        pageSize: 50,
        status: 'true',
        sort: 'asc'
    }
    showView: Boolean = false;
    isLoading: boolean = true;
    fetchingDetails: boolean = false;
    submitted: boolean = false;
    duplicateError: String = '';
    adminList: Array<any>;
    totalCount: number = 0;
    totalPages: number = 0;
    selectedDetails: any;

    adminForm: FormGroup;

    config: any = {};
    formFields: Array<FormFieldType> = [
        { key: 'id', label: 'ID', type: 'none', default: '' },
        { key: 'name', label: 'Name', type: 'text', validations: { required: true }, default: '' },
        { key: 'status', label: 'Status', type: 'select', multi: false, options: 'statusList', default: null },
        { key: 'description', label: 'Description', type: 'textarea', default: '' }
    ];
    addDialogFields: Array<FormFieldType> = [];

    public adminService;
    private snackbar;
    public fb: FormBuilder;
    public dialog;

    dropdowns: any = {
        sortFilter: SortFilter,
        statusFilter: StatusFilter,
        statusList: StatusList,
        status: Statuses
    }

    adminDashboard = AdminDashboard;
    promise: any;
    constructor(config, serviceName, formBuilder, snackbar, dialog?) {
        this.config = { ...this.config, ...config };
        this.adminService = serviceName;
        this.fb = formBuilder;
        this.snackbar = snackbar;
        this.dialog = dialog;
    }


    // getter
    get f() { return this.adminForm.controls; }

    getConfig = (fields) => {
        this.addDialogFields = [...this.addDialogFields, ...fields];
    }

    export = () => {
        if (this.config['export']) {
            let url = APP.api_url + this.config['export'] + '?' + buildParam(this.param) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;
            window.location.href = url;
        }
    }
    getList = (flag?, cb?) => {
        if (!flag) this.isLoading = true;
        this.adminService.getApi(this.config['get'], this.param)
            .then(res => {
                this.isLoading = false;
                if (res.result.success) {
                    this.totalCount = res.result.data.total;
                    if (this.param.page == 1) this.totalPages = Math.ceil(Number(this.totalCount) / this.param.pageSize);
                    if (flag == 'pagination') {
                        this.adminList = [...this.adminList, ...res.result.data[this.config['prop']]];

                    } else {

                        this.adminList = res.result.data[this.config['prop']];
                        if (cb) cb(res.result.data);
                        if (this.adminList.length) {
                            if (this.adminList[0].hasOwnProperty('children')) this.adminList[0].isOpen = true;
                            this.onSelectItem(this.adminList[0].hasOwnProperty('children') ? this.adminList[0].children[0] : this.adminList[0]);
                        } else this.selectedDetails = {};
                    }
                }
            })
    }

    createForm = (list?) => {
        if (list) this.formFields = [...this.formFields, ...list];
        this.adminForm = this.fb.group(buildForm(this.formFields))
    }

    setForm = data => {
        this.adminForm.patchValue(updateForm(this.formFields, data));
    }

    openAddDialog = (data?) => {
        let locals: AddDialogLocalType = {
            title: 'Add New ' + this.config['title'],
            label: this.config['title'],
            apiCall: this.config['save'],
            dropdowns: this.dropdowns,
            name: data ? data : '',
            flag: this.config.flag ? this.config.flag : '',
            formFields: this.addDialogFields
        }
        if (this.param.org_type) locals['org_type'] = this.param.org_type;
        this.dialog
            .open(AddAdminDialogComponent, {
                panelClass: 'recon-dialog',
                width: '600px',
                data: locals
            })
            .afterClosed()
            .subscribe(res => {
                if (res && res.success) {
                    const status = this.param.status ? this.param.status == 'true' : '';
                    this.openSnackBar({ status: 'success', msg: this.config['title'] + ' Added Successfully' });
                    this.param.page = 1;
                    this.getList();
                }
            })
    }

    changeMasterView = () => {
        this.showView = !this.showView;
    }

    onSelectItem = item => {
        this.duplicateError = '';
        this.selectedDetails = item;
        this.fetchingDetails = true;
        const url = this.config['details'] || this.config['get'];
        this.adminService.getApi(url, { id: item.id })
            .then(res => {
                this.fetchingDetails = false;
                if (res.result.success) {
                    this.selectedDetails = res.result.data[this.config['prop']][0];

                    this.setForm(this.selectedDetails);
                    this.adminForm.markAsPristine();
                }
            })
    }

    onSearch = val => {
        this.param.page = 1;
        if (val) this.param.search = val;
        else delete this.param.search;
        this.getList();
    }

    onApplyFilter = (prop, obj?) => {
        this.param.page = 1;
        if (prop == 'sort') {
            this.sortBy = this.sortBy == 'A-Z' ? 'Z-A' : 'A-Z';
            this.param[prop] = this.sortBy == 'A-Z' ? 'asc' : 'desc';
            this.getList();
        } else {
            if (obj.label != this.statusBy) {
                this.param[prop] = obj.value;
                if (obj.label == 'All') this.statusBy = '';
                else this.statusBy = obj.label;
                this.getList();
            }
        }
    }

    saveDetails = form => {
        let isParent: boolean = false;
        if (this.selectedDetails.hasOwnProperty('parent_id')) {
            isParent = true;
            form.value.parent_id = this.selectedDetails.parent_id;
        }
        this.submitted = true;
        this.duplicateError = '';
        if (form.valid) {
            this.submitted = false;
            if (!this.promise) {
                if (this.config['save'] == 'saveMiscExpenses') {
                    form.value = form.getRawValue();
                }
                this.promise = this.adminService.saveApi(this.config['save'], form.value)
                    .then(res => {
                        this.promise = undefined;
                        if (res.result.success) {
                            this.openSnackBar({ status: 'success', msg: this.config['title'] + ' Updated Successfully' });
                            let indx = _.findIndex(this.adminList, { id: isParent ? form.value.parent_id : form.value.id });
                            if (this.statusBy == '' || (JSON.parse(form.value.status) && this.statusBy == 'Active') || (!JSON.parse(form.value.status) && this.statusBy == 'Inactive')) {
                                if (!isParent) {
                                    this.adminList[indx] = { ...res.result.data };
                                } else {
                                    let itemIndx = _.findIndex(this.adminList[indx].children, { id: res.result.data.id });
                                    this.adminList[indx].children[itemIndx] = { ...res.result.data };
                                }
                                this.selectedDetails = { ...res.result.data };
                                this.adminForm.markAsPristine();
                            } else {
                                if (!isParent) {
                                    this.adminList.splice(indx, 1);
                                    if (this.adminList.length) this.onSelectItem(this.adminList[0]);
                                } else {
                                    let itemIndx = _.findIndex(this.adminList[indx].children, { id: res.result.data.id });
                                    this.adminList[indx].children.splice(itemIndx, 1);
                                    if (this.adminList[indx].children.length) this.onSelectItem(this.adminList[indx].children[0]);
                                }
                                setTimeout(() => {
                                    this.totalCount--;
                                }, 20);
                            }

                            form.patchValue(res.result.data);
                            form.markAsPristine();

                        } else {
                            this.duplicateError = res.result.data;
                        }
                    })
                    .catch(err => {
                        this.promise = undefined;
                    })
            }
        }
    }

    resetForm = data => {
        this.adminForm.reset(updateForm(this.formFields, data));
        this.adminForm.markAsPristine();
        this.submitted = false;
        this.duplicateError = '';
    }

    onScroll = () => {
        if (this.param.page < this.totalPages && this.totalPages != 0) {
            this.param.page++;
            this.getList('pagination')
        }
    }

    openSnackBar = (obj) => {
        let data: SnackBarType = {
            status: obj.status,
            msg: obj.msg
        }
        this.snackbar.openFromComponent(SnackbarComponent, {
            data: data,
            verticalPosition: 'top',
            horizontalPosition: 'right'
        })
    }

}
