import { Logger } from "../../Misc/logger";
import { type Nullable } from "../../types";
import { type BaseTexture } from "./baseTexture";
import { type Texture } from "./texture";

/**
 * @internal
 * Returns true when the texture has a non-identity UV transform (offset, scale, or rotation).
 * @param texture The texture to check
 * @returns True if the texture's UV transform is not the identity
 */
export function _HasNonIdentityTransform(texture: BaseTexture): boolean {
    return !texture.getTextureMatrix().isIdentity();
}

/**
 * @internal
 * Returns true when every texture in the list shares the same UV transform matrix.
 * A single texture (or empty list) trivially satisfies this.
 * @param textures The textures to compare
 * @returns True if all the textures share the same UV transform
 */
export function _AllTransformsMatch(textures: BaseTexture[]): boolean {
    if (textures.length <= 1) {
        return true;
    }
    const ref = textures[0].getTextureMatrix();
    for (let i = 1; i < textures.length; i++) {
        if (!ref.equals(textures[i].getTextureMatrix())) {
            return false;
        }
    }
    return true;
}

/**
 * @internal
 * Keep only the inputs whose texture uses the same UV set as the first input texture, so a single
 * output texture can be sampled with one set of coordinates. Inputs on other UV sets are replaced by
 * `drop(input)` and a warning is logged.
 * @param warningPrefix Prefix identifying the operation in the warning message
 * @param inputs The inputs to filter
 * @param getTexture Returns the texture of an input, if any
 * @param drop Returns the replacement for an input whose texture uses a different UV set
 * @returns The inputs, with mismatched ones replaced
 */
export function _KeepMatchingCoordinates<T>(warningPrefix: string, inputs: T[], getTexture: (input: T) => Nullable<BaseTexture> | undefined, drop: (input: T) => T): T[] {
    const firstTexture = inputs.map(getTexture).find((texture) => texture);
    if (!firstTexture || inputs.every((input) => !getTexture(input) || getTexture(input)!.coordinatesIndex === firstTexture.coordinatesIndex)) {
        return inputs;
    }

    const uvSet = firstTexture.coordinatesIndex;
    Logger.Warn(`${warningPrefix}: input textures use different UV coordinates; keeping only textures using UV set ${uvSet}.`);
    return inputs.map((input) => {
        const texture = getTexture(input);
        return !texture || texture.coordinatesIndex === uvSet ? input : drop(input);
    });
}

/**
 * @internal
 * Copy sampling metadata from a source texture onto an output texture that is sampled with the same
 * parameterization. `coordinatesIndex` and wrap modes are always copied. When `includeTransform` is true
 * the UV transform is also copied (used when all inputs share the same transform and it is propagated
 * rather than baked).
 * @param from The texture to copy the metadata from
 * @param to The texture to copy the metadata to
 * @param includeTransform Whether to copy the UV transform
 */
export function _CopyTextureMetadata(from: BaseTexture, to: Texture, includeTransform: boolean): void {
    to.coordinatesIndex = from.coordinatesIndex;
    to.wrapU = from.wrapU;
    to.wrapV = from.wrapV;
    if (includeTransform) {
        const src = from as Texture;
        to.uOffset = src.uOffset ?? 0;
        to.vOffset = src.vOffset ?? 0;
        to.uScale = src.uScale ?? 1;
        to.vScale = src.vScale ?? 1;
        to.uAng = src.uAng ?? 0;
        to.vAng = src.vAng ?? 0;
        to.wAng = src.wAng ?? 0;
        to.uRotationCenter = src.uRotationCenter ?? 0.5;
        to.vRotationCenter = src.vRotationCenter ?? 0.5;
        to.wRotationCenter = src.wRotationCenter ?? 0.5;
        to.homogeneousRotationInUVTransform = src.homogeneousRotationInUVTransform ?? false;
    }
}
