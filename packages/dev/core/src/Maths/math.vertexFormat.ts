import { Vector3, Vector2 } from './math.vector';

/**
 * Contains position and normal vectors for a vertex
 */
export class PositionNormalVertex {
    /**
     * Creates a PositionNormalVertex
     * @param position the position of the vertex (defaut: 0,0,0)
     * @param normal the normal of the vertex (defaut: 0,1,0)
     */
    constructor(
        /** the position of the vertex (defaut: 0,0,0) */
        public position: Vector3 = Vector3.Zero(),
        /** the normal of the vertex (defaut: 0,1,0) */
        public normal: Vector3 = Vector3.Up()
    ) {

    }

    /**
     * Clones the PositionNormalVertex
     * @returns the cloned PositionNormalVertex
     */
    public clone(): PositionNormalVertex {
        return new PositionNormalVertex(this.position.clone(), this.normal.clone());
    }
}

/**
 * Contains position, normal and uv vectors for a vertex
 */
export class PositionNormalTextureVertex {
    /**
     * Creates a PositionNormalTextureVertex
     * @param position the position of the vertex (defaut: 0,0,0)
     * @param normal the normal of the vertex (defaut: 0,1,0)
     * @param uv the uv of the vertex (default: 0,0)
     */
    constructor(
        /** the position of the vertex (defaut: 0,0,0) */
        public position: Vector3 = Vector3.Zero(),
        /** the normal of the vertex (defaut: 0,1,0) */
        public normal: Vector3 = Vector3.Up(),
        /** the uv of the vertex (default: 0,0) */
        public uv: Vector2 = Vector2.Zero()
    ) {

    }
    /**
     * Clones the PositionNormalTextureVertex
     * @returns the cloned PositionNormalTextureVertex
     */
    public clone(): PositionNormalTextureVertex {
        return new PositionNormalTextureVertex(this.position.clone(), this.normal.clone(), this.uv.clone());
    }
}