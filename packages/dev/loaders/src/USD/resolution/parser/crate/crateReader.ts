import { DecodeCrateCompressedIntegerBlock32, DecodeCrateCompressedIntegerBlock64 } from "./crateIntegerDecoder";
import { DecompressFromBuffer } from "./crateLz4";
import { type ISdfLayer } from "../../sdf/sdfLayer";
import { type ISdfListOp } from "../../sdf/sdfListOp";
import { type ISdfAttributeSpec, type ISdfPrimSpec, type ISdfRelationshipSpec, type SdfInterpolation, type SdfSpecifier, type SdfVariability } from "../../sdf/sdfSpec";
import { type ISdfTimeSampleMap, type SdfValue, type SdfValueType } from "../../sdf/sdfValue";

const CrateMagic = "PXR-USDC";
const BootstrapSize = 88;
const SectionRecordSize = 32;
const SectionNameSize = 16;
const InvalidIndex = 0xffffffff;
const MaxCrateSectionCount = 65_536;
const MaxCrateTableEntries = 16 * 1024 * 1024;

const enum CrateSpecType {
    Attribute = 1,
    Prim = 6,
    PseudoRoot = 7,
    Relationship = 8,
}

const enum CrateValueType {
    Bool = 1,
    Uchar = 2,
    Int = 3,
    UInt = 4,
    Int64 = 5,
    UInt64 = 6,
    Half = 7,
    Float = 8,
    Double = 9,
    String = 10,
    Token = 11,
    AssetPath = 12,
    Matrix2d = 13,
    Matrix3d = 14,
    Matrix4d = 15,
    Quatd = 16,
    Quatf = 17,
    Quath = 18,
    Vec2d = 19,
    Vec2f = 20,
    Vec2h = 21,
    Vec2i = 22,
    Vec3d = 23,
    Vec3f = 24,
    Vec3h = 25,
    Vec3i = 26,
    Vec4d = 27,
    Vec4f = 28,
    Vec4h = 29,
    Vec4i = 30,
    TokenListOp = 32,
    StringListOp = 33,
    PathListOp = 34,
    PathVector = 40,
    TokenVector = 41,
    Specifier = 42,
    Variability = 44,
    TimeSamples = 46,
    DoubleVector = 48,
    StringVector = 50,
}

interface ICrateVersion {
    major: number;
    minor: number;
    patch: number;
}

interface ICrateSection {
    name: string;
    start: number;
    size: number;
}

interface ICrateField {
    tokenIndex: number;
    valueRep: bigint;
}

interface ICrateSpec {
    pathIndex: number;
    fieldSetIndex: number;
    specType: CrateSpecType;
}

interface ICrateValueRep {
    type: number;
    isArray: boolean;
    isInlined: boolean;
    isCompressed: boolean;
    payload: number;
}

// Tables and stream needed to decode crate field values, threaded from ParseCrate into BuildLayer.
interface ICrateContext {
    reader: BinaryReader;
    tokens: string[];
    paths: string[];
    version: ICrateVersion;
}

/**
 * Parses a PXR-USDC crate buffer into the same read-only Sdf layer shape produced by the USDA parser.
 * @param data The complete binary crate file data.
 * @param identifier Layer identifier to store on the returned Sdf layer.
 * @returns Parsed Sdf layer data.
 */
export function ParseCrate(data: ArrayBuffer, identifier: string): ISdfLayer {
    const bytes = new Uint8Array(data);
    const reader = new BinaryReader(bytes);
    const bootstrap = ReadBootstrap(reader);
    const sections = ReadTableOfContents(reader, bootstrap.tocOffset);

    const tokens = ReadTokens(reader, sections, bootstrap.version);
    const fields = ReadFields(reader, sections, bootstrap.version);
    const fieldSets = ReadFieldSets(reader, sections, bootstrap.version);
    const paths = ReadPaths(reader, sections, bootstrap.version, tokens);
    const specs = ReadSpecs(reader, sections, bootstrap.version);

    return BuildLayer(identifier, { reader, tokens, paths, version: bootstrap.version }, fields, fieldSets, specs);
}

// Reads and validates the fixed-size crate bootstrap.
function ReadBootstrap(reader: BinaryReader): { version: ICrateVersion; tocOffset: number } {
    if (reader.length < BootstrapSize) {
        throw new Error("USD crate: file is too small to contain a USDC bootstrap.");
    }

    const magic = reader.readAscii(0, CrateMagic.length);
    if (magic !== CrateMagic) {
        throw new Error("USD crate: invalid USDC magic header.");
    }

    const version = {
        major: reader.readUint8At(8),
        minor: reader.readUint8At(9),
        patch: reader.readUint8At(10),
    };
    if (CompareVersion(version, { major: 0, minor: 0, patch: 1 }) < 0) {
        throw new Error(`USD crate: unsupported obsolete USDC version ${FormatVersion(version)}.`);
    }
    if (version.major !== 0) {
        throw new Error(`USD crate: unsupported USDC version ${FormatVersion(version)}.`);
    }

    const tocOffset = reader.readInt64At(16);
    if (!Number.isSafeInteger(tocOffset) || tocOffset < BootstrapSize || tocOffset >= reader.length) {
        throw new Error("USD crate: invalid table-of-contents offset.");
    }

    return { version, tocOffset };
}

// Reads the vector of fixed-size section records at the TOC offset.
function ReadTableOfContents(reader: BinaryReader, tocOffset: number): Map<string, ICrateSection> {
    reader.seek(tocOffset);
    const sectionCount = reader.readUint64();
    ValidateCount(sectionCount, MaxCrateSectionCount, "section");
    const sections = new Map<string, ICrateSection>();
    for (let i = 0; i < sectionCount; i++) {
        const name = reader.readNullTerminatedAscii(SectionNameSize);
        const start = reader.readInt64();
        const size = reader.readInt64();
        if (name.length === 0) {
            throw new Error("USD crate: TOC contains an unnamed section.");
        }
        if (start < BootstrapSize || size < 0 || start + size > reader.length) {
            throw new Error(`USD crate: TOC section '${name}' points outside the file.`);
        }
        sections.set(name, { name, start, size });
    }

    if (reader.offset !== tocOffset + 8 + sectionCount * SectionRecordSize) {
        throw new Error("USD crate: failed to read the expected TOC size.");
    }
    return sections;
}

