import {
    type FgAccessor,
    type FgNodeSpec,
    type FgRuntime,
    type GpuPicker,
    FgBlockType,
    FgType,
    addFlowGraph,
    addBillboardSpriteIndex,
    addBillboardSystemToScene,
    addDepthHostedSpriteLayerToScene,
    addSprite2DIndex,
    addTextRenderableToScene,
    addToScene,
    buildNodeParticleSet,
    cloneTransformNode,
    attachControl,
    attachSpatialTarget,
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
    createFacingBillboardSystem,
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
    createTexture2DArrayFromPixels,
    createTexture2DFromPixels,
    createTexture3DFromPixels,
    createTextLayer,
    createTextRenderable,
    createTextRenderer,
    createTransformNode,
    detachFlowGraph,
    detachSpatialTarget,
    dispatchFlowGraphEvent,
    disposeDefaultTextData,
    disposeEngine,
    disposeAudioBus,
    disposePicker,
    disposeScene,
    disposeSound,
    disposeSpriteRenderer,
    disposeSurface,
    disposeTextRenderer,
    flowGraphRuntimes,
    enableBoneControl,
    getMeshSkeleton,
    getParticleSystems,
    getSceneBillboardSystems,
    isParticleSystemStarted,
    loadGltf,
    loadCubeTexture,
    parseNodeParticleSource,
    registerNodeParticleSet,
    removeFromScene,
    removeBillboardSystemFromScene,
    removeDepthHostedSpriteLayerFromScene,
    removeTextRenderableFromScene,
    loadFont,
    getRenderingContexts,
    getFrameGraph,
    getFrameGraphTasks,
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
    releaseTexture,
    setMeshVisible,
    setStandardReflectionCubeTexture,
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
import { GetSceneNodes, IsMesh, IsSceneNode } from "../../src/lite/sceneEntityUtils";
import { CreateLiteAudioFixture, type LiteAudioFixture } from "./liteAudio";

// Self-contained GLB: one triangle, two joints and two named morphs. No external buffers, textures or assets.
function CreateSkeletonMorphGlb(): ArrayBuffer {
    const arrays = [
        new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0]),
        new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        new Uint16Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]),
        new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
        new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1, 0, 1]),
        new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0, 0, 0]),
        new Float32Array([0, 0, 0, 0, 0, 0, 0, 0.5, 0]),
    ];
    let byteLength = 0;
    const bufferViews = arrays.map((array) => {
        const view = { buffer: 0, byteOffset: byteLength, byteLength: array.byteLength };
        byteLength += array.byteLength;
        return view;
    });
    const json = {
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [
            { name: "P9 Skinned Morph Mesh", mesh: 0, skin: 0 },
            { name: "P9 Root Bone", children: [2] },
            { name: "P9 Child Bone", translation: [0, 1, 0] },
        ],
        skins: [{ joints: [1, 2], inverseBindMatrices: 4, skeleton: 1 }],
        meshes: [
            {
                weights: [0, 0],
                extras: { targetNames: ["Widen", "Lift"] },
                primitives: [{ attributes: { POSITION: 0, NORMAL: 1, JOINTS_0: 2, WEIGHTS_0: 3 }, targets: [{ POSITION: 5 }, { POSITION: 6 }], material: 0 }],
            },
        ],
        materials: [{ name: "P9 Morph Material", doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.2, 0.8, 0.3, 1], metallicFactor: 0, roughnessFactor: 1 } }],
        buffers: [{ byteLength }],
        bufferViews,
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-0.5, 0, 0], max: [0.5, 1, 0] },
            { bufferView: 1, componentType: 5126, count: 3, type: "VEC3" },
            { bufferView: 2, componentType: 5123, count: 3, type: "VEC4" },
            { bufferView: 3, componentType: 5126, count: 3, type: "VEC4" },
            { bufferView: 4, componentType: 5126, count: 2, type: "MAT4" },
            { bufferView: 5, componentType: 5126, count: 3, type: "VEC3" },
            { bufferView: 6, componentType: 5126, count: 3, type: "VEC3" },
        ],
    };
    const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
    const jsonLength = (jsonBytes.length + 3) & ~3;
    const glb = new ArrayBuffer(12 + 8 + jsonLength + 8 + byteLength);
    const header = new DataView(glb);
    header.setUint32(0, 0x46546c67, true);
    header.setUint32(4, 2, true);
    header.setUint32(8, glb.byteLength, true);
    header.setUint32(12, jsonLength, true);
    header.setUint32(16, 0x4e4f534a, true);
    new Uint8Array(glb, 20, jsonLength).fill(32);
    new Uint8Array(glb, 20, jsonBytes.length).set(jsonBytes);
    header.setUint32(20 + jsonLength, byteLength, true);
    header.setUint32(24 + jsonLength, 0x004e4942, true);
    arrays.forEach((array, index) => new Uint8Array(glb, 28 + jsonLength + bufferViews[index].byteOffset, array.byteLength).set(new Uint8Array(array.buffer)));
    return glb;
}

