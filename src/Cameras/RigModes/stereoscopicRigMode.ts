import { Camera } from "../camera";
import { PassPostProcess } from "../../PostProcesses/passPostProcess";
import { StereoscopicInterlacePostProcessI } from "../../PostProcesses/stereoscopicInterlacePostProcess";

Camera._setStereoscopicRigMode = function(camera: Camera) {
    var isStereoscopicHoriz = camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
    var isStereoscopicInterlaced = camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_INTERLACED;
    camera._rigCameras[0]._rigPostProcess = new PassPostProcess(camera.name + "_passthru", 1.0, camera._rigCameras[0]);
    camera._rigCameras[1]._rigPostProcess = new StereoscopicInterlacePostProcessI(camera.name + "_stereoInterlace", camera._rigCameras, isStereoscopicHoriz, isStereoscopicInterlaced);
};