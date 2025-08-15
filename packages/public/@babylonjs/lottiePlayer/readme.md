# Lottie (Experimental)

Play Lottie JSON animations on a lightweight Babylon ThinEngine using an OffscreenCanvas + Worker.

## Usage

```ts
import { LottiePlayer } from "@babylonjs/addons"; // after export added

const container = document.getElementById("myDiv") as HTMLDivElement;
const player = new LottiePlayer(container, "/animations/hero.json", {
    loopAnimation: true,
});
player.playAnimation();
```

## Important Notes

The public API of this package is formed by LottiePlayer and AnimationConfiguration. All other files are internal implementation details.

Future updates could move or rename files and require you to update your references if you take dependencies on those files.

## Remarks

- There is no fallback if offscreen canvas is not supported in your browser. playAnimation() will return false to indicate it couldn't play the animation. The goal of this addon is to play animations without affecting the main thread, which cannot be achieved without offscreen canvas.

- Only certain features of the Lottie format are currently supported.

    - Shapes: rectangle, rounded corner rectangle, vector path
    - Fills: regular fill, gradient fill, radial fill
    - Animations: translation, rotation, scale, opacity on layers (no animations supported on shapes)
    - Nesting: support for nested layers, no support for nested shapes

- More features may be added in the future but there is no timeline for them.
- This is a highly experimental feature, use it at your own risk :)
