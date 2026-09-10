import {
    AnalyticPrimitiveType,
    AnimationProperty,
    AnimationTarget,
    Command,
    GeometryFlags,
    MaterialFlags,
    MISSING_OFFSET,
    PrimitiveAxis,
    TextureOutputChannel,
    USDTextureColorSpace,
} from "loaders/USD/usdCommandProtocol";

class BufferWriter {
    public readonly bytes: number[] = [];

    public get size(): number {
        return this.bytes.length;
    }

    public align(alignment = 4): void {
        while (this.bytes.length % alignment !== 0) {
            this.bytes.push(0);
        }
    }

    public u16(value: number): void {
        this.bytes.push(value & 0xff, (value >>> 8) & 0xff);
    }

    public u32(value: number): void {
        this.bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
    }

    public f32(value: number): void {
        const buffer = new ArrayBuffer(4);
        new DataView(buffer).setFloat32(0, value, true);
        this.bytes.push(...new Uint8Array(buffer));
    }

    public patchU32(offset: number, value: number): void {
        this.bytes[offset] = value & 0xff;
        this.bytes[offset + 1] = (value >>> 8) & 0xff;
        this.bytes[offset + 2] = (value >>> 16) & 0xff;
        this.bytes[offset + 3] = (value >>> 24) & 0xff;
    }

    public appendString(value: string): { offset: number; length: number } {
        const encoded = new TextEncoder().encode(value);
        const offset = this.size;
        this.bytes.push(...encoded);
        return { offset, length: encoded.length };
    }

    public floats(values: readonly number[]): number {
        this.align();
        const offset = this.size;
        values.forEach((value) => this.f32(value));
        return offset;
    }

    public uints(values: readonly number[], width: 2 | 4 = 4): number {
        this.align();
        const offset = this.size;
        values.forEach((value) => (width === 2 ? this.u16(value) : this.u32(value)));
        return offset;
    }

    public toArrayBuffer(): ArrayBuffer {
        return Uint8Array.from(this.bytes).buffer;
    }
}

class CommandWriter {
    private readonly _writer = new BufferWriter();
    private _commandCount = 0;

    public constructor() {
        this._writer.u32(0x42445355);
        this._writer.u16(4);
        this._writer.u16(0);
        this._writer.u32(0);
        this._writer.u32(0);
    }

    public command(opcode: Command, writePayload: (writer: BufferWriter) => void): void {
        this._writer.u16(opcode);
        this._writer.u16(0);
        const lengthOffset = this._writer.size;
        this._writer.u32(0);
        const payloadStart = this._writer.size;
        writePayload(this._writer);
        this._writer.patchU32(lengthOffset, this._writer.size - payloadStart);
        this._commandCount++;
    }

    public finish(): ArrayBuffer {
        this._writer.patchU32(8, this._commandCount);
        return this._writer.toArrayBuffer();
    }
}

const _identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export interface USDTestBuffers {
    commands: ArrayBuffer;
    data: ArrayBuffer;
}

