import { Tools } from "../Misc/tools";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { Matrix, Vector3 } from "../Maths/math.vector";
import { Scalar } from "../Maths/math.scalar";
import { EngineStore } from "../Engines/engineStore";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { VertexBuffer } from "../Meshes/buffer";
import { Ray } from "../Culling/ray";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { LensFlare } from "./lensFlare";
import { Constants } from "../Engines/constants";

import "../Shaders/lensFlare.fragment";
import "../Shaders/lensFlare.vertex";
import { _DevTools } from '../Misc/devTools';
import { DataBuffer } from '../Meshes/dataBuffer';
import { Color3 } from '../Maths/math.color';
import { Viewport } from '../Maths/math.viewport';

/**
 * This represents a Lens Flare System or the shiny effect created by the light reflection on the  camera lenses.
 * It is usually composed of several `lensFlare`.
 * @see http://doc.babylonjs.com/how_to/how_to_use_lens_flares
 */
export class LensFlareSystem {
    /**
     * List of lens flares used in this system.
     */
    public lensFlares = new Array<LensFlare>();

    /**
     * Define a limit from the border the lens flare can be visible.
     */
    public borderLimit = 300;

    /**
     * Define a viewport border we do not want to see the lens flare in.
     */
    public viewportBorder = 0;

    /**
     * Define a predicate which could limit the list of meshes able to occlude the effect.
     */
    public meshesSelectionPredicate: (mesh: AbstractMesh) => boolean;

    /**
     * Restricts the rendering of the effect to only the camera rendering this layer mask.
     */
    public layerMask: number = 0x0FFFFFFF;

    /**
     * Define the id of the lens flare system in the scene.
     * (equal to name by default)
     */
    public id: string;

