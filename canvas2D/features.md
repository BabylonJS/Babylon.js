Canvas2D: features list
====================

## Features soup

Here is some features, in no particular order. To get a clearer picture of what is where, keep reading this document.

 - Rendering is **WebGL** based, powered by Babylon.js core architecture.
 - Draw Calls are **minimized** due to a rendering architecture using (when available) the [ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays) extension.
   - All non transparent instances of the Ellipse2D, Rectangl2D are drawn in one draw call per primitive type whatever the Ellipse/Rectangle width, height, roundRadius, subdivision, fill/border brush are.
   - All non transparent instances of Sprite2D using the same Texture are rendered into a single draw call.
   - All instances of [Text2D](http://doc.babylonjs.com/overviews/Canvas2D_Text2D) using the same fontName in Signed Distance Field mode are rendered into a single draw call. Non SDF Text follow the Transparent rendering rules.
   - All transparent primitives applying to the rules above can be rendered into a single call if there are consecutive in the depth order. Transparent Primitives must be rendered **back to front** no matter what, it's packed into Instanced Arrays when it can, otherwise single draw calls are made.
 - All the rendering engine's architecture is based on dirty/update caches to compute the data only when needed to **avoid computation when nothing changes**.
 - Part of the content of a Canvas (or the whole) can be **cached** into a big texture in order to avoid a render every frame, in order to maximize performance by rendering just once static content. [More info](http://doc.babylonjs.com/overviews/Canvas2D_Rendering).
 - You can create on screen Canvas, called **ScreenSpaceCanvas** (SSC) that are displayed on the top of the 3D Scene (or below, in between, in the depth layer you want...)
 - You can create a Canvas that is displayed in the 3D Scene on a Rectangle, this a **WorldSpaceCanvas** (WSC), some features:
   - The rendering quality of a WSC is **adaptive**, the closer your WSC is the bigger is the surface when its content is rendered to, avoiding you to see pixelized content everything is adaptive, **even text**.
   
     - Without ![before](http://www.html5gamedevs.com/uploads/monthly_2016_06/57641896ccee5_c6o7BdT1.png.57ad694cf4cb86f884cfebb0ffa29fc1.png)
     - With ![after](http://www.html5gamedevs.com/uploads/monthly_2016_06/576419dc5794d_Pastedimageat2016_06_1715_35.thumb.png.47a928c707526926198401132a049b50.png)
   - A WSC can **track** a 3D Scene Node, and optionally always face the screen, [example](http://babylonjs-playground.com/#1KYG17#1).
   - By default a WSC is rendered on a Plane, but you can render it on pretty much every **surface you want**, [example](http://babylonjs-playground.com/#EPFQG#4).
 - A Canvas can rely on a **Design Size** for the user to work with a Fixed Size Surface and position its primitives accordingly, the rendered size of the Canvas adapting to the rendering device, scaling the content for proportions to be kept, [more info](http://doc.babylonjs.com/overviews/Canvas2D_DesignSize).
 - You can create custom frame of reference or containers, called **Group2D**, [more info](http://doc.babylonjs.com/overviews/Canvas2D_Group2D). A Group2D's content can be **cached** into a big texture in order to avoid rendering of its content every frame, as stated above.
 - An **Interaction Engine** support the HTML PointerEvent, which is replicated at the level of a primitive, you can now when the pointer is entering/leaving a primitive's surface, when there's a touch/click, etc. [more info](http://doc.babylonjs.com/overviews/Canvas2D_Interaction). Interaction works for both WSC and SSC.
 - A **Collision Engine** at the Canvas level detect all the primitives intersecting each others or against the Canvas' borders, [more info](http://doc.babylonjs.com/overviews/Canvas2D_PCM)
 - Every primitive can be **animated** using the Babylon.js [animation framework](http://doc.babylonjs.com/tutorials/animations), [example](http://babylonjs-playground.com/#FFTQL#3).
 - Primitives can be positioned manually using the **Absolute Positioning** ([more info](http://doc.babylonjs.com/overviews/Canvas2D_PosTransHierarchy)) or arranged by a **Layout Engine** and the **Positioning Engine** using Margin, Margin Alignment, Padding properties, [more info](http://doc.babylonjs.com/overviews/Canvas2D_Prim_Positioning).
 - Primitives can be manually sized or be auto-size based on their content and/or the area taken by their children.
 - Multiple Layout Engines can be developed through time, for now only the default one (Canvas Positioning) and a StackPanel are implemented. Grid Layout and Radial Layout will come soon.
 - The Primitive types implemented so far:
   - [Shape based](http://doc.babylonjs.com/overviews/Canvas2D_Shape2D):
     - [Rectangle2D](http://doc.babylonjs.com/overviews/Canvas2D_Rectangle2D): a simple rectangle with a width and a height and an optional roundedRadius to have rounded corners.
     - [Ellipse2D](http://doc.babylonjs.com/overviews/Canvas2D_Ellipse2D): an ellipse (so also a circle) with a width, height and a subdivision count for its rendering.
     - [Lines2D](http://doc.babylonjs.com/overviews/Canvas2D_Lines2D): to render opened or closed line path from a list of points, with a given thickness and for opened Lines2D optional starting and ending caps (RoundCap, TriangleCap, SquaredAnchorCap, etc.)
   - [Text2D](http://doc.babylonjs.com/overviews/Canvas2D_Text2D): render a text using either:
     - A generated font using a given CSS-style fontName, in this mode the text can be rendered using three techniques: standard quality, super sample quality, signed distance field algorithm.
     - A BitmapFontTexture to render more game/fancy character.
     - This primitive also support Text Word Wrapping and Text Alignment (both horizontally and vertically).
   - [Sprite2D](http://doc.babylonjs.com/overviews/Canvas2D_Sprite2D): render a sprite from a texture, sprite frame is supported for sprite animation, the sprite can be stored in an [AtlasPicture](http://doc.babylonjs.com/overviews/Canvas2D_AtlasPicture) and/or be rendered using the [Scale9Sprite](http://doc.babylonjs.com/overviews/Canvas2D_Sprite2D#scale9Sprite-feature) algorithm.
   - [WireFrame2D](http://doc.babylonjs.com/overviews/Canvas2D_WireFrame2D): to render many wire lines.

## Class diagram

You can get a high level view of the implemented classes with this class diagram:

![ClassDiagram](http://imgur.com/qclw4cI.png)

