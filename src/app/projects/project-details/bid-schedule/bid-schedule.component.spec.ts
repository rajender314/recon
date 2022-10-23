import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BidScheduleComponent } from './bid-schedule.component';

describe('BidScheduleComponent', () => {
  let component: BidScheduleComponent;
  let fixture: ComponentFixture<BidScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BidScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BidScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
