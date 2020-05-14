import { IDisposable, Scene } from "../scene";
import { Nullable } from "../types";
import { Observable, Observer } from "../Misc/observable";
import { Buffer } from "../Meshes/buffer";
import { VertexBuffer } from "../Meshes/buffer";
import { Vector3, TmpVectors } from "../Maths/math.vector";
import { Sprite } from "./sprite";
import { SpriteSceneComponent } from "./spriteSceneComponent";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { SceneComponentConstants } from "../sceneComponent";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";

import "../Shaders/sprites.fragment";
import "../Shaders/sprites.vertex";
import { DataBuffer } from '../Meshes/dataBuffer';
import { Engine } from '../Engines/engine';
import { WebRequest } from '../Misc/webRequest';
declare type Ray = import("../Culling/ray").Ray;

/**
 * Defines the minimum interface to fullfil in order to be a sprite manager.
 */
export interface ISpriteManager extends IDisposable {

    /**
     * Gets manager's name
     */
    name: string;

    /**
     * Restricts the camera to viewing objects with the same layerMask.
     * A camera with a layerMask of 1 will render spriteManager.layerMask & camera.layerMask!== 0
     */
    layerMask: number;

    /**
     * Gets or sets a boolean indicating if the mesh can be picked (by scene.pick for instance or through actions). Default is true
     */
    isPickable: boolean;

    /**
     * Gets the hosting scene
     */
    scene: Scene;

    /**
     * Specifies the rendering group id for this mesh (0 by default)
     * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered#rendering-groups
     */
    renderingGroupId: number;

    /**
     * Defines the list of sprites managed by the manager.
     */
    sprites: Array<Sprite>;

    /**
     * Gets or sets the spritesheet texture
     */
    texture: Texture;

    /** Defines the default width of a cell in the spritesheet */
    cellWidth: number;
    /** Defines the default height of a cell in the spritesheet */
    cellHeight: number;

    /**
     * Tests the intersection of a sprite with a specific ray.
     * @param ray The ray we are sending to test the collision
     * @param camera The camera space we are sending rays in
     * @param predicate A predicate allowing excluding sprites from the list of object to test
     * @param fastCheck defines if the first intersection will be used (and not the closest)
     * @returns picking info or null.
     */
    intersects(ray: Ray, camera: Camera, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean): Nullable<PickingInfo>;

    /**
     * Intersects the sprites with a ray
     * @param ray defines the ray to intersect with
     * @param camera defines the current active camera
     * @param predicate defines a predicate used to select candidate sprites
     * @returns null if no hit or a PickingInfo array
     */
    multiIntersects(ray: Ray, camera: Camera, predicate?: (sprite: Sprite) => boolean): Nullable<PickingInfo[]>;

    /**
     * Renders the list of sprites on screen.
     */
    render(): void;
}

/**
 * Class used to manage multiple sprites on the same spritesheet
 * @see http://doc.babylonjs.com/babylon101/sprites
 */
export class SpriteManager implements ISpriteManager {
    /** Define the Url to load snippets */
    public static SnippetUrl = "https://snippet.babylonjs.com";

    /** Snippet ID if the manager was created from the snippet server */
    public snippetId: string;

    /** Gets the list of sprites */
    public sprites = new Array<Sprite>();
    /** Gets or sets the rendering group id (0 by default) */
    public renderingGroupId = 0;
    /** Gets or sets camera layer mask */
    public layerMask: number = 0x0FFFFFFF;
    /** Gets or sets a boolean indicating if the manager must consider scene fog when rendering */
    public fogEnabled = true;
    /** Gets or sets a boolean indicating if the sprites are pickable */
    public isPickable = false;
    /** Defines the default width of a cell in the spritesheet */
    public cellWidth: number;
    /** Defines the default height of a cell in the spritesheet */
    public cellHeight: number;

    /** Associative array from JSON sprite data file */
    private _cellData: any;
    /** Array of sprite names from JSON sprite data file */
    private _spriteMap: Array<string>;
    /** True when packed cell data from JSON file is ready*/
    private _packedAndReady: boolean = false;

