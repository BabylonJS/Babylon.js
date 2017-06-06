module BABYLON {
    /**
     * PBRMaterialTransparencyMode: No transparency mode, Alpha channel is not use.
     */
    export const PBRMATERIAL_OPAQUE = 0;

    /**
     * PBRMaterialTransparencyMode: Alpha Test mode, pixel are discarded below a certain threshold defined by the alpha cutoff value.
     */
    export const PBRMATERIAL_ALPHATEST = 1;

    /**
     * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     */
    export const PBRMATERIAL_ALPHABLEND = 2;

    /**
     * PBRMaterialTransparencyMode: Pixels are blended (according to the alpha mode) with the already drawn pixels in the current frame buffer.
     * They are also discarded below the alpha cutoff threshold to improve performances.
     */
    export const PBRMATERIAL_ALPHATESTANDBLEND = 3;

    /**
     * Limits the values allowed in the transparency ones to the known ones.
     */
    export type PBRMaterialTransparencyMode = 0 | 1 | 2 | 3;
}

module BABYLON.Internals {
    /**
     * The Physically based simple base material of BJS.
     * 
     * This enables better naming and convention enforcements on top of the pbrMaterial.
     * It is used as the base class for both the specGloss and metalRough conventions.
     */
    export abstract class PBRBaseSimpleMaterial extends PBRBaseMaterial {

        /**
         * Number of Simultaneous lights allowed on the material.
         */
        @serialize()
        @expandToProperty(null)
        public maxSimultaneousLights = 4;

        /**
         * If sets to true, disables all the lights affecting the material.
         */
        @serialize()
        @expandToProperty(null)
        public disableLighting = false;

        /**
         * Environment Texture used in the material (this is use for both reflection and environment lighting).
         */
        @serializeAsTexture()
        @expandToProperty(null, "_reflectionTexture")
        public environmentTexture: BaseTexture;

        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        @serialize()
        @expandToProperty(null)
        public invertNormalMapX = false;

        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        @serialize()
        @expandToProperty(null)
        public invertNormalMapY = false;

        /**
         * Normal map used in the model.
         */
        @serializeAsTexture()
        @expandToProperty(null, "_bumpTexture")
        public normalTexture: BaseTexture;

        /**
         * Emissivie color used to self-illuminate the model.
         */
        @serializeAsColor3("emissive")
        @expandToProperty(null)
        public emissiveColor = new Color3(0, 0, 0);

        /**
         * Emissivie texture used to self-illuminate the model.
         */
        @serializeAsTexture()
        @expandToProperty(null)
        public emissiveTexture: BaseTexture;

        /**
         * Occlusion Channel Strenght.
         */
        @serialize()
        @expandToProperty(null, "_ambientTextureStrength")
        public occlusionStrength: number = 1.0;

        /**
         * Occlusion Texture of the material (adding extra occlusion effects).
         */
        @serializeAsTexture()
        @expandToProperty(null, "_ambientTexture")
        public occlusionTexture: BaseTexture;

        /**
         * Defines the alpha limits in alpha test mode.
         */
        @serialize()
        @expandToProperty(null, "_alphaCutOff")
        public alphaCutOff: number;

        protected _transparencyMode: PBRMaterialTransparencyMode = PBRMATERIAL_OPAQUE;
        /**
         * Gets the current transparency mode.
         */
        @serialize()
        public get transparencyMode(): PBRMaterialTransparencyMode {
            return this._transparencyMode;
        }
        /**
         * Sets the transparency mode of the material.
         */
        public set transparencyMode(value: PBRMaterialTransparencyMode) {
            this._transparencyMode = value;
            if (value === PBRMATERIAL_ALPHATESTANDBLEND) {
                this._forceAlphaTest = true;
            }
            else {
                this._forceAlphaTest = false;
            }
        }

        /**
         * Gets the current double sided mode.
         */
        @serialize()
        public get doubleSided(): boolean {
            return this._twoSidedLighting;
        }
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        public set doubleSided(value: boolean) {
            this._twoSidedLighting = value;
            this.backFaceCulling = !value;
        }

        /**
         * Specifies wether or not the alpha value of the albedo texture should be used.
         */
        protected _shouldUseAlphaFromAlbedoTexture(): boolean {
            return this._albedoTexture && this._albedoTexture.hasAlpha && this._transparencyMode !== PBRMATERIAL_OPAQUE;
        }

        /**
         * Specifies wether or not the meshes using this material should be rendered in alpha blend mode.
         */
        public needAlphaBlending(): boolean {
            if (this._linkRefractionWithTransparency) {
                return false;
            }

            return (this.alpha < 1.0) || 
                    (this._shouldUseAlphaFromAlbedoTexture() &&
                        (this._transparencyMode === PBRMATERIAL_ALPHABLEND ||
                            this._transparencyMode === PBRMATERIAL_ALPHATESTANDBLEND));
        }

        /**
         * Specifies wether or not the meshes using this material should be rendered in alpha test mode.
         */
        public needAlphaTesting(): boolean {
            if (this._linkRefractionWithTransparency) {
                return false;
            }

            return this._shouldUseAlphaFromAlbedoTexture() &&
                 this._transparencyMode === PBRMATERIAL_ALPHATEST;
        }

        /**
         * Instantiates a new PBRMaterial instance.
         * 
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);

            this._useEmissiveAsIllumination = true;
            this._useAmbientInGrayScale = true;
            this._useScalarInLinearSpace = true;
        }
    }
}