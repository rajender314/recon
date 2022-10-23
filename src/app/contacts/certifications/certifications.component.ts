import { Component, OnInit, Inject, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ContactsService } from '@app/contacts/contacts.service';
import { ActivatedRoute } from "@angular/router";
import { MatSnackBar } from '@angular/material';
import { SnackbarComponent } from '@app/shared/material/snackbar/snackbar.component';
import { SnackBarType } from "@app/shared/utility/types";
import * as _ from 'lodash';

var APP = window['APP'];

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.component.html',
  styleUrls: ['./certifications.component.scss']
})
export class CertificationsComponent implements OnInit {

  @Input() organization;
  @Input() orgId = this.route.parent.snapshot.params.id;
  public certificationsForm: FormGroup;
  public submitted: boolean = false;
  public websitePattern = /^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/;
  public numberPattern = /^[a-zA-Z0-9-\-]*$/;

  public state: any = {
    certificates: [],
    inputs: [],
    certificationsLoader: true,
    editable: true,
    organization: {}
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private contactsService: ContactsService,
  ) { }

  ngOnInit() {
    this.getCertifications();
  }

  ngOnChanges() {
    if (this.organization){
      this.state.organization = Object.assign([], this.organization);
      this.getCertifications();
      if (this.state.organization['org_type'] == 2) {
        this.state.editable = APP.permissions.system_access.client == 'edit';
      } else if (this.state.organization['org_type'] == 3) {
        // IF current route is a vendor
        this.state.editable = APP.permissions.system_access.vendor == 'edit';
      }
    }
  }

  // getter
  get checkboxArray() {
    return this.certificationsForm.get('inputs') as FormArray;
  }

  createForm = () => {
    let checkbox = [];
    this.state.certificates.map(function(service){
      let number: any = '';
      let website: any = '';
      let status: any = false;
      let websiteValidate: any = false;
      let numberValidate: any = false;
      if(service.children && this.state.inputs.length){
        number = _.find(this.state.inputs, function (o) { return o.id == service.id; }.bind(this)).number || '';
        website = _.find(this.state.inputs, function (o) { return o.id == service.id; }.bind(this)).website || '';
        status = _.find(this.state.inputs, function (o) { return o.id == service.id; }.bind(this)).status || false;
        websiteValidate = false;
        numberValidate = false;
      }
      
      checkbox.push(this.fb.group({
        id: service.id,
        css: service.css,
        status: status,
        label: service.label,
        number: number,
        website: website,
        children: (service.children && service.children.length)?true:false,
        websiteValidate: websiteValidate,
        numberValidate: numberValidate
      }));
    }.bind(this));
		this.certificationsForm = this.fb.group({
      org_id: this.route.parent.snapshot.params.id,
      inputs: this.fb.array(checkbox)
    });
  }

  changeCertificate(service: any): void{
    if(!service.value.status){
      service.patchValue({
        number: "",
        website: "",
        websiteValidate: false,
        numberValidate: false
      });
    }
  }

  cancelCertification(): void{
    let checkbox = [];
    this.state.certificates.map(function(service){
      let number: any = '';
      let website: any = '';
      let status: any = false;
      let websiteValidate: any = false;
      let numberValidate: any = false;
      if(service.children && this.state.inputs.length){
        number = _.find(this.state.inputs, function (o) { return o.id == service.id; }.bind(this)).number || '';
        website = _.find(this.state.inputs, function (o) { return o.id == service.id; }.bind(this)).website || '';
        status = _.find(this.state.inputs, function (o) { return o.id == service.id; }.bind(this)).status || false;
        websiteValidate = false;
        numberValidate = false;
      }
      checkbox.push({
        id: service.id,
        css: service.css,
        status: status,
        label: service.label,
        number: number,
        website: website,
        children: (service.children && service.children.length)?true:false,
        websiteValidate: websiteValidate,
        numberValidate: numberValidate
      });
    }.bind(this));
    this.certificationsForm.patchValue({
      inputs: checkbox
    });
  }

  openSnackBar = (obj) => {
		let data: SnackBarType = {
			status: obj.status,
			msg: obj.msg
		}
		this.snackbar.openFromComponent(SnackbarComponent, {
			data: data,
			verticalPosition: 'top',
			horizontalPosition: 'right'
		})
	}

  emailValidation(event: any) {
      if (event.value.website == '' || this.websitePattern.test(event.value.website)) {
          event.patchValue({websiteValidate:false});
      } else {
          event.patchValue({websiteValidate:true});
      }
  }

  numberValidation(event: any){
      if (event.value.number == '' || this.numberPattern.test(event.value.number)) {
          event.patchValue({numberValidate:false});
      } else {
          event.patchValue({numberValidate:true});
      }
  }

  saveCertification(form: any): void{
    let webValidate = _.filter(form.value.inputs, { websiteValidate: true });
    let numValidate = _.filter(form.value.inputs, { numberValidate: true });
    if(!webValidate.length && !numValidate.length){
      this.contactsService.saveCertifications(form.value).then(response => {
        if (response.result.success) {
          this.openSnackBar({ status: 'success', msg: 'Company Certification and Quality Control have been saved Successfully' });
          this.state.certificates = response.result.data['certifications'];
          this.state.inputs = response.result.data['inputs'];
        }
      });
    }
  }

  getCertifications(): void{
    this.state.certificationsLoader = true;
    this.contactsService.getCertifications({org_id: this.orgId}).then(response => {
      if (response.result.success) {
        this.state.certificates = response.result.data['certifications'];
        this.state.inputs = response.result.data['inputs'];
        this.createForm();
        this.state.certificationsLoader = false;
      }
    });
  }

}
