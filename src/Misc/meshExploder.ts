import { Mesh } from "../Meshes/mesh";
import { Vector3 } from "../Maths/math";

/**
 * Class used to explode meshes.
 */
export class MeshExploder {
    private _centerMesh: Mesh;
    private _centerOrigin: Vector3;
    private _meshes: Array<Mesh>;
    private _meshesOrigins: Array<Vector3>;
    private _originsVectors: Array<Vector3>;
    private _scaledDirection: Vector3 = Vector3.Zero();

    /**
     * Explodes meshes from a center mesh.
     * @param meshes The meshes to explode.
     * @param centerMesh The mesh to be center of explosion.
     */
    constructor(meshes: Array<Mesh>, centerMesh?: Mesh) {

        this._meshes = meshes;
        this._meshesOrigins = [];
        this._originsVectors = [];

        if (centerMesh) {
            this._centerMesh = centerMesh;
        } else {
            this._setCenterMesh();
        }
        this._centerMesh.computeWorldMatrix();
        if (this._centerMesh._boundingInfo) {
            this._centerOrigin = this._centerMesh._boundingInfo.boundingBox.centerWorld;
        }
        if (this._meshes.indexOf(this._centerMesh) >= 0) {
            this._meshes.splice(this._meshes.indexOf(this._centerMesh), 1);
        }
        if (this._meshes.length > 1) {
            for (var index = 0; index < this._meshes.length; index++) {
                if (this._meshes[index]) {
                    var mesh = this._meshes[index];
                    mesh.computeWorldMatrix();
                    if (mesh._boundingInfo) {
                        var meshCenter = mesh._boundingInfo.boundingBox.centerWorld;
                        this._meshesOrigins.push(meshCenter.clone());
                        this._originsVectors.push(meshCenter.subtract(this._centerOrigin));
                    }
                }
            }
        }
    }

    private _setCenterMesh(): void {
        var averageCenter = Vector3.Zero();
        var totalCenters = Vector3.Zero();
        var shortestToCenter = Number.MAX_VALUE;
        for (var index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                var mesh = this._meshes[index];
                if (mesh._boundingInfo) {
                    totalCenters.addInPlace(mesh._boundingInfo.boundingBox.centerWorld);
                }
            }
        }
        averageCenter = totalCenters.scale(1 / this._meshes.length);
        for (var index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                var mesh = this._meshes[index];
                if (mesh._boundingInfo) {
                    var distanceToCenter = mesh._boundingInfo.boundingBox.centerWorld.subtract(averageCenter).length();
                    if (distanceToCenter < shortestToCenter) {
                        this._centerMesh = mesh;
                        shortestToCenter = distanceToCenter;
                    }
                }
            }
        }
    }

    /**
     * "MeshExploder"
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
        var meshArray: Array<Mesh> = [];
        meshArray = this._meshes.slice();
        meshArray.unshift(this._centerMesh);
        return meshArray;
    }

    /**
     * Explodes mesh a given number of times.
     * @param direction Number to multiply distance of each mesh's origin from center. Use a negative number to implode, or zero to reset.
     */
    public explode(direction: number = 1.0): void {
        this._scaledDirection = Vector3.Zero();
        for (var index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index] && this._originsVectors[index]) {
                this._originsVectors[index].scaleToRef(direction, this._scaledDirection);
                this._meshesOrigins[index].addToRef(this._scaledDirection, this._meshes[index].position);
            }
        }
    }
}