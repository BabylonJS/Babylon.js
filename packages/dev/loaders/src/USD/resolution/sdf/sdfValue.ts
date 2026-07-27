/** A 2-component numeric tuple such as USD `GfVec2f` or `GfVec2d`. */
export type SdfVector2 = [number, number];

/** A 3-component numeric tuple such as USD `GfVec3f`, `GfVec3d`, `point3f`, or `color3f`. */
export type SdfVector3 = [number, number, number];

/** A 4-component numeric tuple such as USD `GfVec4f` or `GfVec4d`. */
export type SdfVector4 = [number, number, number, number];

/** A quaternion stored in Babylon-friendly component order `[x, y, z, w]`. */
export type SdfQuaternion = [number, number, number, number];

/** A 4x4 matrix flattened to 16 numeric elements. */
export type SdfMatrix4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];

/**
 * Represents a USD asset path value.
 */
export interface ISdfAssetPath {
    /** The authored path exactly as decoded from the layer, without surrounding USDA `@...@` delimiters. */
    authoredPath: string;
    /** Optional resolver result. Parsers may omit this; asset resolution can fill it later. */
    resolvedPath?: string;
}

/**
 * Represents a USD signed or unsigned 64-bit integer payload.
 *
 * JavaScript `number` values are exact only up to `Number.MAX_SAFE_INTEGER`; decoders should
 * use `bigint` for authored or crate values outside that safe range when exact round-tripping
 * matters.
 */
export type SdfInteger64 = number | bigint;

/** USD scalar value type tokens supported by the Sdf seam. */
export type SdfScalarValueType =
    | "bool"
    | "int"
    | "uint"
    | "int64"
    | "uint64"
    | "half"
    | "float"
    | "double"
    | "string"
    | "token"
    | "asset"
    | "path"
    | "vec2f"
    | "vec3f"
    | "vec4f"
    | "vec2d"
    | "vec3d"
    | "vec4d"
    | "point3f"
    | "point3d"
    | "normal3f"
    | "quatf"
    | "quatd"
    | "matrix4d"
    | "color3f";

/** USD scalar type tokens that can appear in an array value. */
export type SdfArrayElementValueType = SdfScalarValueType;

/** USD array value type tokens supported by the Sdf seam. */
export type SdfArrayValueType = `${SdfArrayElementValueType}[]`;

/** All value type tags supported by the Sdf value model. */
export type SdfValueType = SdfScalarValueType | SdfArrayValueType | "dictionary";

/**
 * Generic tagged value wrapper used by every concrete Sdf value alias.
 */
export interface ISdfTypedValue<ValueType extends SdfValueType, Payload> {
    /** USD value type tag. This tag, not JavaScript runtime shape alone, defines the authored type. */
    type: ValueType;
    /** Decoded payload for the authored value. */
    value: Payload;
}

/** Tagged USD `bool` value. */
export type SdfBooleanValue = ISdfTypedValue<"bool", boolean>;

/** Tagged USD 32-bit signed `int` value. */
export type SdfIntegerValue = ISdfTypedValue<"int", number>;

/** Tagged USD 32-bit unsigned `uint` value. */
export type SdfUnsignedIntegerValue = ISdfTypedValue<"uint", number>;

/** Tagged USD 64-bit signed `int64` value. */
export type SdfInteger64Value = ISdfTypedValue<"int64", SdfInteger64>;

/** Tagged USD 64-bit unsigned `uint64` value. */
export type SdfUnsignedInteger64Value = ISdfTypedValue<"uint64", SdfInteger64>;

/** Tagged USD half-precision floating-point value, decoded to a JavaScript number. */
export type SdfHalfValue = ISdfTypedValue<"half", number>;

/** Tagged USD single-precision `float` value, decoded to a JavaScript number. */
export type SdfFloatValue = ISdfTypedValue<"float", number>;

/** Tagged USD double-precision `double` value, decoded to a JavaScript number. */
export type SdfDoubleValue = ISdfTypedValue<"double", number>;

/** Tagged USD `string` value. */
export type SdfStringValue = ISdfTypedValue<"string", string>;

/** Tagged USD interned `token` value. */
export type SdfTokenValue = ISdfTypedValue<"token", string>;

/** Tagged USD `asset` value. */
export type SdfAssetValue = ISdfTypedValue<"asset", ISdfAssetPath>;

