import type { INode, IEXTMeshGpuInstancing } from "babylonjs-gltf2interface";
import { AccessorType, AccessorComponentType } from "babylonjs-gltf2interface";
import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import type { BufferManager } from "../bufferManager";
import { GLTFExporter } from "../glTFExporter";
import type { Nullable } from "core/types";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes/mesh";
import "core/Meshes/thinInstanceMesh";
import { TmpVectors, Quaternion, Vector3 } from "core/Maths/math.vector";
import { ConvertToRightHandedPosition, ConvertToRightHandedRotation } from "../glTFUtilities";

import { Logger } from "core/Misc/logger";

const NAME = "EXT_mesh_gpu_instancing";

function ColorBufferToRGBAToRGB(colorBuffer: Float32Array, instanceCount: number) {
    const colorBufferRgb = new Float32Array(instanceCount * 3);

    for (let i = 0; i < instanceCount; i++) {
        colorBufferRgb[i * 3 + 0] = colorBuffer[i * 4 + 0];
        colorBufferRgb[i * 3 + 1] = colorBuffer[i * 4 + 1];
        colorBufferRgb[i * 3 + 2] = colorBuffer[i * 4 + 2];
    }
    return colorBufferRgb;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_mesh_gpu_instancing implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /**
     * Internal state to emit warning about instance color alpha once
     */
    private _instanceColorWarned = false;

    private _exporter: GLTFExporter;

    private _wasUsed = false;

    constructor(exporter: GLTFExporter) {
        this._exporter = exporter;
    }

    public dispose() {}

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    /**
     * After node is exported
     * @param context the GLTF context when loading the asset
     * @param node the node exported
     * @param babylonNode the corresponding babylon node
     * @param nodeMap map from babylon node id to node index
     * @param convertToRightHanded true if we need to convert data from left hand to right hand system.
     * @param bufferManager buffer manager
     * @returns nullable promise, resolves with the node
     */
    public async postExportNodeAsync(
        context: string,
        node: Nullable<INode>,
        babylonNode: Node,
        nodeMap: Map<Node, number>,
        convertToRightHanded: boolean,
        bufferManager: BufferManager
    ): Promise<Nullable<INode>> {
        return await new Promise((resolve) => {
            if (node && babylonNode instanceof Mesh) {
                if (babylonNode.hasThinInstances && this._exporter) {
                    this._wasUsed = true;

                    const noTranslation = Vector3.Zero();
                    const noRotation = Quaternion.Identity();
                    const noScale = Vector3.One();

                    // retrieve all the instance world matrix
                    const matrix = babylonNode.thinInstanceGetWorldMatrices();

                    const iwt = TmpVectors.Vector3[2];
                    const iwr = TmpVectors.Quaternion[1];
                    const iws = TmpVectors.Vector3[3];

                    let hasAnyInstanceWorldTranslation = false;
                    let hasAnyInstanceWorldRotation = false;
                    let hasAnyInstanceWorldScale = false;

                    // prepare temp buffers
                    const translationBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);
                    const rotationBuffer = new Float32Array(babylonNode.thinInstanceCount * 4);
                    const scaleBuffer = new Float32Array(babylonNode.thinInstanceCount * 3);

                    let i = 0;
                    for (const m of matrix) {
                        m.decompose(iws, iwr, iwt);

                        if (convertToRightHanded) {
                            ConvertToRightHandedPosition(iwt);
                            ConvertToRightHandedRotation(iwr);
                        }

                        // fill the temp buffer
                        translationBuffer.set(iwt.asArray(), i * 3);
                        rotationBuffer.set(iwr.normalize().asArray(), i * 4); // ensure the quaternion is normalized
                        scaleBuffer.set(iws.asArray(), i * 3);

                        // this is where we decide if there is any transformation
                        hasAnyInstanceWorldTranslation = hasAnyInstanceWorldTranslation || !iwt.equalsWithEpsilon(noTranslation);
                        hasAnyInstanceWorldRotation = hasAnyInstanceWorldRotation || !iwr.equalsWithEpsilon(noRotation);
                        hasAnyInstanceWorldScale = hasAnyInstanceWorldScale || !iws.equalsWithEpsilon(noScale);

                        i++;
                    }

                    const extension: IEXTMeshGpuInstancing = {
                        attributes: {},
                    };

                    // do we need to write TRANSLATION ?
                    if (hasAnyInstanceWorldTranslation) {
                        extension.attributes["TRANSLATION"] = this._buildAccessor(translationBuffer, AccessorType.VEC3, babylonNode.thinInstanceCount, bufferManager);
                    }
                    // do we need to write ROTATION ?
                    if (hasAnyInstanceWorldRotation) {
                        // we decided to stay on FLOAT for now see https://github.com/BabylonJS/Babylon.js/pull/12495
                        extension.attributes["ROTATION"] = this._buildAccessor(rotationBuffer, AccessorType.VEC4, babylonNode.thinInstanceCount, bufferManager);
                    }
                    // do we need to write SCALE ?
                    if (hasAnyInstanceWorldScale) {
                        extension.attributes["SCALE"] = this._buildAccessor(scaleBuffer, AccessorType.VEC3, babylonNode.thinInstanceCount, bufferManager);
                    }
                    let colorBuffer = babylonNode._userThinInstanceBuffersStorage?.data?.instanceColor;
                    if (colorBuffer) {
                        const instanceCount = babylonNode.thinInstanceCount;
                        const accessorType = AccessorType.VEC3;
                        if (babylonNode.hasVertexAlpha && colorBuffer.length === instanceCount * 4) {
                            if (!this._instanceColorWarned) {
                                Logger.Warn("EXT_mesh_gpu_instancing: Exporting instance colors as RGB, alpha channel of instance color is not exported");
                                this._instanceColorWarned = true;
                            }
                            colorBuffer = ColorBufferToRGBAToRGB(colorBuffer, instanceCount);
                        } else if (colorBuffer.length === instanceCount * 4) {
                            colorBuffer = ColorBufferToRGBAToRGB(colorBuffer, instanceCount);
                        }
                        if (colorBuffer.length === instanceCount * 3) {
                            extension.attributes["_COLOR_0"] = this._buildAccessor(colorBuffer, accessorType, instanceCount, bufferManager);
                        }
                    }

                    /* eslint-enable @typescript-eslint/naming-convention*/
                    node.extensions = node.extensions || {};
                    node.extensions[NAME] = extension;
                }
            }
            resolve(node);
        });
    }

    private _buildAccessor(buffer: Float32Array, type: AccessorType, count: number, bufferManager: BufferManager): number {
        // build the buffer view
        const bv = bufferManager.createBufferView(buffer);

        // finally build the accessor
        const accessor = bufferManager.createAccessor(bv, type, AccessorComponentType.FLOAT, count);
        this._exporter._accessors.push(accessor);
        return this._exporter._accessors.length - 1;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
GLTFExporter.RegisterExtension(NAME, (exporter) => new EXT_mesh_gpu_instancing(exporter));
