import type { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";

const _canvasRectUpdateInterval = 500; // Update the canvas rect every 500ms
let _getCanvasRectGenerator: Generator<DOMRect | null> | null = null;
const _maxGetCanvasRectAttempts: number = 10;
let _scene: Scene | null = null;

export const babylonUnitsToPixels = 100;

function* createGetCanvasRectGenerator(scene: Scene, updateInterval: number): Generator<DOMRect | null> {
    let lastCallTime = 0;
    let canvasRect: DOMRect | null = null;

    while (true) {
        const currentTime = Date.now();
        if (currentTime - lastCallTime >= updateInterval) {
            lastCallTime = currentTime;
            // Return the canvas rect, or the last known value
            const newCanvasRect = scene?.getEngine().getRenderingCanvasClientRect();
            if (newCanvasRect) {
                canvasRect = newCanvasRect;
            } else {
                if (canvasRect) {
                    Logger.Warn("Canvas rect became null.  Returning last known value");
                }
                Logger.Warn("Failed to get canvas rect.");
            }
        }
        yield canvasRect;
    }
}

/**
 * Get the canvas rect asynchronously
 * @param scene hosting scene
 * @returns a promise that will resolve to the canvas rect or null if the canvas rect could not be obtained
 */
export const getCanvasRectAsync = (scene: Scene): Promise<DOMRect | null> => {
    ensureGetCanvasRectGeneratorExists(scene);
    return new Promise<DOMRect | null>((resolve) => {
        let attempts = 0;
        const intervalId = setInterval(() => {
            const result = _getCanvasRectGenerator!.next();
            if (result.value !== null) {
                clearInterval(intervalId);
                resolve(result.value);
            } else {
                attempts++;
                if (attempts >= _maxGetCanvasRectAttempts) {
                    clearInterval(intervalId);
                    Logger.Warn("Exceeded maximum number of attempts trying to get canvas rect");
                    resolve(null);
                }
            }
        }, _canvasRectUpdateInterval);
    });
};

/**
 * Get the canvas rect
 * @param scene hosting scene
 * @returns the canvas rect or null if the canvas rect could not be obtained
 */
export const getCanvasRectOrNull = (scene: Scene): DOMRect | null => {
    ensureGetCanvasRectGeneratorExists(scene);
    const result = _getCanvasRectGenerator!.next();
    return result.value;
};

const ensureGetCanvasRectGeneratorExists = (scene: Scene) => {
    if (!_getCanvasRectGenerator || scene !== _scene) {
        _getCanvasRectGenerator = createGetCanvasRectGenerator(scene, _canvasRectUpdateInterval);
        _scene = scene;
    }
};
