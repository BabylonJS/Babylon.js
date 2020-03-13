import { DeepCopier } from "../Misc/deepCopier";
import { DeepImmutable } from '../types';
import { Color3 } from "../Maths/math.color";
import { Engine } from "../Engines/engine";
import { SerializationHelper } from "../Misc/decorators";
import { Constants } from "../Engines/constants";

/**
 * Options to be used when creating a FresnelParameters.
 */
export type IFresnelParametersCreationOptions = {
    /**
     * Define the color used on edges (grazing angle)
     */
    leftColor?: Color3;

    /**
     * Define the color used on center
     */
    rightColor?: Color3;

    /**
     * Define bias applied to computed fresnel term
     */
    bias?: number;

    /**
     * Defined the power exponent applied to fresnel term
     */
    power?: number;

    /**
     * Define if the fresnel effect is enable or not.
     */
    isEnabled?: boolean;
};

/**
 * Serialized format for FresnelParameters.
 */
export type IFresnelParametersSerialized = {
    /**
     * Define the color used on edges (grazing angle) [as an array]
     */
    leftColor: number[];

    /**
     * Define the color used on center [as an array]
     */
    rightColor: number[];

    /**
     * Define bias applied to computed fresnel term
     */
    bias: number;

    /**
     * Defined the power exponent applied to fresnel term
     */
    power?: number;

    /**
     * Define if the fresnel effect is enable or not.
     */
    isEnabled: boolean;
};

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
    public leftColor: Color3;

    /**
     * Define the color used on center
     */
    public rightColor: Color3;

    /**
     * Define bias applied to computed fresnel term
     */
    public bias: number;

    /**
     * Defined the power exponent applied to fresnel term
     */
    public power: number;

    /**
     * Creates a new FresnelParameters object.
     *
     * @param options provide your own settings to optionally to override defaults
     */
    public constructor(options: IFresnelParametersCreationOptions = {}) {
        this.bias = (options.bias === undefined) ? 0 : options.bias;
        this.power = (options.power === undefined) ? 1 : options.power;
        this.leftColor = options.leftColor || Color3.White();
        this.rightColor = options.rightColor || Color3.Black();
        if (options.isEnabled === false) {
            this.isEnabled = false;
        }
    }

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
     * Determines equality between FresnelParameters objects
     * @param otherFresnelParameters defines the second operand
     * @returns true if the power, bias, leftColor, rightColor and isEnabled values are equal to the given ones
     */
    public equals(otherFresnelParameters: DeepImmutable<FresnelParameters>): boolean {
        return otherFresnelParameters &&
            this.bias === otherFresnelParameters.bias &&
            this.power === otherFresnelParameters.power &&
            this.leftColor.equals(otherFresnelParameters.leftColor) &&
            this.rightColor.equals(otherFresnelParameters.rightColor) &&
            this.isEnabled === otherFresnelParameters.isEnabled;
    }

    /**
     * Serializes the current fresnel parameters to a JSON representation.
     * @return the JSON serialization
     */
    public serialize(): IFresnelParametersSerialized {
        return {
            isEnabled: this.isEnabled,
            leftColor: this.leftColor.asArray(),
            rightColor: this.rightColor.asArray(),
            bias: this.bias,
            power: this.power
        };
    }

    /**
     * Parse a JSON object and deserialize it to a new Fresnel parameter object.
     * @param parsedFresnelParameters Define the JSON representation
     * @returns the parsed parameters
     */
    public static Parse(parsedFresnelParameters: IFresnelParametersSerialized): FresnelParameters {
        return new FresnelParameters({
            isEnabled: parsedFresnelParameters.isEnabled,
            leftColor: Color3.FromArray(parsedFresnelParameters.leftColor),
            rightColor: Color3.FromArray(parsedFresnelParameters.rightColor),
            bias: parsedFresnelParameters.bias,
            power: parsedFresnelParameters.power || 1.0
        });
    }
}

// References the dependencies.
SerializationHelper._FresnelParametersParser = FresnelParameters.Parse;