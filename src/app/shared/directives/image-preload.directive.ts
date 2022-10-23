import { Directive, Input, HostBinding } from '@angular/core';

@Directive({
  selector: 'img[default]',
  host: {
    '(error)': 'updateUrl()',
    '(load)': 'load()',
    '[src]': 'src'
  }
})
export class ImagePreloadDirective {

  constructor() {
   }

  @Input() src: string;
  @Input() default: string;
  @HostBinding('class') className

  updateUrl() {
    this.src = this.default;
  }
  load() {
    this.className = 'image-loaded';
  }

}
