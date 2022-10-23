import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WopNotificationsComponent } from './wop-notifications.component';

describe('WopNotificationsComponent', () => {
  let component: WopNotificationsComponent;
  let fixture: ComponentFixture<WopNotificationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WopNotificationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WopNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
