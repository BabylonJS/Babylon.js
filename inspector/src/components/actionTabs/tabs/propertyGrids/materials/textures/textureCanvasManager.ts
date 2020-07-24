import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Vector3, Vector2 } from 'babylonjs/Maths/math.vector';
import { Color4 } from 'babylonjs/Maths/math.color';
import { FreeCamera } from 'babylonjs/Cameras/freeCamera';
import { Nullable } from 'babylonjs/types'

import { PlaneBuilder } from 'babylonjs/Meshes/Builders/planeBuilder';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Camera } from 'babylonjs/Cameras/camera';

import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { HtmlElementTexture } from 'babylonjs/Materials/Textures/htmlElementTexture';
import { InternalTexture } from 'babylonjs/Materials/Textures/internalTexture';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { RawCubeTexture } from 'babylonjs/Materials/Textures/rawCubeTexture';
import { CubeTexture } from 'babylonjs/Materials/Textures/cubeTexture';


import { ISize } from 'babylonjs/Maths/math.size';
import { Tools } from 'babylonjs/Misc/tools';

import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';
import { KeyboardEventTypes } from 'babylonjs/Events/keyboardEvents';

import { TextureHelper, TextureChannelsToDisplay } from '../../../../../../textureHelper';

import { Tool } from './toolBar';
import { Channel } from './channelsBar';

export interface PixelData {
    x? : number;
    y? : number;
    r? : number;
    g? : number;
    b? : number;
    a? : number;
}

export class TextureCanvasManager {
    private _engine: Engine;
    private _scene: Scene;
    private _camera: FreeCamera;

    private _scale : number;
    private _isPanning : boolean = false;
    private _mouseX : number;
    private _mouseY : number;

    private _UICanvas : HTMLCanvasElement;

    private _size : ISize;

    /* The canvas we paint onto using the canvas API */
    private _2DCanvas : HTMLCanvasElement;

    private _displayCanvas : HTMLCanvasElement;
    private _channels : Channel[] = [];
    private _face : number = 0;
    /* The texture that we are actually displaying. It is created by sampling a combination of channels from _texture */
    private _displayTexture : HtmlElementTexture;

    /* The texture from the original engine that we invoked the editor on */
    private _originalTexture: BaseTexture;
    /* This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
    private _target : HtmlElementTexture | RawCubeTexture;
    /* The internal texture representation of the original texture */
    private _originalInternalTexture : Nullable<InternalTexture> = null;
    /* Keeps track of whether we have modified the texture */
    private _didEdit : boolean = false;

    private _plane : Mesh;
    private _planeMaterial : NodeMaterial;
    private _planeFallbackMaterial : PBRMaterial;

    /* Tracks which keys are currently pressed */
    private _keyMap : any = {};

    private static ZOOM_MOUSE_SPEED : number = 0.0005;
    private static ZOOM_KEYBOARD_SPEED : number = 0.2;
    private static ZOOM_IN_KEY : string = '+';
    private static ZOOM_OUT_KEY : string = '-';

    private static PAN_SPEED : number = 0.002;
    private static PAN_MOUSE_BUTTON : number = 0; // LMB
    private static PAN_KEY : string = ' ';

    private static MIN_SCALE : number = 0.01;
    private static MAX_SCALE : number = 10;

    private _tool : Nullable<Tool>;

    private _setPixelData : (pixelData : PixelData) => void;

    public metadata : any = {
        color: '#ffffff',
        opacity: 1.0
    };

    public constructor(
        texture: BaseTexture,
        canvasUI: HTMLCanvasElement,
        canvas2D: HTMLCanvasElement,
        canvasDisplay: HTMLCanvasElement,
        setPixelData : (pixelData : PixelData) => void
    ) {
        this._UICanvas = canvasUI;
        this._2DCanvas = canvas2D;
        this._displayCanvas = canvasDisplay;
        this._setPixelData = setPixelData;

        this._size = texture.getSize();
        this._originalTexture = texture;
        this._originalInternalTexture = this._originalTexture._texture;
        this._engine = new Engine(this._UICanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0.11, 0.11, 0.11, 1.0);

        this._camera = new FreeCamera("Camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

        this._planeFallbackMaterial = new PBRMaterial('fallback_material', this._scene);
        this._planeFallbackMaterial.albedoTexture = this._displayTexture;
        this._planeFallbackMaterial.disableLighting = true;
        this._planeFallbackMaterial.unlit = true;

        this._displayTexture = new HtmlElementTexture("display", this._displayCanvas, {engine: this._engine, scene: this._scene});
        this._displayTexture.updateSamplingMode(Engine.TEXTURE_NEAREST_LINEAR);
        this.grabOriginalTexture();

        NodeMaterial.ParseFromSnippetAsync("#TPSEV2#4", this._scene)
            .then((material) => {
                this._planeMaterial = material;
                this._planeMaterial.getTextureBlocks()[0].texture = this._displayTexture;
                this._plane.material = this._planeMaterial;
                this._UICanvas.focus();
            });

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
            let cursor = 'initial';
            if (this._keyMap[TextureCanvasManager.PAN_KEY]) {
                cursor = 'pointer';
            }
            this._UICanvas.parentElement!.style.cursor = cursor;
        });

