import { TestBed } from '@angular/core/testing';

import { ProjectDetailsService } from './project-details.service';

describe('ProjectDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProjectDetailsService = TestBed.get(ProjectDetailsService);
    expect(service).toBeTruthy();
  });
});