// Reads the token table. Version 0.4.0 and newer LZ4-compress the null-terminated character slab.
function ReadTokens(reader: BinaryReader, sections: Map<string, ICrateSection>, version: ICrateVersion): string[] {
    const section = GetRequiredSection(sections, "TOKENS");
    reader.seek(section.start);
    const tokenCount = reader.readUint64();
    ValidateTableCount(tokenCount, "token");
    let tokenBytes: Uint8Array;
    if (CompareVersion(version, { major: 0, minor: 4, patch: 0 }) < 0) {
        const byteCount = reader.readUint64();
        tokenBytes = reader.readBytes(byteCount);
    } else {
        const uncompressedSize = reader.readUint64();
        const compressedSize = reader.readUint64();
        tokenBytes = DecompressFromBuffer(reader.readBytes(compressedSize), uncompressedSize);
    }

    const tokens: string[] = [];
    let start = 0;
    for (let i = 0; i < tokenBytes.length && tokens.length < tokenCount; i++) {
        if (tokenBytes[i] === 0) {
            tokens.push(DecodeUtf8(tokenBytes.subarray(start, i)));
            start = i + 1;
        }
    }
    if (tokens.length !== tokenCount) {
        throw new Error(`USD crate: token table declared ${tokenCount} tokens but contained ${tokens.length}.`);
    }
    return tokens;
}

// Reads field records. This POC decodes the record table and only interprets simple inlined values later.
function ReadFields(reader: BinaryReader, sections: Map<string, ICrateSection>, version: ICrateVersion): ICrateField[] {
    const section = sections.get("FIELDS");
    if (!section) {
        return [];
    }

    reader.seek(section.start);
    if (CompareVersion(version, { major: 0, minor: 4, patch: 0 }) < 0) {
        const fieldCount = reader.readUint64();
        ValidateTableCount(fieldCount, "field");
        const fields: ICrateField[] = [];
        for (let i = 0; i < fieldCount; i++) {
            reader.readUint32();
            fields.push({ tokenIndex: reader.readUint32(), valueRep: reader.readBigUint64() });
        }
        return fields;
    }

    const fieldCount = reader.readUint64();
    ValidateTableCount(fieldCount, "field");
    const tokenIndexes = ReadCompressedInt32FromReader(reader, fieldCount);
    const compressedRepSize = reader.readUint64();
    const repBytes = DecompressFromBuffer(reader.readBytes(compressedRepSize), fieldCount * 8);
    const repReader = new BinaryReader(repBytes);
    return tokenIndexes.map((tokenIndex) => ({ tokenIndex, valueRep: repReader.readBigUint64() }));
}

// Reads the flattened fieldset table, which stores field indexes terminated by InvalidIndex.
function ReadFieldSets(reader: BinaryReader, sections: Map<string, ICrateSection>, version: ICrateVersion): number[] {
    const section = sections.get("FIELDSETS");
    if (!section) {
        return [];
    }

    reader.seek(section.start);
    if (CompareVersion(version, { major: 0, minor: 4, patch: 0 }) < 0) {
        const fieldSetCount = reader.readUint64();
        ValidateTableCount(fieldSetCount, "field-set");
        const fieldSets: number[] = [];
        for (let i = 0; i < fieldSetCount; i++) {
            fieldSets.push(reader.readUint32());
        }
        return fieldSets;
    }

    const fieldSetCount = reader.readUint64();
    ValidateTableCount(fieldSetCount, "field-set");
    return ReadCompressedInt32FromReader(reader, fieldSetCount).map((value) => value >>> 0);
}

// Reads Sdf path strings from either the old header stream or the newer compressed path arrays.
function ReadPaths(reader: BinaryReader, sections: Map<string, ICrateSection>, version: ICrateVersion, tokens: string[]): string[] {
    const section = GetRequiredSection(sections, "PATHS");
    reader.seek(section.start);
    const pathCount = reader.readUint64();
    ValidateTableCount(pathCount, "path");
    const paths = new Array<string>(pathCount).fill("");

    if (CompareVersion(version, { major: 0, minor: 4, patch: 0 }) < 0) {
        ReadPathHeaderTree(reader, version, tokens, paths, "");
        return paths;
    }

    const encodedPathCount = reader.readUint64();
    ValidateTableCount(encodedPathCount, "encoded path");
    const pathIndexes = ReadCompressedInt32FromReader(reader, encodedPathCount).map((value) => value >>> 0);
    const elementTokenIndexes = ReadCompressedInt32FromReader(reader, encodedPathCount);
    const jumps = ReadCompressedInt32FromReader(reader, encodedPathCount);
    BuildCompressedPaths(pathIndexes, elementTokenIndexes, jumps, 0, "", tokens, paths);
    return paths;
}

// Reads specs, the table that connects paths to fieldsets and spec kinds.
function ReadSpecs(reader: BinaryReader, sections: Map<string, ICrateSection>, version: ICrateVersion): ICrateSpec[] {
    const section = GetRequiredSection(sections, "SPECS");
    reader.seek(section.start);

    if (CompareVersion(version, { major: 0, minor: 4, patch: 0 }) < 0) {
        const specCount = reader.readUint64();
        ValidateTableCount(specCount, "spec");
        const specs: ICrateSpec[] = [];
        for (let i = 0; i < specCount; i++) {
            specs.push({ pathIndex: reader.readUint32(), fieldSetIndex: reader.readUint32(), specType: reader.readInt32() as CrateSpecType });
        }
        return specs;
    }

    const specCount = reader.readUint64();
    ValidateTableCount(specCount, "spec");
    const pathIndexes = ReadCompressedInt32FromReader(reader, specCount);
    const fieldSetIndexes = ReadCompressedInt32FromReader(reader, specCount);
    const specTypes = ReadCompressedInt32FromReader(reader, specCount);
    return pathIndexes.map((pathIndex, index) => ({
        pathIndex,
        fieldSetIndex: fieldSetIndexes[index] >>> 0,
        specType: specTypes[index] as CrateSpecType,
    }));
}

// Converts the decoded structural tables into the Sdf seam used by the USDA parser.
function BuildLayer(identifier: string, context: ICrateContext, fields: ICrateField[], fieldSets: number[], specs: ICrateSpec[]): ISdfLayer {
    const layer: ISdfLayer = {
        identifier,
        subLayers: [],
        rootPrims: [],
    };
    const primsByPath = new Map<string, ISdfPrimSpec>();
    const propertySpecs: Array<{ path: string; spec: ISdfAttributeSpec | ISdfRelationshipSpec }> = [];

    for (const spec of specs) {
        const path = context.paths[spec.pathIndex];
        if (!path) {
            continue;
        }

        const fieldReps = GetFieldsForSpec(spec, context.tokens, fields, fieldSets);
        if (spec.specType === CrateSpecType.PseudoRoot || path === "/") {
            ApplyLayerFields(layer, fieldReps, context);
        } else if (spec.specType === CrateSpecType.Prim) {
            primsByPath.set(path, CreatePrim(path, fieldReps, context));
        } else if (spec.specType === CrateSpecType.Attribute || spec.specType === CrateSpecType.Relationship) {
            const property = CreateProperty(path, spec.specType, fieldReps, context);
            if (property) {
                propertySpecs.push({ path, spec: property });
            }
        }
    }

    for (const prim of Array.from(primsByPath.values())) {
        const parentPath = GetParentPrimPath(prim.path);
        const parent = parentPath ? primsByPath.get(parentPath) : undefined;
        if (parent) {
            parent.children.push(prim);
        } else {
            layer.rootPrims.push(prim);
        }
    }

    for (const property of propertySpecs) {
        const split = SplitPropertyPath(property.path);
        const owner = primsByPath.get(split.primPath);
        if (owner) {
            owner.properties[split.propertyName] = property.spec;
        }
    }

    return layer;
}

