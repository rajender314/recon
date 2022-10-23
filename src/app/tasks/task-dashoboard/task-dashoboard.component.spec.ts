import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDashoboardComponent } from './task-dashoboard.component';

describe('TaskDashoboardComponent', () => {
  let component: TaskDashoboardComponent;
  let fixture: ComponentFixture<TaskDashoboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskDashoboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskDashoboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
