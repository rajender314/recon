import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMiscExpenseComponent } from './create-misc-expense.component';

describe('CreateMiscExpenseComponent', () => {
  let component: CreateMiscExpenseComponent;
  let fixture: ComponentFixture<CreateMiscExpenseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateMiscExpenseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateMiscExpenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
