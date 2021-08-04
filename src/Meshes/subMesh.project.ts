import { Constants } from "../Engines/constants";
import { TmpVectors, Vector3 } from "../Maths/math.vector";
import { IndicesArray } from "../types";
import { SubMesh } from "./subMesh";

declare module "./subMesh" {
    export interface SubMesh {
        /** @hidden */
        _projectOnTrianglesToRef(vector: Vector3, positions: Vector3[], indices: IndicesArray, step: number, checkStopper: boolean, ref: Vector3): number;
        /** @hidden */
        _projectOnUnIndexedTrianglesToRef(vector: Vector3, positions: Vector3[], indices: IndicesArray, ref: Vector3): number;
        /**
         * Projects a point on this submesh and stores the result in "ref"
         *
         * @param vector point to project
         * @param positions defines mesh's positions array
         * @param indices defines mesh's indices array
         * @param ref vector that will store the result
         * @returns distance from the point and the submesh, or -1 if the mesh rendering mode doesn't support projections
         */
        projectToRef(vector: Vector3, positions: Vector3[], indices: IndicesArray, ref: Vector3): number;
    }
}

/** @hidden */
SubMesh.prototype._projectOnTrianglesToRef = function (vector: Vector3, positions: Vector3[], indices: IndicesArray, step: number, checkStopper: boolean, ref: Vector3): number {
    // Triangles test
    var proj = TmpVectors.Vector3[0];
    var tmp = TmpVectors.Vector3[1];
    var distance = +Infinity;

    for (var index = this.indexStart; index < this.indexStart + this.indexCount - (3 - step); index += step) {
        const indexA = indices[index];
        const indexB = indices[index + 1];
        const indexC = indices[index + 2];

        if (checkStopper && indexC === 0xffffffff) {
            index += 2;
            continue;
        }

        var p0 = positions[indexA];
        var p1 = positions[indexB];
        var p2 = positions[indexC];

        // stay defensive and don't check against undefined positions.
        if (!p0 || !p1 || !p2) {
            continue;
        }

        var tmpDist = Vector3.ProjectOnTriangleToRef(vector, p0, p1, p2, tmp);
        if (tmpDist < distance) {
            proj.copyFrom(tmp);
            distance = tmpDist;
        }
    }

    ref.copyFrom(proj);

    return distance;
};

/** @hidden */
SubMesh.prototype._projectOnUnIndexedTrianglesToRef = function (vector: Vector3, positions: Vector3[], indices: IndicesArray, ref: Vector3): number {
    // Triangles test
    var proj = TmpVectors.Vector3[0];
    var tmp = TmpVectors.Vector3[1];
    var distance = +Infinity;

    for (var index = this.verticesStart; index < this.verticesStart + this.verticesCount; index += 3) {
        var p0 = positions[index];
        var p1 = positions[index + 1];
        var p2 = positions[index + 2];

        var tmpDist = Vector3.ProjectOnTriangleToRef(vector, p0, p1, p2, tmp);
        if (tmpDist < distance) {
            proj.copyFrom(tmp);
            distance = tmpDist;
        }
    }

    ref.copyFrom(proj);

    return distance;
};

SubMesh.prototype.projectToRef = function (vector: Vector3, positions: Vector3[], indices: IndicesArray, ref: Vector3): number {
    const material = this.getMaterial();
    if (!material) {
        return -1;
    }
    let step = 3;
    let checkStopper = false;

    switch (material.fillMode) {
        case Constants.MATERIAL_PointListDrawMode:
        case Constants.MATERIAL_LineListDrawMode:
        case Constants.MATERIAL_LineLoopDrawMode:
        case Constants.MATERIAL_LineStripDrawMode:
        case Constants.MATERIAL_TriangleFanDrawMode:
            return -1;
        case Constants.MATERIAL_TriangleStripDrawMode:
            step = 1;
            checkStopper = true;
            break;
        default:
            break;
    }

    // LineMesh first as it's also a Mesh...
    if ((this as any)._mesh.getClassName() === "InstancedLinesMesh" || (this as any)._mesh.getClassName() === "LinesMesh") {
        return -1;
    } else {
        // Check if mesh is unindexed
        if (!indices.length && (this as any)._mesh._unIndexed) {
            return this._projectOnUnIndexedTrianglesToRef(vector, positions, indices, ref);
        }

        return this._projectOnTrianglesToRef(vector, positions, indices, step, checkStopper, ref);
    }
};
