import { Quaternion, Vector3 } from '../../Maths/math.vector';
import { WindowsMotionController } from '../../Gamepads/Controllers/windowsMotionController';
import { OculusTouchController } from '../../Gamepads/Controllers/oculusTouchController';
import { WebXRInput } from './webXRInput';
import { ViveController } from '../../Gamepads/Controllers/viveController';
import { WebVRController } from '../../Gamepads/Controllers/webVRController';

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
            if (!c.inputSource.gamepad) {
                return;
            }

            let controllerModel: WebVRController;

            let rotation: Quaternion;
            const position = new Vector3();

            switch (c.inputSource.gamepad.id) {
                case "htc-vive": {
                    controllerModel = new ViveController(c.inputSource.gamepad);
                    rotation = Quaternion.FromEulerAngles(0, Math.PI, 0);
                    break;
                }
                case "oculus-touch": {
                    controllerModel = new OculusTouchController(c.inputSource.gamepad);
                    rotation = Quaternion.FromEulerAngles(0, Math.PI, 0);
                    position.y = 0.034;
                    position.z = 0.052;
                    break;
                }
                case "oculus-quest": {
                    OculusTouchController._IsQuest = true;
                    controllerModel = new OculusTouchController(c.inputSource.gamepad);
                    rotation = Quaternion.FromEulerAngles(Math.PI / -4, Math.PI, 0);
                    break;
                }
                default: {
                    controllerModel = new WindowsMotionController(c.inputSource.gamepad);
                    rotation = Quaternion.FromEulerAngles(0, Math.PI, 0);
                    break;
                }
            }

            controllerModel.hand = c.inputSource.handedness;
            controllerModel.isXR = true;
            controllerModel.initControllerMesh(c.getScene(), (m) => {
                controllerModel.mesh!.parent = c.grip || input.baseExperience.container;
                controllerModel.mesh!.rotationQuaternion = rotation;
                controllerModel.mesh!.position = position;
                m.isPickable = false;
                m.getChildMeshes(false).forEach((m) => {
                    m.isPickable = false;
                });
            });

            c.gamepadController = controllerModel;
        });
    }
}