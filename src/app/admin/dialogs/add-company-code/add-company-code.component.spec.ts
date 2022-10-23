import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCompanyCodeComponent } from './add-company-code.component';

describe('AddCompanyCodeComponent', () => {
  let component: AddCompanyCodeComponent;
  let fixture: ComponentFixture<AddCompanyCodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCompanyCodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCompanyCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