    private _textureContent: Nullable<Uint8Array>;

    /**
    * An event triggered when the manager is disposed.
    */
    public onDisposeObservable = new Observable<SpriteManager>();

    private _onDisposeObserver: Nullable<Observer<SpriteManager>>;

    /**
     * Callback called when the manager is disposed
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    private _capacity: number;
    private _fromPacked: boolean;
    private _spriteTexture: Texture;
    private _epsilon: number;

    private _scene: Scene;

    private _vertexData: Float32Array;
    private _buffer: Buffer;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};
    private _indexBuffer: DataBuffer;
    private _effectBase: Effect;
    private _effectFog: Effect;

    /**
     * Gets or sets the unique id of the sprite
     */
    public uniqueId: number;

    /**
     * Gets the array of sprites
     */
    public get children() {
        return this.sprites;
    }

    /**
     * Gets the hosting scene
     */
    public get scene() {
        return this._scene;
    }

    /**
     * Gets the capacity of the manager
     */
    public get capacity() {
        return this._capacity;
    }

    /**
     * Gets or sets the spritesheet texture
     */
    public get texture(): Texture {
        return this._spriteTexture;
    }

    public set texture(value: Texture) {
        this._spriteTexture = value;
        this._spriteTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._spriteTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._textureContent = null;
    }

    private _blendMode = Constants.ALPHA_COMBINE;
    /**
     * Blend mode use to render the particle, it can be any of
     * the static Constants.ALPHA_x properties provided in this class.
     * Default value is Constants.ALPHA_COMBINE
     */
    public get blendMode() { return this._blendMode; }
    public set blendMode(blendMode: number) {
        this._blendMode = blendMode;
    }

    /** Disables writing to the depth buffer when rendering the sprites.
     *  It can be handy to disable depth writing when using textures without alpha channel
     *  and setting some specific blend modes.
    */
    public disableDepthWrite: boolean = false;

    /**
     * Creates a new sprite manager
     * @param name defines the manager's name
     * @param imgUrl defines the sprite sheet url
     * @param capacity defines the maximum allowed number of sprites
     * @param cellSize defines the size of a sprite cell
     * @param scene defines the hosting scene
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param samplingMode defines the smapling mode to use with spritesheet
     * @param fromPacked set to false; do not alter
     * @param spriteJSON null otherwise a JSON object defining sprite sheet data; do not alter
     */
    constructor(
        /** defines the manager's name */
        public name: string,
        imgUrl: string, capacity: number, cellSize: any, scene: Scene, epsilon: number = 0.01, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, fromPacked: boolean = false, spriteJSON: any | null = null) {
        if (!scene._getComponent(SceneComponentConstants.NAME_SPRITE)) {
            scene._addComponent(new SpriteSceneComponent(scene));
        }
        this._capacity = capacity;
        this._fromPacked = fromPacked;

        if (imgUrl) {
            this._spriteTexture = new Texture(imgUrl, scene, true, false, samplingMode);
            this._spriteTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._spriteTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        }

        if (cellSize.width && cellSize.height) {
            this.cellWidth = cellSize.width;
            this.cellHeight = cellSize.height;
        } else if (cellSize !== undefined) {
            this.cellWidth = cellSize;
            this.cellHeight = cellSize;
        } else {
            return;
        }

        this._epsilon = epsilon;
        this._scene = scene || Engine.LastCreatedScene;
        this._scene.spriteManagers.push(this);
        this.uniqueId = this.scene.getUniqueId();

        var indices = [];
        var index = 0;
        for (var count = 0; count < capacity; count++) {
            indices.push(index);
            indices.push(index + 1);
            indices.push(index + 2);
            indices.push(index);
            indices.push(index + 2);
            indices.push(index + 3);
            index += 4;
        }

        this._indexBuffer = scene.getEngine().createIndexBuffer(indices);

        // VBO
        // 18 floats per sprite (x, y, z, angle, sizeX, sizeY, offsetX, offsetY, invertU, invertV, cellLeft, cellTop, cellWidth, cellHeight, color r, color g, color b, color a)
        this._vertexData = new Float32Array(capacity * 18 * 4);
        this._buffer = new Buffer(scene.getEngine(), this._vertexData, true, 18);

        var positions = this._buffer.createVertexBuffer(VertexBuffer.PositionKind, 0, 4);
        var options = this._buffer.createVertexBuffer("options", 4, 4);
        var inverts = this._buffer.createVertexBuffer("inverts", 8, 2);
        var cellInfo = this._buffer.createVertexBuffer("cellInfo", 10, 4);
        var colors = this._buffer.createVertexBuffer(VertexBuffer.ColorKind, 14, 4);

        this._vertexBuffers[VertexBuffer.PositionKind] = positions;
        this._vertexBuffers["options"] = options;
        this._vertexBuffers["inverts"] = inverts;
        this._vertexBuffers["cellInfo"] = cellInfo;
        this._vertexBuffers[VertexBuffer.ColorKind] = colors;

        // Effects
        this._effectBase = this._scene.getEngine().createEffect("sprites",
            [VertexBuffer.PositionKind, "options", "inverts", "cellInfo", VertexBuffer.ColorKind],
            ["view", "projection", "textureInfos", "alphaTest"],
            ["diffuseSampler"], "");

        this._effectFog = this._scene.getEngine().createEffect("sprites",
            [VertexBuffer.PositionKind, "options", "inverts", "cellInfo", VertexBuffer.ColorKind],
            ["view", "projection", "textureInfos", "alphaTest", "vFogInfos", "vFogColor"],
            ["diffuseSampler"], "#define FOG");

        if (this._fromPacked) {
            this._makePacked(imgUrl, spriteJSON);
        }
    }

