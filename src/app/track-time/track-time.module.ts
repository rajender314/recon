import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrackTimeRoutingModule, CanActivateTeam } from './track-time-routing.module';
import { TrackTimeViewComponent } from './track-time-view/track-time-view.component';
import { SharedModule } from '@app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogsModule } from '@app/dialogs/dialogs.module';

import { FullCalendarModule } from '@fullcalendar/angular';
import { AddTrackTimeComponent } from './add-track-time/add-track-time.component';

@NgModule({
  declarations: [TrackTimeViewComponent, AddTrackTimeComponent],
  imports: [
    CommonModule,
    TrackTimeRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    DialogsModule,
    FullCalendarModule
  ],
  providers: [CanActivateTeam],
  entryComponents: [AddTrackTimeComponent]
})
export class TrackTimeModule { }
