import type { IInspectorOptions } from "core/index";

import { DebugLayer } from "core/Debug/debugLayer";
import { Lazy } from "core/Misc/lazy";
import { Scene } from "core/scene";

const LazyInspectorModule = new Lazy(async () => await import("./inspector"));

class DebugLayerEx extends DebugLayer {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    override async show(config?: IInspectorOptions): Promise<DebugLayer> {
        // If a custom inspector URL is not provided, default to a lazy dynamic import of the inspector module.
        if (!config?.inspectorURL) {
            this.BJSINSPECTOR = await LazyInspectorModule.value;
        }
        return await super.show(config);
    }
}

let CachedDebugLayerDescriptor: PropertyDescriptor | undefined;

const DebugLayerExKey = Symbol("DebugLayerEx");

declare module "core/scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * @internal
         * Backing field
         */
        [DebugLayerExKey]?: DebugLayerEx;
    }
}

const DebugLayerExDescriptor: TypedPropertyDescriptor<DebugLayerEx> = {
    get: function (this: Scene) {
        // NOTE: We don't replace the _debugLayer property because we want to leave it
        // intact so we can dynamically switch back to v1. Eventually when v1 is fully
        // deprecated we can have just a single _debugLayer property.
        // If there is no DebugLayerEx yet, create it.
        if (!this[DebugLayerExKey]) {
            this[DebugLayerExKey] = new DebugLayerEx(this);
        }

        return this[DebugLayerExKey];
    },
    enumerable: true,
    configurable: true,
};

/**
 * Attaches Inspector v2 to Scene.debugLayer.
 */
export function AttachDebugLayer() {
    const currentPropertyDescriptor = Reflect.getOwnPropertyDescriptor(Scene.prototype, "debugLayer");
    // Check if Inspector v2 is already attached, but don't compare the property descriptors directly
    // as getOwnPropertyDescriptor returns a new object instance each time.
    // Instead, check the get function.
    if (currentPropertyDescriptor?.get !== DebugLayerExDescriptor.get) {
        // Cache the property descriptor so we can restore it if/when Inspector v2 is detached from Scene._debugLayer.
        CachedDebugLayerDescriptor = currentPropertyDescriptor;

        // Define the debugLayer property to return our extended DebugLayerEx (Inspector v2).
        Reflect.defineProperty(Scene.prototype, "debugLayer", DebugLayerExDescriptor);
    }
}

/**
 * Detaches Inspector v2 from Scene.debugLayer.
 */
export function DetachDebugLayer() {
    const currentPropertyDescriptor = Reflect.getOwnPropertyDescriptor(Scene.prototype, "debugLayer");
    // Check if Inspector v2 is already attached, but don't compare the property descriptors directly
    // as getOwnPropertyDescriptor returns a new object instance each time.
    // Instead, check the get function.
    if (currentPropertyDescriptor?.get === DebugLayerExDescriptor.get) {
        // Revert the debugLayer property descriptor.
        if (CachedDebugLayerDescriptor) {
            Reflect.defineProperty(Scene.prototype, "debugLayer", CachedDebugLayerDescriptor);
            CachedDebugLayerDescriptor = undefined;
        } else {
            Reflect.deleteProperty(Scene.prototype, "debugLayer");
        }
    }
}
