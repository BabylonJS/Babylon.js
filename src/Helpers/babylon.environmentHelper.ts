namespace BABYLON {
    /**
     * Represents the different options available during the creation of 
     * a Environment helper.
     * 
     * This can control the default ground, skybox and image processing setup of your scene.
     */
    export interface IEnvironmentHelperOptions {
        /**
         * Specifies wether or not to create a ground.
         * True by default.
         */
        createGround: boolean;
        /**
         * Specifies the ground size.
         * 15 by default.
         */
        groundSize: number;
        /**
         * The texture used on the ground for the main color.
         * Comes from the BabylonJS CDN by default.
         * 
         * Remarks: Can be either a texture or a url.
         */
        groundTexture: string | BaseTexture;
        /**
         * The color mixed in the ground texture by default.
         * BabylonJS clearColor by default.
         */
        groundColor: Color3;
        /**
         * Specifies the ground opacity.
         * 1 by default.
         */
        groundOpacity: number;
        /**
         * Enables the ground to receive shadows.
         * True by default.
         */
        enableGroundShadow: boolean;
        /**
         * Helps preventing the shadow to be fully black on the ground.
         * 0.5 by default.
         */
        groundShadowLevel: number;
        /**
         * Creates a mirror texture attach to the ground.
         * false by default.
         */
        enableGroundMirror: boolean;
        /**
         * Specifies the ground mirror size ratio.
         * 0.3 by default as the default kernel is 64.
         */
        groundMirrorSizeRatio: number;
        /**
         * Specifies the ground mirror blur kernel size.
         * 64 by default.
         */
        groundMirrorBlurKernel: number;
        /**
         * Specifies the ground mirror visibility amount.
         * 1 by default
         */
        groundMirrorAmount: number;
        /**
         * Specifies the ground mirror reflectance weight.
         * This uses the standard weight of the background material to setup the fresnel effect
         * of the mirror.
         * 1 by default.
         */
        groundMirrorFresnelWeight: number;
        /**
         * Specifies the ground mirror Falloff distance.
         * This can helps reducing the size of the reflection.
         * 0 by Default.
         */
        groundMirrorFallOffDistance: number;
        /**
         * Specifies the ground mirror texture type.
         * Unsigned Int by Default.
         */
        groundMirrorTextureType: number;

        /**
         * Specifies wether or not to create a skybox.
         * True by default.
         */
        createSkybox: boolean;
        /**
         * Specifies the skybox size.
         * 20 by default.
         */
        skyboxSize: number;
        /**
         * The texture used on the skybox for the main color.
         * Comes from the BabylonJS CDN by default.
         * 
         * Remarks: Can be either a texture or a url.
         */
        skyboxTexture: string | BaseTexture;
        /**
         * The color mixed in the skybox texture by default.
         * BabylonJS clearColor by default.
         */
        skyboxColor: Color3;

        /**
         * The background rotation around the Y axis of the scene.
         * This helps aligning the key lights of your scene with the background.
         * 0 by default.
         */
        backgroundYRotation: number;

        /**
         * Compute automatically the size of the elements to best fit with the scene.
         */
        sizeAuto: boolean;

        /**
         * Default position of the rootMesh if autoSize is not true.
         */
        rootPosition: Vector3;

        /**
         * Sets up the image processing in the scene.
         * true by default.
         */
        setupImageProcessing: boolean;

        /**
         * The texture used as your environment texture in the scene.
         * Comes from the BabylonJS CDN by default and in use if setupImageProcessing is true.
         * 
         * Remarks: Can be either a texture or a url.
         */
        environmentTexture: string | BaseTexture;

        /**
         * The value of the exposure to apply to the scene.
         * 0.6 by default if setupImageProcessing is true.
         */
        cameraExposure: number;

        /**
         * The value of the contrast to apply to the scene.
         * 1.6 by default if setupImageProcessing is true.
         */
        cameraContrast: number;

        /**
         * Specifies wether or not tonemapping should be enabled in the scene.
         * true by default if setupImageProcessing is true.
         */
        toneMappingEnabled: boolean;
    }

    interface ISceneSize {
        groundSize: number,
        skyboxSize: number,
        rootPosition: Vector3
    }

    /**
     * The Environment helper class can be used to add a fully featuread none expensive background to your scene.
     * It includes by default a skybox and a ground relying on the BackgroundMaterial.
     * It also helps with the default setup of your imageProcessing configuration.
     */
    export class EnvironmentHelper {

        /**
         * Default ground texture URL.
         */
        private static _groundTextureCDNUrl = "https://assets.babylonjs.com/environments/backgroundGround.png";

        /**
         * Default skybox texture URL.
         */
        private static _skyboxTextureCDNUrl = "https://assets.babylonjs.com/environments/backgroundSkybox.dds";

        /**
         * Default environment texture URL.
         */
        private static _environmentTextureCDNUrl = "https://assets.babylonjs.com/environments/environmentSpecular.dds";

        /**
         * Creates the default options for the helper.
         */
        private static _getDefaultOptions(): IEnvironmentHelperOptions {
            return {
                createGround: true,
                groundSize: 15,
                groundTexture: this._groundTextureCDNUrl,
                groundColor: new BABYLON.Color3(0.2, 0.2, 0.3).toLinearSpace().scale(3),
                groundOpacity: 0.9,
                enableGroundShadow: true,
                groundShadowLevel: 0.5,

                enableGroundMirror: false,
                groundMirrorSizeRatio: 0.3,
                groundMirrorBlurKernel: 64,
                groundMirrorAmount: 1,
                groundMirrorFresnelWeight: 1,
                groundMirrorFallOffDistance: 0,
                groundMirrorTextureType: Engine.TEXTURETYPE_UNSIGNED_INT,

                createSkybox: true,
                skyboxSize: 20,
                skyboxTexture: this._skyboxTextureCDNUrl,
                skyboxColor: new BABYLON.Color3(0.2, 0.2, 0.3).toLinearSpace().scale(3),

                backgroundYRotation: 0,
                sizeAuto: true,
                rootPosition: Vector3.Zero(),

                setupImageProcessing: true,
                environmentTexture: this._environmentTextureCDNUrl,
                cameraExposure: 0.8,
                cameraContrast: 1.2,
                toneMappingEnabled: true,
            };
        }

        private _rootMesh: Mesh;
        /**
         * Gets the root mesh created by the helper.
         */
        public get rootMesh(): Mesh {
            return this._rootMesh;
        }

        private _skybox: Nullable<Mesh>;
        /**
         * Gets the skybox created by the helper.
         */
        public get skybox(): Nullable<Mesh> {
            return this._skybox;
        }

        private _skyboxTexture: Nullable<BaseTexture>;
        /**
         * Gets the skybox texture created by the helper.
         */
        public get skyboxTexture(): Nullable<BaseTexture> {
            return this._skyboxTexture;
        }

        private _skyboxMaterial: Nullable<BackgroundMaterial>;
        /**
         * Gets the skybox material created by the helper.
         */
        public get skyboxMaterial(): Nullable<BackgroundMaterial> {
            return this._skyboxMaterial;
        }

        private _ground: Nullable<Mesh>;
        /**
         * Gets the ground mesh created by the helper.
         */
        public get ground(): Nullable<Mesh> {
            return this._ground;
        }
        
        private _groundTexture: Nullable<BaseTexture>;
        /**
         * Gets the ground texture created by the helper.
         */
        public get groundTexture(): Nullable<BaseTexture> {
            return this._groundTexture;
        }
        
        private _groundMirror: Nullable<MirrorTexture>;
        /**
         * Gets the ground mirror created by the helper.
         */
        public get groundMirror(): Nullable<MirrorTexture> {
            return this._groundMirror;
        }

        /**
         * Gets the ground mirror render list to helps pushing the meshes 
         * you wish in the ground reflection.
         */
        public get groundMirrorRenderList(): Nullable<AbstractMesh[]> {
            if (this._groundMirror) {
                return this._groundMirror.renderList;
            }
            return null;
        }

        private _groundMaterial: Nullable<BackgroundMaterial>;
        /**
         * Gets the ground material created by the helper.
         */
        public get groundMaterial(): Nullable<BackgroundMaterial> {
            return this._groundMaterial;
        }

        /**
         * Stores the creation options.
         */
        private readonly _scene: Scene;
        private _options: IEnvironmentHelperOptions;

        /**
         * constructor
         * @param options 
         * @param scene The scene to add the material to
         */
        constructor(options: Partial<IEnvironmentHelperOptions>, scene: BABYLON.Scene) {
            this._options = {
                ...EnvironmentHelper._getDefaultOptions(),
                ...options
            }
            this._scene = scene;

            this._setupBackground();
            this._setupImageProcessing();
        }

        /**
         * Updates the background according to the new options
         * @param options 
         */
        public updateOptions(options: Partial<IEnvironmentHelperOptions>) {
            const newOptions = {
                ...this._options,
                ...options
            }

            if (this._ground && !newOptions.createGround) {
                this._ground.dispose();
                this._ground = null;
            }

            if (this._groundMaterial && !newOptions.createGround) {
                this._groundMaterial.dispose();
                this._groundMaterial = null;
            }

            if (this._options.groundTexture && !newOptions.groundTexture && this._groundTexture) {
                this._groundTexture.dispose();
                this._groundTexture = null;
            }

            if (this._skybox && !newOptions.createSkybox) {
                this._skybox.dispose();
                this._skybox = null;
            }

            if (this._skyboxMaterial && !newOptions.createSkybox) {
                this._skyboxMaterial.dispose();
                this._skyboxMaterial = null;
            }

            if (this._options.skyboxTexture && !newOptions.skyboxTexture && this._skyboxTexture) {
                this._skyboxTexture.dispose();
                this._skyboxTexture = null;
            }

            if (this._groundMirror && !newOptions.enableGroundMirror) {
                this._groundMirror.dispose();
                this._groundMirror = null;
            }

            if (this._options.environmentTexture && !newOptions.environmentTexture && this._scene.environmentTexture) {
                this._scene.environmentTexture.dispose();
            }

            this._options = newOptions;

            this._setupBackground();
            this._setupImageProcessing();
        }

        /**
         * Sets the primary color of all the available elements.
         * @param color 
         */
        public setMainColor(color: Color3): void {
            if (this.groundMaterial) {
                this.groundMaterial.primaryColor = color;
            }

            if (this.skyboxMaterial) {
                this.skyboxMaterial.primaryColor = color;
            }

            if (this.groundMirror) {
                this.groundMirror.clearColor = new Color4(color.r, color.g, color.b, 1.0);
            }
        }

        /**
         * Setup the image processing according to the specified options.
         */
        private _setupImageProcessing(): void {
            if (this._options.setupImageProcessing) {
                this._scene.imageProcessingConfiguration.contrast = this._options.cameraContrast;
                this._scene.imageProcessingConfiguration.exposure = this._options.cameraExposure;
                this._scene.imageProcessingConfiguration.toneMappingEnabled = this._options.toneMappingEnabled;                
                this._setupEnvironmentTexture();
            }
        }

        /**
         * Setup the environment texture according to the specified options.
         */
        private _setupEnvironmentTexture(): void {
            if (this._scene.environmentTexture) {
                return;
            }

            if (this._options.environmentTexture instanceof BaseTexture) {
                this._scene.environmentTexture = this._options.environmentTexture;
                return;
            }

            const environmentTexture = CubeTexture.CreateFromPrefilteredData(this._options.environmentTexture, this._scene);
            this._scene.environmentTexture = environmentTexture;
        }

        /**
         * Setup the background according to the specified options.
         */
        private _setupBackground(): void {
            if (!this._rootMesh) {
                this._rootMesh = new Mesh("BackgroundHelper", this._scene);
            }
            this._rootMesh.rotation.y = this._options.backgroundYRotation;

            const sceneSize = this._getSceneSize();
            if (this._options.createGround) {
                this._setupGround(sceneSize);
                this._setupGroundMaterial();
                this._setupGroundDiffuseTexture();

                if (this._options.enableGroundMirror) {
                    this._setupGroundMirrorTexture(sceneSize);
                }
                this._setupMirrorInGroundMaterial();
            }

            if (this._options.createSkybox) {
                this._setupSkybox(sceneSize);
                this._setupSkyboxMaterial();
                this._setupSkyboxReflectionTexture();
            }

            this._rootMesh.position.x = sceneSize.rootPosition.x;
            this._rootMesh.position.z = sceneSize.rootPosition.z;
            this._rootMesh.position.y = sceneSize.rootPosition.y;
        }

        /**
         * Get the scene sizes according to the setup.
         */
        private _getSceneSize(): ISceneSize {
            let groundSize = this._options.groundSize;
            let skyboxSize = this._options.skyboxSize;
            let rootPosition = this._options.rootPosition;
            const sceneExtends = this._scene.getWorldExtends();
            const sceneDiagonal = sceneExtends.max.subtract(sceneExtends.min);
            let bias = 0.0001;

            if (this._options.sizeAuto) {
                if (this._scene.activeCamera instanceof ArcRotateCamera &&
                    this._scene.activeCamera.upperRadiusLimit) {
                    groundSize = this._scene.activeCamera.upperRadiusLimit * 2;
                }

                if (this._scene.activeCamera) {
                    bias = (this._scene.activeCamera.maxZ - this._scene.activeCamera.minZ) / 10000;
                }

                const sceneDiagonalLenght = sceneDiagonal.length();
                if (sceneDiagonalLenght > groundSize) {
                    groundSize = sceneDiagonalLenght * 2;
                }

                // 10 % bigger.
                groundSize *= 1.1;
                skyboxSize *= 1.5;
                rootPosition = sceneExtends.min.add(sceneDiagonal.scale(0.5));
                rootPosition.y = sceneExtends.min.y - bias;
            }

            return { groundSize, skyboxSize, rootPosition };
        }

        /**
         * Setup the ground according to the specified options.
         */
        private _setupGround(sceneSize: ISceneSize): void {
            if (!this._ground) {
                this._ground = Mesh.CreatePlane("BackgroundPlane", sceneSize.groundSize, this._scene);
                this._ground.rotation.x = Math.PI / 2; // Face up by default.
                this._ground.parent = this._rootMesh;
                this._ground.onDisposeObservable.add(() => { this._ground = null; })
            }
            
            this._ground.receiveShadows = this._options.enableGroundShadow;
        }

        /**
         * Setup the ground material according to the specified options.
         */
        private _setupGroundMaterial(): void {
            if (!this._groundMaterial) {
                this._groundMaterial = new BABYLON.BackgroundMaterial("BackgroundPlaneMaterial", this._scene);
            }
            this._groundMaterial.alpha = this._options.groundOpacity;
            this._groundMaterial.alphaMode = BABYLON.Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
            this._groundMaterial.shadowLevel = this._options.groundShadowLevel;
            this._groundMaterial.primaryLevel = 1;
            this._groundMaterial.primaryColor = this._options.groundColor;
            this._groundMaterial.secondaryLevel = 0;
            this._groundMaterial.tertiaryLevel = 0;
            this._groundMaterial.useRGBColor = false;
            this._groundMaterial.enableNoise = true;
            
            if (this._ground) {
                this._ground.material = this._groundMaterial;
            }
        }

        /**
         * Setup the ground diffuse texture according to the specified options.
         */
        private _setupGroundDiffuseTexture(): void {
            if (!this._groundMaterial) {
                return;
            }

            if (this._groundTexture) {
                return;
            }

            if (this._options.groundTexture instanceof BaseTexture) {
                this._groundMaterial.diffuseTexture = this._options.groundTexture;
                return;
            }

            const diffuseTexture = new BABYLON.Texture(this._options.groundTexture, this._scene);
            diffuseTexture.gammaSpace = false;
            diffuseTexture.hasAlpha = true;
            this._groundMaterial.diffuseTexture = diffuseTexture;
        }

        /**
         * Setup the ground mirror texture according to the specified options.
         */
        private _setupGroundMirrorTexture(sceneSize: ISceneSize): void {
            let wrapping = BABYLON.Texture.CLAMP_ADDRESSMODE;
            if (!this._groundMirror) {
                this._groundMirror = new BABYLON.MirrorTexture("BackgroundPlaneMirrorTexture", 
                    { ratio: this._options.groundMirrorSizeRatio },
                    this._scene,
                    false,
                    this._options.groundMirrorTextureType,
                    BABYLON.Texture.BILINEAR_SAMPLINGMODE,
                    true);
                this._groundMirror.mirrorPlane = new BABYLON.Plane(0, -1, 0, sceneSize.rootPosition.y);
                this._groundMirror.anisotropicFilteringLevel = 1;
                this._groundMirror.wrapU = wrapping;
                this._groundMirror.wrapV = wrapping;
                this._groundMirror.gammaSpace = false;

                if (this._groundMirror.renderList) {
                    for (let i = 0; i < this._scene.meshes.length; i++) {
                        const mesh = this._scene.meshes[i];
                        if (mesh !== this._ground && 
                            mesh !== this._skybox &&
                            mesh !== this._rootMesh) {
                            this._groundMirror.renderList.push(mesh);
                        }
                    }
                }
            }
            
            this._groundMirror.clearColor = new BABYLON.Color4(
                this._options.groundColor.r,
                this._options.groundColor.g,
                this._options.groundColor.b,
                1);
            this._groundMirror.adaptiveBlurKernel = this._options.groundMirrorBlurKernel;
        }

        /**
         * Setup the ground to receive the mirror texture.
         */
        private _setupMirrorInGroundMaterial(): void {
            if (this._groundMaterial) {
                this._groundMaterial.reflectionTexture = this._groundMirror;
                this._groundMaterial.reflectionFresnel = true;
                this._groundMaterial.reflectionAmount = this._options.groundMirrorAmount;
                this._groundMaterial.reflectionStandardFresnelWeight = this._options.groundMirrorFresnelWeight;
                this._groundMaterial.reflectionFalloffDistance = this._options.groundMirrorFallOffDistance;
            }
        }

        /**
         * Setup the skybox according to the specified options.
         */
        private _setupSkybox(sceneSize: ISceneSize): void {
            if (!this._skybox) {
                this._skybox = Mesh.CreateBox("BackgroundSkybox", sceneSize.skyboxSize, this._scene, undefined, BABYLON.Mesh.BACKSIDE);                
                this._skybox.onDisposeObservable.add(() => { this._skybox = null; })
            }
            this._skybox.parent = this._rootMesh;
        }

        /**
         * Setup the skybox material according to the specified options.
         */
        private _setupSkyboxMaterial(): void {
            if (!this._skybox) {
                return;
            }

            if (!this._skyboxMaterial) {
                this._skyboxMaterial = new BackgroundMaterial("BackgroundSkyboxMaterial", this._scene);
            }
            this._skyboxMaterial.useRGBColor = false;
            this._skyboxMaterial.primaryLevel = 1;
            this._skyboxMaterial.primaryColor = this._options.skyboxColor;
            this._skyboxMaterial.secondaryLevel = 0;
            this._skyboxMaterial.tertiaryLevel = 0;
            this._skyboxMaterial.enableNoise = true;

            this._skybox.material = this._skyboxMaterial;
        }

        /**
         * Setup the skybox reflection texture according to the specified options.
         */
        private _setupSkyboxReflectionTexture(): void {
            if (!this._skyboxMaterial) {
                return;
            }

            if (this._skyboxTexture) {
                return;
            }

            if (this._options.skyboxTexture instanceof BaseTexture) {
                this._skyboxMaterial.reflectionTexture = this._skyboxTexture;
                return;
            }

            this._skyboxTexture = new BABYLON.CubeTexture(this._options.skyboxTexture, this._scene);
            this._skyboxTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._skyboxTexture.gammaSpace = false;
            this._skyboxMaterial.reflectionTexture = this._skyboxTexture;
        }

        /**
         * Dispose all the elements created by the Helper.
         */
        public dispose(): void {
            if (this._groundMaterial) {
                this._groundMaterial.dispose(true, true);
            }
            if (this._skyboxMaterial) {
                this._skyboxMaterial.dispose(true, true);
            }
            this._rootMesh.dispose(false);
        }
    }
}