import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopySplitEstimateComponent } from './copy-split-estimate.component';

describe('CopySplitEstimateComponent', () => {
  let component: CopySplitEstimateComponent;
  let fixture: ComponentFixture<CopySplitEstimateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopySplitEstimateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopySplitEstimateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
