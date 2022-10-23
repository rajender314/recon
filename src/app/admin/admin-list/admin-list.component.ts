import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

import { AdminService } from "@app/admin/admin.service";
import { Pagination } from "@app/shared/utility/types";
import { SortFilter, StatusFilter, Statuses, buildParam, StatusList } from "@app/shared/utility/dummyJson";
import { Subscription } from 'rxjs';

import * as _ from 'lodash';
import { MatDialog } from '@angular/material';
import { AdminDashboard } from '@app/admin/admin.config';

var APP: any = window['APP'];

@Component({
	selector: 'app-admin-list',
	templateUrl: './admin-list.component.html',
	styleUrls: ['./admin-list.component.scss']
})
export class AdminListComponent implements OnInit {

	@Input() config: any;
	@Output() onListUpdate = new EventEmitter();
	@Output() onSelect = new EventEmitter();
	@Output() onSearch = new EventEmitter();
	@Output() onAdd = new EventEmitter();

	inProgress: boolean = true;
	list: any[] = [];
	selectedItem: any;
	params: Pagination = {
		page: 1,
		pageSize: 50,
		status: 'true',
		sort: 'asc'
	};
	sortLabel: string = "A-Z";
	statusLabel: string = 'Active';
	totalCount: number = 0;
	totalPages: number = 0;

	dropdowns: any = {
		sortFilter: SortFilter,
		statusFilter: StatusFilter,
		statusList: StatusList,
		status: Statuses
	}
	adminDashboard = AdminDashboard;

	subscription: Subscription;

	constructor(
		private adminService: AdminService,
		private dialog: MatDialog
	) {
		this.subscription = adminService.onUpdate().subscribe(next => {
			if(next.flag == 'update'){
				let indx = _.findIndex(this.list, { id: next.item.id });
				if (indx > -1) {
					if(this.list[indx].status != next.item.status && this.statusLabel){
						this.list.splice(indx, 1);
						this.totalCount--;
						if(this.list.length) {
							const item = this.list[indx] ? this.list[indx] : this.list[0];
							this.selectItem(item)
						}else {
							this.selectItem(null);
						}
					}else {
						this.list[indx] = { ...next.item };
						this.selectedItem = { ...next.item };
					}
				}
			}else {
				this.resetAndFetchList();
			}
		})
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	ngOnInit() {
		// this.getList();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes) {
			if(changes.config && changes.config.currentValue){
				this.params.page = 1;
				if(this.config.org_type) this.params.org_type = this.config.org_type;
				this.list = [];
				this.getList(); 
			}
		}
	}

	getList() {
		if (this.list.length === 0) {
			this.inProgress = true;
		}

		this.adminService.getApi(this.config.getList, this.params)
			.then(res => {
				if (res.result.success) {
					this.list = [...this.list, ...res.result.data[this.config.prop]];
					this.onListUpdate.emit({ params: this.params, dropdowns: this.dropdowns });

					this.totalCount = res.result.data.total;
					if (this.params.page === 1) {
						this.totalPages = Math.ceil(Number(this.totalCount) / this.params.pageSize);

						if (this.list.length) {
							this.selectItem(this.list[0]);
						}else {
							this.selectItem(null);
						}
					}
				}

				this.inProgress = false;
			});
	}

	selectItem(item) {
		this.selectedItem = item;
		if(this.config.responseKey && item){
			this.onSelect.emit({type: 'spinner', data: true});
			this.adminService
			.getApi(this.config.getList,{id: this.selectedItem.id})
				.then(res => {
					if (res.result.success) {
						this.selectedItem = res.result.data[this.config.responseKey][0];
						
						this.onSelect.emit({type: 'data', data: this.selectedItem});
					}			
				})
			}else {
				this.onSelect.emit({type: 'data', data: this.selectedItem});
			}
	
	}

	scroll() {
		if (this.totalPages > 0 && this.totalPages > this.params.page) {
			this.params.page++;
			this.getList()
		}
	}

	search(val) {
		if (val) {
			this.params.search = val;
		} else {
			delete this.params.search;
		}

		this.resetAndFetchList();
		this.onSearch.emit(val);
	}

	sort() {
		if (this.params.sort === 'asc') {
			this.params.sort = 'desc';
			this.sortLabel = 'Z-A';
		} else {
			this.params.sort = 'asc';
			this.sortLabel = 'A-Z';
		}

		this.resetAndFetchList();
	}

	filter(status) {
		if (status.value !== this.params.status) {
			this.params.status = status.value;
			this.statusLabel = status.value && status.label;

			this.resetAndFetchList();
		}
	}

	resetAndFetchList() {
		this.params.page = 1;
		this.list = [];
		this.getList();
	}

	addNew() {
		this.onAdd.emit();
	}

	export() {
		if(this.config['export']){
			let url = APP.api_url + this.config['export'] + '?' + buildParam(this.params) + '&token=' + APP.access_token + '&jwt=' + APP.j_token;;
			window.location.href = url;
		}
	}

}
