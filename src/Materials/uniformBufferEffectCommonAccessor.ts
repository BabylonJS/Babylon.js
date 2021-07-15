import { IColor3Like, IColor4Like, IMatrixLike, IVector3Like, IVector4Like } from "../Maths/math.like";
import { Effect } from "./effect";
import { UniformBuffer } from "./uniformBuffer";

/** @hidden */
export class UniformBufferEffectCommonAccessor {
    public setMatrix3x3: (name: string, matrix: Float32Array) => void;

    public setMatrix2x2: (name: string, matrix: Float32Array) => void;

    public setFloat: (name: string, x: number) => void;

    public setFloat2: (name: string, x: number, y: number, suffix?: string) => void;

    public setFloat3: (name: string, x: number, y: number, z: number, suffix?: string) => void;

    public setFloat4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;

    public setFloatArray: (name: string, array: Float32Array) => void;

    public setArray: (name: string, array: number[]) => void;

    public setIntArray: (name: string, array: Int32Array) => void;

    public setMatrix: (name: string, mat: IMatrixLike) => void;

    public setMatrices:  (name: string, mat: Float32Array) => void;

    public setVector3: (name: string, vector: IVector3Like) => void;

    public setVector4: (name: string, vector: IVector4Like) => void;

    public setColor3: (name: string, color: IColor3Like, suffix?: string) => void;

    public setColor4: (name: string, color: IColor3Like, alpha: number, suffix?: string) => void;

    public setDirectColor4: (name: string, color: IColor4Like) => void;

    public setInt: (name: string, x: number, suffix?: string) => void;

    public setInt2: (name: string, x: number, y: number, suffix?: string) => void;

    public setInt3: (name: string, x: number, y: number, z: number, suffix?: string) => void;

    public setInt4: (name: string, x: number, y: number, z: number, w: number, suffix?: string) => void;

    private _isUbo(uboOrEffect: UniformBuffer | Effect): uboOrEffect is UniformBuffer {
        return (uboOrEffect as UniformBuffer).addUniform !== undefined;
    }

    constructor(uboOrEffect: UniformBuffer | Effect) {
        if (this._isUbo(uboOrEffect)) {
            this.setMatrix3x3 = uboOrEffect.updateMatrix3x3.bind(uboOrEffect);
            this.setMatrix2x2 = uboOrEffect.updateMatrix2x2.bind(uboOrEffect);
            this.setFloat = uboOrEffect.updateFloat.bind(uboOrEffect);
            this.setFloat2 = uboOrEffect.updateFloat2.bind(uboOrEffect);
            this.setFloat3 = uboOrEffect.updateFloat3.bind(uboOrEffect);
            this.setFloat4 = uboOrEffect.updateFloat4.bind(uboOrEffect);
            this.setFloatArray = uboOrEffect.updateFloatArray.bind(uboOrEffect);
            this.setArray = uboOrEffect.updateArray.bind(uboOrEffect);
            this.setIntArray = uboOrEffect.updateIntArray.bind(uboOrEffect);
            this.setMatrix = uboOrEffect.updateMatrix.bind(uboOrEffect);
            this.setMatrices = uboOrEffect.updateMatrices.bind(uboOrEffect);
            this.setVector3 = uboOrEffect.updateVector3.bind(uboOrEffect);
            this.setVector4 = uboOrEffect.updateVector4.bind(uboOrEffect);
            this.setColor3 = uboOrEffect.updateColor3.bind(uboOrEffect);
            this.setColor4 = uboOrEffect.updateColor4.bind(uboOrEffect);
            this.setDirectColor4 = uboOrEffect.updateDirectColor4.bind(uboOrEffect);
            this.setInt = uboOrEffect.updateInt.bind(uboOrEffect);
            this.setInt2 = uboOrEffect.updateInt2.bind(uboOrEffect);
            this.setInt3 = uboOrEffect.updateInt3.bind(uboOrEffect);
            this.setInt4 = uboOrEffect.updateInt4.bind(uboOrEffect);
        } else {
            this.setMatrix3x3 = uboOrEffect.setMatrix3x3.bind(uboOrEffect);
            this.setMatrix2x2 = uboOrEffect.setMatrix2x2.bind(uboOrEffect);
            this.setFloat = uboOrEffect.setFloat.bind(uboOrEffect);
            this.setFloat2 = uboOrEffect.setFloat2.bind(uboOrEffect);
            this.setFloat3 = uboOrEffect.setFloat3.bind(uboOrEffect);
            this.setFloat4 = uboOrEffect.setFloat4.bind(uboOrEffect);
            this.setFloatArray = uboOrEffect.setFloatArray.bind(uboOrEffect);
            this.setArray = uboOrEffect.setArray.bind(uboOrEffect);
            this.setIntArray = uboOrEffect.setIntArray.bind(uboOrEffect);
            this.setMatrix = uboOrEffect.setMatrix.bind(uboOrEffect);
            this.setMatrices = uboOrEffect.setMatrices.bind(uboOrEffect);
            this.setVector3 = uboOrEffect.setVector3.bind(uboOrEffect);
            this.setVector4 = uboOrEffect.setVector4.bind(uboOrEffect);
            this.setColor3 = uboOrEffect.setColor3.bind(uboOrEffect);
            this.setColor4 = uboOrEffect.setColor4.bind(uboOrEffect);
            this.setDirectColor4 = uboOrEffect.setDirectColor4.bind(uboOrEffect);
            this.setInt = uboOrEffect.setInt.bind(uboOrEffect);
            this.setInt2 = uboOrEffect.setInt2.bind(uboOrEffect);
            this.setInt3 = uboOrEffect.setInt3.bind(uboOrEffect);
            this.setInt4 = uboOrEffect.setInt4.bind(uboOrEffect);
        }
    }
}
