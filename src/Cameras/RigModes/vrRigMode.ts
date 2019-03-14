import { Camera } from "../camera";
import { Matrix, Viewport } from "../../Maths/math";
import { VRDistortionCorrectionPostProcess, VRMultiviewToSingleview } from "../../PostProcesses/vrDistortionCorrectionPostProcess";
import { VRCameraMetrics } from "../VR/vrCameraMetrics";
import { Logger } from '../../Misc/logger';

Camera._setVRRigMode = function(camera: Camera, rigParams: any) {
    var metrics = <VRCameraMetrics>rigParams.vrCameraMetrics || VRCameraMetrics.GetDefault();

    camera._rigCameras[0]._cameraRigParams.vrMetrics = metrics;
    camera._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
    camera._rigCameras[0]._cameraRigParams.vrWorkMatrix = new Matrix();
    camera._rigCameras[0]._cameraRigParams.vrHMatrix = metrics.leftHMatrix;
    camera._rigCameras[0]._cameraRigParams.vrPreViewMatrix = metrics.leftPreViewMatrix;
    camera._rigCameras[0].getProjectionMatrix = camera._rigCameras[0]._getVRProjectionMatrix;

    camera._rigCameras[1]._cameraRigParams.vrMetrics = metrics;
    camera._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
    camera._rigCameras[1]._cameraRigParams.vrWorkMatrix = new Matrix();
    camera._rigCameras[1]._cameraRigParams.vrHMatrix = metrics.rightHMatrix;
    camera._rigCameras[1]._cameraRigParams.vrPreViewMatrix = metrics.rightPreViewMatrix;
    camera._rigCameras[1].getProjectionMatrix = camera._rigCameras[1]._getVRProjectionMatrix;

    // For multiview on a webVR camera
    // First multiview will be rendered to camera._multiviewTexture
    // Then this postprocess will run on each eye to copy the right texture to each eye
    if (metrics.multiviewEnabled) {
        if (!camera.getScene().getEngine().getCaps().multiview) {
            Logger.Warn("Multiview is not supported, falling back to standard rendering");
            metrics.multiviewEnabled = false;
        }else {
            camera._useMultiviewToSingleView = true;
            camera._rigPostProcess = new VRMultiviewToSingleview("VRMultiviewToSingleview", camera, metrics.postProcessScaleFactor);
        }
    }

    if (metrics.compensateDistortion) {
        camera._rigCameras[0]._rigPostProcess = new VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Left", camera._rigCameras[0], false, metrics);
        camera._rigCameras[1]._rigPostProcess = new VRDistortionCorrectionPostProcess("VR_Distort_Compensation_Right", camera._rigCameras[1], true, metrics);
    }
};