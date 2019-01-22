import { SpotLight } from "babylonjs/Lights/spotLight";
import { Vector3 } from "babylonjs/Maths/math";
import { Light } from "babylonjs/Lights/light";
import { Node } from "babylonjs/node";
import { ShadowLight } from "babylonjs/Lights/shadowLight";
import { IChildRootProperty } from "babylonjs-gltf2interface";
import { INode } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Tools, Nullable, DirectionalLight, Quaternion } from 'babylonjs';

const NAME = "KHR_lights_punctual";

enum LightType {
    DIRECTIONAL = "directional",
    POINT = "point",
    SPOT = "spot"
}

interface ILightReference {
    light: number;
}

interface ILight extends IChildRootProperty {
    type: LightType;
    color?: number[];
    intensity?: number;
    range?: number;
    spot?: {
        innerConeAngle?: number;
        outerConeAngle?: number;
    };
}

interface ILights {
    lights: ILight[];
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/1048d162a44dbcb05aefc1874bfd423cf60135a6/extensions/2.0/Khronos/KHR_lights_punctual/README.md) (Experimental)
 */
export class KHR_lights implements IGLTFExporterExtensionV2 {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /** Reference to the glTF exporter */
    private _exporter: _Exporter;

    private _lights: ILights;

    /** @hidden */
    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    /** @hidden */
    public dispose() {
        delete this._exporter;
        delete this._lights;
    }

    /** @hidden */
    public onExporting(): void {
        if (this._lights) {
            if (this._exporter._glTF.extensionsUsed == null) {
                this._exporter._glTF.extensionsUsed = [];
            }
            if (this._exporter._glTF.extensionsUsed.indexOf(NAME) == -1) {
                this._exporter._glTF.extensionsUsed.push(NAME);
            }
            if (this.required) {
                if (this._exporter._glTF.extensionsRequired == null) {
                    this._exporter._glTF.extensionsRequired = [];
                }
                if (this._exporter._glTF.extensionsRequired.indexOf(NAME) == -1) {
                    this._exporter._glTF.extensionsRequired.push(NAME);
                }
            }
            if (this._exporter._glTF.extensions == null) {
                this._exporter._glTF.extensions = {};
            }
            this._exporter._glTF.extensions[NAME] = this._lights;
        }
    }
    public postExportNodeAsync(context: string, node: INode, babylonNode: Node): Nullable<Promise<INode>> {
        return new Promise((resolve, reject) => {
            if (babylonNode instanceof ShadowLight) {
                let babylonLight: ShadowLight = babylonNode;
                let light: ILight;

                let lightType = (
                    babylonLight.getTypeID() == Light.LIGHTTYPEID_POINTLIGHT ? LightType.POINT : (
                        babylonLight.getTypeID() == Light.LIGHTTYPEID_DIRECTIONALLIGHT ? LightType.DIRECTIONAL : (
                            babylonLight.getTypeID() == Light.LIGHTTYPEID_SPOTLIGHT ? LightType.SPOT : null
                        )));
                if (lightType == null) {
                    Tools.Warn(`${context}: Light ${babylonLight.name} is not supported in {NAME}`);
                }
                else {
                    let lightPosition = babylonLight.position.clone();
                    if (!lightPosition.equalsToFloats(1.0, 1.0, 1.0)) {
                        if (this._exporter._convertToRightHandedSystem) {
                            lightPosition.z *= -1;
                        }
                        node.translation = lightPosition.asArray();
                    }
                    if (babylonLight.falloffType != Light.FALLOFF_GLTF) {
                        Tools.Warn(`${context}: Light falloff for ${babylonLight.name} does not match the ${NAME} specification!`);
                    }
                    light = {
                        type: lightType
                    };
                    if (!babylonLight.diffuse.equalsFloats(1.0, 1.0, 1.0)) {
                        light.color = babylonLight.diffuse.asArray();
                    }
                    if (!(babylonLight.intensity == 1.0)) {
                        light.intensity = babylonLight.intensity;
                    }
                    if (!(babylonLight.range == Number.MAX_VALUE)) {
                        light.range = babylonLight.range;
                    }

                    if (lightType === LightType.SPOT) {
                        let babylonSpotLight = babylonLight as SpotLight;
                        if (!(babylonSpotLight.angle == Math.PI / 2.0)) {
                            if (light.spot == null) {
                                light.spot = {};
                            }
                            light.spot.outerConeAngle = babylonSpotLight.angle / 4;
                        }
                        if (!(babylonSpotLight.innerAngle == 0)) {
                            if (light.spot == null) {
                                light.spot = {};
                            }
                            light.spot.innerConeAngle = babylonSpotLight.innerAngle / 2;
                        }
                        let rotation = babylonSpotLight.getRotation().clone();
                        if (!rotation.equals(Vector3.Zero())) {
                            if (this._exporter._convertToRightHandedSystem) {
                                rotation.z *= -1;
                            }
                            node.rotation = Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z).asArray();
                        }
                    }
                    else if (lightType === LightType.DIRECTIONAL) {
                        let babylonDirectionalLight = babylonLight as DirectionalLight;
                        let rotation = babylonDirectionalLight.getRotation().clone();
                        if (!rotation.equals(Vector3.Zero())) {
                            if (this._exporter._convertToRightHandedSystem) {
                                rotation.z *= -1;
                            }
                            node.rotation = Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z).asArray();
                        }
                    }
                    if (this._lights == null) {
                        this._lights = {
                            lights: []
                        };
                    }

                    this._lights.lights.push(light);

                    if (node.extensions == null) {
                        node.extensions = {};
                    }
                    const lightReference: ILightReference = {
                        light: this._lights.lights.length - 1
                    };

                    node.extensions[NAME] = lightReference;
                }

            }
            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_lights(exporter));