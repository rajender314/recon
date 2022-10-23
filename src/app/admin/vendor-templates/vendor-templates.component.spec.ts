import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorTemplatesComponent } from './vendor-templates.component';

describe('VendorTemplatesComponent', () => {
  let component: VendorTemplatesComponent;
  let fixture: ComponentFixture<VendorTemplatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorTemplatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
