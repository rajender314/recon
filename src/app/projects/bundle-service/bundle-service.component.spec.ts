import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleServiceComponent } from './bundle-service.component';

describe('BundleServiceComponent', () => {
  let component: BundleServiceComponent;
  let fixture: ComponentFixture<BundleServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BundleServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BundleServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
