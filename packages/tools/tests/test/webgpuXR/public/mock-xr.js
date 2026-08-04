/* eslint-disable */
/**
 * Mock WebXR + WebXR-WebGPU-Binding implementation for the local repro harness.
 *
 * Fidelity targets (measured on Meta Quest 3 / Chrome fork):
 *   - projection-layer color texture is a 2-LAYER TEXTURE ARRAY (one layer per eye),
 *     per-eye routing through subImage.getViewDescriptor().baseArrayLayer
 *   - textures are served from a ROTATING N-DEEP POOL (identity cycles 0,1,2,...)
 *   - textureUsage requested by the app is RENDER_ATTACHMENT (0x10); the UA silently
 *     augments with COPY_SRC / TEXTURE_BINDING for its own present copy
 *   - after the rAF callback returns, the UA runs (on its OWN encoder + submit):
 *       1. DirectCopy   : reads the app texture (this is our pixel oracle readback)
 *       2. ClearCurrentTexture : clears color to {0,0,0,0} and DEPTH TO 0 (fork quirk;
 *          the spec requires 1.0)
 *   - XRGPUTextureArraySwapChain::OnFrameStart never resets texture_queried_, so the
 *     "app did not query the texture" early-out is dead code from frame 1 on.
 *
 * Everything is configurable through window.__XRMOCK_CONFIG so the harness can bisect
 * one property at a time.
 */
