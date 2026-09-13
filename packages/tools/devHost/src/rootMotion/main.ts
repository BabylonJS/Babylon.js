import { type AnimationGroup } from "core/Animations/animationGroup";
import { RootMotion, RootMotionSource, type IRootMotionOptions } from "core/Animations/rootMotion";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Engine } from "core/Engines/engine";
import { DirectionalLight } from "core/Lights/directionalLight";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { type AssetContainer } from "core/assetContainer";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { Color3, Color4 } from "core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { type Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { TransformNode } from "core/Meshes/transformNode";
import "core/Meshes/thinInstanceMesh";
import { Scene } from "core/scene";
import { GridMaterial } from "materials/grid/gridMaterial";
import "loaders/glTF/2.0/glTFLoader";

/**
 * Root motion validation: drop an animated glTF on the page, pick a clip, and watch whether the character travels with
 * planted feet. Footprints mark where the lowest foot touched down - a clean trail of prints means no skating, a smear
 * means the travel and the pose disagree.
 */

const Samples = [
    { name: "Xbot", url: "https://assets.babylonjs.com/meshes/Xbot.glb" },
    { name: "HVGirl", url: "https://assets.babylonjs.com/meshes/HVGirl.glb" },
];

const enum Mode {
    Auto = "auto",
    Root = "root",
    Feet = "feet",
    Off = "off",
}

const MaxFootprints = 400;
const FootprintInterval = 0.08;

interface IPanel {
    status: HTMLDivElement;
    clips: HTMLDivElement;
    readout: HTMLPreElement;
    mode: HTMLSelectElement;
    lateral: HTMLInputElement;
    snap: HTMLSelectElement;
    follow: HTMLInputElement;
    speed: HTMLInputElement;
    speedLabel: HTMLSpanElement;
}

function Element<K extends keyof HTMLElementTagNameMap>(tag: K, parent: HTMLElement, css = "", text = ""): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    element.style.cssText = css;
    element.textContent = text;
    parent.appendChild(element);
    return element;
}

function CreatePanel(container: HTMLElement): { panel: IPanel; onLoad: (handler: (source: File | string) => void) => void; onReset: (handler: () => void) => void } {
    const root = Element(
        "div",
        container,
        "position:absolute;top:12px;left:12px;z-index:10;width:320px;padding:12px;background:#0d1117e6;color:#e6edf3;font:13px/1.45 system-ui,sans-serif;border:1px solid #30363d;border-radius:6px"
    );
    Element("div", root, "font-weight:600;font-size:15px;margin-bottom:4px", "Root motion");
    const status = Element("div", root, "color:#8b949e;margin-bottom:8px", "Drop a .glb or .gltf with animations anywhere on the page.");

    const loadRow = Element("div", root, "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px");
    const picker = Element("input", loadRow, "display:none");
    picker.type = "file";
    picker.accept = ".glb,.gltf";
    const button = (parent: HTMLElement, label: string) =>
        Element("button", parent, "background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:4px;padding:3px 8px;cursor:pointer", label);
    const loadHandlers: Array<(source: File | string) => void> = [];
    button(loadRow, "Open file…").onclick = () => picker.click();
    picker.onchange = () => picker.files?.[0] && loadHandlers.forEach((handler) => handler(picker.files![0]));
    for (const sample of Samples) {
        button(loadRow, sample.name).onclick = () => loadHandlers.forEach((handler) => handler(sample.url));
    }

    const row = (label: string) => {
        const line = Element("label", root, "display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0");
        Element("span", line, "color:#8b949e", label);
        return line;
    };
    const mode = Element("select", row("Mode"), "background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:4px");
    for (const [value, label] of [
        [Mode.Auto, "Auto (root, then feet)"],
        [Mode.Root, "Root only"],
        [Mode.Feet, "Feet only"],
        [Mode.Off, "Off (raw clip)"],
    ]) {
        const option = Element("option", mode, "", label);
        option.value = value;
    }
    const lateral = Element("input", row("Extract lateral motion"));
    lateral.type = "checkbox";
    const snap = Element("select", row("Snap direction"), "background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:4px");
    for (const [value, label] of [
        ["default", "Default (feet only)"],
        ["always", "Within 10 degrees"],
        ["never", "Never"],
    ]) {
        const option = Element("option", snap, "", label);
        option.value = value;
    }
    const follow = Element("input", row("Camera follows"));
    follow.type = "checkbox";
    follow.checked = true;
    const speedRow = row("Speed");
    const speedLabel = Element("span", speedRow, "font-variant-numeric:tabular-nums;width:40px;text-align:right", "1.00");
    const speed = Element("input", speedRow, "flex:1");
    speed.type = "range";
    speed.min = "-2";
    speed.max = "2";
    speed.step = "0.05";
    speed.value = "1";

    const resetHandlers: Array<() => void> = [];
    button(root, "Reset position").onclick = () => resetHandlers.forEach((handler) => handler());

    Element("div", root, "color:#8b949e;margin:10px 0 4px", "Clips");
    const clips = Element("div", root, "display:flex;flex-direction:column;gap:3px;max-height:220px;overflow:auto");
    const readout = Element("pre", root, "margin:10px 0 0;padding:8px;background:#010409;border-radius:4px;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap");

    return {
        panel: { status, clips, readout, mode, lateral, snap, follow, speed, speedLabel },
        onLoad: (handler) => loadHandlers.push(handler),
        onReset: (handler) => resetHandlers.push(handler),
    };
}

