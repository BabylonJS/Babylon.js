Canvas2D, a 100% WebGL based 2D Engine
====================

## Table of Content

- [Introduction](#introduction)
- [Documentation, want to give feedback, report a bug or need help?](#documentation)
- [Releases](#releases)
- [Features list](features.md) (separated page)
- [How to build it](#how-to-build-babyloncanvas2djs-with-gulp)

## Introduction

Canvas2D is a separated distributed set of .js/.d.ts files laying on the top of the [babylon.js library](../readme.md).

Its purpose is to provide a general featured 2D Engine that will serve as the foundations for:

 - Any 2D Graphics related work
 - A WebGL based GUI Library also present in the library (but under development right now.)

 **Canvas2D provides two types of Canvas**

  - [ScreenSpace](http://babylonjs-playground.com/#272WI1#6) Canvas, lying on the top (or [below](http://babylonjs-playground.com/#RXVJD#2)/between) the 3D content. Typically used for 3D Game/App on screen UI
  - [WorldSpace](http://babylonjs-playground.com/#1BKDEO#22) Canvas, to display the content of a Canvas right in the 3D Scene. You can even make it [track a scene node and using billboard](http://babylonjs-playground.com/#1KYG17#1) mode to make it always face the screen.

## Documentation

#### Overview
There's a full overview [documentation](http://doc.babylonjs.com/overviews/Canvas2D_Home) that we **greatly encourage you to read at least a bit before you start !**

This overview page has many links to other documentation pages (organized like a wiki) you can learn a lot about the basic usage, the different features, how rendering works and the overall architecture of the 2D Engine.

#### Reference
The reference documentation is available [here](http://doc.babylonjs.com/classes/), most of the Canvas2D classes are suffixed by `2D` so you can use it in the filter box like this:![2D classes](http://i.imgur.com/hx4Llmi.png)

#### Using the Forum

If you need help, want to give feedback, report a bug or be aware of the latest development: you have to use the **[Babylon.js forum](http://www.html5gamedevs.com/forum/16-babylonjs/)**.

 - Questions are to be posted [here](http://www.html5gamedevs.com/forum/28-questions-answers/)
 - Bugs reports must be made [there](http://www.html5gamedevs.com/forum/30-bugs/)
 - Check [this post](http://www.html5gamedevs.com/topic/22552-canvas2d-main-post/) to be aware of all the improvements/fixes made during the alpha/beta development of the library. You can check the first post as I update it each time there's new stuff or I simply encourage you to follow the thread to get notified. **Please** don't ask question or report bugs in this thread, create a dedicated one, thanks!
 - [Another post](http://www.html5gamedevs.com/topic/25275-the-gui-lib-of-babylonjs/) was created to track the progress on the GUI Library, same rules and observations as above.

**Important** when you post something you better mentioned me using `@nockawa`, I'm **not** checking the forum everyday but some other users does and ping me if needed, but still: mentioning me is the best way to get my attention.

## Releases

You want to use an existing build, that's simple, you can grab either the latest official release or the latest build of the current developing version.

- The latest official release can be found [here](https://github.com/BabylonJS/Babylon.js/tree/master/dist)
- The latest preview release (which is the current developing version, stable most of the time) can be found [there](https://github.com/BabylonJS/Babylon.js/tree/master/dist/preview%20release/canvas2D)


## How to build babylon.canvas2d.js with Gulp

If you want to locally build the canvas2D library, you can follow the steps below. But sure you've read [this page](http://doc.babylonjs.com/generals/how_to_start) before to learn how to setup your local repository and the general build concepts.

### Gulp
Build Babylon.canvas2d.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

(Paths in this file are relative to this file location.)

### How to use it

From the /Tools/Gulp folder:

#### First install gulp :
```
npm install -g gulp
```

#### Install some dependencies :
```
npm install
```

#### Update dependencies if necessary :
```
npm update
```

### From the javascript source
#### Build Babylon.canvas2d.js:

```
gulp canvas2D
```
Will be generated in dist/preview release/canvas2D:
- babylon.canvas2d.min.js
- babylon.canvas2d.js (unminified)
- babylon.canvas2d.d.ts

#### Build the changed files for debug when you save a typescript or shader file:
```
gulp watch
```

#### Watch and run a web server for debug purpose:
```
gulp run
```

