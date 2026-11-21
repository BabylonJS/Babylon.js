import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

async function evaluateConvertedUvTransforms(backend: "webgl2" | "webgpu") {
    const results = [];
    for (const consecutive of [false, true]) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        document.body.appendChild(canvas);
        const engine = backend === "webgpu" ? new BABYLON.WebGPUEngine(canvas) : new BABYLON.Engine(canvas, false);
        try {
            if (engine instanceof BABYLON.WebGPUEngine) {
                await engine.initAsync();
            }
            const scene = new BABYLON.Scene(engine);
            try {
                new BABYLON.ArcRotateCamera("camera", 0, 1, 4, BABYLON.Vector3.Zero(), scene);
                const image = document.createElement("canvas");
                image.width = image.height = 4;
                const context = image.getContext("2d")!;
                context.fillStyle = "rgb(204,128,230)";
                context.fillRect(0, 0, 2, 4);
                context.fillStyle = "rgb(102,153,230)";
                context.fillRect(2, 0, 2, 4);
                const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
                const source = {
                    asset: { version: "2.0" },
                    extensionsUsed: [
                        "KHR_materials_retroreflection",
                        "KHR_materials_transmission",
                        "KHR_materials_volume",
                        "KHR_texture_transform",
                        ...(consecutive ? ["KHR_materials_diffuse_transmission"] : []),
                    ],
                    scene: 0,
                    scenes: [{ nodes: [0] }],
                    nodes: [{ mesh: 0 }],
                    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
                    materials: [
                        {
                            pbrMetallicRoughness: { metallicFactor: 0, baseColorTexture: { index: 0, extensions: { KHR_texture_transform: { scale: [0.5, 1] } } } },
                            normalTexture: { index: 0, extensions: { KHR_texture_transform: { scale: [0.5, 1] } } },
                            extensions: {
                                KHR_materials_retroreflection: { retroreflectionFactor: 0.5 },
                                KHR_materials_transmission: { transmissionFactor: 1 },
                                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                                ...(consecutive ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5 } } : {}),
                            },
                        },
                    ],
                    textures: [{ source: 0 }],
                    images: [{ uri: image.toDataURL() }],
                    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
                    bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
                    buffers: [{ byteLength: positions.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(positions.buffer))) }],
                };
                let completion: Promise<void> | undefined;
                const observer = BABYLON.SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                    if (plugin instanceof BABYLON.GLTFFileLoader) {
                        completion = plugin.whenCompleteAsync();
                    }
                });
                let loaded;
                try {
                    loaded = await BABYLON.ImportMeshAsync(`data:${JSON.stringify(source)}`, scene, { pluginExtension: ".gltf", pluginOptions: { gltf: { useOpenPBR: false } } });
                    await completion;
                } finally {
                    BABYLON.SceneLoader.OnPluginActivatedObservable.remove(observer);
                }
                const material = loaded.meshes.find((mesh) => mesh.material)!.material as InstanceType<typeof BABYLON.OpenPBRMaterial>;
                await scene.whenReadyAsync();
                const fragment =
                    backend === "webgpu"
                        ? `var sourceSampler: sampler;
                           var source: texture_2d<f32>;
                           uniform sourceMatrix: mat4x4f;
                           @fragment fn main(input: FragmentInputs) -> FragmentOutputs {
                               let uv = (uniforms.sourceMatrix * vec4f(1.5, 0.5, 1.0, 0.0)).xy;
                               fragmentOutputs.color = textureSample(source, sourceSampler, uv);
                           }`
                        : `precision highp float;
                           uniform sampler2D source;
                           uniform mat4 sourceMatrix;
                           void main() {
                               vec2 uv = (sourceMatrix * vec4(1.5, 0.5, 1.0, 0.0)).xy;
                               gl_FragColor = texture2D(source, uv);
                           }`;
                for (const weight of [1, 0.5]) {
                    material.transmissionWeight = weight;
                    engine.beginFrame();
                    scene.render();
                    engine.endFrame();
                    for (const kind of ["color", "normal"]) {
                        const texture = (kind === "color" ? material.coatColorTexture : material.geometryCoatNormalTexture)!;
                        const probe = new BABYLON.ProceduralTexture(
                            "repeatProbe",
                            1,
                            { fragmentSource: fragment },
                            scene,
                            { shaderLanguage: backend === "webgpu" ? BABYLON.ShaderLanguage.WGSL : BABYLON.ShaderLanguage.GLSL },
                            false
                        );
                        try {
                            probe.setTexture("source", texture);
                            probe.setMatrix("sourceMatrix", texture.getTextureMatrix());
                            await new Promise<void>((resolve) => probe.executeWhenReady(() => resolve()));
                            probe.render();
                            const pixels = await probe.readPixels();
                            if (!(pixels instanceof Uint8Array) || pixels.length !== 4) {
                                throw new Error("Expected one repeat-UV sample");
                            }
                            const encoded = [102, 153, 230].map((value) => value / 255);
                            const normal = encoded.map((value) => value * 2 - 1);
                            const length = Math.hypot(...normal);
                            const expected =
                                kind === "normal"
                                    ? normal.map((value) => ((value / length) * 0.5 + 0.5) * 255)
                                    : encoded.map((value) => {
                                          const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                                          const tinted = 1 - weight + weight * linear;
                                          return (tinted <= 0.0031308 ? tinted * 12.92 : 1.055 * tinted ** (1 / 2.4) - 0.055) * 255;
                                      });
                            const maxError = Math.max(...expected.map((value, i) => Math.abs(pixels[i] - value)));
                            results.push({ consecutive, weight, kind, maxError });
                        } finally {
                            probe.dispose();
                        }
                    }
                }
            } finally {
                scene.dispose();
            }
        } finally {
            engine.dispose();
            canvas.remove();
        }
    }
    return results;
}

for (const backend of ["webgl2", "webgpu"] as const) {
    test(`converted coat factors preserve repeated UVs on ${backend}`, async ({ page }) => {
        await page.goto(`${getGlobalConfig().baseUrl}/empty.html`);
        test.skip(backend === "webgpu" && !(await page.evaluate(() => !!navigator.gpu)), "WebGPU is unavailable in this browser");
        await page.addScriptTag({ url: `${getGlobalConfig().baseUrl}/loaders/babylonjs.loaders.min.js` });
        const results = await page.evaluate(evaluateConvertedUvTransforms, backend);
        expect(results).toHaveLength(8);
        for (const result of results) {
            expect(result.maxError, JSON.stringify(result)).toBeLessThanOrEqual(3);
        }
    });
}
