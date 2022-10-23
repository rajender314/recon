import { AfterViewInit, Component, ViewChild, ViewContainerRef } from "@angular/core";

import { ICellEditorAngularComp } from "ag-grid-angular";

@Component({
	selector: 'app-numeric-cell-editor',
	template: `<div class="grid-edit-number"><input  #input [appPriceFormat]="numberConfig" [(ngModel)]="value" style="width: 100%; min-height:30px; height: 100%;"></div>`,
	styles: []
})
export class NumericCellEditorComponent implements ICellEditorAngularComp, AfterViewInit {
//  (keydown)="onKeyDown($event)"
	constructor() { }
	public numberConfig: any = {
		limit: false,
		prefix: '',
		centsLimit: 9
	}
	private params: any;
	public value: number;
	private cancelBeforeStart: boolean = false;
	public allowZero: boolean = true;
	public limit: number = null;

	@ViewChild('input', { read: ViewContainerRef }) public input;


	agInit(params): void {
		this.params = params;
		this.value = this.params.value;
		this.allowZero = params.column.colDef.cellRendererParams?params.column.colDef.cellRendererParams.allowZero:true;
		this.limit = params.column.colDef.cellRendererParams?params.column.colDef.cellRendererParams.decimalLimit:null;
		this.numberConfig.limit = params.column.colDef.cellRendererParams?(params.column.colDef.cellRendererParams.limit || false):false;
		this.numberConfig.prefix = params.column.colDef.cellRendererParams?(params.column.colDef.cellRendererParams.prefix || ''):'';
		this.numberConfig.centsLimit = params.column.colDef.cellRendererParams?(params.column.colDef.cellRendererParams.decimalLimit || 9):9;
		
		// only start edit if key pressed is a number, not a letter
		this.cancelBeforeStart = params.charPress && ('1234567890'.indexOf(params.charPress) < 0);
	}

	getValue(): any {
		return this.value;
	}

	isCancelBeforeStart(): boolean {
		return this.cancelBeforeStart;
	}

	// will reject the number if it greater than 1,000,000
	// not very practical, but demonstrates the method.
	isCancelAfterEnd(): boolean {
		// return this.value > 1000000;
		return false;
	};

	onKeyDown(event): void {
		/*if (!this.isKeyPressedNumeric(event)) {
			if (event.preventDefault) event.preventDefault();
		}*/
		let e = <KeyboardEvent>event;
		let position = this.input.element.nativeElement.selectionStart;
		if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
			// Allow: Ctrl+A
			(e.keyCode == 65 && e.ctrlKey === true) ||
			// Allow: Ctrl+C
			(e.keyCode == 67 && e.ctrlKey === true) ||
			// Allow: Ctrl+X
			(e.keyCode == 88 && e.ctrlKey === true) ||
			// Allow: home, end, left, right
			(e.keyCode >= 35 && e.keyCode <= 39)) {
			// let it happen, don't do anything
			if (e.keyCode == 110) {
				if (position == 0) e.preventDefault();
				else {
					const duplicate = this.input.element.nativeElement.value.split('.');
					if (duplicate.length > 1) e.preventDefault();
				}
			}
			return;
		}
		// Ensure that it is a number and stop the keypress
		if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
			e.preventDefault();
		} else {
			if (!this.allowZero) {
				if (position == 0 && (e.keyCode == 96 || e.keyCode == 48)) e.preventDefault();
			} 
			if(this.limit) {
				let decimal = this.input.element.nativeElement.value.split('.');
				if(decimal.length > 1 && decimal) if(position > decimal[0].length && decimal[1].length >= this.limit) e.preventDefault();
			}
		}
	}

	private formatNumber(number) {
		return Math.floor(number).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	}

	// dont use afterGuiAttached for post gui events - hook into ngAfterViewInit instead for this
	ngAfterViewInit() {
		setTimeout(() => {
			this.input.element.nativeElement.focus();
		})
	}

	private getCharCodeFromEvent(event): any {
		event = event || window.event;
		return (typeof event.which == "undefined") ? event.keyCode : event.which;
	}

	private isCharNumeric(charStr): boolean {
		return !!/\d/.test(charStr);
	}

	private isKeyPressedNumeric(event): boolean {
		const charCode = this.getCharCodeFromEvent(event);
		const charStr = event.key ? event.key : String.fromCharCode(charCode);
		return this.isCharNumeric(charStr);
	}

}
