import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl } from '@angular/forms';
import { buildForm, updateForm, objectToArray } from '@app/admin/admin.config';
import { CommonService } from '@app/common/common.service';
import { forkJoin } from 'rxjs';
import { ApiCallBase } from '@app/shared/utility/config';
import * as _ from 'lodash';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { checkedLength } from '@app/shared/utility/dummyJson';

@Component({
   selector: 'app-wop-notifications',
   templateUrl: './wop-notifications.component.html',
   styleUrls: ['./wop-notifications.component.scss']
})
export class WopNotificationsComponent implements OnInit {
   public addressForm = [
      { key: 'id', label: '', type: 'none', default: '' },
      { key: 'address1', label: '', type: 'text', default: '' },
      { key: 'address2', label: '', type: 'text', default: '' },
      { key: 'city', label: '', type: 'text', default: '' },
      { key: 'state_id', label: '', type: 'select', multi: false, options: 'states', default: '' },
      { key: 'postal_code', label: '', type: 'text', default: '' },
      { key: 'country_id', label: '', type: 'select', multi: false, options: 'countries', default: '' }
   ];
   addressApiCalls = [
      { key: 'countries', url: 'getCountries', method: 'get', responseKey: '', params: {} }
   ];
   dropdowns = {
      countries: [],
      states: []
   };
   public selected = {
      "spec_ids": [
         "5d0cb2ee4ada357ac0096c24",
         "5d0cb34d4ada357ac0096c25",
         "5d0cb9364ada351f225a6462"
      ],
      "specDt": [
         {
            "id": "5d0cb2ee4ada357ac0096c24",
            "label": "Instructions\/File Name",
            "ui_element_id": "5b30e1c1c9a82919448c9401",
            "type": "Paragraph Text",
            "status": true,
            "options": [

            ],
            "tooltip": "",
            "template_id": 2,
            "key": "paragraph_text",
            "last_modified_date": "2019-06-21 10:35:26",
            "value": "",
            "settings": null
         },
         {
            "id": "5d0cb34d4ada357ac0096c25",
            "label": "File Source",
            "ui_element_id": "5b30e1b4c9a82919448c9400",
            "type": "Drop Down",
            "status": true,
            "options": [
               {
                  "id": 1,
                  "status": true,
                  "value": "Previous Project Number"
               },
               {
                  "id": 2,
                  "status": true,
                  "value": "RapidRemark"
               },
               {
                  "id": 3,
                  "status": true,
                  "value": "Box"
               }
            ],
            "tooltip": "dsaewe",
            "template_id": 1,
            "key": "dropdown",
            "last_modified_date": "2019-06-21 11:05:04",
            "value": 1,
            "settings": {
               "mandatory": null
            }
         },
         {
            "id": "5d0cb9364ada351f225a6462",
            "label": "Previous Project Name",
            "ui_element_id": "5b30e242c9a82919448c9405",
            "type": "Single Line Text",
            "status": true,
            "options": [
               {
                  "id": 2,
                  "value": "File Source",
                  "status": true
               },
               {
                  "id": 3,
                  "value": "category",
                  "status": true
               },
               {
                  "id": 4,
                  "value": "AdSiZe",
                  "status": false
               },
               {
                  "id": 4,
                  "value": "abcdefgh",
                  "status": "true"
               },
               {
                  "id": 5,
                  "value": "abcdef",
                  "status": "false"
               }
            ],
            "tooltip": "",
            "template_id": 2,
            "key": "single_line_text",
            "last_modified_date": "2019-07-16 14:27:30",
            "value": "",
            "settings": null
         }
      ]
   };
   public forms: FormGroup;
   public editAddressForm: FormGroup;

   promise: any = undefined;

   constructor(
      private _fb: FormBuilder,
      private _commonService: CommonService,
      private _dialogRef: MatDialogRef<WopNotificationsComponent>,
      @Inject(MAT_DIALOG_DATA) public data
   ) { }