export function createUSDTestBuffers(): USDTestBuffers {
    const commands = new CommandWriter();
    const data = new BufferWriter();

    commands.command(Command.Scene, (writer) => {
        writer.u32(0);
        writer.f32(1);
        writer.f32(24);
    });

    data.align();
    const baseOffset = data.size;
    data.f32(0.2);
    data.f32(0.6);
    data.f32(0.9);
    data.f32(1);
    const emissiveOffset = data.size;
    data.f32(0);
    data.f32(0);
    data.f32(0);
    const materialName = data.appendString("USD test material");
    commands.command(Command.Material, (writer) => {
        writer.u32(0);
        writer.u32(materialName.offset);
        writer.u32(materialName.length);
        writer.u32(baseOffset);
        writer.u32(emissiveOffset);
        writer.f32(0);
        writer.f32(0.5);
        writer.f32(1);
        writer.f32(0);
        writer.u32(0);
        for (let index = 0; index < 14; ++index) {
            writer.u32(MISSING_OFFSET);
        }
    });
    addUSDTestPrimitives(commands, data);
    return { commands: commands.finish(), data: data.toArrayBuffer() };
}
export function createUSDMeshTestBuffers(withTextures = false, separateMaterialTextures = false, processedMaterialTextures = false): USDTestBuffers {
    const commands = new CommandWriter();
    const data = new BufferWriter();
    const name = data.appendString("Skinned quad");
    const identityOffset = data.floats(_identity);
    const childMatrix = [..._identity];
    childMatrix[13] = 1;
    const childOffset = data.floats(childMatrix);

    commands.command(Command.Scene, (writer) => {
        writer.u32(0);
        writer.f32(1);
        writer.f32(24);
    });
    commands.command(Command.TransformNode, (writer) => {
        [1, MISSING_OFFSET, name.offset, name.length, identityOffset].forEach((value) => writer.u32(value));
    });

    if (withTextures) {
        // Encoded PNG bytes; unit tests control decoding at the engine boundary.
        const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64"));
        const imageOffset = data.size;
        data.bytes.push(...png);
        const transformOffset = data.floats([2, 3, 0.1, 0.2, Math.PI / 4]);
        const valueTransformOffset = data.floats([1, 1, 1, 1, 0, 0, 0, 0]);
        const normalValueTransformOffset = data.floats([2, 2, 2, 1, -1, -1, -1, 0]);
        const metallicValueTransformOffset = data.floats([0.75, 1, 1, 1, 0, 0, 0, 0]);
        const roughnessValueTransformOffset = data.floats([0.5, 1, 1, 1, 0, 0, 0, 0]);
        const processedMetallicTransformOffset = data.floats([1, 0.6, 1, 1, 0, 0.2, 0, 0]);
        const processedRoughnessTransformOffset = data.floats([1, 1, 0.5, 1, 0, 0, 0.1, 0]);
        const processedOcclusionTransformOffset = data.floats([1, 1, 1, 0.8, 0, 0, 0, 0.1]);
        const textureCount = separateMaterialTextures ? 5 : 3;
        for (let id = 1; id <= textureCount; ++id) {
            commands.command(Command.Texture, (writer) => {
                [
                    id,
                    name.offset,
                    name.length,
                    1,
                    imageOffset,
                    png.length,
                    0,
                    transformOffset,
                    1,
                    2,
                    id === 1 ? USDTextureColorSpace.SRGB : USDTextureColorSpace.Raw,
                    id === 2
                        ? normalValueTransformOffset
                        : separateMaterialTextures && id === 3
                          ? processedMaterialTextures
                              ? processedMetallicTransformOffset
                              : metallicValueTransformOffset
                          : separateMaterialTextures && id === 4
                            ? processedMaterialTextures
                                ? processedRoughnessTransformOffset
                                : roughnessValueTransformOffset
                            : separateMaterialTextures && id === 5 && processedMaterialTextures
                              ? processedOcclusionTransformOffset
                              : valueTransformOffset,
                ].forEach((value) => writer.u32(value));
            });
        }
    }

    const baseOffset = data.floats([0.2, 0.6, 0.9, 0.8]);
    const emissiveOffset = data.floats([0.1, 0.2, 0.3]);
    for (let id = 1; id <= 2; ++id) {
        commands.command(Command.Material, (writer) => {
            [id, name.offset, name.length, baseOffset, emissiveOffset].forEach((value) => writer.u32(value));
            [withTextures ? 1 : 0.4, withTextures ? 1 : 0.6, 0.7, id === 2 ? 0.5 : 0].forEach((value) => writer.f32(value));
            writer.u32(id === 1 ? MaterialFlags.AlphaBlend : MaterialFlags.DoubleSided | MaterialFlags.Unlit);
            const textureIds = withTextures
                ? separateMaterialTextures
                    ? [1, id === 2 ? 1 : MISSING_OFFSET, 2, 3, 4, 5, 1]
                    : [1, id === 2 ? 1 : MISSING_OFFSET, 2, 3, 3, 3, 1]
                : Array<number>(7).fill(MISSING_OFFSET);
            textureIds.forEach((value) => writer.u32(value));
            const channels = withTextures
                ? [
                      TextureOutputChannel.RGB,
                      id === 2 ? TextureOutputChannel.A : MISSING_OFFSET,
                      TextureOutputChannel.RGB,
                      separateMaterialTextures ? (processedMaterialTextures ? TextureOutputChannel.G : TextureOutputChannel.R) : TextureOutputChannel.B,
                      separateMaterialTextures ? (processedMaterialTextures ? TextureOutputChannel.B : TextureOutputChannel.R) : TextureOutputChannel.G,
                      processedMaterialTextures ? TextureOutputChannel.A : TextureOutputChannel.R,
                      TextureOutputChannel.RGB,
                  ]
                : Array<number>(7).fill(MISSING_OFFSET);
            channels.forEach((value) => writer.u32(value));
        });
    }

    const jointsOffset = data.uints([MISSING_OFFSET, 10, name.offset, name.length, identityOffset, 0, 11, name.offset, name.length, childOffset]);
    commands.command(Command.Skeleton, (writer) => {
        [1, name.offset, name.length, 2, jointsOffset].forEach((value) => writer.u32(value));
    });

    const positions = data.floats([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
    const normals = data.floats(Array(4).fill([0, 0, 1]).flat());
    const tangents = data.floats(Array(4).fill([1, 0, 0, 1]).flat());
    const uv0 = data.floats([0, 0, 1, 0, 1, 1, 0, 1]);
    const colors = data.floats(Array(4).fill([1, 0.5, 0.25, 1]).flat());
    const joints0 = data.uints(Array(4).fill([0, 1, 0, 1]).flat(), 2);
    const weights0 = data.floats(Array(4).fill([0.5, 0.1, 0.1, 0.1]).flat());
    const joints1 = data.uints(Array(4).fill([1, 0, 1, 0]).flat(), 2);
    const weights1 = data.floats(Array(4).fill([0.05, 0.05, 0.05, 0.05]).flat());
    const indices = data.uints([0, 1, 2, 0, 2, 3]);
    const subsets = data.uints([1, 0, 3, 0, 4, 2, 3, 3, 0, 4]);
    commands.command(Command.Geometry, (writer) => {
        const flags = GeometryFlags.Normals | GeometryFlags.Tangents | GeometryFlags.Uv0 | GeometryFlags.Colors | GeometryFlags.Skin0 | GeometryFlags.Skin1;
        [1, 4, 6, flags, positions, normals, tangents, uv0, colors, joints0, weights0, joints1, weights1, indices, 8].forEach((value) => writer.u32(value));
    });
    commands.command(Command.Mesh, (writer) => {
        [1, 1, 1, MISSING_OFFSET, name.offset, name.length, 0, 1, subsets, 2].forEach((value) => writer.u32(value));
    });
    commands.command(Command.Instance, (writer) => {
        [1, 1, name.offset, name.length].forEach((value) => writer.u32(value));
    });

    const times = data.floats([0, 24]);
    const movedMatrix = [..._identity];
    movedMatrix[12] = 2;
    const nodeMatrices = data.floats([..._identity, ...movedMatrix]);
    const movedChild = [...childMatrix];
    movedChild[13] = 3;
    const boneMatrices = data.floats([...childMatrix, ...movedChild]);
    for (const [kind, target, values] of [
        [AnimationTarget.Node, 1, nodeMatrices],
        [AnimationTarget.Bone, 11, boneMatrices],
    ]) {
        commands.command(Command.Animation, (writer) => {
            [kind, target, AnimationProperty.Matrix, 0, 2, times, values, 16].forEach((value) => writer.u32(value));
        });
    }

    return { commands: commands.finish(), data: data.toArrayBuffer() };
}

export function createUSDSeparateMaterialTestBuffers(): USDTestBuffers {
    return createUSDMeshTestBuffers(true, true);
}

export function createUSDProcessedMaterialTestBuffers(): USDTestBuffers {
    return createUSDMeshTestBuffers(true, true, true);
}

function addUSDTestPrimitives(commands: CommandWriter, data: BufferWriter): void {
    const nodeNames = ["CubeNode", "SphereNode", "CylinderNode", "ConeNode", "InstanceNode"];
    nodeNames.forEach((name, index) => {
        const nodeName = data.appendString(name);
        data.align();
        const matrixOffset = data.size;
        const matrix = [..._identity];
        matrix[1] = index === 0 ? 0.25 : 0;
        matrix[12] = index * 3;
        matrix.forEach((value) => data.f32(value));
        commands.command(Command.TransformNode, (writer) => {
            writer.u32(index + 1);
            writer.u32(MISSING_OFFSET);
            writer.u32(nodeName.offset);
            writer.u32(nodeName.length);
            writer.u32(matrixOffset);
        });
    });

    const primitives = [
        { type: AnalyticPrimitiveType.Cube, axis: PrimitiveAxis.Y, size: 2, height: 0, name: "Cube" },
        { type: AnalyticPrimitiveType.Sphere, axis: PrimitiveAxis.Y, size: 1.5, height: 0, name: "Sphere" },
        { type: AnalyticPrimitiveType.Cylinder, axis: PrimitiveAxis.Z, size: 1, height: 3, name: "Cylinder" },
        { type: AnalyticPrimitiveType.Cone, axis: PrimitiveAxis.X, size: 1.25, height: 4, name: "Cone" },
    ];
    primitives.forEach((primitive, index) => {
        const name = data.appendString(primitive.name);
        commands.command(Command.AnalyticPrimitive, (writer) => {
            writer.u32(index + 1);
            writer.u32(index + 1);
            writer.u32(primitive.type);
            writer.u32(0);
            writer.u32(name.offset);
            writer.u32(name.length);
            writer.u32(0);
            writer.u32(primitive.axis);
            writer.f32(primitive.size);
            writer.f32(primitive.height);
            writer.u32(32);
        });
    });

    const instanceName = data.appendString("Cube instance");
    commands.command(Command.Instance, (writer) => {
        writer.u32(1);
        writer.u32(5);
        writer.u32(instanceName.offset);
        writer.u32(instanceName.length);
    });
}
