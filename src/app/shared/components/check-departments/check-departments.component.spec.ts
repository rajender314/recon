import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckDepartmentsComponent } from './check-departments.component';

describe('CheckDepartmentsComponent', () => {
  let component: CheckDepartmentsComponent;
  let fixture: ComponentFixture<CheckDepartmentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckDepartmentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckDepartmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
