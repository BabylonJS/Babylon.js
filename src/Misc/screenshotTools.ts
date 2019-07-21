import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { FxaaPostProcess } from "../PostProcesses/fxaaPostProcess";
import { Constants } from "../Engines/constants";
import { Logger } from "./logger";
import { _TypeStore } from "./typeStore";
import { Tools } from './tools';

declare type Engine = import("../Engines/engine").Engine;

/**
 * Class containing a set of static utilities functions for screenshots
 */
export class ScreenshotTools {
    /**
     * Captures a screenshot of the current rendering
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine defines the rendering engine
     * @param camera defines the source camera
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param successCallback defines the callback receives a single parameter which contains the
     * screenshot as a string of base64-encoded characters. This string can be assigned to the
     * src parameter of an <img> to display it
     * @param mimeType defines the MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     */
    public static CreateScreenshot(engine: Engine, camera: Camera, size: any, successCallback?: (data: string) => void, mimeType: string = "image/png"): void {
        var width: number;
        var height: number;

        // If a precision value is specified
        if (size.precision) {
            width = Math.round(engine.getRenderWidth() * size.precision);
            height = Math.round(width / engine.getAspectRatio(camera));
        }
        else if (size.width && size.height) {
            width = size.width;
            height = size.height;
        }
        //If passing only width, computing height to keep display canvas ratio.
        else if (size.width && !size.height) {
            width = size.width;
            height = Math.round(width / engine.getAspectRatio(camera));
        }
        //If passing only height, computing width to keep display canvas ratio.
        else if (size.height && !size.width) {
            height = size.height;
            width = Math.round(height * engine.getAspectRatio(camera));
        }
        //Assuming here that "size" parameter is a number
        else if (!isNaN(size)) {
            height = size;
            width = size;
        }
        else {
            Logger.Error("Invalid 'size' parameter !");
            return;
        }

        if (!Tools._ScreenshotCanvas) {
            Tools._ScreenshotCanvas = document.createElement('canvas');
        }

        Tools._ScreenshotCanvas.width = width;
        Tools._ScreenshotCanvas.height = height;

        var renderContext = Tools._ScreenshotCanvas.getContext("2d");

        var ratio = engine.getRenderWidth() / engine.getRenderHeight();
        var newWidth = width;
        var newHeight = newWidth / ratio;
        if (newHeight > height) {
            newHeight = height;
            newWidth = newHeight * ratio;
        }

        var offsetX = Math.max(0, width - newWidth) / 2;
        var offsetY = Math.max(0, height - newHeight) / 2;

        var renderingCanvas = engine.getRenderingCanvas();
        if (renderContext && renderingCanvas) {
            renderContext.drawImage(renderingCanvas, offsetX, offsetY, newWidth, newHeight);
        }

        Tools.EncodeScreenshotCanvasData(successCallback, mimeType);
    }

    /**
     * Captures a screenshot of the current rendering
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine defines the rendering engine
     * @param camera defines the source camera
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param mimeType defines the MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @returns screenshot as a string of base64-encoded characters. This string can be assigned
     * to the src parameter of an <img> to display it
     */
    public static CreateScreenshotAsync(engine: Engine, camera: Camera, size: any, mimeType: string = "image/png"): Promise<string> {
        return new Promise((resolve, reject) => {
            ScreenshotTools.CreateScreenshot(engine, camera, size, (data) => {
                if (typeof(data) !== "undefined") {
                    resolve(data);
                } else {
                    reject(new Error("Data is undefined"));
                }
            }, mimeType);
        });
    }