function SourceName(source: RootMotionSource): string {
    switch (source) {
        case RootMotionSource.Root:
            return "Root (ground truth)";
        case RootMotionSource.FootContact:
            return "FootContact (deduced)";
        default:
            return "None (no travel found)";
    }
}

/**
 * Main entry point for the root motion validation experience.
 * @param searchParams URL QSPs where the Keys have been lowercased. `model` loads a URL on start.
 */
export async function Main(searchParams: URLSearchParams): Promise<void> {
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    mainDiv.style.position = "relative";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;outline:none";
    mainDiv.appendChild(canvas);
    const { panel, onLoad, onReset } = CreatePanel(mainDiv);

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.05, 0.06, 0.08, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2.4, Math.PI / 2.6, 6, new Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 40;
    camera.minZ = 0.05;
    new HemisphericLight("sky", new Vector3(0, 1, 0), scene).intensity = 0.7;
    const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, -0.3), scene);
    sun.intensity = 0.8;

    const ground = MeshBuilder.CreateGround("ground", { width: 400, height: 400 }, scene);
    const grid = new GridMaterial("grid", scene);
    grid.mainColor = new Color3(0.08, 0.09, 0.11);
    grid.lineColor = new Color3(0.35, 0.4, 0.48);
    grid.gridRatio = 0.5;
    grid.majorUnitFrequency = 2;
    ground.material = grid;
    ground.isPickable = false;

    const printMaterial = new StandardMaterial("footprint", scene);
    printMaterial.emissiveColor = new Color3(1, 0.55, 0.2);
    printMaterial.disableLighting = true;
    const print = MeshBuilder.CreateDisc("footprint", { radius: 0.035, tessellation: 12 }, scene) as Mesh;
    // Lay the disc flat in its vertices: a thin instance matrix is applied before the mesh's own transform, so a
    // rotation left on the mesh would swing every footprint's position around with it.
    print.rotation.x = Math.PI / 2;
    print.bakeCurrentTransformIntoVertices();
    print.material = printMaterial;
    print.isPickable = false;
    // The prints spread across the ground far from the disc's own bounds at the origin.
    print.alwaysSelectAsActiveMesh = true;
    const printMatrices = new Float32Array(MaxFootprints * 16);
    let printCount = 0;
    let printCursor = 0;
    const clearPrints = () => {
        printCount = 0;
        printCursor = 0;
        print.thinInstanceCount = 0;
    };
    print.thinInstanceSetBuffer("matrix", printMatrices, 16, false);
    clearPrints();

    let container: AssetContainer | null = null;
    let character: TransformNode | null = null;
    let feet: TransformNode[] = [];
    let activeGroup: AnimationGroup | null = null;
    let rootMotion: RootMotion | null = null;
    let printTimer = 0;
    let readoutTimer = 0;
    let loadToken = 0;
    let restRotation: Quaternion | null = null;

    const resetCharacter = () => {
        if (character) {
            character.position.setAll(0);
            if (restRotation) {
                character.rotationQuaternion = restRotation.clone();
            }
        }
        rootMotion?.reset();
        clearPrints();
    };

    const playClip = (group: AnimationGroup) => {
        if (!container) {
            return;
        }
        for (const other of container.animationGroups) {
            other.stop();
        }
        // Disposing restores the root keys the previous extraction rewrote, so every clip starts from its original data.
        rootMotion?.dispose();
        rootMotion = null;
        activeGroup = group;
        resetCharacter();

        const mode = panel.mode.value as Mode;
        if (mode !== Mode.Off) {
            const options: IRootMotionOptions = { extractLateralMotion: panel.lateral.checked };
            if (panel.snap.value === "always") {
                options.directionSnapAngle = Math.PI / 18;
            } else if (panel.snap.value === "never") {
                options.directionSnapAngle = 0;
            }
            if (mode === Mode.Root) {
                options.source = RootMotionSource.Root;
            } else if (mode === Mode.Feet) {
                options.source = RootMotionSource.FootContact;
            }
            rootMotion = new RootMotion(group, options);
        }
        group.start(true, parseFloat(panel.speed.value));

        for (const child of Array.from(panel.clips.children)) {
            (child as HTMLElement).style.borderColor = child.textContent === group.name ? "#f0883e" : "#30363d";
        }
    };

    const unloadModel = () => {
        // Disposing restores the root keys the extraction rewrote before the clips go away with the container.
        rootMotion?.dispose();
        rootMotion = null;
        activeGroup = null;
        container?.dispose();
        container = null;
        character = null;
        clearPrints();
    };

    const loadAsync = async (source: File | string) => {
        const name = typeof source === "string" ? source.split("/").pop()! : source.name;
        const token = ++loadToken;
        panel.status.textContent = `Loading ${name}…`;

        let loaded: AssetContainer;
        try {
            // Judged on the path alone: a query or fragment after the file name is not part of its extension.
            const extension = name.split(/[?#]/)[0].toLowerCase().endsWith(".gltf") ? ".gltf" : ".glb";
            loaded = await LoadAssetContainerAsync(source, scene, { pluginExtension: extension });
        } catch (error) {
            if (token === loadToken) {
                panel.status.textContent = `Could not load ${name}: ${error instanceof Error ? error.message : String(error)}`;
            }
            return;
        }
        // A newer drop replaced this one while it loaded.
        if (token !== loadToken) {
            loaded.dispose();
            return;
        }
        unloadModel();
        container = loaded;
        container.addAllToScene();
        for (const group of container.animationGroups) {
            group.stop();
        }

        character = (container.rootNodes.find((node) => node instanceof TransformNode) as TransformNode) ?? null;
        if (character) {
            restRotation = (character.rotationQuaternion ?? Quaternion.FromEulerVector(character.rotation)).clone();
            // Footprints come from the lowest leaf joints at rest, independent of what RootMotion picks.
            character.computeWorldMatrix(true);
            const leaves = character
                .getDescendants(false, (node) => node instanceof TransformNode && !(node instanceof AbstractMesh))
                .filter((node) => !node.getChildren((child) => child instanceof TransformNode && !(child instanceof AbstractMesh), true).length) as TransformNode[];
            leaves.forEach((leaf) => leaf.computeWorldMatrix(true));
            leaves.sort((a, b) => a.absolutePosition.y - b.absolutePosition.y);
            feet = leaves.slice(0, 2);

            const { min, max } = character.getHierarchyBoundingVectors(true);
            const height = Math.max(0.5, max.y - min.y);
            camera.radius = height * 2.5;
            camera.target.set(0, height * 0.55, 0);
        }

        panel.clips.replaceChildren();
        for (const group of container.animationGroups) {
            const clip = Element(
                "button",
                panel.clips,
                "text-align:left;background:#161b22;color:#e6edf3;border:1px solid #30363d;border-radius:4px;padding:3px 8px;cursor:pointer",
                group.name
            );
            clip.onclick = () => playClip(group);
        }
        panel.status.textContent = `${name}: ${container.animationGroups.length} clip(s). Pick one below.`;
        if (!container.animationGroups.length) {
            panel.status.textContent = `${name} has no animations.`;
        }
    };

    onLoad((source) => void loadAsync(source));
    onReset(resetCharacter);
    const replay = () => activeGroup && playClip(activeGroup);
    panel.mode.onchange = replay;
    panel.lateral.onchange = replay;
    panel.snap.onchange = replay;
    panel.speed.oninput = () => {
        const speed = parseFloat(panel.speed.value);
        panel.speedLabel.textContent = speed.toFixed(2);
        if (activeGroup) {
            activeGroup.speedRatio = speed;
        }
        rootMotion?.reset();
    };

    window.addEventListener("dragover", (event) => event.preventDefault());
    window.addEventListener("drop", (event) => {
        event.preventDefault();
        const file = event.dataTransfer?.files?.[0];
        if (file) {
            void loadAsync(file);
        }
    });

    const worldPosition = new Vector3();
    scene.onAfterRenderObservable.add(() => {
        const dt = engine.getDeltaTime() / 1000;
        if (character && panel.follow.checked) {
            const target = character.getAbsolutePosition();
            camera.target.x += (target.x - camera.target.x) * Math.min(1, dt * 6);
            camera.target.z += (target.z - camera.target.z) * Math.min(1, dt * 6);
        }

        printTimer += dt;
        if (activeGroup?.isPlaying && feet.length && printTimer >= FootprintInterval) {
            printTimer = 0;
            let lowest: TransformNode | null = null;
            for (const foot of feet) {
                foot.computeWorldMatrix(true);
                if (!lowest || foot.absolutePosition.y < lowest.absolutePosition.y) {
                    lowest = foot;
                }
            }
            worldPosition.copyFrom(lowest!.absolutePosition);
            Matrix.TranslationToRef(worldPosition.x, 0.002, worldPosition.z, Matrix.Identity()).copyToArray(printMatrices, printCursor * 16);
            printCursor = (printCursor + 1) % MaxFootprints;
            printCount = Math.min(MaxFootprints, printCount + 1);
            print.thinInstanceBufferUpdated("matrix");
            print.thinInstanceCount = printCount;
        }

        // The readout is for reading, not animating: a few updates a second, rather than rebuilding text every frame.
        readoutTimer += dt;
        if (readoutTimer < 0.1) {
            return;
        }
        readoutTimer = 0;
        const lines: string[] = [];
        if (activeGroup) {
            lines.push(`clip       ${activeGroup.name}`, `frame      ${activeGroup.getCurrentFrame().toFixed(1)} / ${activeGroup.to.toFixed(0)}`);
        }
        if (rootMotion) {
            const direction = rootMotion.travelDirection;
            lines.push(
                `source     ${SourceName(rootMotion.source)}`,
                `root       ${rootMotion.rootNode?.name ?? "-"}`,
                `character  ${rootMotion.characterNode?.name ?? "-"}`,
                `contacts   ${rootMotion.contactNodes.map((node) => node.name).join(", ") || "-"}`,
                `height     ${rootMotion.characterHeight.toFixed(3)}`,
                `cycle      ${rootMotion.cycleDistance.toFixed(3)} in ${rootMotion.duration.toFixed(2)}s`,
                `speed      ${rootMotion.averageSpeed.toFixed(3)} /s`,
                `turn       ${rootMotion.extractsRotation ? `${((rootMotion.cycleRotation * 180) / Math.PI).toFixed(1)} deg per cycle` : "not extracted"}`,
                `direction  ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)}`
            );
        } else if (activeGroup) {
            lines.push("root motion off: the raw clip");
        }
        if (character) {
            const p = character.position;
            lines.push(`position   ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`);
        }
        panel.readout.textContent = lines.join("\n");
    });

    // Console access for poking at a clip: rootMotionDebug.rootMotion.getOffsetAtFrame(10, new rootMotionDebug.vector3()) etc.
    (window as any).rootMotionDebug = {
        scene,
        get rootMotion() {
            return rootMotion;
        },
        get group() {
            return activeGroup;
        },
        get character() {
            return character;
        },
        get container() {
            return container;
        },
        vector3: Vector3,
    };

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());

    const model = searchParams.get("model");
    if (model) {
        await loadAsync(Samples.find((sample) => sample.name.toLowerCase() === model.toLowerCase())?.url ?? model);
    }
}
