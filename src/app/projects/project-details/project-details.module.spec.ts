import { ProjectDetailsModule } from './project-details.module';

describe('ProjectDetailsModule', () => {
  let projectDetailsModule: ProjectDetailsModule;

  beforeEach(() => {
    projectDetailsModule = new ProjectDetailsModule();
  });

  it('should create an instance', () => {
    expect(projectDetailsModule).toBeTruthy();
  });
});
