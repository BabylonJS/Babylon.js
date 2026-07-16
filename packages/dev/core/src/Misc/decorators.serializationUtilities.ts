/* eslint-disable @typescript-eslint/naming-convention */
/** @internal */
export const enum SerializedFieldType {
    VALUE = 0,
    TEXTURE = 1,
    COLOR3 = 2,
    FRESNEL_PARAMETERS = 3,
    VECTOR2 = 4,
    VECTOR3 = 5,
    MESH = 6,
    COLOR_CURVES = 7,
    COLOR4 = 8,
    IMAGE_PROCESSING = 9,
    QUATERNION = 10,
    CAMERA = 11,
    MATRIX = 12,
    VECTOR4 = 13,
}

/** @internal */
export interface SerializedPropertyMetadata {
    type: SerializedFieldType;
    sourceName: string | undefined;
}

/** @internal */
export type SerializedPropertyMetadataMap = Record<string, SerializedPropertyMetadata>;
