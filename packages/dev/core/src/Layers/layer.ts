import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { Vector2 } from "../Maths/math.vector";
import { Color4 } from "../Maths/math.color";
import { EngineStore } from "../Engines/engineStore";
import { VertexBuffer } from "../Buffers/buffer";
import { Material } from "../Materials/material";
import { Texture } from "../Materials/Textures/texture";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { SceneComponentConstants } from "../sceneComponent";
import { LayerSceneComponent } from "./layerSceneComponent";
import { Constants } from "../Engines/constants";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { DrawWrapper } from "../Materials/drawWrapper";

import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * This represents a full screen 2d layer.
 * This can be useful to display a picture in the  background of your scene for instance.
 * @see https://www.babylonjs-playground.com/#08A2BS#1
 */
export class Layer {
    /**
     * Force all the layers to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;
    /**
     * Define the texture the layer should display.
     */
    public texture: Nullable<BaseTexture>;

    /**
     * Is the layer in background or foreground.
     */
    public isBackground: boolean;

    private _applyPostProcess: boolean = true;
    /**
     * Determines if the layer is drawn before (true) or after (false) post-processing.
     * If the layer is background, it is always before.
     */
    public set applyPostProcess(value: boolean) {
        this._applyPostProcess = value;
    }
    public get applyPostProcess(): boolean {
        return this.isBackground || this._applyPostProcess;
    }

    /**
     * Define the color of the layer (instead of texture).
     */
    public color: Color4;

    /**
     * Define the scale of the layer in order to zoom in out of the texture.
     */
    public scale = new Vector2(1, 1);

    /**
     * Define an offset for the layer in order to shift the texture.
     */
    public offset = new Vector2(0, 0);

    /**
     * Define the alpha blending mode used in the layer in case the texture or color has an alpha.
     */
    public alphaBlendingMode = Constants.ALPHA_COMBINE;

    /**
     * Define if the layer should alpha test or alpha blend with the rest of the scene.
     * Alpha test will not mix with the background color in case of transparency.
     * It will either use the texture color or the background depending on the alpha value of the current pixel.
     */
    public alphaTest: boolean;

    /**
     * Define a mask to restrict the layer to only some of the scene cameras.
     */
    public layerMask: number = 0x0fffffff;

    /**
     * Define the list of render target the layer is visible into.
     */
    public renderTargetTextures: RenderTargetTexture[] = [];

    /**
     * Define if the layer is only used in renderTarget or if it also
     * renders in the main frame buffer of the canvas.
     */
    public renderOnlyInRenderTargetTextures = false;

    /**
     * Define if the layer is enabled (ie. should be displayed). Default: true
     */
    public isEnabled = true;

    private _scene: Scene;
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: Nullable<DataBuffer>;
    private _drawWrapper: DrawWrapper;
    private _previousDefines: string;

    /**
     * An event triggered when the layer is disposed.
     */
    public onDisposeObservable = new Observable<Layer>();

    private _onDisposeObserver: Nullable<Observer<Layer>>;
    /**
     * Back compatibility with callback before the onDisposeObservable existed.
     * The set callback will be triggered when the layer has been disposed.
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    /**
     * An event triggered before rendering the scene
     */
    public onBeforeRenderObservable = new Observable<Layer>();

