import {
    type FgAccessor,
    type FgNodeSpec,
    type FgRuntime,
    type GpuPicker,
    FgBlockType,
    FgType,
    addFlowGraph,
    addSprite2DIndex,
    addToScene,
    attachControl,
    buildFgGraph,
    createBox,
    createAnimationManager,
    createPropertyAnimationClip,
    createPropertyAnimationGroup,
    createDefaultTextData,
    createDefaultCamera,
    createDirectionalLight,
    createEngine,
    createGridSpriteAtlas,
    createGpuPicker,
    createHemisphericLight,
    createPcfDirectionalShadowGenerator,
    createPbrMaterial,
    createPointLight,
    createPickingRay,
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
    detachFlowGraph,
    dispatchFlowGraphEvent,
    disposeDefaultTextData,
    disposeEngine,
    disposePicker,
    disposeScene,
    disposeSpriteRenderer,
    disposeSurface,
    disposeTextRenderer,
    flowGraphRuntimes,
    loadFont,
    getRenderingContexts,
    getViewProjectionMatrix,
    isGizmoDragging,
    isGizmoPickPending,
    markMaterialUboDirty,
    pickAsync,
    pickWithRay,
    getRenderTaskGpuTimings,
    registerScene,
    registerSpriteRenderer,
    registerTextRenderer,
    setShadowTaskCasterMeshes,
    setRenderTaskGpuTimingEnabled,
    setPbrEmissive,
    startEngine,
    stopEngine,
    startAnimationManager,
    stopAnimationManager,
    clearAnimationManager,
    waitForGpuResourceRetirements,
} from "@babylonjs/lite";

import { ShowInspector } from "../../src/lite/inspector";

const inertFlowGraphSpecs: readonly FgNodeSpec[] = [
    {
        id: "sceneReady",
        type: FgBlockType.SceneStart,
        signalTargets: { out: [{ blockId: "noOp", socket: "in" }] },
    },
    { id: "noOp", type: FgBlockType.NoOp },
];

const defaultFlowGraphSpecs: readonly FgNodeSpec[] = [
    ...inertFlowGraphSpecs,
    {
        id: "sphereClicked",
        type: FgBlockType.ReceiveCustomEvent,
        config: { eventId: "blueSphereClicked" },
        signalTargets: { out: [{ blockId: "toggleGlow", socket: "in" }] },
    },
    {
        id: "isGlowing",
        type: FgBlockType.GetProperty,
        config: { accessor: "/blueSphere/glowing", type: FgType.Boolean },
    },
    {
        id: "toggleGlow",
        type: FgBlockType.Branch,
        dataSources: { condition: { blockId: "isGlowing", socket: "value" } },
        signalTargets: {
            onTrue: [{ blockId: "glowOff", socket: "in" }],
            onFalse: [{ blockId: "glowOn", socket: "in" }],
        },
    },
    {
        id: "glowOn",
        type: FgBlockType.SetProperty,
        config: { accessor: "/blueSphere/glowing", type: FgType.Boolean },
        dataDefaults: { value: true },
    },
    {
        id: "glowOff",
        type: FgBlockType.SetProperty,
        config: { accessor: "/blueSphere/glowing", type: FgType.Boolean },
        dataDefaults: { value: false },
    },
];

const sphereEmissive: [number, number, number] = [0, 0, 0];

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
setPbrEmissive(pbrMaterial, sphereEmissive);

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

const animationManager = createAnimationManager({ engine });
const boxAnimation = createPropertyAnimationGroup(
    animationManager,
    box,
    createPropertyAnimationClip("Box Bounce", [
        {
            path: "position",
            keys: [
                { frame: 0, value: [-0.75, 0, 0] },
                { frame: 60, value: [-0.75, 0.75, 0] },
                { frame: 120, value: [-0.75, 0, 0] },
            ],
        },
    ])
);
const sphereAnimation = createPropertyAnimationGroup(
    animationManager,
    sphere,
    createPropertyAnimationClip("Sphere Pulse", [
        {
            path: "scaling",
            keys: [
                { frame: 0, value: [1, 1, 1] },
                { frame: 60, value: [0.65, 0.65, 0.65] },
                { frame: 120, value: [1, 1, 1] },
            ],
        },
    ])
);
primaryScene.animationGroups.push(boxAnimation, sphereAnimation);
startAnimationManager(animationManager);

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

