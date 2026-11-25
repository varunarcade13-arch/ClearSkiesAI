import "@testing-library/jest-dom";

// JSDOM does not implement layout scrolling; keep auto-scroll effects testable.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Polyfill window.matchMedia for JSDOM
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill Notification API for JSDOM
class MockNotification {
  static permission: NotificationPermission = "default";
  static requestPermission = async (): Promise<NotificationPermission> => {
    return MockNotification.permission;
  };
  title: string;
  options?: NotificationOptions;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }
}

// @ts-expect-error Mocking global Notification
global.Notification = MockNotification;
