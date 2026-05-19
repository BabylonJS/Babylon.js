import { type VertexBuffer } from "../Buffers/buffer";
import { type Nullable } from "../types";
declare module "./mesh.pure" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Mesh {
        /**
         * Register a custom buffer that will be instanced
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances#custom-buffers
         * @param kind defines the buffer kind
         * @param stride defines the stride in floats
         */
        registerInstancedBuffer(kind: string, stride: number): void;

        /**
         * Invalidate VertexArrayObjects belonging to the mesh (but not to the Geometry of the mesh).
         */
        _invalidateInstanceVertexArrayObject(): void;

        /**
         * true to use the edge renderer for all instances of this mesh
         */
        edgesShareWithInstances: boolean;

        /** @internal */
        _userInstancedBuffersStorage: {
            /** @internal */
            data: { [key: string]: Float32Array };
            /** @internal */
            sizes: { [key: string]: number };
            /** @internal */
            vertexBuffers: { [key: string]: Nullable<VertexBuffer> };
            /** @internal */
            strides: { [key: string]: number };
            /** @internal */
            vertexArrayObjects?: { [key: string]: WebGLVertexArrayObject };
            /** @internal */
            renderPasses?: {
                [renderPassId: number]: { [kind: string]: Nullable<VertexBuffer> };
            };
        };
    }
}
declare module "./abstractMesh.pure" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /**
         * Object used to store instanced buffers defined by user
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances#custom-buffers
         */
        instancedBuffers: { [key: string]: any };
    }
}
