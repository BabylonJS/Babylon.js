import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { WebXRAbstractMotionController, IMotionControllerProfile, IMotionControllerMeshMap } from './webXRAbstractController';
import { Scene } from '../../../scene';
import { SceneLoader } from '../../../Loading/sceneLoader';
import { WebXRMotionControllerManager } from './webXRMotionControllerManager';
import { Mesh } from '../../../Meshes/mesh';
import { Axis, Space } from '../../../Maths/math.axis';

export class WebXRProfiledMotionController extends WebXRAbstractMotionController {
    public profileId: string;

    private _buttonMeshMapping: {
        [buttonName: string]: {
            mainMesh: AbstractMesh;
            states: {
                [state: string]: IMotionControllerMeshMap
            }
        }
    } = {};
    constructor(scene: Scene, xrInput: XRInputSource, _profile: IMotionControllerProfile) {
        super(scene, _profile.layouts[xrInput.handedness || "none"], xrInput.gamepad as any, xrInput.handedness);
        this.profileId = _profile.profileId;
    }

    protected _getFilenameAndPath(): { filename: string; path: string; } {
        return {
            filename: this.layout.assetPath,
            path: `${WebXRMotionControllerManager.BaseRepositoryUrl}/profiles/${this.profileId}/`
        };
    }
    protected _processLoadedModel(meshes: AbstractMesh[]): void {
        this.getComponentTypes().forEach((type) => {
            const componentInLayout = this.layout.components[type];
            this._buttonMeshMapping[type] = {
                mainMesh: this._getChildByName(this.rootMesh!, componentInLayout.rootNodeName),
                states: {}
            };
            Object.keys(componentInLayout.visualResponses).forEach((visualResponseKey) => {
                const visResponse = componentInLayout.visualResponses[visualResponseKey];
                if (visResponse.valueNodeProperty === "transform") {
                    this._buttonMeshMapping[type].states[visualResponseKey] = {
                        valueMesh: this._getChildByName(this.rootMesh!, visResponse.valueNodeName!),
                        minMesh: this._getChildByName(this.rootMesh!, visResponse.minNodeName!),
                        maxMesh: this._getChildByName(this.rootMesh!, visResponse.maxNodeName!)
                    };
                } else {
                    // visibility
                    this._buttonMeshMapping[type].states[visualResponseKey] = {
                        valueMesh: this._getChildByName(this.rootMesh!, visResponse.valueNodeName!)
                    };
                }
            });
        });
    }
    protected _setRootMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handness, this.scene);
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
        /*let min = {
            x: 0,
            y: 0,
            z: 0
        };
        let max = {
            x: 0,
            y: 0,
            z: 0
        };
        this.rootMesh.getChildMeshes().forEach((mesh) => {
            var bi = mesh.getBoundingInfo();
            var minimum = bi.boundingBox.minimumWorld;
            var maximum = bi.boundingBox.maximumWorld;

            if (minimum.x < min.x) {
                min.x = minimum.x;
            }
            if (minimum.y < min.y) {
                min.y = minimum.y;
            }
            if (minimum.z < min.z) {
                min.z = minimum.z;
            }

            if (maximum.x > max.x) {
                max.x = maximum.x;
            }
            if (maximum.y > max.y) {
                max.y = maximum.y;
            }
            if (maximum.z > max.z) {
                max.z = maximum.z;
            }
        });

        console.log(min, max, { x: max.x + min.x, y: max.y + min.y, z: max.z + min.z });*/
        const center = Mesh.Center(this.rootMesh.getChildMeshes());
        this.rootMesh.position.subtractInPlace(center.scaleInPlace(2));
        this.rootMesh.position.z *= -1;

        this.rootMesh.rotate(Axis.Y, Math.PI, Space.WORLD);
        this.rootMesh.rotate(Axis.X, -Math.PI / 4, Space.WORLD);
    }
    protected _updateModel(_xrFrame: XRFrame): void {
        if (this.disableAnimation) {
            return;
        }
        this.getComponentTypes().forEach((type) => {
            const component = this.getComponent(type);
            const meshes = this._buttonMeshMapping[type];
            const componentInLayout = this.layout.components[type];
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
                    meshes.states[visualResponseKey].valueMesh.visibility = value;
                }
            });
        });
    }
    protected _getModelLoadingConstraints(): boolean {
        return SceneLoader.IsPluginForExtensionAvailable(".glb");
    }

}