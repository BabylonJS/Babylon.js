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

import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';
import { KeyboardEventTypes } from 'babylonjs/Events/keyboardEvents';

export class TextureCanvasManager {
    private _engine: Engine;
    private _scene: Scene;
    private _camera: FreeCamera;
    private _canvasUI : HTMLCanvasElement;

    private _scale : number;
    private _isPanning : boolean = false;
    private _mouseX : number;
    private _mouseY : number;

    private _canvas2D : HTMLCanvasElement;

    /* The texture we are currently editing */
    private _texture: HtmlElementTexture;
    /* The texture from the original engine that we invoked the editor on */
    private _originalTexture: BaseTexture;
    /* This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
    private _targetTexture : Nullable<HtmlElementTexture> = null;
    /* The internal texture representation of the original texture */
    private _originalInternalTexture : Nullable<InternalTexture> = null;

    private _plane : Mesh;
    private _planeMaterial : NodeMaterial;

    private keyMap : any = {};

    private static ZOOM_MOUSE_SPEED : number = 0.0005;
    private static ZOOM_KEYBOARD_SPEED : number = 0.2;

    private static PAN_SPEED : number = 0.002;
    private static PAN_MOUSE_BUTTON : number = 0; // RMB
    private static PAN_KEY : string = ' ';

    private static PAINT_BUTTON : number = 0; // LMB
    private _isPainting : boolean = false;
    private _paintColor : Color4;

    private static FLOOD_KEY : string = 'f';

    private static MIN_SCALE : number = 0.01;
    private static MAX_SCALE : number = 10;

    public constructor(targetCanvas: HTMLCanvasElement, texture: BaseTexture, canvas2D: HTMLCanvasElement) {
        this._canvasUI = targetCanvas;
        this._canvas2D = canvas2D;
        this._originalTexture = texture;

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0.2, 0.2, 0.2, 1.0);

        this._camera = new FreeCamera("Camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        this._texture = new HtmlElementTexture("texture", this._canvas2D, {engine: this._engine, scene: this._scene});
        if (texture) {
            /* Grab image data from original texture and paint it onto the context of a DynamicTexture */
            this.copyTexture(texture, this._texture, this._canvas2D);
        } else {
            /* If we don't have a texture to start with, just generate a white rectangle */
            const ctx = this._canvas2D.getContext("2d")!;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, this._canvas2D.width, this._canvas2D.height);
            this._texture.update();
        }

        this._texture.updateSamplingMode(Engine.TEXTURE_NEAREST_LINEAR);
        const textureRatio = this._texture.getSize().width / this._texture.getSize().height;

        this._plane = PlaneBuilder.CreatePlane("plane", {width: textureRatio, height: 1}, this._scene);
        NodeMaterial.ParseFromSnippetAsync("#TPSEV2#4", this._scene)
            .then((material) => {
                this._planeMaterial = material;
                this._planeMaterial.getTextureBlocks()[0].texture = this._texture;
                this._plane.material = this._planeMaterial;
                this._canvasUI.focus();
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
            this._canvasUI.parentElement!.style.cursor = cursor;
        });

        this._scale = 1;
        this._isPanning = false;

        this._scene.onBeforeRenderObservable.add(() => {
            this._scale = Math.min(Math.max(this._scale, TextureCanvasManager.MIN_SCALE), TextureCanvasManager.MAX_SCALE);
            let ratio = this._canvasUI?.width / this._canvasUI?.height;
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
                    else if (pointerInfo.event.button === TextureCanvasManager.PAINT_BUTTON) {
                        this._isPainting = true;
                        this._paintColor = this.randomColor();
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_MOUSE_BUTTON) {
                        this._isPanning = false;
                    }
                    if (pointerInfo.event.button === TextureCanvasManager.PAINT_BUTTON) {
                        this._isPainting = false;
                    }
                    break;
                case PointerEventTypes.POINTERMOVE:
                    if (this._isPanning) {
                        this._camera.position.x -= (pointerInfo.event.x - this._mouseX) * this._scale * TextureCanvasManager.PAN_SPEED;
                        this._camera.position.y += (pointerInfo.event.y - this._mouseY) * this._scale * TextureCanvasManager.PAN_SPEED;
                        this._mouseX = pointerInfo.event.x;
                        this._mouseY = pointerInfo.event.y;
                    }
                    if (this._isPainting) {
                        if (pointerInfo.pickInfo?.hit) {
                            const ctx = this._canvas2D.getContext("2d")!;
                            ctx.fillStyle = this._paintColor.toHexString();
                            const x = pointerInfo.pickInfo.getTextureCoordinates()!.x * this._texture.getSize().width;
                            const y = (1 - pointerInfo.pickInfo.getTextureCoordinates()!.y) * this._texture.getSize().height;
                            ctx.beginPath();
                            ctx.ellipse(x, y, 30, 30, 0, 0, Math.PI * 2);
                            ctx.fill();
                            this.updateTexture();
                        }
                    }
                    break;
            }
        })

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch(kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.keyMap[kbInfo.event.key] = true;
                    if (kbInfo.event.key === '+') {
                        this._scale -= TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    if (kbInfo.event.key === "-") {
                        this._scale += TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    if (kbInfo.event.key == TextureCanvasManager.FLOOD_KEY) {
                        const ctx = this._canvas2D.getContext("2d")!;
                        ctx.fillStyle = this.randomColor().toHexString();
                        ctx.fillRect(0,0, this._texture.getSize().width, this._texture.getSize().height);
                        this.updateTexture();
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

    private randomColor() : Color4 {
        return new Color4(Math.random(), Math.random(), Math.random(), 1.0);
    }

    private updateTexture() {
        this._texture.update();
        if (!this._targetTexture) {
            this._originalInternalTexture = this._originalTexture._texture;
            this._targetTexture = new HtmlElementTexture("editor", this._canvas2D, {engine: this._originalTexture.getScene()?.getEngine()!, scene: null});
        }
        this._targetTexture.update();
        this._originalTexture._texture = this._targetTexture._texture;
    }

    private copyTexture(source : BaseTexture, dest : HtmlElementTexture, destCanvas: HTMLCanvasElement) {
        const pixelData = source.readPixels()!;
        const arr = new Uint8ClampedArray(pixelData.buffer);
        const ctx = destCanvas.getContext('2d')!;
        let imgData = ctx.createImageData(source.getSize().width, source.getSize().height);
        imgData.data.set(arr);
        ctx.putImageData(imgData, 0, 0);
        ctx.globalCompositeOperation = 'copy';
        ctx.translate(0,source.getSize().height);
        ctx.scale(1,-1);
        ctx.drawImage(destCanvas, 0, 0);
        ctx.resetTransform();
        ctx.globalCompositeOperation = 'source-over';
        dest.update();
        dest.hasAlpha = source.hasAlpha;
    }

    public dispose() {
        if (this._planeMaterial) {
            this._planeMaterial.dispose();
        }
        if (this._originalInternalTexture) {
            this._originalInternalTexture.dispose();
        }
        this._texture.dispose();
        this._plane.dispose();
        this._camera.dispose();
        this._scene.dispose();
        this._engine.dispose();
    }
} 
