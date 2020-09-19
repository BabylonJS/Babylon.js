/**
 * Describes the test suite.
 */
describe('Babylon Scene Loader', function() {
    let subject: BABYLON.Engine;

    this.timeout(10000);

    /**
     * Loads the dependencies.
     */
    before(function(done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function() {
                // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
                BABYLON.PromisePolyfill.Apply(true);
                BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
                done();
            });
    });

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function() {
        subject = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });

        // Avoid creating normals in PBR materials.
        subject.getCaps().standardDerivatives = true;
    });

    /**
     * Integration tests for loading glTF assets.
     */
    describe('#glTF', () => {
        it('Load BoomBox', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then((scene) => {
                expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
                expect(scene.materials.length, "scene.materials.length").to.equal(1);
            });
        });

        it('Load BoomBox GLB', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/", "BoomBox.glb", scene).then((scene) => {
                expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
                expect(scene.materials.length, "scene.materials.length").to.equal(1);
            });
        });

        it('Load BoomBox with ImportMesh', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then((result) => {
                expect(result.meshes.length, "meshes.length").to.equal(scene.meshes.length);
                expect(result.particleSystems.length, "particleSystems.length").to.equal(0);
                expect(result.skeletons.length, "skeletons.length").to.equal(0);
                expect(result.animationGroups.length, "animationGroups.length").to.equal(0);
            });
        });

        it('Load TwoQuads with ImportMesh and one node name', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("node0", "http://models.babylonjs.com/Tests/TwoQuads/", "TwoQuads.gltf", scene).then(() => {
                expect(scene.getMeshByName("node0"), "node0").to.exist;
                expect(scene.getMeshByName("node1"), "node1").to.not.exist;
            });
        });

        it('Load TwoQuads with ImportMesh and two node names', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(["node0", "node1"], "http://models.babylonjs.com/Tests/TwoQuads/", "TwoQuads.gltf", scene).then(() => {
                expect(scene.getMeshByName("node0"), "node0").to.exist;
                expect(scene.getMeshByName("node1"), "node1").to.exist;
            });
        });

        it('Load BoomBox with callbacks', () => {
            let parsedCount = 0;
            let meshCount = 0;
            let materialCount = 0;
            let textureCount = 0;
            let ready = false;

            const promises = new Array<Promise<void>>();

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                loader.onParsed = (data) => {
                    parsedCount++;
                };

                loader.onMeshLoaded = (mesh) => {
                    meshCount++;
                };
                loader.onMaterialLoaded = (material) => {
                    materialCount++;
                };
                loader.onTextureLoaded = (texture) => {
                    textureCount++;
                };

                promises.push(loader.whenCompleteAsync().then(() => {
                    expect(ready, "ready").to.be.true;
                }));
            });

            const scene = new BABYLON.Scene(subject);
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(() => {
                ready = true;

                expect(parsedCount, "parsedCount").to.equal(1);
                expect(meshCount, "meshCount").to.equal(scene.meshes.length);
                expect(materialCount, "materialCount").to.equal(scene.materials.length);

                const filteredTextures = scene.textures.filter((texture) => texture !== scene.environmentBRDFTexture);
                expect(textureCount, "textureCount").to.equal(filteredTextures.length);
            }));

            return Promise.all(promises);
        });

        it('Load BoomBox with dispose', () => {
            let ready = false;
            let disposed = false;

            const promises = new Array<Promise<void>>();

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                loader.onDispose = () => {
                    disposed = true;
                };

                promises.push(BABYLON.Tools.DelayAsync(1).then(() => {
                    loader.dispose();
                    expect(ready, "ready").to.be.false;
                    expect(disposed, "disposed").to.be.true;
                }));
            });

            const scene = new BABYLON.Scene(subject);
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(() => {
                ready = true;
            }));

            return Promise.race(promises);
        });

        it('Load BoomBox with mesh.isEnabled check', () => {
            const scene = new BABYLON.Scene(subject);

            subject.runRenderLoop(() => {
                for (const mesh of scene.meshes) {
                    if (mesh.getTotalVertices() !== 0) {
                        expect(mesh.isEnabled(), "mesh.isEnabled").to.be.false;
                    }
                }
            });

            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then((scene) => {
                subject.stopRenderLoop();

                for (const mesh of scene.meshes) {
                    if (mesh.getTotalVertices() !== 0) {
                        expect(mesh.isEnabled(), "mesh.isEnabled").to.be.true;
                    }
                }
            });
        });

        it('Load CompileMaterials', () => {
            const scene = new BABYLON.Scene(subject);
            const promises = new Array<Promise<void>>();
            let createShaderProgramSpy: sinon.SinonSpy;

            subject.runRenderLoop(() => {
                for (const mesh of scene.meshes) {
                    if (mesh.material && mesh.isEnabled()) {
                        expect(mesh.isReady(true), "mesh is ready").to.be.true;
                    }
                }
            });

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                loader.compileMaterials = true;

                promises.push(loader.whenCompleteAsync().then(() => {
                    const called = createShaderProgramSpy.called;
                    createShaderProgramSpy.restore();
                    expect(called, "createShaderProgramCalled").to.be.false;
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/CompileMaterials/", "Test.gltf", scene).then(() => {
                createShaderProgramSpy = sinon.spy(subject, "createShaderProgram");
            }));

            return Promise.all(promises);
        });

        it('Load BrainStem with compileMaterials', () => {
            const scene = new BABYLON.Scene(subject);
            const promises = new Array<Promise<void>>();
            let createShaderProgramSpy: sinon.SinonSpy;

            subject.runRenderLoop(() => {
                for (const mesh of scene.meshes) {
                    if (mesh.material && mesh.isEnabled()) {
                        expect(mesh.isReady(true), "mesh is ready").to.be.true;
                    }
                }
            });

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                loader.compileMaterials = true;

                promises.push(loader.whenCompleteAsync().then(() => {
                    const called = createShaderProgramSpy.called;
                    createShaderProgramSpy.restore();
                    expect(called, "createShaderProgramCalled").to.be.false;
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BrainStem/", "BrainStem.gltf", scene).then(() => {
                createShaderProgramSpy = sinon.spy(subject, "createShaderProgram");
            }));

            return Promise.all(promises);
        });

        it('Load Alien', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/Alien/", "Alien.gltf", scene).then((result) => {
                const skeletonsMapping = {
                    "AlienHead": "skeleton0",
                    "Collar": "skeleton1",
                    "LeftEye": "skeleton2",
                    "RightEye": "skeleton3",
                    "CollarClasp": "skeleton1",
                    "Shirt": "skeleton1",
                    "ShirtPlate": "skeleton1",
                    "Teeth": "skeleton1",
                };

                expect(scene.skeletons, "scene.skeletons").to.have.lengthOf(4);
                expect(result.skeletons, "skeletons").to.have.lengthOf(4);

                for (const meshName in skeletonsMapping) {
                    const skeletonName = skeletonsMapping[meshName];
                    expect(scene.getMeshByName(meshName).skeleton.name, `skeleton name of mesh '${meshName}'`).to.equal(skeletonName);
                }

                const alienHeadMesh = scene.getMeshByName("AlienHead") as BABYLON.Mesh;
                expect(alienHeadMesh.morphTargetManager.numTargets, "alienHeadMesh.morphTargetManager.numTargets").to.equal(2);

                expect(scene.animationGroups, "scene.animationGroups").to.have.lengthOf(1);
                expect(result.animationGroups, "animationGroups").to.have.lengthOf(1);

                const animationGroup = result.animationGroups[0];
                expect(animationGroup.name, "animationGroup.name").to.equal("TwoTargetBlend");
                expect(animationGroup.targetedAnimations, "animationGroup.targetedAnimations").to.have.lengthOf(7);
                const influenceAnimations = animationGroup.targetedAnimations.filter((_) => _.animation.targetProperty === "influence");
                expect(influenceAnimations, "influenceAnimations").to.have.lengthOf(2);
                const rotationAnimations = animationGroup.targetedAnimations.filter((_) => _.animation.targetProperty === "rotationQuaternion");
                expect(rotationAnimations, "rotationAnimations").to.have.lengthOf(4);
                const positionAnimations = animationGroup.targetedAnimations.filter((_) => _.animation.targetProperty === "position");
                expect(positionAnimations, "positionAnimations").to.have.lengthOf(1);
            });
        });

        it('Load LevelOfDetail', () => {
            const scene = new BABYLON.Scene(subject);
            const promises = new Array<Promise<void>>();

            subject.runRenderLoop(() => {
                for (const mesh of scene.meshes) {
                    if (mesh.material && mesh.isEnabled()) {
                        expect(mesh.isReady(true), "mesh is ready").to.be.true;
                    }
                }
            });

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                loader.compileMaterials = true;

                promises.push(loader.whenCompleteAsync().then(() => {
                    const meshes = [
                        scene.getMeshByName("node0"),
                        scene.getMeshByName("node1")
                    ];

                    expect(meshes[0].material.name, "Material for node 0").to.equal("High");
                    expect(meshes[1].material.name, "Material for node 1").to.equal("High");

                    expect(scene.materials, "scene.materials").to.have.lengthOf(1);
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", `LevelOfDetail.gltf`, scene).then(() => {
                const meshes = [
                    scene.getMeshByName("node0"),
                    scene.getMeshByName("node1")
                ];

                expect(meshes[0].material.name, "Material for node 0").to.equal("Low");
                expect(meshes[1].material.name, "Material for node 1").to.equal("Low");

                expect(scene.materials, "scene.materials").to.have.lengthOf(3);
                const materialLow = scene.getMaterialByName("Low");
                const materialMedium = scene.getMaterialByName("Medium");
                const materialHigh = scene.getMaterialByName("High");

                expect(materialLow.isReady(meshes[0]), "Material 'Low' is ready for node 0").to.be.true;
                expect(materialLow.isReady(meshes[1]), "Material 'Low' is ready for node 1").to.be.true;
                expect(materialMedium.isReady(meshes[0]), "Material 'Medium' is ready for node 0").to.be.true;
                expect(materialMedium.isReady(meshes[1]), "Material 'Medium' is ready for node 1").to.be.true;
                expect(materialHigh.isReady(meshes[0]), "Material 'High' is ready for node 0").to.be.true;
                expect(materialHigh.isReady(meshes[1]), "Material 'High' is ready for node 1").to.be.true;
            }));

            return Promise.all(promises);
        });

        it('Load LevelOfDetail with onMaterialLODsLoadedObservable', () => {
            const scene = new BABYLON.Scene(subject);
            const promises = new Array<Promise<void>>();

            const materialNames = [ "Low", "Medium", "High" ];

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                const observer = loader.onExtensionLoadedObservable.add((extension) => {
                    if (extension instanceof BABYLON.GLTF2.Loader.Extensions.MSFT_lod) {
                        loader.onExtensionLoadedObservable.remove(observer);
                        extension.onMaterialLODsLoadedObservable.add((indexLOD) => {
                            const expectedMaterialName = materialNames[indexLOD];
                            expect(scene.getMeshByName("node0").material.name, "Material for node 0").to.equal(expectedMaterialName);
                            expect(scene.getMeshByName("node1").material.name, "Material for node 1").to.equal(expectedMaterialName);
                        });
                    }
                });

                promises.push(loader.whenCompleteAsync());
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetail.gltf", scene).then(() => {
                // do nothing
            }));

            return Promise.all(promises);
        });

        it('Load LevelOfDetail with dispose when onMaterialLODsLoadedObservable', () => {
            const scene = new BABYLON.Scene(subject);
            const promises = new Array<Promise<void>>();

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                const observer = loader.onExtensionLoadedObservable.add((extension) => {
                    if (extension instanceof BABYLON.GLTF2.Loader.Extensions.MSFT_lod) {
                        loader.onExtensionLoadedObservable.remove(observer);
                        extension.onMaterialLODsLoadedObservable.add((indexLOD) => {
                            expect(indexLOD, "indexLOD").to.equal(0);
                            loader.dispose();
                        });
                    }
                });

                promises.push(new Promise((resolve) => {
                    loader.onDisposeObservable.addOnce(() => {
                        resolve();
                    });
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetail.gltf", scene).then(() => {
                // do nothing
            }));

            return Promise.all(promises);
        });

        it('Load LevelOfDetailNoTextures', () => {
            const scene = new BABYLON.Scene(subject);

            const promises = new Array<Promise<any>>();

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                promises.push(loader.whenCompleteAsync());
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetailNoTextures.gltf", scene));

            return Promise.all(promises);
        });

        it('Load LevelOfDetail with useRangeRequests', () => {
            const scene = new BABYLON.Scene(subject);
            const promises = new Array<Promise<void>>();

            const expectedSetRequestHeaderCalls = [
                "Range: bytes=0-19",
                "Range: bytes=20-1399",
                "Range: bytes=1400-1817",
                "Range: bytes=1820-3149",
                "Range: bytes=3152-8841",
            ];

            const setRequestHeaderCalls = new Array<string>();
            const origSetRequestHeader = BABYLON.WebRequest.prototype.setRequestHeader;
            const setRequestHeaderStub = sinon.stub(BABYLON.WebRequest.prototype, "setRequestHeader").callsFake(function(...args) {
                setRequestHeaderCalls.push(args.join(": "));
                origSetRequestHeader.apply(this, args);
            });

            // Simulate default CORS policy on some web servers that reject getResponseHeader calls with `Content-Range`.
            const origGetResponseHeader = BABYLON.WebRequest.prototype.getResponseHeader;
            const getResponseHeaderStub = sinon.stub(BABYLON.WebRequest.prototype, "getResponseHeader").callsFake(function(...args) {
                return (args[0] === "Content-Range") ? null : origGetResponseHeader.apply(this, args);
            });

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                loader.useRangeRequests = true;
                loader.onExtensionLoadedObservable.add((extension) => {
                    if (extension instanceof BABYLON.GLTF2.Loader.Extensions.MSFT_lod) {
                        extension.onMaterialLODsLoadedObservable.add((indexLOD) => {
                            expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls.slice(0, 3 + indexLOD));
                        });
                    }
                });
                promises.push(loader.whenCompleteAsync().then(() => {
                    expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls);
                    setRequestHeaderStub.restore();
                    getResponseHeaderStub.restore();
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/", "LevelOfDetail.glb", scene).then(() => {
                expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls.slice(0, 3));
            }));

            return Promise.all(promises);
        });

        it('Load MultiPrimitive', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "http://models.babylonjs.com/Tests/MultiPrimitive/", "MultiPrimitive.gltf", scene).then((result) => {
                expect(result.meshes, "meshes").to.have.lengthOf(3);

                const node = scene.getNodeByName("node");
                expect(node, "node").to.exist;
                expect(node, "node").to.be.an.instanceof(BABYLON.TransformNode);

                expect(node.getChildren(), "node children").to.have.lengthOf(2);
                for (const childNode of node.getChildren()) {
                    expect(childNode, "child node").to.be.an.instanceof(BABYLON.Mesh);
                    const childMesh = childNode as BABYLON.Mesh;
                    expect(childMesh.geometry).to.exist;
                    expect(childMesh.material).to.exist;
                }
            });
        });

        it('Load BrainStem', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/BrainStem/", "BrainStem.gltf", scene).then((result) => {
                expect(result.skeletons, "skeletons").to.have.lengthOf(1);

                const node1 = scene.getNodeByName("node1");
                expect(node1, "node1").to.exist;
                expect(node1, "node1").to.be.an.instanceof(BABYLON.TransformNode);

                for (const childMesh of node1.getChildMeshes()) {
                    expect(childMesh.skeleton, "mesh skeleton").to.exist;
                    expect(childMesh.skeleton.name, "mesh skeleton name").to.equal(result.skeletons[0].name);
                }
            });
        });

        it('Load BoomBox with transparencyAsCoverage', () => {
            const scene = new BABYLON.Scene(subject);

            const promises = new Array<Promise<any>>();

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                var specularOverAlpha = false;
                var radianceOverAlpha = false;

                loader.transparencyAsCoverage = true;
                loader.onMaterialLoaded = (material) => {
                    specularOverAlpha = specularOverAlpha || (material as BABYLON.PBRMaterial).useSpecularOverAlpha;
                    radianceOverAlpha = radianceOverAlpha || (material as BABYLON.PBRMaterial).useRadianceOverAlpha;
                };
                promises.push(loader.whenCompleteAsync().then(() => {
                    expect(specularOverAlpha, "specularOverAlpha").to.be.false;
                    expect(radianceOverAlpha, "radianceOverAlpha").to.be.false;
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene));
            return Promise.all(promises);
        });

        it('Load BoomBox without transparencyAsCoverage', () => {
            const scene = new BABYLON.Scene(subject);

            const promises = new Array<Promise<any>>();

            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader: BABYLON.GLTFFileLoader) => {
                var specularOverAlpha = true;
                var radianceOverAlpha = true;

                loader.transparencyAsCoverage = false;
                loader.onMaterialLoaded = (material) => {
                    specularOverAlpha = specularOverAlpha && (material as BABYLON.PBRMaterial).useSpecularOverAlpha;
                    radianceOverAlpha = radianceOverAlpha && (material as BABYLON.PBRMaterial).useRadianceOverAlpha;
                };
                promises.push(loader.whenCompleteAsync().then(() => {
                    expect(specularOverAlpha, "specularOverAlpha").to.be.true;
                    expect(radianceOverAlpha, "radianceOverAlpha").to.be.true;
                }));
            });

            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene));
            return Promise.all(promises);
        });

        it('Load BoomBox twice and check texture instancing', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(() => {
                const createTextureSpy = sinon.spy(subject, "createTexture");
                return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(() => {
                    const called = createTextureSpy.called;
                    createTextureSpy.restore();
                    expect(called, "createTextureSpyCalled").to.be.false;
                });
            });
        });

        it('Load UFO with MSFT_audio_emitter', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/", "ufo.glb", scene).then((result) => {
                expect(result.meshes.length, "meshes.length").to.equal(scene.meshes.length);
                expect(result.particleSystems.length, "particleSystems.length").to.equal(0);
                expect(result.animationGroups.length, "animationGroups.length").to.equal(3);
                expect(scene.soundTracks.length, "scene.soundTracks.length").to.equal(0);
                expect(scene.mainSoundTrack.soundCollection.length, "scene.mainSoundTrack.soundCollection.length").to.equal(3);
                expect(scene.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers(), "scene.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers()").to.be.true;
            });
        });

        it('Load Box with extras', () => {
            const scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/Box/", "Box_extras.gltf", scene).then((scene) => {
                expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
                expect(scene.materials.length, "scene.materials.length").to.equal(1);
                const mesh = scene.getMeshByName("Box001");
                expect(mesh, "Box001").to.exist;
                expect(mesh.metadata, "Box001 metadata").to.exist;
                expect(mesh.metadata.gltf, "Box001 metadata.gltf").to.exist;
                expect(mesh.metadata.gltf.extras, "Box001 metadata.gltf.extras").to.exist;
                expect(mesh.metadata.gltf.extras.kind, "Box001 extras.kind").to.equal("nice cube");
                expect(mesh.metadata.gltf.extras.magic, "Box001 extras.magic").to.equal(42);
                const camera = scene.getCameraByName("Camera");
                expect(camera, "Camera").to.exist;
                expect(camera.metadata, "Camera metadata").to.exist;
                expect(mesh.metadata.gltf, "Camera metadata.gltf").to.exist;
                expect(mesh.metadata.gltf.extras, "Camera metadata.gltf.extras").to.exist;
                expect(camera.metadata.gltf.extras.custom, "Camera extras.custom").to.equal("cameraProp");
                const material = scene.getMaterialByName("01___Default");
                expect(material, "Material").to.exist;
                expect(material.metadata, "Material metadata").to.exist;
                expect(mesh.metadata.gltf, "Material metadata.gltf").to.exist;
                expect(mesh.metadata.gltf.extras, "Material metadata.gltf.extras").to.exist;
                expect(material.metadata.gltf.extras.custom, "Material extras.custom").to.equal("materialProp");
            });
        });

        // TODO: test animation group callback
        // TODO: test material instancing
        // TODO: test KHR_materials_pbrSpecularGlossiness
        // TODO: test KHR_lights
    });

    /**
     * Integration tests for loading OBJ assets.
     */
    describe('#OBJ', () => {
        it('should load a tetrahedron (without colors)', () => {
            var fileContents = `
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

            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.LoadAssetContainerAsync('', 'data:' + fileContents, scene, () => { }, ".obj").then((container) => {
                expect(container.meshes.length).to.eq(1);
                let tetrahedron = container.meshes[0];

                var positions: BABYLON.FloatArray = tetrahedron.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                var colors: BABYLON.FloatArray = tetrahedron.getVerticesData(BABYLON.VertexBuffer.ColorKind);

                expect(positions).to.deep.equal([1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2]);
                assert.isNull(colors, 'expecting colors vertex buffer to be null');
            });
        });

        it('should parse leniently allowing extra spaces with vertex definitions', () => {
            var fileContents = `
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

            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.LoadAssetContainerAsync('', 'data:' + fileContents, scene, () => { }, ".obj").then((container) => {
                expect(container.meshes.length).to.eq(1);
                let tetrahedron = container.meshes[0];

                var positions: BABYLON.FloatArray = tetrahedron.getVerticesData(BABYLON.VertexBuffer.PositionKind);

                expect(positions).to.deep.equal([1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2]);
            });
        });
    });

    describe('#AssetContainer', () => {
        it('should be loaded from BoomBox GLTF', () => {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.LoadAssetContainerAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then((container) => {
                expect(container.meshes.length).to.eq(2);
            });
        });
        it('should be adding and removing objects from scene', () => {
            // Create a scene with some assets
            var scene = new BABYLON.Scene(subject);
            var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
            var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);

            // Move all the assets from the scene into a container
            var container = new BABYLON.AssetContainer(scene);
            var keepAssets = new BABYLON.KeepAssets();
            keepAssets.cameras.push(camera);
            container.moveAllFromScene(keepAssets);
            expect(scene.cameras.length).to.eq(1);
            expect(scene.meshes.length).to.eq(0);
            expect(scene.lights.length).to.eq(0);
            expect(container.cameras.length).to.eq(0);
            expect(container.meshes.length).to.eq(2);
            expect(container.lights.length).to.eq(1);

            // Add them back and then remove again
            container.addAllToScene();
            expect(scene.cameras.length).to.eq(1);
            expect(scene.meshes.length).to.eq(2);
            expect(scene.lights.length).to.eq(1);
            container.removeAllFromScene();
            expect(scene.cameras.length).to.eq(1);
            expect(scene.meshes.length).to.eq(0);
            expect(scene.lights.length).to.eq(0);
        });
    });
});
