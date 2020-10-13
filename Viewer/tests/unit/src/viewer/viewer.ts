import { Helper } from "../../../commons/helper";
import { assert, expect, should } from "../viewerReference";
import { DefaultViewer, AbstractViewer, Version, viewerManager } from "../../../../src";
import { Engine } from "babylonjs";

export let name = "viewer Tests";

/**
 * To prevent test-state-leakage ensure that there is a viewer.dispose() for every new DefaultViewer
 */

describe('Viewer', function() {
    it('should initialize a new viewer and its internal variables', (done) => {
        let viewer = Helper.getNewViewerInstance();
        assert.isDefined(viewer.baseId, "base id should be defined");
        assert.isDefined(viewer.modelLoader, "model loader should be defined");
        viewer.onInitDoneObservable.add(() => {
            assert.isDefined(viewer, "Viewer can not be instantiated.");
            assert.isDefined(viewer.sceneManager, "scene manager should be defined");
            viewer.dispose();
            done();
        });
    });

    it('should be added to the viewer manager', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.onInitDoneObservable.add(() => {
            assert.isDefined(viewerManager.getViewerById(viewer.baseId), "Viewer was not added to the viewer manager.");
            viewer.dispose();
            done();
        });
    });

    it('should have a defined canvas', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.onInitDoneObservable.add(() => {
            assert.isDefined(viewer.canvas, "Canvas is not defined");
            assert.isTrue(viewer.canvas instanceof HTMLCanvasElement, "Canvas is not a canvas");
            viewer.dispose();
            done();
        });
    });

    it('should not initialize if element is undefined', (done) => {
        try {
            // force typescript to "think" that the element exist with "!"
            let viewer = Helper.getNewViewerInstance(document.getElementById('doesntexist')!);
            expect(viewer).not.to.exist;
            if (viewer) { viewer.dispose(); }
        } catch (e) {
            // exception was thrown, we are happy
            assert.isTrue(true);
        }
        done();
    });

    it('should be shown and hidden', (done) => {
        let viewer: DefaultViewer = <DefaultViewer>Helper.getNewViewerInstance();
        viewer.onInitDoneObservable.add(() => {
            // default visibility is not none
            const htmlElement = viewer.containerElement as HTMLElement;
            expect(htmlElement.style.display).not.to.equal('none');
            viewer.hide().then(() => {
                // element is hidden
                assert.equal(htmlElement.style.display, 'none', "Viewer is still visible");
                viewer.show().then(() => {
                    //element is shown
                    assert.notEqual(htmlElement.style.display, 'none', "Viewer is not visible");
                    viewer.dispose();
                    done();
                });
            });
        });
    });

    it('should execute registered functions on every rendered frame', (done) => {
        let viewer: DefaultViewer = <DefaultViewer>Helper.getNewViewerInstance();
        let renderCount = 0;
        let sceneRenderCount = 0;
        viewer.onSceneInitObservable.add((scene) => {
            viewer.sceneManager.scene.registerBeforeRender(() => {
                sceneRenderCount++;
            });
            viewer.onFrameRenderedObservable.add(() => {
                renderCount++;
                assert.equal(renderCount, sceneRenderCount, "function was not executed with each frame");
                if (renderCount === 20) {
                    viewer.dispose();
                    done();
                }
            });
        });
    });

    it('should disable and enable rendering', (done) => {

        let viewer: DefaultViewer = <DefaultViewer>Helper.getNewViewerInstance();
        let renderCount = 0;

        viewer.onInitDoneObservable.add(() => {
            viewer.onFrameRenderedObservable.add(() => {
                renderCount++;
            });
            assert.equal(renderCount, 0);
            window.requestAnimationFrame(function() {
                assert.equal(renderCount, 1, "render loop should have been executed");
                viewer.runRenderLoop = false;
                window.requestAnimationFrame(function() {
                    assert.equal(renderCount, 1, "Render loop should not have been executed");
                    viewer.runRenderLoop = true;
                    window.requestAnimationFrame(function() {
                        assert.equal(renderCount, 2, "render loop should have been executed again");
                        viewer.dispose();
                        done();
                    });
                });
            });
        });
    });

    it('should have a version', (done) => {
        assert.exists(Version, "Viewer should have a version");
        assert.equal(Version, Engine.Version, "Viewer version should equal to Babylon's engine version");
        done();
    });

    it('should resize the viewer correctly', (done) => {

        let viewer: DefaultViewer = <DefaultViewer>Helper.getNewViewerInstance();
        let resizeCount = 0;
        //wait for the engine to init
        viewer.onEngineInitObservable.add((engine) => {
            // mock the resize function
            engine.resize = () => {
                resizeCount++;
            };
        });

        viewer.onInitDoneObservable.add(() => {
            assert.equal(resizeCount, 0);
            viewer.forceResize();
            assert.equal(resizeCount, 1, "Engine should resize when Viewer.forceResize() is called.");

            viewer.updateConfiguration({
                engine: {
                    disableResize: true
                }
            });

            viewer.forceResize();

            assert.equal(resizeCount, 1, "Engine should not resize when disableResize is enabled");

            viewer.updateConfiguration({
                engine: {
                    disableResize: false
                }
            });

            viewer.canvas.style.width = '0px';
            viewer.canvas.style.height = '0px';
            viewer.forceResize();

            assert.equal(resizeCount, 1, "Engine should not resize when the canvas has width/height 0.");

            viewer.dispose();
            // any since it is protected
            viewer.forceResize();

            assert.equal(resizeCount, 1, "Engine should not resize when if Viewer has been disposed.");
            done();
        });
    });

    it('should render in background if set to true', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.onInitDoneObservable.add(() => {
            assert.isTrue(viewer.engine.renderEvenInBackground, "Engine is rendering in background");
            assert.equal(viewer.engine.renderEvenInBackground, viewer.renderInBackground, "engine render in background should be equal to the viewer's");
            viewer.updateConfiguration({
                scene: {
                    renderInBackground: false
                }
            });
            assert.isFalse(viewer.engine.renderEvenInBackground, "Engine is not rendering in background");
            assert.equal(viewer.engine.renderEvenInBackground, viewer.renderInBackground, "engine render in background should be equal to the viewer's");
            viewer.dispose();
            done();
        });
    });

    it('should attach and detach camera control correctly', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.onInitDoneObservable.add(() => {
            assert.isTrue(viewer.sceneManager.camera.inputs.attachedToElement, "Camera is not attached per default");
            viewer.updateConfiguration({
                scene: {
                    disableCameraControl: true
                }
            });
            assert.isFalse(viewer.sceneManager.camera.inputs.attachedToElement, "Camera is still attached");
            viewer.updateConfiguration({
                scene: {
                    disableCameraControl: false
                }
            });
            assert.isTrue(viewer.sceneManager.camera.inputs.attachedToElement, "Camera not attached");
            viewer.dispose();
            done();
        });
    });

    it('should take screenshot when called', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.onInitDoneObservable.add(() => {
            Helper.MockScreenCapture(viewer, Helper.mockScreenCaptureData());

            viewer.takeScreenshot(function(data) {
                assert.equal(data, Helper.mockScreenCaptureData(), "Screenshot failed.");

                viewer.dispose();
                done();
            });
        });
    });

    it('should notify observers correctly during init', (done) => {
        let viewer = Helper.getNewViewerInstance();

        let shouldBeRendering = false;

        viewer.onFrameRenderedObservable.add(() => {
            assert.isTrue(shouldBeRendering, "rendered before init done");
            viewer.dispose();
            done();
        });

        viewer.onEngineInitObservable.add((engine) => {
            assert.equal(engine, viewer.engine, "engine instance is not the same");
            assert.isUndefined(viewer.sceneManager.scene, "scene exists before initScene");
        });

        viewer.onSceneInitObservable.add((scene) => {
            assert.equal(scene, viewer.sceneManager.scene, "scene instance is not the same");
        });

        viewer.onInitDoneObservable.add((viewerInstance) => {
            assert.isDefined(viewerInstance.sceneManager.scene, "scene is not defined");
            //scene exists, it should now start rendering
            shouldBeRendering = true;
        });
    });

    it('should render if forceRender was called', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.runRenderLoop = false;
        viewer.onInitDoneObservable.add(() => {
            viewer.onFrameRenderedObservable.add(() => {
                assert.isTrue(true, "not rendered");
                viewer.dispose();
                done();
            });
            viewer.forceRender();
        });
    });

    it('should have the correct base ID', (done) => {
        let element = document.createElement("div");
        let randomString = "" + Math.random();
        element.id = randomString;
        let viewer = Helper.getNewViewerInstance(element);
        assert.equal(viewer.baseId, viewer.containerElement.id);
        assert.equal(randomString, viewer.baseId);
        viewer.dispose();
        done();
    });

    it('should update the configuration object when updateConfiguration is called', (done) => {
        let randomVersion = "" + Math.random();
        let viewer = Helper.getNewViewerInstance(undefined, {
            version: randomVersion
        });
        viewer.onInitDoneObservable.add(() => {
            assert.equal(viewer.configuration.version, randomVersion);
            let newRandom = "" + Math.random();
            viewer.updateConfiguration({
                version: newRandom
            });
            assert.equal(viewer.configuration.version, newRandom);
            viewer.dispose();
            done();
        });
    });

    it('should not init engine if viewer is disposed right after created', (done) => {
        let viewer = Helper.getNewViewerInstance();
        viewer.dispose();
        // wait a bit for the engine to initialize, if failed
        let timeout = setTimeout(() => {
            assert.isUndefined(viewer.engine);
            done();
        }, 1000);

        viewer.onEngineInitObservable.add(() => {
            assert.fail();
            clearTimeout(timeout);
            done();
        });
    });
});

