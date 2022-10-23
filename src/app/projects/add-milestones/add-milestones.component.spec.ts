import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMilestonesComponent } from './add-milestones.component';

describe('AddMilestonesComponent', () => {
  let component: AddMilestonesComponent;
  let fixture: ComponentFixture<AddMilestonesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMilestonesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMilestonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
