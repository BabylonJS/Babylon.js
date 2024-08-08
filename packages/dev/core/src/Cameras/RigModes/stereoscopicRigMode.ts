import type { Camera } from "../camera";
import { Viewport } from "../../Maths/math.viewport";
import { PassPostProcess } from "../../PostProcesses/passPostProcess";
import { StereoscopicInterlacePostProcessI } from "../../PostProcesses/stereoscopicInterlacePostProcess";
import { RigMode } from "../../Engines/constants";

/**
 * @internal
 */
export function setStereoscopicRigMode(camera: Camera): void {
    const isStereoscopicHoriz = camera.cameraRigMode === RigMode.STEREOSCOPIC_SIDEBYSIDE_PARALLEL || camera.cameraRigMode === RigMode.STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
    const isCrossEye = camera.cameraRigMode === RigMode.STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
    const isInterlaced = camera.cameraRigMode === RigMode.STEREOSCOPIC_INTERLACED;
    // Use post-processors for interlacing
    if (isInterlaced) {
        camera._rigCameras[0]._rigPostProcess = new PassPostProcess(camera.name + "_passthru", 1.0, camera._rigCameras[0]);
        camera._rigCameras[1]._rigPostProcess = new StereoscopicInterlacePostProcessI(camera.name + "_stereoInterlace", camera._rigCameras, false, true);
    }
    // Otherwise, create appropriate viewports
    else {
        camera._rigCameras[isCrossEye ? 1 : 0].viewport = new Viewport(0, 0, isStereoscopicHoriz ? 0.5 : 1.0, isStereoscopicHoriz ? 1.0 : 0.5);
        camera._rigCameras[isCrossEye ? 0 : 1].viewport = new Viewport(
            isStereoscopicHoriz ? 0.5 : 0,
            isStereoscopicHoriz ? 0 : 0.5,
            isStereoscopicHoriz ? 0.5 : 1.0,
            isStereoscopicHoriz ? 1.0 : 0.5
        );
    }
}
