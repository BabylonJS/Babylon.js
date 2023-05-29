/* eslint-disable @typescript-eslint/naming-convention */
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Vector3, Vector2 } from "core/Maths/math.vector";
import { Color4, Color3 } from "core/Maths/math.color";
import { FreeCamera } from "core/Cameras/freeCamera";
import type { Nullable } from "core/types";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import type { Mesh } from "core/Meshes/mesh";
import { Camera } from "core/Cameras/camera";

import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { HtmlElementTexture } from "core/Materials/Textures/htmlElementTexture";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import type { RawCubeTexture } from "core/Materials/Textures/rawCubeTexture";
import type { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";

import type { ISize } from "core/Maths/math.size";
import { Tools } from "core/Misc/tools";

import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { KeyboardEventTypes } from "core/Events/keyboardEvents";

import { TextureHelper } from "../../../../../../textureHelper";

import type { ITool } from "./toolBar";
import type { IChannel } from "./channelsBar";
import type { IMetadata } from "./textureEditorComponent";

import { canvasShader } from "./canvasShader";

import type { IWheelEvent } from "core/Events/deviceInputEvents";

export interface IPixelData {
    x?: number;
    y?: number;
    r?: number;
    g?: number;
    b?: number;
    a?: number;
}

export class TextureCanvasManager {
    private _engine: Engine;
    private _scene: Scene;
    private _camera: FreeCamera;
    private _cameraPos: Vector2;

    private _scale: number;
    private _isPanning: boolean = false;
    private _mouseX: number;
    private _mouseY: number;

    private _uiCanvas: HTMLCanvasElement;

    private _size: ISize;

    /** The canvas we paint onto using the canvas API */
    private _2DCanvas: HTMLCanvasElement;
    /** The canvas we apply post processes to */
    private _3DCanvas: HTMLCanvasElement;
    /** The canvas which handles channel filtering */
    private _channelsTexture: HtmlElementTexture;

    private _3DEngine: Engine;
    private _3DPlane: Mesh;
    private _3DCanvasTexture: HtmlElementTexture;
    private _3DScene: Scene;

    private _channels: IChannel[] = [];
    private _face: number = 0;
    private _mipLevel: number = 0;

    /** The texture from the original engine that we invoked the editor on */
    private _originalTexture: BaseTexture;
    /** This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
    private _target: HtmlElementTexture | RawCubeTexture;
    private _originalTextureProperties: {
        _texture: Nullable<InternalTexture>;
        url: Nullable<string>;
        _forceSerialize: boolean;
    };
    /** Keeps track of whether we have modified the texture */
    private _didEdit: boolean = false;

    private _plane: Mesh;
    private _planeMaterial: ShaderMaterial;

    /** Tracks which keys are currently pressed */
    private _keyMap: any = {};
    /** Tracks which mouse buttons are currently pressed */
    private _buttonsPressed = 0;

    private readonly ZOOM_MOUSE_SPEED: number = 0.001;
    private readonly ZOOM_KEYBOARD_SPEED: number = 0.4;
    private readonly ZOOM_IN_KEY: string = "+";
    private readonly ZOOM_OUT_KEY: string = "-";

    private readonly PAN_SPEED: number = 0.003;
    private readonly PAN_KEY = "Space";

    private readonly MIN_SCALE: number = 0.01;
    private readonly GRID_SCALE: number = 0.047;
    private readonly MAX_SCALE: number = 10;

    private readonly SELECT_ALL_KEY = "KeyA";
    private readonly SAVE_KEY = "KeyS";
    private readonly RESET_KEY = "KeyR";
    private readonly DESELECT_KEY = "Escape";

    /** The number of milliseconds between texture updates */
    private readonly PUSH_FREQUENCY = 32;

    private _tool: Nullable<ITool>;

    private _setPixelData: (pixelData: IPixelData) => void;
    private _setMipLevel: (mipLevel: number) => void;

    private _window: Window;

    private _metadata: IMetadata;

    private _editing3D: boolean = false;

    private _onUpdate: () => void;
    private _setMetadata: (metadata: any) => void;

    private _imageData: Uint8Array | Uint8ClampedArray;
    private _canPush: boolean = true;
    private _shouldPush: boolean = false;
    private _paintCanvas: HTMLCanvasElement;

    public constructor(
        texture: BaseTexture,
        window: Window,
        canvasUI: HTMLCanvasElement,
        canvas2D: HTMLCanvasElement,
        canvas3D: HTMLCanvasElement,
        setPixelData: (pixelData: IPixelData) => void,
        metadata: IMetadata,
        onUpdate: () => void,
        setMetadata: (metadata: any) => void,
        setMipLevel: (level: number) => void
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

        this._originalTexture = texture;
        this._originalTextureProperties = {
            _texture: this._originalTexture._texture,
            url: (this._originalTexture as Texture).url,
            _forceSerialize: this._originalTexture._forceSerialize,
        };
        this._engine = new Engine(this._uiCanvas, true);
        this._scene = new Scene(this._engine, { virtual: true });
        this._scene.clearColor = new Color4(0.11, 0.11, 0.11, 1.0);

        this._camera = new FreeCamera("camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._camera.minZ = 0.5;
        this._camera.maxZ = 1.5;
        this._cameraPos = new Vector2();

        this.setSize(texture.getSize());

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
        this._plane.material = this._planeMaterial;

        this._window.addEventListener("keydown", (evt) => {
            this._keyMap[evt.code] = true;
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
            this._keyMap[evt.code] = false;
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
                if ((leftButtonPressed && !(this._buttonsPressed & 1) && this._keyMap[this.PAN_KEY]) || middleButtonPressed) {
                    this._isPanning = true;
                    this._mouseX = pointerInfo.event.x;
                    this._mouseY = pointerInfo.event.y;
                }
                if (middleButtonPressed) {
                    this._isPanning = true;
                }
            } else if ((!leftButtonPressed || !this._keyMap[this.PAN_KEY]) && !middleButtonPressed) {
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
                        const pos = this.getMouseCoordinates(pointerInfo);
                        const idx = (pos.x + pos.y * this._size.width) * 4;
                        this._setPixelData({ x: pos.x, y: pos.y, r: this._imageData[idx], g: this._imageData[idx + 1], b: this._imageData[idx + 2], a: this._imageData[idx + 3] });
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
                    this._keyMap[kbInfo.event.key] = true;
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
                    this._keyMap[kbInfo.event.key] = false;
                    break;
            }
        });
    }

    public async updateTexture() {
        if (this._mipLevel !== 0) {
            await this._setMipLevel(0);
        }
        this._didEdit = true;
        const element = this._editing3D ? this._3DCanvas : this._2DCanvas;
        if (this._editing3D) {
            this._3DCanvasTexture.update();
            this._3DScene.render();
        }
        if (this._originalTexture.isCube) {
            // TODO: fix cube map editing
        } else {
            if (!this._target) {
                this._target = new HtmlElementTexture("editor", element, {
                    engine: this._originalTexture.getScene()?.getEngine()!,
                    scene: null,
                    samplingMode: (this._originalTexture as Texture).samplingMode,
                    generateMipMaps: this._originalTextureProperties._texture?.generateMipMaps,
                });
            } else {
                (this._target as HtmlElementTexture).element = element;
            }
            this.pushTexture();
        }
        this._originalTexture._texture = this._target._texture;
        (this._originalTexture as Texture).url = null;
        this._originalTexture._forceSerialize = true;
        this._channelsTexture.element = element;
        this.updateDisplay();
        this._onUpdate();
    }

    private async pushTexture() {
        if (this._canPush) {
            const invertY = this._target.constructor.name === HtmlElementTexture.name ? false : (this._originalTexture as Texture).invertY;
            (this._target as HtmlElementTexture).update(invertY);
            this._target._texture?.updateSize(this._size.width, this._size.height);
            if (this._editing3D) {
                const bufferView = await this._3DEngine.readPixels(0, 0, this._size.width, this._size.height);
                this._imageData = new Uint8Array(bufferView.buffer, 0, bufferView.byteLength);
            } else {
                this._imageData = this._2DCanvas.getContext("2d")!.getImageData(0, 0, this._size.width, this._size.height).data;
            }
            this._canPush = false;
            this._shouldPush = false;
            setTimeout(() => {
                this._canPush = true;
                if (this._shouldPush) {
                    this.pushTexture();
                }
            }, this.PUSH_FREQUENCY);
        } else {
            this._shouldPush = true;
        }
    }

    public async startPainting(): Promise<CanvasRenderingContext2D> {
        if (this._mipLevel != 0) {
            await this._setMipLevel(0);
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
        this._channels.forEach((channel) => {
            if (!channel.editable) {
                editingAllChannels = false;
            }
        });
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
            this._channels.forEach((channel, index) => {
                if (!channel.editable) {
                    for (let i = index; i < w * h * 4; i += 4) {
                        nd[i] = oldData[i];
                    }
                }
            });
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

    public set channels(channels: IChannel[]) {
        // Determine if we need to re-render the texture. This is an expensive operation, so we should only do it if channel visibility has changed.
        let needsRender = false;
        if (channels.length !== this._channels.length) {
            needsRender = true;
        } else {
            channels.forEach((channel, index) => {
                if (channel.visible !== this._channels[index].visible) {
                    needsRender = true;
                    this._planeMaterial.setFloat(channel.id.toLowerCase(), channel.visible ? 1.0 : 0.0);
                }
            });
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
        // Grab image data from original texture and paint it onto the context of a DynamicTexture
        this.setSize(this._originalTexture.getSize());
        const data = await TextureHelper.GetTextureDataAsync(
            this._originalTexture,
            this._size.width,
            this._size.height,
            this._face,
            { R: true, G: true, B: true, A: true },
            undefined,
            this._mipLevel
        );
        this._imageData = data;
        this.paintPixelsOnCanvas(data, this._2DCanvas);
        this._3DCanvasTexture.update();
        this.updateDisplay();
        return data;
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

    public set tool(tool: Nullable<ITool>) {
        if (this._tool) {
            this._tool.instance.cleanup();
        }
        this._tool = tool;
        if (this._tool) {
            this._tool.instance.setup();
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

    public reset(): void {
        if (this._tool && this._tool.instance.onReset) {
            this._tool.instance.onReset();
        }
        this._originalTexture._texture = this._originalTextureProperties._texture;
        (this._originalTexture as Texture).url = this._originalTextureProperties.url;
        this._originalTexture._forceSerialize = this._originalTextureProperties._forceSerialize;
        this.grabOriginalTexture();
        this.makePlane();
        this._didEdit = false;
        this._onUpdate();
    }

    public async resize(newSize: ISize) {
        const data = await TextureHelper.GetTextureDataAsync(this._originalTexture, newSize.width, newSize.height, this._face, { R: true, G: true, B: true, A: true });
        this.setSize(newSize);
        this.paintPixelsOnCanvas(data, this._2DCanvas);
        this.updateTexture();
        this._didEdit = true;
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

    public upload(file: File) {
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });
                let extension: string | undefined = undefined;
                if (file.name.toLowerCase().indexOf(".dds") > 0) {
                    extension = ".dds";
                } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                    extension = ".env";
                }
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;

                    if (extension === ".dds" || extension === ".env") {
                        (this._originalTexture as CubeTexture).updateURL(base64data, extension, () => this.grabOriginalTexture());
                    } else {
                        const texture = new Texture(base64data, this._scene, this._originalTexture.noMipmap, false, Texture.NEAREST_SAMPLINGMODE, () => {
                            TextureHelper.GetTextureDataAsync(texture, texture.getSize().width, texture.getSize().height, 0, { R: true, G: true, B: true, A: true }).then(
                                async (pixels) => {
                                    if (this._tool && this._tool.instance.onReset) {
                                        this._tool.instance.onReset();
                                    }
                                    texture.dispose();
                                    this.setSize(texture.getSize());
                                    this.paintPixelsOnCanvas(pixels, this._2DCanvas);
                                    await this.updateTexture();
                                    this._setMipLevel(0);
                                }
                            );
                        });
                    }
                };
            },
            undefined,
            true
        );
    }

    public saveTexture() {
        const canvas = this._editing3D ? this._3DCanvas : this._2DCanvas;
        Tools.ToBlob(canvas, (blob) => {
            Tools.Download(blob!, this._originalTexture.name);
        });
    }

    public toolInteractionEnabled() {
        return !(this._keyMap[this.PAN_KEY] || this._isPanning);
    }

    public dispose() {
        if (this._didEdit) {
            this._originalTextureProperties._texture?.dispose();
        }
        if (this._tool) {
            this._tool.instance.cleanup();
        }
        this._paintCanvas.parentNode?.removeChild(this._paintCanvas);
        this._3DPlane.dispose();
        this._3DCanvasTexture.dispose();
        this._3DScene.dispose();
        this._3DEngine.dispose();
        this._plane.dispose();
        this._channelsTexture.dispose();
        this._planeMaterial.dispose();
        this._camera.dispose();
        this._scene.dispose();
        this._engine.dispose();
    }
}
