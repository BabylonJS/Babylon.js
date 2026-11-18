/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/naming-convention */
import { type ISize, type IWheelEvent, type Mesh, type Nullable, type PointerInfo } from "core/index";
import { type Channel } from "./channels";
import { type IMetadata } from "./textureEditor";
import { type ITextureEditorSource } from "./textureEditorSource";

import { Camera } from "core/Cameras/camera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Engine } from "core/Engines/engine";
import { KeyboardEventTypes } from "core/Events/keyboardEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { HtmlElementTexture } from "core/Materials/Textures/htmlElementTexture";
import { Texture } from "core/Materials/Textures/texture";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3, Color4 } from "core/Maths/math.color";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";
import { ApplyChannelsToTextureDataAsync } from "../../misc/textureTools";
import { canvasShader } from "./canvasShader";

// Ensures scene picking (used by the editing tools) and enableEdgesRendering are available.
import "core/Culling/ray";
import "core/Rendering/edgesRenderer";

export type CanvasManagerTool = {
    readonly is3D: boolean;
    activate(): void;
    deactivate(): void;
    reset(): void;
};

export interface IPixelData {
    x?: number;
    y?: number;
    r?: number;
    g?: number;
    b?: number;
    a?: number;
}

/**
 * Converts a WebGL framebuffer readback (bottom-up rows, premultiplied alpha) into top-down, straight-alpha
 * RGBA rows matching canvas image data.
 * @param data - The framebuffer pixels.
 * @param width - The width in pixels.
 * @param height - The height in pixels.
 * @returns The converted pixels.
 */
export function FramebufferToImagePixels(data: Uint8Array | Uint8ClampedArray, width: number, height: number): Uint8Array {
    const rowLength = width * 4;
    const result = new Uint8Array(rowLength * height);
    for (let y = 0; y < height; y++) {
        const sourceStart = (height - y - 1) * rowLength;
        const targetStart = y * rowLength;
        for (let i = 0; i < rowLength; i += 4) {
            const alpha = data[sourceStart + i + 3];
            const target = targetStart + i;
            result[target + 3] = alpha;
            if (alpha === 255) {
                result[target] = data[sourceStart + i];
                result[target + 1] = data[sourceStart + i + 1];
                result[target + 2] = data[sourceStart + i + 2];
            } else if (alpha > 0) {
                result[target] = Math.min(255, Math.round((data[sourceStart + i] * 255) / alpha));
                result[target + 1] = Math.min(255, Math.round((data[sourceStart + i + 1] * 255) / alpha));
                result[target + 2] = Math.min(255, Math.round((data[sourceStart + i + 2] * 255) / alpha));
            }
        }
    }
    return result;
}

export class TextureCanvasManager {
    private readonly _engine: Engine;
    private readonly _scene: Scene;
    private readonly _camera: FreeCamera;
    private readonly _cameraPos: Vector2;

    private _scale: number;
    private _isPanning = false;
    private _mouseX = 0;
    private _mouseY = 0;

    private readonly _uiCanvas: HTMLCanvasElement;

    private _size: ISize = { width: 0, height: 0 };

    /** The canvas we paint onto using the canvas API */
    private readonly _2DCanvas: HTMLCanvasElement;
    /** The canvas we apply post processes to */
    private readonly _3DCanvas: HTMLCanvasElement;
    /** The canvas which handles channel filtering */
    private readonly _channelsTexture: HtmlElementTexture;

    private readonly _3DEngine: Engine;
    private readonly _3DPlane: Mesh;
    private readonly _3DCanvasTexture: HtmlElementTexture;
    private readonly _3DScene: Scene;

    private _channels: Channel[] = [];
    private _face = 0;
    private _mipLevel = 0;

    private readonly _source: ITextureEditorSource;

    private _plane: Nullable<Mesh> = null;
    private readonly _planeMaterial: ShaderMaterial;

    /** Tracks which keys are currently pressed */
    private _keyMap = new Map<string, boolean>();
    /** Tracks which mouse buttons are currently pressed */
    private _buttonsPressed = 0;

