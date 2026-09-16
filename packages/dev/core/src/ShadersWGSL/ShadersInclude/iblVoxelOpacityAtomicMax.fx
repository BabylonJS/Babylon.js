// Per-byte atomicMax into a packed u32 accumulator (4 voxels/u32, byte lane = vidx % 4, LSB-first),
// so the buffer is 4x smaller than one u32 per voxel. WebGPU has no byte-wide atomic, so we emulate
// one with a compare-exchange loop. Requires a module-scope
// `var<storage, read_write> voxelOpacityBuffer: array<atomic<u32>>;`.
//
// KNOWN LIMITATION (opacity compositing): overlapping distinct splats combine with MAX, not a true
// composite — two 0.5 splats read 0.5, not 1-(1-0.5)^2=0.75 — so dense clouds under-shadow. MAX is
// deliberate and shared with the WebGL2 ALPHA_MAX path so both backends match: being idempotent, it
// dedupes each splat's three tri-planar proxy draws (a composite would triple-count them). A correct
// fix would accumulate optical depth per axis and MAX across axes; deferred as a follow-up.
fn voxelOpacityAtomicMax(vidx: u32, value: u32) {
    let wordIdx: u32 = vidx >> 2u;
    let shift: u32 = (vidx & 3u) * 8u;
    let mask: u32 = 0xFFu << shift;
    let shifted: u32 = (value & 0xFFu) << shift;
    loop {
        let oldWord: u32 = atomicLoad(&voxelOpacityBuffer[wordIdx]);
        // Already at least this opaque; nothing to do.
        if (value <= ((oldWord >> shift) & 0xFFu)) {
            break;
        }
        let newWord: u32 = (oldWord & ~mask) | shifted;
        // Weak CAS can fail spuriously (even returning old_value == oldWord), so break only on an
        // actual exchange; otherwise retry.
        if (atomicCompareExchangeWeak(&voxelOpacityBuffer[wordIdx], oldWord, newWord).exchanged) {
            break;
        }
    }
}
