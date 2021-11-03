import { NativeXRFrame } from "./nativeXRFrame";
import { NativeXRPlane } from "./nativeXRPlane";

declare const _native: any;

/** @hidden */
export class NativeXRPlugin {
    public static SupplyConstructors() {
        _native.NativeXRFrame = NativeXRFrame;
        _native.NativeXRPlane = NativeXRPlane;
    }
}