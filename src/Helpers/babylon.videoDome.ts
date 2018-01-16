module BABYLON {
    /**
     * Display a 360 degree video on an approximately spherical surface, useful for VR applications or skyboxes, video attempts to autoplay.
     * Subclass of Node so there can be multiple locational videos or instead have it parented to the camera.
     * This effect can be achieved by using a VideoTexture and correctly configured material on an inverted sphere.
     * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
     */
    export class VideoDome extends Node {

        /**
         * The video texture being displayed on the sphere
         */
        private _videoTexture: VideoTexture;

        /**
         * The skybox material
         */
        private _material: StandardMaterial;

        /**
         * The surface used for the skybox
         */
        private _mesh: Mesh;

        constructor(name: string, urlsOrVideo: string[] | HTMLVideoElement, options: {
            clickToPlay?: boolean,
            size?: number
        }, scene: Scene) {
            super(name, scene);

            // set defaults and manage values
            name = name || "videoDome";
            options.clickToPlay = Boolean(options.clickToPlay);
            options.size = Math.abs(options.size as any) || 1000;

            // create
            let material = this._material = new BABYLON.StandardMaterial(name+"_material", scene);
            this._videoTexture = new BABYLON.VideoTexture(name+"_texture", urlsOrVideo, scene);
            this._mesh = BABYLON.MeshBuilder.CreateBox(name+"_mesh", {size:-options.size}, scene); // needs to be inside out

            // configure material
            material.reflectionTexture = this._videoTexture;
            material.reflectionTexture.coordinatesMode = BABYLON.Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches src
            material.diffuseColor = material.specularColor = new BABYLON.Color3(0, 0, 0);

            // configure mesh
            this._mesh.material = material;
            this._mesh.parent = this;

            // optional configuration
            if(options.clickToPlay) {
                scene.onPointerUp = () => {
                    this._videoTexture.video.play();
                }
            }
        }
    }
}
