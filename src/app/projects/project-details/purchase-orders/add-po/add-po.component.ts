import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import * as _ from 'lodash';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonService } from '@app/common/common.service';
import { ConfirmationComponent } from '@app/dialogs/confirmation/confirmation.component';

@Component({
	selector: 'app-add-po',
	templateUrl: './add-po.component.html',
	styleUrls: ['./add-po.component.scss'],
	host: {
		class: 'stepper-window'
	},
	animations: [
		trigger('showMoreAnimate', [
			transition(':enter', [
				style({ transform: 'translateY(-30px)', opacity: 0 }),
				animate('500ms cubic-bezier(0.35, 1, 0.25, 1)', style('*'))
			])
		])
	]
})
export class AddPoComponent implements OnInit {

	public state = {

		checkCondition: true,

		isDisable: true,
		denominator: 4,
		index: 0,
		vendorIndex: 0,
		vendors: [
			{
				id: 1, label: "VENDORS WHOS BIDS ARE SELECTED FOR THIS PROJECT", limit: 4, showMore: false, selected: false, children: []
			},
			{
				id: 2, label: "OTHER VENDORS SELECTED FOR THIS PROJECT", limit: 4, showMore: false, selected: false, children: []
			}
		],
		selectedVendorsList: {
			1: [],
			2: []
		},
		vendorsList: [],
		selectedVendorDetails: {},
		selectedVendor: {
			checkAllProducts: false,
			checkAllTasks: false,
			checkAllExpenses: false,
			checkAllBids: false
		},
		selectedVendorId: null,
		unlockCreatePo: false,
		products: []
	}

	constructor(
		private _dialog: MatDialog,
		private _dialogRef: MatDialogRef<AddPoComponent>,
		private _commonService: CommonService,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if (data.isNew) this.state.index = 0;
		else {
			this.state.index = 1;
			this.state.vendorsList = [{ ...data.vendor }];
			this.state.selectedVendorId = data.vendor.id;
			this.getVendorsDetails(data.vendor.id, data.POId);
		}
	}

	ngOnInit() {
		this.getVendorsList(this.data.jobs_id);
	}

	getVendorsList(id) {
		this._commonService.update({ type: 'overlay', action: 'start' });
		this._commonService.getApi('poVendorsLists', { jobs_id: id })
			.then(res => {
				this._commonService.update({ type: 'overlay', action: 'stop' });
				if (res['result'].success) {
					this.state.vendors[0].children = res['result'].data.vendorList || [];
					this.state.vendors[1].children = res['result'].data.otherVendorList || [];
				}
			}, err => {
				this._commonService.update({ type: 'overlay', action: 'stop' });
			})
	}

	changeStep(event) {
		this.state.index = event.selectedIndex;
	}

	/*changeVendorStep(event) {
		this.state.vendorIndex = event.selectedIndex;
	}*/

	changeLimit(container) {
		const nextLimit = container.limit / this.state.denominator;
		container.limit = this.state.denominator * (nextLimit + 1);
	}

	checkAllVendors(container) {
		this.state.selectedVendorsList[container.id] = [];
		container.children.map(o => {
			o.selected = container.selected;
			if (container.selected)
				this.state.selectedVendorsList[container.id].push({
					id: o.vendors_id,
					name: o.vendor_name
				});
		});

		this.state.isDisable = this.enableButton();
	}

	checkSelectedVendor(container, vendor) {
		let cond = true;
		container.children.map(o => {
			if (!o.selected) cond = false;
		});
		container.selected = cond;

		const indx = _.findIndex(this.state.selectedVendorsList[container.id], ['id', vendor.vendors_id]);
		if (indx > -1) this.state.selectedVendorsList[container.id].splice(indx, 1);
		else this.state.selectedVendorsList[container.id].push({ id: vendor.vendors_id, name: vendor.vendor_name });

		this.state.isDisable = this.enableButton();
	}

	enableButton(category = [1, 2]) {
		let cond = true;
		category.map(o => {
			if (this.state.selectedVendorsList[o].length && cond) cond = false;
		});
		return cond;
	}

	addVendors(category = [1, 2]) {
		this.state.vendorsList = [];
		category.map(o => {
			this.state.vendorsList = [...this.state.vendorsList, ...this.state.selectedVendorsList[o]];
		});

		if (this.state.vendorsList.length) {
			this.state.selectedVendorId = this.state.vendorsList[0].id;
			this.getVendorsDetails(this.state.selectedVendorId);
		}
	}

