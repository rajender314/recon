import { Component, OnInit, OnDestroy } from '@angular/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '@app/contacts/contacts.service';
import { MenuComponentComponent } from '@app/contacts/menu-component/menu-component.component';
import { forkJoin, Subscription } from 'rxjs';
import { AddAddressComponent } from '@app/contacts/add-address/add-address.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { SnackBarType } from '@app/shared/utility/types';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { AddContactComponent } from '@app/contacts/add-contact/add-contact.component';
import { AddSubOrgComponent } from '@app/contacts/add-sub-org/add-sub-org.component';
import { DeleteComponent } from '@app/contacts/delete/delete.component';

var APP: any = window['APP'];

@Component({
	selector: 'app-grid',
	templateUrl: './grid.component.html',
	styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit, OnDestroy {

	state = {
		loader: false,
		editable: false,
		org_id: null,
		selectedTab: null,
		selected: null,
		search: '',
		orgDetails: null,
		tabDetails: {
			list: [],
			selected: null
		},
		dropdowns: {
			address_types: [],
			contact_types: [],
			departments: [],
			designations: [],
			subOrgsList: [],
			users: []
		}
	}

	gridApi: GridApi;
	gridOptions: GridOptions = {
		columnDefs: [],
		animateRows: true,
		rowSelection: 'multiple',
		icons: {
			groupExpanded: false,
			groupContracted: false
		},
		rowHeight: 40,
		headerHeight: 38,
		rowData: [],
		defaultColDef: {
			resizable: true
		},
		getRowHeight: params => {
			if (this.state.selectedTab == 3) return 62;
			else return 40;
		},
		onGridReady: params => {
			this.gridApi = params.api;
			this.gridApi.setRowData(this.state.tabDetails.list);
			this.gridApi.sizeColumnsToFit();
		},
		onCellClicked: event => {
			if (this.state.selectedTab == 3) {
				if (event.column['colId'] == 'edit') {
					if (event.event.target['className'] == 'edit') {
						this.addRelatedTab(event.rowIndex);
					} else if (event.event.target['className'] == 'delete') {
						this.deleteRelatedTab(event.rowIndex);
					}
				}
			} else if (this.state.selectedTab == 4) {
				if (event.event.target['className'] == 'pixel-icons icon-arrow-right' || event.event.target['className'] == 'grid-to-page-link') {
					let row = this.state.tabDetails.list[event.rowIndex];
					this._router.navigate(['/organizations', row.id]);
					// this.details.selectedTab = { id: 1, name: "Overview", type: "overview", icon: "icon-address-book", add: false, search: false, listView: false };
					// this.getSelectedOrganization({ org_id: row.id });
				}
			}
		}
	}

	clientInfoSubscription: Subscription;

	constructor(
		private _dialog: MatDialog,
		private _snackbar: MatSnackBar,
		private _contactService: ContactsService,
		private _router: Router,
		private _activeRoute: ActivatedRoute
	) {
		this.state.selectedTab = this._activeRoute.snapshot.data.tabIndex;
		this.state.org_id = this._activeRoute.parent.snapshot.params.id ? Number(this._activeRoute.parent.snapshot.params.id) : null;
		this.clientInfoSubscription = _contactService.onUpdate().subscribe(ev => {
			if (ev.type == 'add')
				this.addRelatedTab();
			else if (ev.type == 'search') {
				this.state.search = ev.data || '';
				this.gridApi.setQuickFilter(this.state.search);
			} else if (ev.type == 'filter') {
				if (this.state.selectedTab == 3) this.filterAction(ev.data);
			}
		})
	}

	ngOnInit() {
		this.state.loader = true;
		this.noData();
		this.state.selected = this._contactService.getOrganization();
		this.state.orgDetails = this._contactService.getOrganizationDetailCount();
		// IF current route is a client
		if (this.state.selected.org_type == 2) {
			this.state.editable = APP.permissions.system_access.client == 'edit';
		} else if (this.state.selected.org_type == 3) {
			// IF current route is a vendor
			this.state.editable = APP.permissions.system_access.vendor == 'edit';
		}
		this.getMasterData(() => {
			this.getTabDetails();
		})
	}

	ngOnDestroy() {
		this.clientInfoSubscription.unsubscribe();
	}

	getMasterData(cb?) {
		forkJoin(
			this._contactService.getApi('getAllOrgs', { org_id: this.state.org_id }),
			this._contactService.getDropdownMaster({ org_type: this.state.selected.org_type, org_id: this.state.org_id })
		)
			.subscribe(res => {
				if (res[0].result.success)
					this.state.dropdowns.subOrgsList = res[0].result.data || [];
				this.state.dropdowns = { ...this.state.dropdowns, ...res[1].result.data };
				if (res[1].result.success)
					this.state.dropdowns = { ...this.state.dropdowns, ...res[1].result.data };
			})
		this._contactService.getDropdownMaster({ org_type: this.state.selected.org_type, org_id: this.state.org_id })
			.then(res => {
				if (res.result.success) {
					this.state.dropdowns = { ...this.state.dropdowns, ...res.result.data };
					if (cb) cb();
				}
			})
	}

	noData(bol = false) {
		this._contactService.update({ type: 'no-data', data: bol });
	}

	getAddressCols() {
		const array = [
			{ headerName: 'Address Type', field: 'address_type', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
			{ headerName: 'Address', field: 'address1' },
			{ headerName: 'City', field: 'city' },
			{ headerName: 'State', field: 'state' },
			{ headerName: 'Zip', field: 'postal_code', cellClass: 'right-text-cell', headerClass: 'right-header-cell', },
			{ headerName: 'Country', field: 'country' }
		];
		if (this.state.editable) {
			let edit = {
				headerName: '', field: 'edit',
				cellRendererFramework: MenuComponentComponent,
				type: 'address',
				org_id: Number(this._activeRoute.parent.snapshot.params.id),
				address_types: this.state.dropdowns.address_types || []
			};
			array.push(edit);
		}
		return array;
	}

	getContactsCols() {
		const array = [
			{
				headerName: 'NAME', field: 'fullname',
				cellRenderer: (event) => {
					return '<div class="user-icon"><span></span></div>' + '<div class="user-details">' + '<span>' + event.value + '</span>' + '<span>' + event.data.primary_email + '</span>' + '</div>'
				},
				cellClass: 'user-icon-wrapper first-column-cells',
				headerClass: 'ag-header-first-cell',
				autoHeight: true,
				minWidth: 300,
			},
			{ headerName: 'DESIGNATION', field: 'designation_name', autoHeight: true },
			{ headerName: 'DEPARTMENT', field: 'department_name', autoHeight: true },
			{ headerName: 'CONTACT TYPE', field: 'contact_type', autoHeight: true },
			{ headerName: 'PRIMARY EMAIL', field: 'primary_email', autoHeight: true },
			{
				headerName: 'SUB ORGS', field: 'sub_orgs', cellClass: 'right-text-cell', headerClass: 'right-header-cell', autoHeight: true, cellRenderer: (params) => {
					return params.value.length;
				},
			}
		] as any;
		if (this.state.editable) {
			let edit = {
				headerName: '', field: 'edit',
				cellRendererFramework: MenuComponentComponent,
				type: 'contacts',
				org_id: Number(this._activeRoute.parent.snapshot.params.id),
				contact_types: this.state.dropdowns.contact_types,
				departments: this.state.dropdowns.departments,
				designations: this.state.dropdowns.designations,
				subOrgsList: this.state.dropdowns.subOrgsList,
				org: this.state.selected,
				orgDetails: this.state.orgDetails
			};
			array.push(edit);
		}
		return array;
	}

	getSubOrgCols() {
		const array = [
			{
				headerName: 'SUB ORGANIZATION NAME', field: 'name',
				cellRenderer: (event) => {
					return '<span class="grid-to-page-link">' + event.value + '<i class="pixel-icons icon-arrow-right" title="Go to Sub Organization"></i></span>';
				},
				cellClass: "first-column-cells",
				headerClass: 'ag-header-first-cell',
			},
			{ headerName: 'NO. OF CONTACTS', field: 'c_count', cellClass: 'right-text-cell', headerClass: 'right-header-cell', },
			{ headerName: 'NO. OF JOBS', field: 'jobs_count' }
		];
		if (this.state.editable) {
			let edit = {
				headerName: '', field: 'edit',
				cellRendererFramework: MenuComponentComponent,
				type: 'sub_orgs',
				org_id: Number(this._activeRoute.parent.snapshot.params.id),
				orgDetails: this.state.orgDetails
			};
			array.push(edit);
		}
		return array;
	}

	getTabDetails() {
		switch (this.state.selectedTab) {
			case 2:
				this.gridOptions.columnDefs = this.getAddressCols();
				this.getAddressList();
				this.gridOptions.getRowClass = function (params) {
					if (params.data && params.data.default_shipping == "1") {
						return 'row-color';
					}
				}
				break;

			case 3:
				this.gridOptions.columnDefs = this.getContactsCols();
				this.getContactsTab();
				this.gridOptions.getRowClass = function (params) {
					return '';
				}
				break;

			case 4:
				this.gridOptions.columnDefs = this.getSubOrgCols();
				this.getOrganizationsTab();
				this.gridOptions.getRowClass = function (params) {
					return '';
				}
				break;

			default:
				break;
		}
	}

	getAddressList() {
		this.state.loader = true;
		this._contactService.getOrgAddress({ search: this.state.search, org_type: this.state.selected.org_type, org_id: this.state.org_id })
			.then(res => {
				this.state.loader = false;
				this.state.tabDetails.list = res.result.data || [];
				this.state.tabDetails.list.map(o => {
					o.edit = '---';
				});
				if (!this.state.tabDetails.list.length) this.noData(true);
				else this.noData(false);
			})
	}

	getContactsTab() {
		this.state.loader = true;
		this._contactService.getOrgContacts({ search: this.state.search, org_type: this.state.selected.org_type, org_id: this.state.org_id, sub_org: true })
			.then(res => {
				this.state.loader = false;
				this.state.tabDetails.list = res.result.data || [];
				this.state.tabDetails.list.map(o => {
					o.edit = '---';
				});
				if (!this.state.tabDetails.list.length) this.noData(true);
				else this.noData(false);
			})
	}

	getOrganizationsTab() {
		this.state.loader = true;
		this._contactService.getOrgSubOrgs({ search: this.state.search, org_type: this.state.selected.org_type, parent_id: this.state.org_id, sub_org: true })
			.then(res => {
				this.state.loader = false;
				this.state.tabDetails.list = res.result.data || [];
				this.state.tabDetails.list.map(o => {
					o.edit = '---';
				});
				if (!this.state.tabDetails.list.length) this.noData(true);
				else this.noData(false);
			})
	}

	addRelatedTab(row?: any) {
		let rowObj = {};
		if (row) this.state.tabDetails.selected = row;
		switch (this.state.selectedTab) {
			case 2:
				rowObj = {
					id: '',
					address1: '',
					address2: '',
					city: '',
					country_id: '255',
					state_id: '',
					postal_code: '',
					default_shipping: '0',
					address_type_id: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.state.tabDetails.list[row]);

				if (this.state.dropdowns.address_types.length && rowObj['address_type_id'] == '') {
					rowObj['address_type_id'] = this.state.dropdowns.address_types[0].id;
				}
				let defaultShippingId = '';
				this.state.tabDetails.list.map((address) => {
					if (address.default_shipping == '1') {
						defaultShippingId = address.id;
					}
				});
				this._dialog.open(AddAddressComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						title: (rowObj['id'] == '') ? 'Add Address' : 'Edit Address',
						row: rowObj,
						org_id: this.state.org_id,
						defaultShippingId: defaultShippingId,
						address_types: this.state.dropdowns.address_types
					}
				})
					.afterClosed()
					.subscribe(result => {
						if (result && result.success) {
							if (rowObj['id'] == '') {
								this.openSnackBar({ status: 'success', msg: 'Address Added Successfully' });
							} else {
								this.openSnackBar({ status: 'success', msg: 'Address Updated Successfully' });
							}
							this.getTabDetails();
							// this.getOrgDetails();
						}
					});
				break;
			case 3:
				rowObj = {
					id: '',
					first_name: '',
					last_name: '',
					designations_id: '',
					departments_id: '',
					contact_type: '',
					contact_types_id: '',
					primary_email: '',
					sub_orgs: [],
					emails: [],
					phone_numbers: [],
					timezone: '',
					parent_org: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.state.tabDetails.list[row]);

				if (this.state.dropdowns.designations.length && rowObj['designations_id'] == '') {
					rowObj['designations_id'] = this.state.dropdowns.designations[0].id;
				}

				if (this.state.dropdowns.departments.length && rowObj['departments_id'] == '') {
					rowObj['departments_id'] = this.state.dropdowns.departments[0].id;
				}

				if (this.state.dropdowns.contact_types.length && rowObj['contact_types_id'] == '') {
					rowObj['contact_types_id'] = this.state.dropdowns.contact_types[0].id;
				}

				if (this.state.dropdowns.subOrgsList.length && rowObj['sub_orgs'] == '') {
					rowObj['sub_orgs'] = [this.state.dropdowns.subOrgsList[0].id];
				}

				this._dialog.open(AddContactComponent, {
					panelClass: 'recon-dialog',
					width: '600px',
					data: {
						title: (rowObj['id'] == '') ? 'Add Contact' : 'Edit Contact',
						row: rowObj,
						contact_types: this.state.dropdowns.contact_types,
						departments: this.state.dropdowns.departments,
						org_id: this.state.org_id,
						org_type: this.state.selected.org_type,
						designations: this.state.dropdowns.designations,
						subOrgsList: this.state.dropdowns.subOrgsList,
						timezones: [],
						org: this.state.selected,
						emailAddressTypes: [
							{ id: "Email", name: "Email" },
							{ id: "Work", name: "Work" }
						],
						phoneNumberTypes: [
							{ id: "Phone", name: "Phone" },
							{ id: "Fax", name: "Fax" },
							{ id: "Mobile", name: "Mobile" }
						]
					}
				})

					.afterClosed().subscribe(result => {
						if (result && result.success) {
							if (rowObj['id'] == '') {
								this.openSnackBar({ status: 'success', msg: 'Contact Added Successfully' });
								this.state.orgDetails['c_count'] = this.state.orgDetails['c_count'] + 1;
							} else {
								this.openSnackBar({ status: 'success', msg: 'Contact Updated Successfully' });
							}
							this.getTabDetails();
							// this.getOrgDetails();
						}
					});
				break;
			case 4:
				rowObj = {
					org_name: '',
					id: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.state.tabDetails.list[row]);

				this._dialog.open(AddSubOrgComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						title: (rowObj['id'] == '') ? 'Add Sub Organization' : 'Edit Sub Organization',
						org_id: this.state.org_id, row: rowObj
					}
				})
					.afterClosed()
					.subscribe(result => {
						if (result && result.success) {
							if (rowObj['id'] == '') {
								this.openSnackBar({ status: 'success', msg: 'Sub Organization Added Successfully' });
								this.state.orgDetails['sub_orgs'] = this.state.orgDetails['sub_orgs'] + 1;
							} else {
								this.openSnackBar({ status: 'success', msg: 'Sub Organization Updated Successfully' });
							}
							this.getTabDetails();
							// this.getOrganizationsList();
							// this.getOrgDetails();
						}
					});
				break;
		}
	}

	filterAction(action) {
		this._contactService.getOrgContacts({
			search: this.state.search,
			org_type: this.state.selected.org_type,
			org_id: this.state.org_id,
			status: action,
			sub_org: true
		}).then(res => {
			if (res.result.success) {
				this.state.tabDetails.list = res.result.data || [];
				this.state.tabDetails.list.map(o => {
					o.edit = '---';
				});
				this.gridApi.setRowData(this.state.tabDetails.list);
			}

		});
	}

	deleteRelatedTab(row?: any): void {
		let rowObj = {};
		switch (this.state.selectedTab) {
			case 2:
				rowObj = {
					id: '',
					address1: '',
					address2: '',
					city: '',
					country_id: '255',
					state_id: '',
					postal_code: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.state.tabDetails.list[row]);

				this._dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: rowObj['id'],
						org_id: this.state.org_id,
						title: 'Delete Address',
						name: rowObj['address1'],
						call: 'delOrgAddress'
					}
				})
					.afterClosed()
					.subscribe(result => {
						if (result && result.success) {
							this.openSnackBar({ status: 'success', msg: 'Address Deleted Successfully' });
							this.getTabDetails();
							// this.getOrgDetails();
						}
					});
				break;
			case 3:
				rowObj = {
					id: '',
					first_name: '',
					last_name: '',
					designation_id: '',
					departments_id: '',
					contact_type: '',
					primary_email: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.state.tabDetails.list[row]);

				this._dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: rowObj['id'],
						org_id: this.state.org_id,
						title: 'Delete Contact',
						name: rowObj['first_name'],
						call: 'delContact'
					}
				})
					.afterClosed()
					.subscribe(result => {
						if (result && result.success) {
							this.openSnackBar({ status: 'success', msg: 'Contact Deleted Successfully' });
							if (this.state.orgDetails['c_count'] > 0) {
								this.state.orgDetails['c_count'] = this.state.orgDetails['c_count'] - 1;
							}
							this.getTabDetails();
							// this.getOrgDetails();
						}
					});
				break;
			case 4:
				rowObj = {
					name: '',
					id: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.state.tabDetails.list[row]);

				this._dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: rowObj['id'],
						org_id: this.state.org_id,
						title: 'Delete Sub Organization',
						name: rowObj['name'],
						call: 'delSubOrgs'
					}
				})
					.afterClosed()
					.subscribe(result => {
						if (result && result.success) {
							this.openSnackBar({ status: 'success', msg: 'Sub Organization Deleted Successfully' });
							if (this.state.orgDetails['sub_orgs'] > 0) {
								this.state.orgDetails['sub_orgs'] = this.state.orgDetails['sub_orgs'] - 1;
							}
							this.getTabDetails();
							// this.getOrgDetails();
						}
					});
				break;
		}
	}

	openSnackBar = (obj) => {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this._snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

}
