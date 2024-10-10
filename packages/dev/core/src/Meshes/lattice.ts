import { Vector3 } from "core/Maths/math.vector";
import type { Mesh } from "./mesh";
import type { FloatArray } from "core/types";
import { VertexBuffer } from "./buffer";
import { Clamp } from "core/Maths/math.scalar.functions";

/**
 * Interface used to define options for creating a lattice
 */
export interface ILatticeOptions {
    /** resolution on x axis */
    resolutionX: number;
    /** resolution on y axis */
    resolutionY: number;
    /** resolution on z axis */
    resolutionZ: number;
    /** the lattice position in object space */
    position: Vector3;
    /** size of the lattice along each axis in object space */
    size: Vector3;
    /** Optional mesh to adapt the size to */
    autoAdaptToMesh?: Mesh;
}

/**
 * Class used to represent a lattice
 * #MDVD75#18 - Moving lattice bounds
 * #MDVD75#23 - Twist
 */
export class Lattice {
    private _resolutionX: number;
    private _resolutionY: number;
    private _resolutionZ: number;
    private _position: Vector3;
    private _size: Vector3;

    private _data: Vector3[][][];

    // Cache
    private _min = new Vector3(-0.5, -0.5, -0.5);
    private _max = new Vector3(0.5, 0.5, 0.5);
    private _localPos = new Vector3();
    private _tmpVector = new Vector3();
    private _lerpVector0 = new Vector3();
    private _lerpVector1 = new Vector3();
    private _lerpVector2 = new Vector3();
    private _lerpVector3 = new Vector3();
    private _lerpVector4 = new Vector3();
    private _lerpVector5 = new Vector3();

    /**
     * @returns the string "Lattice"
     */
    public getClassName(): string {
        return "Lattice";
    }

    /**
     * Gets the resolution on x axis
     */
    public get resolutionX(): number {
        return this._resolutionX;
    }

    /**
     * Gets the resolution on y axis
     */
    public get resolutionY(): number {
        return this._resolutionY;
    }

    /**
     * Gets the resolution on z axis
     */
    public get resolutionZ(): number {
        return this._resolutionZ;
    }

    /**
     * Gets the size of the lattice along each axis in object space
     * Updating the size requires you to call update afterwards
     */
    public get size(): Vector3 {
        return this._size;
    }

    /**
     * Gets the lattice position in object space
     */
    public get position(): Vector3 {
        return this._position;
    }

    /**
     * Gets the data of the lattice
     */
    public get data(): Vector3[][][] {
        return this._data;
    }

    /**
     * Creates a new Lattice
     * @param options options for creating
     */
    public constructor(options?: Partial<ILatticeOptions>) {
        const localOptions: ILatticeOptions = {
            resolutionX: 3,
            resolutionY: 3,
            resolutionZ: 3,
            position: Vector3.Zero(),
            size: Vector3.One(),
            ...options,
        };

        this._resolutionX = localOptions.resolutionX;
        this._resolutionY = localOptions.resolutionY;
        this._resolutionZ = localOptions.resolutionZ;
        this._position = localOptions.position;
        this._size = localOptions.autoAdaptToMesh ? localOptions.autoAdaptToMesh.getBoundingInfo().boundingBox.extendSize.scale(2) : localOptions.size;

        // Allocate data
        this._allocateData();
        this.update();
    }

    private _allocateData() {
        this._data = new Array<Array<Array<Vector3>>>(this.resolutionX);
        for (let i = 0; i < this.resolutionX; i++) {
            this._data[i] = new Array<Array<Vector3>>(this.resolutionY);
            for (let j = 0; j < this.resolutionY; j++) {
                this._data[i][j] = new Array<Vector3>(this.resolutionZ);
                for (let k = 0; k < this.resolutionZ; k++) {
                    this._data[i][j][k] = Vector3.Zero();
                }
            }
        }
    }

    /**
     * Update of the lattice data
     */
    public update() {
        for (let i = 0; i < this.resolutionX; i++) {
            for (let j = 0; j < this.resolutionY; j++) {
                for (let k = 0; k < this.resolutionZ; k++) {
                    const x = -this.size.x / 2 + this.size.x * (i / (this.resolutionX - 1));
                    const y = -this.size.y / 2 + this.size.y * (j / (this.resolutionY - 1));
                    const z = -this.size.z / 2 + this.size.z * (k / (this.resolutionZ - 1));

                    this._data[i][j][k].set(x, y, z);
                }
            }
        }
    }

