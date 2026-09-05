import { AnalyticPrimitiveType, Command, MISSING_OFFSET, PrimitiveAxis } from "loaders/USD/usdCommandProtocol";

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
        for (let index = 0; index < 9; ++index) {
            writer.u32(MISSING_OFFSET);
        }
    });

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

    return { commands: commands.finish(), data: data.toArrayBuffer() };
}
