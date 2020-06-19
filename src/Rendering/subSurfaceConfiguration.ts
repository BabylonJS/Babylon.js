import { Logger } from "../Misc/logger";
import { Color3 } from "../Maths/math.color";
import { Scene } from "../scene";

/**
 * Contains all parameters needed for the prepass to perform
 * screen space subsurface scattering
 */
export class SubSurfaceConfiguration {
    private _scene: Scene;

    private _ssDiffusionS: number[] = [];
    private _ssFilterRadii: number[] = [];
    private _ssDiffusionD: number[] = [];

    /**
     * Diffusion profile color for subsurface scattering
     */
    public get ssDiffusionS() {
        return this._ssDiffusionS;
    }

    /**
     * Diffusion profile max color channel value for subsurface scattering
     */
    public get ssDiffusionD() {
        return this._ssDiffusionD;
    }

    /**
     * Diffusion profile filter radius for subsurface scattering
     */
    public get ssFilterRadii() {
        return this._ssFilterRadii;
    }

    /**
     * Builds a subsurface configuration object
     * @param scene The scene
     */
    constructor(scene: Scene) {
        // Adding default diffusion profile
        this._scene = scene;
        this.addDiffusionProfile(new Color3(1, 1, 1));
    }

    /**
     * Adds a new diffusion profile.
     * Useful for more realistic subsurface scattering on diverse materials.
     * @param color The color of the diffusion profile. Should be the average color of the material.
     * @return The index of the diffusion profile for the material subsurface configuration
     */
    public addDiffusionProfile(color: Color3) : number {
        if (this.ssDiffusionD.length >= 5) {
            // We only suppport 5 diffusion profiles
            Logger.Error("You already reached the maximum number of diffusion profiles.");
            return 0; // default profile
        }

        // Do not add doubles
        for (let i = 0; i < this._ssDiffusionS.length / 3; i++) {
            if (this._ssDiffusionS[i * 3] === color.r &&
                this._ssDiffusionS[i * 3 + 1] === color.g &&
                this._ssDiffusionS[i * 3 + 2] === color.b) {
                return i;
            }
        }

        this._ssDiffusionS.push(color.r, color.b, color.g);
        this._ssDiffusionD.push(Math.max(Math.max(color.r, color.b), color.g));
        this._ssFilterRadii.push(this.getDiffusionProfileParameters(color));
        this._scene.ssDiffusionProfileColors.push(color);

        return this._ssDiffusionD.length - 1;
    }

    /**
     * Deletes all diffusion profiles.
     * Note that in order to render subsurface scattering, you should have at least 1 diffusion profile.
     */
    public clearAllDiffusionProfiles() {
        this._ssDiffusionD = [];
        this._ssDiffusionS = [];
        this._ssFilterRadii = [];
        this._scene.ssDiffusionProfileColors = [];
    }

    /**
     * Disposes this object
     */
    public dispose() {
        this.clearAllDiffusionProfiles();
    }

    /**
     * @hidden
     * https://zero-radiance.github.io/post/sampling-diffusion/
     *
     * Importance sample the normalized diffuse reflectance profile for the computed value of 's'.
     * ------------------------------------------------------------------------------------
     * R[r, phi, s]   = s * (Exp[-r * s] + Exp[-r * s / 3]) / (8 * Pi * r)
     * PDF[r, phi, s] = r * R[r, phi, s]
     * CDF[r, s]      = 1 - 1/4 * Exp[-r * s] - 3/4 * Exp[-r * s / 3]
     * ------------------------------------------------------------------------------------
     * We importance sample the color channel with the widest scattering distance.
     */
    public getDiffusionProfileParameters(color: Color3)
    {
        const cdf = 0.997;
        const maxScatteringDistance = Math.max(color.r, color.g, color.b);

        return this._sampleBurleyDiffusionProfile(cdf, maxScatteringDistance);
    }

    /**
     * Performs sampling of a Normalized Burley diffusion profile in polar coordinates.
     * 'u' is the random number (the value of the CDF): [0, 1).
     * rcp(s) = 1 / ShapeParam = ScatteringDistance.
     * Returns the sampled radial distance, s.t. (u = 0 -> r = 0) and (u = 1 -> r = Inf).
     */
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