   ngOnInit() {
      this.createDynamicForm();
      this.editAddress(this.data.selectedMsg.html_code.address);
      this.data.selectedMsg.html_code.specDt.map((val, i) => {
         this.ids.setControl(i, new FormControl(val.spectDt.id));
         this.defaults.setControl(val.spectDt.id, this._fb.group(this.createFormBuilder(val.spectDt, val.form_save_values)));
         this.defaults.setControl(val.id, this._fb.group(this.createFormBuilder(val)));
      });
      this.fileTypeChange(this.data.selectedMsg.html_code.specDt);
   }

   close() {
      this._dialogRef.close();
   }

   createDynamicForm() {
      this.forms = this._fb.group({
         spec_ids: this._fb.array([]),
         defaults: this._fb.group({})
      });
   }

   setAddress(data) {
      this.editAddressForm.patchValue(updateForm(this.addressForm, data), { emitEvent: false });
   }

   editAddress(address: any = {}) {
      this.editAddressForm = this._fb.group(buildForm(this.addressForm));

      this.editAddressForm.controls.country_id.valueChanges.subscribe(val => {
         address.country_name = this.getCountryName('countries', val);
         this.getCountryState(val);
      });

      this.editAddressForm.controls.state_id.valueChanges.subscribe(val => {
         address.state_name = this.getCountryName('states', val);
      })

      if (address) {
         if (address.country_id) this.getCountryState(address.country_id);
         this.setAddress(address);
      }

      this.getAddressDropdowns(this.addressApiCalls);
   }

   getCountryState(id) {
      this._commonService.getApi('getStates/' + id, {})
         .then(res => {
            if (res['result'].success) {
               this.dropdowns.states = res['result'].data || []
            }
         })
   }

   getCountryName(prop, id) {
      const country = _.find(this.dropdowns[prop], ['id', id])
      if (country) return country.name;
      else return '';
   }

   getAddressDropdowns(arr) {
      this.getApiCalls(arr);
   }

   getApiCalls(arr: Array<ApiCallBase>, canEnter = false) {
      let apiCalls = [];
      arr.map(api => {
         if (api.method == 'get') apiCalls.push(this._commonService.getApi(api.url, api.params))
         else if (api.method == 'post') apiCalls.push(this._commonService.saveApi(api.url, api.params))
         else if (api.method == 'delete') apiCalls.push(this._commonService.deleteApi(api.url, api.params))
      });

      forkJoin(apiCalls)
         .subscribe(data => {
            data.map((o, i) => {
               if (arr[i].responseKey) this.dropdowns[arr[i].key] = o['result'].data[arr[i].responseKey] || [];
               else this.dropdowns[arr[i].key] = [...o['result'].data] || [];
            })
         })
   }

   get ids() {
      return this.forms.get('spec_ids') as FormArray;
   }

   get defaults() {
      return this.forms.get('defaults') as FormGroup;
   }

   createFormBuilder(spec, data: any = {}) {
      let controls = {
         id: spec.id,
         layout: spec.layout || 1
      };

      const settings: any = {};
      if (spec.settings) {
         Object.keys(spec.settings).map(key => {
            settings[key] = spec.settings[key] || false;
         })
      }
      controls['settings'] = this._fb.group(settings);

      if (spec.key == 'checkboxes') {
         const group = {};
         spec.options.map(option => {
            let indx = -1;
				if (data.value && Array.isArray(data.value)) {
					indx = data.value.indexOf(option.id);
					if (indx > -1) group[option.id] = true;
					else group[option.id] = false;
				} else if (spec.value && Array.isArray(spec.value)) {
					indx = spec.value.indexOf(option.id);
					if (indx > -1) group[option.id] = true;
					else group[option.id] = false;
				} else {
					group[option.id] = Object.keys(spec.value).length ? spec.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
				}
         });
         controls['value'] = this._fb.group(group);
      } else if (spec.key == 'group') {
         const groupControls = [];
         spec.options.map((option, i) => {
            const res = _.find(spec.value, ['id', option.id]);
            if (res) groupControls.push(this._fb.group((this.createFormBuilder(option))));
            else {
               const defaultValues = {
                  id: option.id,
                  layout: 1,
                  settings: {},
                  value: spec.key == 'auto_suggest' ? [] : spec.key == 'checkboxes' ? {} : ''
               }
               if (option.settings) {
                  Object.keys(option.settings).map(key => {
                     defaultValues.settings[key] = false;
                  })
               }
               groupControls.push(this._fb.group((this.createFormBuilder(option))));
            }
         })
         controls['value'] = this._fb.array(groupControls);
      } else if (spec.template_id == 1) {
			controls['value'] = data.value ? (Array.isArray(data.value) ? (data.value.length ? data.value[0] : '') : data.value) : (Array.isArray(spec.value) ? (spec.value.length ? spec.value[0] : '') : spec.value);
		} else {
         controls['value'] = spec.template_id == 3 ? (data ? [data.value] : [spec.value]) : (data ? data.value : spec.value);
      }
      if (spec.template_id == 3 || spec.key == 'dropdown') {
         spec.options.map(opt => { opt.name = opt.value; });
         if (data) {
            const name = spec.options.filter(o => { return o.id == data.value });
            data.display_name = name.length ? name[0].value : '---';
         } else {
            data.display_name = '---';
         }
      }
      return controls;
   }

