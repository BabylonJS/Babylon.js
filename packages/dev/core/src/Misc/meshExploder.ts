import type { Mesh } from "../Meshes/mesh";
import { Vector3 } from "../Maths/math.vector";

/**
 * Class used to explode meshes (ie. to have a center and move them away from that center to better see the overall organization)
 */
export class MeshExploder {
    private _centerMesh: Mesh;
    private _meshes: Array<Mesh>;
    private _meshesOrigins: Array<Vector3> = [];
    private _toCenterVectors: Array<Vector3> = [];
    private _scaledDirection = Vector3.Zero();
    private _newPosition = Vector3.Zero();
    private _centerPosition = Vector3.Zero();

    /**
     * Explodes meshes from a center mesh.
     * @param meshes The meshes to explode.
     * @param centerMesh The mesh to be center of explosion.
     */
    constructor(meshes: Array<Mesh>, centerMesh?: Mesh) {
        this._meshes = meshes.slice();

        if (centerMesh) {
            this._centerMesh = centerMesh;
        } else {
            this._setCenterMesh();
        }
        const centerMeshIndex = this._meshes.indexOf(this._centerMesh);
        if (centerMeshIndex >= 0) {
            this._meshes.splice(centerMeshIndex, 1);
        }
        this._centerPosition = this._centerMesh.getAbsolutePosition().clone();
        for (let index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                const mesh = this._meshes[index];
                this._meshesOrigins[index] = mesh.getAbsolutePosition().clone();
                this._toCenterVectors[index] = Vector3.Zero();
                if (mesh.hasBoundingInfo && this._centerMesh.hasBoundingInfo) {
                    mesh.getBoundingInfo().boundingBox.centerWorld.subtractToRef(this._centerMesh.getBoundingInfo().boundingBox.centerWorld, this._toCenterVectors[index]);
                }
            }
        }
    }

    private _setCenterMesh(): void {
        let averageCenter = Vector3.Zero();
        const totalCenters = Vector3.Zero();
        let shortestToCenter = Number.MAX_VALUE;
        for (let index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                const mesh = this._meshes[index];
                const boundingInfo = mesh.getBoundingInfo();
                if (boundingInfo) {
                    totalCenters.addInPlace(boundingInfo.boundingBox.centerWorld);
                }
            }
        }
        averageCenter = totalCenters.scale(1 / this._meshes.length);
        for (let index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                const mesh = this._meshes[index];
                const boundingInfo = mesh.getBoundingInfo();
                if (boundingInfo) {
                    const distanceToCenter = boundingInfo.boundingBox.centerWorld.subtract(averageCenter).lengthSquared();
                    if (distanceToCenter < shortestToCenter) {
                        this._centerMesh = mesh;
                        shortestToCenter = distanceToCenter;
                    }
                }
            }
        }
    }

    /**
     * Get class name
     * @returns "MeshExploder"
     */
    public getClassName(): string {
        return "MeshExploder";
    }

    /**
     * "Exploded meshes"
     * @returns Array of meshes with the centerMesh at index 0.
     */
    public getMeshes(): Array<Mesh> {
        const meshArray = this._meshes.slice();
        meshArray.unshift(this._centerMesh);
        return meshArray;
    }

    /**
     * Explodes meshes giving a specific direction
     * @param direction Number to multiply distance of each mesh's origin from center. Use a negative number to implode, or zero to reset.
     */
    public explode(direction: number = 1.0): void {
        for (let index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index] && this._meshesOrigins[index] && this._toCenterVectors[index]) {
                this._toCenterVectors[index].scaleToRef(direction, this._scaledDirection);
                this._meshesOrigins[index].addToRef(this._scaledDirection, this._newPosition);
                this._meshes[index].setAbsolutePosition(this._newPosition);
            }
        }
        this._centerMesh.setAbsolutePosition(this._centerPosition);
    }
}
