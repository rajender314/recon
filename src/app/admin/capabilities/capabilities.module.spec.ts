import { CapabilitiesModule } from './capabilities.module';

describe('CapabilitiesModule', () => {
  let capabilitiesModule: CapabilitiesModule;

  beforeEach(() => {
    capabilitiesModule = new CapabilitiesModule();
  });

  it('should create an instance', () => {
    expect(capabilitiesModule).toBeTruthy();
  });
});
