import { Camera } from "../camera";
import { PassPostProcess } from "../../PostProcesses/passPostProcess";
import { StereoscopicInterlacePostProcess } from "../../PostProcesses/stereoscopicInterlacePostProcess";

Camera._setStereoscopicRigMode = function(camera: Camera) {
    var isStereoscopicHoriz = camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;

    camera._rigCameras[0]._rigPostProcess = new PassPostProcess(camera.name + "_passthru", 1.0, camera._rigCameras[0]);
    camera._rigCameras[1]._rigPostProcess = new StereoscopicInterlacePostProcess(camera.name + "_stereoInterlace", camera._rigCameras, isStereoscopicHoriz);
};