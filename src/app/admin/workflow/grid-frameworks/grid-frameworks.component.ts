import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
	template: `
    	<div class="col-field-multiple">
			<pi-form-field [label]="status.label" *ngFor="let status of statuses" [class.active]="params.value == status.value">
				<input type="radio" [disabled]="isDisable" pi-input [name]="params.data.id" [value]="status.value" [formControl]="statusControl" />
			</pi-form-field>
		</div>
	`,
	styles: [``]
})
export class ButtonGroupComponent {

	params: any;
	statuses = [
		{ label: 'Active', value: true },
		{ label: 'Inactive', value: false },
	]
	statusControl = new FormControl(false);
	isDisable: boolean = false;

	constructor() {
		this.statusControl.valueChanges.subscribe(val => {
			this.onChange(val)
		})
	}

	agInit(params: any): void {
		this.params = params;
		if (this.params.column.colDef.cellRendererParams['isDisable'] != undefined) {
			this.isDisable = this.params.column.colDef.cellRendererParams['isDisable'];
		}
		this.statusControl.patchValue(this.params.value, { emitEvent: false });
	}

	onChange(val) {
		this.params.value = val;
		this.params.data.status = val;
	}

}


@Component({
	template: `
		<div (keydown)="disableDefault($event)">
			<mat-slider [disabled]="isDisable" color="primary" (keydown)="disableDefault($event)" (onTouched)="inputTouched()" (input)="inputPercent()" (change)="changePercent()" [class.full-width]="params.value == 100" class="example-margin" [max]="100" [min]="0" [step]="5" [thumbLabel]="false" [formControl]="percentage"></mat-slider>
			<span [innerHtml]="params.value + '%'"></span>
		</div>`,
	styles: [`
	.mat-slider-horizontal{height: 38px;}
	::ng-deep .mat-slider-horizontal .mat-slider-wrapper{top:16px !important;}
	`]
})
export class ProgressBarComponent {

	percentage = new FormControl('');
	isDisable: boolean = false;
	params: any;

	constructor() {
		this.percentage.valueChanges.subscribe(val => {
			this.onChange(val)
		})
	}

	agInit(params: any): void {
		this.params = params;
		if (this.params.column.colDef.cellRendererParams['isDisable'] != undefined) {
			this.isDisable = this.params.column.colDef.cellRendererParams['isDisable'];
		}
		this.percentage.patchValue(this.params.value, { emitEvent: false });
	}

	disableDefault(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	inputTouched() {
	}

	inputPercent() {
	}

	changePercent() {
	}

	onChange(val) {
		this.params.value = val;
		this.params.data.percentage = val;
	}

}
