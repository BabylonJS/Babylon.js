import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { FreeCamera } from 'babylonjs/Cameras/freeCamera';
import { PlaneBuilder } from 'babylonjs/Meshes/Builders/planeBuilder';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Camera } from 'babylonjs/Cameras/camera';
import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';
import { DynamicTexture } from 'babylonjs/Materials/Textures/dynamicTexture';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { Color4 } from 'babylonjs/Maths/math.color';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { TextureEditorMaterial } from './textureEditorMaterial';



export class TextureCanvasManager {
    private _engine: Engine;
    private _scene: Scene;
    private _texture: DynamicTexture;
    private _camera: FreeCamera;
    private _canvas : HTMLCanvasElement;

    private _scale : number;
    private _isPanning : boolean;
    private _mouseX : number;
    private _mouseY : number;

    private _plane : Mesh;
    private _planeMaterial : NodeMaterial;

    private static ZOOM_MOUSE_SPEED : number = 0.0005;
    private static ZOOM_KEYBOARD_SPEED : number = 0.2;
    private static PAN_SPEED : number = 0.002;
    private static PAN_BUTTON : number = 0; // left mouse button
    private static MIN_SCALE : number = 0.01;
    private static MAX_SCALE : number = 10;

    public constructor(targetCanvas: HTMLCanvasElement, texture: BaseTexture) {
        this._canvas = targetCanvas;

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0.2, 0.2, 0.2, 1.0);

        this._camera = new FreeCamera("Camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

        if (texture) {
            /* Grab image data from original texture and paint it onto the context of a DynamicTexture */
            const pixelData = texture.readPixels()!;
            const arr = new Uint8ClampedArray(pixelData.buffer);
            let imgData = new ImageData(arr, texture.getSize().width, texture.getSize().height);
            this._texture = new DynamicTexture("texture", texture.getSize(), this._scene, false);
            const ctx = this._texture.getContext();
            ctx.putImageData(imgData, 0, 0);
            this._texture.update();
            this._texture.hasAlpha = texture.hasAlpha;
        } else {
            /* If we don't have a texture to start with, just generate a white rectangle */
            this._texture = new DynamicTexture("texture",  256, this._scene, false);
            const ctx = this._texture.getContext();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 256, 256);
            this._texture.update();
        }

        this._texture.updateSamplingMode(Engine.TEXTURE_NEAREST_LINEAR);
        const textureRatio = this._texture.getSize().width / this._texture.getSize().height;

        this._plane = PlaneBuilder.CreatePlane("plane", {width: textureRatio, height: 1}, this._scene);
        this._planeMaterial = TextureEditorMaterial(this._texture);
        this._plane.material = this._planeMaterial;
        this._plane.enableEdgesRendering();
        this._plane.edgesWidth = 4.0;
        this._plane.edgesColor = new Color4(1,1,1,1);

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();

        });

        this._scale = 1;
        this._isPanning = false;

        this._scene.onBeforeRenderObservable.add(() => {
            let ratio = this._canvas?.width / this._canvas?.height;
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
                    this._scale = Math.min(Math.max(this._scale, TextureCanvasManager.MIN_SCALE), TextureCanvasManager.MAX_SCALE);
                    break;
                case PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_BUTTON) {
                        this._isPanning = true;
                        this._mouseX = pointerInfo.event.x;
                        this._mouseY = pointerInfo.event.y;
                    }
                    break;
                case PointerEventTypes.POINTERUP:
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_BUTTON) {
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
            }
        })

        this._scene.onKeyboardObservable.add((kbInfo) => {
            switch(kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.key == "+") {
                        this._scale -= TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    if (kbInfo.event.key == "-") {
                        this._scale += TextureCanvasManager.ZOOM_KEYBOARD_SPEED * this._scale;
                    }
                    this._scale = Math.min(Math.max(this._scale, TextureCanvasManager.MIN_SCALE), TextureCanvasManager.MAX_SCALE);
                    break;
            }
        })

    }

    public dispose() {
        this._planeMaterial.dispose();
        this._texture.dispose();
        this._plane.dispose();
        this._camera.dispose();
        this._scene.dispose();
        this._engine.dispose();
    }
} 
