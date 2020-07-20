import * as React from 'react';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { PixelData } from './textureCanvasManager';

interface PropertiesBarProps {
    texture: BaseTexture;
    saveTexture(): void;
    pixelData: PixelData;
    face: number;
    setFace(face : number): void;
    resetTexture() : void;
}

const resetButton = require('./assets/reset.svg');
const uploadButton = require('./assets/upload.svg');
const saveButton = require('./assets/save.svg');
const babylonLogo = require('./assets/babylonLogo.svg');

const posX = require('./assets/posX.svg');
const posY = require('./assets/posY.svg');
const posZ = require('./assets/posZ.svg');
const negX = require('./assets/negX.svg');
const negY = require('./assets/negY.svg');
const negZ = require('./assets/negZ.svg');

const resizeButton = require('./assets/resizeTool.svg');

const mipUp = require('./assets/mipUp.svg');
const mipDown = require('./assets/mipDown.svg');

const faces = [
    posX,
    negX,
    posY,
    negY,
    posZ,
    negZ
]

interface PixelDataProps {
    name : string;
    data?: number;
}

function PixelData(props : PixelDataProps) {
    return <span className='pixel-data'>{props.name}: <span className='value'>{props.data || '-'}</span></span>
}

export class PropertiesBar extends React.Component<PropertiesBarProps> {
    render() {
        return <div id='properties'>
                <div className='tab' id='logo-tab'>
                    <img className='icon' src={babylonLogo}/>
                </div>
                <div className='tab' id='dimensions-tab'>
                    <label className='dimensions'>W: <input type='text' readOnly contentEditable={false} value={this.props.texture.getSize().width}/></label>
                    <label className='dimensions'>H: <input type='text' readOnly contentEditable={false} value={this.props.texture.getSize().height} /></label>
                    <img id='resize' className='icon button' title='Resize' alt='Resize' src={resizeButton}/>
                </div>
                <div className='tab' id='pixel-coords-tab'>
                    <PixelData name='X' data={this.props.pixelData.x}/>
                    <PixelData name='Y' data={this.props.pixelData.y}/>
                </div>
                <div className='tab' id='pixel-color-tab'>
                    <PixelData name='R' data={this.props.pixelData.r}/>
                    <PixelData name='G' data={this.props.pixelData.g}/>
                    <PixelData name='B' data={this.props.pixelData.b}/>
                    <PixelData name='A' data={this.props.pixelData.a}/>
                </div>
                {this.props.texture.isCube &&
                <>
                    <div className='tab' id='face-tab'>
                        {faces.map((face, index) =>
                        <img
                            key={index}
                            className={this.props.face == index ? 'icon face button active' : 'icon face button'}
                            src={face}
                            onClick={() => this.props.setFace(index)}
                        />)}
                    </div>
                    <div className='tab' id='mip-tab'>
                        <img title='Mip Preview Up' className='icon button' src={mipUp} />
                        <img title='Mip Preview Down' className='icon button' src={mipDown} />
                    </div>
                </>}
                <div className='tab' id='right-tab'>
                    <div className='content'>
                        <img title='Reset' className='icon button' src={resetButton} onClick={() => this.props.resetTexture()}/>
                        <img title='Upload' className='icon button' src={uploadButton}/>
                        <img title='Save' className='icon button' src={saveButton} onClick={() => this.props.saveTexture()}/>
                    </div>
                </div>
        </div>;
    }
}