    /**
     * Returns the string "SpriteManager"
     * @returns "SpriteManager"
     */
    public getClassName(): string {
        return "SpriteManager";
    }

    private _makePacked(imgUrl: string, spriteJSON: any) {
        if (spriteJSON !== null) {
            try {
                //Get the JSON and Check its stucture.  If its an array parse it if its a JSON sring etc...
                let celldata: any;
                if (typeof spriteJSON === "string") {
                    celldata = JSON.parse(spriteJSON);
                }else {
                    celldata = spriteJSON;
                }

                if (celldata.frames.length) {
                    let frametemp: any = {};
                    for (let i = 0; i < celldata.frames.length; i++) {
                        let _f = celldata.frames[i];
                        if (typeof (Object.keys(_f))[0] !== "string") {
                            throw new Error("Invalid JSON Format.  Check the frame values and make sure the name is the first parameter.");
                        }

                        let name: string = _f[(Object.keys(_f))[0]];
                        frametemp[name] = _f;
                    }
                    celldata.frames = frametemp;
                }

                let spritemap = (<string[]>(<any>Reflect).ownKeys(celldata.frames));

                this._spriteMap = spritemap;
                this._packedAndReady = true;
                this._cellData = celldata.frames;
            }
            catch (e) {
                this._fromPacked = false;
                this._packedAndReady = false;
                throw new Error("Invalid JSON from string. Spritesheet managed with constant cell size.");
            }
        }
        else {
            let re = /\./g;
            let li: number;
            do {
                li = re.lastIndex;
                re.test(imgUrl);
            } while (re.lastIndex > 0);
            let jsonUrl = imgUrl.substring(0, li - 1) + ".json";
            let xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", jsonUrl, true);
            xmlhttp.onerror = () => {
                Logger.Error("JSON ERROR: Unable to load JSON file.");
                this._fromPacked = false;
                this._packedAndReady = false;
            };
            xmlhttp.onload = () => {
                try {
                    let celldata  = JSON.parse(xmlhttp.response);
                    let spritemap = (<string[]>(<any>Reflect).ownKeys(celldata.frames));
                    this._spriteMap = spritemap;
                    this._packedAndReady = true;
                    this._cellData = celldata.frames;
                }
                catch (e) {
                    this._fromPacked = false;
                    this._packedAndReady = false;
                    throw new Error("Invalid JSON format. Please check documentation for format specifications.");
                }
            };
            xmlhttp.send();
        }
    }

