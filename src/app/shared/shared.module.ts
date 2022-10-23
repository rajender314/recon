import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '@app/shared/material/material.module';
import { ComponentsModule } from '@app/shared/components/components.module';
import { DirectivesModule } from "@app/shared/directives/directives.module";
import { PipesModule } from '@app/shared/pipes/pipes.module';

import { PixelKitModule } from 'pixel-kit';
import { ClientAccessComponent } from '@app/users/client-access/client-access.component';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
// import { NgxCurrencyModule, CurrencyMaskConfig } from "ngx-currency";
// import { CURRENCY_MASK_CONFIG } from 'ngx-currency/src/currency-mask.config';

// export const CustomCurrencyMaskConfig: CurrencyMaskConfig = {
//   align: "right",
//   allowNegative: true,
//   allowZero: true,
//   decimal: ".",
//   precision: 2,
//   prefix: "$",
//   suffix: "",
//   thousands: ",",
//   nullable: false
// };

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    MaterialModule,
    DirectivesModule,
    PipesModule,
    PixelKitModule,
    FormsModule,
    // NgxCurrencyModule,
    AgGridModule.withComponents([])
  ],
  declarations: [ClientAccessComponent],
  exports: [
    ComponentsModule,
    MaterialModule,
    DirectivesModule,
    PipesModule,
    PixelKitModule,
    // NgxCurrencyModule,
    ClientAccessComponent
  ],
  providers: [
    // { provide: CURRENCY_MASK_CONFIG, useValue: CustomCurrencyMaskConfig }
  ]
})
export class SharedModule { }
