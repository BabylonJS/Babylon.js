import { Vector3 } from "babylonjs/Maths/math.vector";

/**
 * Class used to transport Vector3 information for pointer events
 */
export class Vector3WithInfo extends Vector3 {
    /**
     * Creates a new Vector3WithInfo
     * @param source defines the vector3 data to transport
     * @param buttonIndex defines the current mouse button index
     */
    public constructor(source: Vector3,
        /** defines the current mouse button index */
        public buttonIndex: number = 0) {
        super(source.x, source.y, source.z);
    }
}