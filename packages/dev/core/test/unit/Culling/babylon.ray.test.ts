import { Ray } from "core/Culling";
import { Engine, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { VertexData, Mesh, Geometry } from "core/Meshes";
import { Scene } from "core/scene";
import "core/Materials/standardMaterial";

/**
 * Describes the test suite.
 */
describe("Babylon Ray", function () {
    let subject: Engine;

    jest.setTimeout(10000);

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;
    });

    /**
     * Ray tests.
     */
    describe("#ray", () => {
        it("pickWithRay", () => {
            const scene = new Scene(subject);

            const vertexData = new VertexData();
            vertexData.indices = [0, 1, 2];
            vertexData.positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
            vertexData.normals = [0, 0, -1, 1, 0, -1, 0, 1, -1];

            const mesh = new Mesh("triangle", scene);

            const geometry = new Geometry("triangle", scene, vertexData);
            geometry.applyToMesh(mesh);

            const direction = Vector3.Forward();
            for (const index of vertexData.indices) {
                const position = Vector3.FromArray(vertexData.positions, index * 3);
                const normal = Vector3.FromArray(vertexData.normals, index * 3).normalize();
                const origin = new Vector3(position.x, position.y, position.z - 1);
                const ray = new Ray(origin, direction);
                const hit = scene.pickWithRay(ray);
                expect(hit && hit.hit).toBeTruthy();
                expect(Vector3.DistanceSquared(hit?.pickedPoint!, position)).toBe(0);
                expect(Vector3.DistanceSquared(hit?.getNormal()!, normal)).toBe(0);
            }
        });
    });
});
