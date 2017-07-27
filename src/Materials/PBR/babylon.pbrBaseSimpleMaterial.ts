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
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public maxSimultaneousLights = 4;

        /**
         * If sets to true, disables all the lights affecting the material.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public disableLighting = false;

        /**
         * Environment Texture used in the material (this is use for both reflection and environment lighting).
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_reflectionTexture")
        public environmentTexture: BaseTexture;

        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertNormalMapX = false;

        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertNormalMapY = false;

        /**
         * Normal map used in the model.
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_bumpTexture")
        public normalTexture: BaseTexture;

        /**
         * Emissivie color used to self-illuminate the model.
         */
        @serializeAsColor3("emissive")
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public emissiveColor = new Color3(0, 0, 0);

        /**
         * Emissivie texture used to self-illuminate the model.
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public emissiveTexture: BaseTexture;

        /**
         * Occlusion Channel Strenght.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_ambientTextureStrength")
        public occlusionStrength: number = 1.0;

        /**
         * Occlusion Texture of the material (adding extra occlusion effects).
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_ambientTexture")
        public occlusionTexture: BaseTexture;

        /**
         * Defines the alpha limits in alpha test mode.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_alphaCutOff")
        public alphaCutOff: number;

        protected _transparencyMode: number = PBRMaterial.PBRMATERIAL_OPAQUE;
        /**
         * Gets the current transparency mode.
         */
        @serialize()
        public get transparencyMode(): number {
            return this._transparencyMode;
        }
        /**
         * Sets the transparency mode of the material.
         */
        public set transparencyMode(value: number) {
            if (this._transparencyMode === value) {
                return;
            }
            this._transparencyMode = value;
            if (value === PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND) {
                this._forceAlphaTest = true;
            }
            else {
                this._forceAlphaTest = false;
            }
            
            this._markAllSubMeshesAsTexturesDirty();
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
            if (this._twoSidedLighting === value) {
                return;
            }
            this._twoSidedLighting = value;
            this.backFaceCulling = !value;
            this._markAllSubMeshesAsTexturesDirty();
        }

        /**
         * Specifies wether or not the alpha value of the albedo texture should be used.
         */
        protected _shouldUseAlphaFromAlbedoTexture(): boolean {
            return this._albedoTexture && this._albedoTexture.hasAlpha && this._transparencyMode !== PBRMaterial.PBRMATERIAL_OPAQUE;
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
                        (this._transparencyMode === PBRMaterial.PBRMATERIAL_ALPHABLEND ||
                            this._transparencyMode === PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND));
        }

        /**
         * Specifies wether or not the meshes using this material should be rendered in alpha test mode.
         */
        public needAlphaTesting(): boolean {
            if (this._linkRefractionWithTransparency) {
                return false;
            }

            return this._shouldUseAlphaFromAlbedoTexture() &&
                 this._transparencyMode === PBRMaterial.PBRMATERIAL_ALPHATEST;
        }

        /**
         * Return the active textures of the material.
         */
        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this.environmentTexture) {
                activeTextures.push(this.environmentTexture);
            }

            if (this.normalTexture) {
                activeTextures.push(this.normalTexture);
            }

            if (this.emissiveTexture) {
                activeTextures.push(this.emissiveTexture);
            }

            if (this.occlusionTexture) {
                activeTextures.push(this.occlusionTexture);
            }

            return activeTextures;
        }

        /**
         * Instantiates a new PBRMaterial instance.
         * 
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);

            this._useAmbientInGrayScale = true;
        }

        public getClassName(): string {
            return "PBRBaseSimpleMaterial";
        }        
    }
}