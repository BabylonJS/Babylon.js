import type { Texture } from "core/Materials/Textures/texture";
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
import { Color3, Color4 } from "core/Maths/math.color";

import "../Shaders/meshUVSpaceRenderer.vertex";
import "../Shaders/meshUVSpaceRenderer.fragment";

import "../Shaders/meshUVSpaceRendererMasker.vertex";
import "../Shaders/meshUVSpaceRendererMasker.fragment";

import "../Shaders/meshUVSpaceRendererSeam.fragment";

import "../Shaders/meshUVSpaceRendererCombine.vertex";
import "../Shaders/meshUVSpaceRendererCombine.fragment";

import { MeshBuilder } from "./meshBuilder";
import { PBRMaterial } from "..";


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
     *
     */
    _maskTexture: any;
    private _seamTexture: any;

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
                    uniforms: ["world", "projMatrix", "texelSize"],
                    samplers: ["textureSampler", "maskTexture"],
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
            ...options,
        };
    }

    /**
     * Checks if the texture is ready to be used
     * @returns true if the texture is ready to be used
     */
    public isReady(): boolean {
        if (!this.texture) {
            this._createDiffuseRTT();
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
    public renderTextureOLD(texture: BaseTexture, position: Vector3, normal: Vector3, size: Vector3, angle = 0): void {
        if (!this.texture) {
            this._createDiffuseRTT();
        }

        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
            const matrix = this._createProjectionMatrix(position, normal, size, angle);
            const shader = MeshUVSpaceRenderer._GetShader(this._scene);

            shader.setTexture("textureSampler", texture);
            shader.setMatrix("projMatrix", matrix);

            this.texture.render();
        }
    }

    // Method to use the mask texture to fix UV seams
    public async renderTexture(texture: BaseTexture, position: Vector3, normal: Vector3, size: Vector3, angle = 0): void {
        // Ensure the mask texture is ready for seam fixing
        //todo flag
        await this._createMaskTexture();

        this._createSeamTexture();

        // Create the diffuse render target texture if it doesn't exist
        if (!this.texture) {
            this._createDiffuseRTT();
        }

        const plane = MeshBuilder.CreatePlane("image", {size: 1},  this._scene);
        const pbr = new PBRMaterial("P", this._scene);
        pbr.roughness = 1;
        pbr.emissiveTexture = this._maskTexture;
        pbr.emissiveIntensity = 1;
        pbr.emissiveColor = new Color3(1, 1, 1);
        pbr.albedoTexture = this._maskTexture;
        plane.material = pbr;
        pbr.disableLighting = true;

        const plane2 = MeshBuilder.CreatePlane("image", {size: 1},  this._scene);
        const pbr2 = new PBRMaterial("P2", this._scene);
        pbr2.roughness = 1;
        pbr2.emissiveTexture = this._seamTexture;
        pbr2.emissiveIntensity = 1;
        pbr2.emissiveColor = new Color3(1, 1, 1);
        pbr2.albedoTexture = this._seamTexture;
        plane2.material = pbr2;
        pbr2.disableLighting = true;
        plane2.position.y -= 1;

        // Prepare the shader with the decal texture, mask texture, and necessary uniforms
        const shader = MeshUVSpaceRenderer._GetShader(this._scene);
        shader.setTexture("textureSampler", texture); // Decal texture
        shader.setTexture("maskTexture", this._maskTexture); // Mask texture for seam fixing
        shader.setTexture("seamTexture", this._seamTexture); // Mask texture for seam fixing
        //todo use this
        shader.setVector2("texelSize", new Vector2(1.0 / this._options.width, 1.0 / this._options.height));

        // Calculate and set the projection matrix
        const projectionMatrix = this._createProjectionMatrix(position, normal, size, angle);
        shader.setMatrix("projMatrix", projectionMatrix);
        // this.texture = this._maskTexture;
        // Render the decal with the updated material that includes seam fix logic
        if (MeshUVSpaceRenderer._IsRenderTargetTexture(this.texture)) {
            this.texture.render();
        }
    }

    private combineTextures(t1: RenderTargetTexture, t2: RenderTargetTexture): void { 
        const shaderMaterial = new ShaderMaterial("shaderMaterial", this._scene, {
            vertex: "custom",   // Replace with your vertex shader path or string
            fragment: "custom", // Replace with your fragment shader path or string
        }, {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection", "texture1", "texture2", "blendFactor"]
        });
        
        // Assign textures
        shaderMaterial.setTexture("texture1", t1);
        shaderMaterial.setTexture("texture2", t2);
        
        // Set blend factor (0.0 to 1.0)
        shaderMaterial.setFloat("blendFactor", 0.5);
        
        // Create a plane and apply the material
        const plane = MeshBuilder.CreatePlane("plane", {size: 1}, this._scene);
        plane.material = shaderMaterial;
    }

    private _createMaskTexture(): void {
        if (this._maskTexture) {
            return; // Mask texture already created
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
                Constants.TEXTURETYPE_FLOAT
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

    private _createSeamTexture(): void {
        if (this._seamTexture) {
            return; // Seam texture already created
        }
        try {
            this._scene.clearColor = new Color4(0,0,0,1);
            // Create a new render target texture for the mask
            this._seamTexture = new RenderTargetTexture(
                "seamTexture",
                { width: this._options.width, height: this._options.height },
                this._scene,
                false, // No mipmaps for the mask texture
                true,
                this._options.textureType
            );
    
            // Set up the mask material
            const maskMaterial = new ShaderMaterial(
                "meshUVSpaceRendererSeamShader",
                this._scene,
                {
                    vertex: "meshUVSpaceRendererMasker",
                    fragment: "meshUVSpaceRendererSeam",
                },
                {
                    attributes: ["position", "uv"],
                    uniforms: ["worldViewProjection"],
                    samplers: ["maskTexture"]
                }
            );
            maskMaterial.setTexture("maskTexture", this._maskTexture);

            maskMaterial.backFaceCulling = false;
            // Render the mesh with the mask material to the mask texture
            this._seamTexture.renderList.push(this._mesh);
            this._seamTexture.setMaterialForRendering(this._mesh, maskMaterial);
            // Ensure the mask texture is updated
            this._seamTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
            this._scene.customRenderTargets.push(this._seamTexture);
        } catch (error) {
            console.error("Error creating mask texture:", error);
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

        this.texture = texture;
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
