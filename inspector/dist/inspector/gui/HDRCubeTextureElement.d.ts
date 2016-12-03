declare module INSPECTOR {
    /**
    * Display a very small div. A new canvas is created, with a new Babylon.js scene, containing only the
    * cube texture in a cube
    */
    class HDRCubeTextureElement extends CubeTextureElement {
        /** The texture given as a parameter should be cube. */
        constructor(tex: BABYLON.Texture);
        /** Creates the box  */
        protected _populateScene(): void;
    }
}
