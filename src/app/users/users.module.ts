import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule, CanActivateTeam } from './users-routing.module';
import { UsersComponent } from './users.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '@app/shared/shared.module';
import { UserRolesComponent } from './user-roles/user-roles.component';
import { IvieComponent } from './ivie/ivie.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClientsComponent } from './clients/clients.component';
import { VendorsComponent } from './vendors/vendors.component';
import { UsersListComponent } from './users-list/users-list.component';
import { AddUserComponent } from './add-user/add-user.component';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { FileUploadModule } from 'ng2-file-upload';
import { PerferencesComponent } from './perferences/perferences.component';

@NgModule({
  imports: [
    CommonModule,
    UsersRoutingModule,
    InfiniteScrollModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FileUploadModule
  ],
  providers: [
    CanActivateTeam
  ],
  declarations: [UsersComponent, UserRolesComponent, IvieComponent, ClientsComponent, VendorsComponent, UsersListComponent, AddUserComponent, AddNewUserComponent, PerferencesComponent],
  entryComponents: [AddUserComponent, AddNewUserComponent],
  exports:[PerferencesComponent]
})
export class UsersModule { }
