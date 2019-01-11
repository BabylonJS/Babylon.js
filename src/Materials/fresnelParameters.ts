import { DeepCopier } from "../Misc/deepCopier";
import { Color3 } from "../Maths/math";
import { Engine } from "../Engines/engine";
import { SerializationHelper } from "../Misc/decorators";
import { Constants } from "../Engines/constants";

/**
 * This represents all the required information to add a fresnel effect on a material:
 * @see http://doc.babylonjs.com/how_to/how_to_use_fresnelparameters
 */
export class FresnelParameters {
    private _isEnabled = true;
    /**
     * Define if the fresnel effect is enable or not.
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }
    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_FresnelDirtyFlag | Constants.MATERIAL_MiscDirtyFlag);
    }

    /**
     * Define the color used on edges (grazing angle)
     */
    public leftColor = Color3.White();

    /**
     * Define the color used on center
     */
    public rightColor = Color3.Black();

    /**
     * Define bias applied to computed fresnel term
     */
    public bias = 0;

    /**
     * Defined the power exponent applied to fresnel term
     */
    public power = 1;

    /**
     * Clones the current fresnel and its valuues
     * @returns a clone fresnel configuration
     */
    public clone(): FresnelParameters {
        var newFresnelParameters = new FresnelParameters();

        DeepCopier.DeepCopy(this, newFresnelParameters);

        return newFresnelParameters;
    }

    /**
     * Serializes the current fresnel parameters to a JSON representation.
     * @return the JSON serialization
     */
    public serialize(): any {
        var serializationObject: any = {};

        serializationObject.isEnabled = this.isEnabled;
        serializationObject.leftColor = this.leftColor.asArray();
        serializationObject.rightColor = this.rightColor.asArray();
        serializationObject.bias = this.bias;
        serializationObject.power = this.power;

        return serializationObject;
    }

    /**
     * Parse a JSON object and deserialize it to a new Fresnel parameter object.
     * @param parsedFresnelParameters Define the JSON representation
     * @returns the parsed parameters
     */
    public static Parse(parsedFresnelParameters: any): FresnelParameters {
        var fresnelParameters = new FresnelParameters();

        fresnelParameters.isEnabled = parsedFresnelParameters.isEnabled;
        fresnelParameters.leftColor = Color3.FromArray(parsedFresnelParameters.leftColor);
        fresnelParameters.rightColor = Color3.FromArray(parsedFresnelParameters.rightColor);
        fresnelParameters.bias = parsedFresnelParameters.bias;
        fresnelParameters.power = parsedFresnelParameters.power || 1.0;

        return fresnelParameters;
    }
}

// References the dependencies.
SerializationHelper._FresnelParametersParser = FresnelParameters.Parse;