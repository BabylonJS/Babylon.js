import type { ProjectOptions } from "../index";

export function generateIndexHtml(options: ProjectOptions): string {
    const { bundler, moduleFormat } = options;

    const styles = `
        body {
            margin: 0;
            padding: 0;
        }

        #renderCanvas {
            display: block;
            width: 100dvw;
            height: 100dvh;
            touch-action: none;
        }`;

    // CDN-only (no bundler, UMD)
    if (bundler === "none") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
    <script src="https://cdn.babylonjs.com/babylon.js"><\/script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"><\/script>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);

        const createScene = async function () {
            const scene = new BABYLON.Scene(engine);

            try {
                // Load a glTF model
                await BABYLON.AppendSceneAsync("https://assets.babylonjs.com/meshes/boombox.glb", scene);

                // Create a default camera, and event caught by the controls will call preventdefault(),
                // such as wheel event
                scene.createDefaultCamera(true, true, true);
                // Rotate the camera to face the front of the model
                scene.activeCamera.alpha += Math.PI;
            } catch {
                // Fallback: when loading fails
                // Create a default box mesh
                BABYLON.CreateBox("box", {}, scene);

                scene.createDefaultCamera(true, true, true);
                const camera = scene.activeCamera;
                camera.setPosition(new BABYLON.Vector3(3, 3, 3));
                camera.setTarget(new BABYLON.Vector3(0, 0, 0));

                // Create a default light for the scene
                scene.createDefaultLight(true);
            }

            // Create a default environment (skybox + ground + environment lighting)
            scene.createDefaultEnvironment({
                createGround: true,
                createSkybox: true,
            });

            return scene;
        };

        createScene().then(function (scene) {
            engine.runRenderLoop(function () {
                scene.render();
            });
        });

        window.addEventListener("resize", function () {
            engine.resize();
        });
    <\/script>
</body>
</html>
`;
    }

    // Vite serves index.html from root — entry via <script type="module">
    if (bundler === "vite") {
        const ext = moduleFormat === "umd" && options.language === "js" ? "js" : options.language === "ts" ? "ts" : "js";
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script type="module" src="/src/index.${ext}"><\/script>
</body>
</html>
`;
    }

    // Webpack uses HtmlWebpackPlugin — no script tag needed
    if (bundler === "webpack") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
</body>
</html>
`;
    }

    // Rollup — bundle injected into dist/, reference it
    if (bundler === "rollup") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script src="dist/bundle.js"><\/script>
</body>
</html>
`;
    }

    return "";
}
