import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckScheduleComponent } from './check-schedule.component';

describe('CheckScheduleComponent', () => {
  let component: CheckScheduleComponent;
  let fixture: ComponentFixture<CheckScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
