import type { DefaultRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline";
import { Scalar } from "core/Maths/math.scalar";
import type { SceneManager } from "../../managers/sceneManager";

/**
 * A custom upgrade-oriented function configuration for the scene optimizer.
 * @param sceneManager
 * @returns true if the scene is fully upgraded
 */
export function extendedUpgrade(sceneManager: SceneManager): boolean {
    const defaultPipeline = <DefaultRenderingPipeline>sceneManager.defaultRenderingPipeline;
    // if (!this.Scene.BackgroundHelper) {
    // 	this.Scene.EngineScene.autoClear = false;
    // this.Scene.BackgroundHelper = true;
    // Would require a dedicated clear color;
    // return false;
    // }
    if (sceneManager.scene.getEngine().getHardwareScalingLevel() > 1) {
        const scaling = Scalar.Clamp(sceneManager.scene.getEngine().getHardwareScalingLevel() - 0.25, 0, 1);
        sceneManager.scene.getEngine().setHardwareScalingLevel(scaling);
        return false;
    }
    if (!sceneManager.scene.postProcessesEnabled) {
        sceneManager.scene.postProcessesEnabled = true;
        return false;
    }
    if (!sceneManager.groundEnabled) {
        sceneManager.groundEnabled = true;
        return false;
    }
    if (defaultPipeline && !sceneManager.fxaaEnabled) {
        sceneManager.fxaaEnabled = true;
        return false;
    }
    const hardwareScalingLevel = Math.max(1 / 2, 1 / (window.devicePixelRatio || 2));
    if (sceneManager.scene.getEngine().getHardwareScalingLevel() > hardwareScalingLevel) {
        const scaling = Scalar.Clamp(sceneManager.scene.getEngine().getHardwareScalingLevel() - 0.25, 0, hardwareScalingLevel);
        sceneManager.scene.getEngine().setHardwareScalingLevel(scaling);
        return false;
    }
    if (!sceneManager.processShadows) {
        sceneManager.processShadows = true;
        return false;
    }
    if (defaultPipeline && !sceneManager.bloomEnabled) {
        sceneManager.bloomEnabled = true;
        return false;
    }
    if (!sceneManager.groundMirrorEnabled) {
        sceneManager.groundMirrorEnabled = true;
        return false;
    }
    return true;
}

/**
 * A custom degrade-oriented function configuration for the scene optimizer.
 * @param sceneManager
 * @returns true if the scene is fully degraded
 */
export function extendedDegrade(sceneManager: SceneManager): boolean {
    const defaultPipeline = <DefaultRenderingPipeline>sceneManager.defaultRenderingPipeline;

    if (sceneManager.groundMirrorEnabled) {
        sceneManager.groundMirrorEnabled = false;
        return false;
    }
    if (defaultPipeline && sceneManager.bloomEnabled) {
        sceneManager.bloomEnabled = false;
        return false;
    }
    if (sceneManager.processShadows) {
        sceneManager.processShadows = false;
        return false;
    }
    if (sceneManager.scene.getEngine().getHardwareScalingLevel() < 1) {
        const scaling = Scalar.Clamp(sceneManager.scene.getEngine().getHardwareScalingLevel() + 0.25, 0, 1);
        sceneManager.scene.getEngine().setHardwareScalingLevel(scaling);
        return false;
    }
    if (defaultPipeline && sceneManager.fxaaEnabled) {
        sceneManager.fxaaEnabled = false;
        return false;
    }
    if (sceneManager.groundEnabled) {
        sceneManager.groundEnabled = false;
        return false;
    }
    if (sceneManager.scene.postProcessesEnabled) {
        sceneManager.scene.postProcessesEnabled = false;
        return false;
    }
    if (sceneManager.scene.getEngine().getHardwareScalingLevel() < 1.25) {
        const scaling = Scalar.Clamp(sceneManager.scene.getEngine().getHardwareScalingLevel() + 0.25, 0, 1.25);
        sceneManager.scene.getEngine().setHardwareScalingLevel(scaling);
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
