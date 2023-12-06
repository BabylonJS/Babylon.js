import { Texture } from "core/Materials/Textures/texture";
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
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PostProcess } from "core/PostProcesses/postProcess";

import "../Shaders/meshUVSpaceRenderer.vertex";
import "../Shaders/meshUVSpaceRenderer.fragment";

import "../Shaders/meshUVSpaceRendererMasker.vertex";
import "../Shaders/meshUVSpaceRendererMasker.fragment";

import "../Shaders/meshUVSpaceRendererFinaliser.fragment";
import "../Shaders/meshUVSpaceRendererFinaliser.vertex";

declare module "../scene" {
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
     * If true, the texture will be blended with the mesh's texture to avoid seams. Default: false
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
    private _maskTexture: Texture;
    private _decalTexture: Texture;
    private _finalPostProcess: PostProcess;
    private _userCreatedTextureSetup: boolean = false;

    private static _GetShader(scene: Scene): ShaderMaterial {
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

    private static _GetMaskShader(scene: Scene): ShaderMaterial {
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
                }
            );
            shader.backFaceCulling = false;
            shader.alphaMode = Constants.ALPHA_COMBINE;

            scene.onDisposeObservable.add(() => {
                scene._meshUVSpaceRendererShader?.dispose();
                scene._meshUVSpaceRendererShader = null;
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
    public texture: Texture;

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
            uvEdgeBlending: options?.uvEdgeBlending ?? false,
            ...options,
        };
    }

