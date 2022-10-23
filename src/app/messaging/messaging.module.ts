import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CoreModule } from '@app/core/core.module';
import { SharedModule } from '@app/shared/shared.module';
import { MessagingRoutingModule } from '@app/messaging/messaging-routing.module';
import { MessagingService } from '@app/messaging/messaging.service';
import { ThreadListComponent } from './thread-list/thread-list.component';
import { ThreadDetailComponent } from './thread-detail/thread-detail.component';
import { CreateMessageComponent } from './create-message/create-message.component';
import { MessagingComponent } from './messaging/messaging.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { FileUploadModule } from 'ng2-file-upload';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { LightboxModule } from 'ngx-lightbox';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    CoreModule,
    SharedModule,
    MessagingRoutingModule,
    InfiniteScrollModule,
    FileUploadModule,

    ScrollingModule,
    LightboxModule
  ],
  declarations: [
    ThreadListComponent,
    ThreadDetailComponent,
    CreateMessageComponent,
    MessagingComponent
  ],
  entryComponents: [],
  providers: [
    MessagingService
  ]
})
export class MessagingModule { }