// Creates a prim spec with defaulted fields when the crate fieldset does not author them.
function CreatePrim(path: string, fieldReps: Map<string, bigint>, context: ICrateContext): ISdfPrimSpec {
    const specifierValue = DecodeField(context, fieldReps, "specifier");
    const specifier = specifierValue?.type === "token" ? SpecifierFromString(specifierValue.value) : "def";
    const prim: ISdfPrimSpec = {
        name: GetPathName(path),
        path,
        specifier,
        properties: {},
        children: [],
    };

    const typeName = DecodeField(context, fieldReps, "typeName");
    if (typeName?.type === "token" || typeName?.type === "string") {
        prim.typeName = typeName.value;
    }
    const active = DecodeField(context, fieldReps, "active");
    if (active?.type === "bool") {
        prim.active = active.value;
    }
    const instanceable = DecodeField(context, fieldReps, "instanceable");
    if (instanceable?.type === "bool") {
        prim.instanceable = instanceable.value;
    }
    const kind = DecodeField(context, fieldReps, "kind");
    if (kind?.type === "token" || kind?.type === "string") {
        prim.kind = kind.value;
    }

    return prim;
}

// Creates a property spec, attaching the authored default, time samples, connections, or targets.
function CreateProperty(path: string, specType: CrateSpecType, fieldReps: Map<string, bigint>, context: ICrateContext): ISdfAttributeSpec | ISdfRelationshipSpec | undefined {
    const split = SplitPropertyPath(path);
    if (specType === CrateSpecType.Relationship) {
        const targetRep = fieldReps.get("targetPaths");
        const targets = (targetRep !== undefined ? DecodePathListOp(context, targetRep) : undefined) ?? { isExplicit: true, explicit: [] };
        return { kind: "relationship", name: split.propertyName, path, targets };
    }

    const typeName = DecodeField(context, fieldReps, "typeName");
    const attribute: ISdfAttributeSpec = {
        kind: "attribute",
        name: split.propertyName,
        path,
        typeName: typeName?.type === "token" || typeName?.type === "string" ? typeName.value : "token",
    };

    const defaultValue = DecodeField(context, fieldReps, "default");
    if (defaultValue) {
        attribute.default = defaultValue;
    }
    const timeSamplesRep = fieldReps.get("timeSamples");
    if (timeSamplesRep !== undefined) {
        const timeSamples = DecodeTimeSamples(context, timeSamplesRep);
        if (timeSamples) {
            attribute.timeSamples = timeSamples;
        }
    }
    const connectionRep = fieldReps.get("connectionPaths");
    if (connectionRep !== undefined) {
        const connections = DecodePathListOp(context, connectionRep);
        if (connections) {
            attribute.connections = connections;
        }
    }
    const interpolation = DecodeField(context, fieldReps, "interpolation");
    if (interpolation?.type === "token" && IsInterpolation(interpolation.value)) {
        attribute.interpolation = interpolation.value;
    }
    const colorSpace = DecodeField(context, fieldReps, "colorSpace");
    if (colorSpace?.type === "token" || colorSpace?.type === "string") {
        attribute.colorSpace = colorSpace.value;
    }
    const variability = DecodeField(context, fieldReps, "variability");
    if (variability?.type === "token" && (variability.value === "uniform" || variability.value === "varying")) {
        attribute.variability = variability.value as SdfVariability;
    }
    return attribute;
}

// Promotes known pseudo-root fields to first-class layer fields.
function ApplyLayerFields(layer: ISdfLayer, fieldReps: Map<string, bigint>, context: ICrateContext): void {
    const defaultPrim = DecodeField(context, fieldReps, "defaultPrim");
    if (defaultPrim?.type === "token" || defaultPrim?.type === "string") {
        layer.defaultPrim = defaultPrim.value;
    }
    const upAxis = DecodeField(context, fieldReps, "upAxis");
    if (upAxis?.type === "token" && (upAxis.value === "Y" || upAxis.value === "Z")) {
        layer.upAxis = upAxis.value;
    }
    const metersPerUnit = DecodeField(context, fieldReps, "metersPerUnit");
    if (metersPerUnit?.type === "double" || metersPerUnit?.type === "float") {
        layer.metersPerUnit = metersPerUnit.value;
    }
    const timeCodesPerSecond = DecodeField(context, fieldReps, "timeCodesPerSecond");
    if (timeCodesPerSecond?.type === "double" || timeCodesPerSecond?.type === "float") {
        layer.timeCodesPerSecond = timeCodesPerSecond.value;
    }
    const framesPerSecond = DecodeField(context, fieldReps, "framesPerSecond");
    if (framesPerSecond?.type === "double" || framesPerSecond?.type === "float") {
        layer.framesPerSecond = framesPerSecond.value;
    }
    const startTimeCode = DecodeField(context, fieldReps, "startTimeCode");
    if (startTimeCode?.type === "double" || startTimeCode?.type === "float") {
        layer.startTimeCode = startTimeCode.value;
    }
    const endTimeCode = DecodeField(context, fieldReps, "endTimeCode");
    if (endTimeCode?.type === "double" || endTimeCode?.type === "float") {
        layer.endTimeCode = endTimeCode.value;
    }
}

// Resolves a spec's fieldset into a map of field name to its raw 64-bit ValueRep.
function GetFieldsForSpec(spec: ICrateSpec, tokens: string[], fields: ICrateField[], fieldSets: number[]): Map<string, bigint> {
    const reps = new Map<string, bigint>();
    let fieldSetIndex = spec.fieldSetIndex;
    while (fieldSetIndex < fieldSets.length) {
        const fieldIndex = fieldSets[fieldSetIndex++];
        if (fieldIndex === InvalidIndex) {
            break;
        }
        const field = fields[fieldIndex];
        if (!field) {
            continue;
        }
        const token = tokens[field.tokenIndex];
        if (token) {
            reps.set(token, field.valueRep);
        }
    }
    return reps;
}

