import { AbstractMesh } from "../../Meshes/abstractMesh";
import { WebXRAbstractMotionController, IMotionControllerProfile, IMotionControllerMeshMap } from "./webXRAbstractMotionController";
import { Scene } from "../../scene";
import { SceneLoader } from "../../Loading/sceneLoader";
import { Mesh } from "../../Meshes/mesh";
import { Axis, Space } from "../../Maths/math.axis";
import { Color3 } from "../../Maths/math.color";
import { WebXRControllerComponent } from "./webXRControllerComponent";
import { SphereBuilder } from "../../Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "../../Materials/standardMaterial";
import { Logger } from "../../Misc/logger";

/**
 * A profiled motion controller has its profile loaded from an online repository.
 * The class is responsible of loading the model, mapping the keys and enabling model-animations
 */
export class WebXRProfiledMotionController extends WebXRAbstractMotionController {
    private _buttonMeshMapping: {
        [buttonName: string]: {
            mainMesh?: AbstractMesh;
            states: {
                [state: string]: IMotionControllerMeshMap;
            };
        };
    } = {};
    private _touchDots: { [visKey: string]: AbstractMesh } = {};

    /**
     * The profile ID of this controller. Will be populated when the controller initializes.
     */
    public profileId: string;

    constructor(scene: Scene, xrInput: XRInputSource, _profile: IMotionControllerProfile, private _repositoryUrl: string) {
        super(scene, _profile.layouts[xrInput.handedness || "none"], xrInput.gamepad as any, xrInput.handedness);
        this.profileId = _profile.profileId;
    }

    public dispose() {
        super.dispose();
        Object.keys(this._touchDots).forEach((visResKey) => {
            this._touchDots[visResKey].dispose();
        });
    }

    protected _getFilenameAndPath(): { filename: string; path: string } {
        return {
            filename: this.layout.assetPath,
            path: `${this._repositoryUrl}/profiles/${this.profileId}/`,
        };
    }

    protected _getModelLoadingConstraints(): boolean {
        const glbLoaded = SceneLoader.IsPluginForExtensionAvailable(".glb");
        if (!glbLoaded) {
            Logger.Warn("glTF / glb loaded was not registered, using generic controller instead");
        }
        return glbLoaded;
    }

    protected _processLoadedModel(_meshes: AbstractMesh[]): void {
        this.getComponentIds().forEach((type) => {
            const componentInLayout = this.layout.components[type];
            this._buttonMeshMapping[type] = {
                mainMesh: this._getChildByName(this.rootMesh!, componentInLayout.rootNodeName),
                states: {},
            };
            Object.keys(componentInLayout.visualResponses).forEach((visualResponseKey) => {
                const visResponse = componentInLayout.visualResponses[visualResponseKey];
                if (visResponse.valueNodeProperty === "transform") {
                    this._buttonMeshMapping[type].states[visualResponseKey] = {
                        valueMesh: this._getChildByName(this.rootMesh!, visResponse.valueNodeName!),
                        minMesh: this._getChildByName(this.rootMesh!, visResponse.minNodeName!),
                        maxMesh: this._getChildByName(this.rootMesh!, visResponse.maxNodeName!),
                    };
                } else {
                    // visibility, usually for touchpads
                    const nameOfMesh = componentInLayout.type === WebXRControllerComponent.TOUCHPAD_TYPE && componentInLayout.touchPointNodeName ? componentInLayout.touchPointNodeName : visResponse.valueNodeName!;
                    this._buttonMeshMapping[type].states[visualResponseKey] = {
                        valueMesh: this._getChildByName(this.rootMesh!, nameOfMesh),
                    };
                    if (componentInLayout.type === WebXRControllerComponent.TOUCHPAD_TYPE && !this._touchDots[visualResponseKey]) {
                        const dot = SphereBuilder.CreateSphere(
                            visualResponseKey + "dot",
                            {
                                diameter: 0.0015,
                                segments: 8,
                            },
                            this.scene
                        );
                        dot.material = new StandardMaterial(visualResponseKey + "mat", this.scene);
                        (<StandardMaterial>dot.material).diffuseColor = Color3.Red();
                        dot.parent = this._buttonMeshMapping[type].states[visualResponseKey].valueMesh || null;
                        dot.isVisible = false;
                        this._touchDots[visualResponseKey] = dot;
                    }
                }
            });
        });
    }

    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + "-" + this.handedness, this.scene);
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
            this.rootMesh.rotate(Axis.Y, Math.PI, Space.WORLD);
        }
    }

    protected _updateModel(_xrFrame: XRFrame): void {
        if (this.disableAnimation) {
            return;
        }
        this.getComponentIds().forEach((id) => {
            const component = this.getComponent(id);
            if (!component.hasChanges) {
                return;
            }
            const meshes = this._buttonMeshMapping[id];
            const componentInLayout = this.layout.components[id];
            Object.keys(componentInLayout.visualResponses).forEach((visualResponseKey) => {
                const visResponse = componentInLayout.visualResponses[visualResponseKey];
                let value = component.value;
                if (visResponse.componentProperty === "xAxis") {
                    value = component.axes.x;
                } else if (visResponse.componentProperty === "yAxis") {
                    value = component.axes.y;
                }
                if (visResponse.valueNodeProperty === "transform") {
                    this._lerpTransform(meshes.states[visualResponseKey], value, visResponse.componentProperty !== "button");
                } else {
                    // visibility
                    const valueMesh = meshes.states[visualResponseKey].valueMesh;
                    if (valueMesh) {
                        valueMesh.isVisible = component.touched || component.pressed;
                    }
                    if (this._touchDots[visualResponseKey]) {
                        this._touchDots[visualResponseKey].isVisible = component.touched || component.pressed;
                    }
                }
            });
        });
    }
}
