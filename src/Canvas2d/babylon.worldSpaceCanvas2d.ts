module BABYLON {
    export class WorldSpaceCanvas2d extends Mesh {
        constructor(name: string, scene: Scene, canvas: Canvas2D) {
            super(name, scene);

            this._canvas = canvas;
        }
        private _canvas: Canvas2D;

    }
}