    /**
     * Generates an image screenshot from the specified camera.
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine The engine to use for rendering
     * @param camera The camera to use for rendering
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param successCallback The callback receives a single parameter which contains the
     * screenshot as a string of base64-encoded characters. This string can be assigned to the
     * src parameter of an <img> to display it
     * @param mimeType The MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param samples Texture samples (default: 1)
     * @param antialiasing Whether antialiasing should be turned on or not (default: false)
     * @param fileName A name for for the downloaded file.
     */
    public static CreateScreenshotUsingRenderTarget(engine: Engine, camera: Camera, size: any, successCallback?: (data: string) => void, mimeType: string = "image/png", samples: number = 1, antialiasing: boolean = false, fileName?: string): void {
        var width: number;
        var height: number;

        //If a precision value is specified
        if (size.precision) {
            width = Math.round(engine.getRenderWidth() * size.precision);
            height = Math.round(width / engine.getAspectRatio(camera));
            size = { width: width, height: height };
        }
        else if (size.width && size.height) {
            width = size.width;
            height = size.height;
        }
        //If passing only width, computing height to keep display canvas ratio.
        else if (size.width && !size.height) {
            width = size.width;
            height = Math.round(width / engine.getAspectRatio(camera));
            size = { width: width, height: height };
        }
        //If passing only height, computing width to keep display canvas ratio.
        else if (size.height && !size.width) {
            height = size.height;
            width = Math.round(height * engine.getAspectRatio(camera));
            size = { width: width, height: height };
        }
        //Assuming here that "size" parameter is a number
        else if (!isNaN(size)) {
            height = size;
            width = size;
        }
        else {
            Logger.Error("Invalid 'size' parameter !");
            return;
        }

        var scene = camera.getScene();
        var previousCamera: Nullable<Camera> = null;

        if (scene.activeCamera !== camera) {
            previousCamera = scene.activeCamera;
            scene.activeCamera = camera;
        }

        var renderCanvas = engine.getRenderingCanvas();
        if (!renderCanvas) {
            Logger.Error("No rendering canvas found !");
            return;
        }

        var originalSize = { width: renderCanvas.width, height: renderCanvas.height };
        engine.setSize(width, height);
        scene.render();

        // At this point size can be a number, or an object (according to engine.prototype.createRenderTargetTexture method)
        var texture = new RenderTargetTexture("screenShot", size, scene, false, false, Constants.TEXTURETYPE_UNSIGNED_INT, false, Texture.NEAREST_SAMPLINGMODE);
        texture.renderList = null;
        texture.samples = samples;
        if (antialiasing) {
            texture.addPostProcess(new FxaaPostProcess('antialiasing', 1.0, scene.activeCamera));
        }
        texture.onAfterRenderObservable.add(() => {
            Tools.DumpFramebuffer(width, height, engine, successCallback, mimeType, fileName);
        });

        scene.incrementRenderId();
        scene.resetCachedMaterial();
        texture.render(true);
        texture.dispose();

        if (previousCamera) {
            scene.activeCamera = previousCamera;
        }
        engine.setSize(originalSize.width, originalSize.height);
        camera.getProjectionMatrix(true); // Force cache refresh;
    }

    /**
     * Generates an image screenshot from the specified camera.
     * @see http://doc.babylonjs.com/how_to/render_scene_on_a_png
     * @param engine The engine to use for rendering
     * @param camera The camera to use for rendering
     * @param size This parameter can be set to a single number or to an object with the
     * following (optional) properties: precision, width, height. If a single number is passed,
     * it will be used for both width and height. If an object is passed, the screenshot size
     * will be derived from the parameters. The precision property is a multiplier allowing
     * rendering at a higher or lower resolution
     * @param mimeType The MIME type of the screenshot image (default: image/png).
     * Check your browser for supported MIME types
     * @param samples Texture samples (default: 1)
     * @param antialiasing Whether antialiasing should be turned on or not (default: false)
     * @param fileName A name for for the downloaded file.
     * @returns screenshot as a string of base64-encoded characters. This string can be assigned
     * to the src parameter of an <img> to display it
     */
    public static CreateScreenshotUsingRenderTargetAsync(engine: Engine, camera: Camera, size: any, mimeType: string = "image/png", samples: number = 1, antialiasing: boolean = false, fileName?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            ScreenshotTools.CreateScreenshotUsingRenderTarget(engine, camera, size, (data) => {
                if (typeof(data) !== "undefined") {
                    resolve(data);
                } else {
                    reject(new Error("Data is undefined"));
                }
            }, mimeType, samples, antialiasing, fileName);
        });
    }
}

Tools.CreateScreenshot = ScreenshotTools.CreateScreenshot;
Tools.CreateScreenshotAsync = ScreenshotTools.CreateScreenshotAsync;
Tools.CreateScreenshotUsingRenderTarget = ScreenshotTools.CreateScreenshotUsingRenderTarget;
Tools.CreateScreenshotUsingRenderTargetAsync = ScreenshotTools.CreateScreenshotUsingRenderTargetAsync;
