/**
 * Helper class used to generate a canvas to manipulate images
 */
export class CanvasGenerator {
    /**
     * Create a new canvas (or offscreen canvas depending on the context)
     * @param width defines the expected width
     * @param height defines the expected height
     * @return a new canvas or offscreen canvas
     */
    public static CreateCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
        if (typeof document === "undefined") {
            return new OffscreenCanvas(width, height);
        }

        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }
}