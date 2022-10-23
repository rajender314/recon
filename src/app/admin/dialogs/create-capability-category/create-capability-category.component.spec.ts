import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCapabilityCategoryComponent } from './create-capability-category.component';

describe('CreateCapabilityCategoryComponent', () => {
  let component: CreateCapabilityCategoryComponent;
  let fixture: ComponentFixture<CreateCapabilityCategoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateCapabilityCategoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateCapabilityCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
