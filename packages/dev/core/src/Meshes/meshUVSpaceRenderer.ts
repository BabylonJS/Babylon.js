import type { Texture } from "core/Materials/Textures/texture";
import type { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { AbstractMesh } from "./abstractMesh";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import { Matrix } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Color4 } from "core/Maths/math.color";
import { PostProcess } from "core/PostProcesses/postProcess";

import { ShaderLanguage } from "core/Materials/shaderLanguage";

declare module "../scene" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface Scene {
        /** @internal */
        _meshUVSpaceRendererShader: Nullable<ShaderMaterial>;
        /** @internal */
        _meshUVSpaceRendererMaskShader: Nullable<ShaderMaterial>;
    }
}

/**
 * Options for the MeshUVSpaceRenderer
 * @since 5.49.1
 */
export interface IMeshUVSpaceRendererOptions {
    /**
     * Width of the texture. Default: 1024
     */
    width?: number;
    /**
     * Height of the texture. Default: 1024
     */
    height?: number;
    /**
     * Type of the texture. Default: Constants.TEXTURETYPE_UNSIGNED_BYTE
     */
    textureType?: number;
    /**
     * Generate mip maps. Default: true
     */
    generateMipMaps?: boolean;
    /**
     * Optimize UV allocation. Default: true
     * If you plan to use the texture as a decal map and rotate / offset the texture, you should set this to false
     */
    optimizeUVAllocation?: boolean;
    /**
     * If true, a post processing effect will be applied to the texture to fix seams. Default: false
     */
    uvEdgeBlending?: boolean;
}

/**
 * Class used to render in the mesh UV space
 * @since 5.49.1
 */
export class MeshUVSpaceRenderer {
    private _mesh: AbstractMesh;
    private _scene: Scene;
    private _options: Required<IMeshUVSpaceRendererOptions>;
    private _textureCreatedInternally = false;
    private _configureUserCreatedTexture = true;
    private _maskTexture: Nullable<RenderTargetTexture> = null;
    private _finalPostProcess: Nullable<PostProcess> = null;
    private _shadersLoaded = false;
    private _isDisposed = false;

    private static _GetShader(scene: Scene, shaderLanguage: ShaderLanguage): ShaderMaterial {
        if (!scene._meshUVSpaceRendererShader) {
            const shader = new ShaderMaterial(
                "meshUVSpaceRendererShader",
                scene,
                {
                    vertex: "meshUVSpaceRenderer",
                    fragment: "meshUVSpaceRenderer",
                },
                {
                    attributes: ["position", "normal", "uv"],
                    uniforms: ["world", "projMatrix"],
                    samplers: ["textureSampler"],
                    needAlphaBlending: true,
                    shaderLanguage: shaderLanguage,
                }
            );
            shader.backFaceCulling = false;
            shader.alphaMode = Constants.ALPHA_COMBINE;

            scene.onDisposeObservable.add(() => {
                scene._meshUVSpaceRendererShader?.dispose();
                scene._meshUVSpaceRendererShader = null;
            });

            scene._meshUVSpaceRendererShader = shader;
        }

        return scene._meshUVSpaceRendererShader;
    }

    private static _GetMaskShader(scene: Scene, shaderLanguage: ShaderLanguage): ShaderMaterial {
        if (!scene._meshUVSpaceRendererMaskShader) {
            const shader = new ShaderMaterial(
                "meshUVSpaceRendererMaskShader",
                scene,
                {
                    vertex: "meshUVSpaceRendererMasker",
                    fragment: "meshUVSpaceRendererMasker",
                },
                {
                    attributes: ["position", "uv"],
                    uniforms: ["worldViewProjection"],
                    shaderLanguage: shaderLanguage,
                }
            );
            shader.backFaceCulling = false;
            shader.alphaMode = Constants.ALPHA_COMBINE;

            scene.onDisposeObservable.add(() => {
                scene._meshUVSpaceRendererMaskShader?.dispose();
                scene._meshUVSpaceRendererMaskShader = null;
            });

            scene._meshUVSpaceRendererMaskShader = shader;
        }
        return scene._meshUVSpaceRendererMaskShader;
    }

    private static _IsRenderTargetTexture(texture: ThinTexture | RenderTargetTexture): texture is RenderTargetTexture {
        return (texture as RenderTargetTexture).renderList !== undefined;
    }

    /**
     * Clear color of the texture
     */
    public clearColor = new Color4(0, 0, 0, 0);

    /**
     * Target texture used for rendering
     * If you don't set the property, a RenderTargetTexture will be created internally given the options provided to the constructor.
     * If you provide a RenderTargetTexture, it will be used directly.
     */
    public texture: Nullable<Texture> = null;

