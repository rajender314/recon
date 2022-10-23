import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyLineItemComponent } from './copy-line-item.component';

describe('CopyLineItemComponent', () => {
  let component: CopyLineItemComponent;
  let fixture: ComponentFixture<CopyLineItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyLineItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyLineItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
