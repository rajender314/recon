import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorScheduleComponent } from './vendor-schedule.component';

describe('VendorScheduleComponent', () => {
  let component: VendorScheduleComponent;
  let fixture: ComponentFixture<VendorScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
