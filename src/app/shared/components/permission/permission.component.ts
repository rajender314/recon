import { Component, OnInit, Input, SimpleChanges, HostBinding } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UsersService } from '@app/users/users.service';

@Component({
	selector: 'app-permission',
	templateUrl: './permission.component.html',
	styleUrls: ['./permission.component.scss']
})
export class PermissionComponent implements OnInit {

	@Input() prop: string = 'name';
	@Input() data;
	@Input() id;
	@Input() headers;
	@Input() readonly;
	@Input() group: FormGroup;
	@Input() checkServices = false;

	@HostBinding('class.child') isClass: boolean = false;

	priceConfig: any = {
		prefix: '$',
		limit: 8,
		centsLimit: 2,
		isCancel: false
	}


	constructor(
		private usersService: UsersService
	) { }

	ngOnInit() {
		if (!this.headers) this.isClass = true;
		/*this.group.valueChanges.subscribe(e => {
			this.group.setValue(e, { emitEvent: false });
		})*/
		if (this.group.value.products && this.checkServices) {
			this.onDropdownChange(this.group, 'products', 'job_specific_user');
			this.onDropdownChange(this.group, 'products', 'job_specific_others');
		}
	}

	changeTextField = (control, ev) => {
		let val = ev.target.value;
		if (val) {
			this.group.patchValue({
				[control]: val
			})
		}
	}

	sendInvitation(perm: any): void {
		this.usersService.sendInvitation({ invite_id: perm.id, user_id: this.id }).then(response => {
			if (response.result.success) {
				perm.is_invited = 1;
			}
		});
	}

	ngOnChanges(changes: SimpleChanges) {
	}

	onParentChange(item) {
		// if (['none','no'].includes(this.group.value[item.key]) && item.children && item.children.length) {
		// 	item.children.map(row => {
		// 		if (row.type == 'radio') {
		// 			this.group.get([row.key]).setValue(row.options.length ==3 ?'none': 'no');
		// 		}
		// 		if (row.children && row.children.length) {
		// 			this.onParentChange(row);
		// 		}
		// 	})
		// }
	}

	onDropdownChange(group, parentKey, childKey) {
		if (parentKey == "products") {
			if (group.value[parentKey][childKey] == "view") {
				group.controls["services"].controls[childKey].enable();
			} else {
				group.controls["services"].controls[childKey].disable();
				group.controls["services"].controls[childKey].setValue(group.value[parentKey][childKey]);
			}
		}
	}

}
