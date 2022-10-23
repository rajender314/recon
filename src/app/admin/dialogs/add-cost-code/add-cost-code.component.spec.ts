import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCostCodeComponent } from './add-cost-code.component';

describe('AddCostCodeComponent', () => {
  let component: AddCostCodeComponent;
  let fixture: ComponentFixture<AddCostCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCostCodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCostCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
