
declare module BABYLON {
    /**
     * This is the sky material which allows to create dynamic and texture free effects for skyboxes.
     * @see https://doc.babylonjs.com/extensions/sky
     */
    class SkyMaterial extends PushMaterial {
        /**
         * Defines the overall luminance of sky in interval ]0, 1[.
         */
        luminance: number;
        /**
         * Defines the amount (scattering) of haze as opposed to molecules in atmosphere.
         */
        turbidity: number;
        /**
         * Defines the sky appearance (light intensity).
         */
        rayleigh: number;
        /**
         * Defines the mieCoefficient in interval [0, 0.1] which affects the property .mieDirectionalG.
         */
        mieCoefficient: number;
        /**
         * Defines the amount of haze particles following the Mie scattering theory.
         */
        mieDirectionalG: number;
        /**
         * Defines the distance of the sun according to the active scene camera.
         */
        distance: number;
        /**
         * Defines the sun inclination, in interval [-0.5, 0.5]. When the inclination is not 0, the sun is said
         * "inclined".
         */
        inclination: number;
        /**
         * Defines the solar azimuth in interval [0, 1]. The azimuth is the angle in the horizontal plan between
         * an object direction and a reference direction.
         */
        azimuth: number;
        /**
         * Defines the sun position in the sky on (x,y,z). If the property .useSunPosition is set to false, then
         * the property is overriden by the inclination and the azimuth and can be read at any moment.
         */
        sunPosition: Vector3;
        /**
         * Defines if the sun position should be computed (inclination and azimuth) according to the given
         * .sunPosition property.
         */
        useSunPosition: boolean;
        /**
         * Defines an offset vector used to get a horizon offset.
         * @example skyMaterial.cameraOffset.y = camera.globalPosition.y // Set horizon relative to 0 on the Y axis
         */
        cameraOffset: Vector3;
        private _cameraPosition;
        private _renderId;
        /**
         * Instantiates a new sky material.
         * This material allows to create dynamic and texture free
         * effects for skyboxes by taking care of the atmosphere state.
         * @see https://doc.babylonjs.com/extensions/sky
         * @param name Define the name of the material in the scene
         * @param scene Define the scene the material belong to
         */
        constructor(name: string, scene: Scene);
        /**
         * Specifies if the material will require alpha blending
         * @returns a boolean specifying if alpha blending is needed
         */
        needAlphaBlending(): boolean;
        /**
         * Specifies if this material should be rendered in alpha test mode
         * @returns false as the sky material doesn't need alpha testing.
         */
        needAlphaTesting(): boolean;
        /**
         * Get the texture used for alpha test purpose.
         * @returns null as the sky material has no texture.
         */
        getAlphaTestTexture(): Nullable<BaseTexture>;
        /**
         * Get if the submesh is ready to be used and all its information available.
         * Child classes can use it to update shaders
         * @param mesh defines the mesh to check
         * @param subMesh defines which submesh to check
         * @param useInstances specifies that instances should be used
         * @returns a boolean indicating that the submesh is ready or not
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        /**
         * Binds the submesh to this material by preparing the effect and shader to draw
         * @param world defines the world transformation matrix
         * @param mesh defines the mesh containing the submesh
         * @param subMesh defines the submesh to bind the material to
         */
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        /**
         * Get the list of animatables in the material.
         * @returns the list of animatables object used in the material
         */
        getAnimatables(): IAnimatable[];
        /**
         * Disposes the material
         * @param forceDisposeEffect specifies if effects should be forcefully disposed
         */
        dispose(forceDisposeEffect?: boolean): void;
        /**
         * Makes a duplicate of the material, and gives it a new name
         * @param name defines the new name for the duplicated material
         * @returns the cloned material
         */
        clone(name: string): SkyMaterial;
        /**
         * Serializes this material in a JSON representation
         * @returns the serialized material object
         */
        serialize(): any;
        /**
         * Gets the current class name of the material e.g. "SkyMaterial"
         * Mainly use in serialization.
         * @returns the class name
         */
        getClassName(): string;
        /**
         * Creates a sky material from parsed material data
         * @param source defines the JSON representation of the material
         * @param scene defines the hosting scene
         * @param rootUrl defines the root URL to use to load textures and relative dependencies
         * @returns a new sky material
         */
        static Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial;
    }
}
