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

  describe('#ParticleHelper.CreateAsync', () => {
      let scene: BABYLON.Scene;

      beforeEach(() => {
        scene = new BABYLON.Scene(subject);
      });

      it('creates a sun particle system set', (done) => {
        BABYLON.ParticleHelper.CreateAsync("fire", scene)
            .then((system) => {
                expect(system).to.be.instanceof(BABYLON.ParticleSystem);
                done();
            })
            .catch((error) => { throw new Error("was not supposed to fail"); });
      });

      it('rejects the creation of the particle system', (done) => {
        BABYLON.ParticleHelper.CreateAsync("test", scene)
            .then(() => { throw new Error("was not supposed to succeed"); })
            .catch((error) => {
                expect(error).to.equals("An error occured while the creation of your particle system. Check if your type 'test' exists.");
                done();
            });
    });
  });
});