/** Tagged USD path value. */
export type SdfPathValue = ISdfTypedValue<"path", string>;

/** Tagged USD `vec2f` value. */
export type SdfVector2FloatValue = ISdfTypedValue<"vec2f", SdfVector2>;

/** Tagged USD `vec3f` value. */
export type SdfVector3FloatValue = ISdfTypedValue<"vec3f", SdfVector3>;

/** Tagged USD `vec4f` value. */
export type SdfVector4FloatValue = ISdfTypedValue<"vec4f", SdfVector4>;

/** Tagged USD `vec2d` value. */
export type SdfVector2DoubleValue = ISdfTypedValue<"vec2d", SdfVector2>;

/** Tagged USD `vec3d` value. */
export type SdfVector3DoubleValue = ISdfTypedValue<"vec3d", SdfVector3>;

/** Tagged USD `vec4d` value. */
export type SdfVector4DoubleValue = ISdfTypedValue<"vec4d", SdfVector4>;

/** Tagged USD `point3f` value. */
export type SdfPoint3FloatValue = ISdfTypedValue<"point3f", SdfVector3>;

/** Tagged USD `point3d` value. */
export type SdfPoint3DoubleValue = ISdfTypedValue<"point3d", SdfVector3>;

/** Tagged USD `normal3f` value. */
export type SdfNormal3FloatValue = ISdfTypedValue<"normal3f", SdfVector3>;

/** Tagged USD `quatf` value, stored as `[x, y, z, w]`. */
export type SdfQuaternionFloatValue = ISdfTypedValue<"quatf", SdfQuaternion>;

/** Tagged USD `quatd` value, stored as `[x, y, z, w]`. */
export type SdfQuaternionDoubleValue = ISdfTypedValue<"quatd", SdfQuaternion>;

/** Tagged USD `matrix4d` value. */
export type SdfMatrix4DoubleValue = ISdfTypedValue<"matrix4d", SdfMatrix4>;

/** Tagged USD `color3f` value. */
export type SdfColor3FloatValue = ISdfTypedValue<"color3f", SdfVector3>;

/** Tagged USD `bool[]` value. */
export type SdfBooleanArrayValue = ISdfTypedValue<"bool[]", boolean[]>;

/** Tagged USD `int[]` value. */
export type SdfIntegerArrayValue = ISdfTypedValue<"int[]", number[]>;

/** Tagged USD `uint[]` value. */
export type SdfUnsignedIntegerArrayValue = ISdfTypedValue<"uint[]", number[]>;

/** Tagged USD `int64[]` value. */
export type SdfInteger64ArrayValue = ISdfTypedValue<"int64[]", SdfInteger64[]>;

/** Tagged USD `uint64[]` value. */
export type SdfUnsignedInteger64ArrayValue = ISdfTypedValue<"uint64[]", SdfInteger64[]>;

/** Tagged USD `half[]` value, decoded to JavaScript numbers. */
export type SdfHalfArrayValue = ISdfTypedValue<"half[]", number[]>;

/** Tagged USD `float[]` value. */
export type SdfFloatArrayValue = ISdfTypedValue<"float[]", number[]>;

/** Tagged USD `double[]` value. */
export type SdfDoubleArrayValue = ISdfTypedValue<"double[]", number[]>;

/** Tagged USD `string[]` value. */
export type SdfStringArrayValue = ISdfTypedValue<"string[]", string[]>;

/** Tagged USD `token[]` value. */
export type SdfTokenArrayValue = ISdfTypedValue<"token[]", string[]>;

/** Tagged USD `asset[]` value. */
export type SdfAssetArrayValue = ISdfTypedValue<"asset[]", ISdfAssetPath[]>;

/** Tagged USD `path[]` value. */
export type SdfPathArrayValue = ISdfTypedValue<"path[]", string[]>;

/** Tagged USD `vec2f[]` value. */
export type SdfVector2FloatArrayValue = ISdfTypedValue<"vec2f[]", SdfVector2[]>;

/** Tagged USD `vec3f[]` value. */
export type SdfVector3FloatArrayValue = ISdfTypedValue<"vec3f[]", SdfVector3[]>;

/** Tagged USD `vec4f[]` value. */
export type SdfVector4FloatArrayValue = ISdfTypedValue<"vec4f[]", SdfVector4[]>;

