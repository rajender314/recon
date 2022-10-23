import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';

import { HeaderComponent } from '@app/common/header/header.component';
import { LogoutDialogComponent } from './header/logout-dialog/logout-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { CreateThreadComponent } from '@app/common/header/create-thread/create-thread.component';
import { FileUploadModule } from 'ng2-file-upload';
import { UserProfileInfoComponent } from './user-profile-info/user-profile-info.component';
import { UserPerferencesComponent } from './user-perferences/user-perferences.component';
import { UsersModule } from '@app/users/users.module';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FileUploadModule,
    UsersModule,
    SharedModule
  ],
  declarations: [
    HeaderComponent,
    LogoutDialogComponent,
    CreateThreadComponent,
    PageNotFoundComponent,
    UserProfileInfoComponent,
    UserPerferencesComponent
  ],
  exports: [
    HeaderComponent,
    PageNotFoundComponent
  ],
  entryComponents: [LogoutDialogComponent, CreateThreadComponent]
})
export class AppCommonModule { }
