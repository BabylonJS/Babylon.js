/**
 * Types and enums duplicated from @dev/smart-filters for use in build tools.
 * These are build-time only copies to avoid requiring the smart-filters package to be built
 * before the shader conversion tools can run.
 *
 * If these enums/types change in smart-filters, they must be updated here as well.
 */

/**
 * Nullable type alias (duplicated from core/types).
 */
export type Nullable<T> = T | null;

/**
 * Defines the type of a connection point (duplicated from smart-filters ConnectionPointType).
 */
export enum ConnectionPointType {
    /** Float */
    Float = 1,
    /** Texture */
    Texture = 2,
    /** Color3 */
    Color3 = 3,
    /** Color4 */
    Color4 = 4,
    /** Boolean */
    Boolean = 5,
    /** Vector2 */
    Vector2 = 6,
}

/**
 * The strategy to use for making a block disableable (duplicated from smart-filters BlockDisableStrategy).
 */
export enum BlockDisableStrategy {
    /**
     * The shader code is responsible for defining and consulting a uniform named disabled
     * and no-oping (returning texture2D(mainInputTexture, vUV)) if the value is true.
     */
    Manual = 0,

    /**
     * The Smart Filter system will automatically add code to sample the mainInputTexture and return immediately if disabled,
     * and otherwise use the value within the block's shader code.
     */
    AutoSample = 1,
}

/**
 * Description of a const property exposed by a shader block (duplicated from smart-filters ConstPropertyMetadata).
 */
export type ConstPropertyMetadata = {
    /** The name of the const in the shader code */
    name: string;
    /** A friendly name for the property */
    friendlyName: string;
    /** The type of the property */
    type: string;
    /** The default value of the property */
    defaultValue: number;
    /** Optional mapping of values to strings for UI display */
    options?: { [key: string]: number };
};

/**
 * The shader code decorator character (duplicated from smart-filters shaderCodeUtils).
 * Used to decorate the names of uniform, function and const variables for easier parsing.
 */
export const DecorateChar = "_";

/**
 * Decorates a symbol name by wrapping it with the DecorateChar on both sides.
 * @param symbol - The symbol to decorate
 * @returns The decorated symbol
 */
export function DecorateSymbol(symbol: string): string {
    return DecorateChar + symbol + DecorateChar;
}