    private _appendSpriteVertex(index: number, sprite: Sprite, offsetX: number, offsetY: number, baseSize: any): void {
        var arrayOffset = index * 18;

        if (offsetX === 0) {
            offsetX = this._epsilon;
        }
        else if (offsetX === 1) {
            offsetX = 1 - this._epsilon;
        }

        if (offsetY === 0) {
            offsetY = this._epsilon;
        }
        else if (offsetY === 1) {
            offsetY = 1 - this._epsilon;
        }

        // Positions
        this._vertexData[arrayOffset] = sprite.position.x;
        this._vertexData[arrayOffset + 1] = sprite.position.y;
        this._vertexData[arrayOffset + 2] = sprite.position.z;
        this._vertexData[arrayOffset + 3] = sprite.angle;
        // Options
        this._vertexData[arrayOffset + 4] = sprite.width;
        this._vertexData[arrayOffset + 5] = sprite.height;
        this._vertexData[arrayOffset + 6] = offsetX;
        this._vertexData[arrayOffset + 7] = offsetY;

        // Inverts according to Right Handed
        if (this._scene.useRightHandedSystem) {
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 0 : 1;
        }
        else {
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 1 : 0;
        }

        this._vertexData[arrayOffset + 9] = sprite.invertV ? 1 : 0;
        // CellIfo
        if (this._packedAndReady) {
            if (!sprite.cellRef) {
                sprite.cellIndex = 0;
            }
            let num = sprite.cellIndex;
            if (typeof (num) === "number" && isFinite(num) && Math.floor(num) === num) {
                sprite.cellRef = this._spriteMap[sprite.cellIndex];
            }
            sprite._xOffset = this._cellData[sprite.cellRef].frame.x / baseSize.width;
            sprite._yOffset = this._cellData[sprite.cellRef].frame.y / baseSize.height;
            sprite._xSize = this._cellData[sprite.cellRef].frame.w;
            sprite._ySize = this._cellData[sprite.cellRef].frame.h;
            this._vertexData[arrayOffset + 10] = sprite._xOffset;
            this._vertexData[arrayOffset + 11] = sprite._yOffset;
            this._vertexData[arrayOffset + 12] = sprite._xSize / baseSize.width;
            this._vertexData[arrayOffset + 13] = sprite._ySize / baseSize.height;
        }
        else {
            if (!sprite.cellIndex) {
                sprite.cellIndex = 0;
            }
            var rowSize = baseSize.width / this.cellWidth;
            var offset = (sprite.cellIndex / rowSize) >> 0;
            sprite._xOffset = (sprite.cellIndex - offset * rowSize) * this.cellWidth / baseSize.width;
            sprite._yOffset = offset * this.cellHeight / baseSize.height;
            sprite._xSize = this.cellWidth;
            sprite._ySize = this.cellHeight;
            this._vertexData[arrayOffset + 10] = sprite._xOffset;
            this._vertexData[arrayOffset + 11] = sprite._yOffset;
            this._vertexData[arrayOffset + 12] = this.cellWidth / baseSize.width;
            this._vertexData[arrayOffset + 13] = this.cellHeight / baseSize.height;
        }
        // Color
        this._vertexData[arrayOffset + 14] = sprite.color.r;
        this._vertexData[arrayOffset + 15] = sprite.color.g;
        this._vertexData[arrayOffset + 16] = sprite.color.b;
        this._vertexData[arrayOffset + 17] = sprite.color.a;
    }

