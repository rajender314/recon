import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ContactsService } from '@app/contacts/contacts.service';

import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { MatDialog } from '@angular/material';
import { AddAddressComponent } from '@app/contacts/add-address/add-address.component';
import { AddContactComponent } from '@app/contacts/add-contact/add-contact.component';
import { AddSubOrgComponent } from '@app/contacts/add-sub-org/add-sub-org.component';

import { DeleteComponent } from '@app/contacts/delete/delete.component';

import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { SnackBarType } from "@app/shared/utility/types";

import { FileUploader } from 'ng2-file-upload';

import * as _ from 'lodash';
import { UploaderComponent } from '@app/shared/components/uploader/uploader.component';
import { LicenseManager } from "ag-grid-enterprise";
import { MenuComponentComponent } from '@app/contacts/menu-component/menu-component.component';
import { AddDialogComponent } from '@app/contacts/add-dialog/add-dialog.component';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { ScrollToConfigOptions, ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';
import { AdminService } from '@app/admin/admin.service';
LicenseManager.setLicenseKey("Enterpi_Software_Solutions_Private_Limited_MultiApp_1Devs21_August_2019__MTU2NjM0MjAwMDAwMA==f0a6adf3f22452a5a3102029b1a87a43");

var APP: any = window['APP'];

@Component({
	selector: 'app-contact-details',
	templateUrl: './contact-details.component.html',
	styleUrls: ['./contact-details.component.scss']
})
export class ContactDetailsComponent implements OnInit {

	@ViewChild('orgName') inputEl: ElementRef;

	org_name = new FormControl('');
	showField: boolean = false;

	public dialogRef: any;
	public gridApi: any;
	no_equipments: boolean = false;
	public details = {
		showView: false,
		tabsList: [
			{ id: 1, name: "Overview", type: "overview", icon: "icon-overview", add: false, search: false, listView: false },
			{ id: 2, name: "Address", type: "address", icon: "icon-address-book", add: true, search: true, listView: true },
			{ id: 3, name: "Contacts", type: "contacts", icon: "icon-contact-book", add: true, search: true, listView: true, filter: true },
			{ id: 4, name: "Sub Organizations", type: "subOrgs", icon: "icon-sub-organisations", add: true, search: true, listView: true }
		],
		clientTabs: [
			{ id: 5, type: 'custom_attributes', name: "Custom Attributes", add: true, search: true, listView: false },
			{ id: 6, type: 'internal_invoice', name: "Internal Invoice", add: true, search: true, listView: false },
			{ id: 7, type: 'others', name: "Business Rules", add: false, search: false, listView: false }
		],
		vendorTabs: [
			{ id: 8, name: "General", add: false, search: false, listView: false },
			{ id: 9, type: 'vendor_capabilities', name: "Capabilities", listView: false, footer: false },
			{ id: 10, type: 'vendor_equipments', name: "Equipment", add: true, listView: false },
			{ id: 11, name: "Certifications", add: false, search: false, listView: false },
			//{ id: 12, name: "Others", listView: false }
		],
		overview: {
			colHeaders: ['Address Type', 'Address', 'City', 'State', 'Zip', 'Country', ''],
			columns: [],
			data: [],
			multiSelect: false,
			disableVisualSelection: false,
			stretchH: 'all'
		},
		address: {
			columnDefs: [],
			animateRows: false,
			groupSelectsChildren: true,
			rowSelection: 'multiple',
			icons: {
				groupExpanded: false,
				groupContracted: false
			},
			rowHeight: 40,
			headerHeight: 38,
			rowData: [],
			data: [],
			defaultColDef: {
				resizable: true
			},
			onGridReady: (params) => {
				this.gridApi = params.api;
				this.gridApi.sizeColumnsToFit();
			}
		},
		subOrgs: {
			columnDefs: [],
			animateRows: false,
			groupSelectsChildren: true,
			rowSelection: 'multiple',
			icons: {
				groupExpanded: false,
				groupContracted: false
			},
			rowHeight: 40,
			headerHeight: 38,
			rowData: [],
			data: [],
			defaultColDef: {
				resizable: true
			},
			onGridReady: (params) => {
				this.gridApi = params.api;
				this.gridApi.sizeColumnsToFit();
			},
			onCellClicked: (event) => {
				if (event.event.target.className == 'pixel-icons icon-arrow-right' || event.event.target.className == 'grid-to-page-link') {
					let row = this.details.settings['data'][event.rowIndex];
					this.router.navigate(['/organizations', row.id]);
					this.details.selectedTab = { id: 1, name: "Overview", type: "overview", icon: "icon-address-book", add: false, search: false, listView: false };
					this.getSelectedOrganization({ org_id: row.id });
				}
			}
		},
		contacts: {
			columnDefs: [],
			animateRows: false,
			groupSelectsChildren: true,
			rowSelection: 'multiple',
			icons: {
				groupExpanded: false,
				groupContracted: false
			},
			// rowHeight: 70,
			headerHeight: 38,
			getRowHeight: (params) => {
				return 62;
			},
			rowData: [],
			data: [],
			defaultColDef: {
				resizable: true
			},
			onGridReady: (params) => {
				this.gridApi = params.api;
				this.gridApi.sizeColumnsToFit();
			},
			onCellClicked: (event) => {
				if (event.column.colId == 'edit') {
					if (event.event.target.className == 'edit') {
						this.addRelatedTab(event.rowIndex);
					} else if (event.event.target.className == 'delete') {
						this.deleteRelatedTab(event.rowIndex);
					}
				}
			}
		},
		tabDetails: {
			id: '',
			key: '',
			showEdit: false,
			list: [],
			selected: {},
			modelValues: {}
		},
		organizations: [],
		totalOrganizations: [],
		organizationsList: [],
		flatOrgList: [],
		organizationsListSpinner: true,
		org_id: Number(this.route.snapshot.params.id),
		selectedOrganization: {},
		selectedTab: { id: 1, name: "Overview", type: "overview", icon: "icon-address-book", add: false, search: false, listView: false },
		showDetail: false,
		spinner: true,
		search: {
			placeHolder: "Search",
			value: ''
		},
		orgSearch: {
			placeHolder: "Search Organization",
			value: ''
		},
		contact_types: [],
		departments: [],
		subOrgsList: [],
		designations: [],
		address_types: [],
		users: [],
		orgSearchSpinner: true,
		settings: {
			data: []
		},
		page: 1,
		totalPages: 500,
		perPage: 25,
		addTabTitle: 'Add Address',
		addTitle: 'No Address',
		addImage: 'icons',
		orgDetails: {},
		dropdowns: {
			syncOptions: [
				{ id: 0, name: 'None', disabled: true },
				{ id: 1, name: 'User Defined 1', disabled: false },
				{ id: 2, name: 'User Defined 2', disabled: true },
				{ id: 3, name: 'User Defined 3', disabled: false },
				{ id: 4, name: 'User Defined 4', disabled: true },
				{ id: 5, name: 'User Defined 5', disabled: true },
				{ id: 6, name: 'User Defined 6', disabled: false }
			]
		}
	};

	sortOptions: any = {
		handle: '.handle',
		onUpdate: (event: any) => {
			let param = [];
			this.details.tabDetails.list.map((o, i) => {
				param.push({
					id: o.id,
					order_id: i + 1
				})
			});
			this.contactsService.saveApi('saveCustAttributes', { orders_ids: param, type: 'order' })
				.then(res => {
				})
		}
	}

	form: FormGroup;

	public hasDropZoneOver: boolean = false;
	public uploader: FileUploader = new FileUploader({
		url: 'upload',
		allowedMimeType: ['image/png', 'image/jpeg', 'image/jpg'],
		maxFileSize: 5 * 1024 * 1024,
		autoUpload: true,
		headers: [{ name: 'X-Auth-Token', value: APP.access_token }, { name: 'X-Jwt-Token', value: APP.j_token }]
	});

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private fb: FormBuilder,
		private contactsService: ContactsService,
		private snackbar: MatSnackBar,
		private dialog: MatDialog,
		private commonService: CommonService,
		private _scrollToService: ScrollToService,
		private adminService: AdminService
	) {
		this.contactsService.getOrganizationDetailCount().subscribe(obj => { this.details.orgDetails = obj; });
		this.commonService.onUpdate().subscribe((obj) => {
			if (obj.type == 'delete' && (obj.tab == 'subOrg' || obj.tab == 'contact')) {
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
			} else if (obj.type == 'change_shipping_address') {
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
			}
		});
		router.events.subscribe(val => {
			if (val instanceof NavigationEnd) {
				// this.getSelectedOrganization({ org_id: this.route.params['value'].id });
			}
		})
	}

	prefillOrg(val) {
		this.org_name.patchValue(val);
		setTimeout(() => {
			this.inputEl.nativeElement.focus();
		}, 20);
	}

	ngOnInit() {
		this.getTabDetails(this.details.selectedTab);
		this.getOrganizations(true);
		this.getOrganizationsList(() => {
			this.getOrgDetails();
			this.getContactsTab();
			this.getOrganizationsTab();
			this.getDropDownMaster();
		});
		this.createForm();
	}

	getAddressCols() {
		return [
			{ headerName: 'Address Type', field: 'address_type', cellClass: "ag-first-cell", headerClass: 'ag-header-first-cell' },
			{ headerName: 'Address', field: 'address1' },
			{ headerName: 'City', field: 'city' },
			{ headerName: 'State', field: 'state' },
			{ headerName: 'Zip', field: 'postal_code', cellClass: 'right-text-cell', headerClass: 'right-header-cell', },
			{ headerName: 'Country', field: 'country' },
			{
				headerName: '', field: 'edit',
				cellRendererFramework: MenuComponentComponent,
				type: 'address',
				org_id: Number(this.route.snapshot.params.id),
				address_types: this.details.address_types
			}
		];
	}

	getContactsCols() {
		return [
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
			},
			{
				headerName: '', field: 'edit',
				cellRendererFramework: MenuComponentComponent,
				type: 'contacts',
				org_id: Number(this.route.snapshot.params.id),
				contact_types: this.details.contact_types,
				departments: this.details.departments,
				designations: this.details.designations,
				subOrgsList: this.details.subOrgsList,
				org: this.details.selectedOrganization,
				orgDetails: this.details.orgDetails
			}
		];
	}

	getSubOrgCols() {
		return [
			{
				headerName: 'SUB ORGANIZATION NAME', field: 'name',
				cellRenderer: (event) => {
					return '<span class="grid-to-page-link">' + event.value + '<i class="pixel-icons icon-arrow-right" title="Go to Sub Organization"></i></span>';
				},
				cellClass: "first-column-cells",
				headerClass: 'ag-header-first-cell',
			},
			{ headerName: 'NO. OF CONTACTS', field: 'c_count', cellClass: 'right-text-cell', headerClass: 'right-header-cell', },
			{ headerName: 'NO. OF PROJECTS', field: 'jobs' },
			{
				headerName: '', field: 'edit',
				cellRendererFramework: MenuComponentComponent,
				type: 'sub_orgs',
				org_id: Number(this.route.snapshot.params.id),
				orgDetails: this.details.orgDetails
			}
		];
	}

	createForm() {
		this.form = this.fb.group({
			spec_ids: this.fb.array([]),
			defaults: this.fb.group({})
		});
	}

	getOrgDetails(): void {
		this.contactsService.getOrgDetails({ org_type: this.details.selectedOrganization['org_type'], org_id: this.details.org_id })
			.then(response => {
				if (response.result.success) {
					this.contactsService.setOrganizationDetailCount(response.result.data)
				}
			});
	}

	getDropDownMaster = () => {
		forkJoin(
			this.contactsService.getDropdownMaster({ org_type: this.details.selectedOrganization['org_type'] || 0, org_id: this.details.org_id }),
			this.adminService.getApi('getAllOrgs', { org_id: this.details.org_id })
		).subscribe(([response, response2]) => {
			if (response2.result.success) {
				this.details.subOrgsList = response2.result.data;
			}
			if (response.result.success) {
				this.details.address_types = response.result.data.address_types;
				this.details.contact_types = response.result.data.contact_types;
				this.details.departments = response.result.data.departments;
				this.details.designations = response.result.data.designations;
				// this.details.subOrgsList = response.result.data.subOrgsList;
				this.details.users = response.result.data.users;
				//this.contactsService.setDropdownMasterList(response.result.data);
				this.details.address.columnDefs = this.getAddressCols();
				this.details.contacts.columnDefs = this.getContactsCols();
				this.details.subOrgs.columnDefs = this.getSubOrgCols();
			}
		});
		// this.contactsService.getDropdownMaster({ org_type: 0, org_id: this.details.org_id }).then(response => {
		// 	if (response.result.success) {
		// 		this.details.address_types = response.result.data.address_types;
		// 		this.details.contact_types = response.result.data.contact_types;
		// 		this.details.departments = response.result.data.departments;
		// 		this.details.designations = response.result.data.designations;
		// 		// this.details.subOrgsList = response.result.data.subOrgsList;
		// 		this.details.users = response.result.data.users;
		// 		//this.contactsService.setDropdownMasterList(response.result.data);
		// 		this.details.address.columnDefs = this.getAddressCols();
		// 		this.details.contacts.columnDefs = this.getContactsCols();
		// 		this.details.subOrgs.columnDefs = this.getSubOrgCols();
		// 	}
		// });
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

	onListChange(list) {
		this.details.organizationsList = list;
	}

	getOrganizations(cb?): void {

		if (cb)
			this.details.orgSearchSpinner = true;

		this.contactsService.getOrganizations({
			org_type: 0,
			search: this.details.orgSearch.value,
			page: this.details.page,
			perPage: this.details.perPage,
			is_elastic: true
		}).then(response => {
			if (response.result.success) {
				this.details.orgSearchSpinner = false;
				if (cb)
					this.details.organizations = [];

				let data = response.result.data;
				data.map(res => {
					this.details.organizations.push(res);
				});

				// this.details.totalOrganizations = response.result.data;
				// this.details.organizations = this.details.totalOrganizations.slice(0, this.details.perPage);
				// this.details.totalPages = response.result.data.length;

				this.details.totalPages = response.result.data.count;
				this.details.totalOrganizations = response.result.data.list;
				this.details.organizations = this.details.organizations.concat(this.details.totalOrganizations);
				this.resetFlatOrgList()

			}
		});

	}

	appendOrganizations(): void {
		let data = this.details.totalOrganizations.slice(this.details.organizations.length, this.details.organizations.length + this.details.perPage)
		this.details.organizations = this.details.organizations.concat(data);
	}

	getOrganizationsList(cb?): void {
		this.contactsService.getOrganizations({
			org_type: 0,
			search: this.details.orgSearch.value,
			page: this.details.page,
			perPage: this.details.perPage,
			is_elastic: true
		}).then(response => {
			if (response.result.success) {
				this.details.organizationsList = response.result.data;
				this.details.flatOrgList = [];
				this.setOrgFlat(this.details.organizationsList, 0);
				this.getSelectedOrg();

				this.details.selectedOrganization = _.find(this.details.flatOrgList, { id: this.details.org_id });
				if (!this.details.selectedOrganization['status'])
					this.details.selectedOrganization['status'] = false;
				if (cb) cb();
				this.details.organizationsListSpinner = false;
			}
		});
	}

	getSelectedOrg() {
		this.commonService.getApi('orgInfo', {
			org_id: this.details.org_id
		})
		.then(res => {
			if (res['result'] && res['result'].success) {
			}
		});
	}

	resetFlatOrgList() {
		this.details.flatOrgList = [];
		this.setOrgFlat(this.details.organizations, 0);
		this.getSelectedOrg();
		
		this.details.selectedOrganization = _.find(this.details.flatOrgList, { id: this.details.org_id });
		if (!this.details.selectedOrganization['status'])
			this.details.selectedOrganization['status'] = false;
		this.details.organizationsListSpinner = false;
	}

	hideDetails(): void {
		this.details.showDetail = false;
	}

	changeOrganization(event: any): any {
		if (event.which == 13) {
			return false;
		}
	}

	goToParent(): void {
		this.router.navigate(['/organizations', this.details.selectedOrganization['parent_id']]);
		this.getSelectedOrganization({ org_id: this.details.selectedOrganization['parent_id'] });
	}

	setOrgFlat(data: any[], stage?: any): any {
		_.forEach(data, (value) => {
			let level = stage;
			value['level'] = level;
			this.details.flatOrgList.push(value);
			if (value.children && value.children.length) {
				level = level + 1;
				this.setOrgFlat(value.children, level);
			}
		});
	}

	getSelectedOrganization(data: any): void {
		this.details.org_id = data.org_id;

		this.details.selectedOrganization = _.find(this.details.flatOrgList, { id: this.details.org_id });

		if (!this.details.selectedOrganization['status'])
			this.details.selectedOrganization['status'] = false;
		this.getTabDetails(this.details.selectedTab);
		this.getOrgDetails();
	}

	getOrgTabDetails(tab: any): void {
		this.details.showDetail = true;
		this.details.selectedTab = tab;
	}

	onShowMore(val) {
		if (val) {
			const tab = _.find(this.details.tabsList, ['id', val]);
			if (tab) this.getTabDetails(tab);
		}
	}

	getTabDetails(tab: any): void {
		this.showField = false;
		this.details.showDetail = true;
		this.details.selectedTab = tab;
		this.details.spinner = true;

		this.resetTabDetails();

		switch (tab.id) {
			case 2:
				this.getAddressTab();
				break;
			case 3:
				this.getContactsTab();
				break;
			case 4:
				this.getOrganizationsTab();
				break;
			case 11:
				this.getCertificationsTab();
				break;
			case 5: // Custom Attributes
				this.getCustomAttributes();
				break;
			case 6: // Internal Invoice
				this.getInternalInvoice();
				break;
			//7,8

			case 9: // Vendor Capabilities
				this.getVendorCapabilities();
				break;
			case 10: // Vendor Equipments
				this.getVendorEquipments();
				break;
			default:
				this.details.spinner = false;
				break;
		}

	}

	changeMasterView() {
		this.details.showView = !this.details.showView;
	}

	searchList(search: string, event?: any): void {
		this.details.search.value = search;
		// this.getTabDetails(this.details.selectedTab);
		// this.getOrgDetails();
		switch (this.details.selectedTab.id) {
			case 2:
				// this.getAddressTab();
				this.gridApi.setQuickFilter(search);
				break;
			case 3:
				// this.getContactsTab();
				this.gridApi.setQuickFilter(search);
				break;
			case 4:
				// this.getOrganizationsTab();
				this.gridApi.setQuickFilter(search);
				break;
			case 11:
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
				break;
			case 5: // Custom Attributes
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
				break;
			case 6: // Internal Invoice
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
				break;
			//7,8

			case 9: // Vendor Capabilities
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
				break;
			case 10: // Vendor Equipments
				this.getTabDetails(this.details.selectedTab);
				this.getOrgDetails();
				break;
			default:
				this.details.spinner = false;
				break;
		}
	}

	searchOrgList(search: string, event?: any): void {
		this.details.page = 1;
		this.details.orgSearch.value = search;
		this.getOrganizations(true);
	}

	closeSearch(): void {
		this.details.orgSearch.value = '';
	}

	updateOrganization(): void {
		this.contactsService.addOrganization({
			id: this.details.selectedOrganization['id'],
			org_type: this.details.selectedOrganization['org_type'],
			name: this.details.selectedOrganization['name'],
			status: String(this.details.selectedOrganization['status'])
		}).then(response => {
			if (response.result.success) {
				this.openSnackBar({ status: 'success', msg: 'Organization Details Updated Successfully' });
			}
		});
	}

	editOrg(val: any, name: any): void {
		if (val != '' && this.details.selectedOrganization['name'].trim() != val.trim()) {
			this.contactsService.addOrganization({
				id: this.details.selectedOrganization['id'],
				org_type: this.details.selectedOrganization['org_type'],
				name: val,
				status: String(this.details.selectedOrganization['status'])
			}).then(response => {
				if (response.result.success) {
					this.openSnackBar({ status: 'success', msg: 'Organization Details Updated Successfully' });
					name = val;
					this.details.selectedOrganization['name'] = name;
					_.map(this.details.organizationsList, function (o) {
						if (o.id == this.details.org_id) {
							o.name = name;
						}
					}.bind(this));
				} else {
					val = name;
				}
			});
		}
	}

	onScroll(): void {
		if (this.details.organizations.length < this.details.totalPages && this.details.totalPages != 0) {
			// this.appendOrganizations();
			this.details.page++;
			this.getOrganizations(false);
		}
	}

	changeOrgStatus(): void {
		this.details.selectedOrganization['status'] = !this.details.selectedOrganization['status'];
		this.updateOrganization();
	}

	deleteRelatedTab(row?: any): void {
		let rowObj = {};
		switch (this.details.selectedTab.type) {
			case "address":
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
					rowObj = Object.assign(rowObj, this.details.settings['data'][row]);

				this.dialogRef = this.dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: rowObj['id'],
						org_id: this.details.org_id,
						title: 'Delete Address',
						name: rowObj['address1'],
						// call: 'deleteAddress',
						call: 'delOrgAddress'
					}
				});

				this.dialogRef.afterClosed().subscribe(result => {
					if (result && result.success) {
						this.openSnackBar({ status: 'success', msg: 'Address Deleted Successfully' });
						this.getTabDetails(this.details.selectedTab);
						this.getOrgDetails();
					}
				});
				break;
			case "contacts":
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
					rowObj = Object.assign(rowObj, this.details.settings['data'][row]);

				this.dialogRef = this.dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: rowObj['id'],
						org_id: this.details.org_id,
						title: 'Delete Contact',
						name: rowObj['first_name'],
						// call: 'deleteContact',
						call: 'delContact'
					}
				});

				this.dialogRef.afterClosed().subscribe(result => {
					if (result && result.success) {
						this.openSnackBar({ status: 'success', msg: 'Contact Deleted Successfully' });
						if (this.details.orgDetails['c_count'] > 0) {
							this.details.orgDetails['c_count'] = this.details.orgDetails['c_count'] - 1;
						}
						this.getTabDetails(this.details.selectedTab);
						this.getOrgDetails();
					}
				});
				break;
			case "subOrgs":
				rowObj = {
					name: '',
					id: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.details.settings['data'][row]);

				this.dialogRef = this.dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: rowObj['id'],
						org_id: this.details.org_id,
						title: 'Delete Sub Organization',
						name: rowObj['name'],
						// call: 'deleteSubOrg',
						call: 'delSubOrgs'
					}
				});

				this.dialogRef.afterClosed().subscribe(result => {
					if (result && result.success) {
						this.openSnackBar({ status: 'success', msg: 'Sub Organization Deleted Successfully' });
						if (this.details.orgDetails['sub_orgs'] > 0) {
							this.details.orgDetails['sub_orgs'] = this.details.orgDetails['sub_orgs'] - 1;
						}
						this.getTabDetails(this.details.selectedTab);
						this.getOrgDetails();
					}
				});
				break;

			case 'custom_attributes':
				this.dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: row['id'],
						org_id: this.details.org_id,
						title: 'Delete Custom Attribute',
						name: row['label'],
						call: 'delCustAttributes'
					}
				})
					.afterClosed()
					.subscribe(res => {
						if (res && res.success) {
							const indx = _.findIndex(this.details.tabDetails.list, { id: row['id'] });
							if (indx > -1) this.details.tabDetails.list.splice(indx, 1);

							this.openSnackBar({ status: 'success', msg: 'Custom Attribute Deleted Successfully' });
						}
					});

				break;
			case 'internal_invoice':
				this.dialog.open(DeleteComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						id: row['id'],
						org_id: this.details.org_id,
						title: 'Delete Internal Invoice',
						name: row['name'],
						call: 'deleteIntInv'
					}
				})
					.afterClosed()
					.subscribe(res => {
						if (res && res.success) {
							const indx = _.findIndex(this.details.tabDetails.list, { id: row['id'] });
							if (indx > -1) this.details.tabDetails.list.splice(indx, 1);

							this.openSnackBar({ status: 'success', msg: 'Internal Invoice Deleted Successfully' });
						}
					});

				break;
		}
	}

	uploadLogo(): void {
		this.dialogRef = this.dialog.open(UploaderComponent, {
			panelClass: ['recon-dialog', 'upload-img'],
			width: '500px',
			data: {
				title: "Upload Logo",
				id: this.details.selectedOrganization['id'],
				image: this.details.orgDetails['logo'],
				saveUrl: 'saveOrgLogo',
				removeUrl: 'delOrgLogo'
			}
		});
		this.dialogRef.afterClosed().subscribe(result => {
			if (result && result.success) {
				this.details.orgDetails['logo'] = result.data.filename;
			} else if (result && result.remove) {
				this.details.orgDetails['logo'] = '';
			}
		});
	}

	addRelatedTab(row?: any): void {
		let rowObj = {};
		const locals: any = {
			org_id: this.details.org_id,
			dropdowns: this.details.dropdowns,
			selectedRow: (row ? row : null)
		}
		if (row) this.details.tabDetails.selected = row;
		switch (this.details.selectedTab.type) {
			case "address":
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
					rowObj = Object.assign(rowObj, this.details.settings['data'][row]);

				if (this.details.address_types.length && rowObj['address_type_id'] == '') {
					rowObj['address_type_id'] = this.details.address_types[0].id;
				}
				let defaultShippingId = '';
				this.details.settings['data'].map((address) => {
					if (address.default_shipping == '1') {
						defaultShippingId = address.id;
					}
				});
				this.dialogRef = this.dialog.open(AddAddressComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						title: (rowObj['id'] == '') ? 'Add Address' : 'Edit Address',
						row: rowObj,
						org_id: this.details.org_id,
						defaultShippingId: defaultShippingId,
						address_types: this.details.address_types
					}
				});

				this.dialogRef.afterClosed().subscribe(result => {
					if (result && result.success) {
						if (rowObj['id'] == '') {
							this.openSnackBar({ status: 'success', msg: 'Address Added Successfully' });
						} else {
							this.openSnackBar({ status: 'success', msg: 'Address Updated Successfully' });
						}
						this.getTabDetails(this.details.selectedTab);
						this.getOrgDetails();
					}
				});
				break;
			case "contacts":
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
					rowObj = Object.assign(rowObj, this.details.settings['data'][row]);

				if (this.details.designations.length && rowObj['designations_id'] == '') {
					rowObj['designations_id'] = this.details.designations[0].id;
				}

				if (this.details.departments.length && rowObj['departments_id'] == '') {
					rowObj['departments_id'] = this.details.departments[0].id;
				}

				if (this.details.contact_types.length && rowObj['contact_types_id'] == '') {
					rowObj['contact_types_id'] = this.details.contact_types[0].id;
				}

				if (this.details.subOrgsList.length && rowObj['sub_orgs'] == '') {
					rowObj['sub_orgs'] = [this.details.subOrgsList[0].id];
				}

				this.dialogRef = this.dialog.open(AddContactComponent, {
					panelClass: 'recon-dialog',
					width: '600px',
					data: {
						title: (rowObj['id'] == '') ? 'Add Contact' : 'Edit Contact',
						row: rowObj,
						contact_types: this.details.contact_types,
						departments: this.details.departments,
						org_id: this.details.org_id,
						org_type: this.details.selectedOrganization['org_type'],
						designations: this.details.designations,
						subOrgsList: this.details.subOrgsList,
						timezones: [],
						org: this.details.selectedOrganization,
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
				});

				this.dialogRef.afterClosed().subscribe(result => {
					if (result && result.success) {
						if (rowObj['id'] == '') {
							this.openSnackBar({ status: 'success', msg: 'Contact Added Successfully' });
							this.details.orgDetails['c_count'] = this.details.orgDetails['c_count'] + 1;
						} else {
							this.openSnackBar({ status: 'success', msg: 'Contact Updated Successfully' });
						}
						this.getTabDetails(this.details.selectedTab);
						this.getOrgDetails();
					}
				});
				break;
			case "subOrgs":
				rowObj = {
					org_name: '',
					id: ''
				};
				if (row != undefined)
					rowObj = Object.assign(rowObj, this.details.settings['data'][row]);

				this.dialogRef = this.dialog.open(AddSubOrgComponent, {
					panelClass: 'recon-dialog',
					width: '500px',
					data: {
						title: (rowObj['id'] == '') ? 'Add Sub Organization' : 'Edit Sub Organization',
						org_id: this.details.org_id, row: rowObj
					}
				});

				this.dialogRef.afterClosed().subscribe(result => {
					if (result && result.success) {
						if (rowObj['id'] == '') {
							this.openSnackBar({ status: 'success', msg: 'Sub Organization Added Successfully' });
							this.details.orgDetails['sub_orgs'] = this.details.orgDetails['sub_orgs'] + 1;
						} else {
							this.openSnackBar({ status: 'success', msg: 'Sub Organization Updated Successfully' });
						}
						this.getTabDetails(this.details.selectedTab);
						this.getOrganizationsList();
						this.getOrgDetails();
					}
				});
				break;

			case 'custom_attributes':
				locals.title = 'Add Custom Attribute';
				locals.label = 'Custom Attribute';
				locals.formFields = [
					{ key: 'label', label: 'Label', type: 'text', validations: { required: true }, default: '' },
					{ key: 'ui_element_id', label: 'Type', type: 'select', multi: false, options: 'UIElements', default: '', isChange: true },
					{ key: 'value', label: 'Value', type: 'text', default: '' },
					{ key: 'description', label: 'Description', type: 'textarea', default: '' },
					{ key: 'settings', label: '', type: 'checkbox_grp', options: [{ key: 'print_in_estimate', label: 'Print in Estimate' }, { key: 'edit_in_job', label: 'Edit in Job' }], default: {} },
					{ key: 'sync', label: 'Sync with Accounting Software', type: 'select', options: 'syncOptions', default: '' }
				];
				locals.url = 'saveCustAttributes';
				locals.apiCalls = [
					{ key: 'UIElements', url: 'uielements', params: { status: true, custom_att: true } }
				],
					locals.order = this.details.tabDetails.list.length;
				break;
			case 'internal_invoice':
				locals.title = 'Add Internal Invoice';
				locals.label = 'Internal Invoice';
				locals.formFields = [
					{ key: 'cost_code_id', label: 'XR Code', type: 'select', validations: { required: true }, multi: false, options: 'XRCodes', default: '' },
					{ key: 'name', label: 'Title', type: 'text', validations: { required: true, maxlength: 64 }, default: '' },
					{ key: 'description', label: 'Description', type: 'textarea', default: '' }
				];
				locals.url = 'saveIntInvoice';
				locals.apiCalls = [
					{ key: 'XRCodes', url: 'getCostCodes', params: { status: true, search: 'XR' } }
				]
				break;

			case 'vendor_equipments':
				locals.title = 'Add Equipment';
				locals.label = 'Vendor Equipment';
				locals.formFields = [
					{ key: 'equip_ctg_id', label: 'Category', type: 'select', validations: { required: true }, multi: false, options: 'categories', default: '' },
					{ key: 'name', label: 'Name the Equipment', type: 'text', default: '' }
				];
				locals.url = 'saveOrgEquipSpec';
				locals.apiCalls = [
					{ key: 'categories', url: 'equipmentCategory', params: { status: true } }
				]
				break;
		}
		if (this.details.selectedTab.type == 'custom_attributes' || this.details.selectedTab.type == 'internal_invoice'
			|| this.details.selectedTab.type == 'vendor_equipments') {
			this.dialog.open(AddDialogComponent, {
				panelClass: 'recon-dialog',
				width: '600px',
				data: locals
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						if (row) {
							const indx = _.findIndex(this.details.tabDetails.list, { id: row['id'] });
							if (indx > -1) this.details.tabDetails.list[indx] = res.data;
						} else {
							this.details.tabDetails.list.push(res.data);
							if (!this.details.tabDetails.list.length) {
								this.no_equipments = true;
							}
							else {
								this.no_equipments = false;
							}
						}

						this.openSnackBar({ status: 'success', msg: locals.label + (row ? 'Updated' : 'Added') + ' Successfully' });
					}
				})
		}
	}

	selectedAction: string = 'All';
	filterAction(action) {
		if (typeof action == 'string') this.selectedAction = 'All';
		else if (action) this.selectedAction = 'Active';
		else this.selectedAction = 'Inactive';
		if (this.details.selectedTab.id == 3) {
			this.contactsService.getOrgContacts({
				search: this.details.search.value,
				org_type: this.details.selectedOrganization['org_type'],
				org_id: this.details.org_id,
				status: action,
				sub_org: true
			}).then(response => {
				this.details.spinner = false;
				if (response.result.success) {
					// this.details.settings['data'] = response.result.data;
					// this.details.settings['data'].map(function (value) {
					// 	value['edit'] = '...';
					// });
					// this.details.settings['rowData'] = response.result.data;
					// this.details.settings['rowData'].map(function (value) {
					// 	value['edit'] = '...';
					// });
					response.result.data.map(val => {
						val.edit = '---';
					})
					this.gridApi.setRowData(response.result.data);
				}
			});
		}
	}

	// here
	performAction(flag, indx) {
		let row = this.details.tabDetails.list[indx];
		if (flag == 'delete') {
			this.deleteRelatedTab(row);
		} else if (flag == 'edit') {
			this.addRelatedTab(row);
		}
	}

	getSyncLabel(id): string {
		const sync = _.find(this.details.dropdowns.syncOptions, ['id', id]);
		return sync.name;
	}


	getAddressTab(): void {
		this.details.settings = this.details[this.details.selectedTab.type];
		this.details.addTabTitle = "Add Address";
		this.details.addTitle = 'No Address',
			this.details.addImage = "icon-address-book",
			this.contactsService.getOrgAddress({
				search: this.details.search.value,
				org_type: this.details.selectedOrganization['org_type'],
				org_id: this.details.org_id
			}).then(response => {
				this.details.spinner = false;
				if (response.result.success) {
					this.details.settings['data'] = response.result.data;
					this.details.settings['data'].map(function (value) {
						value['edit'] = '...';
					});
					this.details.settings['rowData'] = response.result.data;
					this.details.settings['rowData'].map(function (value) {
						value['edit'] = '...';
					});
				}
			});
	}

	getContactsTab(): void {
		this.details.settings = this.details[this.details.selectedTab.type];
		this.details.addTabTitle = "Add Contact";
		this.details.addTitle = 'No Contact',
			this.details.addImage = "icon-contact-book",
			this.contactsService.getOrgContacts({
				search: this.details.search.value,
				org_type: this.details.selectedOrganization['org_type'],
				org_id: this.details.org_id,
				sub_org: true
			}).then(response => {
				this.details.spinner = false;
				if (response.result.success) {
					this.details.settings['data'] = response.result.data;
					this.details.settings['data'].map(function (value) {
						value['edit'] = '...';
					});
					this.details.settings['rowData'] = response.result.data;
					this.details.settings['rowData'].map(function (value) {
						value['edit'] = '...';
					});
				}
			});
	}

	getOrganizationsTab(): void {
		this.details.settings = this.details[this.details.selectedTab.type];
		this.details.addTabTitle = "Add Sub Organization";
		this.details.addTitle = 'No Sub Organization';
		this.details.addImage = "icon-sub-organisations",
			this.contactsService.getOrgSubOrgs({
				search: this.details.search.value,
				org_type: this.details.selectedOrganization['org_type'],
				parent_id: this.details.org_id,
				sub_org: true
			}).then(response => {
				this.details.spinner = false;
				if (response.result.success) {
					this.details.settings['data'] = response.result.data;
					this.details.settings['data'].map(function (value) {
						value['edit'] = '...';
					});
					this.details.settings['rowData'] = response.result.data;
					this.details.settings['rowData'].map(function (value) {
						value['edit'] = '...';
					});
				}
			});
	}

	getCertificationsTab(): void {
		this.details.spinner = false;
	}

	getCustomAttributes(): void {
		this.details.spinner = true;
		this.details.addTabTitle = 'Add Custom Attribute';
		this.details.addTitle = 'No Custom Attribute';
		this.contactsService.getApi('custAttributes', { org_id: this.details.org_id, search: this.details.search.value })
			.then(res => {
				this.details.spinner = false;
				if (res.result.success) {
					this.details.tabDetails.list = res.result.data.items;
				}
			})
	}

	getInternalInvoice(): void {
		this.details.spinner = true;
		this.details.addTabTitle = 'Add Internal Invoice';
		this.details.addTitle = 'No Internal Invoice',
			this.contactsService.getApi('internalInvoice', { org_id: this.details.org_id, search: this.details.search.value })
				.then(res => {
					this.details.spinner = false;
					if (res.result.success) {
						this.details.tabDetails.list = res.result.data.items;
					}
				})

	}

	getVendorCapabilities(): void {
		this.details.spinner = true;
		this.contactsService.getApi('masterCapbCatg', {})
			.then(res => {
				this.details.spinner = false;
				if (res.result.success) {
					this.details.tabDetails.list = res.result.data;
					this.getOrgCapabilities();
				}
			})
	}

	getVendorEquipments(): void {
		this.details.spinner = true;
		this.details.addTabTitle = 'Add Equipment';
		this.details.addTitle = 'No Equipment',
			this.contactsService.getApi('OrgEquipCtgSpec', { org_id: this.details.org_id })
				.then(res => {
					this.details.spinner = false;
					if (res.result.success) {
						if (!res.result.data.length) {
							this.no_equipments = true;
						}
						this.details.tabDetails.list = res.result.data;
					}
				})
	}

	getOrgCapabilities(): void {
		this.contactsService.getApi('orgCapabilities', { org_id: this.details.org_id })
			.then(res => {
				if (res.result.success) {
					if (res.result.data) {
						this.details.tabDetails = { ...this.details.tabDetails, ...res.result.data };
						// test case
						if (!this.details.tabDetails.selected) this.details.tabDetails.selected = {};
						if (!this.details.tabDetails['selected_copy']) this.details.tabDetails['selected_copy'] = {};
					} else {
						this.details.tabDetails.selected = {};
						this.details.tabDetails['selected_copy'] = {};
					}
				}
			})
	}

	triggerScroll(indx) {
		const config: ScrollToConfigOptions = {
			target: 'capb_' + indx
		};

		this._scrollToService.scrollTo(config);
	}

	closePrev(item) {
		const prev = _.find(this.details.tabDetails.list, ['isOpen', true]);
		if (prev && prev.id != item.id) delete prev.isOpen;
	}

	showChildren(obj, i): void {
		this.closePrev(obj);
		obj.isOpen = !obj.isOpen;
		setTimeout(() => {
			this.triggerScroll(i);
		}, 20);
		if (!this.details.tabDetails.modelValues[obj.id]) {
			this.details.tabDetails.modelValues[obj.id] = {};
			if (this.details.tabDetails.selected[obj.id])
				this.details.tabDetails.selected[obj.id].map(id => {
					this.details.tabDetails.modelValues[obj.id][id] = true;
				});
		}
	}

	onSelectCapability(parentId, capId): void {
		let selected: Array<any>;
		if (this.details.tabDetails.selected[parentId]) {
			selected = this.details.tabDetails.selected[parentId];
		} else {
			this.details.tabDetails.selected[parentId] = [];
			selected = this.details.tabDetails.selected[parentId];
		}
		const indx = selected.indexOf(capId);
		if (indx > -1) {
			selected.splice(indx, 1);
		} else {
			selected.push(capId);
		}
		/* test case */
		if (!this.details.tabDetails.selected[parentId].length) delete this.details.tabDetails.selected[parentId];
		if (Object.keys(this.details.tabDetails.selected).length) {
			// enable here
			this.details.selectedTab['footer'] = true;
		} else {
			// disable here
			this.details.selectedTab['footer'] = false;
		}
	}


	resetTabDetails() {
		this.no_equipments = false;
		this.details.tabDetails = {
			id: '',
			key: '',
			showEdit: false,
			list: [],
			selected: {},
			modelValues: {}
		};
	}

	saveApiCall(url, param, title): void {
		this.contactsService.saveApi(url, param)
			.then(res => {
				if (res.result.success) {
					this.openSnackBar({ status: 'success', msg: title + ' Updated Successfully' });
					this.details.tabDetails = { ...this.details.tabDetails, ...res.result.data };
					this.details.selectedTab['footer'] = false;
					this.details.tabDetails['showEdit'] = false;
				}
			})
	}


	save(): void {
		let param: any = {}, url: string = '', title: string = '';
		switch (this.details.selectedTab.type) {
			case 'vendor_capabilities':
				param = {
					org_id: this.details.org_id,
					id: this.details.tabDetails.id,
					selected: this.details.tabDetails.selected
				}, url = 'saveOrgCapability', title = 'Capabilities';
				break;
		}
		this.saveApiCall(url, param, title);
	}

	reset(): void {
		switch (this.details.selectedTab.type) {
			case 'vendor_capabilities':
				const keys = Object.keys(this.details.tabDetails.modelValues);
				keys.map(key => {
					this.details.tabDetails.modelValues[key] = {};
					if (this.details.tabDetails['selected_copy'][key])
						this.details.tabDetails['selected_copy'][key].map(id => {
							this.details.tabDetails.modelValues[key][id] = true;
						})
				});
				break;
		}
		this.details.selectedTab['footer'] = false;
	}

	afterUpdate(flag) {
		if (flag == 'update') {
			this.openSnackBar({ status: 'success', msg: 'Equipment Updated Successfully' });
		} else {
			this.openSnackBar({ status: 'success', msg: 'Equipment Deleted Successfully' });
		}
	}

	checkEqList(value) {
		this.no_equipments = value;
	}

}
