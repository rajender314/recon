import { Component, ViewChild, ViewContainerRef, AfterViewInit, ElementRef } from "@angular/core";
import { AgEditorComponent } from "ag-grid-angular";

import * as _ from 'lodash';
import * as _moment from 'moment';
import { OwlDateTimeComponent } from "ng-pick-datetime";
import { HttpClient } from '@angular/common/http';

var APP: any = window['APP'];;

@Component({
    selector: 'ag-pi-select',
    template: `<div class="ag-pi-custom-select"><pi-select [idKey]="params.idKey || 'id'" [nameKey]="params.nameKey || 'name'" #selectInput class="grid-select-fild" [options]="options"
    [(ngModel)]="value" (onChange)="afterSelection($event)"></pi-select></div>`,
    styles: [
        `:ng-host {
            width: 100%;height: 100%;
        }`
    ]
})
export class AgPiSelect implements AgEditorComponent, AfterViewInit {
    @ViewChild('selectInput') selectInput: any;
    params: any;
    value: any;
    options: Array<any> = [];
    constructor(private _http: HttpClient) {}
    agInit(params) {
        this.params = params;
        if(params.isAjax) {
            const params = this.setParams();
            this.getOptions(this.params.ajaxUrl, params);
        } else {
            this.options = params.options || [];
        }
        this.value = params.value;
    }

    setParams() {
        let params = {};
        if(this.params.ajaxParams) params = {...this.params.ajaxParams};
        if(this.params.extraParams) this.params.extraParams.map(key => {
            params[key] = this.params.data[key];
        })
        return params;
    }

    getOptions(url, params) {
        this._http.get((APP.api_url + url), {params: params})
        .subscribe(res => {
            if(res['result'].success) {
                this.options = res['result'].data || [];
                this.options.map(o => {
                    o.display_name = ('Option ' + o.option_no);
                })
            }
        })
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.selectInput.searchFocus(this.selectInput.elementRef.nativeElement);
        }, 20);
    }
    isPopup(): boolean {
        return false;
    }
    isCancelBeforeStart(): boolean {
        return false;
    }
    getValue(): string {
        return this.value;
    }
    afterSelection(val) {
        if(this.params.isAjax) {
            const option = _.find(this.options, ['id', val]);
            if(option) {
                this.params.data.option_no = 'Option ' + option.option_no;
                this.params.data.cost = option.bid_amount;
            }
        }
        setTimeout(() => {
            this.params.stopEditing();
        });
    }
}

@Component({
    selector: 'ag-pi-input',
    template: `<div class="grid-edit-number" style="padding: 0;">
                    <input #input [(ngModel)]="value" style="width: 100%;height: 39px;border-radius: 0; padding: 0 4px;">
                </div>`,
    styles: []
})
export class AgPiInput implements AgEditorComponent, AfterViewInit {
    @ViewChild('input', { read: ViewContainerRef }) public input;
    params: any;
    value: any;
    agInit(params) {
        this.params = params;
        this.value = params.value;
    }
    ngAfterViewInit() {
		setTimeout(() => {
			this.input.element.nativeElement.focus();
		})
	}
    isPopup(): boolean {
        return false;
    }
    isCancelBeforeStart(): boolean {
        return false;
    }
    getValue(): string {
        return this.value;
    }
}

@Component({
    selector: 'ag-owl-date-time-picker',
    template: `<pi-form-field [label]=" " class="date-field">
                    <input pi-input matInput [min]="minDate" [max]="maxDate" [owlDateTime]="picker" 
                        [(ngModel)]="value" [owlDateTimeTrigger]="picker" (dateTimeChange)="onSelectChange()" 
                        placeholder="Choose a date">
                    <div class="owl-picker-toggle">
                        <i class="pixel-icons icon-calendar" [owlDateTimeTrigger]="picker"></i>
                    </div>
                    <owl-date-time #picker (afterPickerClosed)="closePicker()" [hour12Timer]="true"></owl-date-time>
                </pi-form-field>`,
    styles: []
})
export class AgOwlDateTimePicker implements AgEditorComponent, AfterViewInit {
    @ViewChild('picker', { read: OwlDateTimeComponent }) picker: OwlDateTimeComponent<Date>;
    params: any;
    value: any;
    minDate = new Date();
    maxDate = null;
    agInit(params) {
        this.params = params;
        this.value = new Date(this.params.value);
    }
    ngAfterViewInit() {
        setTimeout(() => {
            this.picker.open();
        }, 200);
    }
    isPopup(): boolean {
        return false;
    }
    isCancelBeforeStart(): boolean {
        return false;
    }
    getValue() {
        return this.value;
    }
    onSelectChange(): void {
        this.params.setValue(_moment(this.value).format('MMM DD, YYYY hh:mm:ss'));
    }
    closePicker() {
        setTimeout(() => {
            this.params.stopEditing();
        });
    }
    
}

@Component({
    selector: 'ag-pi-price-format',
    template: `<input #input [appPriceFormat]="priceConfig" pi-input [(ngModel)]="value">`
})
export class AgPiPriceFormat implements AgEditorComponent, AfterViewInit {
    @ViewChild('input', { read: ViewContainerRef }) public input;
    params: any;
    value: any;
    priceConfig = {
        prifix: '$',
        limit: false,
        centsLimit: 2
    }
    agInit(params) {
        this.params = params;
        this.value = params.value;
        this.priceConfig = {...this.priceConfig, ...params.priceConfig};
    }
    ngAfterViewInit() {
		setTimeout(() => {
			this.input.element.nativeElement.focus();
		})
	}
    isPopup(): boolean {
        return false;
    }
    isCancelBeforeStart(): boolean {
        return false;
    }
    getValue() {
        return this.value;
    }
}