    private _onBeforeRenderObserver: Nullable<Observer<Layer>>;
    /**
     * Back compatibility with callback before the onBeforeRenderObservable existed.
     * The set callback will be triggered just before rendering the layer.
     */
    public set onBeforeRender(callback: () => void) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
    }

    /**
     * An event triggered after rendering the scene
     */
    public onAfterRenderObservable = new Observable<Layer>();

    private _onAfterRenderObserver: Nullable<Observer<Layer>>;
    /**
     * Back compatibility with callback before the onAfterRenderObservable existed.
     * The set callback will be triggered just after rendering the layer.
     */
    public set onAfterRender(callback: () => void) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
    }

    /** Shader language used by the material */
    private _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this material.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    /**
     * Instantiates a new layer.
     * This represents a full screen 2d layer.
     * This can be useful to display a picture in the  background of your scene for instance.
     * @see https://www.babylonjs-playground.com/#08A2BS#1
     * @param name Define the name of the layer in the scene
     * @param imgUrl Define the url of the texture to display in the layer
     * @param scene Define the scene the layer belongs to
     * @param isBackground Defines whether the layer is displayed in front or behind the scene
     * @param color Defines a color for the layer
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(
        /**
         * Define the name of the layer.
         */
        public name: string,
        imgUrl: Nullable<string>,
        scene: Nullable<Scene>,
        isBackground?: boolean,
        color?: Color4,
        forceGLSL = false
    ) {
        this.texture = imgUrl ? new Texture(imgUrl, scene, true) : null;
        this.isBackground = isBackground === undefined ? true : isBackground;
        this.color = color === undefined ? new Color4(1, 1, 1, 1) : color;

        this._scene = <Scene>(scene || EngineStore.LastCreatedScene);
        const engine = this._scene.getEngine();
        if (engine.isWebGPU && !forceGLSL && !Layer.ForceGLSL) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        let layerComponent = this._scene._getComponent(SceneComponentConstants.NAME_LAYER) as LayerSceneComponent;
        if (!layerComponent) {
            layerComponent = new LayerSceneComponent(this._scene);
            this._scene._addComponent(layerComponent);
        }
        this._scene.layers.push(this);

        this._drawWrapper = new DrawWrapper(engine);

        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        const vertexBuffer = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);
        this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;

        this._createIndexBuffer();
    }

    private _shadersLoaded = false;

    private _createIndexBuffer(): void {
        const engine = this._scene.getEngine();

        // Indices
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = engine.createIndexBuffer(indices);
    }

    /** @internal */
    public _rebuild(): void {
        const vb = this._vertexBuffers[VertexBuffer.PositionKind];

        if (vb) {
            vb._rebuild();
        }

        this._createIndexBuffer();
    }

    /**
     * Checks if the layer is ready to be rendered
     * @returns true if the layer is ready. False otherwise.
     */
    public isReady() {
        const engine = this._scene.getEngine();

        let defines = "";

        if (this.alphaTest) {
            defines = "#define ALPHATEST";
        }

        if (this.texture && !this.texture.gammaSpace) {
            defines += "\n#define LINEAR";
        }

        if (this._previousDefines !== defines) {
            this._previousDefines = defines;
            this._drawWrapper.effect = engine.createEffect(
                "layer",
                [VertexBuffer.PositionKind],
                ["textureMatrix", "color", "scale", "offset"],
                ["textureSampler"],
                defines,
                undefined,
                undefined,
                undefined,
                undefined,
                this._shaderLanguage,
                this._shadersLoaded
                    ? undefined
                    : async () => {
                          if (this._shaderLanguage === ShaderLanguage.WGSL) {
                              await Promise.all([import("../ShadersWGSL/layer.vertex"), import("../ShadersWGSL/layer.fragment")]);
                          } else {
                              await Promise.all([import("../Shaders/layer.vertex"), import("../Shaders/layer.fragment")]);
                          }
                          this._shadersLoaded = true;
                      }
            );
        }

        const currentEffect = this._drawWrapper.effect;

        return currentEffect?.isReady() && (!this.texture || this.texture.isReady());
    }

    /**
     * Renders the layer in the scene.
     */
    public render(): void {
        if (!this.isEnabled) {
            return;
        }

        const engine = this._scene.getEngine();

        // Check
        if (!this.isReady()) {
            return;
        }

        const currentEffect = this._drawWrapper.effect!;

        this.onBeforeRenderObservable.notifyObservers(this);

        // Render
        engine.enableEffect(this._drawWrapper);
        engine.setState(false);

        // Texture
        if (this.texture) {
            currentEffect.setTexture("textureSampler", this.texture);
            currentEffect.setMatrix("textureMatrix", this.texture.getTextureMatrix());
        }

        // Color
        currentEffect.setFloat4("color", this.color.r, this.color.g, this.color.b, this.color.a);

        // Scale / offset
        currentEffect.setVector2("offset", this.offset);
        currentEffect.setVector2("scale", this.scale);

        // VBOs
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);

        // Draw order
        if (!this.alphaTest) {
            engine.setAlphaMode(this.alphaBlendingMode);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
            engine.setAlphaMode(Constants.ALPHA_DISABLE);
        } else {
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }

        this.onAfterRenderObservable.notifyObservers(this);
    }

    /**
     * Disposes and releases the associated resources.
     */
    public dispose(): void {
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        if (this.texture) {
            this.texture.dispose();
            this.texture = null;
        }

        // Clean RTT list
        this.renderTargetTextures = [];

        // Remove from scene
        const index = this._scene.layers.indexOf(this);
        this._scene.layers.splice(index, 1);

        // Callback
        this.onDisposeObservable.notifyObservers(this);

        this.onDisposeObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onBeforeRenderObservable.clear();
    }
}
