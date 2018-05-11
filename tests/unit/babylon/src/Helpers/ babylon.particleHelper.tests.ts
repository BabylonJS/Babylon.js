/**
 * Describes the test suite.
 */
describe('Babylon Particle Helper', function () {
  let subject: BABYLON.Engine;

  /**
   * Loads the dependencies.
   */
  before(function (done) {
      this.timeout(180000);
      (BABYLONDEVTOOLS).Loader
          .useDist()
          .load(function () {
              // Force apply promise polyfill for consistent behavior between PhantomJS, IE11, and other browsers.
              BABYLON.PromisePolyfill.Apply(true);
              done();
          });
  });

  /**
   * Create a new engine subject before each test.
   */
  beforeEach(function () {
      subject = new BABYLON.NullEngine({
          renderHeight: 256,
          renderWidth: 256,
          textureSize: 256,
          deterministicLockstep: false,
          lockstepMaxSteps: 1
      });
  });

  describe('#JSON', () => {
      it('creates a fire particle system', () => {
          const scene = new BABYLON.Scene(subject);
          //
      });
  });
});