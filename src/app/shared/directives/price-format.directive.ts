import { Directive, ElementRef, HostListener, Input, SimpleChanges } from '@angular/core';
import { NgControl } from '@angular/forms';

import { toCurrency, getCursorPosition, setCursorPosition } from '@app/shared/directives/price-format.helper';

@Directive({
	selector: '[appPriceFormat]'
})
export class PriceFormatDirective {

	@Input('appPriceFormat') customConfig;

	private config: any = {
		prefix: '$',
		suffix: '',
		thousandsSeparator: ',',
		centsSeparator: '.',
		limit: false,
		centsLimit: 2,
		maxLimit: false,
		maxNumber: 100,
		wrapper: false,
		onKeydown: false,
		onKeyup: false,
		onBlur: false,
		round: false,
		allowRO: false
	}
	private functional = false;
	private round = false;
	private centsLimit;

	constructor(
		private el: ElementRef,
		private control: NgControl
	) {
		this.setCentLimit();
	}

	setCentLimit = () => {
		if (typeof this.config.centsLimit == 'function') {
			this.centsLimit = this.config.centsLimit.cal(this);
		} else {
			this.centsLimit = this.config.centsLimit
		}
		this.centsLimit = isNaN(this.centsLimit) ? 2 : Number(this.centsLimit);
	}

	ngOnChanges(changes: SimpleChanges) {console.log('changes', changes)
		if (changes) {
			if (changes.customConfig) {
				this.config = { ...this.config, ...this.customConfig };
				this.setCentLimit();
				if (this.el.nativeElement.value.length > 0) this.priceIt('init');
			}
		}
	}

	splitNumber = num => {console.log('split num ber', num)
		const pattern = new RegExp('[^0-9\.]', 'g');
		let number = num.replace(pattern, '');
		number = number.split(this.config.centsSeparator);

		return {
			integer: number[0],
			decimal: number[1] ? number[1] : false
		}
	}

	lengthCheck = num => {
		let allow = false;
		let s = this.splitNumber(num);

		if (num == '') allow = true;
		if (!this.config.limit || (s.integer.length && s.integer.length <= this.config.limit)) {
			if (!s.decimal || s.decimal.length <= this.centsLimit)
				allow = true;
		}
		if (this.config.maxLimit) {
			if (num > this.config.maxNumber) {
				allow = false;
			}
		}
		return allow;
	}

	addChar = (num, char, centsSeparator?) => {
		const cursor = getCursorPosition({ target: this.el.nativeElement });
		const newValue = num.substring(0, cursor.start) + char + num.substring(cursor.end);
		let formattedNum = toCurrency({
			prefix: this.config.prefix,
			thousandsSeparator: this.config.thousandsSeparator,
			value: newValue
		});

		if (this.lengthCheck(formattedNum)) {
			setTimeout(() => {
				this.changeValue(formattedNum);
				let newCursor = 0;
				if (centsSeparator) {
					newCursor = formattedNum.indexOf(this.config.centsSeparator) + 1;
				} else {
					newCursor = cursor.start + formattedNum.length - newValue.length + 1;
				}
				setCursorPosition({ target: this.el.nativeElement, position: newCursor });
			});
		} else {
			this.functional = false;
		}

	}

	backButton = val => {
		var cursor = getCursorPosition({ target: this.el.nativeElement });

		let no_positions = 0;
		var ts = false, cs = false;
		if (cursor.start == cursor.end) {
			no_positions++;
			if (val.charAt(cursor.start - 1) == this.config.thousandsSeparator) {
				no_positions++;
				ts = true;
			} else if (val.charAt(cursor.start - 1) == this.config.centsSeparator) {
				cs = true;
			}
		}

		var newNum = val.substring(0, cursor.start - no_positions) + val.substring(cursor.end);
		var formattedNum = toCurrency({
			prefix: this.config.prefix,
			thousandsSeparator: this.config.thousandsSeparator,
			value: newNum
		});

		if (this.lengthCheck(formattedNum)) {
			this.changeValue(formattedNum);

			if (cs) {
				if (formattedNum.length == newNum.length) {
					var newCursor = cursor.start - 1;
				} else if (formattedNum.length > newNum.length) {
					var newCursor = cursor.start;
				} else {
					var newCursor = cursor.start - 2;
				}
			} else {
				var newCursor = cursor.start - (newNum.length - formattedNum.length + no_positions);
			}

			if (formattedNum.charAt(newCursor) == this.config.prefix.substr(-1)) {
				newCursor++;
			}
			setCursorPosition({ target: this.el.nativeElement, position: newCursor });
		} else {
			this.functional = false;
		}
	}

