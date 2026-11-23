import { Constants } from "core/Engines/constants";
import { vi } from "vitest";

/**
 * Creates a canvas whose getContext("webgl2") returns a minimal mocked WebGL2 context, so that the engine
 * goes through the full context initialization (_initGLContext) in a node environment.
 * Constants are numbers (LEQUAL and GEQUAL have their real values), methods return null unless listed below.
 * @param supportsClipControl whether the context exposes EXT_clip_control
 * @returns the mocked canvas, GL spies and a way to simulate context loss
 */
export function CreateMockWebGL2Canvas(supportsClipControl = false) {
    const lowerLeft = 0x8ca1;
    const zeroToOne = 0x935f;
    const clipDepthMode = 0x935d;
    const negativeOneToOne = 0x935e;
    let depthMode = negativeOneToOne;
    const clipControl = {
        LOWER_LEFT_EXT: lowerLeft,
        NEGATIVE_ONE_TO_ONE_EXT: negativeOneToOne,
        ZERO_TO_ONE_EXT: zeroToOne,
        CLIP_DEPTH_MODE_EXT: clipDepthMode,
        clipControlEXT: vi.fn((_origin: number, depth: number) => {
            depthMode = depth;
        }),
    };
    const getExtension = vi.fn((name: string) => (name === "EXT_clip_control" && supportsClipControl ? clipControl : null));
    const knownConstants: Record<string, number> = { LEQUAL: Constants.LEQUAL, GEQUAL: Constants.GEQUAL };
    let nextConstant = 0x10000;
    const methods: Record<string, (...args: unknown[]) => unknown> = {
        getContextAttributes: () => ({ stencil: true, antialias: false }),
        getParameter: (parameter) => (parameter === clipDepthMode ? depthMode : 16),
        getExtension: (name) => getExtension(name as string),
        getShaderPrecisionFormat: () => ({ precision: 23, rangeMin: 127, rangeMax: 127 }),
        getSupportedExtensions: () => [],
        createBuffer: () => ({}),
        clear: vi.fn(),
    };
    const gl = new Proxy<Record<string, unknown>>(
        { drawingBufferWidth: 300, drawingBufferHeight: 150, getContext: undefined },
        {
            get: (target, name) => {
                if (typeof name !== "string") {
                    return undefined;
                }
                if (!(name in target)) {
                    target[name] = /^[A-Z0-9_]+$/.test(name) ? (knownConstants[name] ?? nextConstant++) : (methods[name] ?? (() => null));
                }
                return target[name];
            },
        }
    );
    const canvas = Object.assign(new EventTarget(), {
        width: 300,
        height: 150,
        clientWidth: 300,
        clientHeight: 150,
        style: {},
        getContext: (contextType: string) => (contextType === "webgl2" ? gl : null),
        setAttribute: () => {},
        getBoundingClientRect: () => ({ width: 300, height: 150 }),
    });
    gl.canvas = canvas;
    return {
        canvas: canvas as unknown as HTMLCanvasElement,
        context: gl as unknown as WebGL2RenderingContext,
        clear: methods.clear,
        getExtension,
        clipControl,
        restoreContext: () => {
            const event = new Event("webglcontextlost", { cancelable: true });
            canvas.dispatchEvent(event);
            depthMode = negativeOneToOne;
            canvas.dispatchEvent(new Event("webglcontextrestored"));
            return event.defaultPrevented;
        },
    };
}
