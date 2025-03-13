import { Vector3, Vector2 } from "core/Maths/math.vector";

/**
 * Interface representing a generic flow graph matrix.
 */
export interface IFlowGraphMatrix<VectorType> {
    /**
     * The matrix elements stored in a row-major order.
     */
    m: number[];

    /**
     * Transforms a vector using this matrix.
     *
     * @param v - The vector to transform.
     * @returns The transformed vector.
     */
    transformVector(v: VectorType): VectorType;

    /**
     * Transforms a vector using this matrix and stores the result in a reference vector.
     *
     * @param v - The vector to transform.
     * @param result - The vector to store the result.
     * @returns The transformed vector.
     */
    transformVectorToRef(v: VectorType, result: VectorType): VectorType;

    /**
     * Returns the matrix elements as an array.
     *
     * @returns The matrix elements as an array.
     */
    asArray(): number[];

    /**
     * Copies the matrix elements to an array.
     *
     * @param emptyArray - The array to copy the elements to.
     * @returns The array with the matrix elements.
     */
    toArray(emptyArray: number[]): number[];

    /**
     * Sets the matrix elements from an array.
     *
     * @param array - The array containing the matrix elements.
     * @returns The updated matrix.
     */
    fromArray(array: number[]): IFlowGraphMatrix<VectorType>;