function CreateParticleGraph(name: string) {
    return parseNodeParticleSource({
        blocks: [
            {
                id: 1,
                customType: "BABYLON.CreateParticleBlock",
                name: "Create",
                inputs: [
                    { name: "lifeTime", value: 2, valueType: "number" },
                    { name: "size", value: 0.12, valueType: "number" },
                    { name: "emitPower", value: 1, valueType: "number" },
                ],
            },
            {
                id: 3,
                customType: "BABYLON.BoxShapeBlock",
                name: "Emitter",
                inputs: [
                    { name: "particle", targetBlockId: 1, targetConnectionName: "particle" },
                    { name: "direction1", value: [-0.3, 1, -0.3], valueType: "BABYLON.Vector3" },
                    { name: "direction2", value: [0.3, 1, 0.3], valueType: "BABYLON.Vector3" },
                    { name: "minEmitBox", value: [-0.1, -0.5, -0.1], valueType: "BABYLON.Vector3" },
                    { name: "maxEmitBox", value: [0.1, -0.5, 0.1], valueType: "BABYLON.Vector3" },
                ],
            },
            { id: 4, customType: "BABYLON.ParticleInputBlock", name: "Position", type: 8, contextualValue: 1 },
            { id: 5, customType: "BABYLON.ParticleInputBlock", name: "Scaled Direction", type: 8, contextualValue: 6 },
            {
                id: 6,
                customType: "BABYLON.ParticleMathBlock",
                name: "Add Position",
                operation: 0,
                inputs: [
                    { name: "left", targetBlockId: 4, targetConnectionName: "output" },
                    { name: "right", targetBlockId: 5, targetConnectionName: "output" },
                ],
            },
            {
                id: 7,
                customType: "BABYLON.UpdatePositionBlock",
                name: "Move",
                inputs: [
                    { name: "particle", targetBlockId: 3, targetConnectionName: "output" },
                    { name: "position", targetBlockId: 6, targetConnectionName: "output" },
                ],
            },
            {
                id: 2,
                customType: "BABYLON.SystemBlock",
                name,
                capacity: 100,
                updateSpeed: 0.01,
                inputs: [
                    { name: "particle", targetBlockId: 7, targetConnectionName: "output" },
                    { name: "emitRate", value: 20, valueType: "number" },
                ],
            },
        ],
    });
}

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
const previewFixtureTextures: Array<ReturnType<typeof createTexture2DFromPixels>> = [];

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

const duckAsset = await loadGltf(engine, "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb");
const duckRoot = duckAsset.entities.find(IsSceneNode);
if (!duckRoot) {
    throw new Error("The textured Duck glTF did not contain a scene node.");
}
duckRoot.name = "Textured Duck";
duckRoot.position.set(0, -1.25, -1.5);
duckRoot.scaling.set(duckRoot.scaling.x * 0.65, duckRoot.scaling.y * 0.65, duckRoot.scaling.z * 0.65);
addToScene(primaryScene, duckAsset);

