module BABYLON {
    /**
     * Display a 360 degree photo on an approximately spherical surface, useful for VR applications or skyboxes.
     * As a subclass of Node, this allow parenting to the camera with different locations in the scene.
     * This class achieves its effect with a Texture and a correctly configured BackgroundMaterial on an inverted sphere.
     * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
     */
    export class PhotoDome extends Node {

        /**
         * The texture being displayed on the sphere
         */
        protected _photoTexture: Texture;

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
         * @param urlsOfPhoto
         * @param options An object containing optional or exposed sub element properties:
         * @param options **resolution=12** Integer, lower resolutions have more artifacts at extreme fovs
         * @param options **size=1000** Physical radius to create the dome at, defaults to approximately half the far clip plane.
         */
        constructor(name: string, urlOfPhoto: string, options: {
            resolution?: number,
            size?: number
        }, scene: Scene) {
            super(name, scene);

            // set defaults and manage values
            name = name || "photoDome";
            options.resolution = (Math.abs(options.resolution as any) | 0) || 12;
            options.size = Math.abs(options.size as any) || (scene.activeCamera ? scene.activeCamera.maxZ * 0.48 : 1000);

            // create
            let material = this._material = new BackgroundMaterial(name + "_material", scene);
            let texture = this._photoTexture = new Texture(urlOfPhoto, scene);
            this._mesh = MeshBuilder.CreateIcoSphere(name + "_mesh", {
                flat: false, // saves on vertex data
                radius: options.size,
                subdivisions: options.resolution,
                sideOrientation: Mesh.BACKSIDE // needs to be inside out
            }, scene);

            // configure material
            texture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches orientation
            texture.wrapV = Texture.CLAMP_ADDRESSMODE; // always clamp the up/down
            material.reflectionTexture = this._photoTexture;
            material.useEquirectangularFOV = true;
            material.fovMultiplier = 1.0;

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
