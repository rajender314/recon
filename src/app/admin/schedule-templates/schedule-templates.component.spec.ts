import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTemplatesComponent } from './schedule-templates.component';

describe('ScheduleTemplatesComponent', () => {
  let component: ScheduleTemplatesComponent;
  let fixture: ComponentFixture<ScheduleTemplatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduleTemplatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
