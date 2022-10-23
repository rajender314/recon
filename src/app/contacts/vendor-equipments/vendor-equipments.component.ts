import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';

import * as _ from 'lodash';
import { clearFormGroup, objectToArray, checkedLength } from '@app/admin/admin.config';
import { ContactsService } from '@app/contacts/contacts.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { DeleteComponent } from '@app/contacts/delete/delete.component';

@Component({
	selector: 'app-vendor-equipments',
	templateUrl: './vendor-equipments.component.html',
	styleUrls: ['./vendor-equipments.component.scss']
})
export class VendorEquipmentsComponent implements OnChanges {

	@Input() tabDetails: any;
	@Input() editable: boolean;
	@Input() form: FormGroup;
	@Output() onUpdate = new EventEmitter<any>();
	@Output() noEqData = new EventEmitter<boolean>();

	activeEdit: boolean = false;
	fetchingSpecs: boolean = false;
	submitted: boolean = false;

	constructor(
		private route: ActivatedRoute,
		private fb: FormBuilder,
		private dialog: MatDialog,
		private contactService: ContactsService
	) { }

	ngOnChanges() { 
	}

	get ids() { return this.form.get('spec_ids') as FormArray }

	public get defaults(): FormGroup {
		return this.form.get('defaults') as FormGroup;
	}

	getSpecs(item, index, cb) {
		this.fetchingSpecs = true;
		this.contactService.getApi('orgEquipspecsDt', { id: item.id })
			.then(res => {
				this.fetchingSpecs = false;
				if (res.result.success) {
					this.tabDetails.selected = res.result.data;
					this.createControls(this.tabDetails.selected, index);
					if (cb) cb();
				}else{
					this.tabDetails.selected.specs = [];
				}
			})
	}

	createFormBuilder(data, spec) {
		let controls = {
			id: data.id,
			layout: data.layout || 1
		};

		const settings: any = {};
		if (spec.settings) {
			Object.keys(spec.settings).map(key => {
				settings[key] = data.settings[key] || false;
			})
		}
		controls['settings'] = this.fb.group(settings);

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
					group[option.id] = Object.keys(data.value).length ? data.value[option.id] || false : Object.keys(spec.value).length ? spec.value[option.id] || false : false;
				}
			});
			controls['value'] = this.fb.group(group);
		} else if (spec.key == 'group') {
			const groupControls = [];
			spec.options.map((option, i) => {
				const res = _.find(data.value, ['id', option.id]);
				if (res) groupControls.push(this.fb.group((this.createFormBuilder(res, option))));
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
					groupControls.push(this.fb.group((this.createFormBuilder(defaultValues, option))));
				}
			})
			controls['value'] = this.fb.array(groupControls);
		} else if (spec.template_id == 1) {
			controls['value'] = data.value ? (Array.isArray(data.value) ? (data.value.length ? data.value[0] : '') : data.value) : (Array.isArray(spec.value) ? (spec.value.length ? spec.value[0] : '') : spec.value);
		} else {
			// controls['value'] = spec.template_id == 3 ? [data.value] || [spec.value] : data.value || spec.value;
			const validators = [];
			if (settings.mandatory) validators.push(Validators.required);
			controls['value'] = spec.template_id == 3 ? new FormControl(data.value, validators) || new FormControl(spec.value, validators) : new FormControl(data.value, validators) || new FormControl(spec.value, validators);
		}
		if (spec.template_id == 3 || spec.key == 'dropdown') spec.options.map(opt => { opt.name = opt.value; })
		return controls;
	}

	createControls(item, indx) {
		// this.tabDetails.selected = item;
		this.tabDetails.selected['index'] = indx;
		this.tabDetails.selected.specs.map((val, i) => {
			this.ids.setControl(i, new FormControl(val.id));
			this.defaults.setControl(val.id, this.fb.group(this.createFormBuilder(val.form_save_values, val)));
		})
		/*this.tabDetails.selected['spec_ids'].map((val, i) => {
			const spec = _.find(this.tabDetails.selected['specs'], ['id', val]);
			if (spec) {
				const specsData = _.find(this.tabDetails.selected['values'], ['id', val]);
				this.defaults.setControl(val, this.fb.group(this.createFormBuilder(specsData, spec)));
			}
		});*/
	}

	closeEquipment(item) {
		let prev = _.find(this.tabDetails.list, ['isOpen', true]);
		if (prev && item.id != prev.id)
			delete prev.isOpen;
	}

	performAction(ev, action, indx) {
		ev.stopPropagation();
		const item = this.tabDetails.list[indx];
		this.closeEquipment(item);
		this.activeEdit = false;
		if (action == 'show') {
			item.isOpen = !item.isOpen;
			clearFormGroup(this.defaults);
			if (item.isOpen) {
				this.getSpecs(item, indx, () => {
					this.defaults.disable();
				});
				/*this.createControls(item, indx);
				this.defaults.disable();*/
			}
		} else if (action == 'edit') {
			if (!Object.keys(this.defaults.controls).length) {
				item.isOpen = true;
				this.getSpecs(item, indx, () => {
					this.defaults.enable();
				});
				// this.createControls(item, indx);
			}
			this.defaults.enable();
			this.activeEdit = true;
		} else if (action == 'delete') {
			this.dialog.open(DeleteComponent, {
				panelClass: 'my-dialog',
				width: '500px',
				data: {
					id: item['id'],
					org_id: this.route.parent.snapshot.params.id,
					title: 'Delete Equipment',
					name: item['display_name'],
					call: 'deleteOrgEquipSpec'
				}
			})
				.afterClosed()
				.subscribe(res => {
					if (res && res.success) {
						const indx = _.findIndex(this.tabDetails.list, { id: item['id'] });
						if (indx > -1) {
							this.tabDetails.list.splice(indx, 1);
							this.onUpdate.emit('delete');
							if (!this.tabDetails.list.length)
								this.noEqData.emit(true);
						}
					}
				})
		}
	}

	reset() {
		let resetValues = {};
		this.activeEdit = false;
		this.tabDetails.selected['specs'].map(val => {
			resetValues[val.id] = val.form_save_values;
		});
		this.defaults.reset(resetValues);
		this.defaults.markAsPristine();
		this.defaults.disable();
	}

	save() {
		this.submitted = true;
		if (this.defaults.valid) {
			this.submitted = false;
			const params = {
				org_id: this.route.parent.snapshot.params.id,
				id: this.tabDetails.selected['id'],
				values: objectToArray(this.tabDetails.selected['spec_ids'], this.defaults.value)
			}
			params.values.map(o => {
				const spec = _.find(this.tabDetails.selected.specs, ['id', o.id]);
				if (spec && spec.template_id == 1) {
					if (spec.key == 'checkboxes') o.value = Object.keys(checkedLength(o.value)).map(o => Number(o));
					else o.value = o.value ? [o.value] : [];
				}
			})
			this.activeEdit = false;
			this.contactService.saveApi('updateOrgEquipSpec', params)
				.then(res => {
					if (res.result.success) {
						this.onUpdate.emit('update');
						this.tabDetails.list[this.tabDetails.selected['index']] = res.result.data;
						this.defaults.markAsPristine();
						this.defaults.disable();
					}
				})
		}
	}

}
