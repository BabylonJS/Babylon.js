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
    resizeTexture(width: number, height: number) : void;
    uploadTexture(file : File) : void;
}

interface PropertiesBarState {
    width: number;
    height: number;
}

interface PixelDataProps {
    name : string;
    data?: number;
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

function PixelData(props : PixelDataProps) {
    return <span className='pixel-data'>{props.name}: <span className='value'>{props.data || '-'}</span></span>
}

function getNewDimension(oldDim : number, newDim : any) {
    if (!isNaN(newDim)) {
        if (parseInt(newDim) > 0) {
            if (Number.isInteger(parseInt(newDim)))
                return parseInt(newDim);
        }
    }
    return oldDim;
}

export class PropertiesBar extends React.Component<PropertiesBarProps,PropertiesBarState> {
    constructor(props : PropertiesBarProps) {
        super(props);

        this.state = {
            width: props.texture.getSize().width,
            height: props.texture.getSize().height
        }
    }
    render() {
        return <div id='properties'>
                <div className='tab' id='logo-tab'>
                    <img className='icon' src={babylonLogo}/>
                </div>
                <div className='tab' id='dimensions-tab'>
                    <form onSubmit={evt => {
                        this.props.resizeTexture(this.state.width, this.state.height);
                        evt.preventDefault();
                    }}>
                        <label className='dimensions'>
                            W: <input type='text' value={this.state.width} onChange={(evt) => this.setState({width: getNewDimension(this.state.width, evt.target.value)})}/>
                            </label>
                        <label className='dimensions'>
                            H: <input type='text' value={this.state.height} onChange={(evt) => this.setState({height: getNewDimension(this.state.height, evt.target.value)})}/>
                            </label>
                        <img id='resize' className='icon button' title='Resize' alt='Resize' src={resizeButton} onClick={() => this.props.resizeTexture(this.state.width, this.state.height)}/> 
                    </form>
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
                        <label>
                            <input
                                accept='.jpg, .png, .tga, .dds, .env'
                                type='file'
                                onChange={
                                    (evt : React.ChangeEvent<HTMLInputElement>) => {
                                        const files = evt.target.files;
                                        if (files && files.length) {
                                            this.props.uploadTexture(files[0]);
                                        }
                                
                                        evt.target.value = "";
                                    }
                                }
                            />
                            <img
                                title='Upload'
                                className='icon button'
                                src={uploadButton}
                            />
                        </label>
                        <img title='Save' className='icon button' src={saveButton} onClick={() => this.props.saveTexture()}/>
                    </div>
                </div>
        </div>;
    }
}