    private readonly ZOOM_MOUSE_SPEED = 0.001;
    private readonly ZOOM_KEYBOARD_SPEED = 0.4;
    private readonly ZOOM_IN_KEY = "+";
    private readonly ZOOM_OUT_KEY = "-";

    private readonly PAN_SPEED = 0.003;
    private readonly PAN_KEY = "Space";

    private readonly MIN_SCALE = 0.01;
    private readonly GRID_SCALE = 0.047;
    private readonly MAX_SCALE = 10;

    private readonly SELECT_ALL_KEY = "KeyA";
    private readonly SAVE_KEY = "KeyS";
    private readonly RESET_KEY = "KeyR";
    private readonly DESELECT_KEY = "Escape";

    /** The number of milliseconds between texture updates */
    private readonly PUSH_FREQUENCY = 32;

    private _tool: Nullable<CanvasManagerTool> = null;

    private _setPixelData: (pixelData: IPixelData) => void;
    private _setMipLevel: (mipLevel: number) => void;

    private readonly _window: Window;

    private _metadata: IMetadata;

    private _editing3D = false;

    private readonly _onUpdate: () => void;
    private _setMetadata: (metadata: any) => void;
    private readonly _onError: (message: string) => void;

    private _imageData: Nullable<Uint8Array | Uint8ClampedArray> = null;
    private _canPush = true;
    private _shouldPush = false;
    private _pushGeneration = 0;
    private _activePush: Promise<void> = Promise.resolve();
    private _isDisposed = false;
    private readonly _paintCanvas: HTMLCanvasElement;

    public constructor(
        source: ITextureEditorSource,
        window: Window,
        canvasUI: HTMLCanvasElement,
        canvas2D: HTMLCanvasElement,
        canvas3D: HTMLCanvasElement,
        setPixelData: (pixelData: IPixelData) => void,
        metadata: IMetadata,
        onUpdate: () => void,
        setMetadata: (metadata: any) => void,
        setMipLevel: (level: number) => void,
        onError: (message: string) => void
    ) {
        this._window = window;

        this._uiCanvas = canvasUI;
        this._2DCanvas = canvas2D;
        this._3DCanvas = canvas3D;
        this._paintCanvas = document.createElement("canvas");
        this._setPixelData = setPixelData;
        this._metadata = metadata;
        this._onUpdate = onUpdate;
        this._setMetadata = setMetadata;
        this._setMipLevel = setMipLevel;
        this._onError = onError;

        this._source = source;
        this._engine = new Engine(this._uiCanvas, true);
        this._scene = new Scene(this._engine, { virtual: true });
        this._scene.clearColor = new Color4(0, 0, 0, 0);

        this._camera = new FreeCamera("camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.minZ = 0.5;
        this._camera.maxZ = 1.5;
        this._cameraPos = new Vector2();

        this.setSize(source.size);

        this._channelsTexture = new HtmlElementTexture("ct", this._2DCanvas, {
            engine: this._engine,
            scene: null,
            samplingMode: Texture.NEAREST_SAMPLINGMODE,
            generateMipMaps: true,
        });

        this._3DEngine = new Engine(this._3DCanvas);
        this._3DScene = new Scene(this._3DEngine, { virtual: true });
        this._3DScene.clearColor = new Color4(0, 0, 0, 0);
        this._3DCanvasTexture = new HtmlElementTexture("canvas", this._2DCanvas, { engine: this._3DEngine, scene: this._3DScene });
        this._3DCanvasTexture.hasAlpha = true;
        const cam = new FreeCamera("camera", new Vector3(0, 0, -1), this._3DScene);
        cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
        [cam.orthoBottom, cam.orthoLeft, cam.orthoTop, cam.orthoRight] = [-0.5, -0.5, 0.5, 0.5];
        this._3DPlane = CreatePlane("texture", { width: 1, height: 1 }, this._3DScene);
        this._3DPlane.hasVertexAlpha = true;
        const mat = new StandardMaterial("material", this._3DScene);
        mat.diffuseTexture = this._3DCanvasTexture;
        mat.useAlphaFromDiffuseTexture = true;
        mat.disableLighting = true;
        mat.emissiveColor = Color3.White();
        this._3DPlane.material = mat;

        this._planeMaterial = new ShaderMaterial("canvasShader", this._scene, canvasShader.path, canvasShader.options);

        this.grabOriginalTexture();

        this._planeMaterial.setTexture("textureSampler", this._channelsTexture);
        this._planeMaterial.setFloat("r", 1.0);
        this._planeMaterial.setFloat("g", 1.0);
        this._planeMaterial.setFloat("b", 1.0);
        this._planeMaterial.setFloat("a", 1.0);
        this._planeMaterial.setInt("x1", -1);
        this._planeMaterial.setInt("y1", -1);
        this._planeMaterial.setInt("x2", -1);
        this._planeMaterial.setInt("y2", -1);
        this._planeMaterial.setInt("w", this._size.width);
        this._planeMaterial.setInt("h", this._size.height);
        this._planeMaterial.setInt("time", 0);
        this._planeMaterial.setFloat("showGrid", 0.0);
        if (this._plane) {
            this._plane.material = this._planeMaterial;
        }

        this._window.addEventListener("keydown", (evt) => {
            this._keyMap.set(evt.code, true);
            if (evt.code === this.SELECT_ALL_KEY && evt.ctrlKey) {
                this._setMetadata({
                    select: {
                        x1: 0,
                        y1: 0,
                        x2: this._size.width,
                        y2: this._size.height,
                    },
                });
                evt.preventDefault();
            }
            if (evt.code === this.SAVE_KEY && evt.ctrlKey) {
                this.saveTexture();
                evt.preventDefault();
            }
            if (evt.code === this.RESET_KEY && evt.ctrlKey) {
                this.reset();
                evt.preventDefault();
            }
            if (evt.code === this.DESELECT_KEY) {
                this._setMetadata({
                    select: {
                        x1: -1,
                        y1: -1,
                        x2: -1,
                        y2: -1,
                    },
                });
            }
        });

        this._window.addEventListener("keyup", (evt) => {
            this._keyMap.set(evt.code, false);
        });

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
            this._planeMaterial.setInt("time", new Date().getTime());
        });

