declare module INSPECTOR {
    /**
    * Display a very small div corresponding to the given texture. On mouse over, display the full image
    */
    class TextureElement extends BasicElement {
        /** The big div displaying the full image */
        private _textureDiv;
        constructor(tex: BABYLON.Texture);
        update(tex?: BABYLON.Texture): void;
        private _showViewer(mode);
    }
}