enableBoneControl();
const skeletonAsset = await loadGltf(engine, CreateSkeletonMorphGlb());
addToScene(primaryScene, skeletonAsset);
const skinnedMesh = GetSceneNodes(primaryScene)
    .filter(IsMesh)
    .find((mesh) => getMeshSkeleton(mesh) && mesh.morphTargets);
if (!skinnedMesh) {
    throw new Error("P9 fixture did not load a skinned morph mesh.");
}
skinnedMesh.name = "P9 Skinned Morph Mesh";
skinnedMesh.position.set(-2, -1, 0);
const morphClone = cloneTransformNode(skinnedMesh);
if (!IsMesh(morphClone)) {
    throw new Error("P9 fixture clone is not a mesh.");
}
morphClone.name = "P9 Shared Morph Clone";
morphClone.position.set(2, -1, 0);
addToScene(primaryScene, morphClone);

const particleSet = await buildNodeParticleSet(engine, primaryScene, CreateParticleGraph("P9 Sparks"));
const sparkTexture = createSolidTexture2D(engine, 1, 0.75, 0.2);
particleSet.systems.forEach((system) => (system.texture = sparkTexture));
registerNodeParticleSet(primaryScene, particleSet);

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
let sceneRenderableFixture:
    | {
          textData: ReturnType<typeof createDefaultTextData>;
          text: ReturnType<typeof createTextRenderable>;
          sprite: ReturnType<typeof createSprite2DLayer>;
          billboard: ReturnType<typeof createFacingBillboardSystem>;
      }
    | undefined;
if (new URLSearchParams(window.location.search).get("sceneRenderables") === "on") {
    const font = await loadFont("/fonts/Roboto-Regular.ttf");
    const textData = createDefaultTextData(font, 16, "Scene text", [1, 1, 1, 1]);
    const text = createTextRenderable(textData, {
        position: { x: -0.4, y: 2.4, z: 0 },
        scaling: { x: 0.01, y: 0.01, z: 0.01 },
        // Avoid Lite 1.39.3's scene bind-group mismatch in the fixture's default draw order.
        order: 201,
    });
    const atlas = createGridSpriteAtlas(blueTexture, { cellWidthPx: 1, cellHeightPx: 1 });
    const sprite = createSprite2DLayer(atlas, { depth: "test" });
    const billboard = createFacingBillboardSystem(atlas);
    addSprite2DIndex(sprite, { positionPx: [canvas.width * 0.5, canvas.height * 0.1], sizePx: [96, 96], z: 0.99 });
    addBillboardSpriteIndex(billboard, { position: [1.7, 1, 0], sizeWorld: [0.6, 0.6] });
    addTextRenderableToScene(primaryScene, text);
    addDepthHostedSpriteLayerToScene(primaryScene, sprite);
    addBillboardSystemToScene(primaryScene, billboard);
    sceneRenderableFixture = { textData, text, sprite, billboard };
}
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
let testAudioFixture: LiteAudioFixture | null = null;
const liteCreateAudioEngine = async () => {
    testAudioFixture ??= await CreateLiteAudioFixture(camera, box, sphere, smallBox);
    inspectorToken.setAudioEngine(testAudioFixture.engine);
    return testAudioFixture.engine;
};
const liteDisposeAudioEngine = () => {
    if (testAudioFixture) {
        inspectorToken.setAudioEngine(null);
        testAudioFixture.dispose();
        testAudioFixture = null;
    }
};

await liteCreateAudioEngine();

let physicsFixture: Promise<void> | undefined;
const createPhysicsFixture = () =>
    (physicsFixture ??= (async () => {
        const { CreateLitePhysicsFixture } = await import("./litePhysics");
        Object.assign(globalThis, { litePhysics: await CreateLitePhysicsFixture(primaryScene, standardMaterial, pbrMaterial) });
    })());

