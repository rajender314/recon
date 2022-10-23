import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '@app/common/common.service';

@Component({
	selector: 'app-specs',
	templateUrl: './specs.component.html',
	styleUrls: ['./specs.component.scss']
})
export class SpecsComponent implements OnInit {

	state: any = {
		showView: false,
		isLoading: false,
		fetchingDetails: false,
		projectID: '',
		urls: {
			get: '',
			details: '',
			save: ''
		},
		productList: [],
		selectedProduct: {}
	}

	constructor(
		private commonService: CommonService,
		private activedRoute: ActivatedRoute
	) {
		activedRoute.params.subscribe(param => {
			this.state.projectID = param.id ? param.id : '';
		});
		if(this.state.projectID) this.getProducts(this.state.projectID);
	}

	ngOnInit() {
	}

	changeMasterView() {
		this.state.showView = !this.state.showView;
	}

	getProducts(id) {
		this.state.isLoading = true;
		// dummy JSON
		this.state.productList = [
			{id: 123, name: 'Product', secondary: 'Address List', status: true},
			{id: 456, name: 'Product 1', secondary: 'Address List 1', status: true},
			{id: 789, name: 'Product 2', secondary: 'Address List 2', status: true},
		];
		setTimeout(() => {
			this.state.isLoading = false;
			this.onSelectItem(this.state.productList[0])
		}, 1000);
		this.commonService.getApi(this.state.urls.get, {project_id: id})
		.then(res => {
		})
	}

	onSelectItem(item) {
		this.state.selectedProduct = item;
		this.state.fetchingDetails = true;
		// dummy JSON
		this.commonService.getApi(this.state.urls.details, {id: item.id})
		.then(res => {
			this.state.fetchingDetails = false;
		})
	}


	openAddDialog() {
	}

	performActions(action) { 
	}

}
