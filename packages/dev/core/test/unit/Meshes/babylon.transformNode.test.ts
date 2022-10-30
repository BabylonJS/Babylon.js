import type { Engine } from 'core/Engines';
import { NullEngine } from 'core/Engines';
import { Matrix } from 'core/Maths';
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

        it('should work with nullable node', () => {
            const scene = new Scene(subject);
            const child = new AbstractMesh("Child", scene);
            const parent = new AbstractMesh("Parent", scene);

            child.setParent(parent);
            child.setParent(null);

            expect(child.parent).toBeFalsy();
        });

        it('should update pivot when it need', () => {
            const scene = new Scene(subject);
            const child = new AbstractMesh("Child", scene);
            const parent = new AbstractMesh("Parent", scene);

            // set not default pivot
            child.setPivotMatrix(Matrix.Translation(1, -1, -0.5));

            expect(child.getPivotMatrix().toArray()).not.toEqual(Matrix.Identity().toArray());

            child.setParent(parent, true, true);

            expect(child.getPivotMatrix().toArray()).toEqual(Matrix.Identity().toArray());
        });

        it('should not update pivot when it no need', () => {
            const scene = new Scene(subject);
            const child = new AbstractMesh("Child", scene);
            const parent = new AbstractMesh("Parent", scene);

            // set not default pivot
            child.setPivotMatrix(Matrix.Translation(1, -1, -0.5));

            child.setParent(parent, true, false);

            expect(child.getPivotMatrix().toArray()).not.toEqual(Matrix.Identity().toArray());
        });
    });
});
