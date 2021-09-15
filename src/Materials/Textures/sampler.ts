import { Constants } from "../../Engines/constants";
import { Nullable } from "../../types";

/**
 * Class used to store a sampler data
 */
export class Sampler {
    /**
     * Gets the sampling mode of the texture
     */
    public samplingMode: number = -1;

    /**
    * | Value | Type               | Description |
    * | ----- | ------------------ | ----------- |
    * | 0     | CLAMP_ADDRESSMODE  |             |
    * | 1     | WRAP_ADDRESSMODE   |             |
    * | 2     | MIRROR_ADDRESSMODE |             |
    */
    public get wrapU() {
        return this._cachedWrapU;
    }

    public set wrapU(value: Nullable<number>) {
        this._cachedWrapU = value;
    }

    /**
    * | Value | Type               | Description |
    * | ----- | ------------------ | ----------- |
    * | 0     | CLAMP_ADDRESSMODE  |             |
    * | 1     | WRAP_ADDRESSMODE   |             |
    * | 2     | MIRROR_ADDRESSMODE |             |
    */
    public get wrapV() {
        return this._cachedWrapV;
    }

    public set wrapV(value: Nullable<number>) {
        this._cachedWrapV = value;
    }

    /**
    * | Value | Type               | Description |
    * | ----- | ------------------ | ----------- |
    * | 0     | CLAMP_ADDRESSMODE  |             |
    * | 1     | WRAP_ADDRESSMODE   |             |
    * | 2     | MIRROR_ADDRESSMODE |             |
    */
    public get wrapR() {
        return this._cachedWrapR;
    }

    public set wrapR(value: Nullable<number>) {
        this._cachedWrapR = value;
    }

    /**
     * With compliant hardware and browser (supporting anisotropic filtering)
     * this defines the level of anisotropic filtering in the texture.
     * The higher the better but the slower.
     */
    public get anisotropicFilteringLevel() {
        return this._cachedAnisotropicFilteringLevel;
    }

    public set anisotropicFilteringLevel(value: Nullable<number>) {
        this._cachedAnisotropicFilteringLevel = value;
    }

    /**
     * Gets or sets the comparison function (Constants.LESS, Constants.EQUAL, etc). Set 0 to not use a comparison function
     */
    public get comparisonFunction() {
        return this._comparisonFunction;
    }

    public set comparisonFunction(value: number) {
        this._comparisonFunction = value;
    }

    private _useMipMaps = true;
    /**
     * Indicates to use the mip maps (if available on the texture).
     * Thanks to this flag, you can instruct the sampler to not sample the mipmaps even if they exist (and if the sampling mode is set to a value that normally samples the mipmaps!)
     */
    public get useMipMaps() {
        return this._useMipMaps;
    }

    public set useMipMaps(value: boolean) {
        this._useMipMaps = value;
    }

    /** @hidden */
    public _cachedWrapU: Nullable<number> = null;

    /** @hidden */
    public _cachedWrapV: Nullable<number> = null;

    /** @hidden */
    public _cachedWrapR: Nullable<number> = null;

    /** @hidden */
    public _cachedAnisotropicFilteringLevel: Nullable<number> = null;

    /** @hidden */
    public _comparisonFunction: number = 0;

    /**
     * Creates a Sampler instance
     */
    constructor() {
    }

    /**
     * Sets all the parameters of the sampler
     * @param wrapU u address mode (default: TEXTURE_WRAP_ADDRESSMODE)
     * @param wrapV v address mode (default: TEXTURE_WRAP_ADDRESSMODE)
     * @param wrapR r address mode (default: TEXTURE_WRAP_ADDRESSMODE)
     * @param anisotropicFilteringLevel anisotropic level (default: 1)
     * @param samplingMode sampling mode (default: Constants.TEXTURE_BILINEAR_SAMPLINGMODE)
     * @param comparisonFunction comparison function (default: 0 - no comparison function)
     * @returns the current sampler instance
     */
    public setParameters(wrapU = Constants.TEXTURE_WRAP_ADDRESSMODE, wrapV = Constants.TEXTURE_WRAP_ADDRESSMODE, wrapR = Constants.TEXTURE_WRAP_ADDRESSMODE, anisotropicFilteringLevel = 1, samplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE, comparisonFunction = 0): Sampler {
        this._cachedWrapU = wrapU;
        this._cachedWrapV = wrapV;
        this._cachedWrapR = wrapR;
        this._cachedAnisotropicFilteringLevel = anisotropicFilteringLevel;
        this.samplingMode = samplingMode;
        this._comparisonFunction = comparisonFunction;

        return this;
    }

    /**
     * Compares this sampler with another one
     * @param other sampler to compare with
     * @returns true if the samplers have the same parametres, else false
     */
    public compareSampler(other: Sampler): boolean {
        return this._cachedWrapU === other._cachedWrapU &&
            this._cachedWrapV === other._cachedWrapV &&
            this._cachedWrapR === other._cachedWrapR &&
            this._cachedAnisotropicFilteringLevel === other._cachedAnisotropicFilteringLevel &&
            this.samplingMode === other.samplingMode &&
            this._comparisonFunction === other._comparisonFunction;
    }

}
