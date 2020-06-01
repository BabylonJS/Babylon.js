import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { Scene } from "../scene";
import { Color3 } from "../Maths/math.color";
import { Constants } from "../Engines/constants";

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

    private _diffusionColor: Color3 = new Color3(0.7568628, 0.32156864, 0.20000002);
    private _filterRadius: number;

    constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "subSurfaceScattering", ["texelSize", "filterRadius", "viewportSize"], ["inputSampler", "irradianceSampler", "depthSampler", "albedoSampler"], options, camera, samplingMode || Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "postprocess", undefined, true);

        const defines = this._getDefines();
        this.updateEffect(defines);

        this.onApplyObservable.add((effect: Effect) => {
            var texelSize = this.texelSize;
            effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            effect.setTexture("inputSampler", scene.highDefinitionMRT.textures[4]);
            effect.setTexture("irradianceSampler", scene.highDefinitionMRT.textures[1]);
            effect.setTexture("depthSampler", scene.highDefinitionMRT.textures[2]);
            effect.setTexture("albedoSampler", scene.highDefinitionMRT.textures[3]);
            effect.setFloat("filterRadius", this._filterRadius);
            effect.setFloat2("viewportSize",
                Math.tan(scene.activeCamera!.fov / 2) * scene.getEngine().getAspectRatio(scene.activeCamera!, true),
                Math.tan(scene.activeCamera!.fov / 2));
        });

        this._filterRadius = this._getDiffusionProfileParameters();
    }

    private _getDefines(): Nullable<string> {
        const engine = this.getEngine();
        if (!engine) {
            return null;
        }

        return "";
    }

    private _getDiffusionProfileParameters()
    {
        const cdf = 0.997;
        // Importance sample the normalized diffuse reflectance profile for the computed value of 's'.
        // ------------------------------------------------------------------------------------
        // R[r, phi, s]   = s * (Exp[-r * s] + Exp[-r * s / 3]) / (8 * Pi * r)
        // PDF[r, phi, s] = r * R[r, phi, s]
        // CDF[r, s]      = 1 - 1/4 * Exp[-r * s] - 3/4 * Exp[-r * s / 3]
        // ------------------------------------------------------------------------------------
        // We importance sample the color channel with the widest scattering distance.
        const maxScatteringDistance = Math.max(this._diffusionColor.r, this._diffusionColor.g, this._diffusionColor.b);

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
