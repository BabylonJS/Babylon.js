import { IDisposable, Scene } from "../scene";
import { Nullable } from "../types";
import { Observable, Observer } from "../Misc/observable";
import { Buffer } from "../Meshes/buffer";
import { VertexBuffer } from "../Meshes/buffer";
import { Vector3, Tmp } from "../Maths/math";
import { Sprite } from "./sprite";
import { SpriteSceneComponent } from "./spriteSceneComponent";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { SceneComponentConstants } from "../sceneComponent";
import { Constants } from "../Engines/constants";

import "../Shaders/sprites.fragment";
import "../Shaders/sprites.vertex";
import { DataBuffer } from '../Meshes/dataBuffer';
declare type Ray = import("../Culling/ray").Ray;

/**
 * Defines the minimum interface to fullfil in order to be a sprite manager.
 */
export interface ISpriteManager extends IDisposable {
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
     * Specifies the rendering group id for this mesh (0 by default)
     * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered#rendering-groups
     */
    renderingGroupId: number;

    /**
     * Defines the list of sprites managed by the manager.
     */
    sprites: Array<Sprite>;

    /**
     * Tests the intersection of a sprite with a specific ray.
     * @param ray The ray we are sending to test the collision
     * @param camera The camera space we are sending rays in
     * @param predicate A predicate allowing excluding sprites from the list of object to test
     * @param fastCheck Is the hit test done in a OOBB or AOBB fashion the faster, the less precise
     * @returns picking info or null.
     */
    intersects(ray: Ray, camera: Camera, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean): Nullable<PickingInfo>;

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
     * Gets or sets the spritesheet texture
     */
    public get texture(): Texture {
        return this._spriteTexture;
    }

    public set texture(value: Texture) {
        this._spriteTexture = value;
    }

    /**
     * Creates a new sprite manager
     * @param name defines the manager's name
     * @param imgUrl defines the sprite sheet url
     * @param capacity defines the maximum allowed number of sprites
     * @param cellSize defines the size of a sprite cell
     * @param scene defines the hosting scene
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param samplingMode defines the smapling mode to use with spritesheet
     */
    constructor(
        /** defines the manager's name */
        public name: string,
        imgUrl: string, capacity: number, cellSize: any, scene: Scene, epsilon: number = 0.01, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
        if (!scene._getComponent(SceneComponentConstants.NAME_SPRITE)) {
            scene._addComponent(new SpriteSceneComponent(scene));
        }
        this._capacity = capacity;
        this._spriteTexture = new Texture(imgUrl, scene, true, false, samplingMode);
        this._spriteTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._spriteTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

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
        this._scene = scene;
        this._scene.spriteManagers.push(this);

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
        // 16 floats per sprite (x, y, z, angle, sizeX, sizeY, offsetX, offsetY, invertU, invertV, cellIndexX, cellIndexY, color r, color g, color b, color a)
        this._vertexData = new Float32Array(capacity * 16 * 4);
        this._buffer = new Buffer(scene.getEngine(), this._vertexData, true, 16);

        var positions = this._buffer.createVertexBuffer(VertexBuffer.PositionKind, 0, 4);
        var options = this._buffer.createVertexBuffer("options", 4, 4);
        var cellInfo = this._buffer.createVertexBuffer("cellInfo", 8, 4);
        var colors = this._buffer.createVertexBuffer(VertexBuffer.ColorKind, 12, 4);

        this._vertexBuffers[VertexBuffer.PositionKind] = positions;
        this._vertexBuffers["options"] = options;
        this._vertexBuffers["cellInfo"] = cellInfo;
        this._vertexBuffers[VertexBuffer.ColorKind] = colors;

        // Effects
        this._effectBase = this._scene.getEngine().createEffect("sprites",
            [VertexBuffer.PositionKind, "options", "cellInfo", VertexBuffer.ColorKind],
            ["view", "projection", "textureInfos", "alphaTest"],
            ["diffuseSampler"], "");

        this._effectFog = this._scene.getEngine().createEffect("sprites",
            [VertexBuffer.PositionKind, "options", "cellInfo", VertexBuffer.ColorKind],
            ["view", "projection", "textureInfos", "alphaTest", "vFogInfos", "vFogColor"],
            ["diffuseSampler"], "#define FOG");
    }