        this._scale = 1.5;
        this._isPanning = false;

        this._scene.onBeforeRenderObservable.add(() => {
            this._scale = Math.min(Math.max(this._scale, TextureCanvasManager.MIN_SCALE), TextureCanvasManager.MAX_SCALE);
            const ratio = this._UICanvas?.width / this._UICanvas?.height;
            this._camera.orthoBottom = -1 / this._scale;
            this._camera.orthoTop = 1 / this._scale;
            this._camera.orthoLeft =  ratio / -this._scale;
            this._camera.orthoRight = ratio / this._scale;
        })

        this._scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERWHEEL:
                    const event = pointerInfo.event as MouseWheelEvent;
                    this._scale -= (event.deltaY * TextureCanvasManager.ZOOM_MOUSE_SPEED * this._scale);
                    break;
                case PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_MOUSE_BUTTON && this._keyMap[TextureCanvasManager.PAN_KEY]) {
                        this._isPanning = true;
                        this._mouseX = pointerInfo.event.x;
                        this._mouseY = pointerInfo.event.y;
                        pointerInfo.event.preventDefault();
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_MOUSE_BUTTON) {
                        this._isPanning = false;
                    }
                    break;
                case PointerEventTypes.POINTERMOVE:
                    if (this._isPanning) {
                        this._camera.position.x -= (pointerInfo.event.x - this._mouseX) / this._scale * TextureCanvasManager.PAN_SPEED;
                        this._camera.position.y += (pointerInfo.event.y - this._mouseY) / this._scale * TextureCanvasManager.PAN_SPEED;
                        this._mouseX = pointerInfo.event.x;
                        this._mouseY = pointerInfo.event.y;
                    }
                    if (pointerInfo.pickInfo?.hit) {
                        const pos = this.getMouseCoordinates(pointerInfo);
                        const ctx = this._2DCanvas.getContext('2d');
                        const pixel = ctx?.getImageData(pos.x, pos.y, 1, 1).data!;
                        this._setPixelData({x: pos.x, y: pos.y, r:pixel[0], g:pixel[1], b:pixel[2], a:pixel[3]});
                    } else {
                        this._setPixelData({});
                    }
                    break;
            }
        })

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch(kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this._keyMap[kbInfo.event.key] = true;
                    if (kbInfo.event.key === TextureCanvasManager.ZOOM_IN_KEY) {
                        this._scale += TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    if (kbInfo.event.key === TextureCanvasManager.ZOOM_OUT_KEY) {
                        this._scale -= TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    this._keyMap[kbInfo.event.key] = false;
                    if (kbInfo.event.key == TextureCanvasManager.PAN_KEY) {
                        this._isPanning = false;
                    }
                break;
            }
        })

        this._scene.debugLayer.show();

    }

    public async updateTexture() {
        this._didEdit = true;
        if (this._originalTexture.isCube) {
            // TODO: fix cube map editing
            let pixels : ArrayBufferView[] = [];
            for (let face = 0; face < 6; face++) {
                let textureToCopy = this._originalTexture;
                if (face === this._face) {
                    // textureToCopy = this._texture;
                }
                pixels[face] = await TextureHelper.GetTextureDataAsync(textureToCopy, this._size.width, this._size.height, face, {R: true, G: true, B: true, A: true});
            }
            if (!this._target) {
                this._target = new RawCubeTexture(this._originalTexture.getScene()!, pixels, this._size.width, this._originalTexture.textureFormat, Engine.TEXTURETYPE_UNSIGNED_INT, false);
                this._target.getScene()?.removeTexture(this._target);
            } else {
                (this._target as RawCubeTexture).update(pixels, this._originalTexture.textureFormat, this._originalTexture.textureType, false);
            }
        } else {
            if (!this._target) {
                this._target = new HtmlElementTexture(
                    "editor",
                    this._2DCanvas,
                    {
                        engine: this._originalTexture.getScene()?.getEngine()!,
                        scene: null,
                        samplingMode: (this._originalTexture as Texture).samplingMode
                    }
                );
            }
            (this._target as HtmlElementTexture).update((this._originalTexture as Texture).invertY);
        }
        this._originalTexture._texture = this._target._texture;
        this.copyTextureToDisplayTexture();
    }

    private async copyTextureToDisplayTexture() {
        let channelsToDisplay : TextureChannelsToDisplay = {
            R: true,
            G: true,
            B: true,
            A: true
        }
        this._channels.forEach(channel => channelsToDisplay[channel.id] = channel.visible);
        const pixels = await TextureHelper.GetTextureDataAsync(this._originalTexture, this._size.width, this._size.height, this._face, channelsToDisplay);
        TextureCanvasManager.paintPixelsOnCanvas(pixels, this._displayCanvas);
        this._displayTexture.update();
    }

    public set channels(channels: Channel[]) {
        // Determine if we need to re-render the texture. This is an expensive operation, so we should only do it if channel visibility has changed.
        let needsRender = false;
        if (channels.length !== this._channels.length) {
            needsRender = true;
        }
        else {
            channels.forEach(
                (channel,index) => {
                    if (channel.visible !== this._channels[index].visible) {
                        needsRender = true;
                    }
                }
            );
        }
        this._channels = channels;
        if (needsRender) {
            this.copyTextureToDisplayTexture();
        }
    }

    public static paintPixelsOnCanvas(pixelData : Uint8Array, canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(pixelData);
        ctx.putImageData(imgData, 0, 0);
    }

    public grabOriginalTexture() {
        // Grab image data from original texture and paint it onto the context of a DynamicTexture
        this._size = this._originalTexture.getSize();
        this.updateSize();
        TextureHelper.GetTextureDataAsync(
            this._originalTexture,
            this._size.width,
            this._size.height,
            this._face,
            {R:true ,G:true ,B:true ,A:true}
        ).then(data => {
            TextureCanvasManager.paintPixelsOnCanvas(data, this._2DCanvas);
            this.copyTextureToDisplayTexture();
        })
    }

    public getMouseCoordinates(pointerInfo : PointerInfo) : Vector2 {
        if (pointerInfo.pickInfo?.hit) {
            const x = Math.floor(pointerInfo.pickInfo.getTextureCoordinates()!.x * this._size.width);
            const y = Math.floor((1 - pointerInfo.pickInfo.getTextureCoordinates()!.y) * this._size.height);
            return new Vector2(x,y);
        } else {
            return new Vector2();
        }
    }

    public get scene() : Scene {
        return this._scene;
    }

    public get canvas2D() : HTMLCanvasElement {
        return this._2DCanvas;
    }

    public get size() : ISize {
        return this._size;
    }

    public set tool(tool: Nullable<Tool>) {
        if (this._tool) {
            this._tool.instance.cleanup();
        }
        this._tool = tool;
        if (this._tool) {
            this._tool.instance.setup();
        }
    }

    public get tool(): Nullable<Tool> {
        return this._tool;
    }

    public set face(face: number) {
        if (this._face !== face) {
            this._face = face;
            this.copyTextureToDisplayTexture();
        }
    }

    private makePlane() {
        const textureRatio = this._size.width / this._size.height;
        if (this._plane) this._plane.dispose();
        this._plane = PlaneBuilder.CreatePlane("plane", {width: textureRatio, height: 1}, this._scene);
        this._plane.enableEdgesRendering();
        this._plane.edgesWidth = 4.0;
        this._plane.edgesColor = new Color4(1,1,1,1);
        this._plane.enablePointerMoveEvents = true;
        if (this._planeMaterial) this._plane.material = this._planeMaterial; else this._plane.material = this._planeFallbackMaterial;
    }

    public reset() : void {
        this._originalTexture._texture = this._originalInternalTexture;
        this.grabOriginalTexture();
        this.makePlane();
        this._didEdit = false;
    }

    public async resize(newSize : ISize) {
        const data = await TextureHelper.GetTextureDataAsync(this._originalTexture, newSize.width, newSize.height, this._face, {R: true,G: true,B: true,A: true});
        this._size = newSize;
        this.updateSize();
        TextureCanvasManager.paintPixelsOnCanvas(data, this._2DCanvas);
        this.updateTexture();
        this._didEdit = true;
    }

    private updateSize() {
        this._2DCanvas.width = this._size.width;
        this._2DCanvas.height = this._size.height;
        this._displayCanvas.width = this._size.width;
        this._displayCanvas.height = this._size.height;
        this.makePlane();
    }

    public upload(file : File) {
        Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });
            let extension: string | undefined = undefined;
            if (file.name.toLowerCase().indexOf(".dds") > 0) {
                extension = ".dds";
            } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                extension = ".env";
            }
            var reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = () => {
                let base64data = reader.result as string;     

                if (extension === '.dds' || extension === '.env') {
                    const texture = new CubeTexture(
                        base64data,
                        this._scene,
                        [extension],
                        this._originalTexture.noMipmap,                        
                        null,
                        () => {
                            // TO-DO: implement cube loading
                            texture.dispose();
                        }
                    );
                } else {
                    const texture = new Texture(
                        base64data,
                        this._scene,
                        this._originalTexture.noMipmap,
                        false,
                        Engine.TEXTURE_NEAREST_SAMPLINGMODE,
                        () => {
                            TextureHelper.GetTextureDataAsync(texture, texture.getSize().width, texture.getSize().height, 0, {R: true, G: true, B: true, A: true})
                                .then((pixels) => {
                                    this._size = texture.getSize();
                                    this.updateSize();
                                    TextureCanvasManager.paintPixelsOnCanvas(pixels, this._2DCanvas);
                                    this.updateTexture();
                                    texture.dispose();
                                });
                        });
                    
                }
            };

        }, undefined, true);
    }

    public dispose() {
        if (this._planeMaterial) {
            this._planeMaterial.dispose();
        }
        if (this._didEdit) {
            this._originalInternalTexture?.dispose();
        }
        if (this._tool) {
            this._tool.instance.cleanup();
        }
        this._displayTexture.dispose();
        this._plane.dispose();
        this._camera.dispose();
        this._scene.dispose();
        this._engine.dispose();
    }
} 
