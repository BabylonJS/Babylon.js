import { RawTexture3D } from "core/Materials/Textures/rawTexture3D";
import type { Material } from "core/Materials/material";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import type { Lattice } from "./lattice";
import type { Nullable } from "core/types";
import { Constants } from "core/Engines/constants";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { UniformBuffer } from "core/Materials/uniformBuffer";

/**
 * Material plugin to add hardware accelerated lattice support
 * #HBZD72#5 - webgl2
 * #HBZD72#6 - webgpu
 */
export class LatticePluginMaterial extends MaterialPluginBase {
    private _lattice: Lattice;
    private _latticeDataTexture: Nullable<RawTexture3D>;
    private _latticeData: Float32Array;
    private _code: string;

    /**
     * Create a new LatticePluginMaterial
     * @param lattice defines the lattice this plugin is associated with
     * @param material defines the material this plugin is associated with
     */
    constructor(lattice: Lattice, material: Material) {
        super(material, "Lattice", 200);

        this._lattice = lattice;

        this.refreshData();

        // let's enable it by default
        this._enable(true);
    }

    /**
     * Get the class name of the plugin
     * @returns the string "LatticePluginMaterial"
     */
    public override getClassName() {
        return "LatticePluginMaterial";
    }

    /**
     * Defines if the plugin supports the specified shader language
     * @param shaderLanguage defines the shader language to check
     * @returns true if supported, false otherwise
     */
    public override isCompatible(shaderLanguage: ShaderLanguage) {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
            case ShaderLanguage.WGSL:
                return true;
            default:
                return false;
        }
    }

    /**
     * Must be called when the lattice data was updated
     */
    public refreshData() {
        const length = this._lattice.resolutionX * this._lattice.resolutionY * this._lattice.resolutionZ * 4;
        if (!this._latticeData || this._latticeData.length !== length) {
            this._latticeData = new Float32Array(length);
        }

        for (let i = 0; i < this._lattice.resolutionX; i++) {
            for (let j = 0; j < this._lattice.resolutionY; j++) {
                for (let k = 0; k < this._lattice.resolutionZ; k++) {
                    const control = this._lattice.data[i][j][k];
                    const index = i + this._lattice.resolutionX * (j + this._lattice.resolutionY * k);
                    control.toArray(this._latticeData, index * 4);
                }
            }
        }

        if (
            !this._latticeDataTexture ||
            this._latticeDataTexture.width !== this._lattice.resolutionX ||
            this._latticeDataTexture.height !== this._lattice.resolutionY ||
            this._latticeDataTexture.depth !== this._lattice.resolutionZ
        ) {
            if (this._latticeDataTexture) {
                this._latticeDataTexture.dispose();
            }

            this._latticeDataTexture = new RawTexture3D(
                this._latticeData,
                this._lattice.resolutionX,
                this._lattice.resolutionY,
                this._lattice.resolutionZ,
                Constants.TEXTUREFORMAT_RGBA,
                this._material.getScene(),
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
        } else {
            this._latticeDataTexture.update(this._latticeData);
        }
    }

    /**
     * Gets the description of the uniforms to add to the ubo (if engine supports ubos) or to inject directly in the vertex/fragment shaders (if engine does not support ubos)
     * @param shaderLanguage The shader language to use.
     * @returns the description of the uniforms
     */
    public override getUniforms(shaderLanguage: ShaderLanguage = ShaderLanguage.GLSL) {
        if (shaderLanguage === ShaderLanguage.WGSL) {
            // For webgpu we only define the UBO with the correct type and size.
            return {
                ubo: [
                    { name: "lattice_cellSize", size: 3, type: "vec3" },
                    { name: "lattice_min", size: 3, type: "vec3" },
                    { name: "lattice_max", size: 3, type: "vec3" },
                    { name: "lattice_resolution", size: 3, type: "vec3" },
                    { name: "lattice_position", size: 3, type: "vec3" },
                ],
            };
        }
        return {
            // first, define the UBO with the correct type and size.
            ubo: [
                { name: "lattice_cellSize", size: 3, type: "vec3" },
                { name: "lattice_min", size: 3, type: "vec3" },
                { name: "lattice_max", size: 3, type: "vec3" },
                { name: "lattice_resolution", size: 3, type: "vec3" },
                { name: "lattice_position", size: 3, type: "vec3" },
            ],
            // now, on the vertex shader, add the uniform itself in case uniform buffers are not supported by the engine
            vertex: `
                    uniform vec3 lattice_cellSize;
                    uniform vec3 lattice_min;
                    uniform vec3 lattice_max;
                    uniform vec3 lattice_resolution;
                    uniform vec3 lattice_position;
                    `,
        };
    }

    /**
     * Binds the material data.
     * @param uniformBuffer defines the Uniform buffer to fill in.
     */
    public override bindForSubMesh(uniformBuffer: UniformBuffer) {
        this._lattice.updateInternals();

        uniformBuffer.updateVector3("lattice_cellSize", this._lattice.cellSize);
        uniformBuffer.updateVector3("lattice_min", this._lattice.min);
        uniformBuffer.updateVector3("lattice_max", this._lattice.max);
        uniformBuffer.updateFloat3("lattice_resolution", this._lattice.resolutionX, this._lattice.resolutionY, this._lattice.resolutionZ);
        uniformBuffer.updateVector3("lattice_position", this._lattice.position);

        uniformBuffer.setTexture("latticeData", this._latticeDataTexture);
    }

    /**
     * Gets the samplers used by the plugin.
     * @param samplers list that the sampler names should be added to.
     */
    public override getSamplers(samplers: string[]): void {
        samplers.push("latticeData");
    }

    private _prepareCode(shaderLanguage = ShaderLanguage.GLSL) {
        if (this._code) {
            return this._code;
        }

        let code = `
            if (positionUpdated.x >= lattice_min.x && positionUpdated.x <= lattice_max.x &&
                positionUpdated.y >= lattice_min.y && positionUpdated.y <= lattice_max.y &&
                positionUpdated.z >= lattice_min.z && positionUpdated.z <= lattice_max.z) {

                // Map vertex position to lattice local coordinates
                vec3d localPos = vec3c((positionUpdated.x - lattice_min.x) / lattice_cellSize.x, (positionUpdated.y - lattice_min.y) / lattice_cellSize.y, (positionUpdated.z - lattice_min.z) / lattice_cellSize.z);

                // Get integer lattice indices
                intd i0 = intc(floor(localPos.x));
                intd j0 = intc(floor(localPos.y));
                intd k0 = intc(floor(localPos.z));

                intd resX = intc(lattice_resolution.x) - 1;
                intd resY = intc(lattice_resolution.y) - 1;
                intd resZ = intc(lattice_resolution.z) - 1;

                intd i1 = min(i0 + 1, resX);
                intd j1 = min(j0 + 1, resY);
                intd k1 = min(k0 + 1, resZ);

                // Compute interpolation weights
                floatd tx = localPos.x - floatc(i0);
                floatd ty = localPos.y - floatc(j0);
                floatd tz = localPos.z - floatc(k0);

                // Ensure indices are within bounds
                intd ii0 = clamp(i0, 0, resX);
                intd jj0 = clamp(j0, 0, resY);
                intd kk0 = clamp(k0, 0, resZ);
                intd ii1 = clamp(i1, 0, resX);
                intd jj1 = clamp(j1, 0, resY);
                intd kk1 = clamp(k1, 0, resZ);

                // Get lattice control points
                vec3d p000 = texelFetch(latticeData, ivec3c(ii0, jj0, kk0), 0).rgb;
                vec3d p100 = texelFetch(latticeData, ivec3c(ii1, jj0, kk0), 0).rgb;
                vec3d p010 = texelFetch(latticeData, ivec3c(ii0, jj1, kk0), 0).rgb;
                vec3d p110 = texelFetch(latticeData, ivec3c(ii1, jj1, kk0), 0).rgb;
                vec3d p001 = texelFetch(latticeData, ivec3c(ii0, jj0, kk1), 0).rgb;
                vec3d p101 = texelFetch(latticeData, ivec3c(ii1, jj0, kk1), 0).rgb;
                vec3d p011 = texelFetch(latticeData, ivec3c(ii0, jj1, kk1), 0).rgb;
                vec3d p111 = texelFetch(latticeData, ivec3c(ii1, jj1, kk1), 0).rgb;

                // Trilinear interpolation
                vec3d p00 = mix(p000, p100, tx);
                vec3d p01 = mix(p001, p101, tx);
                vec3d p10 = mix(p010, p110, tx);
                vec3d p11 = mix(p011, p111, tx);

                vec3d p0 = mix(p00, p10, ty);
                vec3d p1 = mix(p01, p11, ty);

                vec3d deformedPos = mix(p0, p1, tz);
                positionUpdated = deformedPos + lattice_position;
            };
        `;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            code =
                `
                let lattice_min = uniforms.lattice_min;
                let lattice_max = uniforms.lattice_max;
                let lattice_resolution = uniforms.lattice_resolution;
                let lattice_position = uniforms.lattice_position;
                let lattice_cellSize = uniforms.lattice_cellSize;
            ` + code;

            code = code.replace(/ivec3c/g, "vec3i");
            code = code.replace(/vec3d/g, "var");
            code = code.replace(/vec3c/g, "vec3f");
            code = code.replace(/intd/g, "var");
            code = code.replace(/intc/g, "i32");
            code = code.replace(/floatd/g, "var");
            code = code.replace(/floatc/g, "f32");
            code = code.replace(/texelFetch/g, "textureLoad");
        } else {
            code = code.replace(/ivec3c/g, "ivec3");
            code = code.replace(/vec3d/g, "vec3");
            code = code.replace(/vec3c/g, "vec3");
            code = code.replace(/intd/g, "int");
            code = code.replace(/intc/g, "int");
            code = code.replace(/floatd/g, "float");
            code = code.replace(/floatc/g, "float");
        }
        this._code = code;

        return this._code;
    }

    /**
     * Returns a list of custom shader code fragments to customize the shader.
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage The shader language to use.
     * @returns null if no code to be added, or a list of pointName =\> code.
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL) {
        if (shaderType === "vertex") {
            // we're adding this specific code at the end of the main() function
            if (shaderLanguage === ShaderLanguage.WGSL) {
                return {
                    CUSTOM_VERTEX_DEFINITIONS: `
                        var latticeData: texture_3d<f32>;
                    `,
                    CUSTOM_VERTEX_UPDATE_POSITION: this._prepareCode(shaderLanguage),
                };
            }

            return {
                CUSTOM_VERTEX_DEFINITIONS: `
                    precision highp sampler3D;
                    uniform sampler3D latticeData;
                `,
                CUSTOM_VERTEX_UPDATE_POSITION: this._prepareCode(shaderLanguage),
            };
        }
        // for other shader types we're not doing anything, return null
        return null;
    }

    /**
     * Disposes the resources of the material.
     */
    public override dispose(): void {
        if (this._latticeDataTexture) {
            this._latticeDataTexture.dispose();
            this._latticeDataTexture = null;
        }
    }
}
