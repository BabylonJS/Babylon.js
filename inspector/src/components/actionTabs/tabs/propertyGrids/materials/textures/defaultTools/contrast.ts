import { IToolData, IToolParameters, IToolType } from '../textureEditorComponent';
import { TextBlock } from 'babylonjs-gui/2D/controls/textBlock';
import { Slider } from 'babylonjs-gui/2D/controls/sliders/slider';

export const Contrast : IToolData = {
    name: 'Contrast/Exposure',
    type: class implements IToolType {
        getParameters: () => IToolParameters;
        contrast : number = 1.0;
        exposure : number = 1.0;
        GUI: {
            contrastLabel : TextBlock;
            contrastSlider : Slider;
            exposureLabel : TextBlock;
            exposureSlider : Slider;
        }
        constructor(getParameters: () => IToolParameters) {
            this.getParameters = getParameters;
        }
        setExposure(exposure : number) {
            this.exposure = exposure;
            this.GUI.exposureLabel.text = `Exposure: ${this.exposure}`;
            const {scene3D, updateTexture} = this.getParameters();
            scene3D.imageProcessingConfiguration.isEnabled = true;
            scene3D.imageProcessingConfiguration.exposure = this.computeExposure(this.exposure);
            updateTexture();
        }
        setContrast(contrast : number) {
            this.contrast = contrast;
            this.GUI.contrastLabel.text = `Contrast: ${this.contrast}`;
            const {scene3D, updateTexture} = this.getParameters();
            scene3D.imageProcessingConfiguration.isEnabled = true;
            scene3D.imageProcessingConfiguration.contrast = this.computeContrast(contrast);
            updateTexture();
        }
        /** Maps slider values to post processing values using an exponential regression */
        computeExposure(sliderValue : number) {
            return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
        }
        /** Maps slider values to post processing values using an exponential regression */
        computeContrast(sliderValue : number) {
            return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
        }
        setup() {
            this.contrast = 0;
            this.exposure = 0;
            const {GUI} = this.getParameters();
            const contrastLabel = new TextBlock();
            contrastLabel.style = GUI.style;
            contrastLabel.height = '20px';
            contrastLabel.color = '#ffffff';
            const contrastSlider = new Slider();
            contrastSlider.value = this.contrast;
            contrastSlider.minimum = -100;
            contrastSlider.maximum = 100;
            contrastSlider.height = '20px';
            contrastSlider.isThumbCircle = true;
            contrastSlider.background = '#a3a3a3';
            contrastSlider.color = '#33648f';
            contrastSlider.borderColor = '#33648f';
            contrastSlider.onValueChangedObservable.add(evt => this.setContrast(evt.valueOf()));
            const exposureLabel = new TextBlock();
            exposureLabel.style = GUI.style;
            exposureLabel.height = '20px';
            exposureLabel.color = '#ffffff';
            const exposureSlider = new Slider();
            exposureSlider.value = this.exposure;
            exposureSlider.minimum = -100;
            exposureSlider.maximum = 100;
            exposureSlider.height = '20px';
            exposureSlider.isThumbCircle = true;
            exposureSlider.background = '#a3a3a3';
            exposureSlider.color = '#33648f';
            exposureSlider.borderColor = '#33648f';
            exposureSlider.onValueChangedObservable.add(evt => this.setExposure(evt.valueOf()));
            GUI.toolWindow.addControl(contrastLabel);
            GUI.toolWindow.addControl(contrastSlider);
            GUI.toolWindow.addControl(exposureLabel);
            GUI.toolWindow.addControl(exposureSlider);
            this.GUI = {contrastLabel, contrastSlider, exposureLabel, exposureSlider};
            this.setExposure(this.exposure);
            this.setContrast(this.contrast);
        }
        cleanup() {
            Object.entries(this.GUI).forEach(([key, value]) => value.dispose());
        }
        onReset() {
            this.GUI.contrastSlider.value = 0;
            this.GUI.exposureSlider.value = 0;
        }
    },
    usesWindow: true,
    is3D: true,
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0i
    NDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMTcuNTUsMjYuNTVsOC41OS0zLjIxQTYuODYsNi44NiwwLDAsMSwyNCwyNS43NWwtMy4x
    OSwxLjE5QTcsNywwLDAsMSwxNy41NSwyNi41NVpNMjAsMTEuNUE4LjUsOC41LDAsMSwwLDI4LjUsMjAsOC41MSw4LjUxLDAsMCwwLDIwLDExLjVNMjAsMTBBMTAsMTAs
    MCwxLDEsMTAsMjAsMTAsMTAsMCwwLDEsMjAsMTBabS0yLjQ1LDUuMzQsNS0xLjg2QTcsNywwLDAsMCwxOS40NCwxM2wtMS44OS43MVptMCwzLjIsNy44OC0yLjk0YTYu
    ODgsNi44OCwwLDAsMC0xLjE5LTEuMTZsLTYuNjksMi41Wm0wLDMuMiw5LjIzLTMuNDRhNy42OCw3LjY4LDAsMCwwLS41Mi0xLjQxbC04LjcxLDMuMjVabTAsMS42djEu
    Nmw5LjI4LTMuNDZBNi42Nyw2LjY3LDAsMCwwLDI3LDE5LjgyWiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjwvc3ZnPg==`
}