    private _checkTextureAlpha(sprite: Sprite, ray: Ray, distance: number, min: Vector3, max: Vector3) {
        if (!sprite.useAlphaForPicking || !this._spriteTexture) {
            return true;
        }

        let textureSize = this._spriteTexture.getSize();
        if (!this._textureContent) {
            this._textureContent = new Uint8Array(textureSize.width * textureSize.height * 4);
            this._spriteTexture.readPixels(0, 0, this._textureContent);
        }

        let contactPoint = TmpVectors.Vector3[0];

        contactPoint.copyFrom(ray.direction);

        contactPoint.normalize();
        contactPoint.scaleInPlace(distance);
        contactPoint.addInPlace(ray.origin);

        let contactPointU = ((contactPoint.x - min.x) / (max.x - min.x)) - 0.5;
        let contactPointV = (1.0 - (contactPoint.y - min.y) / (max.y - min.y)) - 0.5;

        // Rotate
        let angle = sprite.angle;
        let rotatedU = 0.5 + (contactPointU * Math.cos(angle) - contactPointV * Math.sin(angle));
        let rotatedV = 0.5 + (contactPointU * Math.sin(angle) + contactPointV * Math.cos(angle));

        let u = (sprite._xOffset * textureSize.width + rotatedU * sprite._xSize) | 0;
        let v = (sprite._yOffset * textureSize.height +  rotatedV * sprite._ySize) | 0;

        let alpha = this._textureContent![(u + v * textureSize.width) * 4 + 3];

        return (alpha > 0.5);
    }

    /**
     * Intersects the sprites with a ray
     * @param ray defines the ray to intersect with
     * @param camera defines the current active camera
     * @param predicate defines a predicate used to select candidate sprites
     * @param fastCheck defines if a fast check only must be done (the first potential sprite is will be used and not the closer)
     * @returns null if no hit or a PickingInfo
     */
    public intersects(ray: Ray, camera: Camera, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean): Nullable<PickingInfo> {
        var count = Math.min(this._capacity, this.sprites.length);
        var min = Vector3.Zero();
        var max = Vector3.Zero();
        var distance = Number.MAX_VALUE;
        var currentSprite: Nullable<Sprite> = null;
        var pickedPoint = TmpVectors.Vector3[0];
        var cameraSpacePosition = TmpVectors.Vector3[1];
        var cameraView = camera.getViewMatrix();

        for (var index = 0; index < count; index++) {
            var sprite = this.sprites[index];
            if (!sprite) {
                continue;
            }

            if (predicate) {
                if (!predicate(sprite)) {
                    continue;
                }
            } else if (!sprite.isPickable) {
                continue;
            }

            Vector3.TransformCoordinatesToRef(sprite.position, cameraView, cameraSpacePosition);

            min.copyFromFloats(cameraSpacePosition.x - sprite.width / 2, cameraSpacePosition.y - sprite.height / 2, cameraSpacePosition.z);
            max.copyFromFloats(cameraSpacePosition.x + sprite.width / 2, cameraSpacePosition.y + sprite.height / 2, cameraSpacePosition.z);

            if (ray.intersectsBoxMinMax(min, max)) {
                var currentDistance = Vector3.Distance(cameraSpacePosition, ray.origin);

                if (distance > currentDistance) {

                    if (!this._checkTextureAlpha(sprite, ray, currentDistance, min, max)) {
                        continue;
                    }

                    distance = currentDistance;
                    currentSprite = sprite;

                    if (fastCheck) {
                        break;
                    }
                }
            }
        }

        if (currentSprite) {
            var result = new PickingInfo();

            cameraView.invertToRef(TmpVectors.Matrix[0]);
            result.hit = true;
            result.pickedSprite = currentSprite;
            result.distance = distance;

            // Get picked point
            let direction = TmpVectors.Vector3[2];
            direction.copyFrom(ray.direction);
            direction.normalize();
            direction.scaleInPlace(distance);

            ray.origin.addToRef(direction, pickedPoint);
            result.pickedPoint = Vector3.TransformCoordinates(pickedPoint, TmpVectors.Matrix[0]);

            return result;
        }

        return null;
    }

