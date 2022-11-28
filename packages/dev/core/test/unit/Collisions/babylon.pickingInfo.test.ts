import { PickingInfo } from "core/Collisions";
import { Ray } from "core/Culling";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Vector2, Vector3 } from "core/Maths";
import type { Mesh } from "core/Meshes";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

describe("PickingInfo", () => {
    let subject: Engine;
    let scene: Scene;
    let box: Mesh;
    let torusKnot: Mesh;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);

        torusKnot = MeshBuilder.CreateTorusKnot(
            "Knot",
            {
                radius: 10,
                tube: 3,
                radialSegments: 32,
                tubularSegments: 8,
                p: 2,
                q: 3,
            },
            scene
        );

        box = MeshBuilder.CreateBox("Box", { size: 1 }, scene);
    });

    describe("getNormal", () => {
        it("should return null when no intersection", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = null;

            expect(pickingInfo.getNormal()).toBeNull();
        });

        it('should return null when "useVerticesNormals" is true and no normals', () => {
            const pickingInfo = new PickingInfo();

            box.isVerticesDataPresent = () => false;
            pickingInfo.pickedMesh = box;

            expect(pickingInfo.getNormal(true)).toBeNull();
        });

        it("should return null when no indices", () => {
            const pickingInfo = new PickingInfo();

            box.getIndices = () => null;
            pickingInfo.pickedMesh = box;

            expect(pickingInfo.getNormal()).toBeNull();
        });

        it("should return normal when useVerticesNormals is true", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;
            pickingInfo.faceId = 0;
            pickingInfo.bu = 0.5;
            pickingInfo.bv = 0.5;

            const normalBox = pickingInfo.getNormal(false, true);

            expect(normalBox).toBeInstanceOf(Vector3);
            expect(normalBox!.x).toBeCloseTo(0);
            expect(normalBox!.y).toBeCloseTo(0);
            expect(normalBox!.z).toBeCloseTo(1);

            // And test with the knot

            pickingInfo.pickedMesh = torusKnot;

            const normal = pickingInfo.getNormal(false, true);

            expect(normal).toBeInstanceOf(Vector3);
            expect(normal!.x).toBeCloseTo(-0.84);
            expect(normal!.y).toBeCloseTo(-0.24);
            expect(normal!.z).toBeCloseTo(-0.48);
        });

        it("should return normal when useVerticesNormals is false", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;
            pickingInfo.faceId = 0;
            pickingInfo.bu = 0.5;
            pickingInfo.bv = 0.5;

            const normalBox = pickingInfo.getNormal(false, false);

            expect(normalBox).toBeInstanceOf(Vector3);
            expect(normalBox!.x).toBeCloseTo(0);
            expect(normalBox!.y).toBeCloseTo(0);
            expect(normalBox!.z).toBeCloseTo(1);

            // And test with the knot

            pickingInfo.pickedMesh = torusKnot;

            const normal = pickingInfo.getNormal(false, false);

            expect(normal).toBeInstanceOf(Vector3);
            expect(normal!.x).toBeCloseTo(-0.89);
            expect(normal!.y).toBeCloseTo(-0.08);
            expect(normal!.z).toBeCloseTo(-0.45);
        });

        it('should transform normal to world when "useWorldCoordinates" is true', () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;
            pickingInfo.faceId = 0;
            pickingInfo.bu = 0.5;
            pickingInfo.bv = 0.5;

            box.scaling = new Vector3(1, 2, 3);
            box.rotation = new Vector3(0, Math.PI / 2, 0);
            box.computeWorldMatrix(true);

            const normalBox = pickingInfo.getNormal(true, true);

            expect(normalBox).toBeInstanceOf(Vector3);
            expect(normalBox!.x).toBeCloseTo(1);
            expect(normalBox!.y).toBeCloseTo(0);
            expect(normalBox!.z).toBeCloseTo(0);

            // And test with the knot

            pickingInfo.pickedMesh = torusKnot;

            torusKnot.scaling = new Vector3(1, 2, 3);
            torusKnot.rotation = new Vector3(0, Math.PI / 2, 0);
            torusKnot.computeWorldMatrix(true);

            const normal = pickingInfo.getNormal(true, true);

            expect(normal).toBeInstanceOf(Vector3);
            expect(normal!.x).toBeCloseTo(-0.18);
            expect(normal!.y).toBeCloseTo(-0.14);
            expect(normal!.z).toBeCloseTo(0.97);
        });

        it("should use the ray when provided", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;
            pickingInfo.faceId = 0;
            pickingInfo.bu = 0.5;
            pickingInfo.bv = 0.5;
            pickingInfo.ray = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, 1));

            const normalBox = pickingInfo.getNormal(true, true);

            expect(normalBox).toBeInstanceOf(Vector3);
            expect(normalBox!.x).toBeCloseTo(0);
            expect(normalBox!.y).toBeCloseTo(0);
            expect(normalBox!.z).toBeCloseTo(-1);

            // And test with the knot

            pickingInfo.pickedMesh = torusKnot;

            const normal = pickingInfo.getNormal(true, true);

            expect(normal).toBeInstanceOf(Vector3);
            expect(normal!.x).toBeCloseTo(-0.84);
            expect(normal!.y).toBeCloseTo(-0.24);
            expect(normal!.z).toBeCloseTo(-0.48);
        });

        it("should transform normal to world when 'useWorldCoordinates' is false and ray is provided", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;
            pickingInfo.faceId = 0;
            pickingInfo.bu = 0.5;
            pickingInfo.bv = 0.5;
            pickingInfo.ray = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, 1));

            box.scaling = new Vector3(1, 2, 3);
            box.rotation = new Vector3(0, Math.PI / 4, 0);
            box.computeWorldMatrix(true);

            const normalBox = pickingInfo.getNormal(false, true);

            expect(normalBox).toBeInstanceOf(Vector3);
            expect(normalBox!.x).toBeCloseTo(0);
            expect(normalBox!.y).toBeCloseTo(0);
            expect(normalBox!.z).toBeCloseTo(-1);

            // And test with the knot

            pickingInfo.pickedMesh = torusKnot;

            torusKnot.scaling = new Vector3(1, 2, 3);
            torusKnot.rotation = new Vector3(0, Math.PI / 4, 0);
            torusKnot.computeWorldMatrix(true);

            const normal = pickingInfo.getNormal(false, true);

            expect(normal).toBeInstanceOf(Vector3);
            expect(normal!.x).toBeCloseTo(0.84);
            expect(normal!.y).toBeCloseTo(0.24);
            expect(normal!.z).toBeCloseTo(0.48);
        });
    });

    describe("getTextureCoordinates", () => {
        it("should return null when no pickedMesh", () => {
            const pickingInfo = new PickingInfo();
            expect(pickingInfo.getTextureCoordinates()).toBeNull();
        });

        it("should return null when pickedMesh has no UV", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;

            box.isVerticesDataPresent = () => false;

            expect(pickingInfo.getTextureCoordinates()).toBeNull();
        });

        it("should return null when indicies are not present", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;

            box.isVerticesDataPresent = () => true;
            box.getIndices = () => null;

            expect(pickingInfo.getTextureCoordinates()).toBeNull();
        });

        it("should return null when uvs are not present", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;

            box.isVerticesDataPresent = () => true;
            box.getIndices = () => [];
            box.getVerticesData = () => null;

            expect(pickingInfo.getTextureCoordinates()).toBeNull();
        });

        it("should return vector2 with correct values", () => {
            const pickingInfo = new PickingInfo();
            pickingInfo.pickedMesh = box;
            pickingInfo.faceId = 0;
            pickingInfo.bu = 0.5;
            pickingInfo.bv = 0.5;

            const uv = pickingInfo.getTextureCoordinates();

            expect(uv).toBeInstanceOf(Vector2);
            expect(uv!.x).toBeCloseTo(0.5);
            expect(uv!.y).toBeCloseTo(1);

            // And test with the knot

            pickingInfo.pickedMesh = torusKnot;

            const uvKnot = pickingInfo.getTextureCoordinates();

            expect(uvKnot!.x).toBeCloseTo(0.02);
            expect(uvKnot!.y).toBeCloseTo(0.06);
        });
    });
});
