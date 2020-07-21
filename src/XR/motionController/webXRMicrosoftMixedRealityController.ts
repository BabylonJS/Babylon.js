import { WebXRAbstractMotionController, IMinimalMotionControllerObject, MotionControllerHandedness, IMotionControllerLayoutMap } from './webXRAbstractMotionController';
import { WebXRMotionControllerManager } from './webXRMotionControllerManager';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Scene } from '../../scene';
import { Mesh } from '../../Meshes/mesh';
import { Quaternion } from '../../Maths/math.vector';
import { SceneLoader } from '../../Loading/sceneLoader';
import { Logger } from '../../Misc/logger';

/**
 * The motion controller class for all microsoft mixed reality controllers
 */
export class WebXRMicrosoftMixedRealityController extends WebXRAbstractMotionController {
    // use this in the future - https://github.com/immersive-web/webxr-input-profiles/tree/master/packages/assets/profiles/microsoft
    protected readonly _mapping = {
        defaultButton: {
            valueNodeName: 'VALUE',
            unpressedNodeName: 'UNPRESSED',
            pressedNodeName: 'PRESSED',
        },
        defaultAxis: {
            valueNodeName: 'VALUE',
            minNodeName: 'MIN',
            maxNodeName: 'MAX',
        },
        buttons: {
            'xr-standard-trigger': {
                rootNodeName: 'SELECT',
                componentProperty: 'button',
                states: ['default', 'touched', 'pressed'],
            },
            'xr-standard-squeeze': {
                rootNodeName: 'GRASP',
                componentProperty: 'state',
                states: ['pressed'],
            },
            'xr-standard-touchpad': {
                rootNodeName: 'TOUCHPAD_PRESS',
                labelAnchorNodeName: 'squeeze-label',
                touchPointNodeName: 'TOUCH', // TODO - use this for visual feedback
            },
            'xr-standard-thumbstick': {
                rootNodeName: 'THUMBSTICK_PRESS',
                componentProperty: 'state',
                states: ['pressed'],
            },
        },
        axes: {
            'xr-standard-touchpad': {
                'x-axis': {
                    rootNodeName: 'TOUCHPAD_TOUCH_X',
                },
                'y-axis': {
                    rootNodeName: 'TOUCHPAD_TOUCH_Y',
                },
            },
            'xr-standard-thumbstick': {
                'x-axis': {
                    rootNodeName: 'THUMBSTICK_X',
                },
                'y-axis': {
                    rootNodeName: 'THUMBSTICK_Y',
                },
            },
        },
    };

    /**
     * The base url used to load the left and right controller models
     */
    public static MODEL_BASE_URL: string = 'https://controllers.babylonjs.com/microsoft/';
    /**
     * The name of the left controller model file
     */
    public static MODEL_LEFT_FILENAME: string = 'left.glb';
    /**
     * The name of the right controller model file
     */
    public static MODEL_RIGHT_FILENAME: string = 'right.glb';

    public profileId = 'microsoft-mixed-reality';

    constructor(scene: Scene, gamepadObject: IMinimalMotionControllerObject, handedness: MotionControllerHandedness) {
        super(scene, MixedRealityProfile['left-right'], gamepadObject, handedness);
    }

    protected _getFilenameAndPath(): { filename: string; path: string } {
        let filename = '';
        if (this.handedness === 'left') {
            filename = WebXRMicrosoftMixedRealityController.MODEL_LEFT_FILENAME;
        } else {
            // Right is the default if no hand is specified
            filename = WebXRMicrosoftMixedRealityController.MODEL_RIGHT_FILENAME;
        }

        const device = 'default';
        let path = WebXRMicrosoftMixedRealityController.MODEL_BASE_URL + device + '/';
        return {
            filename,
            path,
        };
    }

