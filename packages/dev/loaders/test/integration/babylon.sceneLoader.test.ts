import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";
import type { GLTFFileLoader } from "loaders/glTF";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

const debug = process.env.DEBUG === "true";
interface Window {
    BABYLON: typeof import("core/index");
    scene: typeof BABYLON.Scene | null;
}
/**
 * Describes the test suite.
 */
describe("Babylon Scene Loader", function () {
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
     * Integration tests for loading glTF assets.
     */
    describe("Loaders - glTF", () => {
        it("Load BoomBox", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/BoomBox/", "BoomBox.gltf", window.scene).then((scene) => {
                    return {
                        meshes: scene.meshes.length,
                        lights: scene.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("Load BoomBox GLB", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/", "BoomBox.glb", window.scene).then((scene) => {
                    return {
                        meshes: scene.meshes.length,
                        lights: scene.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("Load BoomBox with ImportMesh", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.ImportMeshAsync(null, "https://playground.babylonjs.com/scenes/BoomBox/", "BoomBox.gltf", window.scene).then((result) => {
                    return {
                        meshes: result.meshes.length,
                        sceneMeshes: window.scene!.meshes.length,
                        particleSystems: result.particleSystems.length,
                        skeletons: result.skeletons.length,
                        animationGroups: result.animationGroups.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(assertionData.sceneMeshes);
            expect(assertionData.particleSystems).toBe(0);
            expect(assertionData.skeletons).toBe(0);
            expect(assertionData.animationGroups).toBe(0);
        });

        it("Load TwoQuads with ImportMesh and one node name", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.ImportMeshAsync("node0", "https://models.babylonjs.com/Tests/TwoQuads/", "TwoQuads.gltf", window.scene).then(() => {
                    return {
                        node0: !!window.scene?.getMeshByName("node0"),
                        node1: !!window.scene?.getMeshByName("node1"),
                    };
                });
            });
            expect(assertionData.node0).toBeTruthy();
            expect(assertionData.node1).not.toBeTruthy();
        });

        it("Load TwoQuads with ImportMesh and two node names", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.ImportMeshAsync(["node0", "node1"], "https://models.babylonjs.com/Tests/TwoQuads/", "TwoQuads.gltf", window.scene).then(() => {
                    return {
                        node0: !!window.scene?.getMeshByName("node0"),
                        node1: !!window.scene?.getMeshByName("node1"),
                    };
                });
            });
            expect(assertionData.node0).toBeTruthy();
            expect(assertionData.node0).toBeTruthy();
        });

        it("Load BoomBox with callbacks", async () => {
            const assertionData = await page.evaluate(() => {
                let parsedCount = 0;
                let meshCount = 0;
                let materialCount = 0;
                let textureCount = 0;
                let ready = false;

                const promises = new Array<Promise<any>>();

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    const gltfLoader = loader as unknown as GLTFFileLoader;
                    gltfLoader.onParsed = () => {
                        parsedCount++;
                    };

                    gltfLoader.onMeshLoaded = () => {
                        meshCount++;
                    };
                    gltfLoader.onMaterialLoaded = () => {
                        materialCount++;
                    };
                    gltfLoader.onTextureLoaded = () => {
                        textureCount++;
                    };

                    promises.push(
                        gltfLoader.whenCompleteAsync().then(() => {
                            return !!ready;
                        })
                    );
                });

                promises.push(
                    BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                        ready = true;
                        const filteredTextures = window.scene?.textures.filter((texture) => texture !== window.scene?.environmentBRDFTexture);
                        return {
                            parsedCount,
                            meshCount,
                            sceneMeshCount: window.scene?.meshes.length,
                            materialCount,
                            sceneMaterialCount: window.scene?.materials.length,
                            textureCount,
                            filteredTextures: filteredTextures?.length,
                        };
                    })
                );

                return Promise.all(promises);
            });

            expect(assertionData[0]).toBeTruthy();
            expect(assertionData[1].parsedCount).toBe(1);
            expect(assertionData[1].meshCount).toBe(assertionData[1].sceneMeshCount);
            expect(assertionData[1].materialCount).toBe(assertionData[1].sceneMaterialCount);
            expect(assertionData[1].textureCount).toBe(assertionData[1].filteredTextures);
        });

        it("Load BoomBox with dispose", async () => {
            console.log("Load BoomBox with dispose");
            const assertionData = await page.evaluate(() => {
                let ready = false;
                let disposed = false;

                const promises = new Array<Promise<any>>();

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    const gltfLoader = loader as unknown as GLTFFileLoader;
                    gltfLoader.onDispose = () => {
                        disposed = true;
                    };

                    promises.push(
                        BABYLON.Tools.DelayAsync(1).then(() => {
                            gltfLoader.dispose();
                            return {
                                ready,
                                disposed,
                            };
                        })
                    );
                });

                // promises.push(
                BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                    ready = true;
                });
                // );

                return Promise.all(promises);
            });
            console.log(assertionData);

            expect(assertionData[0].ready).toBeFalsy();
            expect(assertionData[0].disposed).toBeTruthy();
        });
    });
});
