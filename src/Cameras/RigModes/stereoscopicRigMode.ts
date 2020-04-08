import { Camera } from "../camera";
import { Viewport } from '../../Maths/math.viewport';

Camera._setStereoscopicRigMode = function(camera: Camera) {
    var isStereoscopicHoriz = camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL || camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
    var isCrossEye = camera.cameraRigMode === Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED;
    camera._rigCameras[isCrossEye ? 1 : 0].viewport = new Viewport(0, 0, isStereoscopicHoriz ? 0.5 : 1.0, isStereoscopicHoriz ? 1.0 : 0.5);
    camera._rigCameras[isCrossEye ? 0 : 1].viewport = new Viewport(isStereoscopicHoriz ? 0.5 : 0, isStereoscopicHoriz ? 0 : 0.5, isStereoscopicHoriz ? 0.5 : 1.0, isStereoscopicHoriz ? 1.0 : 0.5);
};