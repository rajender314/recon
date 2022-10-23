import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonService } from '@app/common/common.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
  // encapsulation: ViewEncapsulation.None,
  host: {
    class: 'add-task-container'
  }
})
export class AddTaskComponent implements OnInit {

  public formGroup: FormGroup;

  public state = {
    products: [],
    inactiveProducts: [],
    services: [],
    inactiveServices: [],
    tasks: [
      { id: 3, name: 'Bids' },
      { id: 0, name: 'Misc' },
      // { id: 1, name: 'Task' }
    ],
    taskTypes: [],
    users: [],
    markups: [],
    submitted: false
  }

  constructor(
    private dialogRef: MatDialogRef<AddTaskComponent>,
    private fb: FormBuilder,
    private commonService: CommonService,
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    if(this.data.tabIndex=='4'){
      this.state.tasks = [
        { id: 0, name: 'Misc' }
      ];
    }else{
      this.state.tasks = [
        { id: 3, name: 'Bids' },
        { id: 0, name: 'Misc' }
      ];
    }
    this.getPageDropDowns();
    this.createForm();
  }

  getPageDropDowns() {
    this.state.inactiveProducts = [];
    this.commonService.getApi('jobProductList', { jobs_id: this.data.projectInfo.id }).then(res => {
      this.state.products = res['result'].data;
      this.state.products.map(o => {
        if(o.is_cancel) this.state.inactiveProducts.push(o.products_id);
      })
    });
  }

  getServices() {
    this.state.inactiveServices = [];
    this.state.products.map((product) => {
      if (product.products_id == this.formGroup.controls.product.value) {
        this.state.services = product.services;
        this.state.services.map(o => {
          if(o.form_status_id == 10) this.state.inactiveServices.push(o.jobs_service_revisions_id);
        })
      }
    });
  }

  changeCostType() {
    switch (this.formGroup.controls.cost_type.value) {
      case 0:
        this.formGroup.controls.user.setValidators([Validators.required]);
        this.formGroup.controls.user.updateValueAndValidity();
        this.commonService.getApi('drpDwnMiscExpn', {}).then(res => {
          if (res['result'].success) {
            this.state.taskTypes = res['result'].data.MiscDt;
            this.state.markups = res['result'].data.markup;
          }
        });
        break;
      case 1:
        this.formGroup.controls.user.setValidators([Validators.required]);
        this.formGroup.controls.user.updateValueAndValidity();
        this.commonService.getApi('getTasks', {}).then(res => {
          if (res['result'].success) {
            this.state.taskTypes = res['result'].data.items;
          }
        });
        break;
      case 3:
        this.formGroup.controls.user.clearValidators();
        this.formGroup.controls.user.updateValueAndValidity();
        if (this.formGroup.controls.service.value != '' && this.formGroup.controls.cost_type.value != '') {
          this.commonService.getApi('vendorsOptions', {
            jsrid: this.formGroup.controls.service.value,
            jobs_id: this.data.projectInfo.id
          }).then(res => {
            if (res['result'].success) {
              this.state.taskTypes = res['result'].data;
            }
          });
        }
        break;
    }
  }

  createForm() {
    if(this.data.tabIndex=='4'){
      this.formGroup = this.fb.group({
        cost_type: ['', Validators.required],
        cost_item: ['', Validators.required],
        user: ['', Validators.required],
        user_type: ''
      });
    }else{
      this.formGroup = this.fb.group({
        product: ['', Validators.required],
        service: ['', Validators.required],
        cost_type: ['', Validators.required],
        cost_item: ['', Validators.required],
        user: ['', Validators.required],
        user_type: ''
      });
    }
  }

  changeUserType(){
    this.formGroup.controls.user.patchValue('');
    switch(this.formGroup.controls.user_type.value){
      case '1':
        this.commonService.getApi('desgnUsers', {org_type:3, type: 'child'}).then(res => {
          this.state.users = res['result'].data;
        });
        break;
      case '2':
        this.commonService.saveApi('getVendors', {org_type:3}).then(res => {
          this.state.users = res['result'].data;
        });
        break;
    }
  }

  userChange() {
  }

  close() {
    this.dialogRef.close({ success: false });
  }

  save() {
    this.formGroup.markAsPristine();
    this.state.submitted = true;
    let saveApi = 'saveOthCstAnlys';
    let postParams = {
      jobs_id: this.data.projectInfo.id,
      cost_type: this.formGroup.controls.cost_type.value,
      cost_id: this.formGroup.controls.cost_item.value
    };
    if(this.data.tabIndex!='4'){
      postParams['jobs_products_id'] = this.formGroup.controls.product.value;
      postParams['jobs_service_revisions_id'] = this.formGroup.controls.service.value;
      _.map(this.state.services, (service) => {
        if(service.jobs_service_revisions_id==this.formGroup.controls.service.value){
          postParams['jsr_rev_no'] = service.service_revision_no;
        }
      });
      saveApi = 'saveCostAnalysis';
    }
    switch (this.formGroup.controls.cost_type.value) {
      case 0: 
        //misc
        this.state.taskTypes.map((item)=>{
          if(item.id==this.formGroup.controls.cost_item.value){
            postParams['markup'] = this.state.markups[item.id];
          }
        });
        switch(this.formGroup.controls.user_type.value){
          case '1':
            this.state.users.map((dept)=>{
              if(dept.children && dept.children.length){
                dept.children.map((user)=>{
                  if(user.id==this.formGroup.controls.user.value){
                    postParams['user_type'] = this.formGroup.controls.user_type.value;
                    postParams['users_id'] =this.formGroup.controls.user.value;
                    postParams['designation_id'] = dept.id;
                    postParams['designation_name'] = dept.name;
                    postParams['user_rating'] = user.user_rating;
                  }
                });
              }
            });
            break;
          case '2':
            postParams['user_type'] = this.formGroup.controls.user_type.value;
            postParams['users_id'] =this.formGroup.controls.user.value;
            break;
        }
        break;
      case 1:
        //task
        break;
      case 3:
        //bids
        this.state.taskTypes.map((item)=>{
          if(item.id==this.formGroup.controls.cost_item.value){
            postParams['jobs_forms_id'] = item.jobs_forms_id;
            postParams['vendors_id'] = item.id;
            postParams['vendor_name'] = item.vendor_name;
            postParams['vendor_amount'] = item.vendor_amount;
            postParams['gross_amount'] = item.gross_amount;
            postParams['markup'] = item.markup_amount;
          }
        });
        break;
    }
    if(this.formGroup.valid){
      this.commonService.update({ type: 'overlay', action: 'start' });
      this.commonService.saveApi(saveApi, postParams).then(res => {
        if(res['result'].success){
          this.dialogRef.close({ success: true });
        }
        this.commonService.update({ type: 'overlay', action: 'stop' });
      }).catch(err =>{
        this.commonService.update({ type: 'overlay', action: 'stop' });
      });
    }
  }

}