    private _appendSpriteVertex(index: number, sprite: Sprite, offsetX: number, offsetY: number, rowSize: number): void {
        var arrayOffset = index * 16;

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

        this._vertexData[arrayOffset] = sprite.position.x;
        this._vertexData[arrayOffset + 1] = sprite.position.y;
        this._vertexData[arrayOffset + 2] = sprite.position.z;
        this._vertexData[arrayOffset + 3] = sprite.angle;
        this._vertexData[arrayOffset + 4] = sprite.width;
        this._vertexData[arrayOffset + 5] = sprite.height;
        this._vertexData[arrayOffset + 6] = offsetX;
        this._vertexData[arrayOffset + 7] = offsetY;
        this._vertexData[arrayOffset + 8] = sprite.invertU ? 1 : 0;
        this._vertexData[arrayOffset + 9] = sprite.invertV ? 1 : 0;
        var offset = (sprite.cellIndex / rowSize) >> 0;
        this._vertexData[arrayOffset + 10] = sprite.cellIndex - offset * rowSize;
        this._vertexData[arrayOffset + 11] = offset;
        // Color
        this._vertexData[arrayOffset + 12] = sprite.color.r;
        this._vertexData[arrayOffset + 13] = sprite.color.g;
        this._vertexData[arrayOffset + 14] = sprite.color.b;
        this._vertexData[arrayOffset + 15] = sprite.color.a;
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
        var pickedPoint = Vector3.Zero();
        var cameraSpacePosition = Vector3.Zero();
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

            cameraView.invertToRef(Tmp.Matrix[0]);
            result.hit = true;
            result.pickedSprite = currentSprite;
            result.distance = distance;

            // Get picked point
            let direction = Tmp.Vector3[0];
            direction.copyFrom(ray.direction);
            direction.normalize();
            direction.scaleInPlace(distance);

            ray.origin.addToRef(direction, pickedPoint);
            result.pickedPoint = Vector3.TransformCoordinates(pickedPoint, Tmp.Matrix[0]);

            return result;
        }

        return null;
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

        var engine = this._scene.getEngine();
        var baseSize = this._spriteTexture.getBaseSize();

        // Sprites
        var deltaTime = engine.getDeltaTime();
        var max = Math.min(this._capacity, this.sprites.length);
        var rowSize = baseSize.width / this.cellWidth;

        var offset = 0;
        let noSprite = true;
        for (var index = 0; index < max; index++) {
            var sprite = this.sprites[index];
            if (!sprite || !sprite.isVisible) {
                continue;
            }

            noSprite = false;
            sprite._animate(deltaTime);

            this._appendSpriteVertex(offset++, sprite, 0, 0, rowSize);
            this._appendSpriteVertex(offset++, sprite, 1, 0, rowSize);
            this._appendSpriteVertex(offset++, sprite, 1, 1, rowSize);
            this._appendSpriteVertex(offset++, sprite, 0, 1, rowSize);
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

        effect.setFloat2("textureInfos", this.cellWidth / baseSize.width, this.cellHeight / baseSize.height);

        // Fog
        if (this._scene.fogEnabled && this._scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
            effect.setFloat4("vFogInfos", this._scene.fogMode, this._scene.fogStart, this._scene.fogEnd, this._scene.fogDensity);
            effect.setColor3("vFogColor", this._scene.fogColor);
        }

        // VBOs
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

        // Draw order
        engine.setDepthFunctionToLessOrEqual();
        effect.setBool("alphaTest", true);
        engine.setColorWrite(false);
        engine.drawElementsType(Material.TriangleFillMode, 0, (offset / 4) * 6);
        engine.setColorWrite(true);
        effect.setBool("alphaTest", false);

        engine.setAlphaMode(Constants.ALPHA_COMBINE);
        engine.drawElementsType(Material.TriangleFillMode, 0, (offset / 4) * 6);
        engine.setAlphaMode(Constants.ALPHA_DISABLE);
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

        // Remove from scene
        var index = this._scene.spriteManagers.indexOf(this);
        this._scene.spriteManagers.splice(index, 1);

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }
}
