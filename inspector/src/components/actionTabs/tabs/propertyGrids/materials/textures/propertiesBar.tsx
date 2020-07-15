import * as React from 'react';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { PixelData } from './textureCanvasManager';

interface PropertiesBarProps {
    texture: BaseTexture;
    saveTexture() : void;
    pixelData : PixelData;
}

const resetButton = require('./assets/reset.svg');
const uploadButton = require('./assets/upload.svg');
const saveButton = require('./assets/save.svg');
const babylonLogo = require('./assets/babylonLogo.svg');

export class PropertiesBar extends React.Component<PropertiesBarProps> {
    render() {
        return <div id='properties'>
                <div className='tab' id='logo-tab'>
                    <img className='icon' src={babylonLogo}/>
                </div>
                <div className='tab' id='dimensions-tab'>
                    <label className='dimensions'>W: <input type='text' readOnly contentEditable={false} value={this.props.texture.getSize().width}/></label>
                    <label className='dimensions'>H: <input type='text' readOnly contentEditable={false} value={this.props.texture.getSize().height} /></label>
                </div>
                <div className='tab' id='pixel-coords-tab'>
                    <span className='pixel-data'>X: {this.props.pixelData.x}</span>
                    <span className='pixel-data'>Y: {this.props.pixelData.y}</span>
                </div>
                <div className='tab' id='pixel-color-tab'>
                    <span className='pixel-data'>R: {this.props.pixelData.r}</span>
                    <span className='pixel-data'>G: {this.props.pixelData.g}</span>
                    <span className='pixel-data'>B: {this.props.pixelData.b}</span>
                    <span className='pixel-data'>A: {this.props.pixelData.a}</span>
                </div>
                <div className='tab' id='right-tab'>
                    <div className='content'>
                        <img className='icon' src={resetButton}/>
                        <img className='icon' src={uploadButton}/>
                        <img className='icon' src={saveButton} onClick={() => this.props.saveTexture()}/>
                        </div>
                </div>
        </div>;
    }
}