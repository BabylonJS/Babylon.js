import { INative } from "../../Engines/Native/nativeInterfaces";

declare let _native: INative;

/** @hidden */
export class NativeXRPlugin {
    private static _RegisteredTypes = new Map<string, any>();

    public static RegisterType<Type>(typeName: string, objectType: Type) {
        this._RegisteredTypes.set(typeName, objectType);
    }

    /**
     * Augments native with implementation wrappers.
     * The goal is to improve performance by decreasing the number of jumps across the JS-native boundary and by using more performant types for transferrring data across the boundary.
     */
    public static ExtendNativeObject() {
        this._RegisteredTypes.forEach((constructor, typeName) => {
            (_native as any)[typeName] = constructor;
        });
    }
}