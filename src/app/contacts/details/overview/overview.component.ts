import { Component, OnInit, ViewChildren, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '@app/contacts/contacts.service';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { StatusList } from '@app/shared/utility/dummyJson';

import * as _ from 'lodash';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { MatSnackBar, MatDialog } from '@angular/material';
import { DeleteWebsiteComponent } from '@app/contacts/delete-website/delete-website.component';
import { SnackBarType } from '@app/shared/utility/types';
import { Subscription } from 'rxjs';

var APP: any = window['APP'];

@Component({
	selector: 'app-overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy {

	state = {
		loader: true,
		selected: null,
		editable: false,
		statusEditable: false,
		details: {
			client: [],
			overview_info: null,
			vendor: null,
			website: []
		},
		status: StatusList,

		contacts: {
			loader: false,
			list: []
		},

		subOrgs: {
			loader: false,
			list: []
		},

		websiteError: []
	}

	@ViewChildren('website') websiteElement;
	@ViewChild('orgName') inputEl: ElementRef;
	org_name = new FormControl('');
	public websitesForm: FormGroup;
	public websitePattern = /^(((ht|f)tp(s?))\:\/\/)?(w{3}\.|[a-z]+\.)([A-z0-9_-]+)(\.[a-z]{2,6}){1,2}(\/[a-z0-9_]+)*$/;///^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
	overviewSubscription: Subscription;

	constructor(
		private _fb: FormBuilder,
		private _snackbar: MatSnackBar,
		private _dialog: MatDialog,
		private _route: Router,
		private _activeRouter: ActivatedRoute,
		private _contactService: ContactsService
	) {
		this.overviewSubscription = this._contactService.onUpdate().subscribe(ev => {
			if (ev.type == 'organization') {
				this.state.selected = ev.data;
				if (this.state.selected) {
					this.getOverviewDetails();
					this.getContacts();
					this.getSubOrgs();
				}
			}
		})
	}

	ngOnInit() {
		this.noData();
		this.state.selected = this._contactService.getOrganization();
		if (this.state.selected) {
			// IF current route is a client
			if (this.state.selected.org_type == 2) {
				this.state.editable = APP.permissions.system_access.client == 'edit';
				this.state.statusEditable = APP.permissions.system_access.inactivate_a_client == 'yes';
			} else if (this.state.selected.org_type == 3) {
				// IF current route is a vendor
				this.state.editable = APP.permissions.system_access.vendor == 'edit';
				this.state.statusEditable = APP.permissions.system_access.vendor == 'edit';
			}
			this.getOverviewDetails();
			this.getContacts();
			this.getSubOrgs();
		}
	}

	ngOnDestroy() {
		this.overviewSubscription.unsubscribe();
	}

	noData(bol = false) {
		this._contactService.update({ type: 'no-data', data: bol });
	}

	// getter
	get websitesArray() {
		return this.websitesForm.get('website') as FormArray;
	}

	changeRoute(route) {
		this._route.navigate([route], { relativeTo: this._activeRouter.parent });
	}

	prefillOrg(val) {
		this.org_name.patchValue(val);
		setTimeout(() => {
			this.inputEl.nativeElement.focus();
		}, 20);
	}

	editOrg(val: any, name: any): void {
		if (val != '' && this.state.selected['name'].trim() != val.trim()) {
			this._contactService.addOrganization({
				id: this.state.selected['id'],
				org_type: this.state.selected['org_type'],
				name: val,
				status: String(this.state.selected['status'])
			}).then(response => {
				if (response.result.success) {
					this.openSnackBar({ status: 'success', msg: 'Organization Details Updated Successfully' });
					name = val;
					this.state.selected['name'] = name;
					// _.map(this.list, function (o) {
					// 	if (o.id == this.route.snapshot.params.id) {
					// 		o.name = name;
					// 	}
					// }.bind(this));
					// this.listChange.emit(this.list);
				} else {
					val = name;
				}
			});
		}
	}

	cancelOrgEdit(): void {
		this.org_name.patchValue(this.state.selected['name']);
	}

	changeOrgStatus() {
		this.state.selected['status'] = !this.state.selected['status'];
		this._contactService.addOrganization({
			id: this.state.selected['id'],
			org_type: this.state.selected['org_type'],
			name: this.state.selected['name'],
			status: String(this.state.selected['status'])
		}).then(response => {
			if (response.result.success) {
				this.openSnackBar({ status: 'success', msg: 'Organization Details Updated Successfully' });
				this.state.selected['status'] = this.state.selected['status'];
				// _.map(this.list, function (o) {
				//   if (o.id == this.route.snapshot.params.id) {
				//     o.status = this.state.selected['status'];
				//   }
				// }.bind(this));
				// this.listChange.emit(this.list);
			}
		});
	}

	getOverviewDetails() {
		this.state.loader = true;
		this._contactService.getOverviewData({ org_id: this._activeRouter.parent.snapshot.params.id, org_type: this.state.selected.org_type })
			.then(response => {
				if (response.result.success) {
					this.state.details = { ...this.state.details, ...response.result.data };
					if (!this.state.details.website.length) {
						this.state.details.website.push({ id: 1, website: "", websiteValidate: false })
					}
					this.createForm();
					this.state.loader = false;
				}
			});
	}

	getContacts(): void {
		this.state.contacts.loader = true;
		this._contactService.getOrgContacts({ org_id: this._activeRouter.parent.snapshot.params.id, org_type: this.state.selected.org_type, sub_org: true })
			.then(response => {
				this.state.contacts.loader = false;
				if (response.result.success) {
					this.state.contacts.list = response.result.data || [];

				}
			});
	}

	getSubOrgs(): void {
		this.state.subOrgs.loader = true;
		this._contactService.getOrgSubOrgs({ parent_id: this._activeRouter.parent.snapshot.params.id, org_type: this.state.selected.org_type, sub_org: true })
			.then(response => {
				this.state.subOrgs.loader = false;
				if (response.result.success) {
					this.state.subOrgs.list = response.result.data || [];
				}
			});
	}

	createForm(): void {
		let website = [];
		this.state.details.website.map((field) => {
			website.push(this._fb.group({
				id: Math.round(Math.random() * 1000),
				website: field.website,
				edit: false,
				websiteValidate: false
			}));
		});
		this.websitesForm = this._fb.group({
			org_id: this._activeRouter.parent.snapshot.params.id,
			website: this._fb.array(website)
		});
	}

	addWebsite(event): void {
		event.stopPropagation();
		this.websitesArray.push(this._fb.group({
			id: Math.round(Math.random() * 1000),
			website: "",
			edit: false,
			websiteValidate: false
		}));
		this.state.details.website = this.websitesArray.value;
	}

	validateWebsite(event: any): void {
		if (event.value.website == '' || this.websitePattern.test(event.value.website)) {
			event.patchValue({ websiteValidate: false });
		} else {
			event.patchValue({ websiteValidate: true });
		}
		this.checkWebsiteError();
	}

	checkWebsiteError(): void {
		this.state.websiteError = _.filter(this.websitesArray.value, function (o) { return o.websiteValidate });
	}

	cancelWebsite(event: any, e: any): any {
		e.stopPropagation();
		if (event.value.website == '') {
			event.patchValue({ websiteValidate: false, edit: false });
		} else if (this.websitePattern.test(event.value.website)) {
			event.patchValue({ websiteValidate: false, edit: false });
			let postData = {};
			postData['org_id'] = this.websitesForm.value.org_id;
			postData['website'] = [];
			this.websitesForm.value.website.map(function (value) {
				postData['website'].push({ website: value.website });
			});
			this._contactService.addOverviewData(postData).then(response => {
				if (response.result.success) {
					this.openSnackBar({ status: 'success', msg: 'Website Updated Successfully' });
				}
			});
		} else {
			event.patchValue({ websiteValidate: true, edit: true });
		}
		this.checkWebsiteError();
	}

	removeWebsite(item: any, event: any): any {
		event.stopPropagation();

		this._dialog.open(DeleteWebsiteComponent, {
			panelClass: 'my-dialog',
			width: '500px',
			data: {
				title: "Delete Website",
				name: "Website"
			}
		})
			.afterClosed()
			.subscribe(result => {
				if (result && result.success) {
					if (this.websitesArray.value.length > 1) {
						let webIndex = 0;
						_.find(this.websitesArray.value, function (o, i) {
							if (o.id == item.value.id) {
								webIndex = i;
							}
						});
						this.websitesArray.removeAt(webIndex);
						this.state.details.website = this.websitesArray.value;
						if (item.value.website != '') {
							let postData = {};
							postData['org_id'] = this.websitesForm.value.org_id;
							postData['website'] = [];
							this.websitesForm.value.website.map(function (value) {
								postData['website'].push({ website: value.website });
							});
							this._contactService.addOverviewData(postData).then(response => {
								if (response.result.success) {
									this.openSnackBar({ status: 'success', msg: 'Website Updated Successfully' });
								}
							});
						}
					}
					this.checkWebsiteError();
				}
			});
	}

	editWebsite(field: any, event: any): void {
		this.checkWebsiteError();
		if (!this.state.websiteError.length) {
			field.patchValue({ edit: true });
			setTimeout(function () {
				if (this.websiteElement._results.length) this.websiteElement._results[0].nativeElement.focus();
			}.bind(this));
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