   fileTypeChange(specDetails) {
      const val = (<FormGroup>this.defaults.controls['5d0cb34d4ada357ac0096c25']).controls.value.value;
      const specData = specDetails.filter(spec => {
         return spec.spectDt.id == '5d0cb34d4ada357ac0096c25';
      });
      const fileSourceSpec = specDetails.filter(spec => {
         return spec.spectDt.id == '5d0cb9364ada351f225a6462';
      });
      if (fileSourceSpec.length) {
         let label = '', value = '';
         if (val == 1) label = 'Previous Project Number';
         else if (val == 2) {
            label = 'RapidRemark Job Name';
            // if (this.state.projectID)
            // 	value = specData[0].form_save_values.value || this.state.selectedTask.job_no;
         }
         else if (val == 3) label = 'Box Link';
         fileSourceSpec[0].spectDt.label = label;
         this.defaults.controls['5d0cb9364ada351f225a6462'].patchValue({
            value: fileSourceSpec[0].form_save_values.value || value
         });
      }
      (<FormGroup>this.defaults.controls['5d0cb34d4ada357ac0096c25']).controls.value.valueChanges.subscribe(val => {
         if (specData.length) {
            const option = _.find(specData[0].spectDt.options, ['id', val]);
            if (option) {
               if (fileSourceSpec.length) {
                  let label = '', value = '';
                  if (val == 1) label = 'Previous Project Number';
                  else if (val == 2) {
                     label = 'RapidRemark Job Name';
                     // if (this.state.projectID)
                     // 	value = this.state.selectedTask.job_no;
                  }
                  else if (val == 3) label = 'Box Link';
                  fileSourceSpec[0].spectDt.label = label;
                  this.defaults.controls['5d0cb9364ada351f225a6462'].patchValue({
                     value: value
                  });
               }
            }
         }
      })
   }

   save() {
      if (!this.promise) {
         const params = {
            thread_id: this.data.thread.thread_id,
            id: this.data.selectedMsg.id,
            form_data: {
               form_save_values: objectToArray(this.ids.value, this.defaults.value),
               spec_ids: this.ids.value,
               address: { ...this.editAddressForm.value, ...{ country_name: this.data.selectedMsg.html_code.address.country_name, state_name: this.data.selectedMsg.html_code.address.state_name } }
            }
         };
         params.form_data.form_save_values.map(o => {
            const spec = _.find(this.data.selectedMsg.html_code.specDt, ['spectDt.id', o.id]);
            if (spec && spec.spectDt.template_id == 1) {
               if (spec.spectDt.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
               else o.value = o.value ? [o.value] : [];
            }
         })
         this.promise = this._commonService.saveApi('saveWop', params)
            .then(res => {
               this.promise = undefined;
               if (res['result'].success) {
                  this._dialogRef.close({ success: true, data: params.form_data });
               }
            })
            .catch(res => {
               this.promise = undefined;
            })
      }
   }

}
