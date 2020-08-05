import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Vector3, Vector2 } from 'babylonjs/Maths/math.vector';
import { Color4, Color3 } from 'babylonjs/Maths/math.color';
import { FreeCamera } from 'babylonjs/Cameras/freeCamera';
import { Nullable } from 'babylonjs/types'

import { PlaneBuilder } from 'babylonjs/Meshes/Builders/planeBuilder';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Camera } from 'babylonjs/Cameras/camera';

import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { HtmlElementTexture } from 'babylonjs/Materials/Textures/htmlElementTexture';
import { InternalTexture } from 'babylonjs/Materials/Textures/internalTexture';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { RawCubeTexture } from 'babylonjs/Materials/Textures/rawCubeTexture';
import { CubeTexture } from 'babylonjs/Materials/Textures/cubeTexture';

import { ISize } from 'babylonjs/Maths/math.size';
import { Tools } from 'babylonjs/Misc/tools';

import { PointerEventTypes, PointerInfo } from 'babylonjs/Events/pointerEvents';
import { KeyboardEventTypes } from 'babylonjs/Events/keyboardEvents';

import { TextureHelper } from '../../../../../../textureHelper';

import { Tool } from './toolBar';
import { Channel } from './channelsBar';
import { AdvancedDynamicTexture, Rectangle, Control, StackPanel, TextBlock, Style } from 'babylonjs-gui';
import { ShaderMaterial, StandardMaterial } from 'babylonjs';

export interface PixelData {
    x? : number;
    y? : number;
    r? : number;
    g? : number;
    b? : number;
    a? : number;
}

export interface ToolGUI {
    adt: AdvancedDynamicTexture;
    toolWindow: StackPanel;
    isDragging: boolean;
    dragCoords: Nullable<Vector2>;
    style: Style;
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
    /* The canvas we apply post processes to */
    private _3DCanvas : HTMLCanvasElement;
    /* The canvas which handles channel filtering */
    private _channelsTexture : HtmlElementTexture;

    private _3DEngine : Engine;
    private _3DPlane : Mesh;
    private _3DCanvasTexture : HtmlElementTexture;
    public _3DScene : Scene;

    private _channels : Channel[] = [];
    private _face : number = 0;

    /* The texture from the original engine that we invoked the editor on */
    private _originalTexture: BaseTexture;
    /* This is a hidden texture which is only responsible for holding the actual texture memory in the original engine */
    private _target : HtmlElementTexture | RawCubeTexture;
    /* The internal texture representation of the original texture */
    private _originalInternalTexture : Nullable<InternalTexture> = null;
    /* Keeps track of whether we have modified the texture */
    private _didEdit : boolean = false;

    private _plane : Mesh;
    private _planeMaterial : ShaderMaterial;

    /* Tracks which keys are currently pressed */
    private _keyMap : any = {};

    private static ZOOM_MOUSE_SPEED : number = 0.0005;
    private static ZOOM_KEYBOARD_SPEED : number = 0.2;
    private static ZOOM_IN_KEY : string = '+';
    private static ZOOM_OUT_KEY : string = '-';

    private static PAN_SPEED : number = 0.002;
    private static PAN_MOUSE_BUTTON : number = 1; // MMB

    private static MIN_SCALE : number = 0.01;
    private static MAX_SCALE : number = 10;

    private _tool : Nullable<Tool>;

    private _setPixelData : (pixelData : PixelData) => void;

    public _GUI : ToolGUI;

    private _window : Window;

    public metadata : any = {
        color: '#ffffff',
        opacity: 1.0
    };

    private _editing3D : boolean = false;