Object.assign(globalThis, {
    liteCreateTexturePreviewFixture: async (kind: "2d" | "2d-array" | "3d" | "cube") => {
        const first = [255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 0, 255];
        const second = [0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255];
        const material = createStandardMaterial();
        material.name = "Texture Preview Fixture Material";
        let texture: Awaited<ReturnType<typeof loadCubeTexture>> | ReturnType<typeof createTexture2DFromPixels>;
        if (kind === "cube") {
            texture = await loadCubeTexture(engine, "/texture-preview-fixture", ".png");
            setStandardReflectionCubeTexture(material, texture);
        } else {
            texture =
                kind === "2d-array"
                    ? createTexture2DArrayFromPixels(engine, new Uint8Array([...first, ...second]), 2, 2, 2, { mipMaps: true })
                    : kind === "3d"
                      ? createTexture3DFromPixels(engine, new Uint8Array([...first, ...second]), 2, 2, 2)
                      : createTexture2DFromPixels(engine, new Uint8Array(first), 2, 2);
            texture.invertY = true;
            previewFixtureTextures.push(texture);
            material.diffuseTexture = texture;
        }
        const mesh = createBox(engine);
        mesh.name = "Texture Preview Fixture";
        mesh.material = material;
        setMeshVisible(mesh, false);
        addToScene(primaryScene, mesh);
        Object.assign(globalThis, { liteTexturePreviewFixture: texture });
    },
    liteCreatePhysics: createPhysicsFixture,
    liteSkinnedMesh: skinnedMesh,
    liteMorphClone: morphClone,
    liteSkeleton: getMeshSkeleton(skinnedMesh),
    liteGetParticleSystems: getParticleSystems,
    liteIsParticleSystemStarted: isParticleSystemStarted,
    liteRegisterSecondParticleSet: async () => {
        const set = await buildNodeParticleSet(engine, primaryScene, CreateParticleGraph("P9 Second Sparks"));
        set.systems.forEach((system) => (system.texture = blueTexture));
        registerNodeParticleSet(primaryScene, set);
    },
    liteRemoveSkinnedMeshes: () => {
        removeFromScene(primaryScene, skinnedMesh);
        removeFromScene(primaryScene, morphClone);
    },
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
    liteCreateAudioEngine,
    liteDisposeAudioEngine,
    liteGetAudioFixture: () => testAudioFixture,
    liteAttachSpatialTarget: attachSpatialTarget,
    liteDetachSpatialTarget: detachSpatialTarget,
    liteDisposeAudioBus: disposeAudioBus,
    liteDisposeSound: disposeSound,
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
    liteSceneRenderableFixture: sceneRenderableFixture,
    liteGetSceneBillboardSystems: () => getSceneBillboardSystems(primaryScene),
    liteRemoveSceneText: () => sceneRenderableFixture && removeTextRenderableFromScene(primaryScene, sceneRenderableFixture.text),
    liteRemoveSceneSprite: () => sceneRenderableFixture && removeDepthHostedSpriteLayerFromScene(primaryScene, sceneRenderableFixture.sprite),
    liteRemoveSceneBillboard: () => sceneRenderableFixture && removeBillboardSystemFromScene(primaryScene, sceneRenderableFixture.billboard),
    liteGetFrameGraphTaskState: () => getFrameGraphTasks(getFrameGraph(primaryScene)).map((task) => ({ name: task.name, executionEnabled: task.executionEnabled })),
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
        liteDisposeAudioEngine();
        void inspectorToken.dispose();
        detachCameraControl();
        stopEngine(engine);
        stopAnimationManager(animationManager);
        clearAnimationManager(animationManager);
        previewFixtureTextures.forEach((texture) => releaseTexture(texture));
        disposeTextRenderer(textRenderer);
        disposeDefaultTextData(overlayTextData);
        disposeDefaultTextData(backgroundTextData);
        disposeScene(primaryScene);
        if (sceneRenderableFixture) {
            disposeDefaultTextData(sceneRenderableFixture.textData);
        }
        disposeSpriteRenderer(spriteRenderer);
        disposeSurface(secondarySurface);
        disposeEngine(engine);
    },
    { once: true }
);

if (new URLSearchParams(window.location.search).get("physics") !== "off") {
    await createPhysicsFixture();
}
