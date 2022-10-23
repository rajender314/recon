import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule, CanActivateTeam } from '@app/app-routing.module';
import { SharedModule } from '@app/shared/shared.module';

import { TokenInterceptor } from '@app/core/auth/token.interceptor';

import { AppComponent } from '@app/app.component';
import { CoreModule } from '@app/core/core.module';

import { AppCommonModule } from '@app/common/common.module';

import { LicenseManager } from "ag-grid-enterprise";

LicenseManager.setLicenseKey("Enterpi_Software_Solutions_Private_Limited_MultiApp_1Devs21_August_2019__MTU2NjM0MjAwMDAwMA==f0a6adf3f22452a5a3102029b1a87a43");

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HttpClientModule,
    BrowserAnimationsModule,
    CoreModule,
    AppCommonModule,
    SharedModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    CanActivateTeam
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
