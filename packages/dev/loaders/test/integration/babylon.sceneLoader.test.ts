import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";
import type { GLTFFileLoader } from "loaders/glTF";
import { glbBase64, gltfBase64, gltfRaw, objBase64, objRaw, stlAsciiBase64, stlAsciiRaw, stlBinaryBase64 } from "./testData";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

const debug = process.env.DEBUG === "true";
interface Window {
    BABYLON: typeof import("core/index");
    scene: typeof BABYLON.Scene | null;
}

type GLTFOptions = NonNullable<ConstructorParameters<typeof GLTFFileLoader>[0]>;

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
        it("Load BoomBox GLTF", async () => {
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

        it("Load BoomBox GLTF via rootUrl", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/BoomBox/BoomBox.gltf", undefined, window.scene).then((scene) => {
                    return {
                        meshes: scene.meshes.length,
                        lights: scene.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("Load BoomBox GLTF via sceneFilename", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.AppendAsync("", "https://playground.babylonjs.com/scenes/BoomBox/BoomBox.gltf", window.scene).then((scene) => {
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
            const assertionData = await page.evaluate(() => {
                let ready = false;
                let disposed = false;

                const promises = new Array<Promise<any>>();

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    const gltfLoader = loader as GLTFFileLoader;
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

            expect(assertionData[0].ready).toBeFalsy();
            expect(assertionData[0].disposed).toBeTruthy();
        });

        it("Load BoomBox with mesh.isEnabled check", async () => {
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<any>>();
                window.engine!.runRenderLoop(() => {
                    const nonReadyMeshes = window.scene!.meshes.filter((mesh) => mesh.getTotalVertices() !== 0);
                    if (nonReadyMeshes.length > 0 && promises.length === 0) {
                        promises.push(Promise.resolve(nonReadyMeshes.map((mesh) => mesh.isEnabled())));
                    }
                });

                const promise = BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                    window.engine!.stopRenderLoop();
                    promises.push(Promise.resolve(window.scene!.meshes.filter((mesh) => mesh.getTotalVertices() !== 0).map((mesh) => mesh.isEnabled())));
                });
                return promise.then(() => Promise.all(promises));
            });
            expect(assertionData[0].every((b: boolean) => !b)).toBe(true);
            expect(assertionData[1].every((b: boolean) => b)).toBe(true);
        });

        it("Load CompileMaterials", async () => {
            const assertionData = await page.evaluate(async () => {
                const promises = new Array<Promise<any>>();
                let called = 0;

                const oldFunction = window.engine!.createShaderProgram;

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    (loader as GLTFFileLoader).compileMaterials = true;
                    promises.push(
                        (loader as GLTFFileLoader).whenCompleteAsync().then(() => {
                            // when not called, this will return true.
                            return !called;
                        })
                    );
                });

                const promise = BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Tests/CompileMaterials/", "Test.gltf", window.scene).then(() => {
                    window.engine!.createShaderProgram = function () {
                        called++;
                        return oldFunction.apply(this, arguments);
                    };
                    return window.scene!.whenReadyAsync();
                });

                // this will wait for the scene to be ready
                await promise;
                const enabledMeshes = window.scene!.meshes.filter((mesh) => mesh.material && mesh.isEnabled());
                enabledMeshes.forEach((mesh) => {
                    promises.push(Promise.resolve(mesh.isReady(true)));
                });
                const data = await Promise.all(promises);
                window.engine!.stopRenderLoop();
                window.engine!.createShaderProgram = oldFunction;
                return data;
            });
            expect(assertionData.length).toBeGreaterThan(0);
            assertionData.forEach((data) => {
                expect(data).toBe(true);
            });
        });

        it("Load BrainStem with compileMaterials", async () => {
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<boolean>>();
                let called = 0;

                const oldFunction = window.engine!.createShaderProgram;

                window.engine!.runRenderLoop(() => {
                    const enabledMeshes = window.scene!.meshes.filter((mesh) => mesh.material && mesh.isEnabled());
                    if (enabledMeshes.length > 0) {
                        promises.push(Promise.resolve(enabledMeshes.every((mesh) => mesh.isReady(true))));
                    }
                });

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    (loader as GLTFFileLoader).compileMaterials = true;
                    promises.push(
                        (loader as GLTFFileLoader).whenCompleteAsync().then(() => {
                            // when not called, this will return true.
                            return !called;
                        })
                    );
                });

                const promise = BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/BrainStem/", "BrainStem.gltf", window.scene).then(() => {
                    window.engine!.createShaderProgram = function () {
                        called++;
                        return oldFunction.apply(this, arguments);
                    };
                    return window.scene!.whenReadyAsync();
                });

                return promise
                    .then(() => Promise.all(promises))
                    .then((data) => {
                        window.engine!.stopRenderLoop();
                        window.engine!.createShaderProgram = oldFunction;
                        return data;
                    });
            });
            expect(assertionData.length).toBeGreaterThan(1);
            assertionData.forEach((data) => {
                expect(data).toBe(true);
            });
        });

        it("Load Alien", async () => {
            const skeletonsMapping = {
                AlienHead: "skeleton0",
                Collar: "skeleton1",
                LeftEye: "skeleton2",
                RightEye: "skeleton3",
                CollarClasp: "skeleton1",
                Shirt: "skeleton1",
                ShirtPlate: "skeleton1",
                Teeth: "skeleton1",
            };
            const assertionData = await page.evaluate((skeletonMapping) => {
                return BABYLON.SceneLoader.ImportMeshAsync(null, "https://assets.babylonjs.com/meshes/Alien/", "Alien.gltf", window.scene).then((result) => {
                    const mapping = Object.keys(skeletonMapping).reduce((acc: any, cur: string) => {
                        acc[cur] = window.scene!.getMeshByName(cur)!.skeleton!.name;
                        return acc;
                    }, {});
                    return {
                        "scene.skeletons": window.scene!.skeletons.length,
                        skeletons: result.skeletons.length,
                        skeletonMapping: mapping,
                        "alienHeadMesh.morphTargetManager.numTargets": (window.scene!.getMeshByName("AlienHead") as any).morphTargetManager!.numTargets,
                        "scene.animationGroups": window.scene!.animationGroups.length,
                        animationGroups: result.animationGroups.length,
                        "animationGroup.name": result.animationGroups[0].name,
                        "animationGroup.targetedAnimations": result.animationGroups[0].targetedAnimations.length,
                        influenceAnimations: result.animationGroups[0].targetedAnimations.filter((_) => _.animation.targetProperty === "influence").length,
                        rotationAnimations: result.animationGroups[0].targetedAnimations.filter((_) => _.animation.targetProperty === "rotationQuaternion").length,
                        positionAnimations: result.animationGroups[0].targetedAnimations.filter((_) => _.animation.targetProperty === "position").length,
                    };
                });
            }, skeletonsMapping);
            expect(assertionData["scene.skeletons"], "scene.skeletons").toBe(4);
            expect(assertionData.skeletons, "skeletons").toBe(4);

            for (const meshName in skeletonsMapping) {
                const skeletonName = skeletonsMapping[meshName as keyof typeof skeletonsMapping];
                expect(assertionData.skeletonMapping[meshName], `skeleton name of mesh '${meshName}'`).toBe(skeletonName);
            }

            expect(assertionData["alienHeadMesh.morphTargetManager.numTargets"], "alienHeadMesh.morphTargetManager.numTargets").toBe(2);

            expect(assertionData["scene.animationGroups"], "scene.animationGroups").toBe(1);
            expect(assertionData.animationGroups, "animationGroups").toBe(1);
            expect(assertionData["animationGroup.name"], "animationGroup.name").toBe("TwoTargetBlend");
            expect(assertionData["animationGroup.targetedAnimations"], "animationGroup.targetedAnimations").toBe(7);
            expect(assertionData.influenceAnimations, "influenceAnimations").toBe(2);
            expect(assertionData.rotationAnimations, "rotationAnimations").toBe(4);
            expect(assertionData.positionAnimations, "positionAnimations").toBe(1);
        });

        it("Load LevelOfDetail", async () => {
            const assertionData = await page.evaluate(async () => {
                const promises = new Array<Promise<{ [key: string]: boolean }>>();

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    (loader as GLTFFileLoader).compileMaterials = true;

                    promises.push(
                        (loader as GLTFFileLoader).whenCompleteAsync().then(() => {
                            const meshes = [window.scene!.getMeshByName("node0"), window.scene!.getMeshByName("node1")];
                            return {
                                "scene.materials": window.scene!.materials.length === 1,
                                "meshes[0].material.name": meshes[0]!.material!.name === "High",
                                "meshes[1].material.name": meshes[1]!.material!.name === "High",
                            };
                        })
                    );
                });

                const promise = BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Tests/LevelOfDetail/", `LevelOfDetail.gltf`, window.scene).then(() => {
                    const meshes = [window.scene!.getMeshByName("node0"), window.scene!.getMeshByName("node1")];
                    const materialLow = window.scene!.getMaterialByName("Low");
                    const materialMedium = window.scene!.getMaterialByName("Medium");
                    const materialHigh = window.scene!.getMaterialByName("High");

                    promises.push(
                        Promise.resolve({
                            "meshes[0].material.name": meshes[0]!.material!.name === "Low",
                            "meshes[1].material.name": meshes[1]!.material!.name === "Low",
                            "scene.materials": window.scene!.materials.length === 3,
                            "materialLow.isReady(meshes[0])": materialLow!.isReady(meshes[0]!),
                            "materialLow.isReady(meshes[1])": materialLow!.isReady(meshes[1]!),
                            "materialMedium.isReady(meshes[0])": materialMedium!.isReady(meshes[0]!),
                            "materialMedium.isReady(meshes[1])": materialMedium!.isReady(meshes[1]!),
                            "materialHigh.isReady(meshes[0])": materialHigh!.isReady(meshes[0]!),
                            "materialHigh.isReady(meshes[1])": materialHigh!.isReady(meshes[1]!),
                        })
                    );
                });
                return promise
                    .then(() => window.scene!.whenReadyAsync())
                    .then(() => {
                        const enabledMeshes = window.scene!.meshes.filter((mesh) => mesh.material && mesh.isEnabled());
                        enabledMeshes.forEach((mesh) => {
                            promises.push(Promise.resolve({ [mesh.name]: mesh.isReady(true) }));
                        });
                    })
                    .then(() => Promise.all(promises));
            });

            assertionData.forEach((promise) => {
                Object.keys(promise).forEach((key) => {
                    expect(promise[key as keyof typeof promise], key).toBe(true);
                });
            });
        });

        it("Load LevelOfDetail with onMaterialLODsLoadedObservable", async () => {
            const materialNames = ["Low", "Medium", "High"];
            const assertionData = await page.evaluate((materialNames) => {
                const promises = new Array<Promise<void>>();

                const data: { [key: string]: string[] } = {};

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    const observer = (loader as GLTFFileLoader).onExtensionLoadedObservable.add((extension) => {
                        if (extension instanceof (BABYLON.GLTF2 as any).Loader.Extensions.MSFT_lod) {
                            (loader as GLTFFileLoader).onExtensionLoadedObservable.remove(observer);
                            (extension as any).onMaterialLODsLoadedObservable.add((indexLOD: number) => {
                                data[materialNames[indexLOD]] = [window.scene!.getMeshByName("node0")!.material!.name, window.scene!.getMeshByName("node1")!.material!.name];
                            });
                        }
                    });

                    promises.push((loader as GLTFFileLoader).whenCompleteAsync());
                });

                return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Tests/LevelOfDetail/", "LevelOfDetail.gltf", window.scene).then(() => {
                    return window.scene!.whenReadyAsync().then(() => {
                        return Promise.all(promises).then(() => {
                            return data;
                        });
                    });
                });
            }, materialNames);

            expect(Object.keys(assertionData)).toHaveLength(3);
            materialNames.forEach((name) => {
                expect(assertionData[name]).toEqual([name, name]);
            });
        });

        // This test was deliberately left commented out as it is not working as expected.
        // The architecture of the onReady function of the MSFT_lod extension prevents this test from working.

        // it("Load LevelOfDetail with dispose when onMaterialLODsLoadedObservable", async () => {
        //     const assertionData = await page.evaluate(() => {
        //         const promises = new Array<Promise<void>>();
        //         const data: { [key: string]: any } = {};

        //         BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
        //             const observer = (loader as GLTFFileLoader).onExtensionLoadedObservable.add((extension) => {
        //                 if (extension instanceof (BABYLON.GLTF2 as any).Loader.Extensions.MSFT_lod) {
        //                     (loader as GLTFFileLoader).onExtensionLoadedObservable.remove(observer);
        //                     (extension as any).onMaterialLODsLoadedObservable.add((indexLOD: number) => {
        //                         data["indexLOD"] = indexLOD;
        //                         (loader as GLTFFileLoader).dispose();
        //                     });
        //                 }
        //             });

        //             promises.push(
        //                 new Promise((resolve) => {
        //                     (loader as GLTFFileLoader).onDisposeObservable.addOnce(() => {
        //                         resolve();
        //                     });
        //                 })
        //             );
        //         });

        //         return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Tests/LevelOfDetail/", "LevelOfDetail.gltf", window.scene)
        //             .then(() => {
        //                 return Promise.all(promises);
        //             })
        //             .then(() => data);
        //     });

        //     expect(assertionData["indexLOD"]).toBe(0);
        // });

        it("Load LevelOfDetail with useRangeRequests", async () => {
            const expectedSetRequestHeaderCalls = ["Range: bytes=0-19", "Range: bytes=20-1399", "Range: bytes=1400-1817", "Range: bytes=1820-3149", "Range: bytes=3152-8841"];
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<void>>();
                const data: { [key: string]: any } = {};

                const setRequestHeaderCalls: string[] = [];
                const origSetRequestHeader = BABYLON.WebRequest.prototype.setRequestHeader;
                BABYLON.WebRequest.prototype.setRequestHeader = function (...args) {
                    setRequestHeaderCalls.push(args.join(": "));
                    origSetRequestHeader.apply(this, args);
                };

                // Simulate default CORS policy on some web servers that reject getResponseHeader calls with `Content-Range`.
                const origGetResponseHeader = BABYLON.WebRequest.prototype.getResponseHeader;
                BABYLON.WebRequest.prototype.getResponseHeader = function (...args) {
                    return args[0] === "Content-Range" ? null : origGetResponseHeader.apply(this, args);
                };

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    (loader as GLTFFileLoader).useRangeRequests = true;
                    (loader as GLTFFileLoader).onExtensionLoadedObservable.add((extension) => {
                        if (extension instanceof (BABYLON.GLTF2 as any).Loader.Extensions.MSFT_lod) {
                            (extension as any).onMaterialLODsLoadedObservable.add((indexLOD: number) => {
                                data["indexLOD"] = indexLOD;
                                data[`setRequestHeaderCalls.${indexLOD}`] = setRequestHeaderCalls.slice();
                            });
                        }
                    });
                    promises.push(
                        (loader as GLTFFileLoader).whenCompleteAsync().then(() => {
                            data["setRequestHeaderCalls2"] = setRequestHeaderCalls.slice();
                        })
                    );
                });

                return BABYLON.SceneLoader.AppendAsync("https://playground.babylonjs.com/scenes/", "LevelOfDetail.glb", window.scene).then(() => {
                    data["setRequestHeaderCalls3"] = setRequestHeaderCalls.slice();
                    return Promise.all(promises).then(() => {
                        return data;
                    });
                });
            });
            const maxIdx = assertionData["indexLOD"];
            for (let i = 0; i <= maxIdx; i++) {
                expect(assertionData[`setRequestHeaderCalls.${i}`]).toEqual(expectedSetRequestHeaderCalls.slice(0, 3 + i));
            }
            expect(assertionData["setRequestHeaderCalls2"]).toEqual(expectedSetRequestHeaderCalls);
            // TODO - this fails! it has 1 more element than expected
            // expect(assertionData["setRequestHeaderCalls3"]).toEqual(expectedSetRequestHeaderCalls.slice(0, 3));
        });

        it("Load MultiPrimitive", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.ImportMeshAsync(null, "https://assets.babylonjs.com/meshes/Tests/MultiPrimitive/", "MultiPrimitive.gltf", window.scene).then(
                    (result) => {
                        const node = window.scene!.getNodeByName("node");
                        return {
                            meshes: result.meshes.length,
                            node: node instanceof BABYLON.TransformNode,
                            nodeChildren: node?.getChildren().map((c) => {
                                return {
                                    child: c instanceof BABYLON.Mesh,
                                    geometry: !!(c as any).geometry,
                                    material: !!(c as any).material,
                                };
                            }),
                        };
                    }
                );
            });

            expect(assertionData["meshes"]).toBe(3);
            expect(assertionData["node"]).toBe(true);

            expect(assertionData["nodeChildren"]).toEqual([
                { child: true, geometry: true, material: true },
                { child: true, geometry: true, material: true },
            ]);
        });

        it("Load BrainStem", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.ImportMeshAsync(null, "https://assets.babylonjs.com/meshes/BrainStem/", "BrainStem.gltf", window.scene).then((result) => {
                    const node1 = window.scene!.getTransformNodesById("node1")[1];
                    return {
                        skeletons: result.skeletons.length,
                        node1: node1 instanceof BABYLON.TransformNode,
                        node1Children: node1!.getChildren().map((c) => {
                            return {
                                child: c instanceof BABYLON.Mesh,
                                skeleton: !!(c as any).skeleton,
                                skeletonName: (c as any).skeleton.name === result.skeletons[0].name,
                            };
                        }),
                    };
                });
            });

            expect(assertionData["skeletons"]).toBe(1);
            expect(assertionData["node1"]).toBe(true);
            expect(assertionData["node1Children"]).toHaveLength(59);

            assertionData["node1Children"].forEach((child) => {
                expect(child).toEqual({ child: true, skeleton: true, skeletonName: true });
            });
        });

        it("Load BoomBox with transparencyAsCoverage", async () => {
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<any>>();
                const data: { [key: string]: any } = {};

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    let specularOverAlpha = false;
                    let radianceOverAlpha = false;

                    (loader as GLTFFileLoader).transparencyAsCoverage = true;
                    (loader as GLTFFileLoader).onMaterialLoaded = (material) => {
                        specularOverAlpha = specularOverAlpha || (material as any).useSpecularOverAlpha;
                        radianceOverAlpha = radianceOverAlpha || (material as any).useRadianceOverAlpha;
                    };
                    promises.push(
                        (loader as GLTFFileLoader).whenCompleteAsync().then(() => {
                            data["specularOverAlpha"] = specularOverAlpha;
                            data["radianceOverAlpha"] = radianceOverAlpha;
                        })
                    );
                });

                return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                    return Promise.all(promises).then(() => {
                        return data;
                    });
                });
            });

            expect(assertionData["specularOverAlpha"]).toBe(false);
            expect(assertionData["radianceOverAlpha"]).toBe(false);
        });

        it("Load BoomBox without transparencyAsCoverage", async () => {
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<any>>();
                const data: { [key: string]: any } = {};

                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    let specularOverAlpha = false;
                    let radianceOverAlpha = false;

                    (loader as GLTFFileLoader).transparencyAsCoverage = false;
                    (loader as GLTFFileLoader).onMaterialLoaded = (material) => {
                        specularOverAlpha = specularOverAlpha || (material as any).useSpecularOverAlpha;
                        radianceOverAlpha = radianceOverAlpha || (material as any).useRadianceOverAlpha;
                    };
                    promises.push(
                        (loader as GLTFFileLoader).whenCompleteAsync().then(() => {
                            data["specularOverAlpha"] = specularOverAlpha;
                            data["radianceOverAlpha"] = radianceOverAlpha;
                        })
                    );
                });

                return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                    return Promise.all(promises).then(() => {
                        return data;
                    });
                });
            });

            expect(assertionData["specularOverAlpha"]).toBe(true);
            expect(assertionData["radianceOverAlpha"]).toBe(true);
        });

        it("Load BoomBox twice and check texture instancing", async () => {
            const assertionData = await page.evaluate(() => {
                let called = false;
                return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                    const oldCreateTexture = window.engine!.createTexture;
                    window.engine!.createTexture = () => {
                        called = true;
                        return oldCreateTexture.apply(window.engine, arguments);
                    };
                    return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/BoomBox/", "BoomBox.gltf", window.scene).then(() => {
                        window.engine!.createTexture = oldCreateTexture;
                        return called;
                    });
                });
            });

            expect(assertionData).toBe(false);
        });

        it("Load UFO with MSFT_audio_emitter", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.ImportMeshAsync(null, "https://assets.babylonjs.com/meshes/", "ufo.glb", window.scene).then((result) => {
                    return {
                        sceneMeshes: window.scene!.meshes.length,
                        meshes: result.meshes.length,
                        particleSystems: result.particleSystems.length,
                        animationGroups: result.animationGroups.length,
                        soundTracks: window.scene!.soundTracks!.length,
                        mainSoundTrack: window.scene!.mainSoundTrack.soundCollection.length,
                        onEndedObservable: window.scene!.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers(),
                    };
                });
            });
            expect(assertionData["meshes"]).toBe(assertionData["sceneMeshes"]);
            expect(assertionData["particleSystems"]).toBe(0);
            expect(assertionData["animationGroups"]).toBe(3);
            expect(assertionData["soundTracks"]).toBe(0);
            expect(assertionData["mainSoundTrack"]).toBe(3);
            expect(assertionData["onEndedObservable"]).toBe(true);
        });

        it("Load Box with extras", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Box/", "Box_extras.gltf", window.scene).then((scene) => {
                    const mesh = scene.getMeshByName("Box001")!;
                    const camera = scene.getCameraByName("Camera")!;
                    const material = scene.getMaterialByName("01___Default")!;
                    return {
                        meshes: scene.meshes.length,
                        materials: scene.materials.length,
                        meshMetadata: !!mesh.metadata,
                        meshGltfMetadata: !!mesh.metadata.gltf,
                        meshExtras: !!mesh.metadata.gltf.extras,
                        meshExtrasKind: mesh.metadata.gltf.extras.kind,
                        meshExtrasMagic: mesh.metadata.gltf.extras.magic,
                        cameraMetadata: !!camera,
                        cameraGltfMetadata: !!camera.metadata,
                        cameraExtras: !!camera.metadata.gltf.extras,
                        cameraExtrasCustom: camera.metadata.gltf.extras.custom,
                        materialMetadata: !!material.metadata,
                        materialGltfMetadata: !!material.metadata.gltf,
                        materialExtras: !!material.metadata.gltf.extras,
                        materialExtrasKind: material.metadata.gltf.extras.custom,
                    };
                });
            });

            expect(assertionData["meshes"]).toBe(2);
            expect(assertionData["materials"]).toBe(1);
            expect(assertionData["meshMetadata"]).toBe(true);
            expect(assertionData["meshGltfMetadata"]).toBe(true);
            expect(assertionData["meshExtras"]).toBe(true);
            expect(assertionData["meshExtrasKind"]).toBe("nice cube");
            expect(assertionData["meshExtrasMagic"]).toBe(42);
            expect(assertionData["cameraMetadata"]).toBe(true);
            expect(assertionData["cameraGltfMetadata"]).toBe(true);
            expect(assertionData["cameraExtras"]).toBe(true);
            expect(assertionData["cameraExtrasCustom"]).toBe("cameraProp");
            expect(assertionData["materialMetadata"]).toBe(true);
            expect(assertionData["materialGltfMetadata"]).toBe(true);
            expect(assertionData["materialExtras"]).toBe(true);
            expect(assertionData["materialExtrasKind"]).toBe("materialProp");
        });
    });
    describe("#OBJ", () => {
        it("should load a tetrahedron (without colors)", async () => {
            const fileContents = `
                g tetrahedron

                v 1.00 1.00 1.00 0.666 0 0
                v 2.00 1.00 1.00 0.666 0 0
                v 1.00 2.00 1.00 0.666 0 0
                v 1.00 1.00 2.00 0.666 0 0

                f 1 3 2
                f 1 4 3
                f 1 2 4
                f 2 3 4
            `;

            const assertionData = await page.evaluate((fileContents) => {
                return BABYLON.SceneLoader.LoadAssetContainerAsync("", "data:" + fileContents, window.scene, () => {}, ".obj").then((container) => {
                    const tetrahedron = container.meshes[0];

                    const positions = tetrahedron.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    const colors = tetrahedron.getVerticesData(BABYLON.VertexBuffer.ColorKind);
                    return {
                        positions,
                        colors,
                        meshesLength: container.meshes.length,
                    };
                });
            }, fileContents);

            expect(assertionData["positions"]).toEqual([-1, 1, 1, -1, 2, 1, -2, 1, 1, -1, 1, 2]);
            expect(assertionData["colors"]).toBeNull();
            expect(assertionData["meshesLength"]).toBe(1);
        });

        it("should parse leniently allowing extra spaces with vertex definitions", async () => {
            const fileContents = `
                g tetrahedron

                v  1.00 1.00 1.00 0.666 0 0
                v  2.00 1.00 1.00 0.666 0 0
                v  1.00 2.00 1.00 0.666 0 0
                v  1.00 1.00 2.00 0.666 0 0
                # ^
                # └── allow extra spaces before position/color

                f 1 3 2
                f 1 4 3
                f 1 2 4
                f 2 3 4
            `;

            const assertionData = await page.evaluate((fileContents) => {
                return BABYLON.SceneLoader.LoadAssetContainerAsync("", "data:" + fileContents, window.scene, () => {}, ".obj").then((container) => {
                    const tetrahedron = container.meshes[0];

                    const positions = tetrahedron.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    return {
                        positions,
                        meshesLength: container.meshes.length,
                    };
                });
            }, fileContents);

            expect(assertionData["positions"]).toEqual([-1, 1, 1, -1, 2, 1, -2, 1, 1, -1, 1, 2]);
            expect(assertionData["meshesLength"]).toBe(1);
        });
    });

    describe("#AssetContainer", () => {
        it("should be loaded from BoomBox GLTF", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.LoadAssetContainerAsync("https://assets.babylonjs.com/meshes/BoomBox/", "BoomBox.gltf", window.scene).then((container) => {
                    return {
                        meshesLength: container.meshes.length,
                    };
                });
            });
            expect(assertionData["meshesLength"]).toBe(2);
        });
        it("should be adding and removing objects from scene", async () => {
            const assertionData = await page.evaluate(() => {
                const scene = window.scene!;
                const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
                new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
                BABYLON.MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);
                BABYLON.MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);

                // Move all the assets from the scene into a container
                const container = new BABYLON.AssetContainer(scene);
                const keepAssets = new BABYLON.KeepAssets();
                keepAssets.cameras.push(camera);
                container.moveAllFromScene(keepAssets);
                const beforeAddAllToScene = {
                    cameras: scene.cameras.length,
                    meshes: scene.meshes.length,
                    lights: scene.lights.length,
                    containerCameras: container.cameras.length,
                    containerMeshes: container.meshes.length,
                    containerLights: container.lights.length,
                };
                container.addAllToScene();
                const afterAddAllToScene = {
                    cameras: scene.cameras.length,
                    meshes: scene.meshes.length,
                    lights: scene.lights.length,
                };
                container.removeAllFromScene();
                const afterRemoveAllFromScene = {
                    cameras: scene.cameras.length,
                    meshes: scene.meshes.length,
                    lights: scene.lights.length,
                };

                return {
                    beforeAddAllToScene,
                    afterAddAllToScene,
                    afterRemoveAllFromScene,
                };
            });

            expect(assertionData["beforeAddAllToScene"]).toEqual({
                cameras: 1,
                meshes: 0,
                lights: 0,
                containerCameras: 0,
                containerMeshes: 2,
                containerLights: 1,
            });

            expect(assertionData["afterAddAllToScene"]).toEqual({
                cameras: 1,
                meshes: 2,
                lights: 1,
            });

            expect(assertionData["afterRemoveAllFromScene"]).toEqual({
                cameras: 1,
                meshes: 0,
                lights: 0,
            });
        });
    });

    describe("#ArgumentPermutations", () => {
        it("Typical", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.LoadAsync("https://playground.babylonjs.com/scenes/Box/", "Box.gltf").then(() => true);
            });
            expect(assertionData).toBe(true);
        });

        it("Single url", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.SceneLoader.LoadAsync("https://playground.babylonjs.com/scenes/Box/Box.gltf").then(() => true);
            });
            expect(assertionData).toBe(true);
        });

        it("Direct load", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.Tools.LoadFileAsync("https://playground.babylonjs.com/scenes/Box/Box.gltf", false)
                    .then((gltf) => {
                        return BABYLON.SceneLoader.LoadAsync("https://playground.babylonjs.com/scenes/Box/", `data:${gltf}`);
                    })
                    .then(() => true);
            });
            expect(assertionData).toBe(true);
        });

        it("Files input", async () => {
            const assertionData = await page.evaluate(() => {
                return Promise.all([
                    BABYLON.Tools.LoadFileAsync("https://playground.babylonjs.com/scenes/Box/Box.gltf", true),
                    BABYLON.Tools.LoadFileAsync("https://playground.babylonjs.com/scenes/Box/Box.bin", true),
                ])
                    .then(([gltf, bin]) => {
                        BABYLON.FilesInput.FilesToLoad["box.gltf"] = new File([gltf], "Box.gltf");
                        BABYLON.FilesInput.FilesToLoad["box.bin"] = new File([bin], "Box.bin");
                        return BABYLON.SceneLoader.LoadAsync("file:", "Box.gltf");
                    })
                    .then(() => true);
            });
            expect(assertionData).toBe(true);
        });

        it("File object", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.Tools.LoadFileAsync("https://playground.babylonjs.com/scenes/BoomBox.glb")
                    .then((glb) => {
                        return BABYLON.SceneLoader.LoadAsync("", new File([glb], "BoomBox.glb"));
                    })
                    .then(() => true);
            });
            expect(assertionData).toBe(true);
        });

        it("File url (Babylon Native)", async () => {
            const assertionData = await page.evaluate(() => {
                const urlRedirects = {
                    "file:///Box.gltf": "https://playground.babylonjs.com/scenes/Box/Box.gltf",
                    "file:///Box.bin": "https://playground.babylonjs.com/scenes/Box/Box.bin",
                };
                const oldPreprocessUrl = BABYLON.Tools.PreprocessUrl;
                BABYLON.Tools.PreprocessUrl = (url) => urlRedirects[url as keyof typeof urlRedirects] || url;
                const resetPreprocessUrl = () => (BABYLON.Tools.PreprocessUrl = oldPreprocessUrl);
                return BABYLON.SceneLoader.LoadAsync("file:///", "Box.gltf")
                    .then(resetPreprocessUrl, resetPreprocessUrl)
                    .then(() => true);
            });
            expect(assertionData).toBe(true);
        });
    });

    describe("#DirectLoad", () => {
        it("should load a raw obj with no mime type", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:${data}`, window.scene, undefined, ".obj").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, objRaw);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 4,
            });
        });

        it("should load a base64 encoded obj with no mime type", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:;base64,${data}`, window.scene, undefined, ".obj").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, objBase64);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 4,
            });
        });

        it("should load a base64 encoded obj with a valid mime type", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:model/obj;base64,${data}`, window.scene, undefined, ".obj").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, objBase64);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 4,
            });
        });

        it("should load a base64 encoded obj with an invalid mime type", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:foo/bar;base64,${data}`, window.scene, undefined, ".obj").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, objBase64);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 4,
            });
        });

        it("should direct load a glTF file without specifying a pluginExtension", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:${data}`, window.scene).then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[1].getTotalVertices(),
                    };
                });
            }, gltfRaw);
            expect(assertionData).toEqual({
                meshes: 2,
                vertices: 3,
            });
        });

        it("should direct load a base64 encoded glTF file", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:;base64,${data}`, window.scene, undefined, ".gltf").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[1].getTotalVertices(),
                    };
                });
            }, gltfBase64);
            expect(assertionData).toEqual({
                meshes: 2,
                vertices: 3,
            });
        });

        it("should direct load a base64 encoded glb with a valid mime type and no pluginExtension", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:model/gltf-binary;base64,${data}`, window.scene, undefined).then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[1].getTotalVertices(),
                    };
                });
            }, glbBase64);
            expect(assertionData).toEqual({
                meshes: 2,
                vertices: 24,
            });
        });

        it("should direct load a base64 encoded glb with an invalid mime type and pluginExtension specified", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:image/jpg;base64,${data}`, window.scene, undefined, ".glb").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[1].getTotalVertices(),
                    };
                });
            }, glbBase64);
            expect(assertionData).toEqual({
                meshes: 2,
                vertices: 24,
            });
        });

        it("should direct load an incorrectly formatted base64 encoded glb (backcompat)", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:base64,${data}`, window.scene).then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[1].getTotalVertices(),
                    };
                });
            }, glbBase64);
            expect(assertionData).toEqual({
                meshes: 2,
                vertices: 24,
            });
        });

        it("should direct load an ascii stl file", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:${data}`, window.scene, undefined, ".stl").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, stlAsciiRaw);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 3,
            });
        });

        it("should direct load a base64 encoded ascii stl file", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:;base64,${data}`, window.scene, undefined, ".stl").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, stlAsciiBase64);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 3,
            });
        });

        it("should direct load a base64 encoded binary stl file", async () => {
            const assertionData = await page.evaluate((data) => {
                return BABYLON.SceneLoader.ImportMeshAsync("", "", `data:;base64,${data}`, window.scene, undefined, ".stl").then((result) => {
                    return {
                        meshes: result.meshes.length,
                        vertices: result.meshes[0].getTotalVertices(),
                    };
                });
            }, stlBinaryBase64);
            expect(assertionData).toEqual({
                meshes: 1,
                vertices: 3,
            });
        });
    });

    describe("Options", () => {
        it("appendSceneAsync without options", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.appendSceneAsync("https://playground.babylonjs.com/scenes/BoomBox.glb", window.scene!).then(() => {
                    return {
                        meshes: window.scene!.meshes.length,
                        lights: window.scene!.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("loadSceneAsync without options", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.loadSceneAsync("https://playground.babylonjs.com/scenes/BoomBox.glb", window.engine!).then((scene) => {
                    return {
                        meshes: scene.meshes.length,
                        lights: scene.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("loadAssetContainerAsync without options", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.loadAssetContainerAsync("https://playground.babylonjs.com/scenes/BoomBox.glb", window.scene!).then((assetContainer) => {
                    return {
                        meshes: assetContainer.meshes.length,
                        lights: assetContainer.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("loadAssetContainerAsync with rootUrl", async () => {
            const assertionData = await page.evaluate(() => {
                return BABYLON.loadAssetContainerAsync("BoomBox.glb", window.scene!, {
                    rootUrl: "https://playground.babylonjs.com/scenes/",
                }).then((assetContainer) => {
                    return {
                        meshes: assetContainer.meshes.length,
                        lights: assetContainer.materials.length,
                    };
                });
            });
            expect(assertionData.meshes).toBe(2);
            expect(assertionData.lights).toBe(1);
        });

        it("loadAssetContainerAsync with glTF options", async () => {
            const assertionData = await page.evaluate(async () => {
                const gltfFileLoader = new BABYLON.GLTFFileLoader();

                const gltfOptions = {
                    alwaysComputeBoundingBox: !gltfFileLoader.alwaysComputeBoundingBox,
                    alwaysComputeSkeletonRootNode: !gltfFileLoader.alwaysComputeSkeletonRootNode,
                    animationStartMode:
                        gltfFileLoader.animationStartMode === BABYLON.GLTFLoaderAnimationStartMode.NONE
                            ? BABYLON.GLTFLoaderAnimationStartMode.FIRST
                            : BABYLON.GLTFLoaderAnimationStartMode.NONE,
                    compileMaterials: !gltfFileLoader.compileMaterials,
                    compileShadowGenerators: !gltfFileLoader.compileShadowGenerators,
                    coordinateSystemMode:
                        gltfFileLoader.coordinateSystemMode === BABYLON.GLTFLoaderCoordinateSystemMode.AUTO
                            ? BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED
                            : BABYLON.GLTFLoaderCoordinateSystemMode.AUTO,
                    createInstances: !gltfFileLoader.createInstances,
                    loadAllMaterials: !gltfFileLoader.loadAllMaterials,
                    loadMorphTargets: !gltfFileLoader.loadMorphTargets,
                    loadNodeAnimations: !gltfFileLoader.loadNodeAnimations,
                    loadOnlyMaterials: !gltfFileLoader.loadOnlyMaterials,
                    loadSkins: !gltfFileLoader.loadSkins,
                    skipMaterials: !gltfFileLoader.skipMaterials,
                    targetFps: 42,
                    transparencyAsCoverage: !gltfFileLoader.transparencyAsCoverage,
                    useClipPlane: !gltfFileLoader.useClipPlane,
                    useRangeRequests: !gltfFileLoader.useRangeRequests,
                    useSRGBBuffers: !gltfFileLoader.useSRGBBuffers,
                    customRootNode: null,
                    extensionOptions: {
                        MSFT_lod: {
                            maxLODsToLoad: 1,
                        },
                        KHR_audio: {
                            enabled: false,
                        },
                    },
                } satisfies GLTFOptions;

                const loaderPromise = new Promise<GLTFFileLoader>((resolve) => {
                    BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                        resolve(loader as GLTFFileLoader);
                    });
                });

                const loadPromise = BABYLON.loadAssetContainerAsync("https://playground.babylonjs.com/scenes/BoomBox.glb", window.scene!, {
                    pluginOptions: {
                        gltf: gltfOptions,
                    },
                });

                const loader = await loaderPromise;
                await loadPromise;

                const gltfLoaderProps: Record<string, unknown> = {};
                for (const key in gltfOptions) {
                    gltfLoaderProps[key] = (loader as unknown as Record<string, unknown>)[key];
                }

                return {
                    gltfOptions,
                    gltfLoaderProps: gltfLoaderProps as GLTFOptions,
                };
            });

            expect(assertionData.gltfOptions).toEqual(assertionData.gltfLoaderProps);
        });

        it("loadAssetContainerAsync with glTF callbacks", async () => {
            const assertionData = await page.evaluate(async () => {
                let parsed = false;
                let cameraCount = 0;
                let meshCount = 0;
                let materialCount = 0;
                let textureCount = 0;

                const assetContainer = await BABYLON.loadAssetContainerAsync("https://playground.babylonjs.com/scenes/BoomBox.glb", window.scene!, {
                    pluginOptions: {
                        gltf: {
                            onParsed: (gltf) => {
                                parsed = true;
                            },
                            onCameraLoaded: (camera) => {
                                cameraCount++;
                            },
                            onMaterialLoaded: (material) => {
                                materialCount++;
                            },
                            onMeshLoaded: (mesh) => {
                                meshCount++;
                            },
                            onTextureLoaded: (texture) => {
                                textureCount++;
                            },
                        },
                    },
                });

                return {
                    parsed,
                    cameraCount,
                    containerCameraCount: assetContainer.cameras.length,
                    meshCount,
                    containerMeshCount: assetContainer.meshes.length,
                    materialCount,
                    containerMaterialCount: assetContainer.materials.length,
                    textureCount,
                    containerTextureCount: assetContainer.textures.length,
                };
            });

            expect(assertionData.parsed).toBe(true);
            expect(assertionData.cameraCount).toBe(assertionData.containerCameraCount);
            expect(assertionData.meshCount).toBe(assertionData.containerMeshCount);
            expect(assertionData.materialCount).toBe(assertionData.containerMaterialCount);
            expect(assertionData.textureCount).toBe(assertionData.containerTextureCount);
        });
    });
});
