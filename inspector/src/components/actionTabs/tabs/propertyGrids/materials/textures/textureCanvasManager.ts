import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { Color4 } from 'babylonjs/Maths/math.color';
import { FreeCamera } from 'babylonjs/Cameras/freeCamera';
import { Nullable } from 'babylonjs/types'

import { PlaneBuilder } from 'babylonjs/Meshes/Builders/planeBuilder';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Camera } from 'babylonjs/Cameras/camera';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { HtmlElementTexture } from 'babylonjs/Materials/Textures/htmlElementTexture';
import { InternalTexture } from 'babylonjs/Materials/Textures/internalTexture';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { TextureHelper, TextureChannelToDisplay } from '../../../../../../textureHelper';
import { ISize } from 'babylonjs/Maths/math.size';


import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';
import { KeyboardEventTypes } from 'babylonjs/Events/keyboardEvents';

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

    /* This is the canvas we paint onto using the canvas API */
    private _2DCanvas : HTMLCanvasElement;
    /* The texture we are currently editing, which is based on _2DCanvas */
    private _texture: HtmlElementTexture;

    private _displayCanvas : HTMLCanvasElement;
    private _displayChannel : TextureChannelToDisplay = TextureChannelToDisplay.All;
    /* This is the actual texture that is being displayed. Sometimes it's just a single channel from _textures */
    private _displayTexture : HtmlElementTexture;

    /* The texture from the original engine that we invoked the editor on */
    private _originalTexture: BaseTexture;
    /* This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
    private _targetTexture : Nullable<HtmlElementTexture> = null;
    /* The internal texture representation of the original texture */
    private _originalInternalTexture : Nullable<InternalTexture> = null;

    private _plane : Mesh;
    private _planeMaterial : NodeMaterial;

    /* Tracks which keys are currently pressed */
    private keyMap : any = {};

    private static ZOOM_MOUSE_SPEED : number = 0.0005;
    private static ZOOM_KEYBOARD_SPEED : number = 0.2;
    private static ZOOM_IN_KEY : string = '+';
    private static ZOOM_OUT_KEY : string = '-';

    private static PAN_SPEED : number = 0.002;
    private static PAN_MOUSE_BUTTON : number = 0; // RMB
    private static PAN_KEY : string = ' ';

    private static MIN_SCALE : number = 0.01;
    private static MAX_SCALE : number = 10;

    public metadata : any = {
        color: '#ffffff',
        opacity: 1.0
    };

    public constructor(texture: BaseTexture, canvasUI: HTMLCanvasElement, canvas2D: HTMLCanvasElement, canvasDisplay: HTMLCanvasElement) {
        this._UICanvas = canvasUI;
        this._2DCanvas = canvas2D;
        this._displayCanvas = canvasDisplay;

        this._originalTexture = texture;
        this._size = this._originalTexture.getSize();

        this._engine = new Engine(this._UICanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0.2, 0.2, 0.2, 1.0);

        this._camera = new FreeCamera("Camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._texture = new HtmlElementTexture("texture", this._2DCanvas, {engine: this._engine, scene: this._scene});
        if (texture) {
            /* Grab image data from original texture and paint it onto the context of a DynamicTexture */
            const pixelData = this._originalTexture.readPixels()!;
            TextureCanvasManager.paintPixelsOnCanvas(new Uint8Array(pixelData.buffer), this._2DCanvas);
            this._texture.update();
        }

        this._displayTexture = new HtmlElementTexture("display", this._displayCanvas, {engine: this._engine, scene: this._scene});
        this.copyTextureToDisplayTexture();
        this._displayTexture.updateSamplingMode(Engine.TEXTURE_NEAREST_LINEAR);

        const textureRatio = this._size.width / this._size.height;
        
        this._plane = PlaneBuilder.CreatePlane("plane", {width: textureRatio, height: 1}, this._scene);
        NodeMaterial.ParseFromSnippetAsync("#TPSEV2#4", this._scene)
            .then((material) => {
                this._planeMaterial = material;
                this._planeMaterial.getTextureBlocks()[0].texture = this._displayTexture;
                this._plane.material = this._planeMaterial;
                this._UICanvas.focus();
            });
        this._plane.enableEdgesRendering();
        this._plane.edgesWidth = 4.0;
        this._plane.edgesColor = new Color4(1,1,1,1);
        this._plane.enablePointerMoveEvents = true;

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
            let cursor = 'initial';
            if (this.keyMap[TextureCanvasManager.PAN_KEY]) {
                cursor = 'pointer';
            }
            this._UICanvas.parentElement!.style.cursor = cursor;
        });

        this._scale = 1;
        this._isPanning = false;

        this._scene.onBeforeRenderObservable.add(() => {
            this._scale = Math.min(Math.max(this._scale, TextureCanvasManager.MIN_SCALE), TextureCanvasManager.MAX_SCALE);
            const ratio = this._UICanvas?.width / this._UICanvas?.height;
            this._camera.orthoBottom = -this._scale;
            this._camera.orthoTop = this._scale;
            this._camera.orthoLeft = -this._scale * ratio;
            this._camera.orthoRight = this._scale * ratio;
        })

        this._scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERWHEEL:
                    const event = pointerInfo.event as MouseWheelEvent;
                    this._scale += (event.deltaY * TextureCanvasManager.ZOOM_MOUSE_SPEED * this._scale);
                    break;
                case PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_MOUSE_BUTTON && this.keyMap[TextureCanvasManager.PAN_KEY]) {
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
                        this._camera.position.x -= (pointerInfo.event.x - this._mouseX) * this._scale * TextureCanvasManager.PAN_SPEED;
                        this._camera.position.y += (pointerInfo.event.y - this._mouseY) * this._scale * TextureCanvasManager.PAN_SPEED;
                        this._mouseX = pointerInfo.event.x;
                        this._mouseY = pointerInfo.event.y;
                    }
                    break;
            }
        })

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch(kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.keyMap[kbInfo.event.key] = true;
                    if (kbInfo.event.key === TextureCanvasManager.ZOOM_IN_KEY) {
                        this._scale -= TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    if (kbInfo.event.key === TextureCanvasManager.ZOOM_OUT_KEY) {
                        this._scale += TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.keyMap[kbInfo.event.key] = false;
                    if (kbInfo.event.key == TextureCanvasManager.PAN_KEY) {
                        this._isPanning = false;
                    }
                break;
            }
        })

    }

    public updateTexture() {
        this._texture.update();
        if (!this._targetTexture) {
            this._originalInternalTexture = this._originalTexture._texture;
            this._targetTexture = new HtmlElementTexture("editor", this._2DCanvas, {engine: this._originalTexture.getScene()?.getEngine()!, scene: null});
        }
        this._targetTexture.update();
        this._originalTexture._texture = this._targetTexture._texture;
        this.copyTextureToDisplayTexture();
    }

    private copyTextureToDisplayTexture() {
        TextureHelper.GetTextureDataAsync(this._texture, this._size.width, this._size.height, 0, this._displayChannel)
            .then(data => {
                TextureCanvasManager.paintPixelsOnCanvas(data, this._displayCanvas);
                this._displayTexture.update();
            })
    }

    public set displayChannel(channel: TextureChannelToDisplay) {
        this._displayChannel = channel;
        this.copyTextureToDisplayTexture();
    }

    public get displayChannel() : TextureChannelToDisplay {
        return this._displayChannel;
    }

    public static paintPixelsOnCanvas(pixelData : Uint8Array, canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(pixelData);
        ctx.putImageData(imgData, 0, 0);
        TextureCanvasManager.flipCanvas(canvas);
    }

    /* When copying from a WebGL texture to a Canvas, the y axis is inverted. This function flips it back */
    public static flipCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        const transform = ctx.getTransform();
        ctx.globalCompositeOperation = 'copy';
        ctx.globalAlpha = 1.0;
        ctx.translate(0,canvas.height);
        ctx.scale(1,-1);
        ctx.drawImage(canvas, 0, 0);
        ctx.setTransform(transform);
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

    public dispose() {
        if (this._planeMaterial) {
            this._planeMaterial.dispose();
        }
        if (this._originalInternalTexture) {
            this._originalInternalTexture.dispose();
        }
        this._displayTexture.dispose();
        this._texture.dispose();
        this._plane.dispose();
        this._camera.dispose();
        this._scene.dispose();
        this._engine.dispose();
    }
} 
