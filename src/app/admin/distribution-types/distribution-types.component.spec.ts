import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributionTypesComponent } from './distribution-types.component';

describe('DistributionTypesComponent', () => {
  let component: DistributionTypesComponent;
  let fixture: ComponentFixture<DistributionTypesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DistributionTypesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DistributionTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
