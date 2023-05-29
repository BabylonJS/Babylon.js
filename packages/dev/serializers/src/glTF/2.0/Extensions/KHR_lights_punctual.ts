import type { SpotLight } from "core/Lights/spotLight";
import type { Nullable } from "core/types";
import { Vector3, Quaternion, TmpVectors, Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { Light } from "core/Lights/light";
import { DirectionalLight } from "core/Lights/directionalLight";
import type { Node } from "core/node";
import { ShadowLight } from "core/Lights/shadowLight";
import type { INode, IKHRLightsPunctual_LightReference, IKHRLightsPunctual_Light, IKHRLightsPunctual } from "babylonjs-gltf2interface";
import { KHRLightsPunctual_LightType } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Logger } from "core/Misc/logger";
import { _GLTFUtilities } from "../glTFUtilities";

const NAME = "KHR_lights_punctual";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_lights_punctual implements IGLTFExporterExtensionV2 {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /** Reference to the glTF exporter */
    private _exporter: _Exporter;

    private _lights: IKHRLightsPunctual;

    /**
     * @internal
     */
    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    /** @internal */
    public dispose() {
        (this._lights as any) = null;
    }

    /** @internal */
    public get wasUsed() {
        return !!this._lights;
    }

    /** @internal */
    public onExporting(): void {
        this._exporter!._glTF.extensions![NAME] = this._lights;
    }
    /**
     * Define this method to modify the default behavior when exporting a node
     * @param context The context when exporting the node
     * @param node glTF node
     * @param babylonNode BabylonJS node
     * @param nodeMap Node mapping of unique id to glTF node index
     * @returns nullable INode promise
     */
    public postExportNodeAsync(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap?: { [key: number]: number }): Promise<Nullable<INode>> {
        return new Promise((resolve) => {
            if (node && babylonNode instanceof ShadowLight) {
                const babylonLight: ShadowLight = babylonNode;
                let light: IKHRLightsPunctual_Light;

                const lightType =
                    babylonLight.getTypeID() == Light.LIGHTTYPEID_POINTLIGHT
                        ? KHRLightsPunctual_LightType.POINT
                        : babylonLight.getTypeID() == Light.LIGHTTYPEID_DIRECTIONALLIGHT
                        ? KHRLightsPunctual_LightType.DIRECTIONAL
                        : babylonLight.getTypeID() == Light.LIGHTTYPEID_SPOTLIGHT
                        ? KHRLightsPunctual_LightType.SPOT
                        : null;
                if (lightType == null) {
                    Logger.Warn(`${context}: Light ${babylonLight.name} is not supported in ${NAME}`);
                } else {
                    const lightPosition = babylonLight.position.clone();
                    const convertToRightHandedSystem = this._exporter._convertToRightHandedSystemMap[babylonNode.uniqueId];
                    if (!lightPosition.equals(Vector3.Zero())) {
                        if (convertToRightHandedSystem) {
                            _GLTFUtilities._GetRightHandedPositionVector3FromRef(lightPosition);
                        }
                        node.translation = lightPosition.asArray();
                    }
                    if (lightType !== KHRLightsPunctual_LightType.POINT) {
                        const localAxis = babylonLight.direction;
                        const yaw = -Math.atan2(localAxis.z * (this._exporter._babylonScene.useRightHandedSystem ? -1 : 1), localAxis.x) + Math.PI / 2;
                        const len = Math.sqrt(localAxis.x * localAxis.x + localAxis.z * localAxis.z);
                        const pitch = -Math.atan2(localAxis.y, len);
                        const lightRotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, pitch, 0);
                        if (convertToRightHandedSystem) {
                            _GLTFUtilities._GetRightHandedQuaternionFromRef(lightRotationQuaternion);
                        }
                        if (!lightRotationQuaternion.equals(Quaternion.Identity())) {
                            node.rotation = lightRotationQuaternion.asArray();
                        }
                    }

                    if (babylonLight.falloffType !== Light.FALLOFF_GLTF) {
                        Logger.Warn(`${context}: Light falloff for ${babylonLight.name} does not match the ${NAME} specification!`);
                    }
                    light = {
                        type: lightType,
                    };
                    if (!babylonLight.diffuse.equals(Color3.White())) {
                        light.color = babylonLight.diffuse.asArray();
                    }
                    if (babylonLight.intensity !== 1.0) {
                        light.intensity = babylonLight.intensity;
                    }
                    if (babylonLight.range !== Number.MAX_VALUE) {
                        light.range = babylonLight.range;
                    }

                    if (lightType === KHRLightsPunctual_LightType.SPOT) {
                        const babylonSpotLight = babylonLight as SpotLight;
                        if (babylonSpotLight.angle !== Math.PI / 2.0) {
                            if (light.spot == null) {
                                light.spot = {};
                            }
                            light.spot.outerConeAngle = babylonSpotLight.angle / 2.0;
                        }
                        if (babylonSpotLight.innerAngle !== 0) {
                            if (light.spot == null) {
                                light.spot = {};
                            }
                            light.spot.innerConeAngle = babylonSpotLight.innerAngle / 2.0;
                        }
                    }

                    if (this._lights == null) {
                        this._lights = {
                            lights: [],
                        };
                    }

                    this._lights.lights.push(light);

                    const lightReference: IKHRLightsPunctual_LightReference = {
                        light: this._lights.lights.length - 1,
                    };

                    // Avoid duplicating the Light's parent node if possible.
                    const parentBabylonNode = babylonNode.parent;
                    if (parentBabylonNode && parentBabylonNode.getChildren().length == 1) {
                        const parentNode = this._exporter._nodes[nodeMap![parentBabylonNode.uniqueId]];
                        if (parentNode) {
                            const parentNodeLocalMatrix = TmpVectors.Matrix[0];
                            const parentInvertNodeLocalMatrix = TmpVectors.Matrix[1];
                            const parentNodeLocalTranslation = parentNode.translation
                                ? new Vector3(parentNode.translation[0], parentNode.translation[1], parentNode.translation[2])
                                : Vector3.Zero();
                            const parentNodeLocalRotation = parentNode.rotation
                                ? new Quaternion(parentNode.rotation[0], parentNode.rotation[1], parentNode.rotation[2], parentNode.rotation[3])
                                : Quaternion.Identity();
                            const parentNodeLocalScale = parentNode.scale ? new Vector3(parentNode.scale[0], parentNode.scale[1], parentNode.scale[2]) : Vector3.One();

                            Matrix.ComposeToRef(parentNodeLocalScale, parentNodeLocalRotation, parentNodeLocalTranslation, parentNodeLocalMatrix);
                            parentNodeLocalMatrix.invertToRef(parentInvertNodeLocalMatrix);

                            // Convert light local matrix to local matrix relative to grandparent, facing -Z
                            const lightLocalMatrix = TmpVectors.Matrix[2];
                            const nodeLocalTranslation = node.translation ? new Vector3(node.translation[0], node.translation[1], node.translation[2]) : Vector3.Zero();

                            // Undo directional light positional offset
                            if (babylonLight instanceof DirectionalLight) {
                                nodeLocalTranslation.subtractInPlace(
                                    this._exporter._babylonScene.useRightHandedSystem
                                        ? babylonLight.direction
                                        : _GLTFUtilities._GetRightHandedPositionVector3(babylonLight.direction)
                                );
                            }
                            const nodeLocalRotation = this._exporter._babylonScene.useRightHandedSystem ? Quaternion.Identity() : new Quaternion(0, 1, 0, 0);
                            if (node.rotation) {
                                nodeLocalRotation.multiplyInPlace(new Quaternion(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]));
                            }
                            const nodeLocalScale = node.scale ? new Vector3(node.scale[0], node.scale[1], node.scale[2]) : Vector3.One();

                            Matrix.ComposeToRef(nodeLocalScale, nodeLocalRotation, nodeLocalTranslation, lightLocalMatrix);
                            lightLocalMatrix.multiplyToRef(parentInvertNodeLocalMatrix, lightLocalMatrix);
                            const parentNewScale = TmpVectors.Vector3[0];
                            const parentNewRotationQuaternion = TmpVectors.Quaternion[0];
                            const parentNewTranslation = TmpVectors.Vector3[1];

                            lightLocalMatrix.decompose(parentNewScale, parentNewRotationQuaternion, parentNewTranslation);
                            parentNode.scale = parentNewScale.asArray();
                            parentNode.rotation = parentNewRotationQuaternion.asArray();
                            parentNode.translation = parentNewTranslation.asArray();

                            if (parentNode.extensions == null) {
                                parentNode.extensions = {};
                            }
                            parentNode.extensions[NAME] = lightReference;

                            // Do not export the original node
                            resolve(null);
                            return;
                        }
                    }

                    if (node.extensions == null) {
                        node.extensions = {};
                    }

                    node.extensions[NAME] = lightReference;
                }
            }
            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_lights_punctual(exporter));
