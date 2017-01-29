Canvas2D: features list
====================

## Features soup

Here is some features, in no particular order. To get a clearer picture of what is where, keep reading this document.

 - Rendering is **WebGL** based, powered by Babylon.js core architecture.
 - Draw Calls are **minimized** due to a rendering architecture using (when available) the [ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays) extension.
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
 - An **Interaction Engine** support the HTML PointerEvent, which is replicated at the level of a primitive, you can now when the pointer is entering/leaving a primitive's surface, when there's a touch/click, etc. [more info](http://doc.babylonjs.com/overviews/Canvas2D_Interaction).
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

## Rendering

- 100% WebGL Rendering using the Babylon.js core features (viewport, shaders, buffers, drawing primitives, etc.). This library was designed to be **fast**.
- Caching/dirty mechanism of computed data (rendering states, etc.)
- Caching of [rendered](http://doc.babylonjs.com/overviews/Canvas2D_Rendering) content. Many distinct groups in a Canvas can be separately cached into a texture.
- Using the WebGL [ANGLE_instanced_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays) extension to minimize draw calls and state changes.
  - All non transparent instances of the Ellipse2D, Rectangl2D are drawn in one draw call per primitive type whatever the Ellipse/Rectangle width, height, roundRadius, subdivision, fill/border brush are.
  - All non transparent instances of Sprite2D using the same Texture are rendered into a single draw call.
  - All instances of [Text2D](http://doc.babylonjs.com/overviews/Canvas2D_Text2D) using the same fontName in Signed Distance Field mode are rendered into a single draw call. Non SDF Text follow the Transparent rendering rules.
  - All transparent primitives applying to the rules above can be rendered into a single call if there are consecutive in the depth order. Transparent Primitives must be rendered **back to front** no matter what, it's packed into Instanced Arrays when it can, otherwise single draw calls are made.

## Class diagram

![ClassDiagram](http://imgur.com/qclw4cI.png)

## All Primitives (along Prim2DBase)
 - `propertyChanged` Observable for the user to be notified of a property change.
 - `dispose` method and `disposeObservable`
 - Add/getExternalData pattern for the user to attach custom data to the object
 - `SmartProperty` is a special kind of Property that takes cares of change tracking with notification, dirty some global states like boundingInfo, support data binding to get its value from another property/object.
 - Has a link to its parent and an array of its direct children.
 - Has an `id` (specified by the user, not necessarily unique) and an `uid` (auto generated, unique).
 - Has a [Visible](http://doc.babylonjs.com/overviews/Canvas2D_Visibility) state that is spreading through the primitive tree.
 - `opacity` and `actualOpacity` states spreading through the primitive tree [more here](http://doc.babylonjs.com/overviews/canvas2d_rendering#rendering-modes)
 - `position/x/y`, `size/width/height`, `rotation`, `scale/scaleX/scaleY`, `origin`, `zOrder` and their `actualXXX` counterpart properties [more info](http://doc.babylonjs.com/overviews/Canvas2D_PosTransHierarchy) to position, size and order them in the Canvas, using the _absolute positioning mode_.
 - `marging`, `padding`, `margingAlignment`, `layoutEngine` properties to rely on the [_positioning engine_](http://doc.babylonjs.com/overviews/Canvas2D_Prim_Positioning)
 - The properties `levelBoundingInfo` for the primitive alone and `boundingInfo` for the primitive and its children to access the bounding Circle and Axis-Aligned Bounding-Box (AABB) and also the World AABB.
 - `isPickable` property to define if the primitive is part of the interaction engine.
 - `intersectWith` and `intersectWithObservable` if the primitive is part of the Primitive Collision Engine to get the list of the Primitives is intersects with and to be notified of new/removed ones.

## Renderable Primitives

This is all primitives type that have a visual representation in the viewport, which everyone except Group2D and the Canvas2D.

 - `ModelKey`: each primitive is assigned a Model, identified by its model key, all primitives instances that can be rendered in the same draw call share the same model. 
 - `ModelRenderCache`: contains all the babylon.js/WebGL resource needed to perform the render of all primitives belonging to the same model. More [here](http://doc.babylonjs.com/overviews/Canvas2D_Overview_Architecture)
 - Detect if the Primitive is either Opaque, AlphaTest or Transparent. More [here](http://doc.babylonjs.com/overviews/canvas2d_rendering#rendering-modes)

## Shape2D based primitives

Which are currently Ellipse2D, Lines2D and Rectlang2D. [Shapes](http://doc.babylonjs.com/overviews/Canvas2D_Shape2D) Primitives share a `border` and a `fill` properties (both optional, but at least one must be specified) of type `IBrush2D`, [info](http://doc.babylonjs.com/overviews/Canvas2D_Brushes).

## Canvas

 - Supporting the HTML's pointerEvent through the `pointerEventObservable` for every primitives of the Canvas when interaction is turned on. Many types of event are supported, along with bubbling through the Canvas hierarchy tree. [More Info](http://doc.babylonjs.com/overviews/Canvas2D_Interaction)
