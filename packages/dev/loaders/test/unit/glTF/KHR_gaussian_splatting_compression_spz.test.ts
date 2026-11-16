import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gzipSync } from "zlib";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh.pure";
import { _ConvertSpzRubToLuf, KHR_gaussian_splatting_compression_spz } from "loaders/glTF/2.0/Extensions/KHR_gaussian_splatting_compression_spz.pure";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/KHR_gaussian_splatting";
import "loaders/glTF/2.0/Extensions/KHR_gaussian_splatting_compression_spz";

/**
 * Unnormalized real spherical harmonics of bands 1 to 4, in storage order (m from -l to l), on the unit sphere.
 * @param x direction x
 * @param y direction y
 * @param z direction z
 * @returns the basis values
 */
function EvaluateShBasis(x: number, y: number, z: number): number[] {
    const z2 = z * z;
    return [
        y,
        z,
        x,
        x * y,
        y * z,
        3 * z2 - 1,
        x * z,
        x * x - y * y,
        y * (3 * x * x - y * y),
        x * y * z,
        y * (5 * z2 - 1),
        z * (5 * z2 - 3),
        x * (5 * z2 - 1),
        z * (x * x - y * y),
        x * (x * x - 3 * y * y),
        x * y * (x * x - y * y),
        y * z * (3 * x * x - y * y),
        x * y * (7 * z2 - 1),
        y * z * (7 * z2 - 3),
        35 * z2 * z2 - 30 * z2 + 3,
        x * z * (7 * z2 - 3),
        (x * x - y * y) * (7 * z2 - 1),
        x * z * (x * x - 3 * y * y),
        x * x * (x * x - 3 * y * y) - y * y * (3 * x * x - y * y),
    ];
}

/**
 * Builds a gzipped SPZ version 2 file containing a single splat.
 * @param shDegree spherical harmonics degree
 * @returns the SPZ bytes
 */
function BuildSpz(shDegree: number): Uint8Array {
    const shByteCount = ((shDegree + 1) * (shDegree + 1) - 1) * 3;
    const raw = new Uint8Array(16 + 9 + 1 + 3 + 3 + 3 + shByteCount);
    const header = new DataView(raw.buffer);
    header.setUint32(0, 0x5053474e, true);
    header.setUint32(4, 2, true);
    header.setUint32(8, 1, true);
    raw[12] = shDegree;
    raw[13] = 12;
    raw.fill(128, 25);
    return gzipSync(raw);
}

/**
 * Builds a glTF with one KHR_gaussian_splatting primitive compressed with KHR_gaussian_splatting_compression_spz_2.
 * @param spz the SPZ payload
 * @returns the glTF JSON
 */
function BuildGltf(spz: Uint8Array): string {
    return JSON.stringify({
        asset: { version: "2.0" },
        extensionsUsed: ["KHR_gaussian_splatting", "KHR_gaussian_splatting_compression_spz_2"],
        extensionsRequired: ["KHR_gaussian_splatting", "KHR_gaussian_splatting_compression_spz_2"],
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [
            {
                primitives: [
                    {
                        mode: 0,
                        attributes: {},
                        extensions: { KHR_gaussian_splatting: { extensions: { KHR_gaussian_splatting_compression_spz_2: { bufferView: 0 } } } },
                    },
                ],
            },
        ],
        bufferViews: [{ buffer: 0, byteLength: spz.length }],
        buffers: [{ byteLength: spz.length, uri: `data:application/octet-stream;base64,${Buffer.from(spz).toString("base64")}` }],
    });
}

