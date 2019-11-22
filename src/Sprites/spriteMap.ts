import { Engine } from "../Engines/engine";
import { IDisposable, Scene } from "../scene";
import { Nullable } from "../types";
import { Vector2, Vector3 } from "../Maths/math.vector";
//import { Color3 } from "../Maths/math.color";
//import { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import { RawTexture } from "../Materials/Textures/rawTexture";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import { Mesh } from "../Meshes/mesh";
import { Observer } from "../Misc/observable";
import { ExecuteCodeAction } from "../Actions/directActions";
import { ActionManager } from "../Actions/actionManager";
import { PickingInfo } from "../Collisions/pickingInfo";

import "../Meshes/Builders/planeBuilder";

/**
 * Defines the minimum interface to fulfill in order to be a sprite map.
 */
export interface ISpriteMap extends IDisposable {

}

/**
 * Class used to manage a grid restricted sprite deployment on an Output plane.
 */
export class SpriteMap implements ISpriteMap {

    /** The Name of the spriteMap */
    public name : string;

    /** The JSON file with the frame and meta data */
    public atlasJSON : {frames: Array<any>, meta: object};

     /** The systems Sprite Sheet Texture */
    public spriteSheet : Texture;

    /** Arguments passed with the Constructor */
    public options : any;

    /** Public Sprite Storage array, parsed from atlasJSON */
    public sprites : Array<any>;

    /** Returns the Number of Sprites in the System */
    public get spriteCount(): number {
        return this.sprites.length;
    }

    /** Returns the Position of Output Plane*/
    public get position(): Vector3 {
        return this._output.position;
    }

    /** Returns the Position of Output Plane*/
    public set position(v: Vector3) {
        this._output.position = v;
    }

    /** Sets the AnimationMap*/
    public get animationMap() {
        return this._animationMap;
    }
        /** Sets the AnimationMap*/
    public set animationMap(v: RawTexture) {
        let buffer = v!._texture!._bufferView;
        let am = this.createTileAnimationBuffer(buffer);
        this._animationMap.dispose();
        this._animationMap = am;
        this._material.setTexture('animationMap', this._animationMap);
    }

    /** gets Editor Tile*/
    public get editorTile() {
        return this._editorTile;
    }
    /** Sets Editor Tile*/
    public set editorTile(v) {
        this._editorTile = v;
    }

    /** gets Editor Layer*/
    public get editorLayer() {
        return this._editorLayer;
    }
    /** Sets Editor Layer*/
    public set editorLayer(v) {
        this._editorLayer = v;
    }

    /** gets Editor Last Position*/
    public get editorPos() {
        return this._editorPos;
    }
    /** Sets Editor Last Position*/
    public set editorPos(v) {
        this._editorPos = v;
    }

    /** Scene that the SpriteMap was created in */
    private _scene: Scene;

    /** Texture Buffer of Float32 that holds tile frame data*/
    private _frameMap: RawTexture;

    /** Texture Buffers of Float32 that holds tileMap data*/
    private _tileMaps: RawTexture[];

    /** Texture Buffer of Float32 that holds Animation Data*/
    private _animationMap: RawTexture;

    /** Custom ShaderMaterial Central to the System*/
    private _material: ShaderMaterial;

    /** Custom ShaderMaterial Central to the System*/
    private _output: Mesh;

    /** Systems Time Ticker*/
    private _time: number;

    /** Private param that controls the editor mode of the SpriteMap*/
    private _editable : boolean;

    /**Storage for the Edtior mode*/
    private _editorTile : number = 0;
    /**Storage for the Edtior mode*/
    private _editorLayer : number = 0;
    /**Storage for the Edtior mode*/
    private _editorPos : Vector2 = new Vector2(-1, -1);

