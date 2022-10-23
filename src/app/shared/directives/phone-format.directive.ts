import { Directive, Input, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appPhoneFormat]'
})
export class PhoneFormatDirective {

  constructor(private el: ElementRef) { }

	@Input() appPhoneFormat: boolean;
  @HostListener('keyup', ['$event']) onkeyup(event) {
    this.phoneFormat();
  };
	@HostListener('keydown', ['$event']) onkeydown(event) {
		let e = <KeyboardEvent>event;
		let position = this.el.nativeElement.selectionStart;
		let allowZero = this.el.nativeElement.getAttribute('zero') ? this.el.nativeElement.getAttribute('zero') === 'true' : true;
		if (this.appPhoneFormat) {
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
        if(e.keyCode == 8){
          // this.phoneFormat(true);
          let str = this.el.nativeElement.value;
          if (position == 3 || position == 7) e.preventDefault();
          else if(str.length == 8 || str.length == 4) {
            this.el.nativeElement.value = this.removeLastChar(str);
          }else {
            // this.phoneFormat(true);
          }

        }
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
      }
      this.phoneFormat();

		}
  }

  removeLastChar(str) {
    return str.substring(0, str.length - 1);
  }
  
  phoneFormat(){
    let phoneNumber = this.el.nativeElement.value;
    let phoneNumberArr = phoneNumber.split('').filter((num)=>{
      return num!='-';
    });
    if(phoneNumberArr.length>=3){
      phoneNumberArr.splice(2,0,'-');
    }
    if(phoneNumberArr.length>=7){
      phoneNumberArr.splice(6,0,'-');
    }
    this.el.nativeElement.value = phoneNumberArr.join('')
  }

}
