import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiscExpensesComponent } from './misc-expenses.component';

describe('MiscExpensesComponent', () => {
  let component: MiscExpensesComponent;
  let fixture: ComponentFixture<MiscExpensesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiscExpensesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiscExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
