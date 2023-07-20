import type { Nullable, FloatArray, IndicesArray } from "../../types";
import type { IGetSetVerticesData } from "../mesh.vertexData";

/**
 * Defines a node based geometry
 */
export class NodeGeometry implements IGetSetVerticesData {
    isVerticesDataPresent(kind: string): boolean {
        throw new Error("Method not implemented.");
    }
    getVerticesData(kind: string, copyWhenShared?: boolean | undefined, forceCopy?: boolean | undefined): Nullable<FloatArray> {
        throw new Error("Method not implemented.");
    }
    getIndices(copyWhenShared?: boolean | undefined, forceCopy?: boolean | undefined): Nullable<IndicesArray> {
        throw new Error("Method not implemented.");
    }
    setVerticesData(kind: string, data: FloatArray, updatable: boolean): void {
        throw new Error("Method not implemented.");
    }
    updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean | undefined, makeItUnique?: boolean | undefined): void {
        throw new Error("Method not implemented.");
    }
    setIndices(indices: IndicesArray, totalVertices: Nullable<number>, updatable?: boolean | undefined): void {
        throw new Error("Method not implemented.");
    }
}
