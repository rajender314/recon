import { LanguageModule } from './language.module';

describe('LanguageModule', () => {
  let languageModule: LanguageModule;

  beforeEach(() => {
    languageModule = new LanguageModule();
  });

  it('should create an instance', () => {
    expect(languageModule).toBeTruthy();
  });
});
