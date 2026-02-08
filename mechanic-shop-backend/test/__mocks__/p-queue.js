// Minimal mock for p-queue used in tests
module.exports = class PQueueMock {
  constructor() {}
  add(fn) { return Promise.resolve(fn()); }
};
