module BABYLON {
    /**
     * The PBR material of BJS following the metal roughness convention.
     * 
     * This fits to the PBR convention in the GLTF definition: 
     * https://github.com/KhronosGroup/glTF/tree/2.0/specification/2.0
     */
    export class PBRMetallicRoughnessMaterial extends Internals.PBRBaseSimpleMaterial {

        /**
         * The base color has two different interpretations depending on the value of metalness. 
         * When the material is a metal, the base color is the specific measured reflectance value 
         * at normal incidence (F0). For a non-metal the base color represents the reflected diffuse color 
         * of the material.
         */
        @serializeAsColor3()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoColor")
        public baseColor: Color3;
        
        /**
         * Base texture of the metallic workflow. It contains both the baseColor information in RGB as
         * well as opacity information in the alpha channel.
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_albedoTexture")
        public baseTexture: BaseTexture;

        /**
         * Specifies the metallic scalar value of the material.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public metallic: number;

        /**
         * Specifies the roughness scalar value of the material.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public roughness: number;

        /**
         * Texture containing both the metallic value in the B channel and the 
         * roughness value in the G channel to keep better precision.
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty", "_metallicTexture")
        public metallicRoughnessTexture: BaseTexture;

        /**
         * Instantiates a new PBRMetalRoughnessMaterial instance.
         * 
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);
            this._useRoughnessFromMetallicTextureAlpha = false;
            this._useRoughnessFromMetallicTextureGreen = true;
            this._useMetallnessFromMetallicTextureBlue = true;
        }

        /**
         * Return the currrent class name of the material.
         */
        public getClassName(): string {
            return "PBRMetallicRoughnessMaterial";
        }

        /**
         * Return the active textures of the material.
         */
        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this.baseTexture) {
                activeTextures.push(this.baseTexture);
            }

            if (this.metallicRoughnessTexture) {
                activeTextures.push(this.metallicRoughnessTexture);
            }

            return activeTextures;
        }

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            if (this.baseTexture === texture) {
                return true;
            }

            if (this.metallicRoughnessTexture === texture) {
                return true;
            }        

            return false;    
        }        

        public clone(name: string): PBRMetallicRoughnessMaterial {
            var clone = SerializationHelper.Clone(() => new PBRMetallicRoughnessMaterial(name, this.getScene()), this);
            
            clone.id = name;
            clone.name = name;

            return clone;
        }

        /**
         * Serialize the material to a parsable JSON object.
         */
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.PBRMetallicRoughnessMaterial";
            return serializationObject;
        }

        /**
         * Parses a JSON object correponding to the serialize function.
         */
        public static Parse(source: any, scene: Scene, rootUrl: string): PBRMetallicRoughnessMaterial {
            return SerializationHelper.Parse(() => new PBRMetallicRoughnessMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}