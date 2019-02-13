import { Mesh } from "../Meshes/mesh";
import { Vector3 } from "../Maths/math";

/**
 * Class used to explode meshes.
 */
export class ExplodeMeshes {
    private _centerMesh: Mesh;
    private _centerOrigin: Vector3;
    private _meshes: Array<Mesh>;
    private _meshesOrigins: Array<Vector3>;
    private _originsVectors: Array<Vector3>;

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
        } else {
            this._centerOrigin = this._centerMesh.getBoundingInfo().boundingBox.centerWorld;
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
        var positionCount: number = 0;
        var averageCenter = Vector3.Zero();
        var totalCenters = Vector3.Zero();
        var shortestToCenter = Number.MAX_VALUE;
        for (var index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                var mesh = this._meshes[index];
                if (mesh._boundingInfo) {
                    totalCenters.x += mesh._boundingInfo.boundingBox.centerWorld.x;
                    totalCenters.y += mesh._boundingInfo.boundingBox.centerWorld.y;
                    totalCenters.z += mesh._boundingInfo.boundingBox.centerWorld.z;
                    positionCount++;
                }
            }
        }
        averageCenter.x = totalCenters.x / positionCount;
        averageCenter.y = totalCenters.y / positionCount;
        averageCenter.z = totalCenters.z / positionCount;
        for (var index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index]) {
                var mesh = this._meshes[index];
                if (mesh._boundingInfo) {
                    var meshCenter = mesh._boundingInfo.boundingBox.centerWorld;
                    var vectorToCenter = meshCenter.subtract(averageCenter);
                    var distanceToCenter = vectorToCenter.length();
                    if (distanceToCenter < shortestToCenter) {
                        this._centerMesh = mesh;
                        shortestToCenter = distanceToCenter;
                    }
                }
            }
        }
    }

    /**
     * "ExplodeMeshes"
     * @returns "ExplodeMeshes"
     */
    public getClassName(): string {
        return "ExplodeMeshes";
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
     * @param explodeSize The number of times to move meshes away from center in increments equal to original positions.
     */
    public explode(explodeSize: number = 1): void {
        for (var step = 0; step < explodeSize; step++) {
            for (var index = 0; index < this._meshes.length; index++) {
                if (this._meshes[index] && this._originsVectors[index]) {
                    this._meshes[index].position.addInPlace(this._originsVectors[index]);
                }
            }
        }
    }

    /**
     * Implodes mesh a given number of times.
     * @param implodeSize The number of times to move meshes towards center, or beyond. Opposite direction of explode.
     */
    public implode(implodeSize: number = 1): void {
        for (var step = 0; step < implodeSize; step++) {
            for (var index = 0; index < this._meshes.length; index++) {
                if (this._meshes[index] && this._originsVectors[index]) {
                    this._meshes[index].position.subtractInPlace(this._originsVectors[index]);
                }
            }
        }
    }

    /**
     * Resets meshes to original positions.
     */
    public reset(): void {
        for (var index = 0; index < this._meshes.length; index++) {
            if (this._meshes[index] && this._originsVectors[index]) {
                this._meshes[index].position = this._meshesOrigins[index].clone();
            }
        }
    }
}