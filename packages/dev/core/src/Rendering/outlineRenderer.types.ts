import { type OutlineRenderer } from "./outlineRenderer.pure";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _outlineRenderer: OutlineRenderer;

        /**
         * Gets the outline renderer associated with the scene
         * @returns a OutlineRenderer
         */
        getOutlineRenderer(): OutlineRenderer;
    }
}
declare module "../Meshes/abstractMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal (Backing field) */
        _renderOutline: boolean;
        /**
         * Gets or sets a boolean indicating if the outline must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#3
         */
        renderOutline: boolean;

        /** @internal (Backing field) */
        _renderOverlay: boolean;
        /**
         * Gets or sets a boolean indicating if the overlay must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#2
         */
        renderOverlay: boolean;
    }
}
