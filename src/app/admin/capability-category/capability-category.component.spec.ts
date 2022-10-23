import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CapabilityCategoryComponent } from './capability-category.component';

describe('CapabilityCategoryComponent', () => {
  let component: CapabilityCategoryComponent;
  let fixture: ComponentFixture<CapabilityCategoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CapabilityCategoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CapabilityCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
