module BABYLON {
    /**
     * Display a 360 degree photo on an approximately spherical surface, useful for VR applications or skyboxes.
     * As a subclass of Node, this allow parenting to the camera with different locations in the scene.
     * This class achieves its effect with a Texture and a correctly configured BackgroundMaterial on an inverted sphere.
     * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
     */
    export class PhotoDome extends Node {
        private _useDirectMapping = false;

        /**
         * The texture being displayed on the sphere
         */
        protected _photoTexture: Texture;

        /**
         * Gets or sets the texture being displayed on the sphere
         */
        public get photoTexture(): Texture {
            return this._photoTexture;
        }        

        public set photoTexture(value: Texture) {
            if (this._photoTexture === value) {
                return;
            }
            this._photoTexture = value;
            if (this._useDirectMapping) {
                this._photoTexture.wrapU = Texture.CLAMP_ADDRESSMODE;     
                this._photoTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
                this._material.diffuseTexture = this._photoTexture;
            } else {
                this._photoTexture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches orientation
                this._photoTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
                this._material.reflectionTexture = this._photoTexture;
            }
        }        


        /**
         * The skybox material
         */
        protected _material: BackgroundMaterial;

        /**
         * The surface used for the skybox
         */
        protected _mesh: Mesh;

        /**
         * The current fov(field of view) multiplier, 0.0 - 2.0. Defaults to 1.0. Lower values "zoom in" and higher values "zoom out".
         * Also see the options.resolution property.
         */
        public get fovMultiplier(): number {
            return this._material.fovMultiplier;
        }
        public set fovMultiplier(value: number) {
            this._material.fovMultiplier = value;
        }

        /**
         * Create an instance of this class and pass through the parameters to the relevant classes, Texture, StandardMaterial, and Mesh.
         * @param name Element's name, child elements will append suffixes for their own names.
         * @param urlsOfPhoto define the url of the photo to display
         * @param options An object containing optional or exposed sub element properties
         */
        constructor(name: string, urlOfPhoto: string, options: {
            resolution?: number,
            size?: number,
            useDirectMapping?: boolean
        }, scene: Scene) {
            super(name, scene);

            // set defaults and manage values
            name = name || "photoDome";
            options.resolution = (Math.abs(options.resolution as any) | 0) || 32;
            options.size = Math.abs(options.size as any) || (scene.activeCamera ? scene.activeCamera.maxZ * 0.48 : 1000);

            if (options.useDirectMapping === undefined) {
                this._useDirectMapping = true;    
            } else {
                this._useDirectMapping = options.useDirectMapping;            
            }

            // create
            let material = this._material = new BackgroundMaterial(name + "_material", scene);
            this._mesh = BABYLON.Mesh.CreateSphere(name + "_mesh", options.resolution, options.size, scene, false, BABYLON.Mesh.BACKSIDE);

            // configure material
            material.opacityFresnel = false;
            material.useEquirectangularFOV = true;
            material.fovMultiplier = 1.0;

            this.photoTexture = new Texture(urlOfPhoto, scene, false, !this._useDirectMapping);
           
            // configure mesh
            this._mesh.material = material;
            this._mesh.parent = this;
        }

        /**
         * Releases resources associated with this node.
         * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
         * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
         */
        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
            this._photoTexture.dispose();
            this._mesh.dispose();
            this._material.dispose();

            super.dispose(doNotRecurse, disposeMaterialAndTextures);
        }
    }
}
