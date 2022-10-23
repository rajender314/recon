import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllowNumbersDirective } from '@app/shared/directives/allow-numbers.directive';
import { PriceFormatDirective } from "@app/shared/directives/price-format.directive";
import { ImagePreloadDirective } from '@app/shared/directives/image-preload.directive';
import { CurrencyDirective } from './currency.directive';
import { PhoneFormatDirective } from '@app/shared/directives/phone-format.directive';
import { ResizableDirective } from '@app/shared/directives/resizable.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [AllowNumbersDirective, PriceFormatDirective, ImagePreloadDirective, CurrencyDirective, PhoneFormatDirective,ResizableDirective],
  exports: [AllowNumbersDirective, PriceFormatDirective, ImagePreloadDirective, CurrencyDirective, PhoneFormatDirective,ResizableDirective]
})
export class DirectivesModule { }