    /**
     * Creates a new SpriteMap
     * @param name defines the SpriteMaps Name
     * @param atlasJSON is the JSON file that controls the Sprites Frames and Meta
     * @param spriteSheet is the Texture that the Sprites are on.
     * @param options a basic deployment configuration
     * @param scene The Scene that the map is deployed on
     */
    constructor(name : string, atlasJSON: { meta: object, frames: Array<any> }, spriteSheet: Texture, options: {
        stageSize?: Vector2,
        outputSize?: Vector2
        outputPosition?: Vector3,
        layerCount?: number,
        maxAnimationFrames?: number,
        baseTile?: number,
        flipU?: number,
        colorMultiply?: Vector3,
        editable?: boolean
    }, scene : Scene) {

    this.name = name;
    this.sprites = [];
    this.atlasJSON = atlasJSON;
    this.sprites = this.atlasJSON['frames'];
    this.spriteSheet = spriteSheet;

    /**
    * Run through the options and set what ever defaults are needed that where not declared.
    */
    options.stageSize = options.stageSize || new Vector2(1, 1);
    options.outputSize = options.outputSize || options.stageSize;
    options.outputPosition = options.outputPosition || Vector3.Zero();
    options.layerCount = options.layerCount || 1;
    options.maxAnimationFrames = options.maxAnimationFrames || 0;
    options.baseTile = options.baseTile || 0;
    options.flipU = options.flipU || 0;
    options.editable = options.editable || false;
    options.colorMultiply = options.colorMultiply || new Vector3(1, 1, 1);

    this._scene = scene;
    this.options = options;

    this._frameMap = this.createFrameBuffer();

    this._tileMaps = new Array();
    for (let i = 0; i < options.layerCount; i++) {
            this._tileMaps.push(this.createTileBuffer(null, i));
    }

    this._animationMap = this.createTileAnimationBuffer(null);
    this._editable = options.editable;

    let defines = [];
    defines.push("#define LAYERS " + this.options.layerCount);

    if (this.options.editable) {
        defines.push("#define EDITABLE");
    }

   this._material = new ShaderMaterial("spriteMap:" + this.name, this._scene, {
        vertex: "spriteMap",
        fragment: "spriteMap",
    }, {
        defines,
        attributes: ["position", "normal", "uv"],
        uniforms: [
            "worldViewProjection",
            "time",
            'stageSize',
            'outputSize',
            'spriteMapSize',
            'spriteCount',
            'time',
            'maxAnimationFrames',
            'colorMul',
            'mousePosition',
            'curTile',
            'flipU'
        ],
        samplers: [
           "spriteSheet", "frameMap", "tileMaps", "animationMap"
        ],
        needAlphaBlending: true
    });

    this._time = 0;

    this._material.setFloat('spriteCount', this.spriteCount);
    this._material.setFloat('maxAnimationFrames', this.options.maxAnimationFrames);
    this._material.setVector2('stageSize', this.options.stageSize);
    this._material.setVector2('outputSize', this.options.outputSize);
    this._material.setTexture('spriteSheet', this.spriteSheet);
    this._material.setVector2('spriteMapSize', new Vector2(1, 1));
    this._material.setVector3('colorMul', this.options.colorMultiply);
    this._material.setFloat('flipU', this.options.flipU);

    //let parent = this;
    let tickSave = 0;
    const bindSpriteTexture = () => {
        if ((this.spriteSheet) && this.spriteSheet.isReady()) {
            if (this.spriteSheet._texture) {
                console.log('SpriteSheet size Set!');
                this._material.setVector2('spriteMapSize', new Vector2(this.spriteSheet._texture.baseWidth || 1, this.spriteSheet._texture.baseHeight || 1));
                return;
            }
        }
        if (tickSave < 100) {
            setTimeout(() => {tickSave++; bindSpriteTexture(); }, 100);
        }
    };

    bindSpriteTexture();

    this._material.setVector3('colorMul', this.options.colorMultiply);
    this._material.setTexture("frameMap", this._frameMap);
    this._material.setTextureArray("tileMaps", this._tileMaps);
    this._material.setTexture("animationMap", this._animationMap);
    this._material.setFloat('time', this._time);

    this._output = Mesh.CreatePlane(name + ":output", 1, scene, true);
    this._output.scaling.x = this.options.outputSize.x;
    this._output.scaling.y = this.options.outputSize.y;

    let obfunction = null;
       if (this._editable) {

            obfunction = () => {
                this._time += this._scene.getEngine().getDeltaTime() * 0.01;
                this._material.setFloat('time', this._time);
                this._material.setVector2('mousePosition', this.getMousePosition());
                this._material.setFloat('curTile', this.editorTile);
            };

            this._output.actionManager = new ActionManager(this._scene);
            const drawing = () => {
                let pos = this.getTileID();
                console.log(pos);
                if (pos.x == this.editorPos.x &&
                    pos.y == this.editorPos.y) {
                        return;
                    }
                this.editorPos = pos;
                this.changeTiles(this.editorLayer, pos, this.editorTile);
            };

            let _drawObs: Nullable<Observer<Scene>> = null;

            this._output.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnLeftPickTrigger,
                (evt: any) => {
                        if (((this._scene) && this._scene.activeCamera)) {
                        if (this._scene.getEngine && this._scene.getEngine().getInputElement) {
                            let canvas: Nullable<HTMLElement> = this._scene.getEngine().getInputElement();
                            if (!canvas) {
                                return;
                            }
                            this._scene.activeCamera.detachControl(canvas);
                            _drawObs = this._scene.onAfterRenderObservable.add(drawing);
                        }
                    }
                })
            );

