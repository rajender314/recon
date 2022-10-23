import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifiedUserInfoComponent } from './modified-user-info.component';

describe('ModifiedUserInfoComponent', () => {
  let component: ModifiedUserInfoComponent;
  let fixture: ComponentFixture<ModifiedUserInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModifiedUserInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModifiedUserInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
