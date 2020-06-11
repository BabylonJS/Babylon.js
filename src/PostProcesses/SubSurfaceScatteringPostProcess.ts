import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { Scene } from "../scene";
import { Color3 } from "../Maths/math.color";
import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";

import "../Shaders/sceneCompositor.fragment";
import "../Shaders/postprocess.vertex";

/**
 * Scene compositor post process
 */
export class SubSurfaceScatteringPostProcess extends PostProcess {
    /** @hidden */
    public texelWidth: number;
    /** @hidden */
    public texelHeight: number;

    private _diffusionS: number[] = [];
    private _filterRadii: number[] = [];
    private _diffusionD: number[] = [];

    constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "subSurfaceScattering", ["texelSize", "viewportSize", "metersPerUnit"], ["diffusionS", "diffusionD", "filterRadii", "irradianceSampler", "depthSampler", "albedoSampler"], options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "postprocess", undefined, true);
        this._scene = scene;

        const defines = this._getDefines();
        this.updateEffect(defines);

        // Adding default diffusion profile
        this.addDiffusionProfile(new Color3(1, 1, 1));

        this.onApplyObservable.add((effect: Effect) => {
            if (!scene.prePassRenderer) {
                Logger.Error("PrePass needs to be enabled for subsurface scattering.");
                return;
            }
            var texelSize = this.texelSize;
            effect.setFloat("metersPerUnit", scene.metersPerUnit);
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            effect.setTexture("irradianceSampler", scene.prePassRenderer.prePassRT.textures[1]);
            effect.setTexture("depthSampler", scene.prePassRenderer.prePassRT.textures[2]);
            effect.setTexture("albedoSampler", scene.prePassRenderer.prePassRT.textures[3]);
            effect.setFloat2("viewportSize",
                Math.tan(scene.activeCamera!.fov / 2) * scene.getEngine().getAspectRatio(scene.activeCamera!, true),
                Math.tan(scene.activeCamera!.fov / 2));
            effect.setArray3("diffusionS", this._diffusionS);
            effect.setArray("diffusionD", this._diffusionD);
            effect.setArray("filterRadii", this._filterRadii);
        });

    }

    private _getDefines(): Nullable<string> {
        const engine = this.getEngine();
        if (!engine) {
            return null;
        }

        let defines = "";

        if (this._scene.imageProcessingConfiguration.applyByPostProcess) {
            // We must output linear color for post process
            defines = defines + "#define LINEAR_OUTPUT\n";
        }

        return defines;
    }

    public addDiffusionProfile(color: Color3) : number {
        if (this._diffusionD.length >= 5) {
            // We only suppport 5 diffusion profiles
            Logger.Error("You already reached the maximum number of diffusion profiles.");
            return -1;
        }

        // Do not add doubles
        for (let i = 0; i < this._diffusionS.length / 3; i++) {
            if (this._diffusionS[i * 3] === color.r && 
                this._diffusionS[i * 3 + 1] === color.g && 
                this._diffusionS[i * 3 + 2] === color.b) {
                return i;
            }
        }

        this._diffusionS.push(color.r, color.b, color.g);
        this._diffusionD.push(Math.max(Math.max(color.r, color.b), color.g));
        this._filterRadii.push(this.getDiffusionProfileParameters(color));

        return this._diffusionD.length - 1;
    }

    public getDiffusionProfileParameters(color: Color3)
    {
        const cdf = 0.997;
        // Importance sample the normalized diffuse reflectance profile for the computed value of 's'.
        // ------------------------------------------------------------------------------------
        // R[r, phi, s]   = s * (Exp[-r * s] + Exp[-r * s / 3]) / (8 * Pi * r)
        // PDF[r, phi, s] = r * R[r, phi, s]
        // CDF[r, s]      = 1 - 1/4 * Exp[-r * s] - 3/4 * Exp[-r * s / 3]
        // ------------------------------------------------------------------------------------
        // We importance sample the color channel with the widest scattering distance.
        const maxScatteringDistance = Math.max(color.r, color.g, color.b);

        return this._sampleBurleyDiffusionProfile(cdf, maxScatteringDistance);
    }
    // https://zero-radiance.github.io/post/sampling-diffusion/
    // Performs sampling of a Normalized Burley diffusion profile in polar coordinates.
    // 'u' is the random number (the value of the CDF): [0, 1).
    // rcp(s) = 1 / ShapeParam = ScatteringDistance.
    // Returns the sampled radial distance, s.t. (u = 0 -> r = 0) and (u = 1 -> r = Inf).
    private _sampleBurleyDiffusionProfile(u: number, rcpS: number)
    {
        u = 1 - u; // Convert CDF to CCDF

        let g = 1 + (4 * u) * (2 * u + Math.sqrt(1 + (4 * u) * u));
        let n = Math.pow(g, -1.0 / 3.0);                      // g^(-1/3)
        let p = (g * n) * n;                                   // g^(+1/3)
        let c = 1 + p + n;                                     // 1 + g^(+1/3) + g^(-1/3)
        let x = 3 * Math.log(c / (4 * u));

        return x * rcpS;
    }
}