    public constructor(
        texture: BaseTexture,
        window: Window,
        canvasUI: HTMLCanvasElement,
        canvas2D: HTMLCanvasElement,
        canvas3D: HTMLCanvasElement,
        setPixelData: (pixelData : PixelData) => void
    ) {
        this._window = window;

        this._UICanvas = canvasUI;
        this._2DCanvas = canvas2D;
        this._3DCanvas = canvas3D;
        this._setPixelData = setPixelData;

        this._size = texture.getSize();
        this._originalTexture = texture;
        this._originalInternalTexture = this._originalTexture._texture;
        this._engine = new Engine(this._UICanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = new Color4(0.11, 0.11, 0.11, 1.0);

        this._camera = new FreeCamera('camera', new Vector3(0, 0, -1), this._scene);
        this._camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

        this._channelsTexture = new HtmlElementTexture('ct', this._2DCanvas, {engine: this._engine, scene: null, samplingMode: Engine.TEXTURE_NEAREST_LINEAR});

        this._3DEngine = new Engine(this._3DCanvas);
        this._3DScene = new Scene(this._3DEngine);
        this._3DScene.clearColor = new Color4(0,0,0,0);
        this._3DCanvasTexture = new HtmlElementTexture('canvas', this._2DCanvas, {engine: this._3DEngine, scene: this._3DScene});
        this._3DCanvasTexture.hasAlpha = true;
        const cam = new FreeCamera('camera', new Vector3(0,0,-1), this._3DScene);
        cam.mode = Camera.ORTHOGRAPHIC_CAMERA;
        [cam.orthoBottom, cam.orthoLeft, cam.orthoTop, cam.orthoRight] = [-0.5, -0.5, 0.5, 0.5];
        this._3DPlane = PlaneBuilder.CreatePlane('texture', {width: 1, height: 1}, this._3DScene);
        const mat = new StandardMaterial('material', this._3DScene);
        mat.diffuseTexture = this._3DCanvasTexture;
        mat.disableLighting = true;
        mat.emissiveColor = Color3.White();
        this._3DPlane.material = mat;
        

        this.grabOriginalTexture();


        this._planeMaterial = new ShaderMaterial(
            'shader',
            this._scene,
            {
                vertexSource: `
                    precision highp float;

                    attribute vec3 position;
                    attribute vec2 uv;

                    uniform mat4 worldViewProjection;

                    varying vec2 vUV;

                    void main(void) {
                        gl_Position = worldViewProjection * vec4(position, 1.0);
                        vUV = uv;
                    }
                `,
                fragmentSource: `
                    precision highp float;
            
                    uniform sampler2D textureSampler;
            
                    uniform bool r;
                    uniform bool g;
                    uniform bool b;
                    uniform bool a;
            
                    varying vec2 vUV;
            
                    void main(void) {
                        float size = 20.0;
                        vec2 pos2 = vec2(gl_FragCoord.x, gl_FragCoord.y);
                        vec2 pos = floor(pos2 * 0.05);
                        float pattern = mod(pos.x + pos.y, 2.0); 
                        if (pattern == 0.0) {
                            pattern = 0.7;
                        }
                        vec4 bg = vec4(pattern, pattern, pattern, 1.0);
                        vec4 col = texture(textureSampler, vUV);
                        if (!r && !g && !b) {
                            if (a) {
                                col = vec4(col.a, col.a, col.a, 1.0);
                            } else {
                                col = vec4(0.0,0.0,0.0,0.0);
                            }
                        } else {
                            if (!r) {
                                col.r = 0.0;
                                if (!b) {
                                    col.r = col.g;
                                }
                                else if (!g) {
                                    col.r = col.b;
                                }
                            }
                            if (!g) {
                                col.g = 0.0;
                                if (!b) {
                                    col.g = col.r;
                                }
                                else if (!r) {
                                    col.g = col.b;
                                }
                            }
                            if (!b) {
                                col.b = 0.0;
                                if (!r) {
                                    col.b = col.g;
                                } else if (!g) {
                                    col.b = col.r;
                                }
                            }
                            if (!a) {
                                col.a = 1.0;
                            }
                        }
                        gl_FragColor = col;
                        gl_FragColor = col * (col.a) + bg * (1.0 - col.a);
                    }`
            },
        {
            attributes: ['position', 'uv'],
            uniforms: ['worldViewProjection', 'textureSampler', 'r', 'g', 'b', 'a']
        });

        this._planeMaterial.setTexture('textureSampler', this._channelsTexture);
        this._planeMaterial.setFloat('r', 1.0);
        this._planeMaterial.setFloat('g', 1.0);
        this._planeMaterial.setFloat('b', 1.0);
        this._planeMaterial.setFloat('a', 1.0);
        this._plane.material = this._planeMaterial;
        
        const adt = AdvancedDynamicTexture.CreateFullscreenUI('gui', true, this._scene);
        const style = adt.createStyle();
        style.fontFamily = 'acumin-pro-condensed';
        style.fontSize = '15px';

        const toolWindow = new StackPanel();
        toolWindow.background = '#333333';
        toolWindow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        toolWindow.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        toolWindow.left = '0px';
        toolWindow.top = '-30px';
        toolWindow.width = '200px';
        toolWindow.isVisible = false;
        toolWindow.isPointerBlocker = true;
        adt.addControl(toolWindow);

        this._GUI = {adt, style, toolWindow, isDragging: false, dragCoords: null};

        const topBar = new Rectangle();
        topBar.width = '100%';
        topBar.height = '20px';
        topBar.background = '#666666';
        topBar.thickness = 0;
        topBar.hoverCursor = 'grab';
        topBar.onPointerDownObservable.add(evt => {this._GUI.isDragging = true; topBar.hoverCursor = 'grabbing';});
        topBar.onPointerUpObservable.add(() => {this._GUI.isDragging = false; this._GUI.dragCoords = null; topBar.hoverCursor = 'grab';});

        const title = new TextBlock();
        title.text = 'Tool Settings';
        title.color = 'white';
        title.height = '20px';
        title.style = this._GUI.style;
        topBar.addControl(title);
        this._GUI.toolWindow.addControl(topBar);

        this._window.addEventListener('pointermove',  (evt : PointerEvent) => {
            if (!this._GUI.isDragging) return;
            if (!this._GUI.dragCoords) {
                this._GUI.dragCoords = new Vector2(evt.x, evt.y);
                return;
            }
            let x = parseInt(this._GUI.toolWindow.left.toString().replace('px', ''));
            let y = parseInt(this._GUI.toolWindow.top.toString().replace('px', ''));
            x += evt.x - this._GUI.dragCoords.x;
            y += evt.y - this._GUI.dragCoords.y;
            this._GUI.toolWindow.left = `${x}px`;
            this._GUI.toolWindow.top = `${y}px`;
            this._GUI.dragCoords.x = evt.x;
            this._GUI.dragCoords.y = evt.y;
        });

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
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
                    if (pointerInfo.event.button === TextureCanvasManager.PAN_MOUSE_BUTTON) {
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
                break;
            }
        });
    }

    public async updateTexture() {
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
                this._target = new HtmlElementTexture(
                    "editor",
                    element,
                    {
                        engine: this._originalTexture.getScene()?.getEngine()!,
                        scene: null,
                        samplingMode: (this._originalTexture as Texture).samplingMode
                    }
                );
            } else {
                (this._target as HtmlElementTexture).element = element;
            }
            (this._target as HtmlElementTexture).update((this._originalTexture as Texture).invertY);
        }
        this._originalTexture._texture = this._target._texture;
        this._channelsTexture.element = element;
        this.updateDisplay();
    }

    private updateDisplay() {
        this._3DScene.render()
        this._channelsTexture.update();
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
                        this._planeMaterial.setFloat(channel.id.toLowerCase(), channel.visible ? 1.0 : 0.0);
                    }
                }
            );
        }
        this._channels = channels;
        if (needsRender) {
            this.updateDisplay();
        }
    }

    public static paintPixelsOnCanvas(pixelData : Uint8Array, canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(pixelData);
        ctx.putImageData(imgData, 0, 0);
    }

    public grabOriginalTexture(adjustZoom = true) {
        // Grab image data from original texture and paint it onto the context of a DynamicTexture
        this.setSize(this._originalTexture.getSize(), adjustZoom);
        TextureHelper.GetTextureDataAsync(
            this._originalTexture,
            this._size.width,
            this._size.height,
            this._face,
            {R:true ,G:true ,B:true ,A:true}
        ).then(data => {
            TextureCanvasManager.paintPixelsOnCanvas(data, this._2DCanvas);
            this._3DCanvasTexture.update();
            this.updateDisplay();
        })
    }

    public getMouseCoordinates(pointerInfo : PointerInfo) {
        if (pointerInfo.pickInfo?.hit) {
            const x = Math.floor(pointerInfo.pickInfo.getTextureCoordinates()!.x * this._size.width);
            const y = Math.floor((1 - pointerInfo.pickInfo.getTextureCoordinates()!.y) * this._size.height);
            return new Vector2(x,y);
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

    public set tool(tool: Nullable<Tool>) {
        if (this._tool) {
            this._tool.instance.cleanup();
        }
        this._tool = tool;
        if (this._tool) {
            this._tool.instance.setup();
            if (this._tool.usesWindow) {
                this._GUI.toolWindow.isVisible = true;
            } else {
                this._GUI.toolWindow.isVisible = false;
            }
            if (this._editing3D && !this._tool.is3D) {
                this._editing3D = false;
                this._2DCanvas.getContext('2d')?.drawImage(this._3DCanvas, 0, 0);
            }
            else if (!this._editing3D && this._tool.is3D) {
                this._editing3D = true;
                this.updateTexture();
            }
        }
    }

    public get tool() {
        return this._tool;
    }

    // BROKEN : FIX THIS
    public set face(face: number) {
        if (this._face !== face) {
            this._face = face;
            this.grabOriginalTexture(false);
            this.updateDisplay();
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
        this._plane.material = this._planeMaterial;
    }

    public reset() : void {
        this._originalTexture._texture = this._originalInternalTexture;
        this.grabOriginalTexture();
        this.makePlane();
        this._didEdit = false;
    }

    public async resize(newSize : ISize) {
        const data = await TextureHelper.GetTextureDataAsync(this._originalTexture, newSize.width, newSize.height, this._face, {R: true,G: true,B: true,A: true});
        this.setSize(newSize);
        TextureCanvasManager.paintPixelsOnCanvas(data, this._2DCanvas);
        this.updateTexture();
        this._didEdit = true;
    }

    public setSize(size: ISize, adjustZoom = true) {
        this._size = size;
        this._2DCanvas.width = this._size.width;
        this._2DCanvas.height = this._size.height;
        this._3DCanvas.width = this._size.width;
        this._3DCanvas.height = this._size.height;
        if (adjustZoom) {
            this._camera.position.x = 0;
            this._camera.position.y = 0;
            this._scale = 1.5 / (this._size.width/this._size.height);
        }
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
                                    this.setSize(texture.getSize());
                                    TextureCanvasManager.paintPixelsOnCanvas(pixels, this._2DCanvas);
                                    this.updateTexture();
                                    texture.dispose();
                                });
                        }
                    );
                }
            };

        }, undefined, true);
    }

    public dispose() {
        if (this._didEdit) {
            this._originalInternalTexture?.dispose();
        }
        if (this._tool) {
            this._tool.instance.cleanup();
        }        
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
