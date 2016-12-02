declare class Test {
    private engine;
    scene: BABYLON.Scene;
    constructor(canvasId: string);
    private _run();
    private _initScene();
    private _initGame();
    /**
     * Create the canvas2D
     */
    private _createCanvas();
}
