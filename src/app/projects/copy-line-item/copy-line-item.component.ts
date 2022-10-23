import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CommonService } from '@app/common/common.service';

@Component({
	selector: 'app-copy-line-item',
	templateUrl: './copy-line-item.component.html',
	styleUrls: ['./copy-line-item.component.scss']
})
export class CopyLineItemComponent implements OnInit {

	public state = {
		loader: true,
		export_from: [
			{ jsr_id: "550473", options: 1, pname: "Test", revision_no: "2", sname: "Broadcast - Music", status: "5" }
		],
		export_to: [
			{ jsr_id: "550473", options: 1, pname: "Test", revision_no: "2", sname: "Broadcast - Music", status: "5" },
			{ jsr_id: "550473", options: 2, pname: "Test", revision_no: "2", sname: "Broadcast - Music", status: "5" },
			{ jsr_id: "550473", options: 3, pname: "Test", revision_no: "2", sname: "Broadcast - Music", status: "5" },
			{ jsr_id: "550473", options: 1, pname: "Test", revision_no: "2", sname: "Broadcast - Music", status: "5" }
		],
		selected: [],
		copyLineItems: {
			from: [],
			to: [],
			type: ''
		},
		checkAll: false
	}

	typeDetails = {
		misc: {
			icon: 'icon-expenses',
			keys: ['task_name', 'designation_name', 'user_name', 'vendor_name']
		},
		internalcost: {
			icon: 'icon-credit-cost',
			keys: ['task_name']
		},
		vendor: {
			icon: 'icon-vendor-shape',
			keys: []
		},
		task: {
			icon: 'icon-task-completed',
			keys: ['task_name', 'designation_name', 'user_name']
		},
		cost: {
			icon: 'icon-vendor-shape',
			keys: ['task_name', 'vendor_name']
		},
		addCredit: {
			icon: 'icon-credit-cost',
			keys: ['task_name']
		}
	}

	savePromise: any;

	constructor(
		private _commonService: CommonService,
		public dialogRef: MatDialogRef<CopyLineItemComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }

	ngOnInit() {
		this.getCopyToProducts();

	}

	formatNumber(gross) {
		let number = gross.toString();
		if(number.indexOf('-')>-1){
			number = number.split('-')[1];
			let x = number.split('.');
			let x1 = x[0];
			x1 = isNaN(x1) ? "0" : Number(x1);
			x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
			var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
			return '-$' + x1 + x2;
		}else{
			let x = number.split('.');
			let x1 = x[0];
			x1 = isNaN(x1) ? "0" : Number(x1);
			x1 = Math.floor(x1).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
			var x2 = (x.length > 1 && x[1]) ? '.' + x[1] : '';
			return '$' + x1 + x2;
		}
	}

	getCopyToProducts() {
		this.state.loader = true;
		this._commonService.getApi('getCopyLnItemsList', this.data.getParams)
			.then(res => {
				this.state.loader = false;
				if (res['result'].success) {
					this.state.copyLineItems = res['result'].data;
				}
			})
	}

	allServiceChk() {
		this.state.selected = [];
		if (this.state.checkAll) {
			this.state.copyLineItems.to.map((service) => {
				this.state.selected.push(service.id);
				service['selected'] = true;
			});
		} else {
			this.state.copyLineItems.to.map((service) => {
				service['selected'] = false;
			});
		}
	}

	serviceChk(serv: any) {
		let indx = this.state.selected.indexOf(serv.id);
		if (indx > -1) this.state.selected.splice(indx, 1);
		else this.state.selected.push(serv.id);
		if (serv['selected']) {
			let selectedServices = this.state.copyLineItems.to.filter((service) => {
				return service['selected'];
			});
			if (selectedServices.length == this.state.copyLineItems.to.length) {
				this.state.checkAll = true;
			} else {
				this.state.checkAll = false;
			}
		} else {
			this.state.checkAll = false;
		}
	}

	close() {
		this.dialogRef.close();
	}

	save() {
		if (!this.savePromise) {
			const params = [];
			this.state.copyLineItems.to.map((service) => {
				if (service.selected) {
					params.push({
						id: service.id,
						jsr_id: service.jsr_id,
						job_form_id: service.job_form_id,
						revision: service.revision,
						estimates_id: this.data.getParams.estimate_id
					})
				}
			});
			this.savePromise = this._commonService.saveApi('saveCopyLnItems', { type: this.data.type, from_id: this.data.getParams.id, toCopyIds: params })
				.then(res => {
					this.savePromise = undefined;
					if(res['result'].success) {
						this.dialogRef.close({ success: true });
					}
				})
				.catch(err => {
					this.savePromise = undefined;
				})
		}
	}

}