	getVendorsDetails(id, poId = 0) {
		this.state.selectedVendorId = id;
		if (!this.state.selectedVendorDetails[this.state.selectedVendorId]) {
			this._commonService.getApi('vendorsPrdSrv', { jobs_id: this.data.jobs_id, vendors_id: id, id: poId })
				.then(res => {
					if (res['result'].success) {
						this.state.selectedVendorDetails[this.state.selectedVendorId] = res['result'].data || [];
						// if (!this.data.isNew) {
						this.state.selectedVendorDetails[this.state.selectedVendorId].map(p => {
							p.services.map(s => {
								if (s.selected || s.is_est_approve) this.checkService(s, p);
							})
						})
						// }
					}
				})
		} else {
			this.state.selectedVendorDetails[this.state.selectedVendorId].map(p => {
				p.services.map(s => {
					if (s.selected || s.is_est_approve) this.checkService(s, p);
				})
			})
		}
	}

	vendorChange(id) {
		this.resetSelectedOptions();
		this.getVendorsDetails(id);
	}

	parentCheck(flag, isChecked) {
		let counter = 0, selected = 0;
		switch (flag) {
			case 'selected':
				this.state.selectedVendorDetails[this.state.selectedVendorId].map(p => {
					p.selected = isChecked;
					if (p.services && p.services.length) {
						p.services.map(s => {
							counter++;
							if (!isChecked) ['task', 'expense', 'bid'].map(prop => {
								s[prop] = false;
							});
							if (s.is_service_available) {
								s.selected = isChecked;
								if (isChecked) {
									['task', 'expense', 'bid'].map(prop => {
										s[prop] = true;
									});
									selected++;
								}
							}
						})
					}
				});
				['checkAllTasks', 'checkAllExpenses', 'checkAllBids'].map(prop => {
					this.state.selectedVendor[prop] = (counter == selected);
				})
				this.state.unlockCreatePo = isChecked;
				break;

			case 'task':
			case 'expense':
			case 'bid':
				this.state.selectedVendorDetails[this.state.selectedVendorId].map(p => {
					if (p.services && p.services.length) {
						p.services.map(s => {
							s[flag] = isChecked;
						})
					}
				});
				break;

			default:
				// Do Nothing
				break;
		}
	}

	checkSelectAllProducts(): void {
		let selected = true, isEnabled = false;
		this.state.selectedVendorDetails[this.state.selectedVendorId].map(p => {
			if (p.selected) isEnabled = true;
			if (p.selected && selected) {
				if (p.services && p.services.length) {
					p.services.map(s => {
						if (!s.selected && selected) selected = false;
					})
				}
			} else {
				selected = false;
			}
		});
		['checkAllProducts', 'checkAllTasks', 'checkAllExpenses', 'checkAllBids'].map(prop => {
			this.state.selectedVendor[prop] = selected;
		})
		this.state.selectedVendor.checkAllProducts = selected;
		this.state.unlockCreatePo = isEnabled;
	}

	checkAllServices(item): void {
		if (item.services && item.services.length) {
			item.services.map(s => {
				if (s.is_service_available) {
					s.selected = item.selected;
					['task', 'expense', 'bid'].map(prop => {
						s[prop] = item.selected;
					})
				}
			});
		}
		this.checkSelectAllProducts();
	}

	checkService(ser, prod) {
		if (ser.selected) {
			prod.selected = true;
			['task', 'expense', 'bid'].map(prop => {
				ser[prop] = true;
			})
		} else {
			['task', 'expense', 'bid'].map(prop => {
				ser[prop] = false;
			})
			let parentChk = false;
			_.map(prod.services, (value) => {
				if (value['selected']) {
					parentChk = true;
				}
			});
			prod.selected = parentChk;
		}
		this.checkSelectAllProducts();
	}

	resetSelectedOptions() {
		this.state.selectedVendor = {
			checkAllBids: false,
			checkAllExpenses: false,
			checkAllProducts: false,
			checkAllTasks: false
		}
	}

	close() {
		this._dialogRef.close();
	}

