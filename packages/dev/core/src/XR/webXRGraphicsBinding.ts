import { type AbstractEngine } from "../Engines/abstractEngine";
import { type ThinEngine } from "../Engines/thinEngine";
import { type WebGPUEngine } from "../Engines/webgpuEngine";

/**
 * The kind of underlying native binding an {@link IWebXRGraphicsBinding} wraps.
 * @internal
 */
export const enum WebXRGraphicsBindingType {
    /**
     * Backed by an XRWebGLBinding (WebGL / WebGL2).
     */
    WebGL,

    /**
     * Backed by an XRGPUBinding (WebGPU).
     */
    WebGPU,
}

/**
 * Abstraction over the WebXR graphics binding used to interact with the XR compositor
 * (XRWebGLBinding today, an XRGPUBinding-based binding for a future WebGPU backend).
 *
 * This is introduced as a seam so the XR features can be migrated off the concrete
 * `XRWebGLBinding` in a later phase without changing behavior today.
 * @internal
 */
export interface IWebXRGraphicsBinding {
    /**
     * The kind of native binding that is wrapped.
     */
    readonly bindingType: WebXRGraphicsBindingType;
}

/**
 * WebGL implementation of {@link IWebXRGraphicsBinding}, wrapping an `XRWebGLBinding`.
 * @internal
 */
export class WebXRWebGLGraphicsBinding implements IWebXRGraphicsBinding {
    /**
     * The kind of native binding that is wrapped.
     */
    public readonly bindingType = WebXRGraphicsBindingType.WebGL;

    /**
     * The wrapped native `XRWebGLBinding`.
     */
    public readonly binding: XRWebGLBinding;

    /**
     * Creates a new WebGL graphics binding.
     * @param session the XR session the binding is created for
     * @param context the WebGL rendering context to bind to
     */
    constructor(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext) {
        this.binding = new XRWebGLBinding(session, context);
    }

    /**
     * Creates a new WebGL graphics binding from an engine, extracting its WebGL context.
     * The WebGL-specific context access is localized here so callers can stay graphics-API-agnostic.
     * @param session the XR session the binding is created for
     * @param engine the engine whose WebGL context should be bound
     * @returns the created WebGL graphics binding
     */
    public static CreateFromEngine(session: XRSession, engine: AbstractEngine): WebXRWebGLGraphicsBinding {
        const gl = (engine as ThinEngine)._gl;
        if (!gl) {
            throw new Error("WebXRWebGLGraphicsBinding requires a WebGL-capable engine.");
        }
        return new WebXRWebGLGraphicsBinding(session, gl);
    }
}

/**
 * WebGPU implementation of {@link IWebXRGraphicsBinding}, wrapping an `XRGPUBinding`.
 *
 * This is introduced as part of the WebGPU-for-WebXR plumbing and is not consumed yet:
 * the per-frame layer/sub-image operations are wired up by later phases. The `XRGPUBinding`
 * requires a WebGPU-compatible XR session (created with the `webgpu` feature descriptor) and a
 * `GPUDevice` obtained from an `xrCompatible` adapter, otherwise its constructor throws.
 * @internal
 */
export class WebXRWebGPUGraphicsBinding implements IWebXRGraphicsBinding {
    /**
     * The kind of native binding that is wrapped.
     */
    public readonly bindingType = WebXRGraphicsBindingType.WebGPU;

    /**
     * The wrapped native `XRGPUBinding`.
     */
    public readonly binding: XRGPUBinding;

    /**
     * Creates a new WebGPU graphics binding.
     * @param session the XR session the binding is created for
     * @param device the WebGPU device to bind to
     */
    constructor(session: XRSession, device: GPUDevice) {
        this.binding = new XRGPUBinding(session, device);
    }

    /**
     * Creates a new WebGPU graphics binding from an engine, extracting its `GPUDevice`.
     * The WebGPU-specific device access is localized here so callers can stay graphics-API-agnostic.
     * @param session the XR session the binding is created for
     * @param engine the engine whose WebGPU device should be bound
     * @returns the created WebGPU graphics binding
     */
    public static CreateFromEngine(session: XRSession, engine: AbstractEngine): WebXRWebGPUGraphicsBinding {
        const device = (engine as WebGPUEngine)._device;
        if (!device) {
            throw new Error("WebXRWebGPUGraphicsBinding requires a WebGPU-capable engine.");
        }
        return new WebXRWebGPUGraphicsBinding(session, device);
    }
}
