import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPerferencesComponent } from './user-perferences.component';

describe('UserPerferencesComponent', () => {
  let component: UserPerferencesComponent;
  let fixture: ComponentFixture<UserPerferencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserPerferencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserPerferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