    protected _getModelLoadingConstraints(): boolean {
        const glbLoaded = SceneLoader.IsPluginForExtensionAvailable('.glb');
        if (!glbLoaded) {
            Logger.Warn('glTF / glb loaded was not registered, using generic controller instead');
        }
        return glbLoaded;
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {
        if (!this.rootMesh) {
            return;
        }

        // Button Meshes
        this.getComponentIds().forEach((id, i) => {
            if (this.disableAnimation) {
                return;
            }
            if (id && this.rootMesh) {
                const buttonMap = (<any>this._mapping.buttons)[id];
                const buttonMeshName = buttonMap.rootNodeName;
                if (!buttonMeshName) {
                    Logger.Log('Skipping unknown button at index: ' + i + ' with mapped name: ' + id);
                    return;
                }

                var buttonMesh = this._getChildByName(this.rootMesh, buttonMeshName);
                if (!buttonMesh) {
                    Logger.Warn('Missing button mesh with name: ' + buttonMeshName);
                    return;
                }

                buttonMap.valueMesh = this._getImmediateChildByName(buttonMesh, this._mapping.defaultButton.valueNodeName);
                buttonMap.pressedMesh = this._getImmediateChildByName(buttonMesh, this._mapping.defaultButton.pressedNodeName);
                buttonMap.unpressedMesh = this._getImmediateChildByName(buttonMesh, this._mapping.defaultButton.unpressedNodeName);

                if (buttonMap.valueMesh && buttonMap.pressedMesh && buttonMap.unpressedMesh) {
                    const comp = this.getComponent(id);
                    if (comp) {
                        comp.onButtonStateChangedObservable.add(
                            (component) => {
                                this._lerpTransform(buttonMap, component.value);
                            },
                            undefined,
                            true
                        );
                    }
                } else {
                    // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                    Logger.Warn('Missing button submesh under mesh with name: ' + buttonMeshName);
                }
            }
        });

        // Axis Meshes
        this.getComponentIds().forEach((id, i) => {
            const comp = this.getComponent(id);
            if (!comp.isAxes()) {
                return;
            }

            ['x-axis', 'y-axis'].forEach((axis) => {
                if (!this.rootMesh) {
                    return;
                }
                const axisMap = (<any>this._mapping.axes)[id][axis];

                var axisMesh = this._getChildByName(this.rootMesh, axisMap.rootNodeName);
                if (!axisMesh) {
                    Logger.Warn('Missing axis mesh with name: ' + axisMap.rootNodeName);
                    return;
                }

                axisMap.valueMesh = this._getImmediateChildByName(axisMesh, this._mapping.defaultAxis.valueNodeName);
                axisMap.minMesh = this._getImmediateChildByName(axisMesh, this._mapping.defaultAxis.minNodeName);
                axisMap.maxMesh = this._getImmediateChildByName(axisMesh, this._mapping.defaultAxis.maxNodeName);

                if (axisMap.valueMesh && axisMap.minMesh && axisMap.maxMesh) {
                    if (comp) {
                        comp.onAxisValueChangedObservable.add(
                            (axisValues) => {
                                const value = axis === 'x-axis' ? axisValues.x : axisValues.y;
                                this._lerpTransform(axisMap, value, true);
                            },
                            undefined,
                            true
                        );
                    }
                } else {
                    // If we didn't find the mesh, it simply means this button won't have transforms applied as mapped button value changes.
                    Logger.Warn('Missing axis submesh under mesh with name: ' + axisMap.rootNodeName);
                }
            });
        });
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + ' ' + this.handedness, this.scene);
        this.rootMesh.isPickable = false;
        let rootMesh;
        // Find the root node in the loaded glTF scene, and attach it as a child of 'parentMesh'
        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];

            mesh.isPickable = false;

            if (!mesh.parent) {
                // Handle root node, attach to the new parentMesh
                rootMesh = mesh;
            }
        }

        if (rootMesh) {
            rootMesh.setParent(this.rootMesh);
        }

        if (!this.scene.useRightHandedSystem) {
            this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
        }
    }

    protected _updateModel(): void {
        // no-op. model is updated using observables.
    }
}

// register the profile
WebXRMotionControllerManager.RegisterController('windows-mixed-reality', (xrInput: XRInputSource, scene: Scene) => {
    return new WebXRMicrosoftMixedRealityController(scene, <any>xrInput.gamepad, xrInput.handedness);
});

