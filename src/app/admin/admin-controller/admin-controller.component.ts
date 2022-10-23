import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { getAdminConfig } from "@app/admin/admin.config";
import * as _ from 'lodash';

const FORM_CONFIG: Array<any> = [
	{ label: 'Id', key: 'id', type: 'none', default: '' },
	{ label: 'Name', key: 'name', type: 'text', validations: {required: true}, default: '' },
	{ label: 'Status', key: 'status', type: 'select', multi: false, options: 'statusList', default: null },
  { label: 'Description', key: 'description', type: 'textarea', default: '' },
  { key: 'created_by', default: null },
  { key: 'created_date', default: null },
  { key: 'last_modified_by', default: null },
  { key: 'last_modified_date', default: null } 
];
var APP = window['APP'];
@Component({
  selector: 'app-admin-controller',
  templateUrl: './admin-controller.component.html',
  styles: []
})
export class AdminControllerComponent implements OnInit {
  APP = APP;
  config: any = {};
  selectedType: any;
  types: any[] = [];

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router
  ) {
    let route = router.url.split('/').pop().split('?')[0];
    this.config = getAdminConfig(route);
    this.config.formFields = FORM_CONFIG;
    activeRoute.queryParamMap.subscribe(query => {
      let org_type = query.get('type');
      if (org_type) {
        this.config.formFields.push({ label: ' ', key: 'org_type', type: 'none', default: '' });
        this.selectedType = this.getSelectedType(Number(org_type));
        this.config = { ...this.config, ...{ name: this.selectedType.label.substr(0, this.selectedType.label.length - 1), org_type: org_type, pluralName: this.selectedType.label } };
        if (this.config.breadcrumbs.length > 2) this.config.breadcrumbs.pop();
        this.config.breadcrumbs = [...this.config.breadcrumbs, ...[{ label: this.selectedType.label, type: 'text' }]];
      }else {
        let indx = _.findIndex(this.config.formFields, {key: 'org_type'});
        if(indx > -1) this.config.formFields.splice(indx, 1);
      }
    })
  }

  ngOnInit() {
  }

  changeDepartment = org_type => {
    if (org_type != this.selectedType.value) {
      this.selectedType = this.getSelectedType(Number(org_type));
      this.config = { ...this.config, ...{ org_type: org_type, pluralName: this.selectedType.label } };
    }
  }

  getSelectedType = org_type => {
    let res = this.config.types.filter(val => val.value === org_type);
    if (res.length)
      return res[0];
    else
      return {};
  }

}
