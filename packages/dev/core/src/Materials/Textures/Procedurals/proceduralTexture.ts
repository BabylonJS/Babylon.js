import { serialize } from "../../../Misc/decorators";
import { Observable } from "../../../Misc/observable";
import type { Nullable } from "../../../types";
import type { Scene } from "../../../scene";
import type { Matrix, Vector3, Vector2 } from "../../../Maths/math.vector";
import type { Color4, Color3 } from "../../../Maths/math.color";
import type { Engine } from "../../../Engines/engine";
import { VertexBuffer } from "../../../Buffers/buffer";
import { SceneComponentConstants } from "../../../sceneComponent";

import { Material } from "../../../Materials/material";
import type { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import type { RenderTargetTextureOptions } from "../../../Materials/Textures/renderTargetTexture";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import { ProceduralTextureSceneComponent } from "./proceduralTextureSceneComponent";

import "../../../Engines/Extensions/engine.renderTarget";
import "../../../Engines/Extensions/engine.renderTargetCube";
import "../../../Shaders/procedural.vertex";
import type { DataBuffer } from "../../../Buffers/dataBuffer";
import { RegisterClass } from "../../../Misc/typeStore";
import type { NodeMaterial } from "../../Node/nodeMaterial";
import type { TextureSize } from "../../../Materials/Textures/textureCreationOptions";
import { EngineStore } from "../../../Engines/engineStore";
import { Constants } from "../../../Engines/constants";
import { DrawWrapper } from "../../drawWrapper";
import type { RenderTargetWrapper } from "../../../Engines/renderTargetWrapper";

/**
 * Options to create a procedural texture
 */
export interface IProceduralTextureCreationOptions extends RenderTargetTextureOptions {
    /**
     * Defines a fallback texture in case there were issues to create the custom texture
     */
    fallbackTexture?: Nullable<Texture>;
}

/**
 * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes calmpler' images.
 * This is the base class of any Procedural texture and contains most of the shareable code.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures
 */
export class ProceduralTexture extends Texture {
    /**
     * Define if the texture is enabled or not (disabled texture will not render)
     */
    @serialize()
    public isEnabled = true;

    /**
     * Define if the texture must be cleared before rendering (default is true)
     */
    @serialize()
    public autoClear = true;

    /**
     * Callback called when the texture is generated
     */
    public onGenerated: () => void;

    /**
     * Event raised when the texture is generated
     */
    public onGeneratedObservable = new Observable<ProceduralTexture>();

    /**
     * Event raised before the texture is generated
     */
    public onBeforeGenerationObservable = new Observable<ProceduralTexture>();

    /**
     * Gets or sets the node material used to create this texture (null if the texture was manually created)
     */
    public nodeMaterialSource: Nullable<NodeMaterial> = null;

    /** @internal */
    @serialize()
    public _generateMipMaps: boolean;

    private _drawWrapper: DrawWrapper;

    /** @internal */
    public _textures: { [key: string]: Texture } = {};

    /** @internal */
    protected _fallbackTexture: Nullable<Texture>;

    @serialize()
    private _size: TextureSize;
    private _textureType: number;
    private _currentRefreshId = -1;
    private _frameId = -1;
    private _refreshRate = 1;
    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: Nullable<DataBuffer>;
    private _uniforms = new Array<string>();
    private _samplers = new Array<string>();
    private _fragment: any;

    private _floats: { [key: string]: number } = {};
    private _ints: { [key: string]: number } = {};
    private _floatsArrays: { [key: string]: number[] } = {};
    private _colors3: { [key: string]: Color3 } = {};
    private _colors4: { [key: string]: Color4 } = {};
    private _vectors2: { [key: string]: Vector2 } = {};
    private _vectors3: { [key: string]: Vector3 } = {};
    private _matrices: { [key: string]: Matrix } = {};

    private _fallbackTextureUsed = false;
    private _fullEngine: Engine;

    private _cachedDefines: Nullable<string> = null;

    private _contentUpdateId = -1;
    private _contentData: Nullable<Promise<ArrayBufferView>>;

    private _rtWrapper: Nullable<RenderTargetWrapper> = null;
    private _options: IProceduralTextureCreationOptions;

    /**
     * Instantiates a new procedural texture.
     * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes called 'refMaps' or 'sampler' images.
     * This is the base class of any Procedural texture and contains most of the shareable code.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures
     * @param name  Define the name of the texture
     * @param size Define the size of the texture to create
     * @param fragment Define the fragment shader to use to generate the texture or null if it is defined later:
     *  * object: \{ fragmentElement: "fragmentShaderCode" \}, used with shader code in script tags
     *  * object: \{ fragmentSource: "fragment shader code string" \}, the string contains the shader code
     *  * string: the string contains a name "XXX" to lookup in Effect.ShadersStore["XXXFragmentShader"]
     * @param scene Define the scene the texture belongs to
     * @param fallbackTexture Define a fallback texture in case there were issues to create the custom texture
     * @param generateMipMaps Define if the texture should creates mip maps or not
     * @param isCube Define if the texture is a cube texture or not (this will render each faces of the cube)
     * @param textureType The FBO internal texture type
     */
    constructor(
        name: string,
        size: TextureSize,
        fragment: any,
        scene: Nullable<Scene>,
        fallbackTexture: Nullable<Texture> | IProceduralTextureCreationOptions = null,
        generateMipMaps = true,
        isCube = false,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT
    ) {
        super(null, scene, !generateMipMaps);

        if (fallbackTexture !== null && !(fallbackTexture instanceof Texture)) {
            this._options = fallbackTexture;
            this._fallbackTexture = fallbackTexture.fallbackTexture ?? null;
        } else {
            this._options = {};
            this._fallbackTexture = fallbackTexture;
        }

        scene = this.getScene() || EngineStore.LastCreatedScene!;
        let component = scene._getComponent(SceneComponentConstants.NAME_PROCEDURALTEXTURE);
        if (!component) {
            component = new ProceduralTextureSceneComponent(scene);
            scene._addComponent(component);
        }
        scene.proceduralTextures.push(this);

        this._fullEngine = scene.getEngine();

        this.name = name;
        this.isRenderTarget = true;
        this._size = size;
        this._textureType = textureType;
        this._generateMipMaps = generateMipMaps;
        this._drawWrapper = new DrawWrapper(this._fullEngine);

        this.setFragment(fragment);

        const rtWrapper = this._createRtWrapper(isCube, size, generateMipMaps, textureType);
        this._texture = rtWrapper.texture;

        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._fullEngine, vertices, VertexBuffer.PositionKind, false, false, 2);

        this._createIndexBuffer();
    }

    private _createRtWrapper(isCube: boolean, size: TextureSize, generateMipMaps: boolean, textureType: number) {
        if (isCube) {
            this._rtWrapper = this._fullEngine.createRenderTargetCubeTexture(size as number, {
                generateMipMaps: generateMipMaps,
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                type: textureType,
                ...this._options,
            });
            this.setFloat("face", 0);
        } else {
            this._rtWrapper = this._fullEngine.createRenderTargetTexture(size, {
                generateMipMaps: generateMipMaps,
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                type: textureType,
                ...this._options,
            });
        }
        return this._rtWrapper;
    }

    /**
     * The effect that is created when initializing the post process.
     * @returns The created effect corresponding the postprocess.
     */
    public getEffect(): Effect {
        return this._drawWrapper.effect!;
    }

    /**
     * @internal
     */
    public _setEffect(effect: Effect) {
        this._drawWrapper.effect = effect;
    }

    /**
     * Gets texture content (Use this function wisely as reading from a texture can be slow)
     * @returns an ArrayBufferView promise (Uint8Array or Float32Array)
     */
    public getContent(): Nullable<Promise<ArrayBufferView>> {
        if (this._contentData && this._frameId === this._contentUpdateId) {
            return this._contentData;
        }

        if (this._contentData) {
            this._contentData.then((buffer) => {
                this._contentData = this.readPixels(0, 0, buffer);
                this._contentUpdateId = this._frameId;
            });
        } else {
            this._contentData = this.readPixels(0, 0);
            this._contentUpdateId = this._frameId;
        }

        return this._contentData;
    }

    private _createIndexBuffer(): void {
        const engine = this._fullEngine;

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

        if (this.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE) {
            this.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        }
    }

    /**
     * Resets the texture in order to recreate its associated resources.
     * This can be called in case of context loss or if you change the shader code and need to regenerate the texture with the new code
     */
    public reset(): void {
        this._drawWrapper.effect?.dispose();
        this._drawWrapper.effect = null;
        this._cachedDefines = null;
    }

    protected _getDefines(): string {
        return "";
    }

    /**
     * Executes a function when the texture will be ready to be drawn.
     * @param func The callback to be used.
     */
    public executeWhenReady(func: (texture: ProceduralTexture) => void): void {
        if (this.isReady()) {
            func(this);
            return;
        }

        const effect = this.getEffect();
        if (effect) {
            effect.executeWhenCompiled(() => {
                func(this);
            });
        }
    }

    /**
     * Is the texture ready to be used ? (rendered at least once)
     * @returns true if ready, otherwise, false.
     */
    public isReady(): boolean {
        const engine = this._fullEngine;

        if (this.nodeMaterialSource) {
            return this._drawWrapper.effect!.isReady();
        }

        if (!this._fragment) {
            return false;
        }

        if (this._fallbackTextureUsed) {
            return true;
        }

        if (!this._texture) {
            return false;
        }

        const defines = this._getDefines();
        if (this._drawWrapper.effect && defines === this._cachedDefines && this._drawWrapper.effect.isReady()) {
            return true;
        }

        const shaders = {
            vertex: "procedural",
            fragmentElement: this._fragment.fragmentElement,
            fragmentSource: this._fragment.fragmentSource,
            fragment: typeof this._fragment === "string" ? this._fragment : undefined,
        };

        if (this._cachedDefines !== defines) {
            this._cachedDefines = defines;

            this._drawWrapper.effect = engine.createEffect(shaders, [VertexBuffer.PositionKind], this._uniforms, this._samplers, defines, undefined, undefined, () => {
                this._rtWrapper?.dispose();
                this._rtWrapper = this._texture = null;

                if (this._fallbackTexture) {
                    this._texture = this._fallbackTexture._texture;

                    if (this._texture) {
                        this._texture.incrementReferences();
                    }
                }

                this._fallbackTextureUsed = true;
            });
        }

        return this._drawWrapper.effect!.isReady();
    }

    /**
     * Resets the refresh counter of the texture and start bak from scratch.
     * Could be useful to regenerate the texture if it is setup to render only once.
     */
    public resetRefreshCounter(): void {
        this._currentRefreshId = -1;
    }

    /**
     * Set the fragment shader to use in order to render the texture.
     * @param fragment This can be set to a path (into the shader store) or to a json object containing a fragmentElement property.
     */
    public setFragment(fragment: any) {
        this._fragment = fragment;
    }

    /**
     * Define the refresh rate of the texture or the rendering frequency.
     * Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
     */
    @serialize()
    public get refreshRate(): number {
        return this._refreshRate;
    }

    public set refreshRate(value: number) {
        this._refreshRate = value;
        this.resetRefreshCounter();
    }

    /** @internal */
    public _shouldRender(): boolean {
        if (!this.isEnabled || !this.isReady() || !this._texture) {
            if (this._texture) {
                this._texture.isReady = false;
            }
            return false;
        }

        if (this._fallbackTextureUsed) {
            return false;
        }

        if (this._currentRefreshId === -1) {
            // At least render once
            this._currentRefreshId = 1;
            this._frameId++;
            return true;
        }

        if (this.refreshRate === this._currentRefreshId) {
            this._currentRefreshId = 1;
            this._frameId++;
            return true;
        }

        this._currentRefreshId++;
        return false;
    }

    /**
     * Get the size the texture is rendering at.
     * @returns the size (on cube texture it is always squared)
     */
    public getRenderSize(): TextureSize {
        return this._size;
    }

    /**
     * Resize the texture to new value.
     * @param size Define the new size the texture should have
     * @param generateMipMaps Define whether the new texture should create mip maps
     */
    public resize(size: TextureSize, generateMipMaps: boolean): void {
        if (this._fallbackTextureUsed || !this._rtWrapper || !this._texture) {
            return;
        }

        const isCube = this._texture.isCube;
        this._rtWrapper.dispose();

        const rtWrapper = this._createRtWrapper(isCube, size, generateMipMaps, this._textureType);
        this._texture = rtWrapper.texture;

        // Update properties
        this._size = size;
        this._generateMipMaps = generateMipMaps;
    }

    private _checkUniform(uniformName: string): void {
        if (this._uniforms.indexOf(uniformName) === -1) {
            this._uniforms.push(uniformName);
        }
    }

    /**
     * Set a texture in the shader program used to render.
     * @param name Define the name of the uniform samplers as defined in the shader
     * @param texture Define the texture to bind to this sampler
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setTexture(name: string, texture: Texture): ProceduralTexture {
        if (this._samplers.indexOf(name) === -1) {
            this._samplers.push(name);
        }
        this._textures[name] = texture;

        return this;
    }

    /**
     * Set a float in the shader.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setFloat(name: string, value: number): ProceduralTexture {
        this._checkUniform(name);
        this._floats[name] = value;

        return this;
    }

    /**
     * Set a int in the shader.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setInt(name: string, value: number): ProceduralTexture {
        this._checkUniform(name);
        this._ints[name] = value;

        return this;
    }

    /**
     * Set an array of floats in the shader.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setFloats(name: string, value: number[]): ProceduralTexture {
        this._checkUniform(name);
        this._floatsArrays[name] = value;

        return this;
    }

    /**
     * Set a vec3 in the shader from a Color3.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setColor3(name: string, value: Color3): ProceduralTexture {
        this._checkUniform(name);
        this._colors3[name] = value;

        return this;
    }

    /**
     * Set a vec4 in the shader from a Color4.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setColor4(name: string, value: Color4): ProceduralTexture {
        this._checkUniform(name);
        this._colors4[name] = value;

        return this;
    }

    /**
     * Set a vec2 in the shader from a Vector2.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setVector2(name: string, value: Vector2): ProceduralTexture {
        this._checkUniform(name);
        this._vectors2[name] = value;

        return this;
    }

    /**
     * Set a vec3 in the shader from a Vector3.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setVector3(name: string, value: Vector3): ProceduralTexture {
        this._checkUniform(name);
        this._vectors3[name] = value;

        return this;
    }

    /**
     * Set a mat4 in the shader from a MAtrix.
     * @param name Define the name of the uniform as defined in the shader
     * @param value Define the value to give to the uniform
     * @returns the texture itself allowing "fluent" like uniform updates
     */
    public setMatrix(name: string, value: Matrix): ProceduralTexture {
        this._checkUniform(name);
        this._matrices[name] = value;

        return this;
    }

    /**
     * Render the texture to its associated render target.
     * @param useCameraPostProcess Define if camera post process should be applied to the texture
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public render(useCameraPostProcess?: boolean): void {
        const scene = this.getScene();

        if (!scene) {
            return;
        }

        const engine = this._fullEngine;

        // Render
        engine.enableEffect(this._drawWrapper);
        this.onBeforeGenerationObservable.notifyObservers(this);
        engine.setState(false);

        if (!this.nodeMaterialSource) {
            // Texture
            for (const name in this._textures) {
                this._drawWrapper.effect!.setTexture(name, this._textures[name]);
            }

            // Float
            for (const name in this._ints) {
                this._drawWrapper.effect!.setInt(name, this._ints[name]);
            }

            // Float
            for (const name in this._floats) {
                this._drawWrapper.effect!.setFloat(name, this._floats[name]);
            }

            // Floats
            for (const name in this._floatsArrays) {
                this._drawWrapper.effect!.setArray(name, this._floatsArrays[name]);
            }

            // Color3
            for (const name in this._colors3) {
                this._drawWrapper.effect!.setColor3(name, this._colors3[name]);
            }

            // Color4
            for (const name in this._colors4) {
                const color = this._colors4[name];
                this._drawWrapper.effect!.setFloat4(name, color.r, color.g, color.b, color.a);
            }

            // Vector2
            for (const name in this._vectors2) {
                this._drawWrapper.effect!.setVector2(name, this._vectors2[name]);
            }

            // Vector3
            for (const name in this._vectors3) {
                this._drawWrapper.effect!.setVector3(name, this._vectors3[name]);
            }

            // Matrix
            for (const name in this._matrices) {
                this._drawWrapper.effect!.setMatrix(name, this._matrices[name]);
            }
        }

        if (!this._texture || !this._rtWrapper) {
            return;
        }

        engine._debugPushGroup?.(`procedural texture generation for ${this.name}`, 1);

        const viewPort = engine.currentViewport;
        if (this.isCube) {
            for (let face = 0; face < 6; face++) {
                engine.bindFramebuffer(this._rtWrapper, face, undefined, undefined, true);

                // VBOs
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._drawWrapper.effect!);

                this._drawWrapper.effect!.setFloat("face", face);

                // Clear
                if (this.autoClear) {
                    engine.clear(scene.clearColor, true, false, false);
                }

                // Draw order
                engine.drawElementsType(Material.TriangleFillMode, 0, 6);
            }
        } else {
            engine.bindFramebuffer(this._rtWrapper, 0, undefined, undefined, true);

            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._drawWrapper.effect!);

            // Clear
            if (this.autoClear) {
                engine.clear(scene.clearColor, true, false, false);
            }

            // Draw order
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }

        // Unbind and restore viewport
        engine.unBindFramebuffer(this._rtWrapper, this.isCube);
        if (viewPort) {
            engine.setViewport(viewPort);
        }

        // Mipmaps
        if (this.isCube) {
            engine.generateMipMapsForCubemap(this._texture);
        }

        engine._debugPopGroup?.(1);

        if (this.onGenerated) {
            this.onGenerated();
        }

        this.onGeneratedObservable.notifyObservers(this);
    }

    /**
     * Clone the texture.
     * @returns the cloned texture
     */
    public clone(): ProceduralTexture {
        const textureSize = this.getSize();
        const newTexture = new ProceduralTexture(this.name, textureSize.width, this._fragment, <Scene>this.getScene(), this._fallbackTexture, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // RenderTarget Texture
        newTexture.coordinatesMode = this.coordinatesMode;

        return newTexture;
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        const scene = this.getScene();

        if (!scene) {
            return;
        }

        const index = scene.proceduralTextures.indexOf(this);

        if (index >= 0) {
            scene.proceduralTextures.splice(index, 1);
        }

        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }

        if (this._indexBuffer && this._fullEngine._releaseBuffer(this._indexBuffer)) {
            this._indexBuffer = null;
        }

        this.onGeneratedObservable.clear();
        this.onBeforeGenerationObservable.clear();

        super.dispose();
    }
}

RegisterClass("BABYLON.ProceduralTexture", ProceduralTexture);
