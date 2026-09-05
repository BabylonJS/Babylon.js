/* eslint-disable @typescript-eslint/naming-convention */

export const COMMAND_MAGIC = 0x42445355;
export const PROTOCOL_VERSION = 4;
export const MISSING_OFFSET = 0xffffffff;

export const enum Command {
    Scene = 1,
    Texture = 2,
    Material = 3,
    TransformNode = 4,
    Skeleton = 5,
    Geometry = 6,
    Mesh = 7,
    Instance = 8,
    Animation = 9,
    AnalyticPrimitive = 10,
}

export const enum AnalyticPrimitiveType {
    Cube = 0,
    Sphere = 1,
    Cylinder = 2,
    Cone = 3,
}

export const enum PrimitiveAxis {
    X = 0,
    Y = 1,
    Z = 2,
}

export const enum AnimationTarget {
    Node = 0,
    Bone = 1,
}

export const enum AnimationProperty {
    Position = 0,
    RotationQuaternion = 1,
    Scaling = 2,
    Matrix = 3,
}

export const enum MaterialFlags {
    DoubleSided = 1 << 0,
    Unlit = 1 << 1,
    AlphaBlend = 1 << 2,
}

export const enum MeshFlags {
    DoubleSided = 1 << 0,
    LeftHanded = 1 << 1,
}

export const enum GeometryFlags {
    Normals = 1 << 0,
    Tangents = 1 << 1,
    Uv0 = 1 << 2,
    Colors = 1 << 3,
    Skin0 = 1 << 4,
    Skin1 = 1 << 5,
}

export interface CommandRecord {
    opcode: Command;
    flags: number;
    payloadOffset: number;
    payloadLength: number;
}

function expectedPayloadLength(opcode: Command): number {
    switch (opcode) {
        case Command.Scene:
            return 12;
        case Command.Texture:
            return 40;
        case Command.Material:
            return 76;
        case Command.TransformNode:
        case Command.Skeleton:
            return 20;
        case Command.Geometry:
            return 60;
        case Command.Mesh:
            return 40;
        case Command.Instance:
            return 16;
        case Command.Animation:
            return 32;
        case Command.AnalyticPrimitive:
            return 44;
        default:
            throw new Error(`Unknown OpenUSD Babylon command opcode ${opcode}.`);
    }
}

export function readCommands(buffer: ArrayBuffer): CommandRecord[] {
    const view = new DataView(buffer);
    if (view.byteLength < 16 || view.getUint32(0, true) !== COMMAND_MAGIC) {
        throw new Error("Invalid OpenUSD Babylon command buffer.");
    }
    if (view.getUint16(4, true) !== PROTOCOL_VERSION) {
        throw new Error(`Unsupported OpenUSD Babylon protocol ${view.getUint16(4, true)}.`);
    }
    const count = view.getUint32(8, true);
    const commands: CommandRecord[] = [];
    let offset = 16;
    for (let index = 0; index < count; ++index) {
        if (offset + 8 > view.byteLength) {
            throw new Error("Truncated OpenUSD Babylon command header.");
        }
        const opcode = view.getUint16(offset, true) as Command;
        const flags = view.getUint16(offset + 2, true);
        const payloadLength = view.getUint32(offset + 4, true);
        const payloadOffset = offset + 8;
        const expectedLength = expectedPayloadLength(opcode);
        if (payloadLength !== expectedLength) {
            throw new Error(`Invalid payload length ${payloadLength} for command ${opcode}; ` + `expected ${expectedLength}.`);
        }
        if (payloadOffset + payloadLength > view.byteLength) {
            throw new Error("Truncated OpenUSD Babylon command payload.");
        }
        commands.push({ opcode, flags, payloadOffset, payloadLength });
        offset = payloadOffset + payloadLength;
    }
    if (offset !== view.byteLength) {
        throw new Error("Unexpected trailing data in OpenUSD Babylon command buffer.");
    }
    return commands;
}

export class PayloadReader {
    readonly #view: DataView;
    readonly #end: number;
    offset: number;

    constructor(buffer: ArrayBuffer, offset: number, length: number) {
        this.#view = new DataView(buffer);
        this.offset = offset;
        this.#end = offset + length;
    }

    u32(): number {
        this.#require(4);
        const value = this.#view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    f32(): number {
        this.#require(4);
        const value = this.#view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    #require(byteLength: number): void {
        if (this.offset + byteLength > this.#end) {
            throw new Error("OpenUSD Babylon command payload read exceeded its bounds.");
        }
    }
}