describe("KHR_gaussian_splatting_compression_spz", () => {
    it("converts packed splats from RUB to LUF", () => {
        const data = new ArrayBuffer(32);
        const floats = new Float32Array(data);
        const bytes = new Uint8Array(data);
        floats.set([1, 2, 3]);
        bytes.set([10, 20, 30, 40], 28);

        const sh = [new Uint8Array(16)];
        sh[0].set([100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115]);
        sh[0][3] = 0; // first flipped coefficient (degree 1, coefficient 1) saturates at 255

        _ConvertSpzRubToLuf(data, sh, 1);

        expect(Array.from(floats.subarray(0, 3))).toEqual([-1, 2, -3]);
        expect(Array.from(bytes.subarray(28, 32))).toEqual([10, 255 - 20, 30, 255 - 40]);
        // Degree 1 is [keep, flip, flip]: bytes 0-2 are kept, 3-8 are negated, the rest is untouched.
        expect(Array.from(sh[0].subarray(0, 9))).toEqual([100, 101, 102, 255, 256 - 104, 256 - 105, 256 - 106, 256 - 107, 256 - 108]);
        expect(sh[0][9]).toBe(109);
    });

    it("negates exactly the spherical harmonics coefficients that are odd under the conversion, up to degree 4", () => {
        const length = Math.hypot(0.3, 0.5, 0.7);
        const [x, y, z] = [0.3 / length, 0.5 / length, 0.7 / length];
        const original = EvaluateShBasis(x, y, z);
        const rotated = EvaluateShBasis(-x, y, -z);

        const sh = Array.from({ length: 5 }, () => new Uint8Array(16).fill(100));
        _ConvertSpzRubToLuf(new ArrayBuffer(32), sh, 4);

        for (let coef = 0; coef < 24; coef++) {
            const flips = rotated[coef] / original[coef] < 0;
            for (let channel = 0; channel < 3; channel++) {
                const flatIndex = coef * 3 + channel;
                expect(sh[flatIndex >> 4][flatIndex & 15], `coefficient ${coef}`).toBe(flips ? 156 : 100);
            }
        }
        // Bytes past the 72 degree-4 components are padding and stay untouched.
        expect(Array.from(sh[4].subarray(8))).toEqual(new Array(8).fill(100));
    });

    it("does not handle primitives without the nested SPZ extension", () => {
        const loader = { isExtensionUsed: () => true } as any;
        const extension = new KHR_gaussian_splatting_compression_spz(loader, "KHR_gaussian_splatting_compression_spz_2");

        expect(extension.enabled).toBe(true);
        expect(extension.order).toBeLessThan(200);
        const primitive = { attributes: {}, extensions: { KHR_gaussian_splatting: { extensions: {} } } } as any;
        expect(extension._loadMeshPrimitiveAsync("/meshes/0/primitives/0", "m", {} as any, {} as any, primitive, () => {})).toBeNull();
        expect(extension._loadMeshPrimitiveAsync("/meshes/0/primitives/0", "m", {} as any, {} as any, { attributes: {} } as any, () => {})).toBeNull();
    });

    describe("asset container loading", () => {
        let engine: NullEngine;
        let scene: Scene;
        let originalWorker: typeof Worker | undefined;
        let originalCreateObjectURL: typeof URL.createObjectURL;

        beforeEach(() => {
            // The splat mesh starts a depth-sort worker, which Node does not provide.
            originalWorker = (globalThis as any).Worker;
            originalCreateObjectURL = URL.createObjectURL;
            (globalThis as any).Worker = class {
                public postMessage = vi.fn();
                public terminate = vi.fn();
                public onmessage: unknown = null;
            };
            URL.createObjectURL = vi.fn(() => "blob:mock");
            engine = new NullEngine();
            scene = new Scene(engine);
            new FreeCamera("camera", new Vector3(0, 0, -5), scene);
        });

        afterEach(() => {
            scene.dispose();
            engine.dispose();
            (globalThis as any).Worker = originalWorker;
            URL.createObjectURL = originalCreateObjectURL;
        });

        it("keeps the generated mesh, material and textures in the container", async () => {
            const container = await LoadAssetContainerAsync(`data:${BuildGltf(BuildSpz(1))}`, scene, {
                pluginExtension: ".gltf",
                pluginOptions: { gltf: { extensionOptions: { KHR_gaussian_splatting_compression_spz_2: { spzLibraryUrl: undefined } } } },
            });

            const mesh = container.meshes.find((m) => m instanceof GaussianSplattingMesh) as GaussianSplattingMesh;
            expect(mesh).toBeDefined();
            const generatedTextures = [mesh.covariancesATexture, mesh.covariancesBTexture, mesh.centersTexture, mesh.colorsTexture, ...(mesh.shTextures ?? [])];
            expect(generatedTextures.every((texture) => !!texture)).toBe(true);

            expect(container.materials).toContain(mesh.material);
            for (const texture of generatedTextures) {
                expect(container.textures).toContain(texture);
                expect(texture!._parentContainer).toBe(container);
                expect(scene.textures).not.toContain(texture);
            }
            expect(scene.meshes).not.toContain(mesh);
            expect(scene.materials).not.toContain(mesh.material);

            container.addAllToScene();
            expect(scene.meshes).toContain(mesh);
            expect(scene.materials).toContain(mesh.material);
            for (const texture of generatedTextures) {
                expect(scene.textures).toContain(texture);
            }

            container.removeAllFromScene();
            expect(scene.meshes).not.toContain(mesh);
            for (const texture of generatedTextures) {
                expect(scene.textures).not.toContain(texture);
            }

            container.dispose();
            expect(mesh.isDisposed()).toBe(true);
            expect(container.textures).toHaveLength(0);
        });
    });
});