// Decodes the named field's ValueRep into a tagged Sdf value, when present.
function DecodeField(context: ICrateContext, fieldReps: Map<string, bigint>, name: string): SdfValue | undefined {
    const rep = fieldReps.get(name);
    return rep === undefined ? undefined : DecodeValue(context, rep);
}

// Decodes a crate ValueRep into a tagged Sdf value: inlined scalar, file-backed scalar, or array.
function DecodeValue(context: ICrateContext, valueRep: bigint): SdfValue | undefined {
    const rep = DecodeValueRep(valueRep);
    if (rep.isArray) {
        return DecodeArrayValue(context, rep);
    }
    if (rep.isInlined) {
        return DecodeInlinedScalar(context, rep);
    }
    return DecodeNonInlinedScalar(context, rep);
}

// Decodes a scalar value whose 32-bit payload directly encodes the value.
function DecodeInlinedScalar(context: ICrateContext, rep: ICrateValueRep): SdfValue | undefined {
    const payload = rep.payload >>> 0;
    switch (rep.type) {
        case CrateValueType.Bool:
            return { type: "bool", value: (payload & 0xff) !== 0 };
        case CrateValueType.Uchar:
            return { type: "int", value: payload & 0xff };
        case CrateValueType.Int:
            return { type: "int", value: payload | 0 };
        case CrateValueType.UInt:
            return { type: "uint", value: payload };
        case CrateValueType.Int64:
            return { type: "int64", value: payload | 0 };
        case CrateValueType.UInt64:
            return { type: "uint64", value: payload };
        case CrateValueType.Half:
            return { type: "half", value: HalfToFloat(payload & 0xffff) };
        case CrateValueType.Float:
            return { type: "float", value: Uint32ToFloat(payload) };
        case CrateValueType.Double:
            return { type: "double", value: Uint32ToFloat(payload) };
        case CrateValueType.String:
            return { type: "string", value: context.tokens[payload] ?? "" };
        case CrateValueType.Token:
            return { type: "token", value: context.tokens[payload] ?? "" };
        case CrateValueType.AssetPath:
            return { type: "asset", value: { authoredPath: context.tokens[payload] ?? "" } };
        case CrateValueType.Specifier:
            return { type: "token", value: ["def", "over", "class"][payload] ?? "def" };
        case CrateValueType.Variability:
            return { type: "token", value: payload === 0 ? "varying" : "uniform" };
        case CrateValueType.Vec2f:
        case CrateValueType.Vec2h:
        case CrateValueType.Vec2i:
            return AsSdfValue("vec2f", InlinedComponents(payload, 2));
        case CrateValueType.Vec2d:
            return AsSdfValue("vec2d", InlinedComponents(payload, 2));
        case CrateValueType.Vec3f:
        case CrateValueType.Vec3h:
        case CrateValueType.Vec3i:
            return AsSdfValue("vec3f", InlinedComponents(payload, 3));
        case CrateValueType.Vec3d:
            return AsSdfValue("vec3d", InlinedComponents(payload, 3));
        case CrateValueType.Vec4f:
        case CrateValueType.Vec4h:
        case CrateValueType.Vec4i:
            return AsSdfValue("vec4f", InlinedComponents(payload, 4));
        case CrateValueType.Vec4d:
            return AsSdfValue("vec4d", InlinedComponents(payload, 4));
        case CrateValueType.Quatf:
        case CrateValueType.Quath:
            return AsSdfValue("quatf", InlinedComponents(payload, 4));
        case CrateValueType.Quatd:
            return AsSdfValue("quatd", InlinedComponents(payload, 4));
        case CrateValueType.Matrix4d:
            return AsSdfValue("matrix4d", DiagonalMatrix(InlinedComponents(payload, 4)));
        default:
            return undefined;
    }
}

// Decodes a scalar value whose payload is a file offset to its raw little-endian bytes.
function DecodeNonInlinedScalar(context: ICrateContext, rep: ICrateValueRep): SdfValue | undefined {
    if (rep.payload === 0) {
        return undefined;
    }
    const reader = context.reader.clone();
    reader.seek(rep.payload);
    switch (rep.type) {
        case CrateValueType.Half:
            return { type: "half", value: HalfToFloat(reader.readUint16()) };
        case CrateValueType.Float:
            return { type: "float", value: reader.readFloat32() };
        case CrateValueType.Double:
            return { type: "double", value: reader.readFloat64() };
        case CrateValueType.Int64:
            return { type: "int64", value: reader.readBigInt64() };
        case CrateValueType.UInt64:
            return { type: "uint64", value: reader.readBigUint64() };
        case CrateValueType.Vec2f:
        case CrateValueType.Vec2h:
        case CrateValueType.Vec2i:
            return AsSdfValue("vec2f", ReadVector(reader, rep.type, 2));
        case CrateValueType.Vec2d:
            return AsSdfValue("vec2d", ReadDoubles(reader, 2));
        case CrateValueType.Vec3f:
        case CrateValueType.Vec3h:
        case CrateValueType.Vec3i:
            return AsSdfValue("vec3f", ReadVector(reader, rep.type, 3));
        case CrateValueType.Vec3d:
            return AsSdfValue("vec3d", ReadDoubles(reader, 3));
        case CrateValueType.Vec4f:
        case CrateValueType.Vec4h:
        case CrateValueType.Vec4i:
            return AsSdfValue("vec4f", ReadVector(reader, rep.type, 4));
        case CrateValueType.Vec4d:
            return AsSdfValue("vec4d", ReadDoubles(reader, 4));
        case CrateValueType.Quatf:
        case CrateValueType.Quath:
            return AsSdfValue("quatf", ReadVector(reader, rep.type, 4));
        case CrateValueType.Quatd:
            return AsSdfValue("quatd", ReadDoubles(reader, 4));
        case CrateValueType.Matrix4d:
            return AsSdfValue("matrix4d", ReadDoubles(reader, 16));
        case CrateValueType.DoubleVector:
            return AsSdfValue("double[]", ReadDoubles(reader, ReadArrayCount(reader, context.version)));
        case CrateValueType.TokenVector:
            return AsSdfValue(
                "token[]",
                ReadIndexArray(reader, ReadArrayCount(reader, context.version)).map((index) => context.tokens[index] ?? "")
            );
        case CrateValueType.StringVector:
            return AsSdfValue(
                "string[]",
                ReadIndexArray(reader, ReadArrayCount(reader, context.version)).map((index) => context.tokens[index] ?? "")
            );
        default:
            return undefined;
    }
}