	deleteButton = val => {
		var cursor = getCursorPosition({ target: this.el.nativeElement });

		if ((val.charAt(cursor.start) == this.config.prefix.substr(0, 1)) && (cursor.start == cursor.end)) {
			return;
		} else {
			var no_positions = 0;
			if (cursor.start == cursor.end) {
				no_positions++;
				if (val.charAt(cursor.start) == this.config.thousandsSeparator) {
					no_positions++;
				}
			}
			var newNum = val.substring(0, cursor.start) + val.substring(cursor.end + no_positions);
			var formattedNum = toCurrency({
				prefix: this.config.prefix,
				thousandsSeparator: this.config.thousandsSeparator,
				value: newNum
			});

			if (this.lengthCheck(formattedNum)) {
				this.changeValue(formattedNum);

				var newCursor = cursor.start - (newNum.length - formattedNum.length);
				if (formattedNum.charAt(newCursor) == this.config.prefix.substr(0, 1)) {
					newCursor = newCursor + this.config.prefix.length;
				}
				setCursorPosition({ target: this.el.nativeElement, position: newCursor });
			} else {
				this.functional = false;
			}
		}
	}

	keyCheck = e => {console.log('key check 1', e)
		let code = (e.keyCode ? e.keyCode : e.which);
		let value = this.el.nativeElement.value;
		let decimalIndex = value.indexOf(this.config.centsSeparator);

		if (code >= 96 && code <= 105) {
			code = 48 + code - 96;
		}

		if ((code >= 48 && code <= 57) || code == 8 /* backspace */ || code == 46 /* delete */ || (code == 110 || code == 190) /* dot */) {
			switch (code) {
				case 8:
					this.backButton(value);
					break;
				case 46:
					this.deleteButton(value);
					break;
				default:
					this.otherKeys(value, code);
					break;
			}
		}

		if (code == 9 /* tab */ || (code >= 35 && code <= 40) /*  direction, home, end */) {
			this.functional = true;
		}

		if (code == 13 /* enter */) {
			this.priceIt('enter');
			this.functional = true;
		}

		if (e.ctrlKey) {
			if (code == 65 || code == 67 || code == 86) {
				this.functional = true;
			}
		}

		if (!this.functional) {
			e.preventDefault();
			e.stopPropagation();
		}

		if (e.code=='KeyV') {
			// this.priceIt();
			let numPattern = new RegExp('[^0-9\.]', 'g');
			let newNumber = value.replace(numPattern, '');
			console.log('price it ene wskalk', newNumber, value, e.srcElement.value)
		}
		
	}

	otherKeys = (value, code) => {console.log('other keys', value)
		if (code >= 48 && code <= 57) {
			this.addChar(value, String.fromCharCode(code));
		} else if (code == 110 || code == 190) {
			if (this.centsLimit > 0) {
				let decimalIndex = value.indexOf(this.config.centsSeparator);
				if (value == '') {
					this.addChar(value, "0.", true);
				} else if (decimalIndex == -1) {
					this.addChar(value, ".", true);
				} else {
					this.functional = false;
				}
			}
		}
	}

	priceIt = (flag?) => {console.log('price it', flag)
		let value = this.el.nativeElement.value;
		let formattedNum = toCurrency({
			prefix: this.config.prefix,
			thousandsSeparator: this.config.thousandsSeparator,
			value: this.config.round ? Math.round(Number(this.el.nativeElement.value.currencytoNumber())).toFixed(this.centsLimit) : value,
			strictFormat: true
		});
		if (this.lengthCheck(formattedNum)) {
			this.changeValue(formattedNum, flag);
		} else {
			this.changeValue("", flag);
		}

		if (this.config.suffix) {
			if (formattedNum.indexOf('%') == -1 && formattedNum != '') {
				formattedNum = formattedNum.concat(this.config.suffix);
			}
			this.changeValue(formattedNum, flag);
		}
	}

	changeValue = (val, flag?) => {console.log('change value', val)
		this.control.control.setValue(val.replace(new RegExp("[" + this.config.prefix + this.config.thousandsSeparator + "]", "g"), ''));
		this.el.nativeElement.value = val;
		if (flag != 'init') this.control.control.markAsDirty();
	}

	@HostListener("focus", ["$event.target.value"])
	onFocus(value) {
		if (this.config.suffix)
			this.el.nativeElement.value = this.el.nativeElement.value.replace(this.config.suffix, '');
		if (this.el.nativeElement.value.length > 0) this.priceIt('init');
		// if(this.isPriceInput)
		// this.el.nativeElement.value = this.el.nativeElement.value.replace(this.config.prefix, ''); //this.currencyPipe.parse(value);
	}

	@HostListener("blur", ["$event.target.value"])
	onBlur(value) {
		if (this.config.suffix) {
			this.control.control.setValue(this.el.nativeElement.value.replace('%', ''));
			this.el.nativeElement.value = this.el.nativeElement.value.concat('%');
		}
		// if (value.length && this.isPriceInput)
		// 	this.el.nativeElement.value = this.config.prefix + this.el.nativeElement.value; //this.currencyPipe.transform(value);
	}

	@HostListener('keydown', ['$event'])
	onKeyDown(event) {
		//let e = <KeyboardEvent>event;
		this.keyCheck(event);
	}

}
