import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { Vector3 } from "../../../Maths/math.vector";
import { Scalar } from "../../../Maths/math.scalar";
import { NodeGeometryContextualSources } from "../Enums/nodeGeometryContextualSources";

/**
 * Block used to get a noise value
 */
export class NoiseBlock extends NodeGeometryBlock {
    /**
     * Create a new NoiseBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("offset", NodeGeometryBlockConnectionPointTypes.Vector3, true, Vector3.Zero());
        this.registerInput("scale", NodeGeometryBlockConnectionPointTypes.Float, true, 1);

        this.registerInput("octaves", NodeGeometryBlockConnectionPointTypes.Float, true, 2, 0, 16);
        this.registerInput("roughness", NodeGeometryBlockConnectionPointTypes.Float, true, 0.5, 0, 1);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "NoiseBlock";
    }

    /**
     * Gets the offset input component
     */
    public get offset(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the scale input component
     */
    public get scale(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the octaves input component
     */
    public get octaves(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the roughtness input component
     */
    public get roughness(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    private _negateIf(value: number, condition: number) {
        return condition !== 0 ? -value : value;
    }

    private _noiseGrad(hash: number, x: number, y: number, z: number) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const vt = h === 12 || h == 14 ? x : z;
        const v = h < 4 ? y : vt;
        return this._negateIf(u, h & u) + this._negateIf(v, h & 2);
    }

    private _fade(t: number) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    private _hashBitRotate(x: number, k: number) {
        return (x << k) | (x >> (32 - k));
    }

    private _hash(kx: number, ky: number, kz: number) {
        let a: number, b: number, c: number;
        a = b = c = 0xdeadbeef + (3 << 2) + 13;

        c += kz;
        b += ky;
        a += kx;

        c ^= b;
        c -= this._hashBitRotate(b, 14);
        a ^= c;
        a -= this._hashBitRotate(c, 11);
        b ^= a;
        b -= this._hashBitRotate(a, 25);
        c ^= b;
        c -= this._hashBitRotate(b, 16);
        a ^= c;
        a -= this._hashBitRotate(c, 4);
        b ^= a;
        b -= this._hashBitRotate(a, 14);
        c ^= b;
        c -= this._hashBitRotate(b, 24);

        return c;
    }

    private _mix(v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, x: number, y: number, z: number) {
        const x1 = 1.0 - x;
        const y1 = 1.0 - y;
        const z1 = 1.0 - z;
        return z1 * (y1 * (v0 * x1 + v1 * x) + y * (v2 * x1 + v3 * x)) + z * (y1 * (v4 * x1 + v5 * x) + y * (v6 * x1 + v7 * x));
    }

    private _perlinNoise(position: Vector3) {
        const X = (position.x | 0) - (position.x < 0 ? 1 : 0);
        const Y = (position.y | 0) - (position.y < 0 ? 1 : 0);
        const Z = (position.z | 0) - (position.z < 0 ? 1 : 0);

        const fx = position.x - X;
        const fy = position.y - Y;
        const fz = position.z - Z;

        const u = this._fade(fx);
        const v = this._fade(fy);
        const w = this._fade(fz);

        return this._mix(
            this._noiseGrad(this._hash(X, Y, Z), fx, fy, fz),
            this._noiseGrad(this._hash(X + 1, Y, Z), fx - 1, fy, fz),
            this._noiseGrad(this._hash(X, Y + 1, Z), fx, fy - 1, fz),
            this._noiseGrad(this._hash(X + 1, Y + 1, Z), fx - 1, fy - 1, fz),
            this._noiseGrad(this._hash(X, Y, Z + 1), fx, fy, fz - 1),
            this._noiseGrad(this._hash(X + 1, Y, Z + 1), fx - 1, fy, fz - 1),
            this._noiseGrad(this._hash(X, Y + 1, Z + 1), fx, fy - 1, fz - 1),
            this._noiseGrad(this._hash(X + 1, Y + 1, Z + 1), fx - 1, fy - 1, fz - 1),
            u,
            v,
            w
        );
    }

    private _perlinSigned(position: Vector3) {
        return this._perlinNoise(position) * 0.982;
    }

    private _perlin(position: Vector3) {
        return this._perlinSigned(position) / 2.0 + 0.5;
    }

    /**
     * Gets a perlin noise value
     * @param octaves number of octaves
     * @param roughness roughness
     * @param _position position vector
     * @param offset offset vector
     * @param scale scale value
     * @returns a value between 0 and 1
     * @see Based on https://github.com/blender/blender/blob/main/source/blender/blenlib/intern/noise.cc#L533
     */
    public noise(octaves: number, roughness: number, _position: Vector3, offset: Vector3, scale: number) {
        const position = new Vector3(_position.x * scale + offset.x, _position.y * scale + offset.y, _position.z * scale + offset.z);

        let fscale = 1.0;
        let amp = 1.0;
        let maxamp = 0.0;
        let sum = 0.0;
        octaves = Scalar.Clamp(octaves, 0, 15.0);
        const step = octaves | 0;

        for (let i = 0; i <= step; i++) {
            const t = this._perlin(position.scale(fscale));
            sum += t * amp;
            maxamp += amp;
            amp *= Scalar.Clamp(roughness, 0.0, 1.0);
            fscale *= 2.0;
        }

        const rmd = octaves - Math.floor(octaves);
        if (rmd == 0.0) {
            return sum / maxamp;
        }

        const t = this._perlin(position.scale(fscale));
        let sum2 = sum + t * amp;
        sum /= maxamp;
        sum2 /= maxamp + amp;
        return (1.0 - rmd) * sum + rmd * sum2;
    }

    protected _buildBlock() {
        this.output._storedFunction = (state) => {
            const position = state.getContextualValue(NodeGeometryContextualSources.Positions) as Vector3;
            const octaves = this.octaves.getConnectedValue(state);
            const roughness = this.roughness.getConnectedValue(state);

            const offset = this.offset.getConnectedValue(state) as Vector3;
            const scale = this.scale.getConnectedValue(state);

            return this.noise(octaves, roughness, position, offset, scale);
        };
    }
}

RegisterClass("BABYLON.NoiseBlock", NoiseBlock);
