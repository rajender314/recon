import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

const TABS = [
	{ key: '', label: 'Billable Address' },
	{ key: '', label: 'Estimate Address' },
	{ key: '', label: 'Shipping Address' }
];

@Component({
	selector: 'app-change-address',
	templateUrl: './change-address.component.html',
	styleUrls: ['./change-address.component.scss']
})
export class ChangeAddressComponent implements OnInit {

	state = {
		isLoading: false,
		activeTab: 0,
		tabs: [],
		hasTabs: true,
		selectedTab: {},
		addressList: [],
		selectedAddress: {}
	}

	constructor(
		private commonService: CommonService,
		private dialogRef: MatDialogRef<ChangeAddressComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		if (data.hasTabs) this.state.tabs = TABS;
		if (data.selectedAddress) this.state.selectedAddress = data.selectedAddress
	}

	ngOnInit() {
		if (this.data.hasTabs) this.onTabChange(this.data.tabIndex);
		else this.getVendorAddress();
	}

	onTabChange(val) {
		this.state.activeTab = val;
		this.state.isLoading = true;
		this.state.selectedTab = this.state.tabs[val];
		this.getAddresses();
	}

	getAddresses() {
		this.commonService.getApi('getOrgAddress', { org_type: '2', org_id: this.data.org_id, addr_type: this.state.activeTab + 1 })
			.then(res => {
				this.state.isLoading = false;
				if (res['result'].success) {
					this.state.addressList = res['result'].data;
				}
			})
	}

	getVendorAddress() {
		this.commonService.getApi('getOrgAddress', { search: '', org_type: 3, org_id: this.data.vendor_id })
			.then(res => {
				if (res['result'].success) {
					this.state.addressList = res['result'].data;
				}
			})
	}

	onSelectItem(addr) {
		this.state.selectedAddress = addr;
	}

	saveAddress() {
		if (this.state.selectedAddress)
			this.dialogRef.close({ success: true, data: this.state.selectedAddress });
	}

}
