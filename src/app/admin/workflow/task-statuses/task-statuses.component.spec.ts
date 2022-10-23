import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskStatusesComponent } from './task-statuses.component';

describe('TaskStatusesComponent', () => {
  let component: TaskStatusesComponent;
  let fixture: ComponentFixture<TaskStatusesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskStatusesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskStatusesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
