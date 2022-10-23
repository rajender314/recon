import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestApprovalComponent } from './request-approval.component';

describe('RequestApprovalComponent', () => {
  let component: RequestApprovalComponent;
  let fixture: ComponentFixture<RequestApprovalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestApprovalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