    private _scene: Scene;
    private _emitter: any;
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: Nullable<DataBuffer>;
    private _effect: Effect;
    private _positionX: number;
    private _positionY: number;
    private _isEnabled = true;

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("LensFlareSystemSceneComponent");
    }

    /**
     * Instantiates a lens flare system.
     * This represents a Lens Flare System or the shiny effect created by the light reflection on the  camera lenses.
     * It is usually composed of several `lensFlare`.
     * @see http://doc.babylonjs.com/how_to/how_to_use_lens_flares
     * @param name Define the name of the lens flare system in the scene
     * @param emitter Define the source (the emitter) of the lens flares (it can be a camera, a light or a mesh).
     * @param scene Define the scene the lens flare system belongs to
     */
    constructor(
        /**
         * Define the name of the lens flare system
         */
        public name: string,
        emitter: any,
        scene: Scene) {

        this._scene = scene || EngineStore.LastCreatedScene;
        LensFlareSystem._SceneComponentInitialization(this._scene);

        this._emitter = emitter;
        this.id = name;
        scene.lensFlareSystems.push(this);

        this.meshesSelectionPredicate = (m) => <boolean>(scene.activeCamera && m.material && m.isVisible && m.isEnabled() && m.isBlocker && ((m.layerMask & scene.activeCamera.layerMask) != 0));

        var engine = scene.getEngine();

        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);

        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = engine.createIndexBuffer(indices);

        // Effects
        this._effect = engine.createEffect("lensFlare",
            [VertexBuffer.PositionKind],
            ["color", "viewportMatrix"],
            ["textureSampler"], "");
    }

    /**
     * Define if the lens flare system is enabled.
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(value: boolean) {
        this._isEnabled = value;
    }

    /**
     * Get the scene the effects belongs to.
     * @returns the scene holding the lens flare system
     */
    public getScene(): Scene {
        return this._scene;
    }

    /**
     * Get the emitter of the lens flare system.
     * It defines the source of the lens flares (it can be a camera, a light or a mesh).
     * @returns the emitter of the lens flare system
     */
    public getEmitter(): any {
        return this._emitter;
    }

    /**
     * Set the emitter of the lens flare system.
     * It defines the source of the lens flares (it can be a camera, a light or a mesh).
     * @param newEmitter Define the new emitter of the system
     */
    public setEmitter(newEmitter: any): void {
        this._emitter = newEmitter;
    }

    /**
     * Get the lens flare system emitter position.
     * The emitter defines the source of the lens flares (it can be a camera, a light or a mesh).
     * @returns the position
     */
    public getEmitterPosition(): Vector3 {
        return this._emitter.getAbsolutePosition ? this._emitter.getAbsolutePosition() : this._emitter.position;
    }

    /**
     * @hidden
     */
    public computeEffectivePosition(globalViewport: Viewport): boolean {
        var position = this.getEmitterPosition();

        position = Vector3.Project(position, Matrix.Identity(), this._scene.getTransformMatrix(), globalViewport);

        this._positionX = position.x;
        this._positionY = position.y;

        position = Vector3.TransformCoordinates(this.getEmitterPosition(), this._scene.getViewMatrix());

        if (this.viewportBorder > 0) {
            globalViewport.x -= this.viewportBorder;
            globalViewport.y -= this.viewportBorder;
            globalViewport.width += this.viewportBorder * 2;
            globalViewport.height += this.viewportBorder * 2;
            position.x += this.viewportBorder;
            position.y += this.viewportBorder;
            this._positionX += this.viewportBorder;
            this._positionY += this.viewportBorder;
        }

        if (position.z > 0) {
            if ((this._positionX > globalViewport.x) && (this._positionX < globalViewport.x + globalViewport.width)) {
                if ((this._positionY > globalViewport.y) && (this._positionY < globalViewport.y + globalViewport.height)) {
                    return true;
                }
            }
            return true;
        }

        return false;
    }

    /** @hidden */
    public _isVisible(): boolean {
        if (!this._isEnabled || !this._scene.activeCamera) {
            return false;
        }

        var emitterPosition = this.getEmitterPosition();
        var direction = emitterPosition.subtract(this._scene.activeCamera.globalPosition);
        var distance = direction.length();
        direction.normalize();

        var ray = new Ray(this._scene.activeCamera.globalPosition, direction);
        var pickInfo = this._scene.pickWithRay(ray, this.meshesSelectionPredicate, true);

        return !pickInfo || !pickInfo.hit || pickInfo.distance > distance;
    }

    /**
     * @hidden
     */
    public render(): boolean {
        if (!this._effect.isReady() || !this._scene.activeCamera) {
            return false;
        }

        var engine = this._scene.getEngine();
        var viewport = this._scene.activeCamera.viewport;
        var globalViewport = viewport.toGlobal(engine.getRenderWidth(true), engine.getRenderHeight(true));

        // Position
        if (!this.computeEffectivePosition(globalViewport)) {
            return false;
        }

        // Visibility
        if (!this._isVisible()) {
            return false;
        }

        // Intensity
        var awayX;
        var awayY;

        if (this._positionX < this.borderLimit + globalViewport.x) {
            awayX = this.borderLimit + globalViewport.x - this._positionX;
        } else if (this._positionX > globalViewport.x + globalViewport.width - this.borderLimit) {
            awayX = this._positionX - globalViewport.x - globalViewport.width + this.borderLimit;
        } else {
            awayX = 0;
        }

        if (this._positionY < this.borderLimit + globalViewport.y) {
            awayY = this.borderLimit + globalViewport.y - this._positionY;
        } else if (this._positionY > globalViewport.y + globalViewport.height - this.borderLimit) {
            awayY = this._positionY - globalViewport.y - globalViewport.height + this.borderLimit;
        } else {
            awayY = 0;
        }

        var away = (awayX > awayY) ? awayX : awayY;

        away -= this.viewportBorder;

        if (away > this.borderLimit) {
            away = this.borderLimit;
        }

        var intensity = 1.0 - Scalar.Clamp(away / this.borderLimit, 0, 1);
        if (intensity < 0) {
            return false;
        }

        if (intensity > 1.0) {
            intensity = 1.0;
        }

        if (this.viewportBorder > 0) {
            globalViewport.x += this.viewportBorder;
            globalViewport.y += this.viewportBorder;
            globalViewport.width -= this.viewportBorder * 2;
            globalViewport.height -= this.viewportBorder * 2;
            this._positionX -= this.viewportBorder;
            this._positionY -= this.viewportBorder;
        }

        // Position
        var centerX = globalViewport.x + globalViewport.width / 2;
        var centerY = globalViewport.y + globalViewport.height / 2;
        var distX = centerX - this._positionX;
        var distY = centerY - this._positionY;

        // Effects
        engine.enableEffect(this._effect);
        engine.setState(false);
        engine.setDepthBuffer(false);

        // VBOs
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._effect);

        // Flares
        for (var index = 0; index < this.lensFlares.length; index++) {
            var flare = this.lensFlares[index];

            if (flare.texture && !flare.texture.isReady()) {
                continue;
            }

            engine.setAlphaMode(flare.alphaMode);

            var x = centerX - (distX * flare.position);
            var y = centerY - (distY * flare.position);

            var cw = flare.size;
            var ch = flare.size * engine.getAspectRatio(this._scene.activeCamera, true);
            var cx = 2 * (x / (globalViewport.width + globalViewport.x * 2)) - 1.0;
            var cy = 1.0 - 2 * (y / (globalViewport.height + globalViewport.y * 2));

            var viewportMatrix = Matrix.FromValues(
                cw / 2, 0, 0, 0,
                0, ch / 2, 0, 0,
                0, 0, 1, 0,
                cx, cy, 0, 1);

            this._effect.setMatrix("viewportMatrix", viewportMatrix);

            // Texture
            this._effect.setTexture("textureSampler", flare.texture);

            // Color
            this._effect.setFloat4("color", flare.color.r * intensity, flare.color.g * intensity, flare.color.b * intensity, 1.0);

            // Draw order
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }

        engine.setDepthBuffer(true);
        engine.setAlphaMode(Constants.ALPHA_DISABLE);
        return true;
    }

    /**
     * Dispose and release the lens flare with its associated resources.
     */
    public dispose(): void {
        var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        while (this.lensFlares.length) {
            this.lensFlares[0].dispose();
        }

        // Remove from scene
        var index = this._scene.lensFlareSystems.indexOf(this);
        this._scene.lensFlareSystems.splice(index, 1);
    }

    /**
     * Parse a lens flare system from a JSON repressentation
     * @param parsedLensFlareSystem Define the JSON to parse
     * @param scene Define the scene the parsed system should be instantiated in
     * @param rootUrl Define the rootUrl of the load sequence to easily find a load relative dependencies such as textures
     * @returns the parsed system
     */
    public static Parse(parsedLensFlareSystem: any, scene: Scene, rootUrl: string): LensFlareSystem {
        var emitter = scene.getLastEntryByID(parsedLensFlareSystem.emitterId);

        var name = parsedLensFlareSystem.name || "lensFlareSystem#" + parsedLensFlareSystem.emitterId;

        var lensFlareSystem = new LensFlareSystem(name, emitter, scene);

        lensFlareSystem.id = parsedLensFlareSystem.id || name;
        lensFlareSystem.borderLimit = parsedLensFlareSystem.borderLimit;

        for (var index = 0; index < parsedLensFlareSystem.flares.length; index++) {
            var parsedFlare = parsedLensFlareSystem.flares[index];
            LensFlare.AddFlare(parsedFlare.size, parsedFlare.position, Color3.FromArray(parsedFlare.color), parsedFlare.textureName ? rootUrl + parsedFlare.textureName : "", lensFlareSystem);
        }

        return lensFlareSystem;
    }

    /**
     * Serialize the current Lens Flare System into a JSON representation.
     * @returns the serialized JSON
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.id = this.id;
        serializationObject.name = this.name;

        serializationObject.emitterId = this.getEmitter().id;
        serializationObject.borderLimit = this.borderLimit;

        serializationObject.flares = [];
        for (var index = 0; index < this.lensFlares.length; index++) {
            var flare = this.lensFlares[index];

            serializationObject.flares.push({
                size: flare.size,
                position: flare.position,
                color: flare.color.asArray(),
                textureName: Tools.GetFilename(flare.texture ? flare.texture.name : "")
            });
        }

        return serializationObject;
    }
}
