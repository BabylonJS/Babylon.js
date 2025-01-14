import type { TypedArray } from "core/types";
import type { AccessorComponentType, AccessorType, IAccessor, IBufferView } from "babylonjs-gltf2interface";

type IPropertyWithBufferView = {
    bufferView?: number;
    [key: string]: any;
};

/**
 * Utility class to centralize the management of binary data, bufferViews, and the objects that reference them.
 * TODO: Rename to BufferManager..?
 * @internal
 */
export class DataWriter {
    // BufferView -> data
    private _bufferViewToData: Map<IBufferView, TypedArray> = new Map<IBufferView, TypedArray>();

    // BufferView -> glTF objects
    private _bufferViewToProperties: Map<IBufferView, IPropertyWithBufferView[]> = new Map<IBufferView, IPropertyWithBufferView[]>();

    // Accessor -> bufferView
    private _accessorToBufferView: Map<IAccessor, IBufferView> = new Map<IAccessor, IBufferView>();

    /**
     * Generates a binary buffer from the stored bufferViews. Also creates in the bufferViews list.
     * @param bufferViews The list of bufferViews to be populated while writing the binary
     * @returns The binary buffer
     */
    public generateBinary(bufferViews: IBufferView[]): Uint8Array {
        // Allocate the ArrayBuffer
        let totalByteLength = 0;
        for (const bufferView of this._bufferViewToData.keys()) {
            bufferView.byteOffset = totalByteLength;
            totalByteLength += bufferView.byteLength;
        }
        const buffer = new ArrayBuffer(totalByteLength);
        const dataView = new DataView(buffer); // To write in little endian

        // Fill in the bufferViews list and missing bufferView index references while writing the binary
        let byteOffset = 0;
        for (const [bufferView, data] of this._bufferViewToData.entries()) {
            bufferView.byteOffset = byteOffset;
            bufferViews.push(bufferView);

            const bufferViewIndex = bufferViews.length - 1;
            const properties = this._bufferViewToProperties.get(bufferView)!;
            for (const object of properties) {
                object.bufferView = bufferViewIndex;
            }

            const type = data.constructor.name;
            for (let i = 0; i < data.length; i++) {
                const value = data[i];
                switch (type) {
                    case "Int8Array":
                        dataView.setInt8(byteOffset, value);
                        byteOffset += 1;
                        break;
                    case "Uint8Array":
                        dataView.setUint8(byteOffset, value);
                        byteOffset += 1;
                        break;
                    case "Int16Array":
                        dataView.setInt16(byteOffset, value, true);
                        byteOffset += 2;
                        break;
                    case "Uint16Array":
                        dataView.setUint16(byteOffset, value, true);
                        byteOffset += 2;
                        break;
                    case "Int32Array":
                        dataView.setInt32(byteOffset, value, true);
                        byteOffset += 4;
                        break;
                    case "Uint32Array":
                        dataView.setUint32(byteOffset, value, true);
                        byteOffset += 4;
                        break;
                    case "Float32Array":
                        dataView.setFloat32(byteOffset, value, true);
                        byteOffset += 4;
                        break;
                    case "Float64Array":
                        dataView.setFloat64(byteOffset, value, true);
                        byteOffset += 8;
                        break;
                    default:
                        throw new Error("Unsupported TypedArray type: " + type);
                }
            }

            this._bufferViewToData.delete(bufferView);
        }

        return new Uint8Array(buffer, 0, byteOffset);
    }

    /**
     * Creates a buffer view based on the supplied arguments
     * @param data a TypedArray to create the bufferView for
     * @param byteStride byte distance between consecutive elements
     * @returns bufferView for glTF
     */
    public createBufferView(data: TypedArray, byteStride?: number): IBufferView {
        const bufferView: IBufferView = {
            buffer: 0,
            byteOffset: undefined, // byteOffset will be set later, when we write the binary and decide bufferView ordering
            byteLength: data.byteLength,
            byteStride: byteStride,
        };
        this._bufferViewToData.set(bufferView, data);
        return bufferView;
    }

    /**
     * Creates an accessor based on the supplied arguments and assigns it to the bufferView
     * @param bufferView The glTF bufferView referenced by this accessor
     * @param type The type of the accessor
     * @param componentType The datatype of components in the attribute
     * @param count The number of attributes referenced by this accessor
     * @param byteOffset The offset relative to the start of the bufferView in bytes
     * @param minMax Minimum and maximum value of each component in this attribute
     * @param normalized Specifies whether integer data values are normalized before usage
     * @returns accessor for glTF
     */
    public createAccessor(
        bufferView: IBufferView,
        type: AccessorType,
        componentType: AccessorComponentType,
        count: number,
        byteOffset?: number,
        minMax?: { min: number[]; max: number[] },
        normalized?: boolean
    ): IAccessor {
        if (!this._bufferViewToData.has(bufferView)) {
            throw new Error(`BufferView ${bufferView} not found in DataWriter.`);
        }

        const accessor: IAccessor = {
            bufferView: undefined, // bufferView will be set to a real index later, once we write the binary and decide bufferView ordering
            componentType: componentType,
            count: count,
            type: type,
            min: minMax?.min,
            max: minMax?.max,
            normalized: normalized,
            byteOffset: byteOffset,
        };
        this.setBufferView(accessor, bufferView);
        this._accessorToBufferView.set(accessor, bufferView);
        return accessor;
    }

    /**
     * Assigns a bufferView to a glTF object
     * @param object The glTF object
     * @param bufferView The bufferView to assign
     */
    public setBufferView(object: IPropertyWithBufferView, bufferView: IBufferView) {
        if (!this._bufferViewToData.has(bufferView)) {
            throw new Error(`BufferView ${bufferView} not found in DataWriter.`);
        }
        const properties = this._bufferViewToProperties.get(bufferView) ?? [];
        properties.push(object);
        this._bufferViewToProperties.set(bufferView, properties);
    }

    public getBufferView(accessor: IAccessor): IBufferView {
        const bufferView = this._accessorToBufferView.get(accessor);
        if (!bufferView) {
            throw new Error(`Accessor ${accessor} not found in DataWriter.`);
        }
        return bufferView;
    }

    public getProperties(bufferView: IBufferView): IPropertyWithBufferView[] {
        return this._bufferViewToProperties.get(bufferView) ?? [];
    }

    public getData(bufferView: IBufferView): TypedArray {
        const data = this._bufferViewToData.get(bufferView);
        if (!data) {
            throw new Error(`BufferView ${bufferView} not found in DataWriter.`);
        }
        return data;
    }

    /**
     * Removes buffer view from the binary.
     * Warning: This will also remove the bufferView info from all object that reference it.
     * @param bufferView the bufferView to remove
     */
    public removeBufferView(bufferView: IBufferView): void {
        if (!this._bufferViewToData.has(bufferView)) {
            throw new Error(`BufferView ${bufferView} not found in DataWriter.`);
        }

        const properties = this._bufferViewToProperties.get(bufferView);
        if (properties) {
            for (const object of properties) {
                if (object.bufferView) {
                    delete object.bufferView;
                }
            }
        }

        this._bufferViewToData.delete(bufferView);
        this._bufferViewToProperties.delete(bufferView);
        this._accessorToBufferView.forEach((bv, accessor) => {
            if (bv === bufferView) {
                // Additionally, remove byteOffset from accessor referencing this bufferView
                if (accessor.byteOffset) {
                    delete accessor.byteOffset;
                }
                this._accessorToBufferView.delete(accessor);
            }
        });
    }
}
