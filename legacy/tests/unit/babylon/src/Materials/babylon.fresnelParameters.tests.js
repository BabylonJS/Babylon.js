/**
 * Test Suite for FresnelParameters.
 */
describe('Babylon Material FresnelParameters', function () {
    /**
     * Loads the dependencies.
     */
    before(function (done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function () {
            // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
            BABYLON.PromisePolyfill.Apply(true);
            done();
        });
    });
    describe('#FresnelParameters', function () {
        it('empty constructor has default values', function () {
            var subject = new BABYLON.FresnelParameters();
            expect(subject.bias).to.equal(0, 'bias default is 0');
            expect(subject.power).to.equal(1, 'power default is 1');
            expect(subject.isEnabled).to.be.true;
            expect(subject.leftColor.equals(BABYLON.Color3.White())).to.be.true;
            expect(subject.rightColor.equals(BABYLON.Color3.Black())).to.be.true;
        });
        it('serialized empty constructor is serialized correctly', function () {
            var subject = new BABYLON.FresnelParameters().serialize();
            console.error(subject);
            expect(subject).deep.equals({
                isEnabled: true,
                leftColor: [1, 1, 1],
                rightColor: [0, 0, 0],
                bias: 0,
                power: 1
            });
        });
        it('new FresnelParameters({...}) with options specified', function () {
            var subject = new BABYLON.FresnelParameters({
                bias: 1,
                power: 0,
                isEnabled: false,
                leftColor: BABYLON.Color3.Black(),
                rightColor: BABYLON.Color3.White()
            });
            expect(subject.bias).to.equal(1, 'created with 1');
            expect(subject.power).to.equal(0, 'created with 0');
            expect(subject.isEnabled).to.be.false;
            expect(subject.leftColor.equals(BABYLON.Color3.Black())).to.be.true;
            expect(subject.rightColor.equals(BABYLON.Color3.White())).to.be.true;
        });
        it('FresnelParameters.Parse({...}) with equality check', function () {
            var subject = BABYLON.FresnelParameters.Parse({
                isEnabled: true,
                leftColor: [1, 1, 1],
                rightColor: [0, 0, 0],
                bias: 0,
                power: 1
            });
            expect(new BABYLON.FresnelParameters().equals(subject)).to.be.true;
        });
        it('disabling FresnelParameters should mark materials as dirty (not ready)', function () {
            var engine = new BABYLON.NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1
            });
            var scene = new BABYLON.Scene(engine);
            var mesh = BABYLON.MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
            var material = new BABYLON.StandardMaterial("material", scene);
            mesh.material = material;
            var subject = new BABYLON.FresnelParameters();
            material.refractionFresnelParameters = subject;
            expect(scene._cachedMaterial).is.not.null;
            // should mark materials as dirty and clear scene cache
            subject.isEnabled = false;
            expect(scene._cachedMaterial).is.null;
        });
    });
});
