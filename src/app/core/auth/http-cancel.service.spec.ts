import { TestBed } from '@angular/core/testing';

import { HttpCancelService } from './http-cancel.service';

describe('HttpCancelService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HttpCancelService = TestBed.get(HttpCancelService);
    expect(service).toBeTruthy();
  });
});