const camera = createDefaultCamera(primaryScene);
camera.name = "Main Camera";
const detachCameraControl = attachControl(camera, canvas, primaryScene);

let spherePicker: GpuPicker | undefined;
let spherePicksPending = 0;
let spherePickerRetired = false;
let spherePickCount = 0;
const pickSphereAsync = async (x: number, y: number) => {
    if (spherePickerRetired) {
        return;
    }
    spherePicker ??= createGpuPicker(primaryScene);
    spherePicksPending++;
    try {
        const result = await pickAsync(spherePicker, x, y, { filter: (mesh) => mesh.visible !== false && mesh.pickable !== false });
        if (!spherePickerRetired && result.hit && result.pickedMesh === sphere) {
            dispatchFlowGraphEvent(primaryScene, "blueSphereClicked");
        }
    } catch (error) {
        if (!spherePickerRetired) {
            throw error;
        }
    } finally {
        spherePicksPending--;
        spherePickCount++;
        if (spherePickerRetired && spherePicksPending === 0) {
            disposePicker(spherePicker);
        }
    }
};
let spherePointerDown: { pointerId: number; x: number; y: number } | undefined;
const onSpherePointerDown = (event: PointerEvent) => {
    if (event.button === 0) {
        spherePointerDown = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    }
};
const onSpherePointerMove = (event: PointerEvent) => {
    if (spherePointerDown?.pointerId === event.pointerId && Math.hypot(event.clientX - spherePointerDown.x, event.clientY - spherePointerDown.y) > 5) {
        spherePointerDown = undefined;
    }
};
const onSpherePointerCancel = (event: PointerEvent) => {
    if (spherePointerDown?.pointerId === event.pointerId) {
        spherePointerDown = undefined;
    }
};
const onSpherePointerUp = (event: PointerEvent) => {
    const down = spherePointerDown;
    if (!down || down.pointerId !== event.pointerId || event.button !== 0) {
        return;
    }
    spherePointerDown = undefined;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) {
        return;
    }
    const ray = createPickingRay(event.offsetX, event.offsetY, getViewProjectionMatrix(camera, canvas.clientWidth / canvas.clientHeight), canvas.clientWidth, canvas.clientHeight);
    if (ray && pickWithRay(primaryScene, ray, { predicate: (mesh) => mesh === sphere }).hit) {
        void pickSphereAsync(event.offsetX, event.offsetY);
    }
};
canvas.addEventListener("pointerdown", onSpherePointerDown);
canvas.addEventListener("pointermove", onSpherePointerMove);
canvas.addEventListener("pointerup", onSpherePointerUp);
canvas.addEventListener("pointercancel", onSpherePointerCancel);

const sphereGlowAccessor: FgAccessor = {
    type: FgType.Boolean,
    get: () => sphereEmissive[0] > 0,
    set: (value) => {
        sphereEmissive[0] = value === true ? 1 : 0;
        sphereEmissive[1] = value === true ? 0.55 : 0;
        sphereEmissive[2] = 0;
        markMaterialUboDirty(pbrMaterial);
    },
    target: pbrMaterial,
};
const defaultFlowGraph = await addFlowGraph(primaryScene, await buildFgGraph(defaultFlowGraphSpecs), {
    accessors: { "/blueSphere/glowing": sphereGlowAccessor },
});
await registerScene(primaryScene);

