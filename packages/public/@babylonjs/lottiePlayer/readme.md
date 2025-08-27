**- This is a highly experimental feature, use it at your own risk :)**

# Lottie (Experimental)

Play Lottie JSON animations on a lightweight Babylon ThinEngine using an OffscreenCanvas + Worker.

## Usage

```ts
import { Player } from "@babylonjs/lottie-player";

const container = document.getElementById("myDiv") as HTMLDivElement;
const player = new Player(container, "/animations/hero.json");
player.playAnimation();
```

## Important Notes

The public API of this package is formed by Player, LocalPlayer and AnimationConfiguration. All other files are internal implementation details.

Future updates could move or rename files and require you to update your references if you take dependencies on those files. Do not depend on the paths of those files either as they could be moved or renamed as part of the internal implementation.

## Options

You can pass a variables map in the constructor of Player. These variables will be used in:

- Text from a text layer to be localized.
- Text fill from a text layer to use a particular color.

You can use the AnimationConfiguration to change certain parameters of the parser/player. For example, loopAnimation to loop the animation, or ignoreOpacityAnimation for performance if you know your animation doesn't modify opacity.

## Remarks

- Prefer to use the class Player that uses an Offscreen canvas and the worker thread. If for some reason that is not available to you, you can use LocalPlayer and call playAnimationAsync which renders in the main JS thread.

- Only certain features of the Lottie format are currently supported.
    - Layers: null, shape, text
    - Animations: translation, rotation, scale, opacity on layers (no animations supported on shapes/fills/text themselves)
    - Shapes: rectangle, rounded corner rectangle, vector path
    - Fills: regular fill, gradient fill, radial fill, stroke fill
    - Text: each text layer should contain a single line of text, and the same styling and animations should be applying to the whole line
- More features may be added in the future but there is no timeline for them.

**- This is a highly experimental feature, use it at your own risk :)**
