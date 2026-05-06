import { chromium } from "@playwright/test";
import { createServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, "../../../../../..");
const tempDirectory = path.join(repoRoot, ".playwright-cli", "bevel-block-render");

const readNumber = (name, defaultValue) => {
    const rawValue = process.env[name];

    if (rawValue === undefined) {
        return defaultValue;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
        throw new Error(`${name} must be a finite number.`);
    }

    return value;
};

const bevelAmount = readNumber("BEVEL_AMOUNT", 0.1);
const bevelSegments = Math.max(1, Math.trunc(readNumber("BEVEL_SEGMENTS", 8)));
const bevelAngleDegrees = readNumber("BEVEL_ANGLE_DEGREES", 30);
const useEditorPreview = process.env.BEVEL_EDITOR_PREVIEW === "1";
const renderMode = process.env.BEVEL_RENDER_MODE ?? "standard";
const source = process.env.BEVEL_SOURCE === "cylinder" || process.env.BEVEL_SOURCE === "sphere" ? process.env.BEVEL_SOURCE : "box";
const outputPath = path.resolve(repoRoot, process.env.BEVEL_RENDER_OUTPUT ?? path.join(".playwright-cli", "bevelBlock.png"));

const toViteFsPath = (relativePath) => `/@fs/${path.join(repoRoot, relativePath).replace(/\\/g, "/")}`;

const renderSource = `
import { Engine } from "${toViteFsPath("packages/dev/core/src/Engines/engine.ts")}";
import { Scene } from "${toViteFsPath("packages/dev/core/src/scene.ts")}";
import { ArcRotateCamera } from "${toViteFsPath("packages/dev/core/src/Cameras/arcRotateCamera.ts")}";
import { HemisphericLight } from "${toViteFsPath("packages/dev/core/src/Lights/hemisphericLight.ts")}";
import { DirectionalLight } from "${toViteFsPath("packages/dev/core/src/Lights/directionalLight.ts")}";
import { Color3, Color4 } from "${toViteFsPath("packages/dev/core/src/Maths/math.color.ts")}";
import { Vector3 } from "${toViteFsPath("packages/dev/core/src/Maths/math.vector.ts")}";
import { Mesh } from "${toViteFsPath("packages/dev/core/src/Meshes/mesh.ts")}";
import { StandardMaterial } from "${toViteFsPath("packages/dev/core/src/Materials/standardMaterial.ts")}";
import { Texture } from "${toViteFsPath("packages/dev/core/src/Materials/Textures/texture.ts")}";
import { NormalMaterial } from "${toViteFsPath("packages/dev/materials/src/normal/normalMaterial.ts")}";
import { NodeGeometry } from "${toViteFsPath("packages/dev/core/src/Meshes/Node/nodeGeometry.ts")}";
import { BoxBlock } from "${toViteFsPath("packages/dev/core/src/Meshes/Node/Blocks/Sources/boxBlock.ts")}";
import { CylinderBlock } from "${toViteFsPath("packages/dev/core/src/Meshes/Node/Blocks/Sources/cylinderBlock.ts")}";
import { SphereBlock } from "${toViteFsPath("packages/dev/core/src/Meshes/Node/Blocks/Sources/sphereBlock.ts")}";
import { BevelBlock } from "${toViteFsPath("packages/dev/core/src/Meshes/Node/Blocks/bevelBlock.ts")}";
import { GeometryOutputBlock } from "${toViteFsPath("packages/dev/core/src/Meshes/Node/Blocks/geometryOutputBlock.ts")}";

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true, {
    antialias: true,
    preserveDrawingBuffer: true,
    stencil: true,
});
const scene = new Scene(engine);
scene.clearColor = new Color4(0.08, 0.09, 0.11, 1);
scene.ambientColor = ${useEditorPreview ? "Color3.White()" : "Color3.Black()"};

const camera = new ArcRotateCamera("camera", -Math.PI / 4, Math.PI / 3.2, 3.1, Vector3.Zero(), scene);
camera.fov = 0.58;

const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.intensity = 0.65;
const key = new DirectionalLight("key", new Vector3(-0.45, -0.7, -0.55), scene);
key.intensity = ${useEditorPreview ? "0" : "1.35"};

const nodeGeometry = new NodeGeometry("Beveled cube visual check");
const sourceKind = ${JSON.stringify(source)};
const source = sourceKind === "cylinder" ? new CylinderBlock("Cylinder") : sourceKind === "sphere" ? new SphereBlock("Sphere") : new BoxBlock("Box");
const bevel = new BevelBlock("Bevel");
const output = new GeometryOutputBlock("Output");

if (source instanceof CylinderBlock) {
    source.height.value = 1;
    source.diameter.value = 1;
    source.diameterTop.value = -1;
    source.diameterBottom.value = -1;
    source.subdivisions.value = 1;
    source.tessellation.value = 24;
    source.arc.value = 1;
} else if (source instanceof SphereBlock) {
    source.segments.value = 64;
}

bevel.amount.value = ${bevelAmount};
bevel.segments.value = ${bevelSegments};
bevel.angle.value = ${bevelAngleDegrees};

if (source instanceof SphereBlock) {
    source.geometry.connectTo(output.geometry);
} else {
    source.geometry.connectTo(bevel.geometry);
    bevel.output.connectTo(output.geometry);
}
nodeGeometry.outputBlock = output;
nodeGeometry.build();

const mesh = new Mesh("beveled cube", scene);
nodeGeometry.vertexData.applyToMesh(mesh);
mesh.useVertexColors = ${useEditorPreview};

if (${JSON.stringify(renderMode)} === "matcap") {
    const material = new StandardMaterial("matcap", scene);
    material.disableLighting = true;
    material.backFaceCulling = false;
    const matCapTexture = new Texture("https://assets.babylonjs.com/skyboxes/matcap.jpg", scene);
    matCapTexture.coordinatesMode = Texture.SPHERICAL_MODE;
    material.reflectionTexture = matCapTexture;
    mesh.material = material;
} else if (${JSON.stringify(renderMode)} === "normals") {
    const material = new NormalMaterial("normalMaterial", scene);
    material.disableLighting = true;
    material.backFaceCulling = false;
    mesh.material = material;
} else {
    const material = new StandardMaterial("material", scene);
    material.diffuseColor = new Color3(0.72, 0.74, 0.72);
    material.emissiveColor = ${useEditorPreview ? "Color3.Black()" : "new Color3(0.08, 0.08, 0.08)"};
    material.specularColor = ${useEditorPreview ? "Color3.Black()" : "new Color3(0.18, 0.18, 0.18)"};
    material.backFaceCulling = ${useEditorPreview ? "false" : "true"};
    mesh.material = material;
}

window.__bevelRenderInfo = {
    vertices: nodeGeometry.vertexData.positions.length / 3,
    indices: nodeGeometry.vertexData.indices.length,
};

scene.executeWhenReady(() => {
    engine.resize();
    let frame = 0;
    const render = () => {
        scene.render();
        frame++;
        if (frame < 8) {
            requestAnimationFrame(render);
            return;
        }
        window.__bevelRenderReady = true;
    };
    requestAnimationFrame(render);
});
`;

