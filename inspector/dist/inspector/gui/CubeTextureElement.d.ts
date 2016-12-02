declare module INSPECTOR {
    /**
    * Display a very small div. A new canvas is created, with a new Babylon.js scene, containing only the
    * cube texture in a cube
    */
    class CubeTextureElement extends BasicElement {
        /** The big div displaying the full image */
        private _textureDiv;
        private _engine;
        protected _scene: BABYLON.Scene;
        protected _cube: BABYLON.Mesh;
        private _canvas;
        protected _textureUrl: string;
        private _pause;
        /** The texture given as a parameter should be cube. */
        constructor(tex: BABYLON.Texture);
        update(tex?: BABYLON.Texture): void;
        /** Creates the box  */
        protected _populateScene(): void;
        /** Init the babylon engine */
        private _initEngine();
        private _showViewer(mode);
        /** Removes properly the babylon engine */
        dispose(): void;
    }
}