        this._scale = 1.5 / Math.max(this._size.width, this._size.height);
        this._isPanning = false;

        this._scene.onBeforeRenderObservable.add(() => {
            this._scale = Math.min(Math.max(this._scale, this.MIN_SCALE / Math.log2(Math.min(this._size.width, this._size.height))), this.MAX_SCALE);
            if (this._scale > this.GRID_SCALE) {
                this._planeMaterial.setFloat("showGrid", 1.0);
            } else {
                this._planeMaterial.setFloat("showGrid", 0.0);
            }
            const ratio = this._uiCanvas?.width / this._uiCanvas?.height;
            const { x, y } = this._cameraPos;
            this._camera.orthoBottom = y - 1 / this._scale;
            this._camera.orthoTop = y + 1 / this._scale;
            this._camera.orthoLeft = x - ratio / this._scale;
            this._camera.orthoRight = x + ratio / this._scale;
        });

        this._scene.onPointerObservable.add((pointerInfo) => {
            const leftButtonPressed = pointerInfo.event.buttons & 1;
            const middleButtonPressed = pointerInfo.event.buttons & 4;
            if (!this._isPanning) {
                if ((leftButtonPressed && !(this._buttonsPressed & 1) && this._keyMap.get(this.PAN_KEY)) || middleButtonPressed) {
                    this._isPanning = true;
                    this._mouseX = pointerInfo.event.x;
                    this._mouseY = pointerInfo.event.y;
                }
                if (middleButtonPressed) {
                    this._isPanning = true;
                }
            } else if ((!leftButtonPressed || !this._keyMap.get(this.PAN_KEY)) && !middleButtonPressed) {
                this._isPanning = false;
            }
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERWHEEL: {
                    const event = pointerInfo.event as IWheelEvent;
                    this._scale -= event.deltaY * this.ZOOM_MOUSE_SPEED * this._scale;
                    break;
                }
                case PointerEventTypes.POINTERMOVE:
                    if (this._isPanning) {
                        this._cameraPos.x -= ((pointerInfo.event.x - this._mouseX) * this.PAN_SPEED) / this._scale;
                        this._cameraPos.y += ((pointerInfo.event.y - this._mouseY) * this.PAN_SPEED) / this._scale;
                        this._mouseX = pointerInfo.event.x;
                        this._mouseY = pointerInfo.event.y;
                    }
                    if (pointerInfo.pickInfo?.hit) {
                        if (this._imageData) {
                            const pos = this.getMouseCoordinates(pointerInfo);
                            const idx = (pos.x + pos.y * this._size.width) * 4;
                            this._setPixelData({
                                x: pos.x,
                                y: pos.y,
                                r: this._imageData[idx],
                                g: this._imageData[idx + 1],
                                b: this._imageData[idx + 2],
                                a: this._imageData[idx + 3],
                            });
                        }
                    } else {
                        this._setPixelData({});
                    }
                    break;
            }
            this._buttonsPressed = pointerInfo.event.buttons;
        });

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this._keyMap.set(kbInfo.event.key, true);
                    switch (kbInfo.event.key) {
                        case this.ZOOM_IN_KEY:
                            this._scale += this.ZOOM_KEYBOARD_SPEED * this._scale;
                            break;
                        case this.ZOOM_OUT_KEY:
                            this._scale -= this.ZOOM_KEYBOARD_SPEED * this._scale;
                            break;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    this._keyMap.set(kbInfo.event.key, false);
                    break;
            }
        });
    }

    public async updateTexture() {
        if (this._isDisposed) {
            return;
        }
        if (this._mipLevel !== 0) {
            this._setMipLevel(0);
        }
        if (this._editing3D) {
            this._3DCanvasTexture.update();
            this._3DScene.render();
        }
        await this.pushTexture();
        this._channelsTexture.element = this._editing3D ? this._3DCanvas : this._2DCanvas;
        this.updateDisplay();
        this._onUpdate();
    }

    private async pushTexture() {
        if (this._canPush) {
            this._canPush = false;
            this._shouldPush = false;
            const push = this._pushPixelsAsync(this._pushGeneration);
            this._activePush = push;
            try {
                await push;
            } finally {
                setTimeout(() => {
                    this._canPush = true;
                    if (this._shouldPush && !this._isDisposed) {
                        void this.pushTexture();
                    }
                }, this.PUSH_FREQUENCY);
            }
        } else {
            this._shouldPush = true;
        }
    }

    private async _pushPixelsAsync(generation: number): Promise<void> {
        try {
            if (this._editing3D) {
                const bufferView = await this._3DEngine.readPixels(0, 0, this._size.width, this._size.height);
                this._imageData = new Uint8Array(bufferView.buffer, 0, bufferView.byteLength);
            } else {
                this._imageData = this._2DCanvas.getContext("2d")!.getImageData(0, 0, this._size.width, this._size.height).data;
            }
            // A reset that started after this push must not be overwritten by the pre-reset pixels.
            if (this._isDisposed || generation !== this._pushGeneration) {
                return;
            }
            const element = this._editing3D ? this._3DCanvas : this._2DCanvas;
            const imageData = this._imageData;
            if (!imageData) {
                throw new Error("The edited texture pixels are not available.");
            }
            // Sources expect top-down, straight-alpha rows like canvas image data.
            const pixels = this._editing3D
                ? FramebufferToImagePixels(imageData, this._size.width, this._size.height)
                : imageData instanceof Uint8Array
                  ? imageData
                  : new Uint8Array(imageData.buffer, imageData.byteOffset, imageData.byteLength);
            await this._source.writePixelsAsync(pixels, element, this._size);
        } catch (error) {
            this._reportError(error);
        }
    }

    public async startPainting(): Promise<CanvasRenderingContext2D> {
        if (this._mipLevel != 0) {
            this._setMipLevel(0);
        }
        let x = 0,
            y = 0,
            w = this._size.width,
            h = this._size.height;
        if (this._metadata.select.x1 != -1) {
            x = this._metadata.select.x1;
            y = this._metadata.select.y1;
            w = this._metadata.select.x2 - this._metadata.select.x1;
            h = this._metadata.select.y2 - this._metadata.select.y1;
        }
        this._paintCanvas.width = w;
        this._paintCanvas.height = h;
        const ctx = this._paintCanvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._2DCanvas, x, y, w, h, 0, 0, w, h);
        return ctx;
    }

    public updatePainting() {
        let x = 0,
            y = 0,
            w = this._size.width,
            h = this._size.height;
        if (this._metadata.select.x1 != -1) {
            x = this._metadata.select.x1;
            y = this._metadata.select.y1;
            w = this._metadata.select.x2 - this._metadata.select.x1;
            h = this._metadata.select.y2 - this._metadata.select.y1;
        }
        let editingAllChannels = true;
        for (const channel of this._channels) {
            if (!channel.editable) {
                editingAllChannels = false;
            }
        }
        let oldData: Uint8ClampedArray;
        if (!editingAllChannels) {
            oldData = this._2DCanvas.getContext("2d")!.getImageData(x, y, w, h).data;
        }
        const ctx = this._paintCanvas.getContext("2d")!;
        const ctx2D = this.canvas2D.getContext("2d")!;
        ctx2D.globalAlpha = 1.0;
        ctx2D.globalCompositeOperation = "destination-out";
        ctx2D.fillStyle = "white";
        ctx2D.fillRect(x, y, w, h);
        ctx2D.imageSmoothingEnabled = false;
        // If we're not editing all channels, we must process the pixel data
        if (!editingAllChannels) {
            const newData = ctx.getImageData(0, 0, w, h);
            const nd = newData.data;
            for (let index = 0; index < this._channels.length; index++) {
                const channel = this._channels[index];
                if (!channel.editable) {
                    for (let i = index; i < w * h * 4; i += 4) {
                        nd[i] = oldData![i];
                    }
                }
            }
            ctx2D.globalCompositeOperation = "source-over";
            ctx2D.globalAlpha = 1.0;
            ctx2D.putImageData(newData, x, y);
        } else {
            ctx2D.globalCompositeOperation = "source-over";
            ctx2D.globalAlpha = 1.0;
            // We want to use drawImage wherever possible since it is much faster than putImageData
            ctx2D.drawImage(ctx.canvas, x, y);
        }
        this.updateTexture();
    }

    public stopPainting(): void {
        this._paintCanvas.getContext("2d")!.clearRect(0, 0, this._paintCanvas.width, this._paintCanvas.height);
    }

    private updateDisplay() {
        this._3DScene.render();
        this._channelsTexture.update(true);
    }

    public set channels(channels: Channel[]) {
        // Determine if we need to re-render the texture. This is an expensive operation, so we should only do it if channel visibility has changed.
        let needsRender = false;
        if (channels.length !== this._channels.length) {
            needsRender = true;
        } else {
            for (let i = 0; i < channels.length; i++) {
                const channel = channels[i];
                if (channel.visible !== this._channels[i].visible) {
                    needsRender = true;
                    this._planeMaterial.setFloat(channel.id.toLowerCase(), channel.visible ? 1.0 : 0.0);
                }
            }
        }
        this._channels = channels;
        if (needsRender) {
            this.updateDisplay();
        }
    }

    public paintPixelsOnCanvas(pixelData: Uint8Array, canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(pixelData);
        ctx.putImageData(imgData, 0, 0);
    }

    public async grabOriginalTexture() {
        try {
            const size = this._source.size;
            const { data, width, height } = await this._source.readPixelsAsync(this._mipLevel, this._face);
            if (this._isDisposed) {
                return new Uint8Array();
            }
            this.setSize(size);
            if (width !== size.width || height !== size.height) {
                const mipCanvas = this._window.document.createElement("canvas");
                mipCanvas.width = width;
                mipCanvas.height = height;
                this.paintPixelsOnCanvas(data, mipCanvas);
                const context = this._2DCanvas.getContext("2d")!;
                context.imageSmoothingEnabled = false;
                context.drawImage(mipCanvas, 0, 0, size.width, size.height);
                this._imageData = context.getImageData(0, 0, size.width, size.height).data;
            } else {
                this._imageData = data;
                this.paintPixelsOnCanvas(data, this._2DCanvas);
            }
            this._3DCanvasTexture.update();
            this.updateDisplay();
            return data;
        } catch (error) {
            this._reportError(error);
            return new Uint8Array();
        }
    }

    public getMouseCoordinates(pointerInfo: PointerInfo) {
        if (pointerInfo.pickInfo?.hit) {
            const x = Math.floor(pointerInfo.pickInfo.getTextureCoordinates()!.x * this._size.width);
            const y = Math.floor((1 - pointerInfo.pickInfo.getTextureCoordinates()!.y) * this._size.height);
            return new Vector2(x, y);
        } else {
            return new Vector2();
        }
    }

    public get scene() {
        return this._scene;
    }

    public get canvas2D() {
        return this._2DCanvas;
    }

    public get size() {
        return this._size;
    }

    public set tool(tool: Nullable<CanvasManagerTool>) {
        if (this._tool) {
            this._tool.deactivate();
        }
        this._tool = tool;
        if (this._tool) {
            this._tool.activate();
            if (this._editing3D && !this._tool.is3D) {
                this._editing3D = false;
                this._2DCanvas.getContext("2d")?.drawImage(this._3DCanvas, 0, 0);
            } else if (!this._editing3D && this._tool.is3D) {
                this._editing3D = true;
                this.updateTexture();
            }
        }
    }

    public get tool() {
        return this._tool;
    }

    public set face(face: number) {
        if (this._face !== face) {
            this._face = face;
            this.grabOriginalTexture();
            this.updateDisplay();
        }
    }

    public set mipLevel(mipLevel: number) {
        if (this._mipLevel === mipLevel) {
            return;
        }
        this._mipLevel = mipLevel;
        this.grabOriginalTexture();
    }

    /** Returns the 3D scene used for postprocesses */
    public get scene3D() {
        return this._3DScene;
    }

    public set metadata(metadata: IMetadata) {
        this._metadata = metadata;
        const { x1, y1, x2, y2 } = metadata.select;
        this._planeMaterial.setInt("x1", x1);
        this._planeMaterial.setInt("y1", y1);
        this._planeMaterial.setInt("x2", x2);
        this._planeMaterial.setInt("y2", y2);
    }

    private makePlane() {
        if (this._plane) {
            this._plane.dispose();
        }
        this._plane = CreatePlane("plane", { width: this._size.width, height: this._size.height }, this._scene);
        this._plane.enableEdgesRendering();
        this._plane.edgesWidth = 4.0;
        this._plane.edgesColor = new Color4(1, 1, 1, 1);
        this._plane.enablePointerMoveEvents = true;
        this._plane.material = this._planeMaterial;
    }

    public async reset(): Promise<void> {
        if (this._isDisposed) {
            return;
        }
        if (this._tool && this._tool.reset) {
            this._tool.reset();
        }
        // Discard writes queued by the tool reset (and any still in flight) so they can't land after restoration.
        this._pushGeneration++;
        this._shouldPush = false;
        try {
            await this._activePush;
            await this._source.resetAsync();
            await this.grabOriginalTexture();
            this.makePlane();
            this._onUpdate();
        } catch (error) {
            this._reportError(error);
        }
    }

    public async resize(newSize: ISize) {
        if (this._isDisposed) {
            return;
        }
        if (!this._source.canResize) {
            this._reportError(this._source.resizeDisabledReason ?? "Resizing is not supported for this texture.");
            return;
        }
        try {
            // Fetch texture data BEFORE setting size (which clears the canvas) to avoid flicker
            const { data } = await this._source.readPixelsAsync(0, this._face, newSize);
            if (this._isDisposed) {
                return;
            }
            this.setSize(newSize);
            this.paintPixelsOnCanvas(data, this._2DCanvas);
            await this.updateTexture();
        } catch (error) {
            this._reportError(error);
        }
    }

    public setSize(size: ISize) {
        const oldSize = this._size;
        this._size = size;
        this._2DCanvas.width = this._size.width;
        this._2DCanvas.height = this._size.height;
        this._3DCanvas.width = this._size.width;
        this._3DCanvas.height = this._size.height;
        if (this._planeMaterial) {
            this._planeMaterial.setInt("w", this._size.width);
            this._planeMaterial.setInt("h", this._size.height);
        }
        if (!oldSize || oldSize.width != size.width || oldSize.height != size.height) {
            this._cameraPos.x = 0;
            this._cameraPos.y = 0;
            this._scale = 1.5 / Math.max(this._size.width, this._size.height);
        }
        this.makePlane();
    }

    public async upload(file: File) {
        if (this._isDisposed) {
            return;
        }
        try {
            if (await this._source.uploadNativeFileAsync(file)) {
                await this.grabOriginalTexture();
                return;
            }
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === "string") {
                        resolve(reader.result);
                    } else {
                        reject(new Error("Could not read the selected image."));
                    }
                };
                reader.onerror = () => reject(reader.error ?? new Error("Could not read the selected image."));
                reader.readAsDataURL(file);
            });
            await new Promise<void>((resolve, reject) => {
                const texture = new Texture(
                    dataUrl,
                    this._scene,
                    this._source.noMipmap,
                    false,
                    Texture.NEAREST_SAMPLINGMODE,
                    () => {
                        void (async () => {
                            try {
                                if (this._isDisposed) {
                                    resolve();
                                    return;
                                }
                                const size = texture.getSize();
                                if (!this._source.canResize && (size.width !== this._size.width || size.height !== this._size.height)) {
                                    throw new Error(`The uploaded image must match the texture dimensions (${this._size.width} × ${this._size.height}).`);
                                }
                                const pixels = await ApplyChannelsToTextureDataAsync(texture, size.width, size.height, 0, { R: true, G: true, B: true, A: true });
                                if (this._tool?.reset) {
                                    this._tool.reset();
                                }
                                if (size.width !== this._size.width || size.height !== this._size.height) {
                                    this.setSize(size);
                                }
                                this.paintPixelsOnCanvas(pixels, this._2DCanvas);
                                await this.updateTexture();
                                this._setMipLevel(0);
                                resolve();
                            } catch (error) {
                                reject(error instanceof Error ? error : new Error(String(error)));
                            } finally {
                                texture.dispose();
                            }
                        })();
                    },
                    (message, error) => reject(error instanceof Error ? error : new Error(message ?? String(error ?? "Could not load the selected image.")))
                );
            });
        } catch (error) {
            this._reportError(error);
        }
    }

    public saveTexture() {
        const canvas = this._editing3D ? this._3DCanvas : this._2DCanvas;
        Tools.ToBlob(canvas, (blob) => {
            Tools.Download(blob!, this._source.name);
        });
    }

    public toolInteractionEnabled() {
        return !(this._keyMap.get(this.PAN_KEY) || this._isPanning);
    }

    public dispose() {
        this._isDisposed = true;
        this._source.dispose();
        if (this._tool) {
            this._tool.deactivate();
        }
        this._paintCanvas.parentNode?.removeChild(this._paintCanvas);
        this._3DPlane.dispose();
        this._3DCanvasTexture.dispose();
        this._3DScene.dispose();
        this._3DEngine.dispose();
        this._plane?.dispose();
        this._channelsTexture.dispose();
        this._planeMaterial.dispose();
        this._camera.dispose();
        this._scene.dispose();
        this._engine.dispose();
    }

    private _reportError(error: unknown): void {
        if (!this._isDisposed) {
            this._onError(error instanceof Error ? error.message : String(error));
        }
    }
}
