/**
 * WebXR Features Manager test suite.
 */
describe('Babylon WebXR Features Manager', function () {
    var subject;
    before(function (done) {
        // runs before all tests in this block
        this.timeout(180000);
        BABYLONDEVTOOLS.Loader.useDist()
            .testMode()
            .load(function () {
            // Force apply promise polyfill for consistent behavior between
            // PhantomJS, IE11, and other browsers.
            BABYLON.PromisePolyfill.Apply(true);
            done();
        });
    });
    /**
     * Create a new session manager subject before each test.
     */
    beforeEach(function () {
        var engine = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });
        var scene = new BABYLON.Scene(engine);
        var sessionManager = new BABYLON.WebXRSessionManager(scene);
        // Normally added via import side effects (features add themselves)
        BABYLON.WebXRFeaturesManager.AddWebXRFeature(BABYLON.WebXRMotionControllerTeleportation.Name, function (xrSessionManager, options) {
            return function () { return new BABYLON.WebXRMotionControllerTeleportation(xrSessionManager, options); };
        }, BABYLON.WebXRMotionControllerTeleportation.Version, true);
        BABYLON.WebXRFeaturesManager.AddWebXRFeature(BABYLON.WebXRControllerMovement.Name, function (xrSessionManager, options) {
            return function () { return new BABYLON.WebXRControllerMovement(xrSessionManager, options); };
        }, BABYLON.WebXRControllerMovement.Version, true);
        subject = new BABYLON.WebXRFeaturesManager(sessionManager);
    });
    /**
     * Test conflicting features
     */
    describe('Conflicting Features cannot be enabled simultaneously', function () {
        it('Cannot enable Movement feature while Teleportation feature is enabled', function () {
            var teleportationFeature = subject.enableFeature(BABYLON.WebXRMotionControllerTeleportation.Name);
            expect(teleportationFeature).to.not.be.undefined;
            expect(subject.getEnabledFeatures()).to.deep.equal([BABYLON.WebXRMotionControllerTeleportation.Name], 'only teleportation should be enabled.');
            expect(function () { return subject.enableFeature(BABYLON.WebXRControllerMovement.Name); }).to.throw("Feature ".concat(BABYLON.WebXRControllerMovement.Name, " cannot be enabled while ").concat(BABYLON.WebXRMotionControllerTeleportation.Name, " is enabled."));
            expect(subject.getEnabledFeatures()).to.deep.equal([BABYLON.WebXRMotionControllerTeleportation.Name], 'still only teleportation should be enabled.');
        });
        it('Cannot enable Teleportation feature while Teleportation feature is enabled', function () {
            var teleportationFeature = subject.enableFeature(BABYLON.WebXRControllerMovement.Name);
            expect(teleportationFeature).to.not.be.undefined;
            expect(subject.getEnabledFeatures()).to.deep.equal([BABYLON.WebXRControllerMovement.Name], 'only movement should be enabled.');
            expect(function () { return subject.enableFeature(BABYLON.WebXRMotionControllerTeleportation.Name); }).to.throw("Feature ".concat(BABYLON.WebXRMotionControllerTeleportation.Name, " cannot be enabled while ").concat(BABYLON.WebXRControllerMovement.Name, " is enabled."));
            expect(subject.getEnabledFeatures()).to.deep.equal([BABYLON.WebXRControllerMovement.Name], 'still only movement should be enabled.');
        });
    });
});