            this._output.actionManager.registerAction(new ExecuteCodeAction(
                ActionManager.OnPickUpTrigger,
                (evt: any) => {
                    if (((this._scene) && this._scene.activeCamera)) {
                        if (this._scene.getEngine && this._scene.getEngine().getInputElement) {
                            let canvas: Nullable<HTMLElement> = this._scene.getEngine().getInputElement();
                            if (!canvas) {
                                return;
                            }
                            this._scene.activeCamera.attachControl(canvas);
                            this._scene.onAfterRenderObservable.remove(_drawObs);
                            this.editorPos = new Vector2(-1, -1);
                        }
                    }
                })
            );

            if (!this._scene.actionManager) {
                 this._scene.actionManager = new ActionManager(this._scene);
            }

            this._scene.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt: any) => {
                    switch (evt.sourceEvent.key){
                        case '-':
                            this.editorTile = Math.max(0.0, this.editorTile - 1) ;
                        break;
                        case '=':
                            this.editorTile = Math.min(this.editorTile + 1, this.spriteCount);
                        break;
                        case '[':
                            this.editorLayer = Math.max(0.0, this.editorLayer - 1) ;
                        break;
                        case ']':
                            this.editorLayer = Math.min(this.editorLayer + 1, this.options.layerCount);
                        break;
                    }
                })
            );

        }else {
            obfunction = () => {
                this._time += this._scene.getEngine().getDeltaTime() * 0.01;
                this._material.setFloat('time', this._time);
            };
        }

        this._scene.onBeforeRenderObservable.add(obfunction);
        this._output.material = this._material;
    }

    /**
    * Returns tileID location
    * @returns Vector2 the cell position ID
    */
    getTileID(): Vector2 {
        let p = this.getMousePosition();
        p.multiplyInPlace(this.options.stageSize);
        p.x = Math.floor(p.x);
        p.y = Math.floor(p.y);
        return p;
    }

    /**
    * Gets the UV location of the mouse over the SpriteMap, if In editable mode.
    * @returns Vector2 the UV position of the mouse interaction
    */
    getMousePosition(): Vector2 {
        let out = this._output;
        var pickinfo: Nullable<PickingInfo> = this._scene.pick(this._scene.pointerX, this._scene.pointerY, (mesh) => {
            if (mesh !== out) {
                return false;
            }
          return true;
        });

        if (((!pickinfo) || !pickinfo.hit) || !pickinfo.getTextureCoordinates) {
            return new Vector2(-1, -1);
        }

        let coords = pickinfo.getTextureCoordinates();
        if (coords) {
            return coords;
        }

        return 	new Vector2(-1, -1);
    }

    /**
    * Creates the "frame" texture Buffer
    * -------------------------------------
    * Structure of frames
    *  "filename": "Falling-Water-2.png",
    * "frame": {"x":69,"y":103,"w":24,"h":32},
    * "rotated": true,
    * "trimmed": true,
    * "spriteSourceSize": {"x":4,"y":0,"w":24,"h":32},
    * "sourceSize": {"w":32,"h":32}
    * @returns RawTexture of the frameMap
    */
    createFrameBuffer(): RawTexture {
        let data = new Array();
        //Do two Passes
        for (let i = 0; i < this.spriteCount; i++) {
            data.push(0, 0, 0, 0); //frame
            data.push(0, 0, 0, 0); //spriteSourceSize
            data.push(0, 0, 0, 0); //sourceSize, rotated, trimmed
            data.push(0, 0, 0, 0); //Keep it pow2 cause I'm cool like that... it helps with sampling accuracy as well. Plus then we have 4 other parameters for future stuff.
        }
        //Second Pass
        for (let i = 0; i < this.spriteCount; i++) {
            let f = this.sprites[i]['frame'];
            let sss = this.sprites[i]['spriteSourceSize'];
            let ss = this.sprites[i]['sourceSize'];
            let r = (this.sprites[i]['rotated']) ? 1 : 0;
            let t = (this.sprites[i]['trimmed']) ? 1 : 0;

            //frame
            data[i * 4] = f.x;
            data[i * 4 + 1] = f.y;
            data[i * 4 + 2] = f.w;
            data[i * 4 + 3] = f.h;
            //spriteSourceSize
            data[i * 4 + (this.spriteCount * 4)] = sss.x;
            data[i * 4 + 1 + (this.spriteCount * 4)] = sss.y;
            data[i * 4 + 2 + (this.spriteCount * 4)] = sss.w;
            data[i * 4 + 3 + (this.spriteCount * 4)] = sss.h;
            //sourceSize, rotated, trimmed
            data[i * 4 + (this.spriteCount * 8)] = ss.w;
            data[i * 4 + 1 + (this.spriteCount * 8)] = ss.h;
            data[i * 4 + 2 + (this.spriteCount * 8)] = r;
            data[i * 4 + 3 + (this.spriteCount * 8)] = t ;
        }

        let floatArray = new Float32Array(data);

        let t = RawTexture.CreateRGBATexture(
        floatArray,
        this.spriteCount,
        4,
        this._scene,
        false,
        false,
        Texture.NEAREST_NEAREST,
        Engine.TEXTURETYPE_FLOAT
        );

        return t;
    }

    /**
    * Creates the tileMap texture Buffer
    * @param buffer normaly and array of numbers, or a false to generate from scratch
    * @param _layer indicates what layer for a logic trigger dealing with the baseTile.  The system uses this
    * @returns RawTexture of the tileMap
    */
    createTileBuffer(buffer: any, _layer: number= 0): RawTexture {
        let data = new Array();

        if (!buffer) {
            let bt = this.options.baseTile;
            if (_layer != 0) {
                bt = 0;
            }
            for (let y = 0; y < this.options.stageSize.y; y++) {
                for (let x = 0; x < this.options.stageSize.x * 4; x += 4) {
                    data.push(bt, 0, 0, 0);
                }
            }
        }else {
            data = buffer;
        }

        let floatArray = new Float32Array(data);
        let t = RawTexture.CreateRGBATexture(
        floatArray,
        this.options.stageSize.x,
        this.options.stageSize.y,
        this._scene,
        false,
        false,
        Texture.NEAREST_NEAREST,
        Engine.TEXTURETYPE_FLOAT
        );

        return t;
    }

    /**
    * Modfies the data of the tileMaps
    * @param _layer is the ID of the layer you want to edit on the SpriteMap
    * @param pos is the iVector2 Coordinates of the Tile
    * @param tile The SpriteIndex of the new Tile
    */
    changeTiles(_layer: number= 0, pos: any , tile: number= 0): void {

        let buffer: any = [];
        buffer = this._tileMaps[_layer]!._texture!._bufferView;
        if (!buffer) {
            return;
        }

        let p = new Array();
        if (pos instanceof Vector2) {
            p.push(pos);
        }else {
            p = pos;
        }

        for (let i = 0; i < p.length; i++) {
            let _p = p[i];
            _p.x = Math.floor(_p.x);
            _p.y = Math.floor(_p.y);
            let id = (_p.x * 4) + (_p.y * (this.options.stageSize.x * 4));
            buffer[id] = tile;
        }

        let t = this.createTileBuffer(buffer);
        this._tileMaps[_layer].dispose();
        this._tileMaps[_layer] = t;
        this._material.setTextureArray("tileMap", this._tileMaps);
    }

    /**
    * Creates the animationMap texture Buffer
    * @param buffer normaly and array of numbers, or a false to generate from scratch
    * @returns RawTexture of the animationMap
    */
    createTileAnimationBuffer(buffer: any): RawTexture {
        let data = new Array();
        if (!buffer) {
            for (let i = 0; i < this.spriteCount; i++) {
                data.push(0, 0, 0, 0);
                let count = 1;
                while (count < (this.options.maxAnimationFrames || 4)) {
                    data.push(0, 0, 0, 0);
                    count++;
                }
            }
        }else {
            data = buffer;
        }

        let floatArray = new Float32Array(data);
        let t = RawTexture.CreateRGBATexture(
        floatArray,
        this.spriteCount,
        (this.options.maxAnimationFrames || 4),
        this._scene,
        false,
        false,
        Texture.NEAREST_NEAREST,
        Engine.TEXTURETYPE_FLOAT
        );

        return t;
    }
    /**
    * Modfies the data of the animationMap
    * @param cellID is the Index of the Sprite
    * @param _frame is the target Animation frame
    * @param toCell is the Target Index of the next frame of the animation
    * @param time is a value between 0-1 that is the trigger for when the frame should change tiles
    * @param speed is a global scalar of the time varable on the map.
    */
    addAnimationToTile(cellID: number= 0, _frame: number= 0, toCell: number= 0, time: number= 0, speed: number = 1): void {
        let buffer: any = this._animationMap!._texture!._bufferView;
        let id: number = (cellID * 4) + (this.spriteCount * 4 * _frame);
        if (!buffer) {
            return;
        }
        buffer[id || 0] = toCell;
        buffer[id + 1 || 0] = time;
        buffer[id + 2 || 0] = speed;
        let t = this.createTileAnimationBuffer(buffer);
        this._animationMap.dispose();
        this._animationMap = t;
        this._material.setTexture("animationMap", this._animationMap);
    }

    /**
    * Exports the .tilemaps file
    */
    saveTileMaps(): void {
        let maps = '';
        for (var i = 0; i < this._tileMaps.length; i++) {
            if (i > 0) {maps += '\n\r'; }

            maps += this._tileMaps[i]!._texture!._bufferView!.toString();
        }
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:octet/stream;charset=utf-8,' + encodeURI(maps);
        hiddenElement.target = '_blank';
        hiddenElement.download = this.name + '.tilemaps';
        hiddenElement.click();
        hiddenElement.remove();
    }

    /**
    * Imports the .tilemaps file
    * @param url of the .tilemaps file
    */
    loadTileMaps(url: string): void {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        //xhr.responseType = "octet/stream"

        xhr.onload = () =>
        {
            let data = xhr.response.split('\n\r');
            for (let i = 0; i < this.options.layerCount; i++) {
                let d = (data[i].split(',')).map(Number);
                let t = this.createTileBuffer(d);
                this._tileMaps[i].dispose();
                this._tileMaps[i] = t;
            }
            this._material.setTextureArray("tileMap", this._tileMaps);
        };
        xhr.send();
    }

    /**
     * Release associated resources
     */
    public dispose(): void {
        this._output.dispose();
        this._material.dispose();
        this._animationMap.dispose();
        this._tileMaps.forEach((tm) => {
            tm.dispose();
        });
        this._frameMap.dispose();
    }
}