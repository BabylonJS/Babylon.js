
declare namespace BABYLON {
    /**
     * Background material
     */
    class BackgroundMaterial extends BABYLON.PushMaterial {
        /**
         * Key light Color (multiply against the R channel of the environement texture)
         */
        protected _primaryColor: Color3;
        primaryColor: Color3;
        /**
         * Key light Level (allowing HDR output of the background)
         */
        protected _primaryLevel: float;
        primaryLevel: float;
        /**
         * Secondary light Color (multiply against the G channel of the environement texture)
         */
        protected _secondaryColor: Color3;
        secondaryColor: Color3;
        /**
         * Secondary light Level (allowing HDR output of the background)
         */
        protected _secondaryLevel: float;
        secondaryLevel: float;
        /**
         * Tertiary light Color (multiply against the B channel of the environement texture)
         */
        protected _tertiaryColor: Color3;
        tertiaryColor: Color3;
        /**
         * Tertiary light Level (allowing HDR output of the background)
         */
        protected _tertiaryLevel: float;
        tertiaryLevel: float;
        /**
         * Reflection Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        protected _reflectionTexture: Nullable<BaseTexture>;
        reflectionTexture: Nullable<BaseTexture>;
        /**
         * Reflection Texture level of blur.
         *
         * Can be use to reuse an existing HDR Texture and target a specific LOD to prevent authoring the
         * texture twice.
         */
        protected _reflectionBlur: float;
        reflectionBlur: float;
        /**
         * Diffuse Texture used in the material.
         * Should be author in a specific way for the best result (refer to the documentation).
         */
        protected _diffuseTexture: Nullable<BaseTexture>;
        diffuseTexture: Nullable<BaseTexture>;
        /**
         * Specify the list of lights casting shadow on the material.
         * All scene shadow lights will be included if null.
         */
        protected _shadowLights: Nullable<IShadowLight[]>;
        shadowLights: Nullable<IShadowLight[]>;
        /**
         * For the lights having a blurred shadow generator, this can add a second blur pass in order to reach
         * soft lighting on the background.
         */
        protected _shadowBlurScale: int;
        shadowBlurScale: int;
        /**
         * Helps adjusting the shadow to a softer level if required.
         * 0 means black shadows and 1 means no shadows.
         */
        protected _shadowLevel: float;
        shadowLevel: float;
        /**
         * In case of opacity Fresnel or reflection falloff, this is use as a scene center.
         * It is usually zero but might be interesting to modify according to your setup.
         */
        protected _sceneCenter: Vector3;
        sceneCenter: Vector3;
        /**
         * This helps specifying that the material is falling off to the sky box at grazing angle.
         * This helps ensuring a nice transition when the camera goes under the ground.
         */
        protected _opacityFresnel: boolean;
        opacityFresnel: boolean;
        /**
         * This helps specifying that the material is falling off from diffuse to the reflection texture at grazing angle.
         * This helps adding a mirror texture on the ground.
         */
        protected _reflectionFresnel: boolean;
        reflectionFresnel: boolean;
        /**
         * This helps specifying the falloff radius off the reflection texture from the sceneCenter.
         * This helps adding a nice falloff effect to the reflection if used as a mirror for instance.
         */
        protected _reflectionFalloffDistance: number;
        reflectionFalloffDistance: number;
        /**
         * This specifies the weight of the reflection against the background in case of reflection Fresnel.
         */
        protected _reflectionAmount: number;
        reflectionAmount: number;
        /**
         * This specifies the weight of the reflection at grazing angle.
         */
        protected _reflectionReflectance0: number;
        reflectionReflectance0: number;
        /**
         * This specifies the weight of the reflection at a perpendicular point of view.
         */
        protected _reflectionReflectance90: number;
        reflectionReflectance90: number;
        /**
         * Helps to directly use the maps channels instead of their level.
         */
        protected _useRGBColor: boolean;
        useRGBColor: boolean;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        private _maxSimultaneousLights;
        maxSimultaneousLights: int;
        /**
         * Default configuration related to image processing available in the Background Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the PBR Material.
         * @param configuration (if null the scene configuration will be use)
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: Nullable<ImageProcessingConfiguration>;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: float;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: float;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
        private _renderTargets;
        private _reflectionControls;
        /**
         * constructor
         * @param name The name of the material
         * @param scene The scene to add the material to
         */
        constructor(name: string, scene: BABYLON.Scene);
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns false
         */
        needAlphaTesting(): boolean;
        /**
         * The entire material has been created in order to prevent overdraw.
         * @returns true if blending is enable
         */
        needAlphaBlending(): boolean;
        /**
         * Checks wether the material is ready to be rendered for a given mesh.
         * @param mesh The mesh to render
         * @param subMesh The submesh to check against
         * @param useInstances Specify wether or not the material is used with instances
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        /**
         * Build the uniform buffer used in the material.
         */
        buildUniformLayout(): void;
        /**
         * Unbind the material.
         */
        unbind(): void;
        /**
         * Bind only the world matrix to the material.
         * @param world The world matrix to bind.
         */
        bindOnlyWorldMatrix(world: Matrix): void;
        /**
         * Bind the material for a dedicated submeh (every used meshes will be considered opaque).
         * @param world The world matrix to bind.
         * @param subMesh The submesh to bind for.
         */
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        /**
         * Dispose the material.
         * @forceDisposeEffect Force disposal of the associated effect.
         * @forceDisposeTextures Force disposal of the associated textures.
         */
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        /**
         * Clones the material.
         * @name The cloned name.
         * @returns The cloned material.
         */
        clone(name: string): BackgroundMaterial;
        /**
         * Serializes the current material to its JSON representation.
         * @returns The JSON representation.
         */
        serialize(): any;
        /**
         * Gets the class name of the material
         * @returns "BackgroundMaterial"
         */
        getClassName(): string;
        /**
         * Parse a JSON input to create back a background material.
         * @param source
         * @param scene
         * @param rootUrl
         * @returns the instantiated BackgroundMaterial.
         */
        static Parse(source: any, scene: Scene, rootUrl: string): BackgroundMaterial;
    }
}
