import { Directive, Input, HostListener, ElementRef } from '@angular/core';

@Directive({
	selector: '[appAllowNumbers]'
})
export class AllowNumbersDirective {

	constructor(private el: ElementRef) { }

	@Input() appAllowNumbers: boolean;
	@Input('decimal') decimal: any;

	@HostListener('keydown', ['$event']) onKeyDown(event) {
		let e = <KeyboardEvent>event;
		let position = this.el.nativeElement.selectionStart;
		let allowZero = this.el.nativeElement.getAttribute('zero') ? this.el.nativeElement.getAttribute('zero') === 'true' : true;
		if (this.appAllowNumbers) {
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
				// Disable Dot at position 0 and duplicate
				if (e.keyCode == 110 || e.keyCode == 190) {
					if (position == 0) e.preventDefault();
					else if (e.key == '>') e.preventDefault();
					else {
						const duplicate = this.el.nativeElement.value.split('.');
						if (duplicate.length > 1) e.preventDefault();
					}
				}
				return;
			}
			// Ensure that it is a number and stop the keypress
			if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
				e.preventDefault();
			} else if (!allowZero) {
				if (position == 0 && (e.keyCode == 96 || e.keyCode == 48)) e.preventDefault();
			} /*else if (this.isPriceInput) {
				if (!this.lengthCheck(this.el.nativeElement.value)) {
					e.preventDefault();
				}
			}*/

			if (this.decimal) {
				const decimalCheck = this.el.nativeElement.value.split('.');
				if (decimalCheck.length > 1) if (position > decimalCheck[0].length && decimalCheck[1].length >= this.decimal) e.preventDefault();
			}
		}
	}

	@HostListener('blur', ['$event']) onblur(event) {
		const decimal = this.el.nativeElement.value.split('.');
		if (decimal.length > 1) {
			if (!decimal[1].length) this.el.nativeElement.value = this.el.nativeElement.value.concat('00');
		}
	}

}
