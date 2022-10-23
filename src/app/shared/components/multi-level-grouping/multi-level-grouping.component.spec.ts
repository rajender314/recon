import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiLevelGroupingComponent } from './multi-level-grouping.component';

describe('MultiLevelGroupingComponent', () => {
  let component: MultiLevelGroupingComponent;
  let fixture: ComponentFixture<MultiLevelGroupingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultiLevelGroupingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiLevelGroupingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
