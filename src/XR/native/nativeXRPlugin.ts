import { INative } from "../../Engines/Native/nativeInterfaces";
import { Nullable } from "../../types";

declare const _native: INative;

/** @hidden */
export class NativeXRPlugin {
    private static _RegisteredTypes = new Map<string, any>();
    private static _nativeObject: Nullable<INative> = null;

    public static RegisterType<Type>(typeName: string, constructor: Type) {
        this._RegisteredTypes.set(typeName, constructor);
        if (this._nativeObject) {
            (this._nativeObject as any)[typeName] = constructor;
        }
    }

    /**
     * Augments native with implementation wrappers.
     * The goal is to improve performance by decreasing the number of jumps across the JS-native boundary and by using more performant types for transferrring data across the boundary.
     */
    public static ExtendNativeObject() {
        if (!_native) {
            throw Error("ExtendNativeObject should only be called once _native is defined.");
        }
        this._nativeObject = _native;
        this._RegisteredTypes.forEach((constructor, typeName) => {
            (this._nativeObject as any)[typeName] = constructor;
        });
    }
}