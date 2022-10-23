import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyCodesComponent } from './company-codes.component';

describe('CompanyCodesComponent', () => {
  let component: CompanyCodesComponent;
  let fixture: ComponentFixture<CompanyCodesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyCodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
