import { type Vector3 } from "../Maths/math.vector";
import { type IndicesArray } from "../types";
declare module "./subMesh.pure" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface SubMesh {
        /** @internal */
        _projectOnTrianglesToRef(vector: Vector3, positions: Vector3[], indices: IndicesArray, step: number, checkStopper: boolean, ref: Vector3): number;
        /** @internal */
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
