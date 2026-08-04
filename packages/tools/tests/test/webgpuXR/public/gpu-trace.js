/* eslint-disable */
/**
 * GPU sub-image write tracer.
 *
 * Pure page script: monkey-patches the WebGPU API so we get a complete, ordered, ground-truth
 * record of EVERY render pass / copy / submit that touches an XR projection-layer texture,
 * plus the draws, viewports and scissors recorded into those passes.
 *
 * Zero engine changes, so the exact same file can run in the local harness AND on a device page.
 *
 * Register interesting textures with __GPUTRACE.watch(gpuTexture, "label").
 * Frame boundaries come from __GPUTRACE.beginFrame(n) / endFrame().
 */
(function () {
    "use strict";

    if (!window.GPUDevice) {
        return;
    }

    const T = (window.__GPUTRACE = {
        enabled: true,
        frames: [],
        current: null,
        watched: new Map(), // GPUTexture -> label
        maxFrames: 200,
    });

    const viewInfo = new WeakMap(); // GPUTextureView -> {tex, desc}
    const passInfo = new WeakMap(); // GPURenderPassEncoder -> record
    const encInfo = new WeakMap(); // GPUCommandEncoder -> {id, passes:[]}
    const bufInfo = new WeakMap(); // GPUCommandBuffer -> encoder record
    let encSeq = 0;

    T.watch = function (tex, label) {
        T.watched.set(tex, label);
    };
    T.beginFrame = function (n) {
        T.current = { frame: n, events: [] };
    };
    T.endFrame = function () {
        if (T.current) {
            if (T.frames.length < T.maxFrames) T.frames.push(T.current);
            T.current = null;
        }
    };
    function ev(e) {
        if (T.enabled && T.current) T.current.events.push(e);
    }

    // ---- createView: remember which texture a view came from -------------------------------
    const origCreateView = GPUTexture.prototype.createView;
    GPUTexture.prototype.createView = function (desc) {
        const v = origCreateView.call(this, desc);
        viewInfo.set(v, { tex: this, desc: desc || {} });
        return v;
    };

    function describeAttachmentView(view) {
        const info = viewInfo.get(view);
        if (!info) return null;
        const label = T.watched.get(info.tex);
        if (label === undefined) return null;
        return {
            tex: label,
            baseArrayLayer: info.desc.baseArrayLayer ?? 0,
            arrayLayerCount: info.desc.arrayLayerCount,
            dimension: info.desc.dimension,
            format: info.desc.format,
        };
    }

    // ---- beginRenderPass -------------------------------------------------------------------
    const origBeginRenderPass = GPUCommandEncoder.prototype.beginRenderPass;
    GPUCommandEncoder.prototype.beginRenderPass = function (desc) {
        const pass = origBeginRenderPass.call(this, desc);
        let touches = null;
        const colors = [];
        for (const ca of desc.colorAttachments || []) {
            if (!ca) continue;
            const d = describeAttachmentView(ca.view);
            const resolved = ca.resolveTarget ? describeAttachmentView(ca.resolveTarget) : null;
            if (d || resolved) {
                touches = touches || {};
                colors.push({
                    target: d,
                    resolve: resolved,
                    loadOp: ca.loadOp,
                    storeOp: ca.storeOp,
                    clearValue: ca.clearValue ? [round(ca.clearValue.r), round(ca.clearValue.g), round(ca.clearValue.b), round(ca.clearValue.a)] : undefined,
                });
            }
        }
        let depth = null;
        const dsa = desc.depthStencilAttachment;
        if (dsa) {
            const d = describeAttachmentView(dsa.view);
            if (d) {
                touches = touches || {};
                depth = {
                    target: d,
                    depthLoadOp: dsa.depthLoadOp,
                    depthClearValue: dsa.depthClearValue,
                    depthStoreOp: dsa.depthStoreOp,
                    depthReadOnly: dsa.depthReadOnly,
                    stencilLoadOp: dsa.stencilLoadOp,
                };
            }
        }
        const encRec = getEnc(this);
        const rec = {
            kind: "renderPass",
            enc: encRec.id,
            label: desc.label,
            colors,
            depth,
            draws: 0,
            drawVerts: 0,
            // Capture the JS call site of every pass on a watched texture. A pass that ends with draws==0
            // is a clobber candidate, and only the stack names the code that issued it -- reasoning about
            // which Babylon subsystem "should" be rendering has been wrong repeatedly on this bug.
            stack: window.__GPUTRACE_STACKS ? new Error().stack : undefined,
            viewports: [],
            scissors: [],
            bundles: 0,
            ended: false,
            touchesWatched: !!touches,
        };
        passInfo.set(pass, rec);
        encRec.passes.push(rec);
        if (touches) ev(rec);
        return pass;
    };

    function round(v) {
        return typeof v === "number" ? +v.toFixed(3) : v;
    }

    function getEnc(enc) {
        let r = encInfo.get(enc);
        if (!r) {
            r = { id: ++encSeq, passes: [], copies: [] };
            encInfo.set(enc, r);
        }
        return r;
    }

    // ---- draws / viewport / scissor / bundles ---------------------------------------------
    for (const name of ["draw", "drawIndexed", "drawIndirect", "drawIndexedIndirect"]) {
        const orig = GPURenderPassEncoder.prototype[name];
        GPURenderPassEncoder.prototype[name] = function (...args) {
            const rec = passInfo.get(this);
            if (rec) {
                rec.draws++;
                if (typeof args[0] === "number") rec.drawVerts += args[0];
            }
            return orig.apply(this, args);
        };
    }
    const origSetViewport = GPURenderPassEncoder.prototype.setViewport;
    GPURenderPassEncoder.prototype.setViewport = function (x, y, w, h, minD, maxD) {
        const rec = passInfo.get(this);
        if (rec && rec.viewports.length < 4) rec.viewports.push([x, y, w, h, minD, maxD]);
        return origSetViewport.call(this, x, y, w, h, minD, maxD);
    };
    const origSetScissor = GPURenderPassEncoder.prototype.setScissorRect;
    GPURenderPassEncoder.prototype.setScissorRect = function (x, y, w, h) {
        const rec = passInfo.get(this);
        if (rec && rec.scissors.length < 4) rec.scissors.push([x, y, w, h]);
        return origSetScissor.call(this, x, y, w, h);
    };
    const origExecBundles = GPURenderPassEncoder.prototype.executeBundles;
    GPURenderPassEncoder.prototype.executeBundles = function (b) {
        const rec = passInfo.get(this);
        if (rec) rec.bundles += b ? b.length : 0;
        return origExecBundles.call(this, b);
    };
    const origEnd = GPURenderPassEncoder.prototype.end;
    GPURenderPassEncoder.prototype.end = function () {
        const rec = passInfo.get(this);
        if (rec) rec.ended = true;
        return origEnd.call(this);
    };

    // ---- copies ---------------------------------------------------------------------------
    const origCopyTT = GPUCommandEncoder.prototype.copyTextureToTexture;
    GPUCommandEncoder.prototype.copyTextureToTexture = function (src, dst, size) {
        const s = T.watched.get(src.texture),
            d = T.watched.get(dst.texture);
        if (s !== undefined || d !== undefined) {
            ev({ kind: "copyT2T", enc: getEnc(this).id, src: s, dst: d, srcZ: src.origin && src.origin.z, dstZ: dst.origin && dst.origin.z });
        }
        return origCopyTT.call(this, src, dst, size);
    };
    const origCopyTB = GPUCommandEncoder.prototype.copyTextureToBuffer;
    GPUCommandEncoder.prototype.copyTextureToBuffer = function (src, dst, size) {
        const s = T.watched.get(src.texture);
        if (s !== undefined) {
            ev({ kind: "copyT2B", enc: getEnc(this).id, src: s, srcZ: src.origin && src.origin.z });
        }
        return origCopyTB.call(this, src, dst, size);
    };

    // ---- finish / submit -------------------------------------------------------------------
    const origFinish = GPUCommandEncoder.prototype.finish;
    GPUCommandEncoder.prototype.finish = function (desc) {
        const buf = origFinish.call(this, desc);
        bufInfo.set(buf, getEnc(this));
        return buf;
    };
    const origSubmit = GPUQueue.prototype.submit;
    GPUQueue.prototype.submit = function (buffers) {
        const ids = [];
        let touched = false;
        for (const b of buffers || []) {
            const r = bufInfo.get(b);
            if (r) {
                ids.push(r.id);
                if (r.passes.some((p) => p.touchesWatched)) touched = true;
            } else {
                ids.push("?");
            }
        }
        ev({ kind: "submit", encs: ids, touchesWatched: touched });
        return origSubmit.call(this, buffers);
    };

    console.log("[gputrace] installed");
})();
