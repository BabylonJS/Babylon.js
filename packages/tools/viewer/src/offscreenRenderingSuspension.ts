import { type IDisposable, type Nullable } from "core/index";

/**
 * Suspends rendering while a canvas is scrolled out of the viewport.
 * @remarks
 * Shared by the full and Lite Viewer canvas factories. The two flavors implement suspension very differently
 * (full disposes a render loop controller synchronously, Lite stops the engine's rAF loop under an async
 * lock), but the observer wiring and the pairing of suspend/resume against intersection changes are identical,
 * so only the `suspendRendering` callback differs.
 * @param canvas The canvas whose visibility should drive rendering.
 * @param suspendRendering Called when the canvas leaves the viewport; the returned disposable is disposed when it comes back.
 * @returns A disposable that stops observing the canvas. Must be disposed along with the Viewer.
 */
export function SuspendRenderingWhenOffscreen(canvas: HTMLCanvasElement, suspendRendering: () => IDisposable): IDisposable {
    let offscreenRenderingSuspension: Nullable<IDisposable> = null;

    const intersectionObserver = new IntersectionObserver((entries) => {
        if (entries.length > 0) {
            if (entries[entries.length - 1].isIntersecting) {
                offscreenRenderingSuspension?.dispose();
                offscreenRenderingSuspension = null;
            } else {
                // `??=` rather than `=`: repeated non-intersecting records must not acquire a second
                // suspension, which would leak a reference and leave rendering suspended forever.
                offscreenRenderingSuspension ??= suspendRendering();
            }
        }
    });
    intersectionObserver.observe(canvas);

    return { dispose: () => intersectionObserver.disconnect() };
}
