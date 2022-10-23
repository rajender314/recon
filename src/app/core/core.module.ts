import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageModule } from '@app/core/language/language.module';
import { DialogsModule } from '@app/dialogs/dialogs.module';

@NgModule({
  imports: [
    CommonModule,
    DialogsModule
  ],
  declarations: [],
  exports: [
    LanguageModule
  ]
})
export class CoreModule { }
