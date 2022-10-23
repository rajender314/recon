import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadInsertionOrderComponent } from './upload-insertion-order.component';

describe('UploadInsertionOrderComponent', () => {
  let component: UploadInsertionOrderComponent;
  let fixture: ComponentFixture<UploadInsertionOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadInsertionOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadInsertionOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