    /**
     * Multiplies this matrix with another matrix and stores the result in a reference matrix.
     *
     * @param other - The matrix to multiply with.
     * @param result - The matrix to store the result.
     * @returns The result matrix.
     */
    multiplyToRef(other: IFlowGraphMatrix<VectorType>, result: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Multiplies this matrix with another matrix.
     * To staz conform with the Matrix class, this does B * A
     *
     * @param other - The matrix to multiply with.
     * @returns The result matrix.
     */
    multiply(other: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Divides this matrix by another matrix and stores the result in a reference matrix.
     *
     * @param other - The matrix to divide by.
     * @param result - The matrix to store the result.
     * @returns The result matrix.
     */
    divideToRef(other: IFlowGraphMatrix<VectorType>, result: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Divides this matrix by another matrix.
     *
     * @param other - The matrix to divide by.
     * @returns The result matrix.
     */
    divide(other: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Adds another matrix to this matrix and stores the result in a reference matrix.
     *
     * @param other - The matrix to add.
     * @param result - The matrix to store the result.
     * @returns The result matrix.
     */
    addToRef(other: IFlowGraphMatrix<VectorType>, result: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Adds another matrix to this matrix.
     *
     * @param other - The matrix to add.
     * @returns The result matrix.
     */
    add(other: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Subtracts another matrix from this matrix and stores the result in a reference matrix.
     *
     * @param other - The matrix to subtract.
     * @param result - The matrix to store the result.
     * @returns The result matrix.
     */
    subtractToRef(other: IFlowGraphMatrix<VectorType>, result: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Subtracts another matrix from this matrix.
     *
     * @param other - The matrix to subtract.
     * @returns The result matrix.
     */
    subtract(other: IFlowGraphMatrix<VectorType>): IFlowGraphMatrix<VectorType>;

    /**
     * Transposes this matrix.
     *
     * @returns The transposed matrix.
     */
    transpose(): IFlowGraphMatrix<VectorType>;

    /**
     * Computes the determinant of this matrix.
     *
     * @returns The determinant of the matrix.
     */
    determinant(): number;

    /**
     * Computes the inverse of this matrix.
     *
     * @returns The inverse of the matrix.
     * @throws Error if the matrix is not invertible.
     */
    inverse(): IFlowGraphMatrix<VectorType>;

    /**
     * Gets the class name of this matrix.
     *
     * @returns The class name.
     */
    getClassName(): string;

    /**
     * Checks if this matrix is equal to another matrix within an optional epsilon.
     *
     * @param other - The matrix to compare with.
     * @param epsilon - The optional epsilon for comparison.
     * @returns True if the matrices are equal, false otherwise.
     */
    equals(other: IFlowGraphMatrix<VectorType>, epsilon?: number): boolean;
}

// Note - the matrix classes are basically column-major, and work similarly to Babylon.js' Matrix class.

/**
 * A 2x2 matrix.
 */
export class FlowGraphMatrix2D implements IFlowGraphMatrix<Vector2> {
    /**
     * @internal
     */
    public _m: number[];

    constructor(m: number[] = [1, 0, 0, 1]) {
        this._m = m;
    }

    public get m(): number[] {
        return this._m;
    }

    public transformVector(v: Vector2): Vector2 {
        return this.transformVectorToRef(v, new Vector2());
    }

    public transformVectorToRef(v: Vector2, result: Vector2): Vector2 {
        result.x = v.x * this._m[0] + v.y * this._m[1];
        result.y = v.x * this._m[2] + v.y * this._m[3];
        return result;
    }

    public asArray(): number[] {
        return this.toArray();
    }

    public toArray(emptyArray: number[] = []): number[] {
        for (let i = 0; i < 4; i++) {
            emptyArray[i] = this._m[i];
        }
        return emptyArray;
    }

    public fromArray(array: number[]): FlowGraphMatrix2D {
        for (let i = 0; i < 4; i++) {
            this._m[i] = array[i];
        }
        return this;
    }

    public multiplyToRef(other: FlowGraphMatrix2D, result: FlowGraphMatrix2D): FlowGraphMatrix2D {
        const otherMatrix = other._m;
        const thisMatrix = this._m;
        const r = result._m;
        // other * this
        r[0] = otherMatrix[0] * thisMatrix[0] + otherMatrix[1] * thisMatrix[2];
        r[1] = otherMatrix[0] * thisMatrix[1] + otherMatrix[1] * thisMatrix[3];
        r[2] = otherMatrix[2] * thisMatrix[0] + otherMatrix[3] * thisMatrix[2];
        r[3] = otherMatrix[2] * thisMatrix[1] + otherMatrix[3] * thisMatrix[3];

        return result;
    }

    public multiply(other: FlowGraphMatrix2D): FlowGraphMatrix2D {
        return this.multiplyToRef(other, new FlowGraphMatrix2D());
    }

    public divideToRef(other: FlowGraphMatrix2D, result: FlowGraphMatrix2D): FlowGraphMatrix2D {
        const m = this._m;
        const o = other._m;
        const r = result._m;

        r[0] = m[0] / o[0];
        r[1] = m[1] / o[1];
        r[2] = m[2] / o[2];
        r[3] = m[3] / o[3];

        return result;
    }

    public divide(other: FlowGraphMatrix2D): FlowGraphMatrix2D {
        return this.divideToRef(other, new FlowGraphMatrix2D());
    }

    public addToRef(other: FlowGraphMatrix2D, result: FlowGraphMatrix2D): FlowGraphMatrix2D {
        const m = this._m;
        const o = other.m;
        const r = result.m;

        r[0] = m[0] + o[0];
        r[1] = m[1] + o[1];
        r[2] = m[2] + o[2];
        r[3] = m[3] + o[3];

        return result;
    }

    public add(other: FlowGraphMatrix2D): FlowGraphMatrix2D {
        return this.addToRef(other, new FlowGraphMatrix2D());
    }

    public subtractToRef(other: FlowGraphMatrix2D, result: FlowGraphMatrix2D): FlowGraphMatrix2D {
        const m = this._m;
        const o = other.m;
        const r = result.m;

        r[0] = m[0] - o[0];
        r[1] = m[1] - o[1];
        r[2] = m[2] - o[2];
        r[3] = m[3] - o[3];

        return result;
    }

    public subtract(other: FlowGraphMatrix2D): FlowGraphMatrix2D {
        return this.subtractToRef(other, new FlowGraphMatrix2D());
    }

    public transpose(): FlowGraphMatrix2D {
        const m = this._m;
        return new FlowGraphMatrix2D([m[0], m[2], m[1], m[3]]);
    }

    public determinant(): number {
        const m = this._m;
        return m[0] * m[3] - m[1] * m[2];
    }

    public inverse(): FlowGraphMatrix2D {
        const det = this.determinant();
        if (det === 0) {
            throw new Error("Matrix is not invertible");
        }
        const m = this._m;
        const invDet = 1 / det;
        return new FlowGraphMatrix2D([m[3] * invDet, -m[1] * invDet, -m[2] * invDet, m[0] * invDet]);
    }

    public equals(other: IFlowGraphMatrix<Vector2>, epsilon: number = 0): boolean {
        const m = this._m;
        const o = other.m;
        if (epsilon === 0) {
            return m[0] === o[0] && m[1] === o[1] && m[2] === o[2] && m[3] === o[3];
        }
        return Math.abs(m[0] - o[0]) < epsilon && Math.abs(m[1] - o[1]) < epsilon && Math.abs(m[2] - o[2]) < epsilon && Math.abs(m[3] - o[3]) < epsilon;
    }

    public getClassName(): string {
        return "FlowGraphMatrix2D";
    }

    public toString(): string {
        return `FlowGraphMatrix2D(${this._m.join(", ")})`;
    }
}

/**
 * A 3x3 matrix.
 */
export class FlowGraphMatrix3D implements IFlowGraphMatrix<Vector3> {
    /**
     * @internal
     */
    public _m: number[];

    constructor(array: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
        this._m = array;
    }

    public get m(): number[] {
        return this._m;
    }

    public transformVector(v: Vector3): Vector3 {
        return this.transformVectorToRef(v, new Vector3());
    }

    public transformVectorToRef(v: Vector3, result: Vector3): Vector3 {
        const m = this._m;
        result.x = v.x * m[0] + v.y * m[1] + v.z * m[2];
        result.y = v.x * m[3] + v.y * m[4] + v.z * m[5];
        result.z = v.x * m[6] + v.y * m[7] + v.z * m[8];
        return result;
    }

    public multiplyToRef(other: FlowGraphMatrix3D, result: FlowGraphMatrix3D): FlowGraphMatrix3D {
        const otherMatrix = other._m;
        const thisMatrix = this._m;
        const r = result.m;

        r[0] = otherMatrix[0] * thisMatrix[0] + otherMatrix[1] * thisMatrix[3] + otherMatrix[2] * thisMatrix[6];
        r[1] = otherMatrix[0] * thisMatrix[1] + otherMatrix[1] * thisMatrix[4] + otherMatrix[2] * thisMatrix[7];
        r[2] = otherMatrix[0] * thisMatrix[2] + otherMatrix[1] * thisMatrix[5] + otherMatrix[2] * thisMatrix[8];

        r[3] = otherMatrix[3] * thisMatrix[0] + otherMatrix[4] * thisMatrix[3] + otherMatrix[5] * thisMatrix[6];
        r[4] = otherMatrix[3] * thisMatrix[1] + otherMatrix[4] * thisMatrix[4] + otherMatrix[5] * thisMatrix[7];
        r[5] = otherMatrix[3] * thisMatrix[2] + otherMatrix[4] * thisMatrix[5] + otherMatrix[5] * thisMatrix[8];

        r[6] = otherMatrix[6] * thisMatrix[0] + otherMatrix[7] * thisMatrix[3] + otherMatrix[8] * thisMatrix[6];
        r[7] = otherMatrix[6] * thisMatrix[1] + otherMatrix[7] * thisMatrix[4] + otherMatrix[8] * thisMatrix[7];
        r[8] = otherMatrix[6] * thisMatrix[2] + otherMatrix[7] * thisMatrix[5] + otherMatrix[8] * thisMatrix[8];

        return result;
    }

    public multiply(other: FlowGraphMatrix3D): FlowGraphMatrix3D {
        return this.multiplyToRef(other, new FlowGraphMatrix3D());
    }

    public divideToRef(other: FlowGraphMatrix3D, result: FlowGraphMatrix3D): FlowGraphMatrix3D {
        const m = this._m;
        const o = other.m;
        const r = result.m;

        r[0] = m[0] / o[0];
        r[1] = m[1] / o[1];
        r[2] = m[2] / o[2];
        r[3] = m[3] / o[3];
        r[4] = m[4] / o[4];
        r[5] = m[5] / o[5];
        r[6] = m[6] / o[6];
        r[7] = m[7] / o[7];
        r[8] = m[8] / o[8];

        return result;
    }

    public divide(other: FlowGraphMatrix3D): FlowGraphMatrix3D {
        return this.divideToRef(other, new FlowGraphMatrix3D());
    }

    public addToRef(other: FlowGraphMatrix3D, result: FlowGraphMatrix3D): FlowGraphMatrix3D {
        const m = this._m;
        const o = other.m;
        const r = result.m;

        r[0] = m[0] + o[0];
        r[1] = m[1] + o[1];
        r[2] = m[2] + o[2];
        r[3] = m[3] + o[3];
        r[4] = m[4] + o[4];
        r[5] = m[5] + o[5];
        r[6] = m[6] + o[6];
        r[7] = m[7] + o[7];
        r[8] = m[8] + o[8];

        return result;
    }

    public add(other: FlowGraphMatrix3D): FlowGraphMatrix3D {
        return this.addToRef(other, new FlowGraphMatrix3D());
    }

    public subtractToRef(other: FlowGraphMatrix3D, result: FlowGraphMatrix3D): FlowGraphMatrix3D {
        const m = this._m;
        const o = other.m;
        const r = result.m;

        r[0] = m[0] - o[0];
        r[1] = m[1] - o[1];
        r[2] = m[2] - o[2];
        r[3] = m[3] - o[3];
        r[4] = m[4] - o[4];
        r[5] = m[5] - o[5];
        r[6] = m[6] - o[6];
        r[7] = m[7] - o[7];
        r[8] = m[8] - o[8];

        return result;
    }

    public subtract(other: FlowGraphMatrix3D): FlowGraphMatrix3D {
        return this.subtractToRef(other, new FlowGraphMatrix3D());
    }

    public toArray(emptyArray: number[] = []): number[] {
        for (let i = 0; i < 9; i++) {
            emptyArray[i] = this._m[i];
        }
        return emptyArray;
    }

    public asArray(): number[] {
        return this.toArray();
    }

    public fromArray(array: number[]): FlowGraphMatrix3D {
        for (let i = 0; i < 9; i++) {
            this._m[i] = array[i];
        }
        return this;
    }

    public transpose(): FlowGraphMatrix3D {
        const m = this._m;
        return new FlowGraphMatrix3D([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
    }

    public determinant(): number {
        const m = this._m;
        return m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
    }

    public inverse(): FlowGraphMatrix3D {
        const det = this.determinant();
        if (det === 0) {
            throw new Error("Matrix is not invertible");
        }
        const m = this._m;
        const invDet = 1 / det;
        return new FlowGraphMatrix3D([
            (m[4] * m[8] - m[5] * m[7]) * invDet,
            (m[2] * m[7] - m[1] * m[8]) * invDet,
            (m[1] * m[5] - m[2] * m[4]) * invDet,
            (m[5] * m[6] - m[3] * m[8]) * invDet,
            (m[0] * m[8] - m[2] * m[6]) * invDet,
            (m[2] * m[3] - m[0] * m[5]) * invDet,
            (m[3] * m[7] - m[4] * m[6]) * invDet,
            (m[1] * m[6] - m[0] * m[7]) * invDet,
            (m[0] * m[4] - m[1] * m[3]) * invDet,
        ]);
    }

    public equals(other: IFlowGraphMatrix<Vector3>, epsilon: number = 0): boolean {
        const m = this._m;
        const o = other.m;
        // performance shortcut
        if (epsilon === 0) {
            return m[0] === o[0] && m[1] === o[1] && m[2] === o[2] && m[3] === o[3] && m[4] === o[4] && m[5] === o[5] && m[6] === o[6] && m[7] === o[7] && m[8] === o[8];
        }
        return (
            Math.abs(m[0] - o[0]) < epsilon &&
            Math.abs(m[1] - o[1]) < epsilon &&
            Math.abs(m[2] - o[2]) < epsilon &&
            Math.abs(m[3] - o[3]) < epsilon &&
            Math.abs(m[4] - o[4]) < epsilon &&
            Math.abs(m[5] - o[5]) < epsilon &&
            Math.abs(m[6] - o[6]) < epsilon &&
            Math.abs(m[7] - o[7]) < epsilon &&
            Math.abs(m[8] - o[8]) < epsilon
        );
    }

    public getClassName(): string {
        return "FlowGraphMatrix3D";
    }

    public toString(): string {
        return `FlowGraphMatrix3D(${this._m.join(", ")})`;
    }
}
