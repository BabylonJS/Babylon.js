import { Quaternion } from '../../Maths/math';
import { WindowsMotionController } from '../../Gamepads/Controllers/windowsMotionController';
import { OculusTouchController } from '../../Gamepads/Controllers/oculusTouchController';
import { WebXRInput } from './webXRInput';
import { ViveController } from '../../Gamepads/Controllers/viveController';

/**
 * Loads a controller model and adds it as a child of the WebXRControllers grip when the controller is created
 */
export class WebXRControllerModelLoader {
    /**
     * Creates the WebXRControllerModelLoader
     * @param input xr input that creates the controllers
     */
    constructor(input: WebXRInput) {
        input.onControllerAddedObservable.add((c) => {
            if (c.inputSource.gamepad && c.inputSource.gamepad.id === "htc-vive") {
                let controllerModel = new ViveController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness;
                controllerModel.isXR = true;
                controllerModel.initControllerMesh(c.grip!.getScene(), (m) => {
                    m.isPickable = false;
                    m.getChildMeshes(false).forEach((m) => {
                        m.isPickable = false;
                    });
                    controllerModel.mesh!.parent = c.grip!;
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
                });
            } else if (c.inputSource.gamepad && c.inputSource.gamepad.id === "oculus-touch") {
                let controllerModel = new OculusTouchController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness;
                controllerModel.isXR = true;
                controllerModel.initControllerMesh(c.grip!.getScene(), (m) => {
                    controllerModel.mesh!.parent = c.grip!;
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
                });
            }else if (c.inputSource.gamepad && c.inputSource.gamepad.id === "oculus-quest") {
                OculusTouchController._IsQuest = true;
                let controllerModel = new OculusTouchController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness;
                controllerModel.isXR = true;
                controllerModel.initControllerMesh(c.grip!.getScene(), (m) => {
                    controllerModel.mesh!.parent = c.grip!;
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / -4, Math.PI, 0);
                });
            }else {
                let controllerModel = new WindowsMotionController(c.inputSource.gamepad);
                controllerModel.hand = c.inputSource.handedness;
                controllerModel.isXR = true;
                controllerModel.initControllerMesh(c.grip!.getScene(), (m) => {
                    controllerModel.mesh!.parent = c.grip!;
                    controllerModel.mesh!.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
                });
            }
        });
    }
}