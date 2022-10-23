import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkupsComponent } from './markups.component';

describe('MarkupsComponent', () => {
  let component: MarkupsComponent;
  let fixture: ComponentFixture<MarkupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
