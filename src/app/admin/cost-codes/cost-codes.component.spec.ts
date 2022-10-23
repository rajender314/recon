import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CostCodesComponent } from './cost-codes.component';

describe('CostCodesComponent', () => {
  let component: CostCodesComponent;
  let fixture: ComponentFixture<CostCodesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CostCodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CostCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