const html = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <style>
            html,
            body,
            #renderCanvas {
                width: 100%;
                height: 100%;
                margin: 0;
                overflow: hidden;
                background: #050507;
            }
        </style>
    </head>
    <body>
        <canvas id="renderCanvas"></canvas>
        <script type="module" src="/bevel-render.ts"></script>
    </body>
</html>`;

await fs.mkdir(tempDirectory, { recursive: true });
await fs.writeFile(path.join(tempDirectory, "index.html"), html);
await fs.writeFile(path.join(tempDirectory, "bevel-render.ts"), renderSource);
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const server = await createServer({
    configFile: false,
    root: tempDirectory,
    server: {
        host: "127.0.0.1",
        port: 0,
        fs: {
            allow: [repoRoot, tempDirectory],
        },
    },
    resolve: {
        alias: {
            core: path.join(repoRoot, "packages/dev/core/src"),
            materials: path.join(repoRoot, "packages/dev/materials/src"),
            "shared-ui-components": path.join(repoRoot, "packages/dev/sharedUiComponents/src"),
        },
    },
});

let browser;

try {
    await server.listen();
    const url = server.resolvedUrls?.local[0];

    if (!url) {
        throw new Error("Unable to resolve Vite render URL.");
    }

    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
    page.on("console", (message) => {
        if (message.type() === "error") {
            process.stderr.write(`${message.text()}\n`);
        }
    });

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__bevelRenderReady === true, undefined, { timeout: 30000 });
    const renderInfo = await page.evaluate(() => window.__bevelRenderInfo);
    await page.locator("#renderCanvas").screenshot({ path: outputPath });

    process.stdout.write(`Bevel visual render written to ${outputPath}\n`);
    process.stdout.write(`Render info: ${JSON.stringify(renderInfo)}\n`);
} finally {
    if (browser) {
        await browser.close();
    }
    await server.close();
}
