import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { ScrollToConfigOptions, ScrollToService } from '@nicky-lenaers/ngx-scroll-to';

@Component({
	selector: 'app-admin-popover',
	templateUrl: './admin-popover.component.html',
	styleUrls: ['./admin-popover.component.scss']
})
export class AdminPopoverComponent implements OnInit {

	@Input('data') adminDashboard;
	@Input('primary') heading;
	@Input('secondary') subHeading;
	@Input('bgColor') bgColor;
	@Input('icon') icon;

	@Input() activeState;

	activeItem: string = '';
	scrollId: string = '';

	constructor(
		private router: Router,
		private _scrollToService: ScrollToService
	) { }

	ngOnInit() {
	}

	menuOpen = () => {
		setTimeout(() => {
			if (this.scrollId) this.triggerScroll(this.scrollId);
		}, 200);
		// if (!this.activeState) return;
		this.adminDashboard.map(admin => {
			admin.items.map(item => {
				if (item.name == this.activeState) {
					setTimeout(() => {
						item.isOpen = true;
					}, 5);
				}
			})
		})
		this.scrollId = this.router.url.split('/admin/')[1].split('?')[0];
		if (this.router.url.split('/admin/')[1].split('?').length > 1) {
			const type = this.router.url.split('/admin/')[1].split('?')[1].split('type=')[1];
			this.activeItem = this.router.url.split('/admin/')[1].split('?')[0] + '_' + type;
		} else {
			this.activeItem = this.router.url.split('/admin/')[1].split('?')[0];
		}
	}

	goBack = () => {
		this.router.navigate(['/admin']);
	}

	dropdownTrigger = (ev, item) => {
		if (ev) ev.stopPropagation();
		this.resetDropdown(item);
		item.isOpen = !item.isOpen;
	}

	resetDropdown = (data?) => {
		this.adminDashboard.map(admin => {
			admin.items.map(item => {
				if (data) {
					if (data.name != item.name) delete item.isOpen;
				} else {
					delete item.isOpen;
				}
			})
		})
	}

	triggerScroll(id) {
		const config: ScrollToConfigOptions = {
			target: id
		};

		this._scrollToService.scrollTo(config);
	}

}
