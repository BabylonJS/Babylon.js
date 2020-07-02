import { GlobalState } from '../../globalState';
import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { FreeCamera } from 'babylonjs/Cameras/freeCamera';
import { PlaneBuilder } from 'babylonjs/Meshes/Builders/planeBuilder';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { Camera } from 'babylonjs/Cameras/camera';
import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';
import { DynamicTexture } from 'babylonjs/Materials/Textures/dynamicTexture';



export class TextureCanvasManager {
    private _engine: Engine;
    private _scene: Scene;
    private _texture: DynamicTexture;
    private _globalState: GlobalState;
    private _camera: FreeCamera;
    private _plane : Mesh;
    private _planeMaterial : PBRMaterial;
    private _scale : number;
    private _canvas : HTMLCanvasElement;
    private _isPanning : boolean;
    private _mouseX : number;
    private _mouseY : number;

    private static ZOOM_SPEED : number = 0.0005;
    private static PAN_SPEED : number = 0.002;
    private static PAN_BUTTON : number = 1; // middle mouse wheel
    private static MIN_SCALE : number = 0.01;
    private static MAX_SCALE : number = 10;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._canvas = targetCanvas;
        this._globalState = globalState;

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = this._globalState.backgroundColor;

        this._camera = new FreeCamera("Camera", new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        
        if (globalState.texture) {
            /* Grab image data from original texture and paint it onto the context of a DynamicTexture */
            const pixelData = globalState.texture.readPixels()!;
            const arr = new Uint8ClampedArray(pixelData.buffer);
            let imgData = new ImageData(arr, globalState.texture.getSize().width, globalState.texture.getSize().height);
            this._texture = new DynamicTexture("texture", globalState.texture.getSize(), this._scene, false);
            const ctx = this._texture.getContext();
            ctx.putImageData(imgData, 0, 0);
            this._texture.update();
            this._texture.hasAlpha = globalState.texture.hasAlpha;
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
        this._planeMaterial = new PBRMaterial("planeMaterial", this._scene);
        this._planeMaterial.unlit = true;
        this._planeMaterial.albedoTexture = this._texture;
        this._plane.material = this._planeMaterial;

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
                    this._scale += (event.deltaY * TextureCanvasManager.ZOOM_SPEED * this._scale);
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