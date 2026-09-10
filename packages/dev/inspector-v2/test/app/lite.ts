import {
    addSprite2DIndex,
    addToScene,
    createBox,
    createDefaultTextData,
    createDefaultCamera,
    createDirectionalLight,
    createEngine,
    createGridSpriteAtlas,
    createHemisphericLight,
    createPcfDirectionalShadowGenerator,
    createPbrMaterial,
    createPointLight,
    createSceneContext,
    createSolidTexture2D,
    createSphere,
    createSprite2DLayer,
    createSpriteRenderer,
    createStandardMaterial,
    createSpotLight,
    createSurface,
    createTextLayer,
    createTextRenderer,
    createTransformNode,
    disposeDefaultTextData,
    disposeEngine,
    disposeScene,
    disposeSpriteRenderer,
    disposeSurface,
    disposeTextRenderer,
    loadFont,
    registerScene,
    registerSpriteRenderer,
    registerTextRenderer,
    setShadowTaskCasterMeshes,
    startEngine,
    stopEngine,
} from "@babylonjs/lite";

import { ShowInspector } from "../../src/lite/inspector";

const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Unable to find the primary canvas.");
}

const container = document.getElementById("container");
if (!container) {
    throw new Error("Unable to find the canvas container.");
}

const engine = await createEngine(canvas);
const primaryScene = createSceneContext(engine);

const redTexture = createSolidTexture2D(engine, 0.8, 0.1, 0.1);
const blueTexture = createSolidTexture2D(engine, 0.1, 0.2, 0.8);

const standardMaterial = createStandardMaterial();
standardMaterial.name = "Red Standard Material";
standardMaterial.diffuseTexture = redTexture;

const pbrMaterial = createPbrMaterial({
    name: "Blue PBR Material",
    baseColorTexture: blueTexture,
    metallicFactor: 0.1,
    roughnessFactor: 0.6,
});

const box = createBox(engine);
box.name = "Red Box";
box.material = standardMaterial;
box.position.x = -0.75;

const sphere = createSphere(engine, { diameter: 1.2, segments: 24 });
sphere.name = "Blue Sphere";
sphere.material = pbrMaterial;
sphere.position.x = 0.75;

const smallBox = createBox(engine, 0.5);
smallBox.name = "Small Red Box";
smallBox.material = standardMaterial;
smallBox.position.set(0, 1, 0);

addToScene(primaryScene, box);
addToScene(primaryScene, sphere);
const boxGroup = createTransformNode("Box Group", -0.75);
boxGroup.children.push(smallBox);
smallBox.parent = boxGroup;
addToScene(primaryScene, boxGroup);

const hemisphericLight = createHemisphericLight([0, 1, 0], 0.55);
const directionalLight = createDirectionalLight([-0.5, -1, 0.25], 0.45);
directionalLight.position.set(4, 6, -3);
const pointLight = createPointLight([0, 2, -2], 0.15);
const spotLight = createSpotLight([0, 4, -4], [0, -0.5, 1], Math.PI / 3, 2, 0.15);
addToScene(primaryScene, hemisphericLight);
addToScene(primaryScene, directionalLight);
addToScene(primaryScene, pointLight);
addToScene(primaryScene, spotLight);

const shadowGenerator = createPcfDirectionalShadowGenerator(engine, directionalLight, { mapSize: 512 });
directionalLight.shadowGenerator = shadowGenerator;
primaryScene.shadowGenerators.push(shadowGenerator);
setShadowTaskCasterMeshes(shadowGenerator, [box, sphere, smallBox]);
sphere.receiveShadows = true;

const camera = createDefaultCamera(primaryScene);
camera.name = "Main Camera";

await registerScene(primaryScene);

const overlayFont = await loadFont("/fonts/Roboto-Regular.ttf");
const overlayTextData = createDefaultTextData(overlayFont, 16, "Text overlay", [1, 0.85, 0.2, 1]);
const overlayTextLayer = createTextLayer(overlayTextData, {
    positionPx: { x: 365, y: 36 },
    coverageGamma: 2,
});
const textRenderer = createTextRenderer(engine, {
    layers: [overlayTextLayer],
    clear: false,
});
registerTextRenderer(textRenderer);

const secondaryCanvas = document.createElement("canvas");
secondaryCanvas.id = "spriteCanvas";
container.appendChild(secondaryCanvas);

const secondarySurface = createSurface(engine, secondaryCanvas);
const spriteAtlas = createGridSpriteAtlas(blueTexture, {
    cellWidthPx: 1,
    cellHeightPx: 1,
});
const spriteLayer = createSprite2DLayer(spriteAtlas, {
    capacity: 1,
    depth: "none",
});
addSprite2DIndex(spriteLayer, {
    positionPx: [100, 70],
    sizePx: [84, 84],
    rotation: Math.PI / 8,
});
const spriteRenderer = createSpriteRenderer(secondarySurface, {
    layers: [spriteLayer],
    clearValue: { r: 0.05, g: 0.06, b: 0.1, a: 1 },
});
registerSpriteRenderer(spriteRenderer);

await startEngine(engine);

const inspectorToken = ShowInspector(engine);

Object.assign(globalThis, {
    liteCreateSceneContext: createSceneContext,
    liteDisposeScene: disposeScene,
    liteEngine: engine,
    liteMaterials: [standardMaterial, pbrMaterial],
    liteMeshes: [box, sphere, smallBox],
    liteLights: [hemisphericLight, directionalLight, pointLight, spotLight],
    litePrimaryScene: primaryScene,
    liteRegisterScene: registerScene,
    liteSecondarySurface: secondarySurface,
    liteSpriteLayer: spriteLayer,
    liteSpriteRenderer: spriteRenderer,
    liteTextRenderer: textRenderer,
    liteTextRendererLayer: overlayTextLayer,
    liteTextures: [redTexture, blueTexture],
    liteTransformNode: boxGroup,
    liteShadowGenerator: shadowGenerator,
});

window.addEventListener(
    "beforeunload",
    () => {
        void inspectorToken.dispose();
        stopEngine(engine);
        disposeTextRenderer(textRenderer);
        disposeDefaultTextData(overlayTextData);
        disposeScene(primaryScene);
        disposeSpriteRenderer(spriteRenderer);
        disposeSurface(secondarySurface);
        disposeEngine(engine);
    },
    { once: true }
);
