import { Texture } from "core/Materials/Textures/texture";
import type { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { AbstractMesh } from "./abstractMesh";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import { Matrix, Vector2 } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Color4 } from "core/Maths/math.color";
import { PBRMaterial} from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { PostProcess } from "core/PostProcesses/postProcess";

import "../Shaders/meshUVSpaceRenderer.vertex";
import "../Shaders/meshUVSpaceRenderer.fragment";

import "../Shaders/meshUVSpaceRendererMasker.vertex";
import "../Shaders/meshUVSpaceRendererMasker.fragment";

import "../Shaders/meshUVSpaceRendererFinaliser.fragment";
import "../Shaders/meshUVSpaceRendererFinaliser.vertex";


declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal */
        _meshUVSpaceRendererShader: Nullable<ShaderMaterial>;
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
    /**
     * Mask Texture for the UV Edge Blending
     */
    _maskTexture: any;
    /**
     * Final Texture for the UV Edge Blending
     */
    _finalTexture: any;
    
    /**
     * The decal texture
     */
    decalTexture: Texture;
    /**
     * The final material for the UV Edge Blending
     */
    public finalMaterial: ShaderMaterial;
    /**
     * The final post process for the UV Edge Blending
     */
    _finalPostProcess: any;

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
        if (!this.decalTexture) {
            this._createDiffuseRTT();
        }

        return MeshUVSpaceRenderer._IsRenderTargetTexture(this.decalTexture) ? this.decalTexture.isReadyForRendering() : this.decalTexture.isReady();
    }

    /**
     * Projects and renders a texture in the mesh UV space
     * @param texture The texture
     * @param position The position of the center of projection (world space coordinates)
     * @param normal The direction of the projection (world space coordinates)
     * @param size The size of the projection
     * @param angle The rotation angle around the direction of the projection
     */
    public async renderTexture(texture: BaseTexture, position: Vector3, normal: Vector3, size: Vector3, angle = 0): Promise<void> {
        // Create the diffuse render target texture if it doesn't exist
        if (!this.decalTexture) {
            this._createDiffuseRTT();
        }

        // // Prepare the shader with the decal texture, mask texture, and necessary uniforms
        const shader = MeshUVSpaceRenderer._GetShader(this._scene);
        shader.setTexture("textureSampler", texture); // Decal texture

        // Calculate and set the projection matrix
        const projectionMatrix = this._createProjectionMatrix(position, normal, size, angle);
        shader.setMatrix("projMatrix", projectionMatrix);

        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.decalTexture)) {
            this.decalTexture.render();
            if(this._options.uvEdgeBlending) {
                await this._createMaskTexture();
                this._createFinalTexture();
            } else {
                this.texture = this.decalTexture;
            }
        }
    }

    private _createMaskTexture(): void {
        if (this._maskTexture) {
            Promise.resolve();
            return;
        }  
        try {
            this._scene.clearColor = new Color4(0,0,0,1);
            // Create a new render target texture for the mask
            this._maskTexture = new RenderTargetTexture(
                "maskTexture",
                { width: this._options.width, height: this._options.height },
                this._scene,
                false, // No mipmaps for the mask texture
                true,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false, undefined, undefined, undefined, undefined, Constants.TEXTUREFORMAT_R
            );
    
            // Set up the mask material
            const maskMaterial = new ShaderMaterial(
                "meshUVSpaceRendererMaskerShader",
                this._scene,
                {
                    vertex: "meshUVSpaceRendererMasker",
                    fragment: "meshUVSpaceRendererMasker",
                },
                {
                    attributes: ["position", "uv"],
                    uniforms: ["worldViewProjection"]
                }
            );

            let texture = null;
            if (this._mesh.material instanceof PBRMaterial) {
                texture = (this._mesh.material as PBRMaterial).albedoTexture;
            } else if (this._mesh.material instanceof StandardMaterial) {
                texture = (this._mesh.material as StandardMaterial).diffuseTexture;
            }
        
            if (texture) {
                maskMaterial.setTexture("textureSampler", texture);
            } else {
                console.error("Material does not have a valid texture property.");
            }

            maskMaterial.backFaceCulling = false;

            this._mesh.material = this._mesh.material as PBRMaterial;
            maskMaterial.backFaceCulling = false;
    
            // Render the mesh with the mask material to the mask texture
            this._maskTexture.renderList.push(this._mesh);
            this._maskTexture.setMaterialForRendering(this._mesh, maskMaterial);

            // Ensure the mask texture is updated
            this._maskTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            this._scene.customRenderTargets.push(this._maskTexture);
            Promise.resolve();
        } catch (error) {
            console.error("Error creating mask texture:", error);
        }
    }

    private _createFinalTexture(): void {
        if (!this.texture) {
            this.texture = new RenderTargetTexture(
                "finalTexture",
                { width: this._options.width, height: this._options.height },
                this._scene,
                false,
                true,
                this._options.textureType
            );
        }
    
        try {
            this._scene.clearColor = new Color4(0, 0, 0, 1);
    
            // Set up the shader material
            this.finalMaterial = new ShaderMaterial(
                "meshUVSpaceRendererFinaliserShader",
                this._scene,
                {
                    vertex: "meshUVSpaceRendererFinaliser",
                    fragment: "meshUVSpaceRendererFinaliser",
                },
                {
                    attributes: ["position", "uv"],
                    uniforms: ["worldViewProjection", "textureSize"],
                    samplers: ["textureSampler", "maskTextureSampler"]
                }
            );
    
            this.finalMaterial.setTexture("textureSampler", this.decalTexture);
            this.finalMaterial.setTexture("maskTextureSampler", this._maskTexture);
            this.finalMaterial.setVector2("textureSize", new Vector2(this._options.width, this._options.height));
            this.finalMaterial.backFaceCulling = false;
    
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
    
                this._finalPostProcess.onApply = (effect: { setTexture: (arg0: string, arg1: Texture) => void; setVector2: (arg0: string, arg1: Vector2) => void; }) => {
                    effect.setTexture("textureSampler", this.decalTexture);
                    effect.setTexture("maskTextureSampler", this._maskTexture);
                    effect.setVector2("textureSize", new Vector2(this._options.width, this._options.height));
                };
            }
    
            if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
                this.texture.addPostProcess(this._finalPostProcess);
                this.texture.render();
            }
        } catch (error) {
            console.error("Error creating final texture:", error);
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
    }

    /**
     * Disposes of the ressources
     */
    public dispose() {
        if (this._textureCreatedInternally) {
            this.texture.dispose();
            this._textureCreatedInternally = false;
        }
    } 

    private _createDiffuseRTT(): void {
        this._textureCreatedInternally = true;

        const texture = this._createRenderTargetTexture(this._options.width, this._options.height);

        texture.setMaterialForRendering(this._mesh, MeshUVSpaceRenderer._GetShader(this._scene));

        this.decalTexture = texture;

        // Additional check after assignment
        if (!this.decalTexture.isReady()) {
            console.error("decalTexture is not ready after creation in _createDiffuseRTT.");
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
