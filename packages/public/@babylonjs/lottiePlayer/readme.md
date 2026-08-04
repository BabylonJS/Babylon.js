**- This is a highly experimental feature, use it at your own risk :)**

# Lottie (Experimental)

Play Lottie JSON animations on a lightweight Babylon ThinEngine using an OffscreenCanvas + Worker. Artwork is rendered as vectors on the GPU with a stencil-then-cover pipeline, so shapes stay crisp at any scale.

## Usage

```ts
import { Player } from "@babylonjs/lottie-player";

const container = document.getElementById("myDiv") as HTMLDivElement;
const player = new Player();
await player.playAnimationAsync({
    container,
    animationSource: "/animations/hero.json", // or a parsed RawLottieAnimation object
    variables: null,
    configuration: { loopAnimation: true },
});
```

## Important Notes

The public API of this package is formed by `Player`, `LocalPlayer`, `AnimationConfiguration` and the `RawLottieAnimation` type. All other files are internal implementation details.

Future updates could move or rename files and require you to update your references if you take dependencies on those files. Do not depend on the paths of those files either as they could be moved or renamed as part of the internal implementation.

## Options

You can pass a variables map through `AnimationInput.variables`. These variables will be used in:

- Text from a text layer to be localized.
- Text fill from a text layer to use a particular color.

You can use `AnimationConfiguration` to change certain parameters of the player. The most commonly used options are:

- `loopAnimation`: when `true`, the animation restarts from the beginning after the last frame.
- `backgroundColor`: RGBA color used to clear the canvas before each frame. Defaults to opaque black; use an alpha of `0` for a transparent canvas.
- `devicePixelRatio`: rendering scale; set to `0` (the default) to follow the system device pixel ratio.
- `supportDeviceLost`: enable WebGL context-lost recovery.
- `stopAtFrame`: stop playback at a specific frame number (useful for visual testing).

The following options are deprecated. They belonged to the previous sprite-atlas renderer and are still accepted so existing code keeps compiling, but they no longer have any effect: `spriteAtlasWidth`, `spriteAtlasHeight`, `gapSize`, `spritesCapacity`, `scaleMultiplier`, `easingSteps`, `debug`, and `compatibility`.

## Renderer Loading

`Player` and `LocalPlayer` select renderer chunks automatically after parsing the animation:

- The vector fill/stroke renderer is always part of the base player.
- The text renderer loads only when the animation contains text layers.
- The image renderer and its file-loading support load only when the animation contains image layers.

No separate player class or configuration is required. Pre-warming `Player` loads the worker and base renderer code; animation-specific text or image chunks load after the animation data is known.

## Upgrading

The player renders vectors on the GPU instead of rasterizing a sprite atlas. Two behavior changes are worth knowing about when upgrading:

- **Default rendering resolution changed.** With `devicePixelRatio: 0` the canvas previously used 2x-4x supersampling to keep atlas sprites crisp. The vector renderer uses multisampling instead, so it now follows the system device pixel ratio. Expect a smaller backing store and lower memory use; pass an explicit `devicePixelRatio` to override.
- **Keyframe easing is more accurate.** Cubic-bezier easing is solved to a fixed tolerance rather than a fixed number of steps, so mid-animation frames can land a fraction of a pixel away from where the previous renderer put them.

## Security

For this player to work, if you are applying CSP to your website, you need the following headers:
_worker-src blob:_
_script-src thedomainservingyourjs_

worker-src is used to load the worker. To simplify configuration, we have a small wrapper over the real worker that loads it as a blob.
script-src is used by the scripts the worker references, like the classes it needs from babylon.js to render. If your CSP is blocking the domain of those scripts, then the worker will fail. You can use 'self' if you are serving your .js from the same domain you are serving your site, or your domain if your .js is served from a separate domain like a CDN.

## Remarks

- Prefer to use the `Player` class that uses an OffscreenCanvas and a worker thread. If for some reason that is not available to you (for example in browsers that do not support OffscreenCanvas), you can use `LocalPlayer` instead and call `playAnimationAsync`, which renders on the main JS thread with the same `AnimationInput` shape.

- Only certain features of the Lottie format are currently supported:
    - Layers: solid, null, shape, text, image
    - Parenting: layers with layers, layers with groups, including transform inheritance through the chain
    - Layer animations: position, rotation, scale, opacity, anchor point — driven by keyframe interpolation with cubic-bezier easing (per-axis easing on Vector2 properties such as position and scale)
    - Shapes: rectangle (including rounded corners), ellipse, vector path, including animated (morphing) paths
    - Shape decorators: solid fill, gradient fill (linear and radial), stroke, gradient stroke, dashed strokes. Layer-level decorators are inherited by the layer's sibling shape groups when those groups don't define their own.
    - Layer masks (add mode) and alpha track mattes between vector shape/solid layers
    - Text: font, size, weight, alignment, fill color, multi-line text and paragraph-box word wrapping with tracking and line height
    - Variables: for text strings and text fill color (useful for localization and themes)

- Notable Lottie features that are **not** currently supported include precomp and audio layers, layer effects, expressions, subtract/intersect/inverted masks, luma/inverted/cross-renderer track mattes, trim/repeater/merge-paths and other shape modifiers, and per-character text animators.

- More features may be added in the future but there is no timeline for them.

**- This is a highly experimental feature, use it at your own risk :)**
