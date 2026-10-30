import {
    addToScene,
    createBox,
    createSphere,
    createHavokWorld,
    createPhysicsAggregate,
    createPhysicsConstraint,
    disposePhysics,
    enableHavokThinInstancePhysics,
    getPhysicsBodyMassPropertiesToRef,
    getPhysicsBodyShape,
    getPhysicsShapeMaterialToRef,
    getPhysicsBodies,
    getPhysicsWorlds,
    PhysicsShapeType,
    PhysicsConstraintType,
    PhysicsConstraintAxis,
    releasePhysicsConstraint,
    removePhysicsBody,
    setPhysicsBodyLinearDamping,
    setPhysicsBodyMassProperties,
    lockPhysicsBodyRotationAxes,
    unlockPhysicsBodyRotationAxes,
    setThinInstances,
    type SceneContext,
    type PhysicsBody,
    type PhysicsMassProperties,
    type Material,
} from "@babylonjs/lite";

import { InspectorPhysicsHelpers } from "../../src/lite/sceneEntityUtils";

/**
 * Loads real Havok after Inspector opens, by default or on demand with physics=off.
 * @param scene The registered scene to augment.
 * @param boxMaterial The existing scene material for the box meshes.
 * @param sphereMaterial The existing scene material for the sphere.
 * @returns Handles and deterministic queries for physics integration assertions.
 */
export async function CreateLitePhysicsFixture(scene: SceneContext, boxMaterial: Material, sphereMaterial: Material) {
    const { default: HavokPhysics } = await import("@babylonjs/havok");
    const havok = await HavokPhysics({ locateFile: () => new URL("/HavokPhysics.wasm", location.href).href });
    const world = createHavokWorld(scene, havok, { x: 0, y: 0, z: 0 });
    await enableHavokThinInstancePhysics(world);
    // Keep the dynamic bodies separated above the original scene objects and inside the default camera.
    const box = createBox(scene.surface.engine, 0.6);
    box.name = "P10 Box";
    box.position.x = -0.25;
    box.position.y = 1.8;
    box.material = boxMaterial;
    const sphere = createSphere(scene.surface.engine, { diameter: 0.6 });
    sphere.name = "P10 Sphere";
    sphere.position.x = 1;
    sphere.position.y = 1.8;
    sphere.material = sphereMaterial;
    const shared = createBox(scene.surface.engine, 0.6);
    shared.name = "P10 Shared";
    shared.position.x = 1.75;
    shared.position.y = 1.8;
    shared.material = boxMaterial;
    const thin = createBox(scene.surface.engine);
    thin.name = "P10 Thin";
    thin.material = boxMaterial;
    const matrices = new Float32Array(16 * 3);
    for (let index = 0; index < 3; index++) {
        matrices.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, index * 2 - 2, 4, 0, 1], index * 16);
    }
    setThinInstances(thin, matrices, 3);
    for (const mesh of [box, sphere, shared, thin]) {
        addToScene(scene, mesh);
    }
    const boxAggregate = createPhysicsAggregate(world, box, PhysicsShapeType.BOX, { mass: 2, friction: 0.4 });
    const sphereAggregate = createPhysicsAggregate(world, sphere, PhysicsShapeType.SPHERE, { mass: 1 });
    const sharedAggregate = createPhysicsAggregate(world, shared, PhysicsShapeType.BOX, { mass: 1, shape: boxAggregate.shape });
    const thinAggregate = createPhysicsAggregate(world, thin, PhysicsShapeType.BOX, { mass: 1 });
    setPhysicsBodyLinearDamping(world, boxAggregate.body, 0.2);
    // Both hinge pivots meet between the bodies, and the distance constraint starts satisfied.
    const hinge = createPhysicsConstraint(
        world,
        boxAggregate.body,
        sphereAggregate.body,
        PhysicsConstraintType.HINGE,
        { pivotA: { x: 0.625, y: 0, z: 0 }, pivotB: { x: -0.625, y: 0, z: 0 } },
        [{ axis: PhysicsConstraintAxis.ANGULAR_X, minLimit: -0.5, maxLimit: 0.5 }]
    );
    const distance = createPhysicsConstraint(world, boxAggregate.body, sharedAggregate.body, PhysicsConstraintType.DISTANCE, { maxDistance: 2 }, [
        { axis: PhysicsConstraintAxis.LINEAR_DISTANCE, minLimit: 0, maxLimit: 2 },
    ]);
    const massScratch: Required<PhysicsMassProperties> = {
        mass: 0,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 0, y: 0, z: 0 },
        inertiaOrientation: { x: 0, y: 0, z: 0, w: 1 },
    };
    const materialScratch = { friction: 0, staticFriction: 0, restitution: 0 };
    const readMass = (body: PhysicsBody, index = 0) => getPhysicsBodyMassPropertiesToRef(world, body, massScratch, index).mass;
    return {
        world,
        bodies: [boxAggregate.body, sphereAggregate.body, sharedAggregate.body, thinAggregate.body],
        hinge,
        distance,
        read: () => ({
            mass: readMass(boxAggregate.body),
            friction: getPhysicsShapeMaterialToRef(world, getPhysicsBodyShape(boxAggregate.body)!, materialScratch).friction,
            thinMasses: [0, 1, 2].map((index) => readMass(thinAggregate.body, index)),
        }),
        prepareMassEdits: (thinBody: boolean) => {
            const body = thinBody ? thinAggregate.body : boxAggregate.body;
            setPhysicsBodyMassProperties(world, body, {
                mass: 2,
                centerOfMass: { x: 1, y: 2, z: 3 },
                inertia: { x: 3, y: 4, z: 5 },
                inertiaOrientation: { x: 0, y: 0, z: 0, w: 1 },
            });
        },
        lockMassEdits: (thinBody: boolean) => lockPhysicsBodyRotationAxes(world, thinBody ? thinAggregate.body : boxAggregate.body, ["x"]),
        unlockMassEdits: (thinBody: boolean) => unlockPhysicsBodyRotationAxes(world, thinBody ? thinAggregate.body : boxAggregate.body, ["x"]),
        readMassProperties: (thinBody: boolean) =>
            Array.from({ length: thinBody ? 3 : 1 }, (_, index) =>
                structuredClone(getPhysicsBodyMassPropertiesToRef(world, thinBody ? thinAggregate.body : boxAggregate.body, massScratch, index))
            ),
        helperCount: () => scene.meshes.filter((mesh) => InspectorPhysicsHelpers.has(mesh)).length,
        bodyCount: () => getPhysicsBodies(world).length,
        worldCount: () => getPhysicsWorlds(scene).length,
        removeEndpoint: () => removePhysicsBody(world, sphereAggregate.body),
        releaseDistance: () => releasePhysicsConstraint(world, distance),
        dispose: () => disposePhysics(world),
    };
}
