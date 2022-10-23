import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FromNowPipe } from '@app/shared/pipes/from-now.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { FormatCurrencyPipe } from './format-currency.pipe';
import { DomSearchPipe } from './dom-search.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [FromNowPipe, SafeHtmlPipe, FormatCurrencyPipe, DomSearchPipe],
  exports: [FromNowPipe, SafeHtmlPipe, FormatCurrencyPipe, DomSearchPipe]
})
export class PipesModule { }
