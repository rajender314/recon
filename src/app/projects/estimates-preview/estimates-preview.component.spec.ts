import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimatesPreviewComponent } from './estimates-preview.component';

describe('EstimatesPreviewComponent', () => {
  let component: EstimatesPreviewComponent;
  let fixture: ComponentFixture<EstimatesPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EstimatesPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EstimatesPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
