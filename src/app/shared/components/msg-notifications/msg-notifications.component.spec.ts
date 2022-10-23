import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MsgNotificationsComponent } from './msg-notifications.component';

describe('MsgNotificationsComponent', () => {
  let component: MsgNotificationsComponent;
  let fixture: ComponentFixture<MsgNotificationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MsgNotificationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MsgNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