(function () {
    "use strict";

    const CFG = (window.__XRMOCK_CONFIG = Object.assign(
        {
            poolDepth: 3,
            arrayLayers: 2, // 2 => one texture array, one layer per eye. 1 => separate texture per eye.
            width: 512,
            height: 512,
            colorFormat: "rgba8unorm",
            depthStencilFormat: "depth24plus-stencil8",
            scaleFactor: 1.0,
            /** UA clears the app-visible texture after presenting it (Chrome ClearCurrentTexture). */
            compositorClearsTexture: true,
            // How the UA gets the app texture to the compositor at OnFrameEnd.
            //  "buffer" - read the app texture directly (original harness behaviour, models nothing real)
            //  "direct" - Chrome DirectCopy: copyTextureToTexture(app -> mailbox). Taken on Quest,
            //             because canvas preferred format == backend format (rgba8unorm).
            //  "render" - Chrome RenderCopy: shader blit(app -> mailbox). Taken on desktop macOS/Windows,
            //             because getPreferredColorFormat() returns bgra8unorm != rgba8unorm backend.
            // In "direct"/"render" the oracle reads back the MAILBOX, i.e. what the compositor presents.
            uaCopyMode: "buffer",
            // Quest's XRGPUMailboxSwapChain::ProduceTexture() builds a NEW GPUTexture from the compositor's
            // shared image every frame. true = fresh mailbox texture per frame, false = one persistent one.
            mailboxFreshPerFrame: true,
            // Submit the UA copy BEFORE the app's endFrame submit, to model a sync-token / ordering hazard.
            uaCopyBeforeAppSubmit: false,
            /** Chrome fork quirk: depth cleared to 0 instead of the spec-mandated 1.0. */
            compositorDepthClearValue: 0.0,
            /** Provide a depth/stencil sub-image texture at all. */
            provideDepth: true,
            /** XR projection matrices use the [-1,1] (GL) clip convention, like current XRGPUBinding impls. */
            projectionHalfZ: false,
            /** Number of frames to run before auto-ending the session. */
            frameBudget: 40,
            /** Readback downscale: read the full sub-image (slow but exact) at this stride. */
            readbackEveryFrame: true,
            /**
             * Frame index at which mock controllers connect (fires `inputsourceschange`). Real headsets report
             * input sources shortly AFTER session start, which is what makes Babylon lazily build the
             * `UtilityLayerRenderer.DefaultUtilityLayer` -- a SECOND `Scene` that renders through the same XR rig
             * cameras. Without this the harness only ever exercises the single-scene path and cannot see any
             * multi-scene interaction with the per-eye render targets. Set to `-1` to never connect controllers.
             */
            inputSourcesAtFrame: 1,
            /** Number of mock controllers to connect (1 => "right" only, 2 => "left" + "right"). */
            inputSourceCount: 2,
            /**
             * Report `GPUTexture.usage` as 0 for the projection-layer textures, like the Quest browser's Blink
             * stub does. Queried capabilities on a real device are NOT trustworthy; anything that derives a
             * value from one is a device-only bug waiting to happen. "colorOnly" stubs just the color texture
             * (the exact Quest behaviour: color reports 0, depth reports 17).
             */
            stubQueriedUsage: "colorOnly",
        },
        window.__XRMOCK_CONFIG || {}
    ));

    const log = (...a) => console.log("[mockxr]", ...a);

    // ------------------------------------------------------------------ pose math

    function perspective(fovy, aspect, near, far, halfZ) {
        const f = 1.0 / Math.tan(fovy / 2);
        const out = new Float32Array(16);
        out[0] = f / aspect;
        out[5] = f;
        out[11] = -1;
        if (halfZ) {
            out[10] = far / (near - far);
            out[14] = (far * near) / (near - far);
        } else {
            out[10] = (far + near) / (near - far);
            out[14] = (2 * far * near) / (near - far);
        }
        return out;
    }

    // ------------------------------------------------------------------ sub-image / layer

    class MockXRGPUSubImage {
        constructor(colorTexture, depthStencilTexture, layerIndex, width, height, arrayLayers) {
            this.colorTexture = colorTexture;
            this.depthStencilTexture = depthStencilTexture;
            const inset = CFG.viewportInset || 0;
            this.viewport = { x: inset, y: inset, width: width - inset * 2, height: height - inset * 2 };
            this._layerIndex = layerIndex;
            this._arrayLayers = arrayLayers;
        }
        getViewDescriptor() {
            return {
                format: CFG.colorFormat,
                dimension: "2d",
                aspect: "all",
                baseMipLevel: 0,
                mipLevelCount: 1,
                baseArrayLayer: window.__XRMOCK_FORCE_LAYER0 ? 0 : this._layerIndex,
                arrayLayerCount: 1,
            };
        }
    }

    class MockXRProjectionLayer {
        constructor(binding, init) {
            this._binding = binding;
            this._init = init;
            this.textureWidth = CFG.width;
            this.textureHeight = CFG.height;
            this.textureArrayLength = CFG.arrayLayers;
            this.ignoreDepthValues = false;
            this.fixedFoveation = 0;
            this.needsRedraw = true;
            this.colorFormat = init.colorFormat;
            this.depthStencilFormat = init.depthStencilFormat;
        }
        destroy() {
            this._binding._destroyPool();
        }
    }

    // ------------------------------------------------------------------ XRGPUBinding

    class MockXRGPUBinding {
        constructor(session, device) {
            if (!session) throw new Error("XRGPUBinding requires a session");
            if (!device) throw new Error("XRGPUBinding requires a GPUDevice");
            this.session = session;
            this.device = device;
            this.nativeProjectionScaleFactor = CFG.scaleFactor;
            this._pool = null;
            this._layer = null;
            session._binding = this;
        }

        getPreferredColorFormat() {
            return CFG.colorFormat;
        }

        createProjectionLayer(init) {
            init = init || {};
            if (CFG.rejectCopySrc && (init.textureUsage || 0) & GPUTextureUsage.COPY_SRC) {
                // Model a UA that refuses any usage beyond RENDER_ATTACHMENT. The trace build must fall
                // back to the untouched init and keep recording the command trace.
                throw new TypeError("mock UA: textureUsage 0x" + (init.textureUsage || 0).toString(16) + " not supported");
            }
            const layer = new MockXRProjectionLayer(this, init);
            this._layer = layer;
            this._createPool(init);
            window.__XRMOCK_STATE.layerInit = {
                colorFormat: init.colorFormat,
                depthStencilFormat: init.depthStencilFormat,
                textureUsage: init.textureUsage,
                scaleFactor: init.scaleFactor,
                textureType: init.textureType,
            };
            log("createProjectionLayer", JSON.stringify(window.__XRMOCK_STATE.layerInit), "pool", CFG.poolDepth, "layers", CFG.arrayLayers);
            return layer;
        }

        _createPool(init) {
            const d = this.device;
            // The app asked for RENDER_ATTACHMENT (0x10). The UA silently augments with what its own
            // present copy needs (COPY_SRC for DirectCopy, TEXTURE_BINDING for RenderCopy).
            const appUsage = init.textureUsage || GPUTextureUsage.RENDER_ATTACHMENT;
            // Model the device honestly: Babylon asks for RENDER_ATTACHMENT only, and a UA is entitled to
            // reject an app that asks for more. CFG.rejectCopySrc exercises the trace build's DEGRADED
            // fallback path so we know it survives a refusal instead of losing the whole run.
            let uaUsage = appUsage | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING;
            // CFG.silentDenyCopySrc models the nastier refusal: the UA ACCEPTS the layer init but the
            // texture it hands back has no COPY_SRC anyway. "usage" reports the real usage (the trace
            // build's capability gate must catch it); "stub" additionally reports usage 0, which is what
            // the Quest browser actually does, so only an async validation error scope can catch it.
            if (CFG.silentDenyCopySrc) {
                uaUsage = (appUsage | GPUTextureUsage.TEXTURE_BINDING) & ~GPUTextureUsage.COPY_SRC;
            }
            this._pool = [];
            for (let i = 0; i < CFG.poolDepth; i++) {
                const color = d.createTexture({
                    label: "xr-pool-color-" + i,
                    size: { width: CFG.width, height: CFG.height, depthOrArrayLayers: CFG.arrayLayers },
                    format: init.colorFormat || CFG.colorFormat,
                    usage: uaUsage,
                    dimension: "2d",
                });
                let depth = null;
                if (CFG.provideDepth && (init.depthStencilFormat || CFG.depthStencilFormat)) {
                    depth = d.createTexture({
                        label: "xr-pool-depth-" + i,
                        size: { width: CFG.width, height: CFG.height, depthOrArrayLayers: CFG.arrayLayers },
                        format: init.depthStencilFormat || CFG.depthStencilFormat,
                        usage: GPUTextureUsage.RENDER_ATTACHMENT,
                        dimension: "2d",
                    });
                }
                // The Quest browser reports colorTexture.usage as 0 (a Blink stub) while the real usage is
                // non-zero. That has now caused three separate near-misses, so it is ON BY DEFAULT: any code
                // that DERIVES a value from a queried capability (e.g. `real.usage | TEXTURE_BINDING`) must
                // break here, in the harness, rather than on the headset. Use explicit constants instead.
                if (CFG.silentDenyCopySrc === "stub" || CFG.stubQueriedUsage) {
                    Object.defineProperty(color, "usage", { get: () => 0, configurable: true });
                    if (depth && CFG.stubQueriedUsage !== "colorOnly") {
                        Object.defineProperty(depth, "usage", { get: () => 0, configurable: true });
                    }
                }
                this._pool.push({ color, depth, id: i });
                if (window.__GPUTRACE) {
                    window.__GPUTRACE.watch(color, "color#" + i);
                    depth && window.__GPUTRACE.watch(depth, "depth#" + i);
                }
            }
        }

        _destroyPool() {
            if (!this._pool) return;
            for (const e of this._pool) {
                e.color.destroy();
                e.depth && e.depth.destroy();
            }
            this._pool = null;
        }

        _currentPoolEntry() {
            const s = this.session;
            return this._pool[s._frameIndex % this._pool.length];
        }

        _subImage(eye) {
            const entry = this._currentPoolEntry();
            const eyeIndex = eye === "right" ? 1 : 0;
            const layerIndex = CFG.arrayLayers > 1 ? eyeIndex : 0;
            this.session._texturesQueriedThisFrame = true;
            const st = window.__XRMOCK_STATE;
            st.subImageCalls++;
            st.lastPoolId = entry.id;
            return new MockXRGPUSubImage(entry.color, entry.depth, layerIndex, CFG.width, CFG.height, CFG.arrayLayers);
        }

        getViewSubImage(layer, view) {
            return this._subImage(view && view.eye);
        }

        getSubImage(layer, frame, eye) {
            return this._subImage(eye);
        }
    }

    // ------------------------------------------------------------------ frame / pose / views

    class MockXRView {
        constructor(eye, index, session) {
            this.eye = eye;
            this._index = index;
            this._session = session;
            this.recommendedViewportScale = 1.0;
        }
        get projectionMatrix() {
            const rs = this._session._renderState;
            return perspective(Math.PI / 2.2, 1.0, rs.depthNear || 0.1, rs.depthFar || 1000, CFG.projectionHalfZ);
        }
        get transform() {
            const ipd = 0.032;
            const x = this.eye === "right" ? ipd : -ipd;
            return new XRRigidTransform({ x: x, y: 1.6, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 1 });
        }
        requestViewportScale() {}
    }

    class MockXRViewerPose {
        constructor(session) {
            this.transform = new XRRigidTransform({ x: 0, y: 1.6, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 1 });
            this.views = [new MockXRView("left", 0, session), new MockXRView("right", 1, session)];
            this.emulatedPosition = false;
            this.linearVelocity = null;
            this.angularVelocity = null;
        }
    }

    class MockXRFrame {
        constructor(session) {
            this.session = session;
            this.predictedDisplayTime = performance.now();
        }
        getViewerPose(_refSpace) {
            return new MockXRViewerPose(this.session);
        }
        getPose(space, _baseSpace) {
            // Real UAs return a pose for input-source spaces. Returning null for everything (the previous
            // behaviour) silently prevented Babylon from ever tracking a controller.
            if (space instanceof MockXRSpace) {
                return {
                    transform: new XRRigidTransform({ x: space._x, y: 1.4, z: -0.3, w: 1 }, { x: 0, y: 0, z: 0, w: 1 }),
                    emulatedPosition: false,
                    linearVelocity: null,
                    angularVelocity: null,
                };
            }
            return null;
        }
    }

    class MockXRReferenceSpace extends EventTarget {
        constructor(type) {
            super();
            this._type = type;
            this.onreset = null;
        }
        getOffsetReferenceSpace(_transform) {
            return new MockXRReferenceSpace(this._type);
        }
    }

    // ------------------------------------------------------------------ input sources

    class MockXRSpace {
        constructor(x) {
            this._x = x;
        }
    }

    class MockXRInputSource {
        constructor(handedness) {
            const x = handedness === "left" ? -0.2 : 0.2;
            this.handedness = handedness;
            this.targetRayMode = "tracked-pointer";
            this.targetRaySpace = new MockXRSpace(x);
            this.gripSpace = new MockXRSpace(x);
            this.profiles = ["generic-trigger"];
            this.gamepad = { id: "mock", index: 0, connected: true, mapping: "xr-standard", axes: [0, 0, 0, 0], buttons: [{ pressed: false, touched: false, value: 0 }] };
            this.hand = null;
        }
    }

    class MockXRInputSourcesChangeEvent extends Event {
        constructor(session, added, removed) {
            super("inputsourceschange");
            this.session = session;
            this.added = added;
            this.removed = removed;
        }
    }

    // ------------------------------------------------------------------ session

    class MockXRSession extends EventTarget {
        constructor(mode, init) {
            super();
            this.mode = mode;
            this.environmentBlendMode = "opaque";
            this.visibilityState = "visible";
            this.inputSources = [];
            this.enabledFeatures = ["webgpu", "local-floor", "layers"];
            this.interactionMode = "world-space";
            this._renderState = { depthNear: 0.1, depthFar: 1000, layers: [], baseLayer: null, inlineVerticalFieldOfView: null };
            this._frameIndex = 0;
            this._ended = false;
            this._texturesQueriedThisFrame = false;
            this._binding = null;
            this._inputSourcesConnected = false;
            this._rafQueue = [];
            this._pumping = false;
        }

        get renderState() {
            return this._renderState;
        }

        async requestReferenceSpace(type) {
            return new MockXRReferenceSpace(type);
        }

        updateRenderState(state) {
            Object.assign(this._renderState, state || {});
            if (window.__XRMOCK_STATE) {
                window.__XRMOCK_STATE.renderStates.push({ depthNear: this._renderState.depthNear, depthFar: this._renderState.depthFar });
            }
            // A WebXR session only gets rAF callbacks once it has a layer (or base layer).
            this._maybeStartPump();
        }

        /**
         * Connect mock controllers a frame or two into the session, like a real headset. This is what makes
         * Babylon build `UtilityLayerRenderer.DefaultUtilityLayer` (a second Scene rendering through the same
         * XR rig cameras), so the harness exercises the multi-scene path instead of only the single-scene one.
         */
        _maybeConnectInputSources() {
            if (CFG.inputSourcesAtFrame < 0 || this._inputSourcesConnected || this._frameIndex < CFG.inputSourcesAtFrame) {
                return;
            }
            this._inputSourcesConnected = true;
            const added = [];
            if (CFG.inputSourceCount >= 2) {
                added.push(new MockXRInputSource("left"));
            }
            if (CFG.inputSourceCount >= 1) {
                added.push(new MockXRInputSource("right"));
            }
            this.inputSources = added;
            const ev = new MockXRInputSourcesChangeEvent(this, added, []);
            this.dispatchEvent(ev);
            if (typeof this.oninputsourceschange === "function") {
                this.oninputsourceschange(ev);
            }
        }

        requestAnimationFrame(cb) {
            const id = ++MockXRSession._rafId;
            this._rafQueue.push({ id, cb });
            this._maybeStartPump();
            return id;
        }

        cancelAnimationFrame(id) {
            this._rafQueue = this._rafQueue.filter((e) => e.id !== id);
        }

        async end() {
            if (this._ended) return;
            this._ended = true;
            this.dispatchEvent(new Event("end"));
            if (this.onend) this.onend(new Event("end"));
        }

        _hasLayer() {
            const rs = this._renderState;
            return !!rs.baseLayer || (rs.layers && rs.layers.length > 0);
        }

        _maybeStartPump() {
            if (this._pumping || this._ended || !this._hasLayer() || this._rafQueue.length === 0) return;
            this._pumping = true;
            const step = async () => {
                if (this._ended) {
                    this._pumping = false;
                    return;
                }
                const pending = this._rafQueue;
                this._rafQueue = [];
                if (pending.length === 0) {
                    // Nobody asked for another frame; go idle until someone does.
                    this._pumping = false;
                    return;
                }
                this._texturesQueriedThisFrame = false;
                this._maybeConnectInputSources();
                const frame = new MockXRFrame(this);
                const t = performance.now();
                window.__XRMOCK_STATE.frame = this._frameIndex;
                window.__GPUTRACE && window.__GPUTRACE.beginFrame(this._frameIndex);
                for (const e of pending) {
                    try {
                        e.cb(t, frame);
                    } catch (err) {
                        window.__XRMOCK_STATE.errors.push("rAF#" + this._frameIndex + ": " + (err && err.message));
                        console.error(err);
                    }
                }
                // --- UA frame end: present (read) then ClearCurrentTexture, on the UA's own encoder ---
                try {
                    await window.__XRMOCK_PRESENT(this._frameIndex);
                } catch (err) {
                    window.__XRMOCK_STATE.errors.push("present#" + this._frameIndex + ": " + (err && err.message));
                }
                window.__GPUTRACE && window.__GPUTRACE.endFrame();
                this._frameIndex++;
                if (CFG.frameBudget && this._frameIndex >= CFG.frameBudget) {
                    this._pumping = false;
                    await this.end();
                    return;
                }
                setTimeout(step, 4);
            };
            setTimeout(step, 4);
        }
    }
    MockXRSession._rafId = 0;

    // ------------------------------------------------------------------ compositor present + pixel oracle

    window.__XRMOCK_STATE = {
        frame: -1,
        frames: [],
        errors: [],
        subImageCalls: 0,
        renderStates: [],
        lastPoolId: -1,
        layerInit: null,
        clearColorGuess: null,
    };

    let _readbackBuffers = [];
    let _mailbox = null;
    let _mailboxSeq = 0;
    let _blitPipeline = null;
    let _blitSampler = null;

    /**
     * Models Chrome's XRGPUTextureArraySwapChain::OnFrameEnd(): copy the app-facing array texture into the
     * "wrapped" (mailbox / shared-image) texture that the compositor actually presents. Chrome picks
     * DirectCopy when source and backend formats match (Quest) and a shader RenderCopy when they differ
     * (desktop). Returns the mailbox texture, which the oracle then reads back.
     */
    function _uaCopyToMailbox(device, enc, appTex, eyes) {
        if (!_mailbox || CFG.mailboxFreshPerFrame) {
            // Quest's XRGPUMailboxSwapChain::ProduceTexture() makes a NEW texture from the shared image each frame.
            _mailbox = device.createTexture({
                label: "xr-mailbox-" + _mailboxSeq++,
                size: { width: CFG.width, height: CFG.height, depthOrArrayLayers: CFG.arrayLayers },
                format: appTex.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
                dimension: "2d",
            });
            window.__GPUTRACE && window.__GPUTRACE.watch(_mailbox, "mailbox#" + (_mailboxSeq - 1));
        }
        if (CFG.uaCopyMode === "direct") {
            for (const eye of eyes) {
                enc.copyTextureToTexture(
                    { texture: appTex, mipLevel: 0, origin: { x: 0, y: 0, z: eye } },
                    { texture: _mailbox, mipLevel: 0, origin: { x: 0, y: 0, z: eye } },
                    { width: CFG.width, height: CFG.height, depthOrArrayLayers: 1 }
                );
            }
            return _mailbox;
        }
        // RenderCopy: full-screen shader blit, one pass per array layer.
        if (!_blitPipeline) {
            const mod = device.createShaderModule({
                code: `
                @vertex fn vs(@builtin(vertex_index) i : u32) -> @builtin(position) vec4f {
                    var p = array<vec2f,3>(vec2f(-1.,-1.), vec2f(3.,-1.), vec2f(-1.,3.));
                    return vec4f(p[i], 0., 1.);
                }
                @group(0) @binding(0) var s : sampler;
                @group(0) @binding(1) var t : texture_2d<f32>;
                @fragment fn fs(@builtin(position) c : vec4f) -> @location(0) vec4f {
                    return textureSampleLevel(t, s, c.xy / vec2f(${CFG.width}., ${CFG.height}.), 0.);
                }`,
            });
            _blitPipeline = device.createRenderPipeline({
                layout: "auto",
                vertex: { module: mod, entryPoint: "vs" },
                fragment: { module: mod, entryPoint: "fs", targets: [{ format: appTex.format }] },
                primitive: { topology: "triangle-list" },
            });
            _blitSampler = device.createSampler({ magFilter: "nearest", minFilter: "nearest" });
        }
        for (const eye of eyes) {
            const pass = enc.beginRenderPass({
                colorAttachments: [
                    {
                        view: _mailbox.createView({ dimension: "2d", baseArrayLayer: eye, arrayLayerCount: 1 }),
                        loadOp: "clear",
                        storeOp: "store",
                        clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    },
                ],
            });
            pass.setPipeline(_blitPipeline);
            pass.setBindGroup(
                0,
                device.createBindGroup({
                    layout: _blitPipeline.getBindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: _blitSampler },
                        { binding: 1, resource: appTex.createView({ dimension: "2d", baseArrayLayer: eye, arrayLayerCount: 1 }) },
                    ],
                })
            );
            pass.draw(3);
            pass.end();
        }
        return _mailbox;
    }

    window.__XRMOCK_PRESENT = async function (frameIndex) {
        const session = window.__XRMOCK_SESSION;
        const binding = session && session._binding;
        if (!binding || !binding._pool) return;
        const device = binding.device;
        const entry = binding._currentPoolEntry();
        const w = CFG.width,
            h = CFG.height;
        const bytesPerRow = Math.ceil((w * 4) / 256) * 256;
        const eyes = CFG.arrayLayers > 1 ? [0, 1] : [0];

        // One UA command encoder carrying: the present copy then ClearCurrentTexture.
        const enc = device.createCommandEncoder({ label: "ua-frame-end" });
        if (CFG.synthOverwrite) {
            // Negative control: synthesise the exact device symptom. A clear-only pass lands on each
            // sub-image layer AFTER the scene drew to it, using the SCENE clear colour, so the compositor
            // still presents teal every frame while all geometry is gone and nothing raises an error.
            const cc = CFG.clearColor || { r: 0, g: 0.35, b: 0.4, a: 1 };
            for (let layer = 0; layer < CFG.arrayLayers; layer++) {
                const p = enc.beginRenderPass({
                    colorAttachments: [
                        {
                            view: entry.color.createView({ dimension: "2d", baseArrayLayer: layer, arrayLayerCount: 1 }),
                            loadOp: "clear",
                            storeOp: "store",
                            clearValue: cc,
                        },
                    ],
                });
                p.end();
            }
        }
        const buffers = [];
        const src = CFG.uaCopyMode === "buffer" ? entry.color : _uaCopyToMailbox(device, enc, entry.color, eyes);
        for (const eye of eyes) {
            const buf = device.createBuffer({
                size: bytesPerRow * h,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            enc.copyTextureToBuffer(
                { texture: src, mipLevel: 0, origin: { x: 0, y: 0, z: eye } },
                { buffer: buf, bytesPerRow, rowsPerImage: h },
                { width: w, height: h, depthOrArrayLayers: 1 }
            );
            buffers.push({ eye, buf });
        }

        if (CFG.compositorClearsTexture) {
            // Chrome XRGPUSwapChain::ClearCurrentTexture: colour -> {0,0,0,0}, depth -> 0 (fork quirk).
            for (let layer = 0; layer < CFG.arrayLayers; layer++) {
                const desc = {
                    colorAttachments: [
                        {
                            view: entry.color.createView({ dimension: "2d", baseArrayLayer: layer, arrayLayerCount: 1 }),
                            loadOp: "clear",
                            storeOp: "store",
                            clearValue: { r: 0, g: 0, b: 0, a: 0 },
                        },
                    ],
                };
                if (entry.depth) {
                    desc.depthStencilAttachment = {
                        view: entry.depth.createView({ dimension: "2d", baseArrayLayer: layer, arrayLayerCount: 1 }),
                        depthLoadOp: "clear",
                        depthClearValue: CFG.compositorDepthClearValue,
                        depthStoreOp: "store",
                    };
                    if ((entry.depth.format || "").indexOf("stencil") !== -1) {
                        desc.depthStencilAttachment.stencilLoadOp = "clear";
                        desc.depthStencilAttachment.stencilClearValue = 0;
                        desc.depthStencilAttachment.stencilStoreOp = "store";
                    }
                }
                const pass = enc.beginRenderPass(desc);
                pass.end();
            }
        }
        device.queue.submit([enc.finish()]);

        const record = { frame: frameIndex, poolId: entry.id, eyes: {} };
        await Promise.all(
            buffers.map(async ({ eye, buf }) => {
                await buf.mapAsync(GPUMapMode.READ);
                const data = new Uint8Array(buf.getMappedRange()).slice();
                buf.unmap();
                buf.destroy();
                record.eyes[eye] = classify(data, w, h, bytesPerRow);
            })
        );
        window.__XRMOCK_STATE.frames.push(record);
    };

    /**
     * Pixel oracle. Classifies each eye image against the three colours that matter:
     *   clear   = the scene clear colour (teal)   -> "the pass ran but nothing drew"
     *   void    = transparent black (0,0,0,0)     -> "nothing at all reached this texture"
     *   other   = anything else                   -> GEOMETRY
     * Also returns the dominant colour + distinct-colour count for eyeballing.
     */
    function classify(data, w, h, bytesPerRow) {
        const counts = new Map();
        const stride = 2; // sample every other pixel/row: plenty for a present-vs-not oracle
        let sampled = 0;
        let clearPx = 0;
        let voidPx = 0;
        let geoPx = 0;
        // Vertical centroid of non-clear pixels. Row 0 is texture y=0, i.e. the TOP of the rendered
        // image, so an upside-down render moves the ground plane's centroid from >0.5 to <0.5.
        let geoYSum = 0;
        let groundPx = 0;
        let boxPx = 0;
        let groundYSum = 0;
        const cc = CFG.clearColor || [0, 89, 102, 255];
        const tol = 3;
        for (let y = 0; y < h; y += stride) {
            const row = y * bytesPerRow;
            for (let x = 0; x < w; x += stride) {
                const o = row + x * 4;
                const r = data[o],
                    g = data[o + 1],
                    b = data[o + 2],
                    a = data[o + 3];
                const key = (r << 24) | (g << 16) | (b << 8) | a;
                counts.set(key, (counts.get(key) || 0) + 1);
                sampled++;
                if (r === 0 && g === 0 && b === 0 && a === 0) {
                    voidPx++;
                } else if (Math.abs(r - cc[0]) <= tol && Math.abs(g - cc[1]) <= tol && Math.abs(b - cc[2]) <= tol) {
                    clearPx++;
                } else {
                    geoPx++;
                    geoYSum += y;
                    // yellow ground: high R, high G, low B
                    if (r > 150 && g > 150 && b < 100) {
                        groundPx++;
                        groundYSum += y;
                    } else if (r > 150 && b > 150 && g < 100) {
                        boxPx++;
                    }
                }
            }
        }
        let domKey = 0,
            domCount = -1;
        for (const [k, c] of counts) {
            if (c > domCount) {
                domCount = c;
                domKey = k;
            }
        }
        const toRGBA = (k) => [(k >>> 24) & 255, (k >>> 16) & 255, (k >>> 8) & 255, k & 255];
        return {
            distinct: counts.size,
            dominant: toRGBA(domKey),
            dominantFrac: +(domCount / sampled).toFixed(4),
            clearPx,
            voidPx,
            geoPx,
            geoCY: geoPx ? +(geoYSum / geoPx / h).toFixed(3) : -1,
            groundPx,
            boxPx,
            groundCY: groundPx ? +(groundYSum / groundPx / h).toFixed(3) : -1,
            sampled,
        };
    }

    // ------------------------------------------------------------------ navigator.xr

    const xr = {
        native: undefined,
        async isSessionSupported(mode) {
            return mode === "immersive-vr" || mode === "inline";
        },
        async requestSession(mode, init) {
            const s = new MockXRSession(mode, init);
            window.__XRMOCK_SESSION = s;
            log("requestSession", mode, JSON.stringify(init));
            return s;
        },
        addEventListener() {},
        removeEventListener() {},
    };

    Object.defineProperty(navigator, "xr", { value: xr, configurable: true, writable: true });
    window.XRGPUBinding = MockXRGPUBinding;
    window.__XRMOCK_CLASSES = { MockXRSession, MockXRGPUBinding };
    log("installed");
})();
