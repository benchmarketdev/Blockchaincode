// mocking localStorage
export default () =>
  (window.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
  });
