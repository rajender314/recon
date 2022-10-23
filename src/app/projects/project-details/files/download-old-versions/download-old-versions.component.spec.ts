import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadOldVersionsComponent } from './download-old-versions.component';

describe('DownloadOldVersionsComponent', () => {
  let component: DownloadOldVersionsComponent;
  let fixture: ComponentFixture<DownloadOldVersionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DownloadOldVersionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadOldVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
