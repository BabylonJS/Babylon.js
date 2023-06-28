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
                    console.log("render loop stopped");
                    promises.push(Promise.resolve(window.scene!.meshes.filter((mesh) => mesh.getTotalVertices() !== 0).map((mesh) => mesh.isEnabled())));
                });
                return promise.then(() => Promise.all(promises));
            });
            expect(assertionData[0].every((b: boolean) => !b)).toBe(true);
            expect(assertionData[1].every((b: boolean) => b)).toBe(true);
        });

        it("Load CompileMaterials", async () => {
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<any>>();
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

                const promise = BABYLON.SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/Tests/CompileMaterials/", "Test.gltf", window.scene).then(() => {
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
            const assertionData = await page.evaluate(() => {
                const promises = new Array<Promise<{ [key: string]: boolean }>>();

                window.engine!.runRenderLoop(() => {
                    const enabledMeshes = window.scene!.meshes.filter((mesh) => mesh.material && mesh.isEnabled());
                    if (enabledMeshes.length > 0) {
                        promises.push(Promise.resolve({ enabledMeshes: enabledMeshes.every((mesh) => mesh.isReady(true)) }));
                    }
                });

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

                return promise.then(() => window.scene!.whenReadyAsync()).then(() => Promise.all(promises));
            });

            expect(assertionData.length).toBeGreaterThanOrEqual(3);

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

            expect(assertionData).toHaveLength(3);
            materialNames.forEach((name) => {
                expect(assertionData[name]).toEqual([name, name]);
            });
        });

        // it("Load LevelOfDetail with dispose when onMaterialLODsLoadedObservable", () => {
        //     const scene = new Scene(subject);
        //     const promises = new Array<Promise<void>>();

        //     SceneLoader.OnPluginActivatedObservable.addOnce((loader: GLTFFileLoader) => {
        //         const observer = loader.onExtensionLoadedObservable.add((extension) => {
        //             if (extension instanceof GLTF2.Loader.Extensions.MSFT_lod) {
        //                 loader.onExtensionLoadedObservable.remove(observer);
        //                 extension.onMaterialLODsLoadedObservable.add((indexLOD) => {
        //                     expect(indexLOD, "indexLOD").to.equal(0);
        //                     loader.dispose();
        //                 });
        //             }
        //         });

        //         promises.push(
        //             new Promise((resolve) => {
        //                 loader.onDisposeObservable.addOnce(() => {
        //                     resolve();
        //                 });
        //             })
        //         );
        //     });

        //     promises.push(
        //         SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetail.gltf", scene).then(() => {
        //             // do nothing
        //         })
        //     );

        //     return Promise.all(promises);
        // });

        // it("Load LevelOfDetailNoTextures", () => {
        //     const scene = new Scene(subject);

        //     const promises = new Array<Promise<any>>();

        //     SceneLoader.OnPluginActivatedObservable.addOnce((loader: GLTFFileLoader) => {
        //         promises.push(loader.whenCompleteAsync());
        //     });

        //     promises.push(SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetailNoTextures.gltf", scene));

        //     return Promise.all(promises);
        // });

        // it("Load LevelOfDetail with useRangeRequests", () => {
        //     const scene = new Scene(subject);
        //     const promises = new Array<Promise<void>>();

        //     const expectedSetRequestHeaderCalls = ["Range: bytes=0-19", "Range: bytes=20-1399", "Range: bytes=1400-1817", "Range: bytes=1820-3149", "Range: bytes=3152-8841"];

        //     const setRequestHeaderCalls = new Array<string>();
        //     const origSetRequestHeader = WebRequest.prototype.setRequestHeader;
        //     const setRequestHeaderStub = sinon.stub(WebRequest.prototype, "setRequestHeader").callsFake(function (...args) {
        //         setRequestHeaderCalls.push(args.join(": "));
        //         origSetRequestHeader.apply(this, args);
        //     });

        //     // Simulate default CORS policy on some web servers that reject getResponseHeader calls with `Content-Range`.
        //     const origGetResponseHeader = WebRequest.prototype.getResponseHeader;
        //     const getResponseHeaderStub = sinon.stub(WebRequest.prototype, "getResponseHeader").callsFake(function (...args) {
        //         return args[0] === "Content-Range" ? null : origGetResponseHeader.apply(this, args);
        //     });

        //     SceneLoader.OnPluginActivatedObservable.addOnce((loader: GLTFFileLoader) => {
        //         loader.useRangeRequests = true;
        //         loader.onExtensionLoadedObservable.add((extension) => {
        //             if (extension instanceof GLTF2.Loader.Extensions.MSFT_lod) {
        //                 extension.onMaterialLODsLoadedObservable.add((indexLOD) => {
        //                     expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls.slice(0, 3 + indexLOD));
        //                 });
        //             }
        //         });
        //         promises.push(
        //             loader.whenCompleteAsync().then(() => {
        //                 expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls);
        //                 setRequestHeaderStub.restore();
        //                 getResponseHeaderStub.restore();
        //             })
        //         );
        //     });

        //     promises.push(
        //         SceneLoader.AppendAsync("/Playground/scenes/", "LevelOfDetail.glb", scene).then(() => {
        //             expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls.slice(0, 3));
        //         })
        //     );

        //     return Promise.all(promises);
        // });

        // it("Load MultiPrimitive", () => {
        //     const scene = new Scene(subject);
        //     return SceneLoader.ImportMeshAsync(null, "http://models.babylonjs.com/Tests/MultiPrimitive/", "MultiPrimitive.gltf", scene).then((result) => {
        //         expect(result.meshes, "meshes").to.have.lengthOf(3);

        //         const node = scene.getNodeByName("node");
        //         expect(node, "node").to.exist;
        //         expect(node, "node").to.be.an.instanceof(TransformNode);

        //         expect(node.getChildren(), "node children").to.have.lengthOf(2);
        //         for (const childNode of node.getChildren()) {
        //             expect(childNode, "child node").to.be.an.instanceof(Mesh);
        //             const childMesh = childNode as Mesh;
        //             expect(childMesh.geometry).to.exist;
        //             expect(childMesh.material).to.exist;
        //         }
        //     });
        // });

        // it("Load BrainStem", () => {
        //     const scene = new Scene(subject);
        //     return SceneLoader.ImportMeshAsync(null, "/Playground/scenes/BrainStem/", "BrainStem.gltf", scene).then((result) => {
        //         expect(result.skeletons, "skeletons").to.have.lengthOf(1);

        //         const node1 = scene.getNodeByName("node1");
        //         expect(node1, "node1").to.exist;
        //         expect(node1, "node1").to.be.an.instanceof(TransformNode);

        //         for (const childMesh of node1.getChildMeshes()) {
        //             expect(childMesh.skeleton, "mesh skeleton").to.exist;
        //             expect(childMesh.skeleton.name, "mesh skeleton name").to.equal(result.skeletons[0].name);
        //         }
        //     });
        // });

        // it("Load BoomBox with transparencyAsCoverage", () => {
        //     const scene = new Scene(subject);

        //     const promises = new Array<Promise<any>>();

        //     SceneLoader.OnPluginActivatedObservable.addOnce((loader: GLTFFileLoader) => {
        //         let specularOverAlpha = false;
        //         let radianceOverAlpha = false;

        //         loader.transparencyAsCoverage = true;
        //         loader.onMaterialLoaded = (material) => {
        //             specularOverAlpha = specularOverAlpha || (material as PBRMaterial).useSpecularOverAlpha;
        //             radianceOverAlpha = radianceOverAlpha || (material as PBRMaterial).useRadianceOverAlpha;
        //         };
        //         promises.push(
        //             loader.whenCompleteAsync().then(() => {
        //                 expect(specularOverAlpha, "specularOverAlpha").to.be.false;
        //                 expect(radianceOverAlpha, "radianceOverAlpha").to.be.false;
        //             })
        //         );
        //     });

        //     promises.push(SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene));
        //     return Promise.all(promises);
        // });

        // it("Load BoomBox without transparencyAsCoverage", () => {
        //     const scene = new Scene(subject);

        //     const promises = new Array<Promise<any>>();

        //     SceneLoader.OnPluginActivatedObservable.addOnce((loader: GLTFFileLoader) => {
        //         let specularOverAlpha = true;
        //         let radianceOverAlpha = true;

        //         loader.transparencyAsCoverage = false;
        //         loader.onMaterialLoaded = (material) => {
        //             specularOverAlpha = specularOverAlpha && (material as PBRMaterial).useSpecularOverAlpha;
        //             radianceOverAlpha = radianceOverAlpha && (material as PBRMaterial).useRadianceOverAlpha;
        //         };
        //         promises.push(
        //             loader.whenCompleteAsync().then(() => {
        //                 expect(specularOverAlpha, "specularOverAlpha").to.be.true;
        //                 expect(radianceOverAlpha, "radianceOverAlpha").to.be.true;
        //             })
        //         );
        //     });

        //     promises.push(SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene));
        //     return Promise.all(promises);
        // });

        // it("Load BoomBox twice and check texture instancing", () => {
        //     const scene = new Scene(subject);
        //     return SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(() => {
        //         const createTextureSpy = sinon.spy(subject, "createTexture");
        //         return SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(() => {
        //             const called = createTextureSpy.called;
        //             createTextureSpy.restore();
        //             expect(called, "createTextureSpyCalled").to.be.false;
        //         });
        //     });
        // });

        // it("Load UFO with MSFT_audio_emitter", () => {
        //     const scene = new Scene(subject);
        //     return SceneLoader.ImportMeshAsync(null, "/Playground/scenes/", "ufo.glb", scene).then((result) => {
        //         expect(result.meshes.length, "meshes.length").to.equal(scene.meshes.length);
        //         expect(result.particleSystems.length, "particleSystems.length").to.equal(0);
        //         expect(result.animationGroups.length, "animationGroups.length").to.equal(3);
        //         expect(scene.soundTracks.length, "scene.soundTracks.length").to.equal(0);
        //         expect(scene.mainSoundTrack.soundCollection.length, "scene.mainSoundTrack.soundCollection.length").to.equal(3);
        //         expect(scene.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers(), "scene.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers()").to.be
        //             .true;
        //     });
        // });

        // it("Load Box with extras", () => {
        //     const scene = new Scene(subject);
        //     return SceneLoader.AppendAsync("/Playground/scenes/Box/", "Box_extras.gltf", scene).then((scene) => {
        //         expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
        //         expect(scene.materials.length, "scene.materials.length").to.equal(1);
        //         const mesh = scene.getMeshByName("Box001");
        //         expect(mesh, "Box001").to.exist;
        //         expect(mesh.metadata, "Box001 metadata").to.exist;
        //         expect(mesh.metadata.gltf, "Box001 metadata.gltf").to.exist;
        //         expect(mesh.metadata.gltf.extras, "Box001 metadata.gltf.extras").to.exist;
        //         expect(mesh.metadata.gltf.extras.kind, "Box001 extras.kind").to.equal("nice cube");
        //         expect(mesh.metadata.gltf.extras.magic, "Box001 extras.magic").to.equal(42);
        //         const camera = scene.getCameraByName("Camera");
        //         expect(camera, "Camera").to.exist;
        //         expect(camera.metadata, "Camera metadata").to.exist;
        //         expect(mesh.metadata.gltf, "Camera metadata.gltf").to.exist;
        //         expect(mesh.metadata.gltf.extras, "Camera metadata.gltf.extras").to.exist;
        //         expect(camera.metadata.gltf.extras.custom, "Camera extras.custom").to.equal("cameraProp");
        //         const material = scene.getMaterialByName("01___Default");
        //         expect(material, "Material").to.exist;
        //         expect(material.metadata, "Material metadata").to.exist;
        //         expect(mesh.metadata.gltf, "Material metadata.gltf").to.exist;
        //         expect(mesh.metadata.gltf.extras, "Material metadata.gltf.extras").to.exist;
        //         expect(material.metadata.gltf.extras.custom, "Material extras.custom").to.equal("materialProp");
        //     });
        // });
    });
});
