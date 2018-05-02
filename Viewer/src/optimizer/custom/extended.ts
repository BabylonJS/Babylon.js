import { AbstractViewer } from '../../viewer/viewer';
import { Scalar, DefaultRenderingPipeline } from 'babylonjs';

/**
 * A custom upgrade-oriented function configuration for the scene optimizer.
 * 
 * @param viewer the viewer to optimize
 */
export function extendedUpgrade(viewer: AbstractViewer): boolean {
    let defaultPipeline = <DefaultRenderingPipeline>viewer.sceneManager.defaultRenderingPipeline;
    // if (!this.Scene.BackgroundHelper) {
    // 	this.Scene.EngineScene.autoClear = false;
    // this.Scene.BackgroundHelper = true;
    // Would require a dedicated clear color;
    // return false;
    // }
    if (viewer.engine.getHardwareScalingLevel() > 1) {
        let scaling = Scalar.Clamp(viewer.engine.getHardwareScalingLevel() - 0.25, 0, 1);
        viewer.engine.setHardwareScalingLevel(scaling);
        return false;
    }
    if (!viewer.sceneManager.scene.postProcessesEnabled) {
        viewer.sceneManager.scene.postProcessesEnabled = true;
        return false;
    }
    if (!viewer.sceneManager.groundEnabled) {
        viewer.sceneManager.groundEnabled = true;
        return false;
    }
    if (defaultPipeline && !viewer.sceneManager.fxaaEnabled) {
        viewer.sceneManager.fxaaEnabled = true
        return false;
    }
    var hardwareScalingLevel = Math.max(1 / 2, 1 / (window.devicePixelRatio || 2));
    if (viewer.engine.getHardwareScalingLevel() > hardwareScalingLevel) {
        let scaling = Scalar.Clamp(viewer.engine.getHardwareScalingLevel() - 0.25, 0, hardwareScalingLevel);
        viewer.engine.setHardwareScalingLevel(scaling);
        return false;
    }
    if (!viewer.sceneManager.processShadows) {
        viewer.sceneManager.processShadows = true;
        return false;
    }
    if (defaultPipeline && !viewer.sceneManager.bloomEnabled) {
        viewer.sceneManager.bloomEnabled = true
        return false;
    }
    if (!viewer.sceneManager.groundMirrorEnabled) {
        viewer.sceneManager.groundMirrorEnabled = true;
        return false;
    }
    return true;
}

/**
 * A custom degrade-oriented function configuration for the scene optimizer.
 * 
 * @param viewer the viewer to optimize
 */
export function extendedDegrade(viewer: AbstractViewer): boolean {
    let defaultPipeline = <DefaultRenderingPipeline>viewer.sceneManager.defaultRenderingPipeline;

    if (viewer.sceneManager.groundMirrorEnabled) {
        viewer.sceneManager.groundMirrorEnabled = false;
        return false;
    }
    if (defaultPipeline && viewer.sceneManager.bloomEnabled) {
        viewer.sceneManager.bloomEnabled = false;
        return false;
    }
    if (viewer.sceneManager.processShadows) {
        viewer.sceneManager.processShadows = false;
        return false;
    }
    if (viewer.engine.getHardwareScalingLevel() < 1) {
        let scaling = Scalar.Clamp(viewer.engine.getHardwareScalingLevel() + 0.25, 0, 1);
        viewer.engine.setHardwareScalingLevel(scaling);
        return false;
    }
    if (defaultPipeline && viewer.sceneManager.fxaaEnabled) {
        viewer.sceneManager.fxaaEnabled = false;
        return false;
    }
    if (viewer.sceneManager.groundEnabled) {
        viewer.sceneManager.groundEnabled = false;
        return false;
    }
    if (viewer.sceneManager.scene.postProcessesEnabled) {
        viewer.sceneManager.scene.postProcessesEnabled = false;
        return false;
    }
    if (viewer.engine.getHardwareScalingLevel() < 1.25) {
        let scaling = Scalar.Clamp(viewer.engine.getHardwareScalingLevel() + 0.25, 0, 1.25);
        viewer.engine.setHardwareScalingLevel(scaling);
        return false;
    }
    // if (this.Scene.BackgroundHelper) {
    // 	this.Scene.EngineScene.autoClear = true;
    // this.Scene.BackgroundHelper = false;
    // Would require a dedicated clear color;
    // return false;
    // }
    return true;
}