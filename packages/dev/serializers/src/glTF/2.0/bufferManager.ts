import type { TypedArray } from "core/types";
import type { AccessorComponentType, AccessorType, IAccessor, IBufferView } from "babylonjs-gltf2interface";
import { DataWriter } from "./dataWriter";

interface IPropertyWithBufferView {
    bufferView?: number;
}

function getHighestByteAlignment(byteLength: number): number {
    if (byteLength % 4 === 0) return 4;
    if (byteLength % 2 === 0) return 2;
    return 1;
}

/**
 * Utility class to centralize the management of binary data, bufferViews, and the objects that reference them.
 * @internal
 */
export class BufferManager {
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
        // Construct a DataWriter with the total byte length to prevent resizing
        let totalByteLength = 0;
        this._bufferViewToData.forEach((data) => {
            totalByteLength += data.byteLength;
        });
        const dataWriter = new DataWriter(totalByteLength);

        // Order the bufferViews in descending order of their alignment requirements
        const orderedBufferViews = [...this._bufferViewToData.keys()].sort((a, b) => getHighestByteAlignment(b.byteLength) - getHighestByteAlignment(a.byteLength));

        // Fill in the bufferViews list and missing bufferView index references while writing the binary
        for (const bufferView of orderedBufferViews) {
            bufferView.byteOffset = dataWriter.byteOffset;
            bufferViews.push(bufferView);

            const bufferViewIndex = bufferViews.length - 1;
            const properties = this.getProperties(bufferView);
            for (const object of properties) {
                object.bufferView = bufferViewIndex;
            }

            dataWriter.writeTypedArray(this._bufferViewToData.get(bufferView)!);

            this._bufferViewToData.delete(bufferView); // Try to free up memory ASAP
        }

        return dataWriter.getOutputData();
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

        const properties = this.getProperties(bufferView);
        for (const object of properties) {
            if (object.bufferView !== undefined) {
                delete object.bufferView;
            }
        }

        this._bufferViewToData.delete(bufferView);
        this._bufferViewToProperties.delete(bufferView);
        this._accessorToBufferView.forEach((bv, accessor) => {
            if (bv === bufferView) {
                // Additionally, remove byteOffset from accessor referencing this bufferView
                if (accessor.byteOffset !== undefined) {
                    delete accessor.byteOffset;
                }
                this._accessorToBufferView.delete(accessor);
            }
        });
    }
}
