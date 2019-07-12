import { Camera } from "../camera";
import { Matrix } from "../../Maths/math.vector";
import { Viewport } from '../../Maths/math.viewport';

Camera._setWebVRRigMode = function(camera: Camera, rigParams: any) {
    if (rigParams.vrDisplay) {
        var leftEye = rigParams.vrDisplay.getEyeParameters('left');
        var rightEye = rigParams.vrDisplay.getEyeParameters('right');

        //Left eye
        camera._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1.0);
        camera._rigCameras[0].setCameraRigParameter("left", true);
        //leaving this for future reference
        camera._rigCameras[0].setCameraRigParameter("specs", rigParams.specs);
        camera._rigCameras[0].setCameraRigParameter("eyeParameters", leftEye);
        camera._rigCameras[0].setCameraRigParameter("frameData", rigParams.frameData);
        camera._rigCameras[0].setCameraRigParameter("parentCamera", rigParams.parentCamera);
        camera._rigCameras[0]._cameraRigParams.vrWorkMatrix = new Matrix();
        camera._rigCameras[0].getProjectionMatrix = camera._getWebVRProjectionMatrix;
        camera._rigCameras[0].parent = camera;
        camera._rigCameras[0]._getViewMatrix = camera._getWebVRViewMatrix;

        //Right eye
        camera._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
        camera._rigCameras[1].setCameraRigParameter('eyeParameters', rightEye);
        camera._rigCameras[1].setCameraRigParameter("specs", rigParams.specs);
        camera._rigCameras[1].setCameraRigParameter("frameData", rigParams.frameData);
        camera._rigCameras[1].setCameraRigParameter("parentCamera", rigParams.parentCamera);
        camera._rigCameras[1]._cameraRigParams.vrWorkMatrix = new Matrix();
        camera._rigCameras[1].getProjectionMatrix = camera._getWebVRProjectionMatrix;
        camera._rigCameras[1].parent = camera;
        camera._rigCameras[1]._getViewMatrix = camera._getWebVRViewMatrix;
    }
};