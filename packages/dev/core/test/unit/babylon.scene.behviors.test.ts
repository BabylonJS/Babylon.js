import type { Behavior } from "core/Behaviors/behavior";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";

describe("Scene", () => {
    let subject: Engine;
    let scene: Scene;
    let behavior: Behavior<Scene>;
    let behavior2: Behavior<Scene>;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(subject);

        behavior = {
            name: "test",
            init: () => {},
            attach: () => {},
            detach: () => {},
        };

        behavior2 = {
            name: "test2",
            init: () => {},
            attach: () => {},
            detach: () => {},
        };
    });

    describe("addBehavior", () => {
        it("should add a behavior to the scene", () => {
            scene.addBehavior(behavior);

            expect(scene.behaviors).toContain(behavior);
        });

        it("should not add the same behavior twice", () => {
            scene.addBehavior(behavior);
            scene.addBehavior(behavior);

            expect(scene.behaviors).toHaveLength(1);
        });

        it("should call init and attach on the behavior", () => {
            const initSpy = jest.spyOn(behavior, "init");
            const attachSpy = jest.spyOn(behavior, "attach");

            scene.addBehavior(behavior);

            expect(initSpy).toHaveBeenCalled();
            expect(attachSpy).toHaveBeenCalledWith(scene);
        });
    });

    describe("removeBehavior", () => {
        it("should remove a behavior from the scene", () => {
            scene.addBehavior(behavior);
            scene.removeBehavior(behavior);

            expect(scene.behaviors).not.toContain(behavior);
        });

        it("should call detach on the behavior", () => {
            scene.addBehavior(behavior);
            const detachSpy = jest.spyOn(behavior, "detach");

            scene.removeBehavior(behavior);

            expect(detachSpy).toHaveBeenCalled();
        });

        it("should not remove a behavior that is not in the scene", () => {
            const initialBehaviorsLength = scene.behaviors.length;

            scene.removeBehavior(behavior);

            expect(scene.behaviors).toHaveLength(initialBehaviorsLength);
        });
    });

    describe("behaviors", () => {
        it("should return a list of attached behaviors", () => {
            scene.addBehavior(behavior);
            scene.addBehavior(behavior2);

            expect(scene.behaviors).toEqual(expect.arrayContaining([behavior, behavior2]));
        });
    });

    describe("getBehaviorByName", () => {
        it("should return a behavior by name", () => {
            scene.addBehavior(behavior);
            scene.addBehavior(behavior2);

            expect(scene.getBehaviorByName("test")).toBe(behavior);
            expect(scene.getBehaviorByName("test2")).toBe(behavior2);
        });

        it("should return null if behavior with given name is not found", () => {
            scene.addBehavior(behavior);

            expect(scene.getBehaviorByName("nonExistentBehavior")).toBe(null);
        });
    });
});
