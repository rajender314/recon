import { MessagingModule } from './messaging.module';

describe('MessagingModule', () => {
  let messagingModule: MessagingModule;

  beforeEach(() => {
    messagingModule = new MessagingModule();
  });

  it('should create an instance', () => {
    expect(messagingModule).toBeTruthy();
  });
});
