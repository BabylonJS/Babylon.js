import type { FC } from "react";
import { useEffect, useRef, useContext } from "react";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Vector3 } from "core/Maths/math";
import { SceneContext } from "../SceneContext";
import type { Nullable } from "core/types";

/**
 * This component creates and renders the scene.
 */

export const SceneRendererComponent: FC = () => {
    const canvasRef = useRef<Nullable<HTMLCanvasElement>>(null);
    const { setScene } = useContext(SceneContext);

    useEffect(() => {
        if (canvasRef.current) {
            const engine = new Engine(canvasRef.current, true);
            const scene = new Scene(engine);
            const camera = new ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2.5, 5, Vector3.Zero(), scene);
            camera.attachControl(canvasRef.current, true);
            new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
            const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
            sphere.position.y = 1;
            MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
            engine.runRenderLoop(() => {
                if (scene) {
                    scene.render();
                }
            });
            const resizeListener = () => {
                engine.resize();
            };
            window.addEventListener("resize", resizeListener);
            setScene(scene);

            return () => {
                window.removeEventListener("resize", resizeListener);
                engine.stopRenderLoop();
                scene.dispose();
                setScene(null);
                engine.dispose();
            };
        } else {
            return () => {};
        }
    }, [canvasRef]);

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <canvas style={{ width: "100%", height: "100%" }} ref={canvasRef}></canvas>
        </div>
    );
};