// Decodes an array ValueRep into a tagged Sdf array value.
function DecodeArrayValue(context: ICrateContext, rep: ICrateValueRep): SdfValue | undefined {
    if (rep.payload === 0) {
        return EmptyArrayValue(rep.type);
    }
    const reader = context.reader.clone();
    reader.seek(rep.payload);
    const count = ReadArrayCount(reader, context.version);
    ValidateTableCount(count, "value array");

    switch (rep.type) {
        case CrateValueType.Bool:
            return { type: "bool[]", value: Array.from(reader.readBytes(count), (byte) => byte !== 0) };
        case CrateValueType.Int:
            return { type: "int[]", value: ReadIntArray(reader, count, rep.isCompressed) };
        case CrateValueType.UInt:
            return { type: "uint[]", value: ReadIntArray(reader, count, rep.isCompressed).map((value) => value >>> 0) };
        case CrateValueType.Int64:
            return AsSdfValue("int64[]", ReadInt64Array(reader, count, rep.isCompressed));
        case CrateValueType.UInt64:
            return AsSdfValue(
                "uint64[]",
                ReadInt64Array(reader, count, rep.isCompressed).map((value) => BigInt.asUintN(64, value))
            );
        case CrateValueType.Half:
            return { type: "half[]", value: ReadFloatingArray(reader, count, rep.isCompressed, ReadHalf) };
        case CrateValueType.Float:
            return { type: "float[]", value: ReadFloatingArray(reader, count, rep.isCompressed, (source) => source.readFloat32()) };
        case CrateValueType.Double:
            return { type: "double[]", value: ReadFloatingArray(reader, count, rep.isCompressed, (source) => source.readFloat64()) };
        case CrateValueType.Vec2f:
        case CrateValueType.Vec2h:
        case CrateValueType.Vec2i:
            return AsSdfValue("vec2f[]", ReadVectorArray(reader, rep.type, count, 2));
        case CrateValueType.Vec2d:
            return AsSdfValue("vec2d[]", ReadDoubleVectorArray(reader, count, 2));
        case CrateValueType.Vec3f:
        case CrateValueType.Vec3h:
        case CrateValueType.Vec3i:
            return AsSdfValue("vec3f[]", ReadVectorArray(reader, rep.type, count, 3));
        case CrateValueType.Vec3d:
            return AsSdfValue("vec3d[]", ReadDoubleVectorArray(reader, count, 3));
        case CrateValueType.Vec4f:
        case CrateValueType.Vec4h:
        case CrateValueType.Vec4i:
            return AsSdfValue("vec4f[]", ReadVectorArray(reader, rep.type, count, 4));
        case CrateValueType.Vec4d:
            return AsSdfValue("vec4d[]", ReadDoubleVectorArray(reader, count, 4));
        case CrateValueType.Quatf:
        case CrateValueType.Quath:
            return AsSdfValue("quatf[]", ReadVectorArray(reader, rep.type, count, 4));
        case CrateValueType.Quatd:
            return AsSdfValue("quatd[]", ReadDoubleVectorArray(reader, count, 4));
        case CrateValueType.Matrix4d:
            return AsSdfValue("matrix4d[]", ReadDoubleVectorArray(reader, count, 16));
        case CrateValueType.Token:
        case CrateValueType.TokenVector:
            return { type: "token[]", value: ReadIndexArray(reader, count).map((index) => context.tokens[index] ?? "") };
        case CrateValueType.String:
            return { type: "string[]", value: ReadIndexArray(reader, count).map((index) => context.tokens[index] ?? "") };
        case CrateValueType.AssetPath:
            return { type: "asset[]", value: ReadIndexArray(reader, count).map((index) => ({ authoredPath: context.tokens[index] ?? "" })) };
        default:
            return undefined;
    }
}

// Decodes a PathListOp ValueRep into ordered relationship targets or attribute connections.
function DecodePathListOp(context: ICrateContext, valueRep: bigint): ISdfListOp<string> | undefined {
    const rep = DecodeValueRep(valueRep);
    if (rep.type !== CrateValueType.PathListOp || rep.payload === 0) {
        return undefined;
    }
    const reader = context.reader.clone();
    reader.seek(rep.payload);
    const header = reader.readUint8();
    const listOp: ISdfListOp<string> = { isExplicit: (header & ListOpExplicitBit) !== 0 };
    const readPaths = (): string[] => {
        const count = reader.readUint64();
        const items: string[] = [];
        for (let i = 0; i < count; i++) {
            items.push(context.paths[reader.readUint32()] ?? "");
        }
        return items;
    };
    if (header & ListOpHasExplicitBit) {
        listOp.explicit = readPaths();
    }
    if (header & ListOpHasAddedBit) {
        listOp.added = readPaths();
    }
    if (header & ListOpHasPrependedBit) {
        listOp.prepended = readPaths();
    }
    if (header & ListOpHasAppendedBit) {
        listOp.appended = readPaths();
    }
    if (header & ListOpHasDeletedBit) {
        listOp.deleted = readPaths();
    }
    if (header & ListOpHasOrderedBit) {
        listOp.ordered = readPaths();
    }
    return listOp;
}

// Decodes a TimeSamples ValueRep into aligned time and value arrays.
function DecodeTimeSamples(context: ICrateContext, valueRep: bigint): ISdfTimeSampleMap | undefined {
    const rep = DecodeValueRep(valueRep);
    if (rep.type !== CrateValueType.TimeSamples || rep.payload === 0) {
        return undefined;
    }
    const reader = context.reader.clone();
    reader.seek(rep.payload);
    const timesEnd = rep.payload + reader.readInt64();
    reader.seek(timesEnd);
    const timesRep = reader.readBigUint64();
    const valuesStart = timesEnd + 8 + reader.readInt64();
    reader.seek(valuesStart);
    const sampleCount = reader.readUint64();
    ValidateTableCount(sampleCount, "time sample");
    const valueReps: bigint[] = [];
    for (let i = 0; i < sampleCount; i++) {
        valueReps.push(reader.readBigUint64());
    }

    const timesValue = DecodeValue(context, timesRep);
    const times = timesValue && Array.isArray(timesValue.value) ? (timesValue.value as unknown[]).map((time) => Number(time)) : [];
    const values: SdfValue[] = [];
    for (const valueSampleRep of valueReps) {
        const sample = DecodeValue(context, valueSampleRep);
        if (sample) {
            values.push(sample);
        }
    }
    const length = Math.min(times.length, values.length);
    return { times: times.slice(0, length), values: values.slice(0, length) };
}

// Extracts the crate ValueRep bit fields.
function DecodeValueRep(valueRep: bigint): ICrateValueRep {
    return {
        isArray: (valueRep & (1n << 63n)) !== 0n,
        isInlined: (valueRep & (1n << 62n)) !== 0n,
        isCompressed: (valueRep & (1n << 61n)) !== 0n,
        type: Number((valueRep >> 48n) & 0xffn),
        payload: Number(valueRep & ((1n << 48n) - 1n)),
    };
}

