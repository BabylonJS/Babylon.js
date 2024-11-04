import type { SpotLight } from "core/Lights/spotLight";
import type { Nullable } from "core/types";
import { Vector3, Quaternion, TmpVectors, Matrix } from "core/Maths/math.vector";
import { Light } from "core/Lights/light";
import type { Node } from "core/node";
import { ShadowLight } from "core/Lights/shadowLight";
import type { INode, IKHRLightsPunctual_LightReference, IKHRLightsPunctual_Light, IKHRLightsPunctual } from "babylonjs-gltf2interface";
import { KHRLightsPunctual_LightType } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { Logger } from "core/Misc/logger";
import { convertToRightHandedPosition, omitDefaultValues } from "../glTFUtilities";

const NAME = "KHR_lights_punctual";

const DEFAULTS: Partial<IKHRLightsPunctual_Light> = {
    name: "",
    color: [1, 1, 1],
    intensity: 1,
    range: Number.MAX_VALUE,
};

const SPOTDEFAULTS: IKHRLightsPunctual_Light["spot"] = {
    innerConeAngle: 0,
    outerConeAngle: Math.PI / 4.0,
};

// // TODO: Move elsewhere, since this is common
// const NODEDEFAULTS: Partial<INode> = {
//     translation: [0, 0, 0],
//     rotation: [0, 0, 0, 1],
//     scale: [1, 1, 1],
// };

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
    private _exporter: GLTFExporter;

    private _lights: IKHRLightsPunctual;

    /**
     * @internal
     */
    constructor(exporter: GLTFExporter) {
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
     * @param nodeMap Node mapping of babylon node to glTF node index
     * @param convertToRightHanded Flag to convert the values to right-handed
     * @returns nullable INode promise
     */
    public postExportNodeAsync(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap: Map<Node, number>, convertToRightHanded: boolean): Promise<Nullable<INode>> {
        return new Promise((resolve) => {
            // If node was nullified (marked as skippable) earlier in the pipeline, or it's not a light, skip
            if (!node || !(babylonNode instanceof ShadowLight)) {
                resolve(node);
                return;
            }

            const lightType =
                babylonNode.getTypeID() == Light.LIGHTTYPEID_POINTLIGHT
                    ? KHRLightsPunctual_LightType.POINT
                    : babylonNode.getTypeID() == Light.LIGHTTYPEID_DIRECTIONALLIGHT
                      ? KHRLightsPunctual_LightType.DIRECTIONAL
                      : babylonNode.getTypeID() == Light.LIGHTTYPEID_SPOTLIGHT
                        ? KHRLightsPunctual_LightType.SPOT
                        : null;
            if (!lightType) {
                Logger.Warn(`${context}: Light ${babylonNode.name} is not supported in ${NAME}`);
                resolve(node);
                return;
            }

            if (babylonNode.falloffType !== Light.FALLOFF_GLTF) {
                Logger.Warn(`${context}: Light falloff for ${babylonNode.name} does not match the ${NAME} specification!`);
            }

            // Set the node's translation and rotation here, since lights are not handled in exportNodeAsync
            if (!babylonNode.position.equalsToFloats(0, 0, 0)) {
                const translation = TmpVectors.Vector3[0].copyFrom(babylonNode.position);
                if (convertToRightHanded) {
                    convertToRightHandedPosition(translation);
                }
                node.translation = translation.asArray();
            }

            // Use the light's direction as the node's rotation, since in glTF, lights have a constant direction
            // TODO: Fix. This was wrong originally, anyway.
            if (lightType !== KHRLightsPunctual_LightType.POINT) {
                const localAxis = babylonNode.direction;
                const yaw = -Math.atan2(localAxis.z, localAxis.x) + Math.PI / 2;
                const len = Math.sqrt(localAxis.x * localAxis.x + localAxis.z * localAxis.z);
                const pitch = -Math.atan2(localAxis.y, len);
                const lightRotationQuaternion = Quaternion.RotationYawPitchRoll(yaw + Math.PI, pitch, 0);
                if (!Quaternion.IsIdentity(lightRotationQuaternion)) {
                    node.rotation = lightRotationQuaternion.normalize().asArray();
                }
            }

            let light: IKHRLightsPunctual_Light = {
                type: lightType,
                name: babylonNode.name,
                color: babylonNode.diffuse.asArray(),
                intensity: babylonNode.intensity,
                range: babylonNode.range,
            };
            light = omitDefaultValues(light, DEFAULTS);

            // Set the required 'spot' field for spot lights, then check its contents for defaults
            if (lightType === KHRLightsPunctual_LightType.SPOT) {
                const babylonSpotLight = babylonNode as SpotLight;
                light.spot = {
                    innerConeAngle: babylonSpotLight.innerAngle,
                    outerConeAngle: babylonSpotLight.angle,
                };
                light.spot = omitDefaultValues(light.spot, SPOTDEFAULTS!);
            }

            this._lights ||= {
                lights: [],
            };
            this._lights.lights.push(light);

            const lightReference: IKHRLightsPunctual_LightReference = {
                light: this._lights.lights.length - 1,
            };

            // Assign the light to its parent node, if possible, to condense the glTF
            // Why and when: the glTF loader generates a new parent TransformNode for each light node, which isn't needed for glTF
            const parentBabylonNode = babylonNode.parent;
            if (parentBabylonNode && parentBabylonNode.getChildren().length == 1 && babylonNode.getChildren().length == 0) {
                const parentNode = this._exporter._nodes[nodeMap.get(parentBabylonNode)!];
                if (parentNode) {
                    // Combine the light's transformation with the parent's
                    const parentTranslation = Vector3.FromArrayToRef(parentNode.translation || [0, 0, 0], 0, TmpVectors.Vector3[0]);
                    const parentRotation = Quaternion.FromArrayToRef(parentNode.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[0]);
                    const parentScale = Vector3.FromArrayToRef(parentNode.scale || [1, 1, 1], 0, TmpVectors.Vector3[1]);
                    const parentMatrix = Matrix.ComposeToRef(parentScale, parentRotation, parentTranslation, TmpVectors.Matrix[0]);

                    const translation = Vector3.FromArrayToRef(node.translation || [0, 0, 0], 0, TmpVectors.Vector3[2]);
                    const rotation = Quaternion.FromArrayToRef(node.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[1]);
                    const matrix = Matrix.ComposeToRef(Vector3.OneReadOnly, rotation, translation, TmpVectors.Matrix[1]);

                    parentMatrix.multiplyToRef(matrix, matrix);
                    matrix.decompose(parentScale, parentRotation, parentTranslation);

                    // Remove default values if they are now default
                    if (parentTranslation.equalsToFloats(0, 0, 0)) {
                        delete parentNode.translation;
                    } else {
                        parentNode.translation = parentTranslation.asArray();
                    }

                    if (Quaternion.IsIdentity(parentRotation)) {
                        delete parentNode.rotation;
                    } else {
                        parentNode.rotation = parentRotation.asArray();
                    }

                    if (parentScale.equalsToFloats(1, 1, 1)) {
                        delete parentNode.scale;
                    } else {
                        parentNode.scale = parentScale.asArray();
                    }

                    parentNode.extensions ||= {};
                    parentNode.extensions[NAME] = lightReference;

                    // Do not export the original node
                    resolve(null);
                    return;
                }
            }

            node.extensions ||= {};
            node.extensions[NAME] = lightReference;
            resolve(node);
        });
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_lights_punctual(exporter));
