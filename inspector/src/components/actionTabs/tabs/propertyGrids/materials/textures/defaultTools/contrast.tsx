import * as React from 'react';
import { IToolData, IToolParameters, IToolType, IToolGUIProps } from '../textureEditorComponent';

class contrastTool implements IToolType {
    getParameters: () => IToolParameters;
    contrast : number = 1.0;
    exposure : number = 1.0;
    constructor(getParameters: () => IToolParameters) {
        this.getParameters = getParameters;
    }
    setExposure(exposure : number) {
        this.exposure = exposure;
        const {scene3D, updateTexture} = this.getParameters();
        scene3D.imageProcessingConfiguration.isEnabled = true;
        scene3D.imageProcessingConfiguration.exposure = this.computeExposure(this.exposure);
        updateTexture();
        
    }
    setContrast(contrast : number) {
        this.contrast = contrast;
        const {scene3D, updateTexture} = this.getParameters();
        scene3D.imageProcessingConfiguration.isEnabled = true;
        scene3D.imageProcessingConfiguration.contrast = this.computeContrast(contrast);
        updateTexture();
    }
    /** Maps slider values to post processing values using an exponential regression */
    computeExposure(sliderValue : number) {
        if (sliderValue <= 0) {
            return 1 - (-sliderValue / 100);
        } else {
            return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
        }
    }
    /** Maps slider values to post processing values using an exponential regression */
    computeContrast(sliderValue : number) {
        if (sliderValue <= 0) {
            return 1 - (-sliderValue / 100);
        } else {
            return Math.pow(1.05698, sliderValue) + 0.0000392163 * sliderValue;
        }
    }
    setup() {
        this.contrast = 0;
        this.exposure = 0;
        this.setExposure(this.exposure);
        this.setContrast(this.contrast);
    }
    cleanup() {
    }
    onReset() {
        this.setExposure(0);
        this.setContrast(0);
    }
};

class Settings extends React.Component<IToolGUIProps> {
    render() {
        const instance = this.props.instance as contrastTool;
        return (
            <div>
                <div>
                <label className='tool-slider-input'>
                    <span>Contrast: {instance.contrast}</span>
                    <input id='contrast-slider'
                        type='range'
                        min={-100}
                        max={100}
                        value={instance.contrast}
                        onChange={evt => {instance.setContrast(evt.target.valueAsNumber); this.forceUpdate();}}/>
                </label>
                </div>
                <div>
                <label className='tool-slider-input'>
                    <span>Exposure: {instance.exposure}</span>
                    <input
                        type='range'
                        min={-100}
                        max={100}
                        value={instance.exposure}
                        onChange={evt => {instance.setExposure(evt.target.valueAsNumber); this.forceUpdate();}}/>
                </label>
                </div>
            </div>
        )
    }
}

export const Contrast : IToolData = {
    name: 'Contrast/Exposure',
    type: contrastTool,
    is3D: true,
    settingsComponent: Settings,
    icon: `PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0i
    NDAiIGhlaWdodD0iNDAiIHN0eWxlPSJmaWxsOm5vbmUiLz48cGF0aCBkPSJNMTcuNTUsMjYuNTVsOC41OS0zLjIxQTYuODYsNi44NiwwLDAsMSwyNCwyNS43NWwtMy4x
    OSwxLjE5QTcsNywwLDAsMSwxNy41NSwyNi41NVpNMjAsMTEuNUE4LjUsOC41LDAsMSwwLDI4LjUsMjAsOC41MSw4LjUxLDAsMCwwLDIwLDExLjVNMjAsMTBBMTAsMTAs
    MCwxLDEsMTAsMjAsMTAsMTAsMCwwLDEsMjAsMTBabS0yLjQ1LDUuMzQsNS0xLjg2QTcsNywwLDAsMCwxOS40NCwxM2wtMS44OS43MVptMCwzLjIsNy44OC0yLjk0YTYu
    ODgsNi44OCwwLDAsMC0xLjE5LTEuMTZsLTYuNjksMi41Wm0wLDMuMiw5LjIzLTMuNDRhNy42OCw3LjY4LDAsMCwwLS41Mi0xLjQxbC04LjcxLDMuMjVabTAsMS42djEu
    Nmw5LjI4LTMuNDZBNi42Nyw2LjY3LDAsMCwwLDI3LDE5LjgyWiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjwvc3ZnPg==`
}