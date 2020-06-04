
// 'physicsEngineComponents.ts' injects methods and properties into Scene and AbstractMesh
// these tests only check that Scene and AbstractMesh have the expected methods.


/**
 * Describes the test suite.
 */
describe('Babylon physicsComponents', () => {
    let engine: BABYLON.Engine;
    let scene: BABYLON.Scene;
    let gravityVector: BABYLON.Vector3;
    let noGravityVector: BABYLON.Vector3;
    let physicsPlugin: BABYLON.AmmoJSPlugin;     // only testing Ammo for now

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
     * Create a new engine and scene before each test.
     */
    beforeEach(function(done) {
        engine = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });
        scene = new BABYLON.Scene(engine);

        gravityVector = new BABYLON.Vector3(0, -9.81, 0);
        noGravityVector = BABYLON.Vector3.Zero();
        physicsPlugin = new BABYLON.AmmoJSPlugin();     // only testing Ammo for now

        done();
    });


    describe('#exercise the functions "physicsEngineComponents"', () => {

        it('enables and disables the scene\'s physics engine', () => {

            // scene starts off without a physics engine
            let physicsEngine = scene.getPhysicsEngine();
            expect(physicsEngine).to.be.undefined;

            // specify an engine, and ask again
            scene.enablePhysics(gravityVector, physicsPlugin);
            physicsEngine = scene.getPhysicsEngine();
            expect(physicsEngine).to.be.an('object');  // an iPhysicsEngine

            // good, we have an plugin plugged in.  let's ask for it's name
            let name = physicsEngine.getPhysicsPluginName();
            expect(name).to.equal('AmmoJSPlugin');

            // we can get the entire plugin back, which should be identical to physicsPlugin
            let myPhysicsPlugin = physicsEngine.getPhysicsPlugin();
            expect(myPhysicsPlugin).to.be.an('object');     // an iPhysicsEnginePlugin
            expect(myPhysicsPlugin.name).to.equal('AmmoJSPlugin');

            // disable the scene physicsEngine, and see whether still there
            scene.disablePhysicsEngine();
            physicsEngine = scene.getPhysicsEngine();
            expect(physicsEngine).to.be.null; // note that physicsEngine is now null, not undefined

        });

        it('set and get timestep parameters', () => {

            expect(scene.isPhysicsEnabled()).to.be.false;
            scene.enablePhysics(gravityVector, physicsPlugin);
            expect(scene.isPhysicsEnabled()).to.be.true;

            // quick test to see if our physicsPlugin is really an  IPhysicsEnginePlugin
            let timestep = physicsPlugin.getTimeStep();
            expect(timestep).to.be.a('number');
            expect(timestep).to.be.closeTo(1 / 60, 0.0001);      // default is 1/60th of a second

            // let's slow down the timestep to 1/30
            physicsPlugin.setTimeStep(1 / 30);
            timestep = physicsPlugin.getTimeStep();
            expect(timestep).to.be.closeTo(1 / 30, 0.0001);

        });

        it('sets up and disposes of an imposter on a mesh', () => {

            scene.enablePhysics(gravityVector, physicsPlugin);

            // The built-in 'sphere' shape. Params: name, subdivs, size, scene
            let sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

            sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);
            expect(sphere.physicsImpostor).to.be.an('object');

            let sphereMass = sphere.physicsImpostor.mass;
            expect(sphereMass).to.equal(1);   // no surprise, we created it with mass: 1

            // make sure it has a unique ID
            expect(sphere.physicsImpostor.uniqueId).to.be.a('number');

            // if we create another sphere, it should have a different ID
            let sphere2 = BABYLON.Mesh.CreateSphere("sphere2", 16, 2, scene);
            sphere2.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);

            expect(sphere.physicsImpostor.uniqueId).to.not.equal(sphere2.physicsImpostor.uniqueId);
        });

    });

    // test 'Scene.onBeforePhysicsObservable' and 'Scene.onAfterPhysicsObservable' callbacks
    describe('observables should fire before and after', function() {

        var obWasCalled = false;

        // only going to test onBefore for now
        it('onBefore should trigger as soon as I animate', function(done) {

            scene.enablePhysics(gravityVector, physicsPlugin);

            scene.onBeforePhysicsObservable.add(function(observer: any) {
                expect(obWasCalled).to.be.false;
                obWasCalled = true;
                done();
            });

            expect(obWasCalled).to.be.false;
            scene.animate();   // rather than call hidden  _advancePhysicsEngineStep
            expect(obWasCalled).to.be.true;
        });
    });


    // previous tests were on injected properties of Scene.
    // now test 'applyImpulse' which is an injected property of AbstractMesh
    describe('applyImpulse should move a mesh', function() {

        it('if an impulse is applied', function() {

            scene.enablePhysics(noGravityVector, physicsPlugin);   // NO gravity
            let getGravity = scene.getPhysicsEngine().gravity;
            expect(getGravity).to.deep.equal(BABYLON.Vector3.Zero());

            let sphere = BABYLON.MeshBuilder.CreateSphere("mySphere", { diameter: 1 }, scene);  // use MeshBuilder instead of Mesh
            sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, scene);

            let getPosition = sphere.position.asArray();
            expect(getPosition).to.deep.equal([0, 0, 0]);

            let linearVelocity = sphere.physicsImpostor.getLinearVelocity().asArray();
            expect(linearVelocity).to.deep.equal([0, 0, 0]);

            let angularVelocity = sphere.physicsImpostor.getAngularVelocity().asArray();
            expect(linearVelocity).to.deep.equal([0, 0, 0]);

            //////////////////////////////`/////////////////////
            // so far, so good.  let's run the physics engine.  nothing should change.

            scene.animate();

            getPosition = sphere.position.asArray();
            expect(getPosition).to.deep.equal([0, 0, 0]);

            linearVelocity = sphere.physicsImpostor.getLinearVelocity().asArray();
            expect(linearVelocity).to.deep.equal([0, 0, 0]);

            angularVelocity = sphere.physicsImpostor.getAngularVelocity().asArray();
            expect(linearVelocity).to.deep.equal([0, 0, 0]);

            ///////////////////////////////////////////////////
            // now give an impulse, and run the physics engine again.  the sphere should start moving.

            let force = new BABYLON.Vector3(10, 0, 0);
            let contact = new BABYLON.Vector3(-1, 0, 0);  // we know sphere has diameter 1.  so kick straight down x axis.
            sphere.applyImpulse(force, contact);  // give the sphere its kick
            scene.animate();   // and run the physics engine

            var getPosition2 = sphere.position;
            expect(getPosition2.x).to.be.greaterThan(0);   // moved about 0.01, I'm clueless how that was calculated
            expect(getPosition2.y).to.be.equal(0);
            expect(getPosition2.z).to.be.equal(0);

            var linearVelocity2 = sphere.physicsImpostor.getLinearVelocity();
            expect(linearVelocity2.x).to.be.closeTo(10, 0.001);      // mass of 1, whack of 10, sounds right
            expect(linearVelocity2.y).to.be.equal(0);
            expect(linearVelocity2.z).to.be.equal(0);

            // we whacked it right along the axis, so don't expect any angular velocity
            var angularVelocity2 = sphere.physicsImpostor.getAngularVelocity()
            expect(angularVelocity2.asArray()).to.deep.equal([0, 0, 0]);

        });
    });

})