/** Tagged USD `vec2d[]` value. */
export type SdfVector2DoubleArrayValue = ISdfTypedValue<"vec2d[]", SdfVector2[]>;

/** Tagged USD `vec3d[]` value. */
export type SdfVector3DoubleArrayValue = ISdfTypedValue<"vec3d[]", SdfVector3[]>;

/** Tagged USD `vec4d[]` value. */
export type SdfVector4DoubleArrayValue = ISdfTypedValue<"vec4d[]", SdfVector4[]>;

/** Tagged USD `point3f[]` value. */
export type SdfPoint3FloatArrayValue = ISdfTypedValue<"point3f[]", SdfVector3[]>;

/** Tagged USD `point3d[]` value. */
export type SdfPoint3DoubleArrayValue = ISdfTypedValue<"point3d[]", SdfVector3[]>;

/** Tagged USD `normal3f[]` value. */
export type SdfNormal3FloatArrayValue = ISdfTypedValue<"normal3f[]", SdfVector3[]>;

/** Tagged USD `quatf[]` value, stored as `[x, y, z, w]` tuples. */
export type SdfQuaternionFloatArrayValue = ISdfTypedValue<"quatf[]", SdfQuaternion[]>;

/** Tagged USD `quatd[]` value, stored as `[x, y, z, w]` tuples. */
export type SdfQuaternionDoubleArrayValue = ISdfTypedValue<"quatd[]", SdfQuaternion[]>;

/** Tagged USD `matrix4d[]` value. */
export type SdfMatrix4DoubleArrayValue = ISdfTypedValue<"matrix4d[]", SdfMatrix4[]>;

/** Tagged USD `color3f[]` value. */
export type SdfColor3FloatArrayValue = ISdfTypedValue<"color3f[]", SdfVector3[]>;

/** Free-form metadata dictionary keyed by USD field name. */
export type SdfMetadata = Record<string, SdfValue>;

/** Tagged USD dictionary value. */
export type SdfDictionaryValue = ISdfTypedValue<"dictionary", SdfMetadata>;

/** Tagged union of all Sdf value payloads supported by the parser-composition seam. */
export type SdfValue =
    | SdfBooleanValue
    | SdfIntegerValue
    | SdfUnsignedIntegerValue
    | SdfInteger64Value
    | SdfUnsignedInteger64Value
    | SdfHalfValue
    | SdfFloatValue
    | SdfDoubleValue
    | SdfStringValue
    | SdfTokenValue
    | SdfAssetValue
    | SdfPathValue
    | SdfVector2FloatValue
    | SdfVector3FloatValue
    | SdfVector4FloatValue
    | SdfVector2DoubleValue
    | SdfVector3DoubleValue
    | SdfVector4DoubleValue
    | SdfPoint3FloatValue
    | SdfPoint3DoubleValue
    | SdfNormal3FloatValue
    | SdfQuaternionFloatValue
    | SdfQuaternionDoubleValue
    | SdfMatrix4DoubleValue
    | SdfColor3FloatValue
    | SdfBooleanArrayValue
    | SdfIntegerArrayValue
    | SdfUnsignedIntegerArrayValue
    | SdfInteger64ArrayValue
    | SdfUnsignedInteger64ArrayValue
    | SdfHalfArrayValue
    | SdfFloatArrayValue
    | SdfDoubleArrayValue
    | SdfStringArrayValue
    | SdfTokenArrayValue
    | SdfAssetArrayValue
    | SdfPathArrayValue
    | SdfVector2FloatArrayValue
    | SdfVector3FloatArrayValue
    | SdfVector4FloatArrayValue
    | SdfVector2DoubleArrayValue
    | SdfVector3DoubleArrayValue
    | SdfVector4DoubleArrayValue
    | SdfPoint3FloatArrayValue
    | SdfPoint3DoubleArrayValue
    | SdfNormal3FloatArrayValue
    | SdfQuaternionFloatArrayValue
    | SdfQuaternionDoubleArrayValue
    | SdfMatrix4DoubleArrayValue
    | SdfColor3FloatArrayValue
    | SdfDictionaryValue;

/**
 * Ordered time-sample table for one authored attribute.
 */
export interface ISdfTimeSampleMap {
    /** Sorted authored time codes. Parsers normalize USDA dictionary keys and USDC time arrays into this order. */
    times: number[];
    /** Sample values aligned by index with `times`. The two arrays must have the same length. */
    values: SdfValue[];
}
