import { type Nullable } from "../types";
import { type AbstractMesh } from "../Meshes/abstractMesh";
import { type ShaderMaterial } from "../Materials/shaderMaterial";
import { type EdgesRenderer } from "./edgesRenderer.pure";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _edgeRenderLineShader: Nullable<ShaderMaterial>;
    }
}
declare module "../Meshes/abstractMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /**
         * Gets the edgesRenderer associated with the mesh
         */
        edgesRenderer: Nullable<EdgesRenderer>;
    }
}
declare module "../Meshes/linesMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface LinesMesh {
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the currentAbstractMesh
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): AbstractMesh;
    }
}
declare module "../Meshes/linesMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface InstancedLinesMesh {
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the current InstancedLinesMesh
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): InstancedLinesMesh;
    }
}
