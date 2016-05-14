module BABYLON {
    /**
     * This is the class that is used to display a World Space Canvas into a scene
     */
    export class WorldSpaceCanvas2d extends Mesh {
        constructor(name: string, scene: Scene, canvas: Canvas2D) {
            super(name, scene);

            this._canvas = canvas;
        }

        public dispose(): void {
            super.dispose();
            if (this._canvas) {
                this._canvas.dispose();
                this._canvas = null;
            }
        }

        private _canvas: Canvas2D;
    }
}