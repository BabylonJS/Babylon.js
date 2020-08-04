import { ToolData, ToolParameters } from '../textureEditorComponent';
import { TextBlock } from 'babylonjs-gui/2D/controls/textBlock';
import { BaseSlider } from 'babylonjs-gui/2D/controls/sliders/baseSlider';
import { Button } from 'babylonjs-gui/2D/controls/button';
import { Slider } from 'babylonjs-gui';

export const Contrast : ToolData = {
    name: 'Contrast/Exposure',
    type: class {
        getParameters: () => ToolParameters;
        contrast : number = 1.0;
        exposure : number = 1.0;
        GUI: {
            contrastLabel : TextBlock;
            contrastSlider : BaseSlider;
            exposureLabel : TextBlock;
            exposureSlider : BaseSlider;
            applyButton : Button;
        }
        constructor(getParameters: () => ToolParameters) {
            this.getParameters = getParameters;
        }
        setExposure(exposure : number) {
            this.exposure = exposure;
            this.GUI.exposureLabel.text = `Exposure: ${this.exposure}`;
            const {scene3D, updateTexture} = this.getParameters();
            scene3D.imageProcessingConfiguration.exposure = this.exposure;
            scene3D.render();
            updateTexture();
        }
        setContrast(contrast : number) {
            this.contrast = contrast;
            this.GUI.contrastLabel.text = `Contrast: ${this.contrast}`;
            const {scene3D, updateTexture} = this.getParameters();
            scene3D.imageProcessingConfiguration.contrast = this.contrast;
            scene3D.render();
            updateTexture();
        }
        setup() {
            const {GUI} = this.getParameters();

            const contrastLabel = new TextBlock();
            contrastLabel.text = `Contrast: ${this.contrast}`;
            contrastLabel.style = GUI.style;
            contrastLabel.height = '20px';
            contrastLabel.color = '#ffffff';
            const contrastSlider = new Slider();
            contrastSlider.minimum = 0;
            contrastSlider.maximum = 20;
            contrastSlider.step = 0.01;
            contrastSlider.value = this.contrast;
            contrastSlider.height = '20px';
            contrastSlider.onValueChangedObservable.add(evt => this.setContrast(evt.valueOf()));
            const exposureLabel = new TextBlock();
            exposureLabel.text = `Exposure: ${this.exposure}`;
            exposureLabel.style = GUI.style;
            exposureLabel.height = '20px';
            exposureLabel.color = '#ffffff';
            const exposureSlider = new Slider();
            exposureSlider.minimum = 0;
            exposureSlider.maximum = 20;
            exposureSlider.step = 0.01;
            exposureSlider.value = this.exposure;
            exposureSlider.height = '20px';
            exposureSlider.onValueChangedObservable.add(evt => this.setExposure(evt.valueOf()));
            const applyButton = Button.CreateSimpleButton('apply', 'Apply');
            applyButton.style = GUI.style;
            applyButton.height = '20px';
            applyButton.width = '50%';
            applyButton.thickness = 0;
            applyButton.background = '#666666';
            applyButton.color = '#ffffff';
            GUI.toolWindow.addControl(contrastLabel);
            GUI.toolWindow.addControl(contrastSlider);
            GUI.toolWindow.addControl(exposureLabel);
            GUI.toolWindow.addControl(exposureSlider);
            GUI.toolWindow.addControl(applyButton);
            this.GUI = {contrastLabel, contrastSlider, exposureLabel, exposureSlider, applyButton};
        }
        cleanup() {
            Object.entries(this.GUI).forEach(([key, value]) => value.dispose());
        }
    },
    usesWindow: true,
    is3D: true,
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0i
    NDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMjkuMjUsMjVhLjc2Ljc2LDAsMCwxLC43NS43NS43NS43NSwwLDAsMS0uNjUuNzRIMjYu
    NXYyLjc1YS43Ni43NiwwLDAsMS0uNzUuNzUuNzUuNzUsMCwwLDEtLjc0LS42NVYyNi41SDE2Ljc1YTMuMjUsMy4yNSwwLDAsMS0zLjI0LTMuMDdWMTVIMTAuNzVhLjc2
    Ljc2LDAsMCwxLS43NS0uNzUuNzUuNzUsMCwwLDEsLjY1LS43NEgxMy41VjEwLjc1YS43Ni43NiwwLDAsMSwuNzUtLjc1Ljc1Ljc1LDAsMCwxLC43NC42NVYxMy41aDBW
    MTVoMHY4LjI1QTEuNzUsMS43NSwwLDAsMCwxNi42MSwyNUgyOS4yNVpNMTYsMTMuNWg3LjI1YTMuMjUsMy4yNSwwLDAsMSwzLjI0LDMuMDdWMjRIMjVWMTYuNzVBMS43
    NSwxLjc1LDAsMCwwLDIzLjM5LDE1SDE2WiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjwvc3ZnPg==`
}