    /**
     * Intersects the sprites with a ray
     * @param ray defines the ray to intersect with
     * @param camera defines the current active camera
     * @param predicate defines a predicate used to select candidate sprites
     * @returns null if no hit or a PickingInfo array
     */
    public multiIntersects(ray: Ray, camera: Camera, predicate?: (sprite: Sprite) => boolean): Nullable<PickingInfo[]> {
        var count = Math.min(this._capacity, this.sprites.length);
        var min = Vector3.Zero();
        var max = Vector3.Zero();
        var distance: number;
        var results: Nullable<PickingInfo[]> = [];
        var pickedPoint = TmpVectors.Vector3[0].copyFromFloats(0, 0, 0);
        var cameraSpacePosition = TmpVectors.Vector3[1].copyFromFloats(0, 0, 0);
        var cameraView = camera.getViewMatrix();

        for (var index = 0; index < count; index++) {
            var sprite = this.sprites[index];
            if (!sprite) {
                continue;
            }

            if (predicate) {
                if (!predicate(sprite)) {
                    continue;
                }
            } else if (!sprite.isPickable) {
                continue;
            }

            Vector3.TransformCoordinatesToRef(sprite.position, cameraView, cameraSpacePosition);

            min.copyFromFloats(cameraSpacePosition.x - sprite.width / 2, cameraSpacePosition.y - sprite.height / 2, cameraSpacePosition.z);
            max.copyFromFloats(cameraSpacePosition.x + sprite.width / 2, cameraSpacePosition.y + sprite.height / 2, cameraSpacePosition.z);

            if (ray.intersectsBoxMinMax(min, max)) {
                distance = Vector3.Distance(cameraSpacePosition, ray.origin);

                if (!this._checkTextureAlpha(sprite, ray, distance, min, max)) {
                    continue;
                }

                var result = new PickingInfo();
                results.push(result);

                cameraView.invertToRef(TmpVectors.Matrix[0]);
                result.hit = true;
                result.pickedSprite = sprite;
                result.distance = distance;

                // Get picked point
                let direction = TmpVectors.Vector3[2];
                direction.copyFrom(ray.direction);
                direction.normalize();
                direction.scaleInPlace(distance);

                ray.origin.addToRef(direction, pickedPoint);
                result.pickedPoint = Vector3.TransformCoordinates(pickedPoint, TmpVectors.Matrix[0]);
            }

        }

        return results;
    }

    /**
     * Render all child sprites
     */
    public render(): void {
        // Check
        if (!this._effectBase.isReady() || !this._effectFog.isReady() || !this._spriteTexture
            || !this._spriteTexture.isReady() || !this.sprites.length) {
            return;
        }

        if (this._fromPacked  && (!this._packedAndReady || !this._spriteMap || !this._cellData)) {
            return;
        }

        var engine = this._scene.getEngine();
        var baseSize = this._spriteTexture.getBaseSize();

        // Sprites
        var deltaTime = engine.getDeltaTime();
        var max = Math.min(this._capacity, this.sprites.length);

        var offset = 0;
        let noSprite = true;
        for (var index = 0; index < max; index++) {
            var sprite = this.sprites[index];
            if (!sprite || !sprite.isVisible) {
                continue;
            }

            noSprite = false;
            sprite._animate(deltaTime);

            this._appendSpriteVertex(offset++, sprite, 0, 0, baseSize);
            this._appendSpriteVertex(offset++, sprite, 1, 0, baseSize);
            this._appendSpriteVertex(offset++, sprite, 1, 1, baseSize);
            this._appendSpriteVertex(offset++, sprite, 0, 1, baseSize);
        }

        if (noSprite) {
            return;
        }

        this._buffer.update(this._vertexData);

        // Render
        var effect = this._effectBase;

        if (this._scene.fogEnabled && this._scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
            effect = this._effectFog;
        }

        engine.enableEffect(effect);

        var viewMatrix = this._scene.getViewMatrix();
        effect.setTexture("diffuseSampler", this._spriteTexture);
        effect.setMatrix("view", viewMatrix);
        effect.setMatrix("projection", this._scene.getProjectionMatrix());

        // Fog
        if (this._scene.fogEnabled && this._scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
            effect.setFloat4("vFogInfos", this._scene.fogMode, this._scene.fogStart, this._scene.fogEnd, this._scene.fogDensity);
            effect.setColor3("vFogColor", this._scene.fogColor);
        }

        // VBOs
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

        // Handle Right Handed
        const culling = engine.depthCullingState.cull || true;
        const zOffset = engine.depthCullingState.zOffset;
        if (this._scene.useRightHandedSystem) {
            engine.setState(culling, zOffset, false, false);
        }

        // Draw order
        engine.setDepthFunctionToLessOrEqual();
        if (!this.disableDepthWrite) {
            effect.setBool("alphaTest", true);
            engine.setColorWrite(false);
            engine.drawElementsType(Material.TriangleFillMode, 0, (offset / 4) * 6);
            engine.setColorWrite(true);
            effect.setBool("alphaTest", false);
        }

        engine.setAlphaMode(this._blendMode);
        engine.drawElementsType(Material.TriangleFillMode, 0, (offset / 4) * 6);
        engine.setAlphaMode(Constants.ALPHA_DISABLE);

        // Restore Right Handed
        if (this._scene.useRightHandedSystem) {
            engine.setState(culling, zOffset, false, true);
        }
    }

