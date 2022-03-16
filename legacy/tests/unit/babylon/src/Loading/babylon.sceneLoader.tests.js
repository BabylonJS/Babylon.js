/**
 * Describes the test suite.
 */
describe('Babylon Scene Loader', function () {
    var subject;
    this.timeout(10000);
    /**
     * Loads the dependencies.
     */
    before(function (done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function () {
            // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
            BABYLON.PromisePolyfill.Apply(true);
            BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
            done();
        });
    });
    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
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
    describe('#glTF', function () {
        it('Load BoomBox', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function (scene) {
                expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
                expect(scene.materials.length, "scene.materials.length").to.equal(1);
            });
        });
        it('Load BoomBox GLB', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/", "BoomBox.glb", scene).then(function (scene) {
                expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
                expect(scene.materials.length, "scene.materials.length").to.equal(1);
            });
        });
        it('Load BoomBox with ImportMesh', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function (result) {
                expect(result.meshes.length, "meshes.length").to.equal(scene.meshes.length);
                expect(result.particleSystems.length, "particleSystems.length").to.equal(0);
                expect(result.skeletons.length, "skeletons.length").to.equal(0);
                expect(result.animationGroups.length, "animationGroups.length").to.equal(0);
            });
        });
        it('Load TwoQuads with ImportMesh and one node name', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("node0", "http://models.babylonjs.com/Tests/TwoQuads/", "TwoQuads.gltf", scene).then(function () {
                expect(scene.getMeshByName("node0"), "node0").to.exist;
                expect(scene.getMeshByName("node1"), "node1").to.not.exist;
            });
        });
        it('Load TwoQuads with ImportMesh and two node names', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(["node0", "node1"], "http://models.babylonjs.com/Tests/TwoQuads/", "TwoQuads.gltf", scene).then(function () {
                expect(scene.getMeshByName("node0"), "node0").to.exist;
                expect(scene.getMeshByName("node1"), "node1").to.exist;
            });
        });
        it('Load BoomBox with callbacks', function () {
            var parsedCount = 0;
            var meshCount = 0;
            var materialCount = 0;
            var textureCount = 0;
            var ready = false;
            var promises = new Array();
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                loader.onParsed = function (data) {
                    parsedCount++;
                };
                loader.onMeshLoaded = function (mesh) {
                    meshCount++;
                };
                loader.onMaterialLoaded = function (material) {
                    materialCount++;
                };
                loader.onTextureLoaded = function (texture) {
                    textureCount++;
                };
                promises.push(loader.whenCompleteAsync().then(function () {
                    expect(ready, "ready").to.be.true;
                }));
            });
            var scene = new BABYLON.Scene(subject);
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function () {
                ready = true;
                expect(parsedCount, "parsedCount").to.equal(1);
                expect(meshCount, "meshCount").to.equal(scene.meshes.length);
                expect(materialCount, "materialCount").to.equal(scene.materials.length);
                var filteredTextures = scene.textures.filter(function (texture) { return texture !== scene.environmentBRDFTexture; });
                expect(textureCount, "textureCount").to.equal(filteredTextures.length);
            }));
            return Promise.all(promises);
        });
        it('Load BoomBox with dispose', function () {
            var ready = false;
            var disposed = false;
            var promises = new Array();
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                loader.onDispose = function () {
                    disposed = true;
                };
                promises.push(BABYLON.Tools.DelayAsync(1).then(function () {
                    loader.dispose();
                    expect(ready, "ready").to.be.false;
                    expect(disposed, "disposed").to.be.true;
                }));
            });
            var scene = new BABYLON.Scene(subject);
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function () {
                ready = true;
            }));
            return Promise.race(promises);
        });
        it('Load BoomBox with mesh.isEnabled check', function () {
            var scene = new BABYLON.Scene(subject);
            subject.runRenderLoop(function () {
                for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                    var mesh = _a[_i];
                    if (mesh.getTotalVertices() !== 0) {
                        expect(mesh.isEnabled(), "mesh.isEnabled").to.be.false;
                    }
                }
            });
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function (scene) {
                subject.stopRenderLoop();
                for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                    var mesh = _a[_i];
                    if (mesh.getTotalVertices() !== 0) {
                        expect(mesh.isEnabled(), "mesh.isEnabled").to.be.true;
                    }
                }
            });
        });
        it('Load CompileMaterials', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            var createShaderProgramSpy;
            subject.runRenderLoop(function () {
                for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                    var mesh = _a[_i];
                    if (mesh.material && mesh.isEnabled()) {
                        expect(mesh.isReady(true), "mesh is ready").to.be.true;
                    }
                }
            });
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                loader.compileMaterials = true;
                promises.push(loader.whenCompleteAsync().then(function () {
                    var called = createShaderProgramSpy.called;
                    createShaderProgramSpy.restore();
                    expect(called, "createShaderProgramCalled").to.be.false;
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/CompileMaterials/", "Test.gltf", scene).then(function () {
                createShaderProgramSpy = sinon.spy(subject, "createShaderProgram");
            }));
            return Promise.all(promises);
        });
        it('Load BrainStem with compileMaterials', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            var createShaderProgramSpy;
            subject.runRenderLoop(function () {
                for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                    var mesh = _a[_i];
                    if (mesh.material && mesh.isEnabled()) {
                        expect(mesh.isReady(true), "mesh is ready").to.be.true;
                    }
                }
            });
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                loader.compileMaterials = true;
                promises.push(loader.whenCompleteAsync().then(function () {
                    var called = createShaderProgramSpy.called;
                    createShaderProgramSpy.restore();
                    expect(called, "createShaderProgramCalled").to.be.false;
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BrainStem/", "BrainStem.gltf", scene).then(function () {
                createShaderProgramSpy = sinon.spy(subject, "createShaderProgram");
            }));
            return Promise.all(promises);
        });
        it('Load Alien', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/Alien/", "Alien.gltf", scene).then(function (result) {
                var skeletonsMapping = {
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
                for (var meshName in skeletonsMapping) {
                    var skeletonName = skeletonsMapping[meshName];
                    expect(scene.getMeshByName(meshName).skeleton.name, "skeleton name of mesh '".concat(meshName, "'")).to.equal(skeletonName);
                }
                var alienHeadMesh = scene.getMeshByName("AlienHead");
                expect(alienHeadMesh.morphTargetManager.numTargets, "alienHeadMesh.morphTargetManager.numTargets").to.equal(2);
                expect(scene.animationGroups, "scene.animationGroups").to.have.lengthOf(1);
                expect(result.animationGroups, "animationGroups").to.have.lengthOf(1);
                var animationGroup = result.animationGroups[0];
                expect(animationGroup.name, "animationGroup.name").to.equal("TwoTargetBlend");
                expect(animationGroup.targetedAnimations, "animationGroup.targetedAnimations").to.have.lengthOf(7);
                var influenceAnimations = animationGroup.targetedAnimations.filter(function (_) { return _.animation.targetProperty === "influence"; });
                expect(influenceAnimations, "influenceAnimations").to.have.lengthOf(2);
                var rotationAnimations = animationGroup.targetedAnimations.filter(function (_) { return _.animation.targetProperty === "rotationQuaternion"; });
                expect(rotationAnimations, "rotationAnimations").to.have.lengthOf(4);
                var positionAnimations = animationGroup.targetedAnimations.filter(function (_) { return _.animation.targetProperty === "position"; });
                expect(positionAnimations, "positionAnimations").to.have.lengthOf(1);
            });
        });
        it('Load LevelOfDetail', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            subject.runRenderLoop(function () {
                for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                    var mesh = _a[_i];
                    if (mesh.material && mesh.isEnabled()) {
                        expect(mesh.isReady(true), "mesh is ready").to.be.true;
                    }
                }
            });
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                loader.compileMaterials = true;
                promises.push(loader.whenCompleteAsync().then(function () {
                    var meshes = [
                        scene.getMeshByName("node0"),
                        scene.getMeshByName("node1")
                    ];
                    expect(meshes[0].material.name, "Material for node 0").to.equal("High");
                    expect(meshes[1].material.name, "Material for node 1").to.equal("High");
                    expect(scene.materials, "scene.materials").to.have.lengthOf(1);
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetail.gltf", scene).then(function () {
                var meshes = [
                    scene.getMeshByName("node0"),
                    scene.getMeshByName("node1")
                ];
                expect(meshes[0].material.name, "Material for node 0").to.equal("Low");
                expect(meshes[1].material.name, "Material for node 1").to.equal("Low");
                expect(scene.materials, "scene.materials").to.have.lengthOf(3);
                var materialLow = scene.getMaterialByName("Low");
                var materialMedium = scene.getMaterialByName("Medium");
                var materialHigh = scene.getMaterialByName("High");
                expect(materialLow.isReady(meshes[0]), "Material 'Low' is ready for node 0").to.be.true;
                expect(materialLow.isReady(meshes[1]), "Material 'Low' is ready for node 1").to.be.true;
                expect(materialMedium.isReady(meshes[0]), "Material 'Medium' is ready for node 0").to.be.true;
                expect(materialMedium.isReady(meshes[1]), "Material 'Medium' is ready for node 1").to.be.true;
                expect(materialHigh.isReady(meshes[0]), "Material 'High' is ready for node 0").to.be.true;
                expect(materialHigh.isReady(meshes[1]), "Material 'High' is ready for node 1").to.be.true;
            }));
            return Promise.all(promises);
        });
        it('Load LevelOfDetail with onMaterialLODsLoadedObservable', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            var materialNames = ["Low", "Medium", "High"];
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                var observer = loader.onExtensionLoadedObservable.add(function (extension) {
                    if (extension instanceof BABYLON.GLTF2.Loader.Extensions.MSFT_lod) {
                        loader.onExtensionLoadedObservable.remove(observer);
                        extension.onMaterialLODsLoadedObservable.add(function (indexLOD) {
                            var expectedMaterialName = materialNames[indexLOD];
                            expect(scene.getMeshByName("node0").material.name, "Material for node 0").to.equal(expectedMaterialName);
                            expect(scene.getMeshByName("node1").material.name, "Material for node 1").to.equal(expectedMaterialName);
                        });
                    }
                });
                promises.push(loader.whenCompleteAsync());
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetail.gltf", scene).then(function () {
                // do nothing
            }));
            return Promise.all(promises);
        });
        it('Load LevelOfDetail with dispose when onMaterialLODsLoadedObservable', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                var observer = loader.onExtensionLoadedObservable.add(function (extension) {
                    if (extension instanceof BABYLON.GLTF2.Loader.Extensions.MSFT_lod) {
                        loader.onExtensionLoadedObservable.remove(observer);
                        extension.onMaterialLODsLoadedObservable.add(function (indexLOD) {
                            expect(indexLOD, "indexLOD").to.equal(0);
                            loader.dispose();
                        });
                    }
                });
                promises.push(new Promise(function (resolve) {
                    loader.onDisposeObservable.addOnce(function () {
                        resolve();
                    });
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetail.gltf", scene).then(function () {
                // do nothing
            }));
            return Promise.all(promises);
        });
        it('Load LevelOfDetailNoTextures', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                promises.push(loader.whenCompleteAsync());
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("http://models.babylonjs.com/Tests/LevelOfDetail/", "LevelOfDetailNoTextures.gltf", scene));
            return Promise.all(promises);
        });
        it('Load LevelOfDetail with useRangeRequests', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            var expectedSetRequestHeaderCalls = [
                "Range: bytes=0-19",
                "Range: bytes=20-1399",
                "Range: bytes=1400-1817",
                "Range: bytes=1820-3149",
                "Range: bytes=3152-8841",
            ];
            var setRequestHeaderCalls = new Array();
            var origSetRequestHeader = BABYLON.WebRequest.prototype.setRequestHeader;
            var setRequestHeaderStub = sinon.stub(BABYLON.WebRequest.prototype, "setRequestHeader").callsFake(function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                setRequestHeaderCalls.push(args.join(": "));
                origSetRequestHeader.apply(this, args);
            });
            // Simulate default CORS policy on some web servers that reject getResponseHeader calls with `Content-Range`.
            var origGetResponseHeader = BABYLON.WebRequest.prototype.getResponseHeader;
            var getResponseHeaderStub = sinon.stub(BABYLON.WebRequest.prototype, "getResponseHeader").callsFake(function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return (args[0] === "Content-Range") ? null : origGetResponseHeader.apply(this, args);
            });
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                loader.useRangeRequests = true;
                loader.onExtensionLoadedObservable.add(function (extension) {
                    if (extension instanceof BABYLON.GLTF2.Loader.Extensions.MSFT_lod) {
                        extension.onMaterialLODsLoadedObservable.add(function (indexLOD) {
                            expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls.slice(0, 3 + indexLOD));
                        });
                    }
                });
                promises.push(loader.whenCompleteAsync().then(function () {
                    expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls);
                    setRequestHeaderStub.restore();
                    getResponseHeaderStub.restore();
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/", "LevelOfDetail.glb", scene).then(function () {
                expect(setRequestHeaderCalls, "setRequestHeaderCalls").to.have.ordered.members(expectedSetRequestHeaderCalls.slice(0, 3));
            }));
            return Promise.all(promises);
        });
        it('Load MultiPrimitive', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "http://models.babylonjs.com/Tests/MultiPrimitive/", "MultiPrimitive.gltf", scene).then(function (result) {
                expect(result.meshes, "meshes").to.have.lengthOf(3);
                var node = scene.getNodeByName("node");
                expect(node, "node").to.exist;
                expect(node, "node").to.be.an.instanceof(BABYLON.TransformNode);
                expect(node.getChildren(), "node children").to.have.lengthOf(2);
                for (var _i = 0, _a = node.getChildren(); _i < _a.length; _i++) {
                    var childNode = _a[_i];
                    expect(childNode, "child node").to.be.an.instanceof(BABYLON.Mesh);
                    var childMesh = childNode;
                    expect(childMesh.geometry).to.exist;
                    expect(childMesh.material).to.exist;
                }
            });
        });
        it('Load BrainStem', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/BrainStem/", "BrainStem.gltf", scene).then(function (result) {
                expect(result.skeletons, "skeletons").to.have.lengthOf(1);
                var node1 = scene.getNodeByName("node1");
                expect(node1, "node1").to.exist;
                expect(node1, "node1").to.be.an.instanceof(BABYLON.TransformNode);
                for (var _i = 0, _a = node1.getChildMeshes(); _i < _a.length; _i++) {
                    var childMesh = _a[_i];
                    expect(childMesh.skeleton, "mesh skeleton").to.exist;
                    expect(childMesh.skeleton.name, "mesh skeleton name").to.equal(result.skeletons[0].name);
                }
            });
        });
        it('Load BoomBox with transparencyAsCoverage', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                var specularOverAlpha = false;
                var radianceOverAlpha = false;
                loader.transparencyAsCoverage = true;
                loader.onMaterialLoaded = function (material) {
                    specularOverAlpha = specularOverAlpha || material.useSpecularOverAlpha;
                    radianceOverAlpha = radianceOverAlpha || material.useRadianceOverAlpha;
                };
                promises.push(loader.whenCompleteAsync().then(function () {
                    expect(specularOverAlpha, "specularOverAlpha").to.be.false;
                    expect(radianceOverAlpha, "radianceOverAlpha").to.be.false;
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene));
            return Promise.all(promises);
        });
        it('Load BoomBox without transparencyAsCoverage', function () {
            var scene = new BABYLON.Scene(subject);
            var promises = new Array();
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce(function (loader) {
                var specularOverAlpha = true;
                var radianceOverAlpha = true;
                loader.transparencyAsCoverage = false;
                loader.onMaterialLoaded = function (material) {
                    specularOverAlpha = specularOverAlpha && material.useSpecularOverAlpha;
                    radianceOverAlpha = radianceOverAlpha && material.useRadianceOverAlpha;
                };
                promises.push(loader.whenCompleteAsync().then(function () {
                    expect(specularOverAlpha, "specularOverAlpha").to.be.true;
                    expect(radianceOverAlpha, "radianceOverAlpha").to.be.true;
                }));
            });
            promises.push(BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene));
            return Promise.all(promises);
        });
        it('Load BoomBox twice and check texture instancing', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function () {
                var createTextureSpy = sinon.spy(subject, "createTexture");
                return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function () {
                    var called = createTextureSpy.called;
                    createTextureSpy.restore();
                    expect(called, "createTextureSpyCalled").to.be.false;
                });
            });
        });
        it('Load UFO with MSFT_audio_emitter', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync(null, "/Playground/scenes/", "ufo.glb", scene).then(function (result) {
                expect(result.meshes.length, "meshes.length").to.equal(scene.meshes.length);
                expect(result.particleSystems.length, "particleSystems.length").to.equal(0);
                expect(result.animationGroups.length, "animationGroups.length").to.equal(3);
                expect(scene.soundTracks.length, "scene.soundTracks.length").to.equal(0);
                expect(scene.mainSoundTrack.soundCollection.length, "scene.mainSoundTrack.soundCollection.length").to.equal(3);
                expect(scene.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers(), "scene.mainSoundTrack.soundCollection[0].onEndedObservable.hasObservers()").to.be.true;
            });
        });
        it('Load Box with extras', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.AppendAsync("/Playground/scenes/Box/", "Box_extras.gltf", scene).then(function (scene) {
                expect(scene.meshes.length, "scene.meshes.length").to.equal(2);
                expect(scene.materials.length, "scene.materials.length").to.equal(1);
                var mesh = scene.getMeshByName("Box001");
                expect(mesh, "Box001").to.exist;
                expect(mesh.metadata, "Box001 metadata").to.exist;
                expect(mesh.metadata.gltf, "Box001 metadata.gltf").to.exist;
                expect(mesh.metadata.gltf.extras, "Box001 metadata.gltf.extras").to.exist;
                expect(mesh.metadata.gltf.extras.kind, "Box001 extras.kind").to.equal("nice cube");
                expect(mesh.metadata.gltf.extras.magic, "Box001 extras.magic").to.equal(42);
                var camera = scene.getCameraByName("Camera");
                expect(camera, "Camera").to.exist;
                expect(camera.metadata, "Camera metadata").to.exist;
                expect(mesh.metadata.gltf, "Camera metadata.gltf").to.exist;
                expect(mesh.metadata.gltf.extras, "Camera metadata.gltf.extras").to.exist;
                expect(camera.metadata.gltf.extras.custom, "Camera extras.custom").to.equal("cameraProp");
                var material = scene.getMaterialByName("01___Default");
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
    describe('#OBJ', function () {
        it('should load a tetrahedron (without colors)', function () {
            var fileContents = "\n                g tetrahedron\n\n                v 1.00 1.00 1.00 0.666 0 0\n                v 2.00 1.00 1.00 0.666 0 0\n                v 1.00 2.00 1.00 0.666 0 0\n                v 1.00 1.00 2.00 0.666 0 0\n\n                f 1 3 2\n                f 1 4 3\n                f 1 2 4\n                f 2 3 4\n            ";
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.LoadAssetContainerAsync('', 'data:' + fileContents, scene, function () { }, ".obj").then(function (container) {
                expect(container.meshes.length).to.eq(1);
                var tetrahedron = container.meshes[0];
                var positions = tetrahedron.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                var colors = tetrahedron.getVerticesData(BABYLON.VertexBuffer.ColorKind);
                expect(positions).to.deep.equal([1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2]);
                assert.isNull(colors, 'expecting colors vertex buffer to be null');
            });
        });
        it('should parse leniently allowing extra spaces with vertex definitions', function () {
            var fileContents = "\n                g tetrahedron\n\n                v  1.00 1.00 1.00 0.666 0 0\n                v  2.00 1.00 1.00 0.666 0 0\n                v  1.00 2.00 1.00 0.666 0 0\n                v  1.00 1.00 2.00 0.666 0 0\n                # ^\n                # \u2514\u2500\u2500 allow extra spaces before position/color\n\n                f 1 3 2\n                f 1 4 3\n                f 1 2 4\n                f 2 3 4\n            ";
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.LoadAssetContainerAsync('', 'data:' + fileContents, scene, function () { }, ".obj").then(function (container) {
                expect(container.meshes.length).to.eq(1);
                var tetrahedron = container.meshes[0];
                var positions = tetrahedron.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                expect(positions).to.deep.equal([1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2]);
            });
        });
    });
    describe('#AssetContainer', function () {
        it('should be loaded from BoomBox GLTF', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.LoadAssetContainerAsync("/Playground/scenes/BoomBox/", "BoomBox.gltf", scene).then(function (container) {
                expect(container.meshes.length).to.eq(2);
            });
        });
        it('should be adding and removing objects from scene', function () {
            // Create a scene with some assets
            var scene = new BABYLON.Scene(subject);
            var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            var sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);
            var ground = BABYLON.MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);
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
    describe('#ArgumentPermutations', function () {
        it('Typical', function () {
            return BABYLON.SceneLoader.LoadAsync("/Playground/scenes/Box/", "Box.gltf");
        });
        it('Single url', function () {
            return BABYLON.SceneLoader.LoadAsync("/Playground/scenes/Box/Box.gltf");
        });
        it('Direct load', function () {
            return BABYLON.Tools.LoadFileAsync("/Playground/scenes/Box/Box.gltf", false).then(function (gltf) {
                return BABYLON.SceneLoader.LoadAsync("/Playground/scenes/Box/", "data:".concat(gltf));
            });
        });
        it('Files input', function () {
            return Promise.all([
                BABYLON.Tools.LoadFileAsync("/Playground/scenes/Box/Box.gltf", true),
                BABYLON.Tools.LoadFileAsync("/Playground/scenes/Box/Box.bin", true)
            ]).then(function (_a) {
                var gltf = _a[0], bin = _a[1];
                BABYLON.FilesInput.FilesToLoad["box.gltf"] = new File([gltf], "Box.gltf");
                BABYLON.FilesInput.FilesToLoad["box.bin"] = new File([bin], "Box.bin");
                return BABYLON.SceneLoader.LoadAsync("file:", "Box.gltf");
            });
        });
        it('File object', function () {
            return BABYLON.Tools.LoadFileAsync("/Playground/scenes/BoomBox.glb").then(function (glb) {
                return BABYLON.SceneLoader.LoadAsync("", new File([glb], "BoomBox.glb"));
            });
        });
        it('File url (Babylon Native)', function () {
            var urlRedirects = {
                "file:///Box.gltf": "/Playground/scenes/Box/Box.gltf",
                "file:///Box.bin": "/Playground/scenes/Box/Box.bin"
            };
            var oldPreprocessUrl = BABYLON.FileTools.PreprocessUrl;
            BABYLON.FileTools.PreprocessUrl = function (url) { return urlRedirects[url] || url; };
            var resetPreprocessUrl = function () { return BABYLON.FileTools.PreprocessUrl = oldPreprocessUrl; };
            return BABYLON.SceneLoader.LoadAsync("file:///", "Box.gltf").then(resetPreprocessUrl, resetPreprocessUrl);
        });
    });
    describe('#DirectLoad', function () {
        it('should load a raw obj with no mime type', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:".concat(objRaw), scene, undefined, ".obj").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(4);
            });
        });
        it('should load a base64 encoded obj with no mime type', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:;base64,".concat(objBase64), scene, undefined, ".obj").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(4);
            });
        });
        it('should load a base64 encoded obj with a valid mime type', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:model/obj;base64,".concat(objBase64), scene, undefined, ".obj").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(4);
            });
        });
        it('should load a base64 encoded obj with an invalid mime type', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:foo/bar;base64,".concat(objBase64), scene, undefined, ".obj").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(4);
            });
        });
        it('should load a base64 encoded obj with an invalid mime type', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:foo/bar;base64,".concat(objBase64), scene, undefined, ".obj").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(4);
            });
        });
        it('should direct load a glTF file without specifying a pluginExtension', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:".concat(gltfRaw), scene).then(function (result) {
                expect(result.meshes.length).to.eq(2);
                expect(result.meshes[1].getTotalVertices()).to.eq(3);
            });
        });
        it('should direct load a base64 encoded glTF file', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:;base64,".concat(gltfBase64), scene, undefined, ".gltf").then(function (result) {
                expect(result.meshes.length).to.eq(2);
                expect(result.meshes[1].getTotalVertices()).to.eq(3);
            });
        });
        it('should direct load a base64 encoded glb with a valid mime type and no pluginExtension', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:model/gltf-binary;base64,".concat(glbBase64), scene, undefined).then(function (result) {
                expect(result.meshes.length).to.eq(2);
                expect(result.meshes[1].getTotalVertices()).to.eq(24);
            });
        });
        it('should direct load a base64 encoded glb with an invalid mime type and pluginExtension specified', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:image/jpg;base64,".concat(glbBase64), scene, undefined, ".glb").then(function (result) {
                expect(result.meshes.length).to.eq(2);
                expect(result.meshes[1].getTotalVertices()).to.eq(24);
            });
        });
        it('should direct load an incorrectly formatted base64 encoded glb (backcompat)', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:base64,".concat(glbBase64), scene).then(function (result) {
                expect(result.meshes.length).to.eq(2);
                expect(result.meshes[1].getTotalVertices()).to.eq(24);
            });
        });
        it('should direct load an ascii stl file', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:".concat(stlAsciiRaw), scene, undefined, ".stl").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(3);
            });
        });
        it('should direct load a base64 encoded ascii stl file', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:;base64,".concat(stlAsciiBase64), scene, undefined, ".stl").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(3);
            });
        });
        it('should direct load a base64 encoded binary stl file', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.SceneLoader.ImportMeshAsync("", "", "data:;base64,".concat(stlBinaryBase64), scene, undefined, ".stl").then(function (result) {
                expect(result.meshes.length).to.eq(1);
                expect(result.meshes[0].getTotalVertices()).to.eq(3);
            });
        });
    });
});
