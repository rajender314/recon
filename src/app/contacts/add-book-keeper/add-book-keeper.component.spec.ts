import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBookKeeperComponent } from './add-book-keeper.component';

describe('AddBookKeeperComponent', () => {
  let component: AddBookKeeperComponent;
  let fixture: ComponentFixture<AddBookKeeperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddBookKeeperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBookKeeperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
