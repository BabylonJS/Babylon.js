import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { FlowGraphCoordinator } from "core/FlowGraph";
import { Scene } from "core/scene";

describe("FlowGraphCoordinator", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        // Clear the static map to isolate tests
        FlowGraphCoordinator.SceneCoordinators.clear();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
        FlowGraphCoordinator.SceneCoordinators.clear();
    });

    describe("SceneCoordinators registration", () => {
        it("should register a coordinator in SceneCoordinators on construction", () => {
            const coordinator = new FlowGraphCoordinator({ scene });

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).toBeDefined();
            expect(registered).toContain(coordinator);
        });

        it("should register multiple coordinators for the same scene", () => {
            const coordinator1 = new FlowGraphCoordinator({ scene });
            const coordinator2 = new FlowGraphCoordinator({ scene });

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).toBeDefined();
            expect(registered).toHaveLength(2);
            expect(registered).toContain(coordinator1);
            expect(registered).toContain(coordinator2);
        });

        it("should keep coordinators for different scenes separate", () => {
            const scene2 = new Scene(engine);
            const coordinator1 = new FlowGraphCoordinator({ scene });
            const coordinator2 = new FlowGraphCoordinator({ scene: scene2 });

            const forScene1 = FlowGraphCoordinator.SceneCoordinators.get(scene);
            const forScene2 = FlowGraphCoordinator.SceneCoordinators.get(scene2);

            expect(forScene1).toHaveLength(1);
            expect(forScene1).toContain(coordinator1);
            expect(forScene2).toHaveLength(1);
            expect(forScene2).toContain(coordinator2);

            scene2.dispose();
        });

        it("should remove coordinator from SceneCoordinators on dispose", () => {
            const coordinator = new FlowGraphCoordinator({ scene });

            expect(FlowGraphCoordinator.SceneCoordinators.get(scene)).toContain(coordinator);

            coordinator.dispose();

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).not.toContain(coordinator);
        });

        it("should only remove the disposed coordinator, leaving others intact", () => {
            const coordinator1 = new FlowGraphCoordinator({ scene });
            const coordinator2 = new FlowGraphCoordinator({ scene });

            coordinator1.dispose();

            const registered = FlowGraphCoordinator.SceneCoordinators.get(scene);
            expect(registered).toHaveLength(1);
            expect(registered).toContain(coordinator2);
        });
    });
});
