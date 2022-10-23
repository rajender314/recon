import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSpecificationComponent } from './create-specification.component';

describe('CreateSpecificationComponent', () => {
  let component: CreateSpecificationComponent;
  let fixture: ComponentFixture<CreateSpecificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateSpecificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpecificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