// Wraps a decoded payload in a tagged Sdf value. The decoder guarantees the payload's runtime
// shape matches the tag, which the shape-based value access layer relies on.
function AsSdfValue(type: SdfValueType, value: unknown): SdfValue {
    return { type, value } as SdfValue;
}

const ListOpExplicitBit = 1 << 0;
const ListOpHasExplicitBit = 1 << 1;
const ListOpHasAddedBit = 1 << 2;
const ListOpHasDeletedBit = 1 << 3;
const ListOpHasOrderedBit = 1 << 4;
const ListOpHasPrependedBit = 1 << 5;
const ListOpHasAppendedBit = 1 << 6;

const FloatArrayIntegerCode = 0x69;
const FloatArrayLookupCode = 0x74;
const MinCompressedArraySize = 16;

// Narrows a decoded token to the Sdf interpolation union.
function IsInterpolation(value: string): value is SdfInterpolation {
    return value === "constant" || value === "uniform" || value === "varying" || value === "vertex" || value === "faceVarying";
}

// Unpacks up to four signed-byte components from the low bytes of an inlined payload.
function InlinedComponents(payload: number, count: number): number[] {
    const components: number[] = [];
    for (let i = 0; i < count; i++) {
        const byte = (payload >> (i * 8)) & 0xff;
        components.push((byte << 24) >> 24);
    }
    return components;
}

// Builds a 4x4 identity matrix with the given inlined diagonal entries.
function DiagonalMatrix(diagonal: number[]): number[] {
    const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    matrix[0] = diagonal[0] ?? 1;
    matrix[5] = diagonal[1] ?? 1;
    matrix[10] = diagonal[2] ?? 1;
    matrix[15] = diagonal[3] ?? 1;
    return matrix;
}

// Converts IEEE 754 half-precision bits to a JavaScript number.
function HalfToFloat(bits: number): number {
    const sign = (bits & 0x8000) >> 15;
    const exponent = (bits & 0x7c00) >> 10;
    const fraction = bits & 0x03ff;
    const signMultiplier = sign === 0 ? 1 : -1;
    if (exponent === 0) {
        return signMultiplier * Math.pow(2, -14) * (fraction / 1024);
    }
    if (exponent === 0x1f) {
        return fraction === 0 ? signMultiplier * Infinity : NaN;
    }
    return signMultiplier * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
}

// Returns a per-component reader for the float/half/int element kind of a vector type.
function ComponentReaderFor(type: CrateValueType): (reader: BinaryReader) => number {
    switch (type) {
        case CrateValueType.Vec2h:
        case CrateValueType.Vec3h:
        case CrateValueType.Vec4h:
        case CrateValueType.Quath:
            return ReadHalf;
        case CrateValueType.Vec2i:
        case CrateValueType.Vec3i:
        case CrateValueType.Vec4i:
            return (reader) => reader.readInt32();
        default:
            return (reader) => reader.readFloat32();
    }
}

// Reads one half-precision element.
function ReadHalf(reader: BinaryReader): number {
    return HalfToFloat(reader.readUint16());
}

// Reads a fixed number of components for a single non-double vector or quaternion.
function ReadVector(reader: BinaryReader, type: CrateValueType, dimension: number): number[] {
    const readComponent = ComponentReaderFor(type);
    const components: number[] = [];
    for (let i = 0; i < dimension; i++) {
        components.push(readComponent(reader));
    }
    return components;
}

// Reads a fixed number of double-precision components.
function ReadDoubles(reader: BinaryReader, count: number): number[] {
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
        values.push(reader.readFloat64());
    }
    return values;
}

// Reads an array of non-double vectors or quaternions as nested component tuples.
function ReadVectorArray(reader: BinaryReader, type: CrateValueType, count: number, dimension: number): number[][] {
    const readComponent = ComponentReaderFor(type);
    const elements: number[][] = [];
    for (let i = 0; i < count; i++) {
        const components: number[] = [];
        for (let j = 0; j < dimension; j++) {
            components.push(readComponent(reader));
        }
        elements.push(components);
    }
    return elements;
}

// Reads an array of double-precision vectors or matrices as nested component tuples.
function ReadDoubleVectorArray(reader: BinaryReader, count: number, dimension: number): number[][] {
    const elements: number[][] = [];
    for (let i = 0; i < count; i++) {
        elements.push(ReadDoubles(reader, dimension));
    }
    return elements;
}

// Reads the version-gated element count that precedes non-inlined array data.
function ReadArrayCount(reader: BinaryReader, version: ICrateVersion): number {
    if (version.major === 0 && version.minor < 5) {
        reader.readUint32();
        return reader.readUint32();
    }
    if (version.major === 0 && version.minor < 7) {
        return reader.readUint32();
    }
    return reader.readUint64();
}

// Reads a 32-bit integer array, decompressing when the rep marks it compressed.
function ReadIntArray(reader: BinaryReader, count: number, isCompressed: boolean): number[] {
    if (isCompressed && count >= MinCompressedArraySize) {
        return ReadCompressedInt32FromReader(reader, count);
    }
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
        values.push(reader.readInt32());
    }
    return values;
}

// Reads a 64-bit integer array, decompressing when the rep marks it compressed.
function ReadInt64Array(reader: BinaryReader, count: number, isCompressed: boolean): bigint[] {
    if (isCompressed && count >= MinCompressedArraySize) {
        const compressedSize = reader.readUint64();
        return DecodeCrateCompressedIntegerBlock64(reader.readBytes(compressedSize), count);
    }
    const values: bigint[] = [];
    for (let i = 0; i < count; i++) {
        values.push(reader.readBigInt64());
    }
    return values;
}

// Reads a float/double/half array, handling integer-coded and lookup-table compression.
function ReadFloatingArray(reader: BinaryReader, count: number, isCompressed: boolean, readElement: (reader: BinaryReader) => number): number[] {
    if (!isCompressed || count < MinCompressedArraySize) {
        const values: number[] = [];
        for (let i = 0; i < count; i++) {
            values.push(readElement(reader));
        }
        return values;
    }
    const code = reader.readUint8();
    if (code === FloatArrayIntegerCode) {
        return ReadCompressedInt32FromReader(reader, count);
    }
    if (code === FloatArrayLookupCode) {
        const lookupSize = reader.readUint32();
        const lookup: number[] = [];
        for (let i = 0; i < lookupSize; i++) {
            lookup.push(readElement(reader));
        }
        const indexes = ReadCompressedInt32FromReader(reader, count);
        return indexes.map((index) => lookup[index] ?? 0);
    }
    throw new Error(`USD crate: unsupported floating array compression code ${code}.`);
}

