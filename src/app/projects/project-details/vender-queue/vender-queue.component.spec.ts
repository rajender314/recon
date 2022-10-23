import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VenderQueueComponent } from './vender-queue.component';

describe('VenderQueueComponent', () => {
  let component: VenderQueueComponent;
  let fixture: ComponentFixture<VenderQueueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VenderQueueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VenderQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
