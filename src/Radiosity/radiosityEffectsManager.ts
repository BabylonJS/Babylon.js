import { Effect } from "../Materials/effect";
import { VertexBuffer } from "../Meshes/buffer";
import { DataBuffer } from "../Meshes/databuffer";
import { Scene } from "../scene";

import "../Shaders/nextShooter.fragment";
import "../Shaders/nextShooter.vertex";
import "../Shaders/buildRadiosity.fragment";
import "../Shaders/buildRadiosity.vertex";
import "../Shaders/radiosity.fragment";
import "../Shaders/radiosity.vertex";
import "../Shaders/visibility.fragment";
import "../Shaders/visibility.vertex";
import "../Shaders/dilate.fragment";
import "../Shaders/dilate.vertex";
import "../Shaders/radiosityPostProcess.fragment";
import "../Shaders/radiosityPostProcess.vertex";

/**
  * Creates various effects to solve radiosity.
  */
export class RadiosityEffectsManager {
    /**
      * Effect for visibility
      */
    public visibilityEffect: Effect;
    /**
      * Effect for building radiosity info for surfaces
      */
    public radiosityEffect: Effect;
    /**
      * Effect to shoot radiosity on surface from a patch
      */
    public shootEffect: Effect;
    /**
      * Effect to determinate the next shooter (the one that currently retains the most radiance)
      */
    public nextShooterEffect: Effect;
    /**
      * Effect to dilate the lightmap. Useful to avoid seams.
      */
    public dilateEffect: Effect;
    /**
      * Effect to tonemap the lightmap. Necessary to map the dynamic range into 0;1.
      */
    public radiosityPostProcessEffect: Effect;

    private _vertexBuffer: VertexBuffer;
    private _indexBuffer: DataBuffer;

    private _scene: Scene;

    /**
      * Creates the manager
      * @param scene The current scene
      * @param useHemicube If true, uses hemicube instead of hemispherical projection
      * @param useDepthCompare If true, uses depth instead of surface id for visibility
      */
    constructor(scene: Scene) {
        this._scene = scene;

        this.prepareBuffers();
        this.createEffects();
    }

    /**
      * Gets a screen quad vertex buffer
      */
    public get screenQuadVB(): VertexBuffer {
        return this._vertexBuffer;
    }

    /**
      * Gets a screen quad index buffer
      */
    public get screenQuadIB(): DataBuffer {
        return this._indexBuffer;
    }

    private createEffects(): Promise<void> {

        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                let readyStates = [
                    this.isNextShooterEffectReady(),
                    this.isRadiosityDataEffectReady(),
                    this.isShootEffectReady(),
                    this.isVisiblityEffectReady(),
                    this.isRadiosityPostProcessReady(),
                    this.isDilateEffectReady()
                ];

                for (let i = 0; i < readyStates.length; i++) {
                    if (!readyStates[i]) {
                        return;
                    }
                }

                clearInterval(interval);
                resolve();
            }, 200);
        });
    }

    /**
      * Checks the ready state of all the effets
      * @returns true if all the effects are ready
      */
    public isReady(): boolean {
        return 	this.isNextShooterEffectReady() &&
                this.isRadiosityDataEffectReady() &&
                this.isShootEffectReady() &&
                this.isVisiblityEffectReady() &&
                this.isRadiosityPostProcessReady() &&
                this.isDilateEffectReady();
    }

    private prepareBuffers(): void {
        if (this._vertexBuffer) {
            return;
        }

        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffer = new VertexBuffer(this._scene.getEngine(), vertices, VertexBuffer.PositionKind, false, false, 2);

        this._buildIndexBuffer();
    }

    private _buildIndexBuffer(): void {
        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
    }

    /**
	 * Checks the ready state of the visibility effect
	 * @returns true if the visibility effect is ready
	 */
    public isVisiblityEffectReady(): boolean {
        let attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];
        let uniforms = ["world", "view", "projection", "nearFar", "bias"];

        this.visibilityEffect = this._scene.getEngine().createEffect("visibility",
            attribs,
            uniforms,
            [], "");

        return this.visibilityEffect.isReady();
    }

    /**
     * Checks the ready state of the shoot effect
     * @returns true if the shoot effect is ready
     */
    public isShootEffectReady(): boolean {
        var attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];
        var uniforms = ["view", "shootPos", "shootNormal", "shootEnergy", "shootDArea", "nearFar", "gatheringScale", "residualScale", "normalBias"];
        var samplers = ["itemBuffer", "worldPosBuffer", "worldNormalBuffer", "idBuffer", "residualBuffer", "gatheringBuffer"];

        this.shootEffect = this._scene.getEngine().createEffect("radiosity",
            attribs,
            uniforms,
            samplers,
            "");

        return this.shootEffect.isReady();
    }

    /**
     * Checks the ready state of the radiosity data effect
     * @returns true if the radiosity data effect is ready
     */
    public isRadiosityDataEffectReady(): boolean {
        var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind, VertexBuffer.UV2Kind];

        this.radiosityEffect = this._scene.getEngine().createEffect("buildRadiosity",
            attribs,
            ["world", "texSize", "worldTexelRatio", "patchOffset", "color", "lightStrength"],
            []);

        return this.radiosityEffect.isReady();
    }

    /**
     * Checks the ready state of the next shooter effect
     * @returns true if the next shooter effect is ready
     */
    public isNextShooterEffectReady(): boolean {
        this.nextShooterEffect = this._scene.getEngine().createEffect("nextShooter",
            [VertexBuffer.PositionKind],
            ["lod", "area", "polygonId"],
            ["unshotRadiositySampler"], "");

        return this.nextShooterEffect.isReady();
    }

    /**
     * Checks the ready state of the dilate effect
     * @returns true if the dilate effect is ready
     */
    public isDilateEffectReady(): boolean {
        this.dilateEffect = this._scene.getEngine().createEffect("dilate",
            [VertexBuffer.PositionKind],
            ["offset", "texelSize"],
            ["inputTexture"], "");

        return this.dilateEffect.isReady();
    }

    /**
     * Checks the ready state of the tonemap effect
     * @returns true if the tonemap effect is ready
     */
    public isRadiosityPostProcessReady(): boolean {
        this.radiosityPostProcessEffect = this._scene.getEngine().createEffect("radiosityPostProcess",
            [VertexBuffer.PositionKind],
            ["_ExposureAdjustment", "ambientColor"],
            ["inputTexture"], "");

        return this.radiosityPostProcessEffect.isReady();
    }
}