// Reads a contiguous run of uint32 table indexes.
function ReadIndexArray(reader: BinaryReader, count: number): number[] {
    const indexes: number[] = [];
    for (let i = 0; i < count; i++) {
        indexes.push(reader.readUint32());
    }
    return indexes;
}

// Produces an empty tagged array value matching the rep's element type.
function EmptyArrayValue(type: CrateValueType): SdfValue | undefined {
    const tag = EmptyArrayTag(type);
    return tag ? AsSdfValue(tag, []) : undefined;
}

// Maps a crate array type enum to the matching empty Sdf array tag.
function EmptyArrayTag(type: CrateValueType): SdfValueType | undefined {
    switch (type) {
        case CrateValueType.Bool:
            return "bool[]";
        case CrateValueType.Int:
            return "int[]";
        case CrateValueType.UInt:
            return "uint[]";
        case CrateValueType.Int64:
            return "int64[]";
        case CrateValueType.UInt64:
            return "uint64[]";
        case CrateValueType.Half:
            return "half[]";
        case CrateValueType.Float:
            return "float[]";
        case CrateValueType.Double:
            return "double[]";
        case CrateValueType.Vec2f:
        case CrateValueType.Vec2h:
        case CrateValueType.Vec2i:
            return "vec2f[]";
        case CrateValueType.Vec2d:
            return "vec2d[]";
        case CrateValueType.Vec3f:
        case CrateValueType.Vec3h:
        case CrateValueType.Vec3i:
            return "vec3f[]";
        case CrateValueType.Vec3d:
            return "vec3d[]";
        case CrateValueType.Vec4f:
        case CrateValueType.Vec4h:
        case CrateValueType.Vec4i:
            return "vec4f[]";
        case CrateValueType.Vec4d:
            return "vec4d[]";
        case CrateValueType.Quatf:
        case CrateValueType.Quath:
            return "quatf[]";
        case CrateValueType.Quatd:
            return "quatd[]";
        case CrateValueType.Matrix4d:
            return "matrix4d[]";
        case CrateValueType.Token:
        case CrateValueType.TokenVector:
            return "token[]";
        case CrateValueType.String:
            return "string[]";
        case CrateValueType.AssetPath:
            return "asset[]";
        default:
            return undefined;
    }
}

// Reads a crate compressed integer vector from the current stream position.
function ReadCompressedInt32FromReader(reader: BinaryReader, count: number): number[] {
    const compressedSize = reader.readUint64();
    return DecodeCrateCompressedIntegerBlock32(reader.readBytes(compressedSize), count);
}

// Builds paths from the pre-0.4.0 path header stream.
function ReadPathHeaderTree(
    reader: BinaryReader,
    version: ICrateVersion,
    tokens: string[],
    paths: string[],
    parentPath: string,
    visitedOffsets = new Set<number>(),
    depth = 0
): void {
    if (depth > 1024) {
        throw new Error("USD crate: legacy path tree exceeds the nesting limit.");
    }
    let currentParentPath = parentPath;
    while (true) {
        const headerOffset = reader.offset;
        if (visitedOffsets.has(headerOffset)) {
            throw new Error("USD crate: legacy path tree contains a cycle.");
        }
        visitedOffsets.add(headerOffset);
        const header = ReadPathHeader(reader, version);
        const path = currentParentPath === "" ? "/" : AppendPath(currentParentPath, tokens[header.elementTokenIndex] ?? "", header.isPrimPropertyPath);
        paths[header.pathIndex] = path;

        if (header.hasChild) {
            if (header.hasSibling) {
                const siblingOffset = reader.readInt64();
                if (siblingOffset <= headerOffset || siblingOffset >= reader.length) {
                    throw new Error("USD crate: invalid legacy path sibling offset.");
                }
                ReadPathHeaderTree(reader, version, tokens, paths, path, visitedOffsets, depth + 1);
                const siblingReader = reader.clone();
                siblingReader.seek(siblingOffset);
                ReadPathHeaderTree(siblingReader, version, tokens, paths, currentParentPath, visitedOffsets, depth + 1);
                return;
            }
            currentParentPath = path;
        } else if (!header.hasSibling) {
            break;
        }
    }
}

// Reads one path header, accounting for the 0.0.1 padding bug.
function ReadPathHeader(
    reader: BinaryReader,
    version: ICrateVersion
): { pathIndex: number; elementTokenIndex: number; hasChild: boolean; hasSibling: boolean; isPrimPropertyPath: boolean } {
    if (CompareVersion(version, { major: 0, minor: 0, patch: 1 }) === 0) {
        reader.readUint32();
    }
    const pathIndex = reader.readUint32();
    const elementTokenIndex = reader.readUint32();
    const bits = reader.readUint8();
    reader.skip(3);
    return {
        pathIndex,
        elementTokenIndex,
        hasChild: (bits & 1) !== 0,
        hasSibling: (bits & 2) !== 0,
        isPrimPropertyPath: (bits & 4) !== 0,
    };
}

// Builds paths from the 0.4.0 compressed path arrays.
/**
 * Builds resolved paths from crate 0.4+ compressed path arrays.
 *
 * Exported for unit tests and the intra-module crate reader only; it is not re-exported from the loaders
 * package root and is not public API.
 * @internal
 * @param pathIndexes output path indexes
 * @param elementTokenIndexes token indexes for path elements
 * @param jumps encoded child/sibling traversal jumps
 * @param currentIndex first encoded entry
 * @param parentPath parent path for the first entry
 * @param tokens crate token table
 * @param paths output path table
 * @param visitedIndexes traversal cycle guard
 * @param depth current child depth
 */
export function BuildCompressedPaths(
    pathIndexes: number[],
    elementTokenIndexes: number[],
    jumps: number[],
    currentIndex: number,
    parentPath: string,
    tokens: string[],
    paths: string[],
    visitedIndexes = new Set<number>(),
    depth = 0
): void {
    const pending: Array<{ index: number; parentPath: string; depth: number }> = [{ index: currentIndex, parentPath, depth }];
    while (pending.length > 0) {
        const task = pending.pop()!;
        let index = task.index;
        let currentParentPath = task.parentPath;
        let currentDepth = task.depth;
        while (true) {
            if (currentDepth > 1024) {
                throw new Error("USD crate: compressed path tree exceeds the nesting limit.");
            }
            if (!Number.isInteger(index) || index < 0 || index >= pathIndexes.length || visitedIndexes.has(index)) {
                throw new Error("USD crate: invalid or cyclic compressed path tree.");
            }
            visitedIndexes.add(index);
            const pathIndex = pathIndexes[index];
            const rawTokenIndex = elementTokenIndexes[index];
            const isPrimPropertyPath = rawTokenIndex < 0;
            const tokenIndex = Math.abs(rawTokenIndex);
            const path = currentParentPath === "" ? "/" : AppendPath(currentParentPath, tokens[tokenIndex] ?? "", isPrimPropertyPath);
            paths[pathIndex] = path;

            const jump = jumps[index];
            const hasChild = jump > 0 || jump === -1;
            const hasSibling = jump >= 0;
            if (hasChild) {
                if (hasSibling) {
                    const siblingIndex = index + jump;
                    if (jump <= 0 || siblingIndex <= index || siblingIndex >= pathIndexes.length) {
                        throw new Error("USD crate: invalid compressed path sibling jump.");
                    }
                    pending.push({ index: siblingIndex, parentPath: currentParentPath, depth: currentDepth });
                }
                currentParentPath = path;
                currentDepth++;
            } else if (!hasSibling) {
                break;
            }
            index++;
        }
    }
}

