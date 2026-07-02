/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { WebXRWebGLGraphicsBinding } from "core/XR/webXRGraphicsBinding";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("WebXRWebGLGraphicsBinding", () => {
    let engine: NullEngine;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    afterEach(() => {
        engine.dispose();
    });

    describe("CreateFromEngine", () => {
        it("throws for a non-WebGL engine", () => {
            // NullEngine has no WebGL context, so the WebGL-specific binding cannot be created from it.
            expect(() => WebXRWebGLGraphicsBinding.CreateFromEngine({} as XRSession, engine)).toThrow(/requires a WebGL-capable engine/);
        });
    });
});
