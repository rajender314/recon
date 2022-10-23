import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CostAnalysisGridComponent } from './cost-analysis-grid.component';

describe('CostAnalysisGridComponent', () => {
  let component: CostAnalysisGridComponent;
  let fixture: ComponentFixture<CostAnalysisGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CostAnalysisGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CostAnalysisGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
