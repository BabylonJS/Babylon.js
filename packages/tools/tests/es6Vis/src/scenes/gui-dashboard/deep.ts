/**
 * gui-dashboard — deep import style (legacy, non-pure paths).
 */
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Slider } from "@babylonjs/gui/2D/controls/sliders/slider";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 8, new Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.7;

    const sphere = CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1.5;
    const sphereMat = new PBRMaterial("sphereMat", scene);
    sphereMat.albedoColor = new Color3(0.2, 0.4, 0.8);
    sphereMat.metallic = 0.6;
    sphereMat.roughness = 0.4;
    sphere.material = sphereMat;

    const ground = CreateGround("ground", { width: 10, height: 10 }, scene);
    const groundMat = new PBRMaterial("groundMat", scene);
    groundMat.albedoColor = new Color3(0.2, 0.2, 0.25);
    groundMat.metallic = 0.1;
    groundMat.roughness = 0.9;
    ground.material = groundMat;

    // 2D GUI
    const adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const panel = new StackPanel();
    panel.width = "250px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.paddingTop = "20px";
    panel.paddingLeft = "20px";
    adt.addControl(panel);

    const title = new TextBlock();
    title.text = "Material Controls";
    title.height = "40px";
    title.color = "white";
    title.fontSize = 18;
    panel.addControl(title);

    const roughnessLabel = new TextBlock();
    roughnessLabel.text = "Roughness: 0.40";
    roughnessLabel.height = "30px";
    roughnessLabel.color = "#cccccc";
    roughnessLabel.fontSize = 14;
    panel.addControl(roughnessLabel);

    const roughnessSlider = new Slider();
    roughnessSlider.minimum = 0;
    roughnessSlider.maximum = 1;
    roughnessSlider.value = 0.4;
    roughnessSlider.height = "20px";
    roughnessSlider.width = "200px";
    roughnessSlider.color = "#4488ff";
    roughnessSlider.background = "#333333";
    roughnessSlider.onValueChangedObservable.add((value) => {
        sphereMat.roughness = value;
        roughnessLabel.text = `Roughness: ${value.toFixed(2)}`;
    });
    panel.addControl(roughnessSlider);

    const metallicLabel = new TextBlock();
    metallicLabel.text = "Metallic: 0.60";
    metallicLabel.height = "30px";
    metallicLabel.color = "#cccccc";
    metallicLabel.fontSize = 14;
    panel.addControl(metallicLabel);

    const metallicSlider = new Slider();
    metallicSlider.minimum = 0;
    metallicSlider.maximum = 1;
    metallicSlider.value = 0.6;
    metallicSlider.height = "20px";
    metallicSlider.width = "200px";
    metallicSlider.color = "#ff8844";
    metallicSlider.background = "#333333";
    metallicSlider.onValueChangedObservable.add((value) => {
        sphereMat.metallic = value;
        metallicLabel.text = `Metallic: ${value.toFixed(2)}`;
    });
    panel.addControl(metallicSlider);

    const colorBtn = Button.CreateSimpleButton("colorBtn", "Cycle Color");
    colorBtn.width = "200px";
    colorBtn.height = "40px";
    colorBtn.color = "white";
    colorBtn.background = "#336699";
    colorBtn.paddingTop = "10px";
    panel.addControl(colorBtn);

    const resetBtn = Button.CreateSimpleButton("resetBtn", "Reset");
    resetBtn.width = "200px";
    resetBtn.height = "40px";
    resetBtn.color = "white";
    resetBtn.background = "#993333";
    resetBtn.paddingTop = "10px";
    panel.addControl(resetBtn);

    let frameCount = 0;
    engine.runRenderLoop(() => {
        scene.render();
        if (++frameCount >= 10) {
            (window as any).__ready = true;
        }
    });
}
