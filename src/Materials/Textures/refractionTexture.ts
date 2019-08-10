import { Scene } from "../../scene";
import { Plane } from "../../Maths/math.plane";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
/**
 * Creates a refraction texture used by refraction channel of the standard material.
 * It is like a mirror but to see through a material.
 * @see https://doc.babylonjs.com/how_to/reflect#refraction
 */
export class RefractionTexture extends RenderTargetTexture {
    /**
     * Define the reflection plane we want to use. The refractionPlane is usually set to the constructed refractor.
     * It is possible to directly set the refractionPlane by directly using a Plane(a, b, c, d) where a, b and c give the plane normal vector (a, b, c) and d is a scalar displacement from the refractionPlane to the origin. However in all but the very simplest of situations it is more straight forward to set it to the refractor as stated in the doc.
     * @see https://doc.babylonjs.com/how_to/reflect#refraction
     */
    public refractionPlane = new Plane(0, 1, 0, 1);

    /**
     * Define how deep under the surface we should see.
     */
    public depth = 2.0;

    /**
     * Creates a refraction texture used by refraction channel of the standard material.
     * It is like a mirror but to see through a material.
     * @see https://doc.babylonjs.com/how_to/reflect#refraction
     * @param name Define the texture name
     * @param size Define the size of the underlying texture
     * @param scene Define the scene the refraction belongs to
     * @param generateMipMaps Define if we need to generate mips level for the refraction
     */
    constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean) {
        super(name, size, scene, generateMipMaps, true);

        this.onBeforeRenderObservable.add(() => {
            scene.clipPlane = this.refractionPlane;
        });

        this.onAfterRenderObservable.add(() => {
            scene.clipPlane = null;
        });
    }

    /**
     * Clone the refraction texture.
     * @returns the cloned texture
     */
    public clone(): RefractionTexture {
        let scene = this.getScene();

        if (!scene) {
            return this;
        }

        var textureSize = this.getSize();
        var newTexture = new RefractionTexture(this.name, textureSize.width, scene, this._generateMipMaps);

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // Refraction Texture
        newTexture.refractionPlane = this.refractionPlane.clone();
        if (this.renderList) {
            newTexture.renderList = this.renderList.slice(0);
        }
        newTexture.depth = this.depth;

        return newTexture;
    }

    /**
     * Serialize the texture to a JSON representation you could use in Parse later on
     * @returns the serialized JSON representation
     */
    public serialize(): any {
        if (!this.name) {
            return null;
        }

        var serializationObject = super.serialize();

        serializationObject.mirrorPlane = this.refractionPlane.asArray();
        serializationObject.depth = this.depth;

        return serializationObject;
    }
}
