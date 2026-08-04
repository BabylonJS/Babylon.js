/* eslint-disable */
/**
 * WebGPU-XR device telemetry payload (Phase 3 diagnosis).
 *
 * ZERO ENGINE CHANGES. Everything here is page-side monkey patching, so the build that runs on the
 * headset is byte-identical to the shipping engine. Requires /gputrace.js to be loaded first.
 *
 * It answers, objectively and per frame, the question the whole investigation hinges on:
 *
 *     "At the moment Babylon has submitted the XR frame, does the projection-layer texture the
 *      compositor is about to present ACTUALLY contain our geometry, or only the clear colour?"
 *
 * If geometry IS in the texture -> the loss is downstream (compositor / swap-chain / present).
 * If geometry is NOT in the texture -> the draws never landed there, and the attached command
 * trace says exactly which passes/targets/layers they went to instead.
 *
 * Usage from the host page, right after the XR session is up:
 *     __XRTRACE.start({ engine, sessionManager, clearColor: [r, g, b] (0-255), frames: 60 });
 */
(function () {
    "use strict";

    const T = (window.__XRTRACE = {
        started: false,
        frame: -1,
        _needNewFrame: true,
        _pending: [],
        maxFrames: 60,
        subImages: [], // per-frame, per-eye sub-image metadata
        sceneStats: [], // per-frame Babylon-side counters
        oracle: [], // per-frame, per-eye pixel classification
        notes: [],
        posted: false,
        summary: "",
        // Set by patchProjectionLayerUsage(): false means the UA refused COPY_SRC, so the run is in
        // DEGRADED mode -- command trace only, no pixel classification.
        readbackAvailable: false,
        usageRequested: null,
        degradedReason: null,
        _pool: [], // every distinct sub-image colour texture, probed in full every frame
        poolDistinct: 0, // how many distinct ones the UA has minted overall
        poolProbeMax: 4, // cap, so a fresh-texture-per-frame UA cannot blow up the readback cost
        gpuErrors: [], // uncaptured WebGPU errors seen during the traced run (first-class evidence)
        _whySeen: [],
    });

    function note(m) {
        T.notes.push(m);

        console.log("[xrtrace] " + m);
    }

    // Stable, human-readable identity for a GPUTexture so a rotating pool is visible in the trace.
    const texIds = new WeakMap();
    let texSeq = 0;
    function texId(t) {
        if (!t) {
            return null;
        }
        let id = texIds.get(t);
        if (id === undefined) {
            id = texSeq++;
            texIds.set(t, id);
        }
        return id;
    }

    function describeTexture(t) {
        if (!t) {
            return null;
        }
        return {
            id: texId(t),
            w: t.width,
            h: t.height,
            layers: t.depthOrArrayLayers,
            fmt: t.format,
            usage: t.usage,
            samples: t.sampleCount,
            mips: t.mipLevelCount,
        };
    }

    // ---------------------------------------------------------------- sub-image interception
    // Records the authoritative per-eye routing information Babylon is handed each frame, and
    // registers the colour texture with the command tracer so every write to it is captured.
    function patchBinding() {
        if (typeof XRGPUBinding === "undefined") {
            note("XRGPUBinding undefined - not a WebGPU XR session");
            return false;
        }
        const proto = XRGPUBinding.prototype;
        ["getViewSubImage", "getSubImage"].forEach(function (name) {
            const orig = proto[name];
            if (!orig) {
                return;
            }
            proto[name] = function () {
                const sub = orig.apply(this, arguments);
                try {
                    // getViewSubImage(layer, view) carries the eye on the XRView; getSubImage(layer, frame, eye) passes it directly.
                    const eye = (arguments[1] && arguments[1].eye) || arguments[2] || "?";
                    const vd = sub.getViewDescriptor ? sub.getViewDescriptor() : null;
                    if (window.__GPUTRACE) {
                        window.__GPUTRACE.watch(sub.colorTexture, "color#" + texId(sub.colorTexture));
                        if (sub.depthStencilTexture) {
                            window.__GPUTRACE.watch(sub.depthStencilTexture, "depth#" + texId(sub.depthStencilTexture));
                        }
                    }
                    if (T._needNewFrame) {
                        T._needNewFrame = false;
                        T.frame++;
                        T._pending = [];
                        if (window.__GPUTRACE && T.frame < T.maxFrames) {
                            window.__GPUTRACE.beginFrame(T.frame);
                        }
                    }
                    if (T.frame >= 0 && T.frame < T.maxFrames) {
                        T._pending.push({
                            via: name,
                            eye: eye,
                            color: describeTexture(sub.colorTexture),
                            depth: describeTexture(sub.depthStencilTexture),
                            baseArrayLayer: vd ? vd.baseArrayLayer : null,
                            viewDim: vd ? vd.dimension : null,
                            viewFmt: vd ? vd.format : null,
                            viewport: sub.viewport ? { x: sub.viewport.x, y: sub.viewport.y, w: sub.viewport.width, h: sub.viewport.height } : null,
                        });
                    }
                    // Remember the live per-eye target so the pixel oracle can read it back.
                    T._live = T._live || {};
                    T._live[eye] = { tex: sub.colorTexture, layer: vd ? vd.baseArrayLayer || 0 : 0, viewport: sub.viewport };
                    // Registry of every distinct colour texture the UA has handed us. The oracle probes ALL of
                    // them every frame, not just this frame's, because the leading hypothesis is that the draws
                    // land in a stale pool slot -- we have to be able to say WHICH pool texture holds them.
                    // Capped so that a UA which mints a fresh mailbox texture per frame cannot make the
                    // per-frame readback cost grow without bound (a 3-deep pool fits comfortably).
                    if (T._pool.indexOf(sub.colorTexture) === -1) {
                        T._pool.push(sub.colorTexture);
                        T.poolDistinct++;
                        while (T._pool.length > T.poolProbeMax) {
                            T._pool.shift();
                        }
                    }
                } catch (e) {
                    note("subimage hook error " + e);
                }
                return sub;
            };
        });
        return true;
    }

    // ------------------------------------------------------------------------- pixel oracle

    /**
     * Ask the UA for COPY_SRC on the projection layer's textures.
     *
     * Babylon requests textureUsage 0x10 (RENDER_ATTACHMENT) only, but copyTextureToBuffer REQUIRES
     * COPY_SRC (0x01) on the source. Without this the oracle would raise a validation error on every
     * frame for every layer and the whole A/B/C classifier would come back empty.
     *
     * Patched here rather than in the engine so that this stays a dev-only trace build with no engine
     * diff. If the UA rejects the extra usage it throws at session start (loud, once), so fall back to
     * the untouched init, mark the readback unavailable, and still ship the command trace -- a rejected
     * usage flag must never cost the whole trip.
     *
     * NOTE this is the WebGPU-only projection layer init; WebGL2 XR builds its layer through a separate
     * GL-enum path and never reaches this code, so WebGL2 is unaffected.
     */
    function patchProjectionLayerUsage() {
        if (typeof XRGPUBinding === "undefined" || !XRGPUBinding.prototype.createProjectionLayer) {
            // The class may not exist yet (a mock UA installs it later; a real UA has it at load). Trap the
            // assignment so we still patch strictly before any projection layer can be created.
            if (!T._usageArmed) {
                T._usageArmed = true;
                let held;
                try {
                    Object.defineProperty(window, "XRGPUBinding", {
                        configurable: true,
                        get: function () {
                            return held;
                        },
                        set: function (v) {
                            held = v;
                            delete window.XRGPUBinding;
                            window.XRGPUBinding = v;
                            patchProjectionLayerUsage();
                        },
                    });
                    note("XRGPUBinding not present yet; armed to patch on definition");
                    return;
                } catch (e) {
                    /* fall through to the disabled path below */
                }
            }
            note("no XRGPUBinding.createProjectionLayer to patch; readback DISABLED");
            T.readbackAvailable = false;
            T.degradedReason = "no XRGPUBinding.createProjectionLayer to patch";
            T._probeDisabled = true;
            return;
        }
        if (T._usagePatched) {
            return;
        }
        T._usagePatched = true;
        const orig = XRGPUBinding.prototype.createProjectionLayer;
        XRGPUBinding.prototype.createProjectionLayer = function (init) {
            const requested = ((init && init.textureUsage) || 0x10) | 0x01;
            const patched = {};
            for (const k in init) {
                patched[k] = init[k];
            }
            patched.textureUsage = requested;
            try {
                const layer = orig.call(this, patched);
                T.readbackAvailable = true;
                T.usageRequested = requested;
                note("projection layer created WITH COPY_SRC (textureUsage 0x" + requested.toString(16) + ") -> readback ENABLED");
                return layer;
            } catch (e) {
                T.readbackAvailable = false;
                T.degradedReason = "UA rejected COPY_SRC at layer creation: " + e;
                T._probeDisabled = true;
                T.usageRequested = (init && init.textureUsage) || 0x10;
                note("UA REJECTED COPY_SRC (" + e + ") -> retrying with original usage; readback DISABLED, command trace still active");
                return orig.call(this, init);
            }
        };
    }

    // Installed at script load, NOT in T.start(): the projection layer is created when the XR session
    // starts, which is before the page has an engine/sessionManager to hand us. Patch it up front.
    patchProjectionLayerUsage();

    // Reads a horizontal band out of the middle of each array layer straight after Babylon's submit and
    // classifies it. A band keeps the per-frame copy small enough to run every frame on a 72-90Hz device.
    const BAND_ROWS = 64;

    function align256(n) {
        return Math.ceil(n / 256) * 256;
    }

    /**
     * Record that a readback could not be trusted, INSTEAD of emitting g/c/v numbers.
     *
     * This is the guard against a fake outcome C. A failed copy leaves the staging buffer all zeros, which
     * classifies as "void everywhere" -- byte-identical to the real outcome C (compositor layer never
     * written). Emitting an explicit UNAVAILABLE marker makes that confusion impossible: the decode either
     * gets a real measurement or an admission that there is none.
     */
    function markUnavailable(frame, eye, why) {
        T.readbackAvailable = false;
        if (!T.degradedReason) {
            T.degradedReason = why;
        }
        T._failCount = (T._failCount || 0) + 1;
        if (T._failCount >= 4) {
            // The refusal is systemic, not a one-off. Stop paying for copies the device will not honour.
            T._probeDisabled = true;
        }
        (T.oracle[frame] || (T.oracle[frame] = {}))[eye] = { readback: "UNAVAILABLE", why: why };
        if (T.notes.length < 40 && T._whySeen.indexOf(why) === -1) {
            T._whySeen.push(why);
            note("readback UNAVAILABLE (" + eye + "): " + why);
        }
    }

    function readBand(device, entry, eye, frame, clear) {
        const tex = entry.tex;
        const w = tex.width;
        const y0 = Math.max(0, Math.floor(tex.height / 2) - BAND_ROWS / 2);
        const bytesPerRow = align256(w * 4);

        // Capability gate. NOTE the Quest browser reports colorTexture.usage === 0 (a Blink stub), so a
        // strict usage check would disable the oracle on the very device we care about. Treat 0 as
        // "unknown, try it" and let the validation error scope below be the authority; only a positive,
        // COPY_SRC-less usage is a definitive refusal.
        const usage = typeof tex.usage === "number" ? tex.usage : 0;
        if (usage > 0 && !(usage & 0x01)) {
            markUnavailable(frame, eye, "texture usage 0x" + usage.toString(16) + " lacks COPY_SRC");
            return;
        }

        let buffer;
        try {
            buffer = device.createBuffer({ size: bytesPerRow * BAND_ROWS, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
        } catch (e) {
            markUnavailable(frame, eye, "buffer alloc failed: " + e);
            return;
        }

        // WebGPU validation errors are ASYNCHRONOUS. copyTextureToBuffer on a source without COPY_SRC does
        // not throw -- it silently invalidates the encoder, finish()/submit() do not throw either, and
        // mapAsync then resolves over a buffer that was never written, i.e. ALL ZEROS. Classified naively
        // that reads as "void everywhere", which is indistinguishable from the real outcome C (layer never
        // written). An error scope is the only way to tell those apart, so nothing is classified unless the
        // scope comes back clean.
        device.pushErrorScope("validation");
        const enc = device.createCommandEncoder({ label: "xrtrace-oracle" });
        try {
            enc.copyTextureToBuffer(
                { texture: tex, mipLevel: 0, origin: { x: 0, y: y0, z: entry.layer } },
                { buffer: buffer, bytesPerRow: bytesPerRow, rowsPerImage: BAND_ROWS },
                { width: w, height: BAND_ROWS, depthOrArrayLayers: 1 }
            );
        } catch (e) {
            device.popErrorScope();
            markUnavailable(frame, eye, "copy threw: " + e);
            buffer.destroy();
            return;
        }
        try {
            device.queue.submit([enc.finish()]);
        } catch (e) {
            device.popErrorScope();
            markUnavailable(frame, eye, "submit threw: " + e);
            buffer.destroy();
            return;
        }

        // Only classify if BOTH the error scope is clean AND the map succeeded. Any validation error means
        // the buffer contents are meaningless, so report UNAVAILABLE rather than a number.
        Promise.all([
            device.popErrorScope(),
            buffer.mapAsync(GPUMapMode.READ).then(
                function () {
                    return null;
                },
                function (e) {
                    return "map failed: " + e;
                }
            ),
        ])
            .then(function (res) {
                const gpuErr = res[0];
                const mapErr = res[1];
                if (gpuErr || mapErr) {
                    markUnavailable(frame, eye, gpuErr ? "validation: " + gpuErr.message : mapErr);
                    try {
                        buffer.destroy();
                    } catch (_) {}
                    return;
                }
                const px = new Uint8Array(buffer.getMappedRange().slice(0));
                buffer.unmap();
                buffer.destroy();
                let geo = 0;
                let clr = 0;
                let voidPx = 0;
                const tol = 6;
                for (let r = 0; r < BAND_ROWS; r++) {
                    const base = r * bytesPerRow;
                    for (let x = 0; x < w; x += 2) {
                        const o = base + x * 4;
                        const R = px[o];
                        const G = px[o + 1];
                        const B = px[o + 2];
                        const A = px[o + 3];
                        if (A === 0 && R === 0 && G === 0 && B === 0) {
                            voidPx++;
                        } else if (Math.abs(R - clear[0]) <= tol && Math.abs(G - clear[1]) <= tol && Math.abs(B - clear[2]) <= tol) {
                            clr++;
                        } else {
                            geo++;
                        }
                    }
                }
                (T.oracle[frame] || (T.oracle[frame] = {}))[eye] = { geo: geo, clr: clr, void: voidPx, tex: texId(tex), layer: entry.layer };
            })
            .catch(function (e) {
                markUnavailable(frame, eye, "oracle failed: " + e);
            });
    }

    // ------------------------------------------------------------------------------- driver
    T.start = function (opts) {
        if (T.started) {
            return;
        }
        T.started = true;
        T.maxFrames = opts.frames || 60;
        const engine = opts.engine;
        const sessionManager = opts.sessionManager;
        const clear = opts.clearColor || [0, 0, 0];
        const scene = opts.scene || null;
        const device = engine._device || (engine.getDevice && engine.getDevice());
        T.deviceOk = !!device;
        if (device) {
            // If the device is emitting validation errors during the traced run, that is first-class
            // evidence in its own right -- and try/catch cannot see any of it, because WebGPU surfaces
            // these asynchronously. Chain rather than replace, so Babylon's own handler still runs.
            const prev = device.onuncapturederror;
            device.onuncapturederror = function (ev) {
                if (T.gpuErrors.length < 50) {
                    T.gpuErrors.push({ frame: T.frame, message: ev && ev.error ? String(ev.error.message) : String(ev) });
                }
                if (typeof prev === "function") {
                    prev.call(device, ev);
                }
            };
        }
        if (!patchBinding()) {
            return;
        }
        note("armed, frames=" + T.maxFrames + " device=" + !!device);

        sessionManager.onXRSessionEnded.add(function () {
            T.ended = true;
            // Also flush on exit, so a short run (or one cut off before maxFrames) still delivers its data
            // instead of silently discarding it. T.posted makes this idempotent with the frame-count flush.
            if (!T.posted) {
                T.posted = true;
                setTimeout(T.flush, 300);
            }
        });

        engine.onEndFrameObservable.add(function () {
            // Fires after WebGPUEngine.endFrame() has already flushed and submitted the frame's
            // command buffers, so what we read here is exactly what the compositor will present.
            const f = T.frame;
            if (T._needNewFrame) {
                return; // not an XR frame (no sub-image was fetched)
            }
            T._needNewFrame = true;
            T.subImages[f] = T._pending;
            if (scene && f >= 0 && f < T.maxFrames) {
                // Scene-level counters: separates "Babylon had nothing to draw" from
                // "Babylon drew, but the pixels did not survive".
                const cam = scene.activeCamera;
                T.sceneStats[f] = {
                    activeMeshes: scene.getActiveMeshes().length,
                    activeIndices: scene.getActiveIndices(),
                    totalMeshes: scene.meshes.length,
                    drawCalls: engine._drawCalls ? engine._drawCalls.current : undefined,
                    rigCameras: cam && cam.rigCameras ? cam.rigCameras.length : 0,
                    rw: engine.getRenderWidth(),
                    rh: engine.getRenderHeight(),
                    vp: cam && cam.viewport ? [cam.viewport.x, cam.viewport.y, cam.viewport.width, cam.viewport.height] : null,
                };
            }
            if (window.__GPUTRACE) {
                window.__GPUTRACE.endFrame();
            }
            if (T.ended || !device || f < 0 || f >= T.maxFrames || !T._live) {
                return;
            }
            // Probe EVERY array layer of EVERY pool texture the UA has handed us, not only this frame's
            // sub-image and not only the layer Babylon was told to use. That is what distinguishes "the
            // draws landed in a stale pool slot" from "the draws are gone", which is the leading hypothesis.
            if (T._probeDisabled) {
                // Still emit an explicit marker every frame so no frame is silently blank -- a blank frame
                // could be mistaken for "nothing was measured because nothing was there".
                (T.oracle[f] || (T.oracle[f] = {})).readback = "UNAVAILABLE";
                return;
            }
            for (let i = 0; i < T._pool.length; i++) {
                const tex = T._pool[i];
                if (!tex) {
                    continue;
                }
                const isLive = tex === (T._live[Object.keys(T._live)[0]] || {}).tex || tex === (T._live[Object.keys(T._live)[1]] || {}).tex;
                for (let l = 0; l < tex.depthOrArrayLayers; l++) {
                    readBand(device, { tex: tex, layer: l }, "t" + texId(tex) + "L" + l + (isLive ? "" : "*"), f, clear);
                }
            }
            if (f === T.maxFrames - 1 && !T.posted) {
                T.posted = true;
                setTimeout(T.flush, 800);
            }
        });
    };

    T.build = function () {
        return {
            // Which pinned bundle produced this trace. The sink names the file from it.
            build: window.__XRBUILD || "live",
            ua: navigator.userAgent,
            frames: T.frame + 1,
            mode: T.readbackAvailable ? "full" : "DEGRADED - readback UNAVAILABLE",
            degradedReason: T.readbackAvailable ? null : T.degradedReason || "unknown",
            usageRequested: T.usageRequested,
            gpuErrors: T.gpuErrors,
            poolDistinct: T.poolDistinct,
            subImages: T.subImages,
            sceneStats: T.sceneStats,
            oracle: T.oracle,
            gpuTrace: window.__GPUTRACE ? window.__GPUTRACE.frames : null,
            notes: T.notes,
        };
    };

    /**
     * Self-diagnosis over the recorded GPU command stream.
     *
     * The one mechanism that erases geometry while PRESERVING the clear colour, without rejecting any
     * fragment and without raising a validation error, is a later clear-only render pass overwriting the
     * drawing pass on the same (texture, array layer) inside the same frame. Everything else on that list
     * (depth test, culling, clipping, projection) was already exonerated on device by a depth-immune,
     * cull-immune, clip-immune co-witness that vanished too.
     *
     * So for every frame, group the passes by target texture + array layer in submission order and flag:
     *   OVERWRITE  a clear-loadOp pass with 0 draws lands on a layer AFTER a pass that drew to it
     *   NODRAW     the layer was cleared but never drawn to at all
     *   OK         exactly one drawing pass, nothing clobbers it
     */
    T.analyze = function () {
        const frames = window.__GPUTRACE ? window.__GPUTRACE.frames : null;
        if (!frames) return ["(no gpu trace)"];
        const out = [];
        for (let f = 0; f < frames.length; f++) {
            const evs = frames[f] && frames[f].events ? frames[f].events : frames[f];
            if (!evs || !evs.length) continue;

            // GPU execution order is SUBMIT order, not record order. Babylon uses a rolling _renderEncoder
            // that is only submitted at endFrame, so a pass recorded later can execute earlier. Rank every
            // encoder by the submit that carried it before reasoning about who clobbers whom.
            const submitRank = {};
            let rank = 0;
            for (const e of evs) {
                if (e.kind !== "submit" || !e.encs) continue;
                rank++;
                for (const id of e.encs) {
                    if (submitRank[id] === undefined) submitRank[id] = rank;
                }
            }
            const byLayer = {};
            let seq = 0;
            let presentRank = Infinity;
            for (const e of evs) {
                if (e.kind === "copyT2B" || e.kind === "copyT2T") {
                    presentRank = Math.min(presentRank, submitRank[e.enc] ?? Infinity);
                }
            }
            for (const e of evs) {
                if (e.kind !== "renderPass" || !e.colors) continue;
                const r = submitRank[e.enc];
                if (r === undefined) continue; // never submitted -> never executed
                for (const c of e.colors) {
                    if (!c.target) continue;
                    const key = c.target.tex + "L" + c.target.baseArrayLayer;
                    (byLayer[key] = byLayer[key] || []).push({
                        rank: r,
                        seq: seq++,
                        draws: e.draws + (e.bundles || 0),
                        loadOp: c.loadOp,
                        afterPresent: r > presentRank,
                    });
                }
            }
            const verdicts = [];
            for (const key in byLayer) {
                const passes = byLayer[key]
                    .filter(function (p) {
                        return !p.afterPresent; // ClearCurrentTexture runs after the UA read; not a clobber
                    })
                    .sort(function (a, b) {
                        return a.rank - b.rank || a.seq - b.seq;
                    });
                if (!passes.length) continue;
                let drew = -1;
                let clobber = -1;
                for (let i = 0; i < passes.length; i++) {
                    if (passes[i].draws > 0) drew = i;
                    else if (drew >= 0 && passes[i].loadOp === "clear" && clobber < 0) clobber = i;
                }
                const shape = passes
                    .map(function (p) {
                        return (p.loadOp === "clear" ? "C" : "L") + p.draws + "@s" + p.rank;
                    })
                    .join(">");
                verdicts.push(key + ":" + (clobber >= 0 ? "OVERWRITE" : drew < 0 ? "NODRAW" : "OK") + "(" + shape + ")");
            }
            out.push("f" + f + " " + verdicts.join(" "));
        }
        return out;
    };

    // Compact, in-headset-readable digest. This is the fallback if the POST cannot reach the server.
    T.digest = function () {
        const lines = [];
        lines.push(
            T.readbackAvailable
                ? "MODE full (readback ON, usage 0x" + (T.usageRequested || 0).toString(16) + ")"
                : "MODE *** DEGRADED *** readback UNAVAILABLE - command trace only (" + (T.degradedReason || "unknown") + ")"
        );
        lines.push("BUILD: " + (window.__XRBUILD || "live"));
        lines.push("distinct pool textures: " + T.poolDistinct);
        if (T.gpuErrors.length) {
            lines.push("GPU VALIDATION ERRORS: " + T.gpuErrors.length + " -- first: " + T.gpuErrors[0].message);
        } else {
            lines.push("uncaptured GPU errors: none");
        }
        for (let f = 0; f < Math.min(T.frame + 1, T.maxFrames); f++) {
            const o = T.oracle[f] || {};
            const parts = [];
            for (const key in o) {
                const e = o[key];
                if (typeof e === "string") {
                    parts.push(key + "=" + e);
                } else if (e && e.readback) {
                    parts.push(key + " " + e.readback);
                } else if (e) {
                    parts.push(key + " g=" + e.geo + " c=" + e.clr + " v=" + e.void);
                }
            }
            const si = (T.subImages[f] || []).map((s) => s.eye[0] + "->t" + (s.color && s.color.id) + "L" + s.baseArrayLayer).join(" ");
            const st = T.sceneStats[f];
            const stTxt = st ? " am=" + st.activeMeshes + " ai=" + st.activeIndices : "";
            lines.push("f" + f + " [" + si + "]" + stTxt + " " + parts.join(" | "));
        }
        const an = T.analyze();
        if (an.length) {
            lines.push("-- pass shape per target layer (C=clear L=load, number = draws) --");
            lines.push(an.join("\n"));
        }
        return lines.join("\n");
    };

    T.flush = function () {
        T.summary = T.digest();

        console.log("[xrtrace] DIGEST\n" + T.summary);
        try {
            fetch("/__xrtrace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(T.build()) })
                .then(function (r) {
                    note("POST /__xrtrace -> " + r.status);
                    if (opts_onFlush) {
                        opts_onFlush(T.summary);
                    }
                })
                .catch(function (e) {
                    note("POST failed " + e);
                    if (opts_onFlush) {
                        opts_onFlush(T.summary);
                    }
                });
        } catch (e) {
            note("POST threw " + e);
        }
    };

    let opts_onFlush = null;
    T.onFlush = function (cb) {
        opts_onFlush = cb;
    };
})();