    /** Shader language used by the material */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this material.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    /**
     * Creates a new MeshUVSpaceRenderer
     * @param mesh The mesh used for the source UV space
     * @param scene The scene the mesh belongs to
     * @param options The options to use when creating the texture
     */
    constructor(mesh: AbstractMesh, scene: Scene, options?: IMeshUVSpaceRendererOptions) {
        this._mesh = mesh;
        this._scene = scene;
        this._options = {
            width: 1024,
            height: 1024,
            textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            generateMipMaps: true,
            optimizeUVAllocation: true,
            uvEdgeBlending: false,
            ...options,
        };

        this._initShaderSourceAsync();
    }

    private async _initShaderSourceAsync() {
        const engine = this._scene.getEngine();

        if (engine.isWebGPU) {
            this._shaderLanguage = ShaderLanguage.WGSL;
            await Promise.all([
                import("../ShadersWGSL/meshUVSpaceRenderer.vertex"),
                import("../ShadersWGSL/meshUVSpaceRenderer.fragment"),
                import("../ShadersWGSL/meshUVSpaceRendererMasker.vertex"),
                import("../ShadersWGSL/meshUVSpaceRendererMasker.fragment"),
                import("../ShadersWGSL/meshUVSpaceRendererFinaliser.vertex"),
                import("../ShadersWGSL/meshUVSpaceRendererFinaliser.fragment"),
            ]);
        } else {
            await Promise.all([
                import("../Shaders/meshUVSpaceRenderer.vertex"),
                import("../Shaders/meshUVSpaceRenderer.fragment"),
                import("../Shaders/meshUVSpaceRendererMasker.vertex"),
                import("../Shaders/meshUVSpaceRendererMasker.fragment"),
                import("../Shaders/meshUVSpaceRendererFinaliser.vertex"),
                import("../Shaders/meshUVSpaceRendererFinaliser.fragment"),
            ]);
        }

        if (this._isDisposed) {
            return;
        }

        this._shadersLoaded = true;
    }

    /**
     * Checks if the texture is ready to be used
     * @returns true if the texture is ready to be used
     */
    public isReady(): boolean {
        if (!this._shadersLoaded) {
            return false;
        }

        if (!this.texture) {
            this._createDiffuseRTT();
        } else if (this._configureUserCreatedTexture) {
            this._configureUserCreatedRTT();
        }

        // this.texture is guaranteed to be non-null here as it is created in _createDiffuseRTT above
        const textureIsReady = MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture!) ? this.texture.isReadyForRendering() : this.texture!.isReady();
        const maskIsReady = this._maskTexture?.isReadyForRendering() ?? true;
        const postProcessIsReady = this._finalPostProcess?.isReady() ?? true;

