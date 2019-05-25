/**
 * Describes the test suite.
 */
describe('Babylon position and rotation', () => {
    let subject: BABYLON.Engine;

    /**
     * Loads the dependencies.
     */
    before(function(done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function() {
                // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
                BABYLON.PromisePolyfill.Apply(true);
                done();
            });
    });

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function() {
        subject = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });
    });

    describe('#position and rotation:', () => {
        it('converts between quaternions/euler', () => {
            // Converting between quaternions/euler
            var originalRotation = new BABYLON.Vector3(0.1, 0.2, 0.3);
            var v = originalRotation.clone()
            var q = BABYLON.Quaternion.FromEulerVector(v)
            q.toEulerAnglesToRef(v)
            expect(v.subtract(originalRotation).length() < 0.00001).to.equal(true)
        });
        it('reorders vector in place', () => {
            var originalRotation = new BABYLON.Vector3(0.1, 0.2, 0.3);
            var v = originalRotation.clone()
            v.reorderInPlace("ZYX")
            expect(v.subtract(new BABYLON.Vector3(0.3, 0.2, 0.1)).length() < 0.00001).to.equal(true)
        });
        it('handles parenting', () => {
            // Parent child positions
            const scene = new BABYLON.Scene(subject);
            var child = new BABYLON.AbstractMesh("", scene)
            var parent = new BABYLON.AbstractMesh("", scene)
            parent.position.set(0, 0, 1)
            child.position.set(0, 0, -1)
            child.parent = parent
            child.computeWorldMatrix()
            expect(child.absolutePosition.equals(new BABYLON.Vector3(0, 0, 0))).to.equal(true)

            //Rotate parent around child
            parent.rotationQuaternion = new BABYLON.Quaternion()
            var eulerRotation = new BABYLON.Vector3(0, Math.PI / 2, 0)
            var rotation = new BABYLON.Quaternion()
            BABYLON.Quaternion.RotationYawPitchRollToRef(eulerRotation.y, eulerRotation.x, eulerRotation.z, rotation)
            parent.rotationQuaternion.multiplyInPlace(rotation);
            parent.position.rotateByQuaternionAroundPointToRef(rotation, child.absolutePosition, parent.position)
            expect(parent.position.subtract(new BABYLON.Vector3(1, 0, 0)).length() < 0.00001).to.equal(true)
            expect(parent.rotationQuaternion.toEulerAngles().subtract(eulerRotation).length() < 0.00001).to.equal(true)
            expect(child.absolutePosition.subtract(new BABYLON.Vector3(0, 0, 0)).length() < 0.00001).to.equal(true)
        });
    });
});