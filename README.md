# Babylon.js

Getting started? Play directly with the Babylon.js API using our [playground](https://playground.babylonjs.com/). It also contains a lot of samples to learn how to use it.

[![npm version](https://badge.fury.io/js/babylonjs.svg)](https://badge.fury.io/js/babylonjs)
[![Build Status](https://dev.azure.com/babylonjs/ContinousIntegration/_apis/build/status/CI?branchName=master)](https://dev.azure.com/babylonjs/ContinousIntegration/_build/latest?definitionId=14&branchName=master)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/BabylonJS/Babylon.js.svg)](http://isitmaintained.com/project/BabylonJS/Babylon.js "Average time to resolve an issue")
[![Percentage of issues still open](https://isitmaintained.com/badge/open/babylonJS/babylon.js.svg)](https://isitmaintained.com/project/babylonJS/babylon.js "Percentage of issues still open")
![Build size](https://img.shields.io/bundlephobia/minzip/babylonjs)
[![Twitter](https://img.shields.io/twitter/follow/babylonjs.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=babylonjs)
![Discourse users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fforum.babylonjs.com)

**Any questions?** Here is our official [forum](https://forum.babylonjs.com/).

## CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

- <https://cdn.babylonjs.com/babylon.js>
- <https://cdn.babylonjs.com/babylon.max.js>


For the preview release, use the following URLs:

- <https://preview.babylonjs.com/babylon.js>
- <https://preview.babylonjs.com/babylon.max.js>

A list of additional references can be found [here](https://doc.babylonjs.com/divingDeeper/developWithBjs/frameworkVers#cdn-current-versions).

## npm

BabylonJS and its modules are published on npm with full typing support. To install, use:

```text
npm install babylonjs --save
```

> alternatively, you can now rely on our [ES6 packages](https://doc.babylonjs.com/setup/frameworkPackages/npmSupport#es6). Using the ES6 version will allow tree shaking among other bundling benefits.

This will allow you to import BabylonJS entirely using:

```javascript
import * as BABYLON from 'babylonjs';
```

or individual classes using:

```javascript
import { Scene, Engine } from 'babylonjs';
```

If using TypeScript, don't forget to add 'babylonjs' to 'types' in `tsconfig.json`:

```json
    ...
    "types": [
        "babylonjs",
        "anotherAwesomeDependency"
    ],
    ...
```

To add a module, install the respective package. A list of extra packages and their installation instructions can be found on the [babylonjs user on npm](https://www.npmjs.com/~babylonjs).

## Usage

See [Getting Started](https://doc.babylonjs.com/#getting-started):

```javascript
// Get the canvas DOM element
var canvas = document.getElementById('renderCanvas');
// Load the 3D engine
var engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
// CreateScene function that creates and return the scene
var createScene = function(){
    // Create a basic BJS Scene object
    var scene = new BABYLON.Scene(engine);
    // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
    // Target the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());
    // Attach the camera to the canvas
    camera.attachControl(canvas, false);
    // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    // Create a built-in "sphere" shape using the SphereBuilder
    var sphere = BABYLON.MeshBuilder.CreateSphere('sphere1', {segments: 16, diameter: 2, sideOrientation: BABYLON.Mesh.FRONTSIDE}, scene);
    // Move the sphere upward 1/2 of its height
    sphere.position.y = 1;
    // Create a built-in "ground" shape;
    var ground = BABYLON.MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2, updatable: false }, scene);
    // Return the created scene
    return scene;
}
// call the createScene function
var scene = createScene();
// run the render loop
engine.runRenderLoop(function(){
    scene.render();
});
// the canvas/window resize event handler
window.addEventListener('resize', function(){
    engine.resize();
});
```

## Contributing

If you want to contribute, please read our [contribution guidelines](https://doc.babylonjs.com/contribute/toBabylon) first.

## Documentation

- [Documentation](https://doc.babylonjs.com)
- [Demos](https://www.babylonjs.com/community/)

## Useful links

- Official web site: [www.babylonjs.com](https://www.babylonjs.com/)
- Online [playground](https://playground.babylonjs.com/) to learn by experimentating
- Online [sandbox](https://www.babylonjs.com/sandbox) where you can test your .babylon and glTF scenes with a simple drag'n'drop
- Online [shader creation tool](https://cyos.babylonjs.com/) where you can learn how to create GLSL shaders
- 3DS Max [exporter](https://github.com/BabylonJS/Exporters/tree/master/3ds%20Max) can be used to generate a .babylon file from 3DS Max
- Maya [exporter](https://github.com/BabylonJS/Exporters/tree/master/Maya) can be used to generate a .babylon file from Maya
- Blender [exporter](https://github.com/BabylonJS/BlenderExporter) can be used to generate a .babylon file from Blender 3d
- Unity 5[ (deprecated) exporter](https://github.com/BabylonJS/Exporters/tree/master/Unity) can be used to export your geometries from Unity 5 scene editor(animations are supported)
- [glTF Tools](https://github.com/KhronosGroup/glTF#gltf-tools) by KhronosGroup

## Features

To get a complete list of supported features, please visit our [website](https://www.babylonjs.com/specifications/).


## 🌐 Web Resources & Interactive Index
- [CATEGORY MINECRAFT81](https://studyplayings.web.app/category-minecraft81.html)
- [BURGER HERE](https://themindzone.pages.dev/burger-here.html)
- [CATEGORY IDLE445](https://themindplays.pages.dev/category-idle445.html)
- [SEEK FIND](https://iskillquest.pages.dev/seek-find.html)
- [ANIMAL MERGE ZOO PARK](https://thelearnquester.web.app/animal-merge-zoo-park.html)
- [CATEGORY ARENA255](https://studyquests.pages.dev/category-arena255.html)
- [FROM NERD TO SCHOOL POPULAR](https://iskillplay.web.app/from-nerd-to-school-popular.html)
- [GLADIATOR FIGHTS](https://learnquester.github.io/gladiator-fights.html)
- [CRAZY BAR BRAWL](https://studyplaying.github.io/crazy-bar-brawl.html)
- [NOOB FUN FISHING](https://quizverses-9d2f2.web.app/noob-fun-fishing.html)
- [POPPY STRIKE 5](https://quizverses.github.io/poppy-strike-5.html)
- [CATEGORY MOUSE1 699](https://learnquesters.pages.dev/category-mouse1-699.html)
- [CATEGORY BOOKMARKLETS](https://iskillquest.pages.dev/category-bookmarklets.html)
- [DRAW BRIGE PUZZLE](https://themindplay.pages.dev/draw-brige-puzzle.html)
- [STICKMAN GUN SHOOTER](https://studyplaying.github.io/stickman-gun-shooter.html)
- [PACKING LINE](https://studyplayings.web.app/packing-line.html)
- [CATEGORY CAT55](https://studyplayings.web.app/category-cat55.html)
- [STUNT CAR EXTREME 2](https://learnquester.github.io/stunt-car-extreme-2.html)
- [GOLF MINI](https://thequizzone.pages.dev/golf-mini.html)
- [CATEGORY MAKEUP](https://iskillquest.pages.dev/category-makeup.html)
- [RACCOON RETAIL](https://themindplay.pages.dev/raccoon-retail.html)
- [FORMULA TRAFFIC RACER](https://quizverses-9d2f2.web.app/formula-traffic-racer.html)
- [CATEGORY FOOD](https://iskillquest.pages.dev/category-food.html)
- [CATEGORY PIXEL313](https://iskillquest.pages.dev/category-pixel313.html)
- [CATEGORY FOOTBALL](https://quizverses.github.io/category-football.html)
- [CATEGORY COLLECT565](https://themindzone.pages.dev/category-collect565.html)
- [BOXTERIA](https://thelearnquester.web.app/boxteria.html)
- [DRAGON ESCAPE](https://thequizzone.pages.dev/dragon-escape.html)
- [PULL THE THREAD PUZZLE](https://themindskillplayplay.pages.dev/pull-the-thread-puzzle.html)
- [FIND THE CAT CAT SEARCH](https://studyquesthub.web.app/find-the-cat-cat-search.html)
- [CATEGORY BASKETBALL](https://studyplayings.web.app/category-basketball.html)
- [SORTING CANDY FACTORY](https://themindplay.pages.dev/sorting-candy-factory.html)
- [BOUNCY BOMB BUDDIES](https://themindplay.pages.dev/bouncy-bomb-buddies.html)
- [DOGE MATCH](https://quizverses.github.io/doge-match.html)
- [FRUIT BALLS JUICY FUSION](https://themindplaying.web.app/fruit-balls-juicy-fusion.html)
- [NEON GRAVITY](https://iskillplay.web.app/neon-gravity.html)
- [OVERFLOWING PALETTE](https://themindskillplayplay.pages.dev/overflowing-palette.html)
- [SLIPPERY DRIFT RACING](https://thequizzone.pages.dev/slippery-drift-racing.html)
- [CATEGORY IDLE](https://themindskillplayplay.pages.dev/category-idle.html)
- [BUILDING MODS FOR MINECRAFT](https://themindplay.pages.dev/building-mods-for-minecraft.html)
- [JEWELRY IDLE](https://theskillquest.pages.dev/jewelry-idle.html)
- [LINE ON HOLE](https://theskillquest.pages.dev/line-on-hole.html)
- [MY FARM EMPIRE](https://themindplay.pages.dev/my-farm-empire.html)
- [MINI SHOOTERS](https://thequizzone.pages.dev/mini-shooters.html)
- [PUMPKIN PATCH](https://thequizzone.pages.dev/pumpkin-patch.html)
- [OBBY BLOX HOOK](https://quizverses.github.io/obby-blox-hook.html)
- [SIGIL SEEKER](https://quizverses.github.io/sigil-seeker.html)
- [FAMILY SIMULATOR BEACH GAMES](https://themindplay.pages.dev/family-simulator-beach-games.html)
- [KICK LUCKY BOXES ONLINE](https://themindplaying.web.app/kick-lucky-boxes-online.html)
- [BRICK MATCH](https://studyplayings.web.app/brick-match.html)
- [INDEX16](https://studyquesthub.web.app/index16.html)
- [99 BALLS](https://themindplay.pages.dev/99-balls.html)
- [COSMO PUZZLE](https://themindplaying.web.app/cosmo-puzzle.html)
- [STICKMAN TEAM DETROIT](https://themindskillplayplay.pages.dev/stickman-team-detroit.html)
- [ITALIAN BRAINROT FIND THE DIFFERENCES](https://quizverses.github.io/italian-brainrot-find-the-differences.html)
- [CATEGORY PIXEL313](https://studyplayings.web.app/category-pixel313.html)
- [CHICKEN BANANA QUEST](https://themindplay.github.io/chicken-banana-quest.html)
- [GRADUATION MAKEUP TRENDS](https://studyplaying.github.io/graduation-makeup-trends.html)
- [TEACHER SIMULATOR](https://themindplaying.web.app/teacher-simulator.html)
- [CATEGORY 3 PLAYER26](https://themindplay.github.io/category-3-player26.html)
- [AVATAR MASTER FIX UP FACE](https://studyplayings.web.app/avatar-master-fix-up-face.html)
- [SCARY PAIRS](https://quizverses.github.io/scary-pairs.html)
- [CATEGORY TOWER DEFENSE118](https://themindplaying.web.app/category-tower-defense118.html)
- [CELEBRITY SPRING MANICURE DESIGN](https://iskillplay.web.app/celebrity-spring-manicure-design.html)
- [CATEGORY PROXY](https://iskillquest.pages.dev/category-proxy.html)
- [CAR DESTRUCTION KING](https://thelearnquester.web.app/car-destruction-king.html)
- [CATEGORY SOCCER60](https://thelearnquester.web.app/category-soccer60.html)
- [BOUNCY BLOB RACE OBSTACLE COURSE](https://iskillquest.pages.dev/bouncy-blob-race-obstacle-course.html)
- [BEAT MUSIC BATTLE](https://studyplaying.github.io/beat-music-battle.html)
- [MONSTER DUELIST](https://iskillquest.pages.dev/monster-duelist.html)
- [PHYSICS BALLS](https://themindskillplayplay.pages.dev/physics-balls.html)
- [STRIPED FRUIT WATERMELON LAND](https://themindplaying.web.app/striped-fruit-watermelon-land.html)
- [WINTER MAZE](https://theskillquest.pages.dev/winter-maze.html)
- [SUDOKU VAULT](https://quizverses.github.io/sudoku-vault.html)
- [HAPPY COLOR](https://themindplaying.web.app/happy-color.html)
- [ROOTLINGS SECRETS OF THE DEPTHS](https://themindplay.pages.dev/rootlings-secrets-of-the-depths.html)
- [MERGE MASTER](https://themindplay.pages.dev/merge-master.html)
- [GIANT SUSHI MERGE MASTER GAME](https://iskillquest.pages.dev/giant-sushi-merge-master-game.html)
- [ONLINE CAR DESTRUCTION SIMULATOR 3D](https://quizverses.github.io/online-car-destruction-simulator-3d.html)
- [CATEGORY ROGUELIKE GAMES](https://learnquester.github.io/category-roguelike-games.html)
- [CUTE COLORING GAMES](https://iskillplay.web.app/cute-coloring-games.html)
- [LABUBU MERGE](https://themindplaying.web.app/labubu-merge.html)
- [ZOMBIE CONQUER COUNTRIES](https://quizverses.github.io/zombie-conquer-countries.html)
- [DUNGEON MASTER CULT CRAFT](https://quizverses.github.io/dungeon-master-cult-craft.html)
- [CATEGORY AGILITY](https://themindplays.pages.dev/category-agility.html)
- [SUPER MX LAST SEASON](https://quizverses.github.io/super-mx-last-season.html)
- [INDEX7](https://themindzone.pages.dev/index7.html)
- [SMASHDOLL](https://studyplaying.github.io/smashdoll.html)
- [DOGE MATCH](https://thequizzone.pages.dev/doge-match.html)
- [VOXIOM IO](https://studyquesthub.web.app/voxiom-io.html)
- [FROM NERD TO SCHOOL POPULAR](https://iskillquest.pages.dev/from-nerd-to-school-popular.html)
- [CATEGORY INTERSTELLARUNBLOCKER](https://learnquester.github.io/category-interstellarunblocker.html)
- [STACK N SORT](https://quizverses.github.io/stack-n-sort.html)
- [SITEMAP](https://iskillquest.pages.dev/sitemap.html)
- [COLORWARSIO](https://thequizzone.pages.dev/colorwarsio.html)
- [ANIMALS MERGE](https://studyplaying.github.io/animals-merge.html)
- [MUSKETEERS GUNPOWDER VS STEEL](https://studyquests.github.io/musketeers-gunpowder-vs-steel.html)
- [PRINCESS RESCUE SAVE GIRL](https://studyquests.github.io/princess-rescue-save-girl.html)
- [CALL OF THE JUNGLE ANIMAL EVOLUTION](https://studyplaying.github.io/call-of-the-jungle-animal-evolution.html)
- [OVER THE RAINBOW](https://quizverses.github.io/over-the-rainbow.html)
- [CRICKET CLASH PONG](https://thequizzone.pages.dev/cricket-clash-pong.html)
- [CATEGORY MAHJONG CONNECT](https://themindskillplayplay.pages.dev/category-mahjong-connect.html)
- [CATEGORY RACING127](https://themindskillplayplay.pages.dev/category-racing127.html)
- [WINTER WOLF](https://studyplaying.github.io/winter-wolf.html)
- [CATEGORY BOARDGAMES](https://iskillplay.web.app/category-boardgames.html)
- [CATEGORY CAR 2](https://studyplayings.web.app/category-car-2.html)
- [MY LITTLE CAR WASH](https://themindplaying.web.app/my-little-car-wash.html)
- [POWERWASH SIMULATOR 3D WASH](https://quizverses.github.io/powerwash-simulator-3d-wash.html)
- [MINI GAMES RELAX COLLECTION 2](https://themindskillplayplay.pages.dev/mini-games-relax-collection-2.html)
- [TONY ARCHER](https://studyplaying.github.io/tony-archer.html)
- [SORT GAMES CHALLENGE](https://iskillquest.pages.dev/sort-games-challenge.html)
- [PERFECT SHOT](https://quizverses.github.io/perfect-shot.html)
- [PIRATE PARADISE](https://iskillquest.pages.dev/pirate-paradise.html)
- [QUIZ 10 SECONDS MATH](https://learnquester.github.io/quiz-10-seconds-math.html)
- [HIDDEN OBJECTS BAKERY](https://learnquester.github.io/hidden-objects-bakery.html)
- [CATEGORY EDUCATIONAL25](https://themindskillplayplay.pages.dev/category-educational25.html)
- [WOOLLOOP COLOR PUZZLE](https://studyplaying.github.io/woolloop-color-puzzle.html)
- [DARK MYTH MONKEY MERGE](https://quizverses.github.io/dark-myth-monkey-merge.html)
- [CAKE SORT](https://quizverses.github.io/cake-sort.html)
- [RICH CHOICE RUN](https://iskillplay.web.app/rich-choice-run.html)
- [GAS STATION JUNKYARD TYCOON](https://studyplaying.github.io/gas-station-junkyard-tycoon.html)
- [AUTOGUN HEROES IZK](https://themindplaying.web.app/autogun-heroes-izk.html)
- [PUSH IT 3D](https://thequizzone.pages.dev/push-it-3d.html)
- [BRAWLER MAN FIST OF FURY](https://iskillplay.web.app/brawler-man-fist-of-fury.html)
- [SWEET MERGE](https://themindplaying.web.app/sweet-merge.html)
- [2048 DROP MERGE](https://quizverses.github.io/2048-drop-merge.html)
- [MR LONG LEGS](https://studyplaying.github.io/mr-long-legs.html)
- [SANDSTORM COVERT OPS](https://studyplaying.github.io/sandstorm-covert-ops.html)
- [MAZE HIDE OR SEEK](https://themindplaying.web.app/maze-hide-or-seek.html)
- [FISH STORY 4](https://themindplay.pages.dev/fish-story-4.html)