    /**
     * Apply the lattice to a mesh
     * @param mesh mesh to deform
     */
    public deformMesh(mesh: Mesh) {
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind);

        if (!positions) {
            return;
        }

        // Apply the lattice
        this.deform(positions);

        // Update back the mesh
        mesh.setVerticesData(VertexBuffer.PositionKind, positions, true);
    }

    /**
     * Apply the lattice to a set of points
     * @param positions vertex data to deform
     * @param target optional target array to store the result (operation will be done in place in not defined)
     */
    public deform(positions: FloatArray, target?: FloatArray) {
        const nx = this._resolutionX;
        const ny = this._resolutionY;
        const nz = this._resolutionZ;

        // Calculate the size of each cell in the lattice
        const cellSize = new Vector3(this.size.x / (nx - 1), this.size.y / (ny - 1), this.size.z / (nz - 1));

        // Calculate the lattice bounds
        this._min.set(this.position.x - this.size.x / 2, this.position.y - this.size.y / 2, this.position.z - this.size.z / 2);
        this._min.addToRef(this._size, this._max);

        const min = this._min;
        const max = this._max;

        // Loop over each vertex
        for (let i = 0; i < positions.length; i += 3) {
            const vertex = this._tmpVector.fromArray(positions, i);

            // Check we are inside
            if (vertex.x < min.x || vertex.x > max.x || vertex.y < min.y || vertex.y > max.y || vertex.z < min.z || vertex.z > max.z) {
                if (target) {
                    vertex.toArray(target, i);
                }
                continue;
            }

            // Map vertex position to lattice local coordinates
            const localPos = this._localPos.set((vertex.x - min.x) / cellSize.x, (vertex.y - min.y) / cellSize.y, (vertex.z - min.z) / cellSize.z);

            // Get integer lattice indices
            const i0 = Math.floor(localPos.x);
            const j0 = Math.floor(localPos.y);
            const k0 = Math.floor(localPos.z);

            const i1 = Math.min(i0 + 1, nx - 1);
            const j1 = Math.min(j0 + 1, ny - 1);
            const k1 = Math.min(k0 + 1, nz - 1);

            // Compute interpolation weights
            const tx = localPos.x - i0;
            const ty = localPos.y - j0;
            const tz = localPos.z - k0;

            // Ensure indices are within bounds
            const ii0 = Clamp(i0, 0, nx - 1);
            const jj0 = Clamp(j0, 0, ny - 1);
            const kk0 = Clamp(k0, 0, nz - 1);
            const ii1 = Clamp(i1, 0, nx - 1);
            const jj1 = Clamp(j1, 0, ny - 1);
            const kk1 = Clamp(k1, 0, nz - 1);

            // Get lattice control points
            const p000 = this._data[ii0][jj0][kk0];
            const p100 = this._data[ii1][jj0][kk0];
            const p010 = this._data[ii0][jj1][kk0];
            const p110 = this._data[ii1][jj1][kk0];
            const p001 = this._data[ii0][jj0][kk1];
            const p101 = this._data[ii1][jj0][kk1];
            const p011 = this._data[ii0][jj1][kk1];
            const p111 = this._data[ii1][jj1][kk1];

            // Trilinear interpolation
            const p00 = Vector3.LerpToRef(p000, p100, tx, this._lerpVector0);
            const p01 = Vector3.LerpToRef(p001, p101, tx, this._lerpVector1);
            const p10 = Vector3.LerpToRef(p010, p110, tx, this._lerpVector2);
            const p11 = Vector3.LerpToRef(p011, p111, tx, this._lerpVector3);

            const p0 = Vector3.LerpToRef(p00, p10, ty, this._lerpVector4);
            const p1 = Vector3.LerpToRef(p01, p11, ty, this._lerpVector5);

            const deformedPos = Vector3.LerpToRef(p0, p1, tz, this._lerpVector0);
            deformedPos.addInPlace(this.position);

            // Apply deformation to the vertex
            deformedPos.toArray(target || positions, i);
        }
    }
}
