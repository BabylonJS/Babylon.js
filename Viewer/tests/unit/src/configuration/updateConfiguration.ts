import { Helper } from "../../../commons/helper";
import { assert, expect, should } from "../viewerReference";
import { SceneOptimizer, SceneOptimizerOptions } from "babylonjs";

export let name = "configuration update";

describe(name + " scene", () => {

    it("should be used as a template for the following tests", (done) => {
        let viewer = Helper.getNewViewerInstance(undefined, { extends: "none" });

        viewer.onInitDoneObservable.add(() => {

            viewer.dispose();
            done();
        });
    });

    it("should update the image processing configuration values", (done) => {
        let viewer = Helper.getNewViewerInstance(undefined, { extends: "none" });

        viewer.onInitDoneObservable.add(() => {

            // check babylon defaults
            assert.isFalse(viewer.sceneManager.scene.imageProcessingConfiguration.applyByPostProcess);
            assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.exposure, 1);
            assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.contrast, 1);
            assert.isFalse(viewer.sceneManager.scene.imageProcessingConfiguration.colorGradingEnabled);
            if (viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves) {
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.globalDensity, 0);
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.globalHue, 30);
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.globalSaturation, 0);
            } else {
                assert.fail(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves, {}, "color curves was not initialized");
            }

            // update with fixed values

            viewer.updateConfiguration({
                scene: {
                    imageProcessingConfiguration: {
                        applyByPostProcess: true,
                        exposure: 0,
                        contrast: 0,
                        colorGradingEnabled: true,
                        colorCurves: {
                            globalDensity: 1,
                            globalHue: 0.2,
                            globalSaturation: 0.5
                        }

                    }
                }
            });

            assert.isTrue(viewer.sceneManager.scene.imageProcessingConfiguration.applyByPostProcess, "apply by post process should be true");
            assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.exposure, 0);
            assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.contrast, 0);
            assert.isTrue(viewer.sceneManager.scene.imageProcessingConfiguration.colorGradingEnabled);
            if (viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves) {
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.globalDensity, 1);
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.globalHue, 0.2);
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.globalSaturation, 0.5);
            } else {
                assert.fail(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves, {}, "color curves was not initialized");
            }

            let randoms = [0, 1, 2, 3, 4].map((n) => Math.random());

            viewer.updateConfiguration({
                scene: {
                    imageProcessingConfiguration: {
                        exposure: randoms[0],
                        contrast: randoms[1],
                        colorCurves: {
                            highlightsDensity: randoms[2],
                            highlightsHue: randoms[3],
                            highlightsSaturation: randoms[4]
                        }

                    }
                }
            });

            assert.isTrue(viewer.sceneManager.scene.imageProcessingConfiguration.applyByPostProcess, "apply by post process should be true");
            assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.exposure, randoms[0]);
            assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.contrast, randoms[1]);
            assert.isTrue(viewer.sceneManager.scene.imageProcessingConfiguration.colorGradingEnabled);
            if (viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves) {
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.highlightsDensity, randoms[2]);
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.highlightsHue, randoms[3]);
                assert.equal(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves.highlightsSaturation, randoms[4]);
            } else {
                assert.fail(viewer.sceneManager.scene.imageProcessingConfiguration.colorCurves, {}, "color curves was not initialized");
            }

            viewer.dispose();
            done();
        });
    });

    it("should update main color and reflection color", (done) => {
        let viewer = Helper.getNewViewerInstance(undefined, { extends: "none" });

        viewer.onInitDoneObservable.add(() => {

            assert.equal(viewer.sceneManager.mainColor.r, 1);
            assert.equal(viewer.sceneManager.mainColor.g, 1);
            assert.equal(viewer.sceneManager.mainColor.b, 1);

            assert.equal(viewer.sceneManager.reflectionColor.r, 1);
            assert.equal(viewer.sceneManager.reflectionColor.g, 1);
            assert.equal(viewer.sceneManager.reflectionColor.b, 1);

            viewer.updateConfiguration({
                environmentMap: {
                    tintLevel: 1,
                    texture: "",
                    rotationY: 0,
                    mainColor: {
                        r: 0.5,
                        g: 0.5,
                        b: 0.5
                    }
                }
            });

            assert.equal(viewer.sceneManager.mainColor.r, 0.5);
            assert.equal(viewer.sceneManager.mainColor.g, 0.5);
            assert.equal(viewer.sceneManager.mainColor.b, 0.5);

            // to black
            viewer.updateConfiguration({
                scene: {
                    mainColor: {
                        r: 0,
                        g: 0,
                        b: 0
                    }
                }
            });

            assert.equal(viewer.sceneManager.mainColor.r, 0);
            assert.equal(viewer.sceneManager.mainColor.g, 0);
            assert.equal(viewer.sceneManager.mainColor.b, 0);

            assert.equal(viewer.sceneManager.reflectionColor.r, 0);
            assert.equal(viewer.sceneManager.reflectionColor.g, 0);
            assert.equal(viewer.sceneManager.reflectionColor.b, 0);

            let randomColor = Math.random();

            //only update red
            viewer.updateConfiguration({
                scene: {
                    mainColor: {
                        r: randomColor
                    }
                }
            });

            assert.equal(viewer.sceneManager.mainColor.r, randomColor);
            assert.equal(viewer.sceneManager.mainColor.g, 0);
            assert.equal(viewer.sceneManager.mainColor.b, 0);

            viewer.dispose();
            done();
        });
    });

    it("should update the flags correctly", (done) => {
        let viewer = Helper.getNewViewerInstance(undefined, { extends: "none" });

        viewer.onInitDoneObservable.add(() => {

            viewer.updateConfiguration({
                scene: {
                    flags: {
                        audioEnabled: false
                    }
                }
            });

            assert.isFalse(viewer.sceneManager.scene.audioEnabled);

            viewer.updateConfiguration({
                scene: {
                    flags: {
                        audioEnabled: true,
                        lightsEnabled: false
                    }
                }
            });

            assert.isTrue(viewer.sceneManager.scene.audioEnabled);
            assert.isFalse(viewer.sceneManager.scene.lightsEnabled);

            viewer.updateConfiguration({
                scene: {
                    flags: {
                        lightsEnabled: true,
                        shadowsEnabled: false
                    }
                }
            });

            assert.isTrue(viewer.sceneManager.scene.audioEnabled);
            assert.isTrue(viewer.sceneManager.scene.lightsEnabled);
            assert.isFalse(viewer.sceneManager.scene.shadowsEnabled);

            viewer.dispose();
            done();
        });
    });
});