const overlayFont = await loadFont("/fonts/Roboto-Regular.ttf");
const overlayTextData = createDefaultTextData(overlayFont, 16, "Text overlay", [1, 0.85, 0.2, 1]);
const backgroundTextData = createDefaultTextData(overlayFont, 14, "Background layer", [0.55, 0.75, 1, 1]);
const overlayTextLayer = createTextLayer(overlayTextData, {
    positionPx: { x: 365, y: 36 },
    coverageGamma: 2,
    order: 10,
});
const backgroundTextLayer = createTextLayer(backgroundTextData, {
    positionPx: { x: 365, y: 62 },
    order: 0,
});
const textRenderer = createTextRenderer(engine, {
    layers: [overlayTextLayer, backgroundTextLayer],
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
const backgroundSpriteAtlas = createGridSpriteAtlas(redTexture, {
    cellWidthPx: 1,
    cellHeightPx: 1,
});
const spriteLayer = createSprite2DLayer(spriteAtlas, {
    capacity: 1,
    depth: "none",
    order: 10,
});
addSprite2DIndex(spriteLayer, {
    positionPx: [100, 70],
    sizePx: [84, 84],
    rotation: Math.PI / 8,
});
const backgroundSpriteLayer = createSprite2DLayer(backgroundSpriteAtlas, {
    capacity: 1,
    depth: "none",
    opacity: 0.8,
    order: 0,
});
addSprite2DIndex(backgroundSpriteLayer, {
    positionPx: [205, 70],
    sizePx: [64, 64],
    rotation: -Math.PI / 10,
});
const spriteRenderer = createSpriteRenderer(secondarySurface, {
    layers: [spriteLayer, backgroundSpriteLayer],
    clearValue: { r: 0.05, g: 0.06, b: 0.1, a: 1 },
});
registerSpriteRenderer(spriteRenderer);

await startEngine(engine);

const inspectorToken = ShowInspector(engine);

Object.assign(globalThis, {
    liteDefaultFlowGraph: defaultFlowGraph,
    liteAttachFlowGraph: async () => addFlowGraph(primaryScene, await buildFgGraph(inertFlowGraphSpecs)),
    liteDetachFlowGraph: (runtime: FgRuntime) => {
        if (runtime === defaultFlowGraph) {
            throw new Error("The default flow graph belongs to the Lite test scene and must not be detached.");
        }
        detachFlowGraph(primaryScene, runtime);
    },
    liteFlowGraphCount: () => flowGraphRuntimes(primaryScene).length,
    liteFlowGraphRuntimes: () => [...flowGraphRuntimes(primaryScene)],
    liteBlueSphereGlowing: () => sphereGlowAccessor.get() === true,
    liteBlueSpherePickCount: () => spherePickCount,
    liteInspectorToken: inspectorToken,
    liteShowInspector: ShowInspector,
    liteGetRenderTaskGpuTimings: getRenderTaskGpuTimings,
    liteSetRenderTaskGpuTimingEnabled: setRenderTaskGpuTimingEnabled,
    liteCreateSceneContext: createSceneContext,
    liteDisposeScene: disposeScene,
    liteEngine: engine,
    liteGetRenderingContexts: getRenderingContexts,
    liteGetViewProjectionMatrix: getViewProjectionMatrix,
    liteIsGizmoDragging: isGizmoDragging,
    liteIsGizmoPickPending: isGizmoPickPending,
    liteStopAnimationManager: stopAnimationManager,
    liteStopEngine: stopEngine,
    liteWaitForGpuResourceRetirements: waitForGpuResourceRetirements,
    liteAnimationManager: animationManager,
    liteAnimationGroups: [boxAnimation, sphereAnimation],
    liteMaterials: [standardMaterial, pbrMaterial],
    liteMeshes: [box, sphere, smallBox],
    liteLights: [hemisphericLight, directionalLight, pointLight, spotLight],
    litePrimaryScene: primaryScene,
    liteRegisterScene: registerScene,
    liteSecondarySurface: secondarySurface,
    liteSpriteLayer: spriteLayer,
    liteSpriteLayers: [spriteLayer, backgroundSpriteLayer],
    liteSpriteRenderer: spriteRenderer,
    liteTextRenderer: textRenderer,
    liteTextRendererLayer: overlayTextLayer,
    liteTextRendererLayers: [overlayTextLayer, backgroundTextLayer],
    liteTextures: [redTexture, blueTexture],
    liteTransformNode: boxGroup,
    liteShadowGenerator: shadowGenerator,
});

window.addEventListener(
    "beforeunload",
    () => {
        spherePickerRetired = true;
        if (spherePicker && spherePicksPending === 0) {
            disposePicker(spherePicker);
        }
        canvas.removeEventListener("pointerdown", onSpherePointerDown);
        canvas.removeEventListener("pointermove", onSpherePointerMove);
        canvas.removeEventListener("pointerup", onSpherePointerUp);
        canvas.removeEventListener("pointercancel", onSpherePointerCancel);
        void inspectorToken.dispose();
        detachCameraControl();
        stopEngine(engine);
        stopAnimationManager(animationManager);
        clearAnimationManager(animationManager);
        disposeTextRenderer(textRenderer);
        disposeDefaultTextData(overlayTextData);
        disposeDefaultTextData(backgroundTextData);
        disposeScene(primaryScene);
        disposeSpriteRenderer(spriteRenderer);
        disposeSurface(secondarySurface);
        disposeEngine(engine);
    },
    { once: true }
);
