**- This is a highly experimental feature, use it at your own risk :)**

# Lottie (Experimental)

Play Lottie JSON animations on a lightweight Babylon ThinEngine using an OffscreenCanvas + Worker.

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

You can use `AnimationConfiguration` to change certain parameters of the parser/player. The most commonly used options are:

- `loopAnimation`: when `true`, the animation restarts from the beginning after the last frame.
- `backgroundColor`: RGBA color used to clear the canvas before each frame.
- `spriteAtlasWidth` / `spriteAtlasHeight`: explicit atlas size (set both to `0` to auto-detect from GPU capabilities).
- `devicePixelRatio`: rendering scale; set to `0` to auto-detect based on atlas size and the system DPR.
- `gapSize`, `spritesCapacity`, `scaleMultiplier`, `easingSteps`: tuning knobs for the atlas packer and animation evaluator.
- `supportDeviceLost`: enable WebGL context-lost recovery.
- `stopAtFrame`: stop playback at a specific frame number (useful for visual testing).
- `debug`: when `true`, the parser logs unsupported Lottie features to the console after parsing — useful for diagnosing why a given animation does not render as expected.

## Security

For this player to work, if you are applying CSP to your website, you need the following headers:
_worker-src blob:_
_script-src thedomainservingyourjs_

worker-src is used to load the worker. To simplify configuration, we have a small wrapper over the real worker that loads it as a blob.
script-src is used by the scripts the worker references, like the classes it needs from babylon.js to render. If your CSP is blocking the domain of those scripts, then the worker will fail. You can use 'self' if you are serving your .js from the same domain you are serving your site, or your domain if your .js is served from a separate domain like a CDN.

## Remarks

- Prefer to use the `Player` class that uses an OffscreenCanvas and a worker thread. If for some reason that is not available to you (for example in browsers that do not support OffscreenCanvas), you can use `LocalPlayer` instead and call `playAnimationAsync`, which renders on the main JS thread with the same `AnimationInput` shape.

- Only certain features of the Lottie format are currently supported:
    - Layers: solid, null, shape, text
    - Parenting: layers with layers, layers with groups, including transform inheritance through the chain
    - Layer animations: position, rotation, scale, opacity, anchor point — driven by keyframe interpolation with cubic-bezier easing (per-axis easing on Vector2 properties such as position and scale). Animations are applied to the layer rather than to the individual shapes/fills/text within the layer.
    - Shapes: rectangle (including rounded corners), ellipse, vector path
    - Shape decorators: solid fill, gradient fill (linear and radial), stroke, gradient stroke. Layer-level decorators are inherited by the layer's sibling shape groups when those groups don't define their own.
    - Text: font, size, weight, alignment, fill color, multi-line text and paragraph-box word wrapping with tracking and line height
    - Variables: for text strings and text fill color (useful for localization and themes)

- Notable Lottie features that are **not** currently supported include precomp/image/audio layers, masks and matte layers, layer effects, expressions, animations on individual shapes/groups/fills/strokes within a layer (only the layer's own transform is animated), trim/repeater/merge-paths and other shape modifiers, and per-character text animators.

- More features may be added in the future but there is no timeline for them.

**- This is a highly experimental feature, use it at your own risk :)**