//}
/*

QUnit.test('Viewer disable ctrl for panning', function (assert) {
    let viewer = new DefaultViewer(Helper.getCanvas());

    QUnit.assert.ok(viewer.Scene.Camera._useCtrlForPanning, "Viewer should use CTRL for panning by default.");

    viewer.dispose();
    viewer = null;

    viewer = new DefaultViewer(Helper.getCanvas(), {
        disableCtrlForPanning: true
    });

    QUnit.assert.ok(viewer.Scene.Camera._useCtrlForPanning === false, "Viewer should not use CTRL for panning with disableCameraControl set to true.");
    viewer.dispose();
});

QUnit.test('Viewer get models', function (assert) {
    let viewer = new DefaultViewer(Helper.getCanvas());

    let mesh1 = Helper.createMockMesh(viewer);
    let mesh2 = Helper.createMockMesh(viewer);
    let model1 = new SPECTRE.Model(viewer, "Model 1");
    let model2 = new SPECTRE.Model(viewer, "Model 2");
    model1.setMesh(mesh1);
    model2.setMesh(mesh2);

    viewer.Scene.addModel(model1, false);
    viewer.Scene.addModel(model2, false);

    QUnit.assert.equal(viewer.Scene.Models.length, 2, "Viewer.getModels should return all models in the scene by default.");

    // Further tests fail unless this viewer is disposed
    // TODO fully isolate tests
    viewer.dispose();
});

QUnit.test('Viewer model add/remove', function (assert) {
    let modelsInScene = 0;

    let viewer = new DefaultViewer(Helper.getCanvas(), {
        onModelAdd: function () {
            modelsInScene += 1;
        },
        onModelRemove: function () {
            modelsInScene -= 1;
        }
    });

    let mesh1 = Helper.createMockMesh(viewer);
    let model = new SPECTRE.Model(viewer, "Model");
    model.setMesh(mesh1);

    viewer.Scene.addModel(model, false);

    QUnit.assert.equal(modelsInScene, 1, "onModelAdd should be called when a model is registered");

    viewer.Scene.removeModel(model, false);

    QUnit.assert.equal(modelsInScene, 0, "onModelRemove should be called when a model is unregistered");

    viewer.dispose();
});

QUnit.test('Viewer typical case with dispose', function (assert) {
    let done = assert.async();

    let viewer = new DefaultViewer(Helper.getCanvas(), {
        environmentAssetsRootURL: 'base/assets/environment/',
        environmentMap: 'legacy/joa-256.env',
        unifiedConfiguration: 'base/assets/UnifiedConfiguration.json'
    });

    //load different models sequentially to simulate typical use
    viewer.loadGLTF('base/assets/Modok/Modok.FBX.gltf', {
        completeCallback: (model) => {
            model.EngineModel.translate(new BABYLON.Vector3(1, 0, 0), 0.1);

            setTimeout(() => {
                viewer.Scene.removeModel(model, true, () => {
                    viewer.loadGLTF('base/assets/Modok/Modok.FBX.gltf', {
                        readyCallback: () => {
                            //starting loading a few assets and ensure there's no failure when disposing
                            viewer.loadEnvironment('legacy/joa-256.env', () => {
                                assert.ok(false, 'Viewer should have been disposed! Load should not complete.');
                            });
                            viewer.loadGLTF('base/assets/Modok/Modok.FBX.gltf', {
                                readyCallback: () => {
                                    assert.ok(false, 'Viewer should have been disposed! Load should not complete.');
                                },
                            });

                            try {
                                console.log('Disposing viewer');
                                viewer.dispose();
                                viewer = null;
                                console.log('Viewer disposed');
                            } catch (e) {
                                assert.ok(false, `Viewer failed to dispose without exception ${e}`);
                            }

                            setTimeout(() => {
                                //wait some time to verify there were no exceptions no complete callbacks fire unexpectedly
                                assert.strictEqual(viewer, null, 'Viewer should be set to null');
                                done();
                            }, 2000);
                        }
                    });
                });
            }, 3000);
        }
    });
});

QUnit.test('Test getEnvironmentAssetUrl relative no root', function (assert) {
    var viewer = Helper.createViewer();
    assert.ok(viewer.getEnvironmentAssetUrl("foo.png") === "foo.png", "Relative url should be return unmodified without configuration.");
});

QUnit.test('Test getEnvironmentAssetUrl absolute no root', function (assert) {
    var viewer = Helper.createViewer();
    assert.ok(viewer.getEnvironmentAssetUrl("http://foo.png") === "http://foo.png", "Absolute url should not be undefined without configuration.");
});

QUnit.test('Test getEnvironmentAssetUrl relative root', function (assert) {
    var viewer = Helper.createViewer({ environmentAssetsRootURL: "https://foo/" });
    assert.ok(viewer.getEnvironmentAssetUrl("foo.png") === "https://foo/foo.png", "Relative url should not be be undefined with configuration.");
});

QUnit.test('Test getEnvironmentAssetUrl absolute root', function (assert) {
    var viewer = Helper.createViewer({ environmentAssetsRootURL: "https://foo/" });
    assert.ok(viewer.getEnvironmentAssetUrl("http://foo.png") === "http://foo.png", "Absolute url should not be undefined with configuration.");
});

*/