// https://github.com/immersive-web/webxr-input-profiles/blob/master/packages/registry/profiles/microsoft/microsoft-mixed-reality.json
const MixedRealityProfile: IMotionControllerLayoutMap = {
    left: {
        selectComponentId: 'xr-standard-trigger',
        components: {
            'xr-standard-trigger': {
                type: 'trigger',
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: 'xr_standard_trigger',
                visualResponses: {
                    xr_standard_trigger_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_trigger_pressed_value',
                        minNodeName: 'xr_standard_trigger_pressed_min',
                        maxNodeName: 'xr_standard_trigger_pressed_max',
                    },
                },
            },
            'xr-standard-squeeze': {
                type: 'squeeze',
                gamepadIndices: {
                    button: 1,
                },
                rootNodeName: 'xr_standard_squeeze',
                visualResponses: {
                    xr_standard_squeeze_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_squeeze_pressed_value',
                        minNodeName: 'xr_standard_squeeze_pressed_min',
                        maxNodeName: 'xr_standard_squeeze_pressed_max',
                    },
                },
            },
            'xr-standard-touchpad': {
                type: 'touchpad',
                gamepadIndices: {
                    button: 2,
                    xAxis: 0,
                    yAxis: 1,
                },
                rootNodeName: 'xr_standard_touchpad',
                visualResponses: {
                    xr_standard_touchpad_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_pressed_value',
                        minNodeName: 'xr_standard_touchpad_pressed_min',
                        maxNodeName: 'xr_standard_touchpad_pressed_max',
                    },
                    xr_standard_touchpad_xaxis_pressed: {
                        componentProperty: 'xAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_xaxis_pressed_value',
                        minNodeName: 'xr_standard_touchpad_xaxis_pressed_min',
                        maxNodeName: 'xr_standard_touchpad_xaxis_pressed_max',
                    },
                    xr_standard_touchpad_yaxis_pressed: {
                        componentProperty: 'yAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_yaxis_pressed_value',
                        minNodeName: 'xr_standard_touchpad_yaxis_pressed_min',
                        maxNodeName: 'xr_standard_touchpad_yaxis_pressed_max',
                    },
                    xr_standard_touchpad_xaxis_touched: {
                        componentProperty: 'xAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_xaxis_touched_value',
                        minNodeName: 'xr_standard_touchpad_xaxis_touched_min',
                        maxNodeName: 'xr_standard_touchpad_xaxis_touched_max',
                    },
                    xr_standard_touchpad_yaxis_touched: {
                        componentProperty: 'yAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_yaxis_touched_value',
                        minNodeName: 'xr_standard_touchpad_yaxis_touched_min',
                        maxNodeName: 'xr_standard_touchpad_yaxis_touched_max',
                    },
                    xr_standard_touchpad_axes_touched: {
                        componentProperty: 'state',
                        states: ['touched', 'pressed'],
                        valueNodeProperty: 'visibility',
                        valueNodeName: 'xr_standard_touchpad_axes_touched_value',
                    },
                },
                touchPointNodeName: 'xr_standard_touchpad_axes_touched_value',
            },
            'xr-standard-thumbstick': {
                type: 'thumbstick',
                gamepadIndices: {
                    button: 3,
                    xAxis: 2,
                    yAxis: 3,
                },
                rootNodeName: 'xr_standard_thumbstick',
                visualResponses: {
                    xr_standard_thumbstick_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_thumbstick_pressed_value',
                        minNodeName: 'xr_standard_thumbstick_pressed_min',
                        maxNodeName: 'xr_standard_thumbstick_pressed_max',
                    },
                    xr_standard_thumbstick_xaxis_pressed: {
                        componentProperty: 'xAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_thumbstick_xaxis_pressed_value',
                        minNodeName: 'xr_standard_thumbstick_xaxis_pressed_min',
                        maxNodeName: 'xr_standard_thumbstick_xaxis_pressed_max',
                    },
                    xr_standard_thumbstick_yaxis_pressed: {
                        componentProperty: 'yAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_thumbstick_yaxis_pressed_value',
                        minNodeName: 'xr_standard_thumbstick_yaxis_pressed_min',
                        maxNodeName: 'xr_standard_thumbstick_yaxis_pressed_max',
                    },
                },
            },
        },
        gamepadMapping: 'xr-standard',
        rootNodeName: 'microsoft-mixed-reality-left',
        assetPath: 'left.glb',
    },
    right: {
        selectComponentId: 'xr-standard-trigger',
        components: {
            'xr-standard-trigger': {
                type: 'trigger',
                gamepadIndices: {
                    button: 0,
                },
                rootNodeName: 'xr_standard_trigger',
                visualResponses: {
                    xr_standard_trigger_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_trigger_pressed_value',
                        minNodeName: 'xr_standard_trigger_pressed_min',
                        maxNodeName: 'xr_standard_trigger_pressed_max',
                    },
                },
            },
            'xr-standard-squeeze': {
                type: 'squeeze',
                gamepadIndices: {
                    button: 1,
                },
                rootNodeName: 'xr_standard_squeeze',
                visualResponses: {
                    xr_standard_squeeze_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_squeeze_pressed_value',
                        minNodeName: 'xr_standard_squeeze_pressed_min',
                        maxNodeName: 'xr_standard_squeeze_pressed_max',
                    },
                },
            },
            'xr-standard-touchpad': {
                type: 'touchpad',
                gamepadIndices: {
                    button: 2,
                    xAxis: 0,
                    yAxis: 1,
                },
                rootNodeName: 'xr_standard_touchpad',
                visualResponses: {
                    xr_standard_touchpad_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_pressed_value',
                        minNodeName: 'xr_standard_touchpad_pressed_min',
                        maxNodeName: 'xr_standard_touchpad_pressed_max',
                    },
                    xr_standard_touchpad_xaxis_pressed: {
                        componentProperty: 'xAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_xaxis_pressed_value',
                        minNodeName: 'xr_standard_touchpad_xaxis_pressed_min',
                        maxNodeName: 'xr_standard_touchpad_xaxis_pressed_max',
                    },
                    xr_standard_touchpad_yaxis_pressed: {
                        componentProperty: 'yAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_yaxis_pressed_value',
                        minNodeName: 'xr_standard_touchpad_yaxis_pressed_min',
                        maxNodeName: 'xr_standard_touchpad_yaxis_pressed_max',
                    },
                    xr_standard_touchpad_xaxis_touched: {
                        componentProperty: 'xAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_xaxis_touched_value',
                        minNodeName: 'xr_standard_touchpad_xaxis_touched_min',
                        maxNodeName: 'xr_standard_touchpad_xaxis_touched_max',
                    },
                    xr_standard_touchpad_yaxis_touched: {
                        componentProperty: 'yAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_touchpad_yaxis_touched_value',
                        minNodeName: 'xr_standard_touchpad_yaxis_touched_min',
                        maxNodeName: 'xr_standard_touchpad_yaxis_touched_max',
                    },
                    xr_standard_touchpad_axes_touched: {
                        componentProperty: 'state',
                        states: ['touched', 'pressed'],
                        valueNodeProperty: 'visibility',
                        valueNodeName: 'xr_standard_touchpad_axes_touched_value',
                    },
                },
                touchPointNodeName: 'xr_standard_touchpad_axes_touched_value',
            },
            'xr-standard-thumbstick': {
                type: 'thumbstick',
                gamepadIndices: {
                    button: 3,
                    xAxis: 2,
                    yAxis: 3,
                },
                rootNodeName: 'xr_standard_thumbstick',
                visualResponses: {
                    xr_standard_thumbstick_pressed: {
                        componentProperty: 'button',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_thumbstick_pressed_value',
                        minNodeName: 'xr_standard_thumbstick_pressed_min',
                        maxNodeName: 'xr_standard_thumbstick_pressed_max',
                    },
                    xr_standard_thumbstick_xaxis_pressed: {
                        componentProperty: 'xAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_thumbstick_xaxis_pressed_value',
                        minNodeName: 'xr_standard_thumbstick_xaxis_pressed_min',
                        maxNodeName: 'xr_standard_thumbstick_xaxis_pressed_max',
                    },
                    xr_standard_thumbstick_yaxis_pressed: {
                        componentProperty: 'yAxis',
                        states: ['default', 'touched', 'pressed'],
                        valueNodeProperty: 'transform',
                        valueNodeName: 'xr_standard_thumbstick_yaxis_pressed_value',
                        minNodeName: 'xr_standard_thumbstick_yaxis_pressed_min',
                        maxNodeName: 'xr_standard_thumbstick_yaxis_pressed_max',
                    },
                },
            },
        },
        gamepadMapping: 'xr-standard',
        rootNodeName: 'microsoft-mixed-reality-right',
        assetPath: 'right.glb',
    },
};