describe(name + " scene optimizer", () => {

    it("should be enabled and disabled with booleans", (done) => {
        let viewer = Helper.getNewViewerInstance(undefined, { extends: "none" });

        let started = false;

        let optimizerFunction = SceneOptimizer;

        //mock!
        SceneOptimizer.prototype.start = function() {
            started = true;
        };

        SceneOptimizer.prototype.stop = function() {
            started = false;
        };

        SceneOptimizer.prototype.dispose = function() {
        };

        viewer.onInitDoneObservable.add(() => {

            assert.isUndefined(viewer.sceneManager.sceneOptimizer);

            viewer.updateConfiguration({
                optimizer: true
            });

            assert.isDefined(viewer.sceneManager.sceneOptimizer);
            assert.isTrue(started);

            viewer.updateConfiguration({
                optimizer: false
            });

            assert.isUndefined(viewer.sceneManager.sceneOptimizer);
            assert.isFalse(started);

            //SceneOptimizer = optimizerFunction;

            viewer.dispose();
            done();
        });
    });
});

describe(name + " camera", () => {

    it("should enable and disable camera behaviors", (done) => {
        let viewer = Helper.getNewViewerInstance(undefined, { extends: "none" });

        viewer.onInitDoneObservable.add(() => {
            assert.isFalse(viewer.sceneManager.camera.useAutoRotationBehavior);
            viewer.updateConfiguration({
                camera: {
                    behaviors: {
                        autoRotate: {
                            type: 0
                        }
                    }
                }
            });
            assert.isTrue(viewer.sceneManager.camera.useAutoRotationBehavior);
            viewer.updateConfiguration({
                camera: {
                    behaviors: {
                        autoRotate: false
                    }
                }
            });
            assert.isFalse(viewer.sceneManager.camera.useAutoRotationBehavior);
            viewer.dispose();
            done();
        });
    });
});
