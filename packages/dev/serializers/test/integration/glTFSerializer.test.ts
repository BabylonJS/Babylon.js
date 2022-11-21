import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";
import type { IAnimationKey } from "core/Animations/animationKey";
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
                const materialExporter = new BABYLON.GLTF2.Exporter._GLTFMaterialExporter(new BABYLON.GLTF2.Exporter._Exporter(window.scene));

                const metalRough = materialExporter._convertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
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
                const solveZero = BABYLON.GLTF2.Exporter._GLTFMaterialExporter._SolveMetallic(1.0, 0.0, 1.0);
                const solveAproxOne = BABYLON.GLTF2.Exporter._GLTFMaterialExporter._SolveMetallic(0.0, 1.0, 1.0);
                return {
                    solveZero,
                    solveAproxOne,
                };
            });
            expect(assertionData.solveZero).toBe(0.0);
            expect(assertionData.solveAproxOne).toBeCloseTo(1.0, 1e-6);
        });
        it("should serialize empty Babylon window.scene to glTF with only asset property", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);

                    return {
                        len: Object.keys(jsonData).length,
                        version: jsonData.asset.version,
                        generator: jsonData.asset.generator,
                    };
                });
            });

            console.log(assertionData);

            expect(assertionData.len).toEqual(1);
            expect(assertionData.version).toEqual("2.0");
            expect(assertionData.generator).toContain("Babylon.js v");
        });
        it("should serialize sphere geometry in window.scene to glTF", async () => {
            const assertionData = await page.evaluate(() => {
                BABYLON.MeshBuilder.CreateSphere(
                    "sphere",
                    {
                        diameter: 1,
                    },
                    window.scene
                );

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);

                    return jsonData;
                });
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
            const assertionData = await page.evaluate(() => {
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

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);
                    return jsonData;
                });
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
            const assertionData = await page.evaluate(() => {
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

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);
                    return jsonData;
                });
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
            const assertionData = await page.evaluate(() => {
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

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);
                    return jsonData;
                });
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
            const assertionData = await page.evaluate(() => {
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

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);
                    return jsonData;
                });
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
            const assertionData = await page.evaluate(() => {
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

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);
                    return jsonData;
                });
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
                (intensity, red) => {
                    const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(4, 4, 0), window.scene!);
                    pointLight.intensity = intensity;
                    const diffuseColor = BABYLON.Color3.FromArray(red);
                    pointLight.diffuse = diffuseColor;

                    return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                        const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                        const jsonData = JSON.parse(jsonString);
                        return jsonData;
                    });
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
                (intensity, red, innerAngle, angle) => {
                    const spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 4, 0), new BABYLON.Vector3(0, angle, 0), angle, 2, window.scene!);
                    spotLight.intensity = intensity;
                    spotLight.innerAngle = innerAngle;
                    const diffuseColor = BABYLON.Color3.FromArray(red);
                    spotLight.diffuse = diffuseColor;

                    return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                        const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                        const jsonData = JSON.parse(jsonString);
                        return jsonData;
                    });
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
                (intensity, red) => {
                    const directionalLight = new BABYLON.DirectionalLight("directionalLight", BABYLON.Vector3.Forward(), window.scene!);
                    const diffuseColor = BABYLON.Color3.FromArray(red);
                    directionalLight.diffuse = diffuseColor;
                    directionalLight.intensity = intensity;

                    return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                        const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                        const jsonData = JSON.parse(jsonString);
                        return jsonData;
                    });
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
            const assertionData = await page.evaluate(() => {
                new BABYLON.PointLight("pointLight", new BABYLON.Vector3(4, 4, 0), window.scene!);
                new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 4, 0), new BABYLON.Vector3(0, Math.PI / 4, 0), Math.PI / 4, 2, window.scene!);
                new BABYLON.DirectionalLight("directionalLight", BABYLON.Vector3.Forward(), window.scene!);

                return BABYLON.GLTF2Export.GLTFAsync(window.scene!, "test").then((glTFData) => {
                    const jsonString = glTFData.glTFFiles["test.gltf"] as string;
                    const jsonData = JSON.parse(jsonString);
                    return jsonData;
                });
            });
            expect(Object.keys(assertionData)).toHaveLength(6);
            expect(assertionData.extensions["KHR_lights_punctual"].lights).toHaveLength(3);
            expect(assertionData.nodes).toHaveLength(3);
        });
    });
});
