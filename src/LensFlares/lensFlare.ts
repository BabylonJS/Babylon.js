import { Nullable } from "../types";
import { Color3 } from "../Maths/math.color";
import { Texture } from "../Materials/Textures/texture";
import { LensFlareSystem } from "./lensFlareSystem";
import { Constants } from "../Engines/constants";
/**
 * This represents one of the lens effect in a `lensFlareSystem`.
 * It controls one of the indiviual texture used in the effect.
 * @see https://doc.babylonjs.com/how_to/how_to_use_lens_flares
 */
export class LensFlare {
    /**
     * Define the lens color.
     */
    public color: Color3;

    /**
     * Define the lens texture.
     */
    public texture: Nullable<Texture>;

    /**
     * Define the alpha mode to render this particular lens.
     */
    public alphaMode: number = Constants.ALPHA_ONEONE;

    private _system: LensFlareSystem;

    /**
     * Creates a new Lens Flare.
     * This represents one of the lens effect in a `lensFlareSystem`.
     * It controls one of the indiviual texture used in the effect.
     * @see https://doc.babylonjs.com/how_to/how_to_use_lens_flares
     * @param size Define the size of the lens flare (a floating value between 0 and 1)
     * @param position Define the position of the lens flare in the system. (a floating value between -1 and 1). A value of 0 is located on the emitter. A value greater than 0 is beyond the emitter and a value lesser than 0 is behind.
     * @param color Define the lens color
     * @param imgUrl Define the lens texture url
     * @param system Define the `lensFlareSystem` this flare is part of
     * @returns The newly created Lens Flare
     */
    public static AddFlare(size: number, position: number, color: Color3, imgUrl: string, system: LensFlareSystem): LensFlare {
        return new LensFlare(size, position, color, imgUrl, system);
    }

    /**
     * Instantiates a new Lens Flare.
     * This represents one of the lens effect in a `lensFlareSystem`.
     * It controls one of the indiviual texture used in the effect.
     * @see https://doc.babylonjs.com/how_to/how_to_use_lens_flares
     * @param size Define the size of the lens flare in the system (a floating value between 0 and 1)
     * @param position Define the position of the lens flare in the system. (a floating value between -1 and 1). A value of 0 is located on the emitter. A value greater than 0 is beyond the emitter and a value lesser than 0 is behind.
     * @param color Define the lens color
     * @param imgUrl Define the lens texture url
     * @param system Define the `lensFlareSystem` this flare is part of
     */
    constructor(
        /**
         * Define the size of the lens flare in the system (a floating value between 0 and 1)
         */
        public size: number,
        /**
         * Define the position of the lens flare in the system. (a floating value between -1 and 1). A value of 0 is located on the emitter. A value greater than 0 is beyond the emitter and a value lesser than 0 is behind.
         */
        public position: number,
        color: Color3,
        imgUrl: string,
        system: LensFlareSystem) {

        this.color = color || new Color3(1, 1, 1);
        this.texture = imgUrl ? new Texture(imgUrl, system.getScene(), true) : null;
        this._system = system;

        system.lensFlares.push(this);
    }

    /**
     * Dispose and release the lens flare with its associated resources.
     */
    public dispose(): void {
        if (this.texture) {
            this.texture.dispose();
        }

        // Remove from scene
        var index = this._system.lensFlares.indexOf(this);
        this._system.lensFlares.splice(index, 1);
    }
}