// Appends either a child prim element or a property element to a parent path.
function AppendPath(parentPath: string, token: string, isPrimPropertyPath: boolean): string {
    if (isPrimPropertyPath) {
        return `${parentPath}.${token}`;
    }
    return parentPath === "/" ? `/${token}` : `${parentPath}/${token}`;
}

// Reads a mandatory structural section.
function GetRequiredSection(sections: Map<string, ICrateSection>, name: string): ICrateSection {
    const section = sections.get(name);
    if (!section) {
        throw new Error(`USD crate: missing required '${name}' section.`);
    }
    return section;
}

function ValidateTableCount(count: number, tableName: string): void {
    ValidateCount(count, MaxCrateTableEntries, `${tableName} table`);
}

function ValidateCount(count: number, maximum: number, name: string): void {
    if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error(`USD crate: invalid ${name} count.`);
    }
    if (count > maximum) {
        throw new Error(`USD crate: ${name} count exceeds the ${maximum}-entry resource cap.`);
    }
}

// Compares crate semantic versions.
function CompareVersion(left: ICrateVersion, right: ICrateVersion): number {
    return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

// Formats a crate version for diagnostics.
function FormatVersion(version: ICrateVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

// Converts a crate specifier token to the Sdf seam's specifier union.
function SpecifierFromString(value: string): SdfSpecifier {
    return value === "over" || value === "class" ? value : "def";
}

// Returns a prim or property leaf name.
function GetPathName(path: string): string {
    const slash = path.lastIndexOf("/");
    return slash >= 0 ? path.slice(slash + 1) : path;
}

// Returns the parent prim path, or undefined for root prims.
function GetParentPrimPath(path: string): string | undefined {
    const slash = path.lastIndexOf("/");
    if (slash <= 0) {
        return undefined;
    }
    return path.slice(0, slash);
}

// Splits a USD property path into owner prim path and property name.
function SplitPropertyPath(path: string): { primPath: string; propertyName: string } {
    const dot = path.indexOf(".");
    if (dot < 0) {
        return { primPath: GetParentPrimPath(path) ?? "/", propertyName: GetPathName(path) };
    }
    return { primPath: path.slice(0, dot), propertyName: path.slice(dot + 1) };
}

// Decodes UTF-8 bytes in environments where TextDecoder is available.
function DecodeUtf8(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}

// Reinterprets a uint32 payload as a little-endian float32.
function Uint32ToFloat(value: number): number {
    const bytes = new Uint8Array(4);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, value, true);
    return view.getFloat32(0, true);
}

class BinaryReader {
    public offset = 0;
    private readonly _view: DataView;

    public constructor(private readonly _bytes: Uint8Array) {
        this._view = new DataView(_bytes.buffer, _bytes.byteOffset, _bytes.byteLength);
    }

    public get length(): number {
        return this._bytes.length;
    }

    public clone(): BinaryReader {
        const reader = new BinaryReader(this._bytes);
        reader.offset = this.offset;
        return reader;
    }

    public seek(offset: number): void {
        this._ensure(offset, 0);
        this.offset = offset;
    }

    public skip(byteCount: number): void {
        this._ensure(this.offset, byteCount);
        this.offset += byteCount;
    }

    public readUint8(): number {
        this._ensure(this.offset, 1);
        return this._bytes[this.offset++];
    }

    public readUint8At(offset: number): number {
        this._ensure(offset, 1);
        return this._bytes[offset];
    }

    public readUint32(): number {
        this._ensure(this.offset, 4);
        const value = this._view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    public readInt32(): number {
        this._ensure(this.offset, 4);
        const value = this._view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    public readUint16(): number {
        this._ensure(this.offset, 2);
        const value = this._view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    public readFloat32(): number {
        this._ensure(this.offset, 4);
        const value = this._view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    public readFloat64(): number {
        this._ensure(this.offset, 8);
        const value = this._view.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }

    public readUint64(): number {
        const value = this.readBigUint64();
        if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
            throw new Error("USD crate: integer exceeds JavaScript safe integer range.");
        }
        return Number(value);
    }

    public readInt64(): number {
        const value = this.readBigInt64();
        if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
            throw new Error("USD crate: integer exceeds JavaScript safe integer range.");
        }
        return Number(value);
    }

    public readInt64At(offset: number): number {
        this._ensure(offset, 8);
        const value = this._view.getBigInt64(offset, true);
        if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
            throw new Error("USD crate: integer exceeds JavaScript safe integer range.");
        }
        return Number(value);
    }

    public readBigUint64(): bigint {
        this._ensure(this.offset, 8);
        const value = this._view.getBigUint64(this.offset, true);
        this.offset += 8;
        return value;
    }

    public readBigInt64(): bigint {
        this._ensure(this.offset, 8);
        const value = this._view.getBigInt64(this.offset, true);
        this.offset += 8;
        return value;
    }

    public readBytes(byteCount: number): Uint8Array {
        this._ensure(this.offset, byteCount);
        const bytes = this._bytes.subarray(this.offset, this.offset + byteCount);
        this.offset += byteCount;
        return bytes;
    }

    public readAscii(offset: number, byteCount: number): string {
        this._ensure(offset, byteCount);
        return String.fromCharCode(...this._bytes.subarray(offset, offset + byteCount));
    }

    public readNullTerminatedAscii(byteCount: number): string {
        const bytes = this.readBytes(byteCount);
        const zero = bytes.indexOf(0);
        const end = zero >= 0 ? zero : bytes.length;
        return String.fromCharCode(...bytes.subarray(0, end));
    }

    private _ensure(offset: number, byteCount: number): void {
        if (offset < 0 || byteCount < 0 || offset + byteCount > this._bytes.length) {
            throw new Error("USD crate: unexpected end of file.");
        }
    }
}