    /**
     * Release associated resources
     */
    public dispose(): void {
        if (this._buffer) {
            this._buffer.dispose();
            (<any>this._buffer) = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            (<any>this._indexBuffer) = null;
        }

        if (this._spriteTexture) {
            this._spriteTexture.dispose();
            (<any>this._spriteTexture) = null;
        }

        this._textureContent = null;

        // Remove from scene
        var index = this._scene.spriteManagers.indexOf(this);
        this._scene.spriteManagers.splice(index, 1);

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }

    /**
     * Serializes the sprite manager to a JSON object
     * @param serializeTexture defines if the texture must be serialized as well
     * @returns the JSON object
     */
    public serialize(serializeTexture = false): any {
        var serializationObject: any = {};

        serializationObject.name = this.name;
        serializationObject.capacity = this.capacity;
        serializationObject.cellWidth = this.cellWidth;
        serializationObject.cellHeight = this.cellHeight;

        if (this.texture) {
            if (serializeTexture) {
                serializationObject.texture = this.texture.serialize();
            } else {
                serializationObject.textureUrl = this.texture.name;
                serializationObject.invertY = this.texture._invertY;
            }
        }

        serializationObject.sprites = [];

        for (var sprite of this.sprites) {
            serializationObject.sprites.push(sprite.serialize());
        }

        return serializationObject;
    }

    /**
     * Parses a JSON object to create a new sprite manager.
     * @param parsedManager The JSON object to parse
     * @param scene The scene to create the sprite managerin
     * @param rootUrl The root url to use to load external dependencies like texture
     * @returns the new sprite manager
     */
    public static Parse(parsedManager: any, scene: Scene, rootUrl: string): SpriteManager {
        var manager = new SpriteManager(parsedManager.name, "", parsedManager.capacity, {
            width: parsedManager.cellWidth,
            height: parsedManager.cellHeight,
        }, scene);

        if (parsedManager.texture) {
            manager.texture = Texture.Parse(parsedManager.texture, scene, rootUrl) as Texture;
        } else if (parsedManager.textureName) {
            manager.texture = new Texture(rootUrl + parsedManager.textureUrl, scene, false, parsedManager.invertY !== undefined ? parsedManager.invertY : true);
        }

        for (var parsedSprite of parsedManager.sprites) {
            Sprite.Parse(parsedSprite, manager);
        }

        return manager;
    }

    /**
     * Creates a sprite manager from a snippet saved by the sprite editor
     * @param snippetId defines the snippet to load
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a promise that will resolve to the new sprite manager
     */
    public static CreateFromSnippetAsync(snippetId: string, scene: Scene, rootUrl: string = ""): Promise<SpriteManager> {
        return new Promise((resolve, reject) => {
            var request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        var snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        let serializationObject = JSON.parse(snippet.spriteManager);
                        let output = SpriteManager.Parse(serializationObject, scene || Engine.LastCreatedScene, rootUrl);

                        output.snippetId = snippetId;

                        resolve(output);
                    } else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }
}