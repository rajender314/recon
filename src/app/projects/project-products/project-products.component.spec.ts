import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectProductsComponent } from './project-products.component';

describe('ProjectProductsComponent', () => {
  let component: ProjectProductsComponent;
  let fixture: ComponentFixture<ProjectProductsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectProductsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
