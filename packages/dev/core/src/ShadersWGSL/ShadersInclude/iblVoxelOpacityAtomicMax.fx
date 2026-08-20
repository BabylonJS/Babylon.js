// Per-byte atomicMax into a packed u32 accumulator: 4 voxels share one 32-bit word (byte lane =
// vidx % 4, LSB-first), so the per-voxel opacity buffer is 4x smaller than one u32 per voxel.
// WebGPU has no byte-wide atomic, so we emulate one with a compare-exchange loop that maxes only the
// target byte. Combines overlapping splats (and the three per-axis passes) with max.
// Requires a module-scope `var<storage, read_write> voxelOpacityBuffer: array<atomic<u32>>;`.
//
// KNOWN LIMITATION (opacity compositing): a cell keeps the strongest overlapping occluder rather than
// compositing distinct splats. Two 0.5-opacity splats in a cell read 0.5, not 1 - (1 - 0.5)^2 = 0.75,
// so dense/overlapping splat clouds systematically under-shadow relative to the true transmittance the
// ray-march roulette assumes. MAX is nonetheless deliberate and shared with the WebGL2 path (which
// uses an ALPHA_MAX blend) so the two backends match: MAX is idempotent, which correctly dedupes each
// splat's three tri-planar proxy draws — an additive/optical-depth composite would triple-count them.
// A correct fix needs per-axis optical-depth accumulation (composite within an axis, MAX across axes);
// tracked as a follow-up, not implemented here.
fn voxelOpacityAtomicMax(vidx: u32, value: u32) {
    let wordIdx: u32 = vidx >> 2u;
    let shift: u32 = (vidx & 3u) * 8u;
    let mask: u32 = 0xFFu << shift;
    let shifted: u32 = (value & 0xFFu) << shift;
    loop {
        let oldWord: u32 = atomicLoad(&voxelOpacityBuffer[wordIdx]);
        // Already at least this opaque in this byte lane; nothing to do.
        if (value <= ((oldWord >> shift) & 0xFFu)) {
            break;
        }
        let newWord: u32 = (oldWord & ~mask) | shifted;
        // Retry on contention from a concurrent write to another byte of the same word. A weak CAS can
        // also fail spuriously while still returning old_value == oldWord, so break only when it reports
        // an actual exchange; otherwise the opacity write would be silently dropped.
        if (atomicCompareExchangeWeak(&voxelOpacityBuffer[wordIdx], oldWord, newWord).exchanged) {
            break;
        }
    }
}
