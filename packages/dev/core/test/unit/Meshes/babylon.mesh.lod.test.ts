import { ArcRotateCamera, Camera } from 'core/Cameras';
import type { Engine } from 'core/Engines';
import { Constants, NullEngine } from 'core/Engines';
import { Vector3 } from 'core/Maths';
import type { Mesh } from 'core/Meshes';
import { MeshBuilder } from 'core/Meshes';
import { Scene } from 'core/scene';


describe('Babylon Mesh Levels of Details', () => {
    let subject: Engine;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    describe('getLOD method', () => {
        let scene: Scene;
        let cameraArc: ArcRotateCamera;
        let cameraOrthographic: ArcRotateCamera;

        let knot0: Mesh;
        let knot1: Mesh;
        let knot2: Mesh;

        beforeEach(() => {
            scene = new Scene(subject);

            cameraArc = new ArcRotateCamera('Camera', 0, 0, 5, new Vector3(0, 0, 0), scene);

            cameraOrthographic = new ArcRotateCamera('Camera', 0, 0, 5, new Vector3(0, 0, 0), scene);
            cameraOrthographic.mode = Camera.ORTHOGRAPHIC_CAMERA;

            knot0 = MeshBuilder.CreateTorusKnot('Knot0', {
                radius: 10,
                tube: 3,
                radialSegments: 128,
                tubularSegments: 64,
                p: 2,
                q: 3,
            }, scene);
            knot1 = MeshBuilder.CreateTorusKnot('Knot1', {
                radius: 10,
                tube: 3,
                radialSegments: 64,
                tubularSegments: 32,
                p: 2,
                q: 3,
            }, scene);
            knot2 = MeshBuilder.CreateTorusKnot('Knot2', {
                radius: 10,
                tube: 3,
                radialSegments: 32,
                tubularSegments: 16,
                p: 2,
                q: 3,
            }, scene);

            knot0.addLODLevel(10, knot1);
            knot0.addLODLevel(20, knot2);
        });

        it('should select lod with correct distance', () => {
            expect(knot0.getLOD(cameraArc)).not.toBeNull();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot0');

            cameraArc.radius = 15;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot1');

            cameraArc.radius = 25;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot2');
        });

        it('should select lod with correct distance for orthographic camera', () => {
            expect(knot0.getLOD(cameraOrthographic)).not.toBeNull();
            expect(knot0.getLOD(cameraOrthographic)!.name).toEqual('Knot0');

            cameraOrthographic.minZ = 15;
            scene.render();
            expect(knot0.getLOD(cameraOrthographic)!.name).toEqual('Knot1');

            cameraOrthographic.minZ = 25;
            scene.render();
            expect(knot0.getLOD(cameraOrthographic)!.name).toEqual('Knot2');
        });

        it('should select loaded mesh while target lod mesh is not loaded yet', () => {
            // not loaded yet
            knot1.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
            knot2.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;

            cameraArc.radius = 15;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot0');

            cameraArc.radius = 25;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot0');

            // while loading
            knot1.delayLoadState = Constants.DELAYLOADSTATE_LOADING;
            knot2.delayLoadState = Constants.DELAYLOADSTATE_LOADING;

            cameraArc.radius = 15;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot0');

            cameraArc.radius = 25;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot0');

            // after loaded
            knot1.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
            knot2.delayLoadState = Constants.DELAYLOADSTATE_LOADED;

            cameraArc.radius = 15;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot1');

            cameraArc.radius = 25;
            scene.render();
            expect(knot0.getLOD(cameraArc)!.name).toEqual('Knot2');
        });

    });
});