        return textureIsReady && maskIsReady && postProcessIsReady;
    }

    /**
     * Projects and renders a texture in the mesh UV space
     * @param texture The texture
     * @param position The position of the center of projection (world space coordinates)
     * @param normal The direction of the projection (world space coordinates)
     * @param size The size of the projection
     * @param angle The rotation angle around the direction of the projection (default: 0)
     * @param checkIsReady If true, it will check if the texture is ready before rendering (default: true). If the texture is not ready, a new attempt will be scheduled in 16ms
     */
    public renderTexture(texture: BaseTexture, position: Vector3, normal: Vector3, size: Vector3, angle = 0, checkIsReady = true): void {
        if (checkIsReady && !this.isReady()) {
            setTimeout(() => {
                this.renderTexture(texture, position, normal, size, angle, checkIsReady);
            }, 16);
            return;
        }

        if (!this.texture) {
            this._createDiffuseRTT();
        } else if (this._configureUserCreatedTexture) {
            this._configureUserCreatedRTT();
        }

        // this.texture is guaranteed to be non-null here as it is created in _createDiffuseRTT above
        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture!)) {
            const matrix = this._createProjectionMatrix(position, normal, size, angle);
            const shader = MeshUVSpaceRenderer._GetShader(this._scene, this._shaderLanguage);

            shader.setTexture("textureSampler", texture);
            shader.setMatrix("projMatrix", matrix);

            this.texture.render();

            // We needed the texture only once for the render() call above, so we can remove it from the shader.
            // It's important to do that, because this texture could be disposed by the user, meaning that shader.isReady() would return false as part of the this.texture.isReadyForRendering() call of isReady()
            shader.removeTexture("textureSampler");
        }
    }

    /**
     * Clears the texture map
     */
    public clear(): void {
        if (this.texture && MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture) && this.texture.renderTarget) {
            const engine = this._scene.getEngine();

            engine.bindFramebuffer(this.texture.renderTarget);
            engine.clear(this.clearColor, true, true, true);
            engine.unBindFramebuffer(this.texture.renderTarget);
        }
        if (this._finalPostProcess?.inputTexture) {
            const engine = this._scene.getEngine();

            engine.bindFramebuffer(this._finalPostProcess?.inputTexture);
            engine.clear(this.clearColor, true, true, true);
            engine.unBindFramebuffer(this._finalPostProcess?.inputTexture);
        }
    }

    /**
     * Disposes of the resources
     */
    public dispose() {
        if (this._textureCreatedInternally) {
            this.texture?.dispose();
            this._textureCreatedInternally = false;
        }
        this._configureUserCreatedTexture = true;
        this._maskTexture?.dispose();
        this._maskTexture = null;
        this._finalPostProcess?.dispose();
        this._finalPostProcess = null;
        this._isDisposed = true;
    }

    private _configureUserCreatedRTT(): void {
        this._configureUserCreatedTexture = false;
        if (this.texture && MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
            this.texture.setMaterialForRendering(this._mesh, MeshUVSpaceRenderer._GetShader(this._scene, this._shaderLanguage));
            this.texture.onClearObservable.add(() => {});
            this.texture.renderList = [this._mesh];
            if (this._options.uvEdgeBlending) {
                this._createMaskTexture();
                this._createPostProcess();
                this.texture.addPostProcess(this._finalPostProcess!);
            }
        }
    }

    private _createDiffuseRTT(): void {
        this._textureCreatedInternally = true;

        const texture = this._createRenderTargetTexture(this._options.width, this._options.height);

        texture.setMaterialForRendering(this._mesh, MeshUVSpaceRenderer._GetShader(this._scene, this._shaderLanguage));

        this.texture = texture;
        this._configureUserCreatedTexture = false;
        if (this._options.uvEdgeBlending) {
            this._createMaskTexture();
            this._createPostProcess();
            texture.addPostProcess(this._finalPostProcess!);
        }
    }

    private _createMaskTexture(): void {
        if (this._maskTexture) {
            return;
        }

        this._maskTexture = new RenderTargetTexture(
            this._mesh.name + "_maskTexture",
            { width: this._options.width, height: this._options.height },
            this._scene,
            false, // No mipmaps for the mask texture
            true,
            Constants.TEXTURETYPE_UNSIGNED_BYTE,
            false,
            Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            undefined,
            undefined,
            undefined,
            Constants.TEXTUREFORMAT_R
        );

        this._maskTexture.clearColor = new Color4(0, 0, 0, 0);

        // Render the mesh with the mask material to the mask texture
        this._maskTexture.renderList!.push(this._mesh);
        this._maskTexture.setMaterialForRendering(this._mesh, MeshUVSpaceRenderer._GetMaskShader(this._scene, this._shaderLanguage));

        // Ensure the mask texture is updated
        this._maskTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        this._scene.customRenderTargets.push(this._maskTexture);
    }

    private _createPostProcess(): void {
        if (this._finalPostProcess) {
            return;
        }

        this._finalPostProcess = new PostProcess(
            this._mesh.name + "_fixSeamsPostProcess",
            "meshUVSpaceRendererFinaliser",
            ["textureSize"],
            ["textureSampler", "maskTextureSampler"],
            1.0,
            null,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            this._scene.getEngine(),
            false,
            null,
            this._options.textureType,
            undefined,
            undefined,
            undefined,
            undefined,
            this._shaderLanguage
        );

        this._finalPostProcess.onApplyObservable.add((effect) => {
            effect.setTexture("maskTextureSampler", this._maskTexture);
            effect.setFloat2("textureSize", this._options.width, this._options.height);
        });
    }

    private _createRenderTargetTexture(width: number, height: number): RenderTargetTexture {
        const rtt = new RenderTargetTexture(
            this._mesh.name + "_uvspaceTexture",
            { width, height },
            this._scene,
            this._options.generateMipMaps,
            true,
            this._options.textureType,
            false,
            this._options.generateMipMaps ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            false,
            false,
            false,
            Constants.TEXTUREFORMAT_RGBA
        );

        rtt.renderParticles = false;
        rtt.optimizeUVAllocation = !!this._options.optimizeUVAllocation;

        rtt.onClearObservable.addOnce(() => {
            this._scene.getEngine().clear(this.clearColor, true, true, true);
            rtt.onClearObservable.add(() => {}); // this disables clearing the texture for the next frames
        });

        rtt.renderList = [this._mesh];

        return rtt;
    }

    private _createProjectionMatrix(position: Vector3, normal: Vector3, size: Vector3, angle = 0): Matrix {
        const yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
        const len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
        const pitch = Math.atan2(normal.y, len);

        const p = position.add(normal.scale(size.z * 0.5));

        const projWorldMatrix = Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(Matrix.Translation(p.x, p.y, p.z));
        const inverseProjWorldMatrix = Matrix.Invert(projWorldMatrix);

        const projMatrix = Matrix.FromArray([2 / size.x, 0, 0, 0, 0, 2 / size.y, 0, 0, 0, 0, 1 / size.z, 0, 0, 0, 0, 1]);

        const screenMatrix = Matrix.FromArray([0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 1, 0, 0.5, 0.5, 0.0, 1]);

        return inverseProjWorldMatrix.multiply(projMatrix).multiply(screenMatrix);
    }
}