	confirmationModal() {
		this._dialog.open(ConfirmationComponent, {
			panelClass: 'recon-dialog',
			width: '570px',
			data: {
				title: 'Add Purchase Order',
				url: '',
				params: {},
				content: `<div class="po-dialog min-alert-ui">
				<div class=""><span class="warning"><i class="pixel-icons icon-exclamation"></i></span></div>
				<div><p>Bids for some of the services in this PO have not been awarded to this Vendor. Are you sure, you want to proceed?</p></div></div>`
			}
		})
			.afterClosed()
			.subscribe(res => {
				if (res && res.success) {
					this.state.checkCondition = false;
					this.addPurchaseOrder();
				}
			})
	}

	addPurchaseOrder() {
		if (this.state.checkCondition) {
			this.confirmationModal();
		} else {
			let params = {
				jobs_id: this.data.jobs_id,
				jsr_ids: {}
			}
			if (this.data.isNew) params['vendors'] = this.state.vendorsList;
			else params['jobs_po_id'] = this.data.POId;
			let url = this.data.isNew ? 'createPo' : 'updatePoServices';
			this.state.vendorsList.map(v => {
				if (this.state.selectedVendorDetails[v.id]) {
					params.jsr_ids[v.id] = [];
					this.state.selectedVendorDetails[v.id].map(p => {
						if (p.selected) {
							p.services.map(s => {
								if (s.selected) params.jsr_ids[v.id].push({ jobs_service_revisions_id: s.jobs_service_revisions_id, service_revision_no: s.service_revision_no, option: s.options.length ? s.options[0] : null, task: s.task || false, expense: s.expense || false, bid: s.bid || false });
							})
						}
					})
				}
			});
			if (url) {
				this._commonService.saveApi(url, params)
					.then(res => {
						if (res['result'].success) {
							this._dialogRef.close({ success: true, data: this.data.isNew ? res['result'].data : res['result'].data });
						}
					})
			}
		}

	}

	checkColumnLevel(item, type): void {
		// if (!item[type]) {
		// 	switch (type) {
		// 		case 'task':
		// 			this.state.selectedVendor.checkAllTasks = false;
		// 			break;
		// 		case 'expense':
		// 			this.state.selectedVendor.checkAllExpenses = false;
		// 			break;
		// 		case 'bid':
		// 			this.state.selectedVendor.checkAllBids = false;
		// 			break;
		// 	}
		// } else {
		// 	let check = true;
		// 	_.map(this.state.selectedVendor.products, (value) => {
		// 		if (value.services && value.services.length) {
		// 			_.map(value.services, (child) => {
		// 				if (!child[type]) {
		// 					check = false;
		// 				}
		// 			});
		// 		}
		// 	});
		// 	if (check) {
		// 		switch (type) {
		// 			case 'task':
		// 				this.state.selectedVendor.checkAllTasks = true;
		// 				break;
		// 			case 'expense':
		// 				this.state.selectedVendor.checkAllExpenses = true;
		// 				break;
		// 			case 'bid':
		// 				this.state.selectedVendor.checkAllBids = true;
		// 				break;
		// 		}
		// 	}
		// }
		// this.checkSelectAllProducts();
	}

	checkSelectAllColumns(type): void {
		// let uncheck = false;
		// _.map(this.state.selectedVendor.products, (value) => {
		// 	if (value.services && value.services.length) {
		// 		_.map(value.services, (child) => {
		// 			if (!child[type]) {
		// 				uncheck = true;
		// 			}
		// 		});
		// 	}
		// });
		// if (uncheck) {
		// 	switch (type) {
		// 		case 'task':
		// 			this.state.selectedVendor.checkAllTasks = false;
		// 			break;
		// 		case 'expense':
		// 			this.state.selectedVendor.checkAllExpenses = false;
		// 			break;
		// 		case 'bid':
		// 			this.state.selectedVendor.checkAllBids = false;
		// 			break;
		// 	}
		// } else {
		// 	switch (type) {
		// 		case 'task':
		// 			this.state.selectedVendor.checkAllTasks = true;
		// 			break;
		// 		case 'expense':
		// 			this.state.selectedVendor.checkAllExpenses = true;
		// 			break;
		// 		case 'bid':
		// 			this.state.selectedVendor.checkAllBids = true;
		// 			break;
		// 	}
		// }
	}

}