    /**
     * Checks if the texture is ready to be used
     * @returns true if the texture is ready to be used
     */
    public isReady(): boolean {
        if (!this.texture) {
            this._createDecalDiffuseRTT();
        }

        return MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture) ? this.texture.isReadyForRendering() : this.texture.isReady();
    }

    /**
     * Projects and renders a texture in the mesh UV space
     * @param texture The texture
     * @param position The position of the center of projection (world space coordinates)
     * @param normal The direction of the projection (world space coordinates)
     * @param size The size of the projection
     * @param angle The rotation angle around the direction of the projection
     */
    public renderTexture(texture: BaseTexture, position: Vector3, normal: Vector3, size: Vector3, angle = 0): void {
        // Create the diffuse render target texture if it doesn't exist
        // Check if the user has not provided a texture, has not selected uvEdgeBlending and there is no decal texture
        if (!this.texture && !this._options.uvEdgeBlending) {
            this._updateRTT();
        }
        // Check if the user has provided a texture, that texture has not been configured here, and there is no uvEdgeBlending
        else if (this.texture && !this._userCreatedTextureSetup && !this._options.uvEdgeBlending) {
            this._updateRTT();
        }
        // Check if the user has provided a texture, that texture has not been configured here, and there is uvEdgeBlending
        else if (this.texture && !this._userCreatedTextureSetup && this._options.uvEdgeBlending && !this._decalTexture) {
            this._createDecalDiffuseRTT();
        }
        // Check if the user has not provided a texture, has selected uvEdgeBlending and there is no decal texture
        else if (!this.texture && this._options.uvEdgeBlending && !this._decalTexture) {
            this._createDecalDiffuseRTT();
        }

        // // Prepare the shader with the decal texture, mask texture, and necessary uniforms
        const shader = MeshUVSpaceRenderer._GetShader(this._scene);
        shader.setTexture("textureSampler", texture); // Decal texture

        // Calculate and set the projection matrix
        const projectionMatrix = this._createProjectionMatrix(position, normal, size, angle);
        shader.setMatrix("projMatrix", projectionMatrix);

        if (!this._options.uvEdgeBlending) {
            if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
                this.texture.render();
            }
        } else {
            if (MeshUVSpaceRenderer._IsRenderTargetTexture(this._decalTexture)) {
                this._decalTexture.render();
                this._createMaskTexture();
                this._createFinalTexture();
            }
        }
    }
    /**
     * Creates an RTT if one doesn't exist,
     */
    private _updateRTT() {
        if (!this.texture) {
            this.texture = this._createRenderTargetTexture(this._options.width, this._options.height);
        } else if (this.texture && !this._userCreatedTextureSetup) {
            this._userCreatedTextureSetup = true;
        }
        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
            this.texture.renderList = [this._mesh];
            this.texture.setMaterialForRendering(this._mesh, MeshUVSpaceRenderer._GetShader(this._scene));
            this.texture.onClearObservable.addOnce(() => {
                this._scene.getEngine().clear(this.clearColor, true, true, true);
                if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
                    this.texture.onClearObservable.add(() => {}); // this disables clearing the texture for the next frames
                }
            });
        }
    }

    private _createMaskTexture(): void {
        if (this._maskTexture) {
            return;
        }
        // Create a new render target texture for the mask
        this._maskTexture = new RenderTargetTexture(
            "maskTexture",
            { width: this._options.width, height: this._options.height },
            this._scene,
            false, // No mipmaps for the mask texture
            true,
            Constants.TEXTURETYPE_UNSIGNED_BYTE,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            Constants.TEXTUREFORMAT_R
        );
        const maskShader = MeshUVSpaceRenderer._GetMaskShader(this._scene);
        let texture = null;
        if (this._mesh.material instanceof PBRMaterial) {
            texture = (this._mesh.material as PBRMaterial).albedoTexture;
        } else if (this._mesh.material instanceof StandardMaterial) {
            texture = (this._mesh.material as StandardMaterial).diffuseTexture;
        }

        if (texture) {
            maskShader.setTexture("textureSampler", texture);
        } else {
            console.error("Material does not have a valid texture property.");
        }

        maskShader.backFaceCulling = false;

        this._mesh.material = this._mesh.material as PBRMaterial;
        maskShader.backFaceCulling = false;

        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this._maskTexture)) {
            // Render the mesh with the mask material to the mask texture
            this._maskTexture.renderList?.push(this._mesh);
            this._maskTexture.setMaterialForRendering(this._mesh, maskShader);
            // Ensure the mask texture is updated
            this._maskTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            this._scene.customRenderTargets.push(this._maskTexture);
        }
    }

    private _createFinalTexture(): void {
        // Create the post-process only if it hasn't been created already
        if (!this._finalPostProcess) {
            this._finalPostProcess = new PostProcess(
                "finalTexturePostProcess",
                "meshUVSpaceRendererFinaliser",
                ["textureSize"],
                ["textureSampler", "maskTextureSampler"],
                1.0,
                null,
                Texture.NEAREST_SAMPLINGMODE,
                this._scene.getEngine(),
                false,
                null,
                this._options.textureType
            );

            this._finalPostProcess.onApply = (effect) => {
                effect.setTexture("textureSampler", this._decalTexture);
                effect.setTexture("maskTextureSampler", this._maskTexture);
                effect.setFloat2("textureSize", this._options.width, this._options.height);
            };
            if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
                this.texture.addPostProcess(this._finalPostProcess);
            }
        }

        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
            this.texture.render();
        }
    }
    /**
     * Clears the texture map
     */
    public clear(): void {
        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture) && this.texture.renderTarget) {
            const engine = this._scene.getEngine();
            engine.bindFramebuffer(this.texture.renderTarget);
            engine.clear(this.clearColor, true, true, true);
            engine.unBindFramebuffer(this.texture.renderTarget);
        }
        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this._decalTexture) && this._decalTexture.renderTarget) {
            const engine = this._scene.getEngine();
            engine.bindFramebuffer(this._decalTexture.renderTarget);
            engine.clear(this.clearColor, true, true, true);
            engine.unBindFramebuffer(this._decalTexture.renderTarget);
        }
    }
    /**
     * Disposes of the resources
     */
    public dispose() {
        if (this._textureCreatedInternally) {
            this.texture.dispose();
            this._textureCreatedInternally = false;
        }
        if (this._maskTexture) {
            this._maskTexture.dispose();
        }
        if (this._decalTexture) {
            this._decalTexture.dispose();
        }
    }

    private _createDecalDiffuseRTT(): void {
        if (this._options.uvEdgeBlending) {
            const texture = this._createRenderTargetTexture(this._options.width, this._options.height);
            texture.setMaterialForRendering(this._mesh, MeshUVSpaceRenderer._GetShader(this._scene));
            this._decalTexture = texture;
        }

        if (!this.texture) {
            this.texture = new RenderTargetTexture(this._mesh.name + "_finalUVSpaceTexture", { width: this._options.width, height: this._options.height }, this._scene);
            this._textureCreatedInternally = true;
        }
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
