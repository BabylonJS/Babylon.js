import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";
import type { IAnimationKey } from "core/Animations/animationKey";
import { Constants } from "core/Engines";

declare const BABYLON: typeof import("core/index") &
    typeof import("serializers/index") & {
        GLTF2: {
            Exporter: any;
        };
    };
interface Window {
    BABYLON: typeof BABYLON;
    scene: typeof BABYLON.Scene | null;
}

const debug = process.env.DEBUG === "true";
/**
 * Describes the test suite
 */
describe("Babylon glTF Serializer", () => {
    beforeAll(async () => {
        await logPageErrors(page, debug);
    });
    jest.setTimeout(debug ? 1000000 : 30000);

    beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load",
            timeout: 0,
        });
        await page.evaluate(evaluateInitEngine);
        await page.evaluate(evaluateCreateScene);
    });

    afterEach(async () => {
        debug && (await jestPuppeteer.debug());
        await page.evaluate(evaluateDisposeEngine);
    });

    /**
     * This tests the glTF serializer help functions
     */
    describe("#GLTF Serializer", () => {
        it("should convert Babylon standard material to metallic roughness", async () => {
            const assertionData = await page.evaluate(() => {
                const babylonStandardMaterial = new BABYLON.StandardMaterial("specGloss");
                babylonStandardMaterial.diffuseColor = BABYLON.Color3.White();
                babylonStandardMaterial.specularColor = BABYLON.Color3.Black();
                babylonStandardMaterial.specularPower = 64;
                babylonStandardMaterial.alpha = 1;

                const metalRough = BABYLON.GLTF2.Exporter._ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
                return {
                    baseColor: metalRough.baseColorFactor,
                    metallic: metalRough.metallicFactor,
                    roughness: metalRough.roughnessFactor,
                };
            });

            expect(assertionData.baseColor).toEqual([0.5, 0.5, 0.5, 1]);
            expect(assertionData.metallic).toEqual(0);
            expect(assertionData.roughness).toBeCloseTo(0.328809, 1e-6);
        });
        it("should solve for metallic", async () => {
            const assertionData = await page.evaluate(() => {
                const solveZero = BABYLON.GLTF2.Exporter._SolveMetallic(1.0, 0.0, 1.0);
                const solveApproxOne = BABYLON.GLTF2.Exporter._SolveMetallic(0.0, 1.0, 1.0);
                return {
                    solveZero,
                    solveApproxOne: solveApproxOne,
                };
            });
            expect(assertionData.solveZero).toBe(0.0);
            expect(assertionData.solveApproxOne).toBeCloseTo(1.0, 1e-6);
        });
        it("should serialize empty Babylon window.scene to glTF with only asset property", async () => {
            const assertionData = await page.evaluate(async () => {
                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                const jsonData = JSON.parse(jsonString);

                return {
                    len: Object.keys(jsonData).length,
                    version: jsonData.asset.version,
                    generator: jsonData.asset.generator,
                };
            });
            expect(assertionData.len).toEqual(1);
            expect(assertionData.version).toEqual("2.0");
            expect(assertionData.generator).toContain("Babylon.js v");
        });
        it("should serialize sphere geometry in window.scene to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                BABYLON.MeshBuilder.CreateSphere(
                    "sphere",
                    {
                        diameter: 1,
                    },
                    window.scene
                );

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(9);
            expect(assertionData.accessors).toHaveLength(3);
            expect(Object.keys(assertionData.asset)).toHaveLength(2);
            expect(assertionData.buffers).toHaveLength(1);
            expect(assertionData.bufferViews).toHaveLength(4);
            expect(assertionData.meshes).toHaveLength(1);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scene).toEqual(0);
        });
        it("should serialize single component translation animation to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                const box = BABYLON.MeshBuilder.CreateBox(
                    "box",
                    {
                        size: 1,
                    },
                    window.scene
                );
                const keys: IAnimationKey[] = [];
                keys.push({
                    frame: 0,
                    value: 1,
                });
                keys.push({
                    frame: 20,
                    value: 0.2,
                });
                keys.push({
                    frame: 40,
                    value: 1,
                });
                const animationBoxT = new BABYLON.Animation(
                    "boxAnimation_translation",
                    "position.y",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                animationBoxT.setKeys(keys);
                box.animations.push(animationBoxT);

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(10);
            expect(assertionData.accessors).toHaveLength(5);
            expect(Object.keys(assertionData.asset)).toHaveLength(2);
            expect(assertionData.buffers).toHaveLength(1);
            expect(assertionData.bufferViews).toHaveLength(6);
            expect(assertionData.meshes).toHaveLength(1);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scene).toEqual(0);
            expect(assertionData.animations).toHaveLength(1);
            expect(assertionData.animations[0].channels).toHaveLength(1);
            expect(assertionData.animations[0].channels[0].sampler).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.node).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.path).toEqual("translation");
            expect(assertionData.animations[0].samplers).toHaveLength(1);
        });
        it("should serialize translation animation to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                const box = BABYLON.MeshBuilder.CreateBox(
                    "box",
                    {
                        size: 1,
                    },
                    window.scene
                );
                const keys: IAnimationKey[] = [];
                keys.push({
                    frame: 0,
                    value: new BABYLON.Vector3(0.1, 0.1, 0.1),
                });
                keys.push({
                    frame: 20,
                    value: BABYLON.Vector3.One(),
                });
                keys.push({
                    frame: 40,
                    value: new BABYLON.Vector3(0.1, 0.1, 0.1),
                });
                const animationBoxT = new BABYLON.Animation(
                    "boxAnimation_translation",
                    "position",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                animationBoxT.setKeys(keys);
                box.animations.push(animationBoxT);

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(10);
            expect(assertionData.accessors).toHaveLength(5);
            expect(Object.keys(assertionData.asset)).toHaveLength(2);
            expect(assertionData.buffers).toHaveLength(1);
            expect(assertionData.bufferViews).toHaveLength(6);
            expect(assertionData.meshes).toHaveLength(1);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scene).toEqual(0);
            expect(assertionData.animations).toHaveLength(1);
            expect(assertionData.animations[0].channels).toHaveLength(1);
            expect(assertionData.animations[0].channels[0].sampler).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.node).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.path).toEqual("translation");
            expect(assertionData.animations[0].samplers).toHaveLength(1);
            expect(assertionData.animations[0].samplers[0].interpolation).toEqual("LINEAR");
            expect(assertionData.animations[0].samplers[0].input).toEqual(3);
            expect(assertionData.animations[0].samplers[0].output).toEqual(4);
            expect(assertionData.animations[0].samplers).toHaveLength(1);
        });
        it("should serialize scale animation to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                const box = BABYLON.MeshBuilder.CreateBox(
                    "box",
                    {
                        size: 1,
                    },
                    window.scene
                );
                const keys: IAnimationKey[] = [];
                keys.push({
                    frame: 0,
                    value: new BABYLON.Vector3(0.1, 0.1, 0.1),
                });
                keys.push({
                    frame: 20,
                    value: BABYLON.Vector3.One(),
                });
                keys.push({
                    frame: 40,
                    value: new BABYLON.Vector3(0.1, 0.1, 0.1),
                });
                const animationBoxT = new BABYLON.Animation(
                    "boxAnimation_translation",
                    "scaling",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                animationBoxT.setKeys(keys);
                box.animations.push(animationBoxT);

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(10);
            expect(assertionData.accessors).toHaveLength(5);
            expect(Object.keys(assertionData.asset)).toHaveLength(2);
            expect(assertionData.buffers).toHaveLength(1);
            expect(assertionData.bufferViews).toHaveLength(6);
            expect(assertionData.meshes).toHaveLength(1);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scene).toEqual(0);
            expect(assertionData.animations).toHaveLength(1);
            expect(assertionData.animations[0].channels).toHaveLength(1);
            expect(assertionData.animations[0].channels[0].sampler).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.node).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.path).toEqual("scale");
            expect(assertionData.animations[0].samplers).toHaveLength(1);
            expect(assertionData.animations[0].samplers[0].interpolation).toEqual("LINEAR");
            expect(assertionData.animations[0].samplers[0].input).toEqual(3);
            expect(assertionData.animations[0].samplers[0].output).toEqual(4);
            expect(assertionData.animations[0].samplers).toHaveLength(1);
        });
        it("should serialize rotation quaternion animation to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                const box = BABYLON.MeshBuilder.CreateBox(
                    "box",
                    {
                        size: 1,
                    },
                    window.scene
                );
                const keys: IAnimationKey[] = [];
                keys.push({
                    frame: 0,
                    value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707),
                });
                keys.push({
                    frame: 20,
                    value: BABYLON.Quaternion.Identity(),
                });
                keys.push({
                    frame: 40,
                    value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707),
                });
                const animationBoxT = new BABYLON.Animation(
                    "boxAnimation_translation",
                    "rotationQuaternion",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                animationBoxT.setKeys(keys);
                box.animations.push(animationBoxT);

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(10);
            expect(assertionData.accessors).toHaveLength(5);
            expect(Object.keys(assertionData.asset)).toHaveLength(2);
            expect(assertionData.buffers).toHaveLength(1);
            expect(assertionData.bufferViews).toHaveLength(6);
            expect(assertionData.meshes).toHaveLength(1);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scene).toEqual(0);
            expect(assertionData.animations).toHaveLength(1);
            expect(assertionData.animations[0].channels).toHaveLength(1);
            expect(assertionData.animations[0].channels[0].sampler).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.node).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.path).toEqual("rotation");
            expect(assertionData.animations[0].samplers).toHaveLength(1);
            expect(assertionData.animations[0].samplers[0].interpolation).toEqual("LINEAR");
            expect(assertionData.animations[0].samplers[0].input).toEqual(3);
            expect(assertionData.animations[0].samplers[0].output).toEqual(4);
            expect(assertionData.animations[0].samplers).toHaveLength(1);
        });
        it("should serialize combined animations to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                const box = BABYLON.MeshBuilder.CreateBox(
                    "box",
                    {
                        size: 1,
                    },
                    window.scene
                );
                const rotationKeyFrames: IAnimationKey[] = [];
                rotationKeyFrames.push({
                    frame: 0,
                    value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707),
                });
                rotationKeyFrames.push({
                    frame: 20,
                    value: BABYLON.Quaternion.Identity(),
                });
                rotationKeyFrames.push({
                    frame: 40,
                    value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707),
                });
                const scaleKeyFrames: IAnimationKey[] = [];
                scaleKeyFrames.push({
                    frame: 0,
                    value: new BABYLON.Vector3(0.1, 0.1, 0.1),
                });
                scaleKeyFrames.push({
                    frame: 20,
                    value: BABYLON.Vector3.One(),
                });
                scaleKeyFrames.push({
                    frame: 40,
                    value: new BABYLON.Vector3(0.1, 0.1, 0.1),
                });
                const rotationAnimationBox = new BABYLON.Animation(
                    "boxAnimation_rotation",
                    "rotationQuaternion",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                rotationAnimationBox.setKeys(rotationKeyFrames);
                box.animations.push(rotationAnimationBox);
                const scaleAnimationBox = new BABYLON.Animation(
                    "boxAnimation_scale",
                    "scaling",
                    30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
                scaleAnimationBox.setKeys(scaleKeyFrames);
                box.animations.push(scaleAnimationBox);

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(10);
            expect(assertionData.accessors).toHaveLength(7);
            expect(assertionData.asset).toBeDefined();
            expect(Object.keys(assertionData.asset)).toHaveLength(2);
            expect(assertionData.buffers).toHaveLength(1);
            expect(assertionData.bufferViews).toHaveLength(8);
            expect(assertionData.meshes).toHaveLength(1);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scene).toEqual(0);
            expect(assertionData.animations).toHaveLength(2);
            expect(assertionData.animations[0].channels).toHaveLength(1);
            expect(assertionData.animations[0].channels[0].sampler).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.node).toEqual(0);
            expect(assertionData.animations[0].channels[0].target.path).toEqual("rotation");
            expect(assertionData.animations[0].samplers).toHaveLength(1);
            expect(assertionData.animations[0].samplers[0].interpolation).toEqual("LINEAR");
            expect(assertionData.animations[0].samplers[0].input).toEqual(3);
            expect(assertionData.animations[0].samplers[0].output).toEqual(4);
            expect(assertionData.animations[1].channels[0].sampler).toEqual(0);
            expect(assertionData.animations[1].channels[0].target.node).toEqual(0);
            expect(assertionData.animations[1].channels[0].target.path).toEqual("scale");
            expect(assertionData.animations[1].samplers).toHaveLength(1);
            expect(assertionData.animations[1].samplers[0].interpolation).toEqual("LINEAR");
            expect(assertionData.animations[1].samplers[0].input).toEqual(5);
            expect(assertionData.animations[1].samplers[0].output).toEqual(6);
        });
        it("should serialize point light to glTF", async () => {
            const intensity = 0.2;
            const red = [1, 0, 0];
            const assertionData = await page.evaluate(
                async (intensity, red) => {
                    const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(4, 4, 0), window.scene!);
                    pointLight.intensity = intensity;
                    const diffuseColor = BABYLON.Color3.FromArray(red);
                    pointLight.diffuse = diffuseColor;

                    const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                    const jsonString = glTFData.files["test.gltf"] as string;
                    return JSON.parse(jsonString);
                },
                intensity,
                red
            );
            expect(Object.keys(assertionData)).toHaveLength(6);
            expect(assertionData.extensions["KHR_lights_punctual"].lights).toHaveLength(1);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].intensity).toEqual(intensity);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].color).toEqual(red);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.nodes[0].extensions["KHR_lights_punctual"]["light"]).toEqual(0);
        });
        it("should serialize spot light to glTF", async () => {
            const intensity = 0.2;
            const red = [1, 0, 0];
            const innerAngle = Math.PI / 8;
            const angle = Math.PI / 4;
            const assertionData = await page.evaluate(
                async (intensity, red, innerAngle, angle) => {
                    const spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 4, 0), new BABYLON.Vector3(0, angle, 0), angle, 2, window.scene!);
                    spotLight.intensity = intensity;
                    spotLight.innerAngle = innerAngle;
                    const diffuseColor = BABYLON.Color3.FromArray(red);
                    spotLight.diffuse = diffuseColor;

                    const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                    const jsonString = glTFData.files["test.gltf"] as string;
                    return JSON.parse(jsonString);
                },
                intensity,
                red,
                innerAngle,
                angle
            );
            expect(Object.keys(assertionData)).toHaveLength(6);
            expect(assertionData.extensions["KHR_lights_punctual"].lights).toHaveLength(1);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].intensity).toEqual(intensity);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].spot.outerConeAngle).toEqual(angle / 2);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].spot.innerConeAngle).toEqual(innerAngle / 2);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].color).toEqual(red);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.nodes[0].extensions["KHR_lights_punctual"]["light"]).toEqual(0);
        });
        it("should serialize directional light to glTF", async () => {
            const intensity = 0.2;
            const red = [1, 0, 0];
            const assertionData = await page.evaluate(
                async (intensity, red) => {
                    const directionalLight = new BABYLON.DirectionalLight("directionalLight", BABYLON.Vector3.Forward(), window.scene!);
                    const diffuseColor = BABYLON.Color3.FromArray(red);
                    directionalLight.diffuse = diffuseColor;
                    directionalLight.intensity = intensity;

                    const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                    const jsonString = glTFData.files["test.gltf"] as string;
                    return JSON.parse(jsonString);
                },
                intensity,
                red
            );
            expect(Object.keys(assertionData)).toHaveLength(6);
            expect(assertionData.extensions["KHR_lights_punctual"].lights).toHaveLength(1);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].intensity).toEqual(intensity);
            expect(assertionData.extensions["KHR_lights_punctual"].lights[0].color).toEqual(red);
            expect(assertionData.nodes).toHaveLength(1);
            expect(assertionData.nodes[0].extensions["KHR_lights_punctual"]["light"]).toEqual(0);
        });
        it("should serialize multiple lights to glTF", async () => {
            const assertionData = await page.evaluate(async () => {
                new BABYLON.PointLight("pointLight", new BABYLON.Vector3(4, 4, 0), window.scene!);
                new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 4, 0), new BABYLON.Vector3(0, Math.PI / 4, 0), Math.PI / 4, 2, window.scene!);
                new BABYLON.DirectionalLight("directionalLight", BABYLON.Vector3.Forward(), window.scene!);

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(Object.keys(assertionData)).toHaveLength(6);
            expect(assertionData.extensions["KHR_lights_punctual"].lights).toHaveLength(3);
            expect(assertionData.nodes).toHaveLength(3);
        });
        it("serializes scene and node metadata", async () => {
            const assertionData = await page.evaluate(async () => {
                window.scene!.metadata = { gltf: { extras: { high: "five" } } };
                const box = BABYLON.CreateBox("box");
                box.metadata = { test: "test" };
                const box2 = BABYLON.CreateBox("box2");
                box2.metadata = { gltf: { extras: { foo: 2, bar: "baz" } } };
                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            const scene = assertionData.scenes[0];
            const box1 = assertionData.nodes.find((node: any) => node.name == "box");
            const box2 = assertionData.nodes.find((node: any) => node.name == "box2");
            expect(scene).toBeDefined();
            expect(scene.extras).toBeDefined();
            expect(scene.extras.high).toEqual("five");
            expect(box1).toBeDefined();
            expect(box1.extras).toBeUndefined();
            expect(box2).toBeDefined();
            expect(box2.extras).toBeDefined();
            expect(box2.extras.foo).toEqual(2);
            expect(box2.extras.bar).toEqual("baz");
        });

        describe("exporting instances", () => {
            const instanceCount = 3;
            const test = async (instanceCount: number, skipSource: boolean) => {
                const shouldExportNode = (node: any) => !skipSource || node.name !== "box";
                const mesh = BABYLON.MeshBuilder.CreateBox("box", {}, window.scene!);
                for (let i = 0; i < instanceCount; i++) {
                    mesh.createInstance("boxInstance" + i);
                }
                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test", { shouldExportNode });
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            };

            it("exports one mesh that is shared by all instances", async () => {
                const assertionData = await page.evaluate(test, instanceCount, false);
                expect(assertionData.nodes).toHaveLength(instanceCount + 1);
                expect(assertionData.meshes).toHaveLength(1);
                for (const node of assertionData.nodes) {
                    expect(node.mesh).toEqual(0);
                }
            });

            it("can export instances without their source mesh", async () => {
                const assertionData = await page.evaluate(test, instanceCount, true);
                expect(assertionData.nodes).toHaveLength(instanceCount);
                expect(assertionData.meshes).toHaveLength(1);
                for (const node of assertionData.nodes) {
                    expect(node.mesh).toEqual(0);
                }
            });
        });

        it("should not export a root conversion node", async () => {
            const assertionData = await page.evaluate(async () => {
                await BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Tests/TwoQuads/", "TwoQuads.gltf", window.scene);
                window.scene!.getMeshByName("__root__")!.name = "renamedRoot";
                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(assertionData.nodes).toHaveLength(2);
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scenes[0].nodes).toHaveLength(2);
        });
        it("should not duplicate a shared texture between materials", async () => {
            const assertionData = await page.evaluate(async () => {
                const texture = new BABYLON.Texture("https://assets.babylonjs.com/environments/backgroundGround.png", window.scene!);
                for (let i = 0; i < 2; i++) {
                    const material = new BABYLON.PBRMaterial("mat" + i, window.scene!);
                    material.bumpTexture = texture;
                    BABYLON.MeshBuilder.CreateBox("box" + i).material = material;
                }
                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(assertionData.textures).toHaveLength(1);
            expect(assertionData.images).toHaveLength(1);
        });
        it("should not convert right-handed node transformations", async () => {
            const transformsRH = {
                translation: [0.2, 0.3, 0.4],
                scale: [0.5, 0.6, 0.7],
                rotation: [0.5, 0.5, 0.5, 0.5],
            };
            const assertionData = await page.evaluate(async (transformsRH) => {
                window.scene!.useRightHandedSystem = true;
                const parent = BABYLON.MeshBuilder.CreateBox("box");
                BABYLON.Vector3.FromArrayToRef(transformsRH.translation, 0, parent.position);
                BABYLON.Vector3.FromArrayToRef(transformsRH.scale, 0, parent.scaling);
                parent.rotationQuaternion = BABYLON.Quaternion.FromArray(transformsRH.rotation);
                parent.clone("child").parent = parent;

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            }, transformsRH);
            expect(assertionData.nodes).toHaveLength(2);
            assertionData.nodes.forEach((node: any) => {
                expect(node.translation).toEqual(transformsRH.translation);
                expect(node.scale).toEqual(transformsRH.scale);
                expect(node.rotation).toEqual(transformsRH.rotation);
            });
        });
        it("should consistently convert left-handed node transformations", async () => {
            const transformsLH = {
                translation: [0.2, 0.3, 0.4],
                scale: [0.5, 0.6, 0.7],
                rotation: [0.5, 0.5, 0.5, 0.5],
            };
            const transformsRH = {
                translation: [-0.2, 0.3, 0.4],
                rotation: [-0.5, -0.5, 0.5, 0.5],
            };
            const assertionData = await page.evaluate(async (transformsLH) => {
                const parent = BABYLON.MeshBuilder.CreateBox("box");
                BABYLON.Vector3.FromArrayToRef(transformsLH.translation, 0, parent.position);
                BABYLON.Vector3.FromArrayToRef(transformsLH.scale, 0, parent.scaling);
                parent.rotationQuaternion = BABYLON.Quaternion.FromArray(transformsLH.rotation);
                parent.clone("child").parent = parent;

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            }, transformsLH);
            expect(assertionData.nodes).toHaveLength(2);
            assertionData.nodes.forEach((node: any) => {
                expect(node.translation).toEqual(transformsRH.translation);
                expect(node.scale).toEqual(transformsLH.scale);
                expect(node.rotation).toEqual(transformsRH.rotation);
            });
        });

        it("should reparent children of unexported node to nearest ancestor", async () => {
            const assertionData = await page.evaluate(async () => {
                const parent = BABYLON.MeshBuilder.CreateBox("parent");
                const child = BABYLON.MeshBuilder.CreateBox("child");
                child.parent = parent;
                BABYLON.MeshBuilder.CreateBox("grandchild1").parent = child;
                BABYLON.MeshBuilder.CreateBox("grandchild2").parent = child;
                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test", {
                    shouldExportNode: (node) => node.name.startsWith("grandchild"),
                });
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            expect(assertionData.nodes).toHaveLength(2);
            expect(assertionData.nodes[0].name).toContain("grandchild");
            expect(assertionData.nodes[1].name).toContain("grandchild");
            expect(assertionData.scenes).toHaveLength(1);
            expect(assertionData.scenes[0].nodes).toHaveLength(2);
            expect(assertionData.scenes[0].nodes).toContain(0);
            expect(assertionData.scenes[0].nodes).toContain(1);
        });

        it("converts a shared float MatricesIndicesKind vertex buffer", async () => {
            const assertionData = await page.evaluate(async () => {
                const mesh = BABYLON.MeshBuilder.CreatePlane("original", undefined, window.scene!);
                const numVertices = mesh.getTotalVertices();
                const joints = new Float32Array(new Array(numVertices * 4).fill(0));
                mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, joints);
                mesh.clone("clone");

                const glTFData = await BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test");
                const jsonString = glTFData.files["test.gltf"] as string;
                return JSON.parse(jsonString);
            });
            const jointAccessor = assertionData.meshes[0].primitives[0].attributes.JOINTS_0;
            const accessorData = assertionData.accessors[jointAccessor];

            expect(assertionData.meshes.every((mesh: any) => mesh.primitives[0].attributes.JOINTS_0 === jointAccessor)).toBe(true);
            expect(accessorData.type).toEqual("VEC4");
            expect(accessorData.componentType).toEqual(Constants.UNSIGNED_BYTE);
        });
    });
});
