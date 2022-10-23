import { DesignationsModule } from './designations.module';

describe('DesignationsModule', () => {
  let designationsModule: DesignationsModule;

  beforeEach(() => {
    designationsModule = new DesignationsModule();
  });

  it('should create an instance', () => {
    expect(designationsModule).toBeTruthy();
  });
});
