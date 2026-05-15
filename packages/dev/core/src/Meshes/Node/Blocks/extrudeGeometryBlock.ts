import { NodeGeometryBlock } from "../nodeGeometryBlock";
import { type NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { type NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { PropertyTypeForEdition, editableInPropertyPage } from "../../../Decorators/nodeDecorator";
import { Vector3 } from "../../../Maths/math.vector";
import { VertexData } from "../../mesh.vertexData";

/**
 * Cap mode for the extrusion
 */
export enum ExtrudeGeometryCap {
    /** No caps — only the extruded side walls are generated */
    NoCap = 0,
    /** Cap the bottom face (the original input geometry face) */
    CapStart = 1,
    /** Cap the top face (the offset/extruded geometry face) */
    CapEnd = 2,
    /** Cap both the bottom and top faces (default). Creates a solid */
    CapAll = 3,
}

/**
 * Block used to extrude a geometry along its face normals
 */
export class ExtrudeGeometryBlock extends NodeGeometryBlock {
    /**
     * Gets or sets a boolean indicating that this block can evaluate context
     * Build performance is improved when this value is set to false as the system will cache values instead of reevaluating everything per context change
     */
    @editableInPropertyPage("Evaluate context", PropertyTypeForEdition.Boolean, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
    public evaluateContext = false;

    /**
     * Gets or sets the cap mode for the extrusion
     */
    @editableInPropertyPage("Cap", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "No Cap", value: ExtrudeGeometryCap.NoCap },
            { label: "Cap Start", value: ExtrudeGeometryCap.CapStart },
            { label: "Cap End", value: ExtrudeGeometryCap.CapEnd },
            { label: "Cap All", value: ExtrudeGeometryCap.CapAll },
        ],
    })
    public cap = ExtrudeGeometryCap.CapAll;

    /**
     * Create a new ExtrudeGeometryBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("depth", NodeGeometryBlockConnectionPointTypes.Float, true, 1.0);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ExtrudeGeometryBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the depth input component
     */
    public get depth(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        const func = (state: NodeGeometryBuildState) => {
            const inputGeometry = this.geometry.getConnectedValue(state) as VertexData;

            if (!inputGeometry || !inputGeometry.positions || !inputGeometry.indices) {
                return null;
            }

            const vertexData = inputGeometry.clone();
            const positions = vertexData.positions!;
            const indices = vertexData.indices!;
            const depthValue: number = this.depth.getConnectedValue(state) ?? 1.0;

            if (depthValue === 0) {
                return vertexData;
            }

            // Step 2: Compute average face normal
            const normal = new Vector3(0, 0, 0);
            const v0 = new Vector3();
            const v1 = new Vector3();
            const v2 = new Vector3();
            const edge1 = new Vector3();
            const edge2 = new Vector3();
            const faceNormal = new Vector3();

            for (let i = 0; i < indices.length; i += 3) {
                const i0 = indices[i];
                const i1 = indices[i + 1];
                const i2 = indices[i + 2];

                v0.set(positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]);
                v1.set(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
                v2.set(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);

                v1.subtractToRef(v0, edge1);
                v2.subtractToRef(v0, edge2);
                Vector3.CrossToRef(edge1, edge2, faceNormal);

                normal.addInPlace(faceNormal);
            }

            if (normal.lengthSquared() < 1e-10) {
                normal.set(0, 1, 0);
            } else {
                normal.normalize();
            }

            // Step 3: Create offset positions
            const offset = normal.scale(depthValue);
            const vertexCount = positions.length / 3;
            const bottomPositions = new Float32Array(positions);
            const topPositions = new Float32Array(vertexCount * 3);

            for (let i = 0; i < vertexCount; i++) {
                topPositions[i * 3] = positions[i * 3] + offset.x;
                topPositions[i * 3 + 1] = positions[i * 3 + 1] + offset.y;
                topPositions[i * 3 + 2] = positions[i * 3 + 2] + offset.z;
            }

            // Step 4: Detect boundary edges
            const edgeCount = new Map<string, { count: number; triIndex: number }>();
            for (let i = 0; i < indices.length; i += 3) {
                const triIdx = i;
                const triVerts = [indices[i], indices[i + 1], indices[i + 2]];

                for (let e = 0; e < 3; e++) {
                    const a = triVerts[e];
                    const b = triVerts[(e + 1) % 3];
                    const key = Math.min(a, b) + "_" + Math.max(a, b);

                    const existing = edgeCount.get(key);
                    if (existing) {
                        existing.count++;
                    } else {
                        edgeCount.set(key, { count: 1, triIndex: triIdx });
                    }
                }
            }

            // Collect boundary edges with winding info
            const boundaryEdges: { a: number; b: number; orderedAb: boolean }[] = [];
            for (const [key, value] of Array.from(edgeCount)) {
                if (value.count === 1) {
                    const parts = key.split("_");
                    const minV = parseInt(parts[0]);
                    const maxV = parseInt(parts[1]);

                    // Check original winding order in the triangle
                    const ti = value.triIndex;
                    const t0 = indices[ti];
                    const t1 = indices[ti + 1];
                    const t2 = indices[ti + 2];

                    // Determine if edge (minV, maxV) appears in order or reversed in the triangle
                    let inOrder = false;
                    if ((t0 === minV && t1 === maxV) || (t1 === minV && t2 === maxV) || (t2 === minV && t0 === maxV)) {
                        inOrder = true;
                    }

                    boundaryEdges.push({ a: minV, b: maxV, orderedAb: inOrder });
                }
            }

            // Step 5: Generate side wall faces
            const sideIndices: number[] = [];
            for (const edge of boundaryEdges) {
                const a = edge.a;
                const b = edge.b;
                const aTop = a + vertexCount;
                const bTop = b + vertexCount;

                if (edge.orderedAb) {
                    // Edge appears as (a, b) in triangle — outward normals
                    sideIndices.push(a, b, bTop);
                    sideIndices.push(a, bTop, aTop);
                } else {
                    // Edge appears as (b, a) in triangle — reverse winding
                    sideIndices.push(b, a, aTop);
                    sideIndices.push(b, aTop, bTop);
                }
            }

            // Step 6: Assemble final VertexData
            const capStart = (this.cap & ExtrudeGeometryCap.CapStart) !== 0;
            const capEnd = (this.cap & ExtrudeGeometryCap.CapEnd) !== 0;

            // Build indices
            const finalIndices: number[] = [];

            // Bottom cap: original indices
            if (capStart) {
                for (let i = 0; i < indices.length; i++) {
                    finalIndices.push(indices[i]);
                }
            }

            // Top cap: original indices offset by vertexCount, reversed winding
            if (capEnd) {
                for (let i = 0; i < indices.length; i += 3) {
                    finalIndices.push(indices[i] + vertexCount);
                    finalIndices.push(indices[i + 2] + vertexCount);
                    finalIndices.push(indices[i + 1] + vertexCount);
                }
            }

            // Side walls
            for (let i = 0; i < sideIndices.length; i++) {
                finalIndices.push(sideIndices[i]);
            }

            // Build positions: [bottom, top]
            const finalPositions = new Float32Array(vertexCount * 2 * 3);
            finalPositions.set(bottomPositions, 0);
            finalPositions.set(topPositions, vertexCount * 3);

            // Build the result VertexData
            const result = new VertexData();
            result.positions = Array.from(finalPositions);
            result.indices = finalIndices;

            // Duplicate UVs if present
            if (vertexData.uvs) {
                const uvs = vertexData.uvs;
                const finalUVs = new Float32Array(vertexCount * 2 * 2);
                finalUVs.set(new Float32Array(uvs), 0);
                finalUVs.set(new Float32Array(uvs), vertexCount * 2);
                result.uvs = Array.from(finalUVs);
            }

            // Duplicate colors if present
            if (vertexData.colors) {
                const colors = vertexData.colors;
                const finalColors = new Float32Array(vertexCount * 2 * 4);
                finalColors.set(new Float32Array(colors), 0);
                finalColors.set(new Float32Array(colors), vertexCount * 4);
                result.colors = Array.from(finalColors);
            }

            // Duplicate tangents if present
            if (vertexData.tangents) {
                const tangents = vertexData.tangents;
                const finalTangents = new Float32Array(vertexCount * 2 * 4);
                finalTangents.set(new Float32Array(tangents), 0);
                finalTangents.set(new Float32Array(tangents), vertexCount * 4);
                result.tangents = Array.from(finalTangents);
            }

            // Duplicate UV2-UV6 if present
            const uvSets = ["uvs2", "uvs3", "uvs4", "uvs5", "uvs6"] as const;
            for (const uvSet of uvSets) {
                const uvData = (vertexData as any)[uvSet];
                if (uvData) {
                    const finalUV = new Float32Array(vertexCount * 2 * 2);
                    finalUV.set(new Float32Array(uvData), 0);
                    finalUV.set(new Float32Array(uvData), vertexCount * 2);
                    (result as any)[uvSet] = Array.from(finalUV);
                }
            }

            // Compute normals using the simplified approach
            const normals: number[] = [];
            VertexData.ComputeNormals(result.positions, result.indices, normals);
            result.normals = normals;

            return result;
        };

        if (this.evaluateContext) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = null;
            this.output._storedValue = func(state);
        }
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.evaluateContext = ${this.evaluateContext ? "true" : "false"};\n`;
        codeString += `${this._codeVariableName}.cap = BABYLON.ExtrudeGeometryCap.${ExtrudeGeometryCap[this.cap]};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.evaluateContext = this.evaluateContext;
        serializationObject.cap = this.cap;

        return serializationObject;
    }

    /** @internal */
    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.evaluateContext !== undefined) {
            this.evaluateContext = serializationObject.evaluateContext;
        }
        if (serializationObject.cap !== undefined) {
            this.cap = serializationObject.cap;
        }
    }
}

RegisterClass("BABYLON.ExtrudeGeometryBlock", ExtrudeGeometryBlock);
