import type { IAssetContainer } from "core/IAssetContainer";
import { Color3, Color4 } from "../Maths/math.color";
import { Matrix, Quaternion, Vector2, Vector3, Vector4 } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { FlowGraphBlockNames } from "./Blocks/flowGraphBlockNames";
import { FlowGraphInteger } from "./CustomTypes/flowGraphInteger";
import { FlowGraphTypes, getRichTypeByFlowGraphType } from "./flowGraphRichTypes";
import type { TransformNode } from "core/Meshes/transformNode";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "./CustomTypes/flowGraphMatrix";

function isMeshClassName(className: string) {
    return (
        className === "Mesh" ||
        className === "AbstractMesh" ||
        className === "GroundMesh" ||
        className === "InstanceMesh" ||
        className === "LinesMesh" ||
        className === "GoldbergMesh" ||
        className === "GreasedLineMesh" ||
        className === "TrailMesh"
    );
}

function isVectorClassName(className: string) {
    return (
        className === FlowGraphTypes.Vector2 ||
        className === FlowGraphTypes.Vector3 ||
        className === FlowGraphTypes.Vector4 ||
        className === FlowGraphTypes.Quaternion ||
        className === FlowGraphTypes.Color3 ||
        className === FlowGraphTypes.Color4
    );
}

function isMatrixClassName(className: string) {
    return className === FlowGraphTypes.Matrix || className === FlowGraphTypes.Matrix2D || className === FlowGraphTypes.Matrix3D;
}

function isAnimationGroupClassName(className: string) {
    return className === "AnimationGroup";
}

function parseVector(className: string, value: Array<number>, flipHandedness = false) {
    if (className === FlowGraphTypes.Vector2) {
        return Vector2.FromArray(value);
    } else if (className === FlowGraphTypes.Vector3) {
        if (flipHandedness) {
            value[2] *= -1;
        }
        return Vector3.FromArray(value);
    } else if (className === FlowGraphTypes.Vector4) {
        return Vector4.FromArray(value);
    } else if (className === FlowGraphTypes.Quaternion) {
        if (flipHandedness) {
            value[2] *= -1;
            value[3] *= -1;
        }
        return Quaternion.FromArray(value);
    } else if (className === FlowGraphTypes.Color3) {
        return new Color3(value[0], value[1], value[2]);
    } else if (className === FlowGraphTypes.Color4) {
        return new Color4(value[0], value[1], value[2], value[3]);
    } else {
        throw new Error(`Unknown vector class name ${className}`);
    }
}

/**
 * The default function that serializes values in a context object to a serialization object
 * @param key the key where the value should be stored in the serialization object
 * @param value the value to store
 * @param serializationObject the object where the value will be stored
 */
export function defaultValueSerializationFunction(key: string, value: any, serializationObject: any) {
    const className = value?.getClassName?.() ?? "";
    if (isVectorClassName(className) || isMatrixClassName(className)) {
        serializationObject[key] = {
            value: value.asArray(),
            className,
        };
    } else if (className === FlowGraphTypes.Integer) {
        serializationObject[key] = {
            value: value.value,
            className,
        };
    } else {
        if (className && (value.id || value.name)) {
            serializationObject[key] = {
                id: value.id,
                name: value.name,
                className,
            };
        } else {
            // only if it is not an object
            if (typeof value !== "object") {
                serializationObject[key] = value;
            } else {
                throw new Error(`Could not serialize value ${value}`);
            }
        }
    }
}

/**
 * The default function that parses values stored in a serialization object
 * @param key the key to the value that will be parsed
 * @param serializationObject the object that will be parsed
 * @param assetsContainer the assets container that will be used to find the objects
 * @param scene
 * @returns
 */
export function defaultValueParseFunction(key: string, serializationObject: any, assetsContainer: IAssetContainer, scene: Scene) {
    const intermediateValue = serializationObject[key];
    let finalValue;
    const className = intermediateValue?.type ?? intermediateValue?.className;
    if (isMeshClassName(className)) {
        let nodes: TransformNode[] = scene.meshes.filter((m) => (intermediateValue.id ? m.id === intermediateValue.id : m.name === intermediateValue.name));
        if (nodes.length === 0) {
            nodes = scene.transformNodes.filter((m) => (intermediateValue.id ? m.id === intermediateValue.id : m.name === intermediateValue.name));
        }
        finalValue = intermediateValue.uniqueId ? nodes.find((m) => m.uniqueId === intermediateValue.uniqueId) : nodes[0];
    } else if (isVectorClassName(className)) {
        finalValue = parseVector(className, intermediateValue.value);
    } else if (isAnimationGroupClassName(className)) {
        // do not use the scene.getAnimationGroupByName because it is possible that two AGs will have the same name
        const ags = scene.animationGroups.filter((ag) => ag.name === intermediateValue.name);
        // uniqueId changes on each load. this is used for the glTF loader, that uses serialization after the scene was loaded.
        finalValue = ags.length === 1 ? ags[0] : ags.find((ag) => ag.uniqueId === intermediateValue.uniqueId);
    } else if (className === FlowGraphTypes.Matrix) {
        finalValue = Matrix.FromArray(intermediateValue.value);
    } else if (className === FlowGraphTypes.Matrix2D) {
        finalValue = new FlowGraphMatrix2D(intermediateValue.value);
    } else if (className === FlowGraphTypes.Matrix3D) {
        finalValue = new FlowGraphMatrix3D(intermediateValue.value);
    } else if (className === FlowGraphTypes.Integer) {
        finalValue = FlowGraphInteger.FromValue(intermediateValue.value);
    } else if (className === FlowGraphTypes.Number || className === FlowGraphTypes.String || className === FlowGraphTypes.Boolean) {
        finalValue = intermediateValue.value[0];
    } else if (intermediateValue && intermediateValue.value !== undefined) {
        finalValue = intermediateValue.value;
    } else {
        if (Array.isArray(intermediateValue)) {
            // configuration data of an event
            finalValue = intermediateValue.reduce((acc, val) => {
                if (!val.eventData) {
                    return acc;
                }
                acc[val.id] = {
                    type: getRichTypeByFlowGraphType(val.type),
                };
                if (typeof val.value !== "undefined") {
                    acc[val.id].value = defaultValueParseFunction("value", val, assetsContainer, scene);
                }
                return acc;
            }, {});
        } else {
            finalValue = intermediateValue;
        }
    }
    return finalValue;
}

/**
 * Given a name of a flow graph block class, return if this
 * class needs to be created with a path converter. Used in
 * parsing.
 * @param className the name of the flow graph block class
 * @returns a boolean indicating if the class needs a path converter
 */
export function needsPathConverter(className: string) {
    // I am not using the ClassName property here because it was causing a circular dependency
    // that jest didn't like!
    return className === FlowGraphBlockNames.JsonPointerParser;
}
