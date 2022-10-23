import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductServiceComponent } from './product-service.component';

describe('ProductServiceComponent', () => {
  let component: ProductServiceComponent;
  let fixture: ComponentFixture<ProductServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
