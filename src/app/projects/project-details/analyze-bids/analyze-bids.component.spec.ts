import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyzeBidsComponent } from './analyze-bids.component';

describe('AnalyzeBidsComponent', () => {
  let component: AnalyzeBidsComponent;
  let fixture: ComponentFixture<AnalyzeBidsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalyzeBidsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzeBidsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
