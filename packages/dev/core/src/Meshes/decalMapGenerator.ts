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

import "../Shaders/decalMapGenerator.vertex";
import "../Shaders/decalMapGenerator.fragment";

/**
 * Options for the DecalMapGenerator
 * @since
 */
export interface IDecalMapGeneratorOptions {
    /**
     * Width of the decal map. Default: 1024
     */
    width?: number;
    /**
     * Height of the decal map. Default: 1024
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
     * If you plan to rotate / offset the decal map, you should set this to false
     */
    optimizeUVAllocation?: boolean;
}

/**
 * Class used to generate a decal map
 * @since
 */
export class DecalMapGenerator {
    private static _Shader: Nullable<ShaderMaterial> = null;

    private _mesh: AbstractMesh;
    private _scene: Scene;
    private _options: Required<IDecalMapGeneratorOptions>;
    private _textureCreatedInternally = false;

    private static _GetShader(scene: Scene): ShaderMaterial {
        if (!DecalMapGenerator._Shader) {
            const shader = new ShaderMaterial(
                "decalMapGeneratorShader",
                scene,
                {
                    vertex: "decalMapGenerator",
                    fragment: "decalMapGenerator",
                },
                {
                    attributes: ["position", "normal", "uv"],
                    uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
                    needAlphaBlending: true,
                }
            );
            shader.backFaceCulling = false;
            shader.alphaMode = Constants.ALPHA_COMBINE;

            DecalMapGenerator._Shader = shader;
        }

        return DecalMapGenerator._Shader;
    }

    private static _IsRenderTargetTexture(texture: ThinTexture | RenderTargetTexture): texture is RenderTargetTexture {
        return (texture as RenderTargetTexture).renderList !== undefined;
    }

    /**
     * Disposes of the global resources created by the DecalMapGenerator class
     */
    public static Dispose(): void {
        if (DecalMapGenerator._Shader) {
            DecalMapGenerator._Shader.dispose();
            DecalMapGenerator._Shader = null;
        }
    }

    /**
     * Clear color of the decal map
     */
    public clearColor = new Color4(0, 0, 0, 0);

    /**
     * Texture used to store the decal map
     * If you don't set the property, a RenderTargetTexture will be created internally given the options provided to the constructor.
     * If you provide a RenderTargetTexture, it will be used directly.
     * You can also provide a regular texture, in which case it will simply be used as an additional layer to the diffuse/albedo texture of the material
     * and addDecal will do nothing.
     */
    public texture: Texture;

    /**
     * Creates a new DecalMapGenerator
     * @param mesh The mesh to generate the decal map for
     * @param scene The scene the mesh belongs to
     * @param options The options to use when creating the decal map
     */
    constructor(mesh: AbstractMesh, scene: Scene, options?: IDecalMapGeneratorOptions) {
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
     * Adds a decal to the decal map
     * @param texture The texture decal
     * @param position The position of the decal (world space coordinates)
     * @param normal The direction of the decal projection (world space coordinates)
     * @param size The size of the decal
     * @param angle The angle of the decal around the direction of the projection
     */
    public addDecal(texture: BaseTexture, position: Vector3, normal: Vector3, size: Vector3, angle = 0): void {
        if (!this.texture) {
            this._createDiffuseRTT();
        }

        if (DecalMapGenerator._IsRenderTargetTexture(this.texture)) {
            const decalMatrix = this._createDecalMatrix(position, normal, size, angle);
            const shader = DecalMapGenerator._GetShader(this._scene);

            shader.setTexture("textureSampler", texture);
            shader.setMatrix("decalMatrix", decalMatrix);

            this.texture.render();
        }
    }

    /**
     * Clears the decal map
     */
    public clear(): void {
        if (DecalMapGenerator._IsRenderTargetTexture(this.texture) && this.texture.renderTarget) {
            const engine = this._scene.getEngine();

            engine.bindFramebuffer(this.texture.renderTarget);
            engine.clear(this.clearColor, true, true, true);
            engine.unBindFramebuffer(this.texture.renderTarget);
        }
    }

    /**
     * Disposes of the decal map generator
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

        texture.setMaterialForRendering(this._mesh, DecalMapGenerator._GetShader(this._scene));

        this.texture = texture;
    }

    private _createRenderTargetTexture(width: number, height: number): RenderTargetTexture {
        const rtt = new RenderTargetTexture(
            this._mesh.name + "_decalTexture",
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

        rtt.optimizeUVAllocation = !!this._options.optimizeUVAllocation;

        rtt.onClearObservable.addOnce(() => {
            this._scene.getEngine().clear(this.clearColor, true, true, true);
            rtt.onClearObservable.add(() => {}); // this disables clearing the texture for the next frames
        });

        rtt.renderList = [this._mesh];

        return rtt;
    }

    private _createDecalMatrix(position: Vector3, normal: Vector3, size: Vector3, angle = 0): Matrix {
        const yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
        const len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
        const pitch = Math.atan2(normal.y, len);

        const p = position.add(normal.scale(size.z * 0.5));

        const decalWorldMatrix = Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(Matrix.Translation(p.x, p.y, p.z));
        const inverseDecalWorldMatrix = Matrix.Invert(decalWorldMatrix);

        const projMatrix = Matrix.FromArray([2 / size.x, 0, 0, 0, 0, 2 / size.y, 0, 0, 0, 0, 1 / size.z, 0, 0, 0, 0, 1]);

        const screenMatrix = Matrix.FromArray([0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 1, 0, 0.5, 0.5, 0.0, 1]);

        return inverseDecalWorldMatrix.multiply(projMatrix).multiply(screenMatrix);
    }
}
