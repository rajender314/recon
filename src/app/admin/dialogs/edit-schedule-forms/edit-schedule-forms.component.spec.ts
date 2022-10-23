import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditScheduleFormsComponent } from './edit-schedule-forms.component';

describe('EditScheduleFormsComponent', () => {
  let component: EditScheduleFormsComponent;
  let fixture: ComponentFixture<EditScheduleFormsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditScheduleFormsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditScheduleFormsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
