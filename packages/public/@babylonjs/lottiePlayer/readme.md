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

## Security

For this player to work, if you are applying CSP to your website, you need the following headers:
_worker-src blob:_
_script-src thedomainservingyourjs_

worker-src is used to load the worker. To simplify configuration, we have a small wrapper over the real worker that loads it as a blob.
script-src is used by the scripts the worker references, like the classes it needs from babylon.js to render. If your CSP is blocking the domain of those scripts, then the worker will fail. You can use 'self' if you are serving your .js from the same domain you are serving your site, or your domain if your .js is served from a separate domain like a CDN.

## Remarks

- Prefer to use the class Player that uses an Offscreen canvas and the worker thread. If for some reason that is not available to you, you can use LocalPlayer and call playAnimationAsync which renders in the main JS thread.

- Only certain features of the Lottie format are currently supported:
  - Layers: null, shape, text
  - Parenting: layers with layers, layers with groups
  - Layer Animations: translation, rotation, scale, opacity (we apply animations to the layer rather than the individual shapes/fills/text within the layer)
  - Shapes: rectangle, rounded corner rectangle, vector path
  - Shapes fills: regular fill, gradient fill, radial fill, stroke fill
  - Text: font, size, weight, alignment, fill color. Each text layer must contain a single line of text
  - Variables: for text strings and text fill color (useful for localization and themes)
- More features may be added in the future but there is no timeline for them

**- This is a highly experimental feature, use it at your own risk :)**
