import { IDisposable, Scene } from "../scene";
import { Nullable } from "../types";
import { Observable, Observer } from "../Misc/observable";
import { Vector3, TmpVectors } from "../Maths/math.vector";
import { Sprite } from "./sprite";
import { SpriteSceneComponent } from "./spriteSceneComponent";
import { PickingInfo } from "../Collisions/pickingInfo";
import { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import { SceneComponentConstants } from "../sceneComponent";
import { Logger } from "../Misc/logger";
import { Engine } from '../Engines/engine';
import { WebRequest } from '../Misc/webRequest';
import { SpriteRenderer } from './spriteRenderer';
import { ThinSprite } from './thinSprite';
import { ISize } from '../Maths/math.size';

declare type Ray = import("../Culling/ray").Ray;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
declare const Reflect: any;

/**
 * Defines the minimum interface to fulfill in order to be a sprite manager.
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
     * @see https://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered#rendering-groups
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

    /**
     * Rebuilds the manager (after a context lost, for eg)
     */
     rebuild(): void;
}

/**
 * Class used to manage multiple sprites on the same spritesheet
 * @see https://doc.babylonjs.com/babylon101/sprites
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
    /** Gets or sets a boolean indicating if the sprites are pickable */
    public isPickable = false;

    /**
    * An event triggered when the manager is disposed.
    */
    public onDisposeObservable = new Observable<SpriteManager>();

    /**
     * Callback called when the manager is disposed
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

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
        return this._spriteRenderer.capacity;
    }

    /**
     * Gets or sets the spritesheet texture
     */
    public get texture(): Texture {
        return this._spriteRenderer.texture as Texture;
    }
    public set texture(value: Texture) {
        value.wrapU = Texture.CLAMP_ADDRESSMODE;
        value.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._spriteRenderer.texture = value;
        this._textureContent = null;
    }

    /** Defines the default width of a cell in the spritesheet */
    public get cellWidth(): number {
        return this._spriteRenderer.cellWidth;
    }
    public set cellWidth(value: number) {
        this._spriteRenderer.cellWidth = value;
    }

    /** Defines the default height of a cell in the spritesheet */
    public get cellHeight(): number {
        return this._spriteRenderer.cellHeight;
    }
    public set cellHeight(value: number) {
        this._spriteRenderer.cellHeight = value;
    }

    /** Gets or sets a boolean indicating if the manager must consider scene fog when rendering */
    public get fogEnabled(): boolean {
        return this._spriteRenderer.fogEnabled;
    }
    public set fogEnabled(value: boolean) {
        this._spriteRenderer.fogEnabled = value;
    }

    /**
     * Blend mode use to render the particle, it can be any of
     * the static Constants.ALPHA_x properties provided in this class.
     * Default value is Constants.ALPHA_COMBINE
     */
    public get blendMode() {
        return this._spriteRenderer.blendMode;
    }
    public set blendMode(blendMode: number) {
        this._spriteRenderer.blendMode = blendMode;
    }

    /** Disables writing to the depth buffer when rendering the sprites.
     *  It can be handy to disable depth writing when using textures without alpha channel
     *  and setting some specific blend modes.
    */
    public disableDepthWrite: boolean = false;

    private _spriteRenderer: SpriteRenderer;
    /** Associative array from JSON sprite data file */
    private _cellData: any;
    /** Array of sprite names from JSON sprite data file */
    private _spriteMap: Array<string>;
    /** True when packed cell data from JSON file is ready*/
    private _packedAndReady: boolean = false;
    private _textureContent: Nullable<Uint8Array>;
    private _onDisposeObserver: Nullable<Observer<SpriteManager>>;
    private _fromPacked: boolean;
    private _scene: Scene;

    /**
     * Creates a new sprite manager
     * @param name defines the manager's name
     * @param imgUrl defines the sprite sheet url
     * @param capacity defines the maximum allowed number of sprites
     * @param cellSize defines the size of a sprite cell
     * @param scene defines the hosting scene
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param samplingMode defines the sampling mode to use with spritesheet
     * @param fromPacked set to false; do not alter
     * @param spriteJSON null otherwise a JSON object defining sprite sheet data; do not alter
     */
    constructor(
        /** defines the manager's name */
        public name: string,
        imgUrl: string, capacity: number, cellSize: any, scene: Scene, epsilon: number = 0.01, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, fromPacked: boolean = false, spriteJSON: any | null = null) {

        if (!scene) {
            scene = Engine.LastCreatedScene!;
        }

        if (!scene._getComponent(SceneComponentConstants.NAME_SPRITE)) {
            scene._addComponent(new SpriteSceneComponent(scene));
        }
        this._fromPacked = fromPacked;

        this._scene = scene;
        const engine = this._scene.getEngine();
        this._spriteRenderer = new SpriteRenderer(engine, capacity, epsilon, scene);

        if (cellSize.width && cellSize.height) {
            this.cellWidth = cellSize.width;
            this.cellHeight = cellSize.height;
        } else if (cellSize !== undefined) {
            this.cellWidth = cellSize;
            this.cellHeight = cellSize;
        } else {
            this._spriteRenderer = <any>null;
            return;
        }

        this._scene.spriteManagers.push(this);
        this.uniqueId = this.scene.getUniqueId();

        if (imgUrl) {
            this.texture = new Texture(imgUrl, scene, true, false, samplingMode);
        }

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

                let spritemap = (<string[]>(Reflect).ownKeys(celldata.frames));

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
                    let spritemap = (<string[]>(Reflect).ownKeys(celldata.frames));
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

    private _checkTextureAlpha(sprite: Sprite, ray: Ray, distance: number, min: Vector3, max: Vector3) {
        if (!sprite.useAlphaForPicking || !this.texture) {
            return true;
        }

        let textureSize = this.texture.getSize();
        if (!this._textureContent) {
            this._textureContent = new Uint8Array(textureSize.width * textureSize.height * 4);
            this.texture.readPixels(0, 0, this._textureContent);
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
        var count = Math.min(this.capacity, this.sprites.length);
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
        var count = Math.min(this.capacity, this.sprites.length);
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
        if (this._fromPacked  && (!this._packedAndReady || !this._spriteMap || !this._cellData)) {
            return;
        }

        var engine = this._scene.getEngine();
        var deltaTime = engine.getDeltaTime();
        if (this._packedAndReady) {
            this._spriteRenderer.render(this.sprites, deltaTime, this._scene.getViewMatrix(), this._scene.getProjectionMatrix(), this._customUpdate);
        }
        else {
            this._spriteRenderer.render(this.sprites, deltaTime, this._scene.getViewMatrix(), this._scene.getProjectionMatrix());
        }
    }

    private _customUpdate = (sprite: ThinSprite, baseSize: ISize): void => {
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
    };

    /**
     * Rebuilds the manager (after a context lost, for eg)
     */
    public rebuild(): void {
        this._spriteRenderer?.rebuild();
    }

    /**
     * Release associated resources
     */
    public dispose(): void {
        if (this._spriteRenderer) {
            this._spriteRenderer.dispose();
            (<any>this._spriteRenderer) = null;
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
     * @param scene The scene to create the sprite manager
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
     * Creates a sprite manager from a snippet saved in a remote file
     * @param name defines the name of the sprite manager to create (can be null or empty to use the one from the json data)
     * @param url defines the url to load from
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a promise that will resolve to the new sprite manager
     */
    public static ParseFromFileAsync(name: Nullable<string>, url: string, scene: Scene, rootUrl: string = ""): Promise<SpriteManager> {

        return new Promise((resolve, reject) => {
            var request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        let serializationObject = JSON.parse(request.responseText);
                        let output = SpriteManager.Parse(serializationObject, scene || Engine.LastCreatedScene, rootUrl);

                        if (name) {
                            output.name = name;
                        }

                        resolve(output);
                    } else {
                        reject("Unable to load the sprite manager");
                    }
                }
            });

            request.open("GET", url);
            request.send();
        });
    }

    /**
     * Creates a sprite manager from a snippet saved by the sprite editor
     * @param snippetId defines the snippet to load (can be set to _BLANK to create a default one)
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a promise that will resolve to the new sprite manager
     */
    public static CreateFromSnippetAsync(snippetId: string, scene: Scene, rootUrl: string = ""): Promise<SpriteManager> {
        if (snippetId === "_BLANK") {
            return Promise.resolve(new SpriteManager("Default sprite manager", "//playground.babylonjs.com/textures/player.png", 500, 64, scene));
        }

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