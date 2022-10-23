import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestBidsComponent } from './request-bids.component';

describe('RequestBidsComponent', () => {
  let component: RequestBidsComponent;
  let fixture: ComponentFixture<RequestBidsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestBidsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestBidsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
