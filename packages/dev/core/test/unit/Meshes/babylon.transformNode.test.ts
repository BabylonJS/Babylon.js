import type { Engine} from 'core/Engines';
import { NullEngine } from 'core/Engines';
import { AbstractMesh } from 'core/Meshes';
import { Scene } from 'core/scene';


describe("TransformNode", () => {
    let subject: Engine;

    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe("setParent", () => {
        it("should have a parent after call setParent method", () => {
            const scene = new Scene(subject);
            const child = new AbstractMesh("Child", scene);
            const parent = new AbstractMesh("Parent", scene);

            expect(child.parent).toBeFalsy();

            child.setParent(parent, true, true);

            expect(child.parent).toBeTruthy();
            expect(child.parent?.name).toEqual("Parent");
        });
    });
});
