import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRelatedProjectsComponent } from './create-related-projects.component';

describe('CreateRelatedProjectsComponent', () => {
  let component: CreateRelatedProjectsComponent;
  let fixture: ComponentFixture<CreateRelatedProjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateRelatedProjectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRelatedProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
