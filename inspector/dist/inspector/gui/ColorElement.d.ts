declare module INSPECTOR {
    /**
    * Display a very small div corresponding to the given color
    */
    class ColorElement extends BasicElement {
        constructor(color: BABYLON.Color4 | BABYLON.Color3);
        update(color?: BABYLON.Color4 | BABYLON.Color3): void;
        private _toRgba(color);
    }
}
