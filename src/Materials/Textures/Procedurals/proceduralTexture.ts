import { serialize } from "../../../Misc/decorators";
import { Observable } from "../../../Misc/observable";
import { Nullable } from "../../../types";
import { Scene } from "../../../scene";
import { Matrix, Vector3, Vector2 } from "../../../Maths/math.vector";
import { Color4, Color3 } from '../../../Maths/math.color';
import { Engine } from "../../../Engines/engine";
import { VertexBuffer } from "../../../Meshes/buffer";
import { SceneComponentConstants } from "../../../sceneComponent";

import { Material } from "../../../Materials/material";
import { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import { ProceduralTextureSceneComponent } from "./proceduralTextureSceneComponent";

import "../../../Engines/Extensions/engine.renderTarget";
import "../../../Engines/Extensions/engine.renderTargetCube";
import "../../../Shaders/procedural.vertex";
import { DataBuffer } from '../../../Meshes/dataBuffer';
import { _TypeStore } from '../../../Misc/typeStore';
import { NodeMaterial } from '../../Node/nodeMaterial';

/**
 * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes calmpler' images.
 * This is the base class of any Procedural texture and contains most of the shareable code.
 * @see https://doc.babylonjs.com/how_to/how_to_use_procedural_textures
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

    /** @hidden */
    @serialize()
    public _generateMipMaps: boolean;

    /** @hidden **/
    public _effect: Effect;

    /** @hidden */
    public _textures: { [key: string]: Texture } = {};

    /** @hidden */
    protected _fallbackTexture: Nullable<Texture>;

    @serialize()
    private _size: number;
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

    private _cachedDefines = "";

    private _contentUpdateId = -1;
    private _contentData: Nullable<ArrayBufferView>;

    /**
     * Instantiates a new procedural texture.
     * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes called 'refMaps' or 'sampler' images.
     * This is the base class of any Procedural texture and contains most of the shareable code.
     * @see https://doc.babylonjs.com/how_to/how_to_use_procedural_textures
     * @param name  Define the name of the texture
     * @param size Define the size of the texture to create
     * @param fragment Define the fragment shader to use to generate the texture or null if it is defined later
     * @param scene Define the scene the texture belongs to
     * @param fallbackTexture Define a fallback texture in case there were issues to create the custom texture
     * @param generateMipMaps Define if the texture should creates mip maps or not
     * @param isCube Define if the texture is a cube texture or not (this will render each faces of the cube)
     */
    constructor(name: string, size: any, fragment: any, scene: Nullable<Scene>, fallbackTexture: Nullable<Texture> = null, generateMipMaps = true, isCube = false) {
        super(null, scene, !generateMipMaps);

        scene = this.getScene()!;
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
        this._generateMipMaps = generateMipMaps;

        this.setFragment(fragment);

        this._fallbackTexture = fallbackTexture;

        if (isCube) {
            this._texture = this._fullEngine.createRenderTargetCubeTexture(size, { generateMipMaps: generateMipMaps, generateDepthBuffer: false, generateStencilBuffer: false });
            this.setFloat("face", 0);
        }
        else {
            this._texture = this._fullEngine.createRenderTargetTexture(size, { generateMipMaps: generateMipMaps, generateDepthBuffer: false, generateStencilBuffer: false });
        }

        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._fullEngine, vertices, VertexBuffer.PositionKind, false, false, 2);

        this._createIndexBuffer();
    }

    /**
     * The effect that is created when initializing the post process.
     * @returns The created effect corresponding the the postprocess.
     */
    public getEffect(): Effect {
        return this._effect;
    }

    /** @hidden */
    public _setEffect(effect: Effect) {
        this._effect = effect;
    }

    /**
     * Gets texture content (Use this function wisely as reading from a texture can be slow)
     * @returns an ArrayBufferView (Uint8Array or Float32Array)
     */
    public getContent(): Nullable<ArrayBufferView> {
        if (this._contentData && this._frameId === this._contentUpdateId) {
            return this._contentData;
        }

        this._contentData = this.readPixels(0, 0, this._contentData);
        this._contentUpdateId = this._frameId;

        return this._contentData;
    }

    private _createIndexBuffer(): void {
        var engine = this._fullEngine;

        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = engine.createIndexBuffer(indices);
    }

    /** @hidden */
    public _rebuild(): void {
        let vb = this._vertexBuffers[VertexBuffer.PositionKind];

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
     * This can be called in case of context loss
     */
    public reset(): void {
        if (this._effect === undefined) {
            return;
        }
        this._effect.dispose();
    }

    protected _getDefines(): string {
        return "";
    }

    /**
     * Is the texture ready to be used ? (rendered at least once)
     * @returns true if ready, otherwise, false.
     */
    public isReady(): boolean {
        var engine = this._fullEngine;
        var shaders;

        if (this.nodeMaterialSource) {
            return this._effect.isReady();
        }

        if (!this._fragment) {
            return false;
        }

        if (this._fallbackTextureUsed) {
            return true;
        }

        let defines = this._getDefines();
        if (this._effect && defines === this._cachedDefines && this._effect.isReady()) {
            return true;
        }

        if (this._fragment.fragmentElement !== undefined) {
            shaders = { vertex: "procedural", fragmentElement: this._fragment.fragmentElement };
        }
        else {
            shaders = { vertex: "procedural", fragment: this._fragment };
        }

        this._cachedDefines = defines;

        this._effect = engine.createEffect(shaders,
            [VertexBuffer.PositionKind],
            this._uniforms,
            this._samplers,
            defines, undefined, undefined, () => {
                this.releaseInternalTexture();

                if (this._fallbackTexture) {
                    this._texture = this._fallbackTexture._texture;

                    if (this._texture) {
                        this._texture.incrementReferences();
                    }
                }

                this._fallbackTextureUsed = true;
            });

        return this._effect.isReady();
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

    /** @hidden */
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

        if (this._currentRefreshId === -1) { // At least render once
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
     * @returns the size (texture is always squared)
     */
    public getRenderSize(): number {
        return this._size;
    }

    /**
     * Resize the texture to new value.
     * @param size Define the new size the texture should have
     * @param generateMipMaps Define whether the new texture should create mip maps
     */
    public resize(size: number, generateMipMaps: boolean): void {
        if (this._fallbackTextureUsed) {
            return;
        }

        this.releaseInternalTexture();
        this._texture = this._fullEngine.createRenderTargetTexture(size, generateMipMaps);

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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
     * @return the texture itself allowing "fluent" like uniform updates
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
    public render(useCameraPostProcess?: boolean): void {
        var scene = this.getScene();

        if (!scene) {
            return;
        }

        var engine = this._fullEngine;

        // Render
        engine.enableEffect(this._effect);
        this.onBeforeGenerationObservable.notifyObservers(this);
        engine.setState(false);

        if (!this.nodeMaterialSource) {
            // Texture
            for (var name in this._textures) {
                this._effect.setTexture(name, this._textures[name]);
            }

            // Float
            for (name in this._ints) {
                this._effect.setInt(name, this._ints[name]);
            }

            // Float
            for (name in this._floats) {
                this._effect.setFloat(name, this._floats[name]);
            }

            // Floats
            for (name in this._floatsArrays) {
                this._effect.setArray(name, this._floatsArrays[name]);
            }

            // Color3
            for (name in this._colors3) {
                this._effect.setColor3(name, this._colors3[name]);
            }

            // Color4
            for (name in this._colors4) {
                var color = this._colors4[name];
                this._effect.setFloat4(name, color.r, color.g, color.b, color.a);
            }

            // Vector2
            for (name in this._vectors2) {
                this._effect.setVector2(name, this._vectors2[name]);
            }

            // Vector3
            for (name in this._vectors3) {
                this._effect.setVector3(name, this._vectors3[name]);
            }

            // Matrix
            for (name in this._matrices) {
                this._effect.setMatrix(name, this._matrices[name]);
            }
        }

        if (!this._texture) {
            return;
        }

        if (this.isCube) {
            for (var face = 0; face < 6; face++) {
                engine.bindFramebuffer(this._texture, face, undefined, undefined, true);

                // VBOs
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._effect);

                this._effect.setFloat("face", face);

                // Clear
                if (this.autoClear) {
                    engine.clear(scene.clearColor, true, false, false);
                }

                // Draw order
                engine.drawElementsType(Material.TriangleFillMode, 0, 6);

                // Mipmaps
                if (face === 5) {
                    engine.generateMipMapsForCubemap(this._texture);
                }
            }
        } else {
            engine.bindFramebuffer(this._texture, 0, undefined, undefined, true);

            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._effect);

            // Clear
            if (this.autoClear) {
                engine.clear(scene.clearColor, true, false, false);
            }

            // Draw order
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }

        // Unbind
        engine.unBindFramebuffer(this._texture, this.isCube);

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
        var textureSize = this.getSize();
        var newTexture = new ProceduralTexture(this.name, textureSize.width, this._fragment, <Scene>this.getScene(), this._fallbackTexture, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // RenderTarget Texture
        newTexture.coordinatesMode = this.coordinatesMode;

        return newTexture;
    }

    /**
     * Dispose the texture and release its asoociated resources.
     */
    public dispose(): void {
        let scene = this.getScene();

        if (!scene) {
            return;
        }

        var index = scene.proceduralTextures.indexOf(this);

        if (index >= 0) {
            scene.proceduralTextures.splice(index, 1);
        }

        var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
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

_TypeStore.RegisteredTypes["BABYLON.ProceduralTexture"] = ProceduralTexture;
