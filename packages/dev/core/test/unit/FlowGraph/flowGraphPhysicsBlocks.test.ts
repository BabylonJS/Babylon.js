import { type Engine, NullEngine } from "core/Engines";
import {
    type FlowGraph,
    type FlowGraphContext,
    FlowGraphCoordinator,
    FlowGraphConsoleLogBlock,
    FlowGraphSceneReadyEventBlock,
} from "core/FlowGraph";
import { FlowGraphApplyForceBlock } from "core/FlowGraph/Blocks/Execution/Physics/flowGraphApplyForceBlock";
import { FlowGraphApplyImpulseBlock } from "core/FlowGraph/Blocks/Execution/Physics/flowGraphApplyImpulseBlock";
import { FlowGraphSetLinearVelocityBlock } from "core/FlowGraph/Blocks/Execution/Physics/flowGraphSetLinearVelocityBlock";
import { FlowGraphSetAngularVelocityBlock } from "core/FlowGraph/Blocks/Execution/Physics/flowGraphSetAngularVelocityBlock";
import { FlowGraphSetPhysicsMotionTypeBlock } from "core/FlowGraph/Blocks/Execution/Physics/flowGraphSetPhysicsMotionTypeBlock";
import { FlowGraphGetLinearVelocityBlock } from "core/FlowGraph/Blocks/Data/Physics/flowGraphGetLinearVelocityBlock";
import { FlowGraphGetAngularVelocityBlock } from "core/FlowGraph/Blocks/Data/Physics/flowGraphGetAngularVelocityBlock";
import { FlowGraphGetPhysicsMassPropertiesBlock } from "core/FlowGraph/Blocks/Data/Physics/flowGraphGetPhysicsMassPropertiesBlock";
import { FlowGraphPhysicsCollisionEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphPhysicsCollisionEventBlock";
import { Observable } from "core/Misc/observable";
import { Vector3 } from "core/Maths/math.vector";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

/**
 * Creates a mock PhysicsBody for testing.
 * Mimics the Physics V2 PhysicsBody API surface used by the blocks.
 */
function createMockPhysicsBody() {
    const collisionObservable = new Observable<any>();
    return {
        applyForce: vi.fn(),
        applyImpulse: vi.fn(),
        setLinearVelocity: vi.fn(),
        setAngularVelocity: vi.fn(),
        setMotionType: vi.fn(),
        getLinearVelocityToRef: vi.fn((ref: Vector3) => {
            ref.copyFromFloats(1, 2, 3);
        }),
        getAngularVelocityToRef: vi.fn((ref: Vector3) => {
            ref.copyFromFloats(4, 5, 6);
        }),
        getMassProperties: vi.fn(() => ({
            mass: 10,
            centerOfMass: new Vector3(0, 0.5, 0),
            inertia: new Vector3(1, 1, 1),
        })),
        setCollisionCallbackEnabled: vi.fn(),
        getCollisionObservable: vi.fn(() => collisionObservable),
        _collisionObservable: collisionObservable,
    };
}

describe("Flow Graph Physics Blocks", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        Logger.Log = vi.fn();

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // ---- Execution blocks ----

    describe("ApplyForceBlock", () => {
        it("calls applyForce with force and location", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphApplyForceBlock();
            sceneReady.done.connectTo(block.in);

            const mockBody = createMockPhysicsBody();
            const force = new Vector3(10, 0, 0);
            const location = new Vector3(0, 1, 0);
            block.body.setValue(mockBody as any, flowGraphContext);
            block.force.setValue(force, flowGraphContext);
            block.location.setValue(location, flowGraphContext);

            flowGraph.start();

            expect(mockBody.applyForce).toHaveBeenCalledWith(force, location);
        });

        it("reports error and still activates out when no body", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphApplyForceBlock();
            sceneReady.done.connectTo(block.in);

            const log = new FlowGraphConsoleLogBlock();
            log.message.setValue("after", flowGraphContext);
            block.out.connectTo(log.in);

            flowGraph.start();

            expect(Logger.Log).toHaveBeenCalledWith("after");
        });
    });

    describe("ApplyImpulseBlock", () => {
        it("calls applyImpulse with impulse and location", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphApplyImpulseBlock();
            sceneReady.done.connectTo(block.in);

            const mockBody = createMockPhysicsBody();
            const impulse = new Vector3(0, 5, 0);
            const location = new Vector3(0, 0, 0);
            block.body.setValue(mockBody as any, flowGraphContext);
            block.impulse.setValue(impulse, flowGraphContext);
            block.location.setValue(location, flowGraphContext);

            flowGraph.start();

            expect(mockBody.applyImpulse).toHaveBeenCalledWith(impulse, location);
        });
    });

    describe("SetLinearVelocityBlock", () => {
        it("calls setLinearVelocity with velocity", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphSetLinearVelocityBlock();
            sceneReady.done.connectTo(block.in);

            const mockBody = createMockPhysicsBody();
            const velocity = new Vector3(3, 0, 0);
            block.body.setValue(mockBody as any, flowGraphContext);
            block.velocity.setValue(velocity, flowGraphContext);

            flowGraph.start();

            expect(mockBody.setLinearVelocity).toHaveBeenCalledWith(velocity);
        });
    });

    describe("SetAngularVelocityBlock", () => {
        it("calls setAngularVelocity with velocity", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphSetAngularVelocityBlock();
            sceneReady.done.connectTo(block.in);

            const mockBody = createMockPhysicsBody();
            const velocity = new Vector3(0, 1, 0);
            block.body.setValue(mockBody as any, flowGraphContext);
            block.velocity.setValue(velocity, flowGraphContext);

            flowGraph.start();

            expect(mockBody.setAngularVelocity).toHaveBeenCalledWith(velocity);
        });
    });

    describe("SetPhysicsMotionTypeBlock", () => {
        it("calls setMotionType with given type", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphSetPhysicsMotionTypeBlock();
            sceneReady.done.connectTo(block.in);

            const mockBody = createMockPhysicsBody();
            block.body.setValue(mockBody as any, flowGraphContext);
            block.motionType.setValue(0, flowGraphContext); // STATIC

            flowGraph.start();

            expect(mockBody.setMotionType).toHaveBeenCalledWith(0);
        });
    });

    // ---- Data blocks ----

    describe("GetLinearVelocityBlock", () => {
        it("reads the linear velocity from the body", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphGetLinearVelocityBlock();
            const mockBody = createMockPhysicsBody();
            block.body.setValue(mockBody as any, flowGraphContext);

            const log = new FlowGraphConsoleLogBlock();
            log.message.connectTo(block.value);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();

            expect(mockBody.getLinearVelocityToRef).toHaveBeenCalled();
            // The mock fills the vector with (1,2,3)
            const logged = (Logger.Log as any).mock.calls[0][0];
            expect(logged).toBeInstanceOf(Vector3);
            expect(logged.x).toBe(1);
            expect(logged.y).toBe(2);
            expect(logged.z).toBe(3);
        });

        it("returns undefined when no body is provided", () => {
            const block = new FlowGraphGetLinearVelocityBlock();
            block._updateOutputs(flowGraphContext);
            expect(block.isValid.getValue(flowGraphContext)).toBe(false);
        });

        it("caches the Vector3 across invocations", () => {
            const block = new FlowGraphGetLinearVelocityBlock();
            const mockBody = createMockPhysicsBody();
            block.body.setValue(mockBody as any, flowGraphContext);

            block._updateOutputs(flowGraphContext);
            const firstResult = block.value.getValue(flowGraphContext);

            // Trigger again — should reuse the same cached Vector3
            flowGraphContext._increaseExecutionId();
            block._updateOutputs(flowGraphContext);
            const secondResult = block.value.getValue(flowGraphContext);

            expect(mockBody.getLinearVelocityToRef).toHaveBeenCalledTimes(2);
            // Both calls should produce valid results
            expect(firstResult).toBeInstanceOf(Vector3);
            expect(secondResult).toBeInstanceOf(Vector3);
        });
    });

    describe("GetAngularVelocityBlock", () => {
        it("reads the angular velocity from the body", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphGetAngularVelocityBlock();
            const mockBody = createMockPhysicsBody();
            block.body.setValue(mockBody as any, flowGraphContext);

            const log = new FlowGraphConsoleLogBlock();
            log.message.connectTo(block.value);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();

            expect(mockBody.getAngularVelocityToRef).toHaveBeenCalled();
            const logged = (Logger.Log as any).mock.calls[0][0];
            expect(logged).toBeInstanceOf(Vector3);
            expect(logged.x).toBe(4);
            expect(logged.y).toBe(5);
            expect(logged.z).toBe(6);
        });
    });

    describe("GetPhysicsMassPropertiesBlock", () => {
        it("reads mass, centerOfMass, and inertia", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const block = new FlowGraphGetPhysicsMassPropertiesBlock();
            const mockBody = createMockPhysicsBody();
            block.body.setValue(mockBody as any, flowGraphContext);

            // Connect mass output to a log
            const log = new FlowGraphConsoleLogBlock();
            log.message.connectTo(block.mass);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();

            expect(mockBody.getMassProperties).toHaveBeenCalled();
            expect(Logger.Log).toHaveBeenCalledWith(10);

            // Check the other outputs directly
            const centerOfMass = block.centerOfMass.getValue(flowGraphContext);
            expect(centerOfMass).toBeInstanceOf(Vector3);
            expect(centerOfMass.y).toBe(0.5);

            const inertia = block.inertia.getValue(flowGraphContext);
            expect(inertia).toBeInstanceOf(Vector3);
            expect(inertia.x).toBe(1);
        });
    });

    // ---- Event block ----

    describe("PhysicsCollisionEventBlock", () => {
        it("fires execution when a collision occurs", () => {
            const collisionBlock = new FlowGraphPhysicsCollisionEventBlock();
            flowGraph.addEventBlock(collisionBlock);

            const log = new FlowGraphConsoleLogBlock();
            log.message.setValue("collision", flowGraphContext);
            collisionBlock.done.connectTo(log.in);

            const mockBody = createMockPhysicsBody();
            const otherMockBody = createMockPhysicsBody();
            collisionBlock.body.setValue(mockBody as any, flowGraphContext);

            flowGraph.start();

            // Verify collision callbacks were enabled
            expect(mockBody.setCollisionCallbackEnabled).toHaveBeenCalledWith(true);

            // Simulate a collision event
            const collisionEvent = {
                collider: mockBody,
                collidedAgainst: otherMockBody,
                point: new Vector3(1, 0, 0),
                normal: new Vector3(0, 1, 0),
                impulse: 5.0,
                distance: 0.01,
            };
            mockBody._collisionObservable.notifyObservers(collisionEvent);

            expect(Logger.Log).toHaveBeenCalledWith("collision");

            // Verify output data was set
            expect(collisionBlock.otherBody.getValue(flowGraphContext)).toBe(otherMockBody);
            expect(collisionBlock.impulse.getValue(flowGraphContext)).toBe(5.0);
            expect(collisionBlock.distance.getValue(flowGraphContext)).toBe(0.01);
        });

        it("correctly identifies 'other' body when reported as collidedAgainst", () => {
            const collisionBlock = new FlowGraphPhysicsCollisionEventBlock();
            flowGraph.addEventBlock(collisionBlock);

            const log = new FlowGraphConsoleLogBlock();
            log.message.setValue("hit", flowGraphContext);
            collisionBlock.done.connectTo(log.in);

            const mockBody = createMockPhysicsBody();
            const otherMockBody = createMockPhysicsBody();
            collisionBlock.body.setValue(mockBody as any, flowGraphContext);

            flowGraph.start();

            // This time the monitored body is "collidedAgainst", not "collider"
            const collisionEvent = {
                collider: otherMockBody,
                collidedAgainst: mockBody,
                point: null,
                normal: null,
                impulse: 2.0,
                distance: 0.0,
            };
            mockBody._collisionObservable.notifyObservers(collisionEvent);

            // "other" should be otherMockBody (the collider)
            expect(collisionBlock.otherBody.getValue(flowGraphContext)).toBe(otherMockBody);
        });

        it("cleans up observer on dispose", () => {
            const collisionBlock = new FlowGraphPhysicsCollisionEventBlock();
            flowGraph.addEventBlock(collisionBlock);

            const mockBody = createMockPhysicsBody();
            collisionBlock.body.setValue(mockBody as any, flowGraphContext);

            flowGraph.start();

            expect(mockBody._collisionObservable.hasObservers()).toBe(true);

            flowGraph.dispose();

            expect(mockBody._collisionObservable.hasObservers()).toBe(false);
        });

        it("disables collision callbacks on cleanup when no observers remain", () => {
            const collisionBlock = new FlowGraphPhysicsCollisionEventBlock();
            flowGraph.addEventBlock(collisionBlock);

            const mockBody = createMockPhysicsBody();
            collisionBlock.body.setValue(mockBody as any, flowGraphContext);

            flowGraph.start();

            // setCollisionCallbackEnabled(true) was called during prepare
            expect(mockBody.setCollisionCallbackEnabled).toHaveBeenCalledWith(true);

            flowGraph.dispose();

            // After cleanup, it should disable callbacks since no observers remain
            expect(mockBody.setCollisionCallbackEnabled).toHaveBeenCalledWith(false);
        });
    });
});
