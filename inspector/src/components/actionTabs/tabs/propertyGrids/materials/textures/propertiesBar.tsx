import * as React from 'react';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { IPixelData } from './textureCanvasManager';

interface IPropertiesBarProps {
    texture: BaseTexture;
    saveTexture(): void;
    pixelData: IPixelData;
    face: number;
    setFace(face : number): void;
    resetTexture() : void;
    resizeTexture(width: number, height: number) : void;
    uploadTexture(file : File) : void;
    mipLevel: number;
    setMipLevel: (mipLevel : number) => void;
}

interface IPropertiesBarState {
    width: number;
    height: number;
}

interface IPixelDataProps {
    name : string;
    data: number | undefined;
}

export class PropertiesBar extends React.PureComponent<IPropertiesBarProps,IPropertiesBarState> {
    private _resetButton = require('./assets/reset.svg');
    private _uploadButton = require('./assets/upload.svg');
    private _saveButton = require('./assets/save.svg');
    private _babylonLogo = require('./assets/babylonLogo.svg');
    
    private _resizeButton = require('./assets/resizeTool.svg');
    
    private _mipUp = require('./assets/mipUp.svg');
    private _mipDown = require('./assets/mipDown.svg');
    

    private _faces = [
        require('./assets/posX.svg'),
        require('./assets/posY.svg'),
        require('./assets/posZ.svg'),
        require('./assets/negX.svg'),
        require('./assets/negY.svg'),
        require('./assets/negZ.svg')
    ]

    constructor(props : IPropertiesBarProps) {
        super(props);

        this.state = {
            width: props.texture.getSize().width,
            height: props.texture.getSize().height
        }
    }

    private pixelData(props: IPixelDataProps) {
        return <span className='pixel-data'>{props.name}: <span className='value'>{props.data !== undefined ? props.data : '-'}</span></span>;
    }

    private getNewDimension(oldDim : number, newDim : any) {
        if (!isNaN(newDim)) {
            if (parseInt(newDim) > 0) {
                if (Number.isInteger(parseInt(newDim)))
                    return parseInt(newDim);
            }
        }
        return oldDim;
    }

    render() {
        const {mipLevel, setMipLevel, pixelData, resizeTexture, texture, face, setFace, saveTexture, resetTexture, uploadTexture} = this.props;
        return <div id='properties'>
                <div className='tab' id='logo-tab'>
                    <img className='icon' src={this._babylonLogo}/>
                </div>
                <div id='left'>
                    <div className='tab' id='dimensions-tab'>
                        <form onSubmit={evt => {
                            this.props.resizeTexture(this.state.width, this.state.height);
                            evt.preventDefault();
                        }}>
                            <label className='dimensions'>
                                W: <input type='text' value={this.state.width} readOnly={texture.isCube} onChange={(evt) => this.setState({width: this.getNewDimension(this.state.width, evt.target.value)})}/>
                            </label>
                            <label className='dimensions'>
                                H: <input type='text' value={this.state.height} readOnly={texture.isCube} onChange={(evt) => this.setState({height: this.getNewDimension(this.state.height, evt.target.value)})}/>
                            </label>
                        {!texture.isCube && <img id='resize' className='icon button' title='Resize' alt='Resize' src={this._resizeButton} onClick={() => resizeTexture(this.state.width, this.state.height)}/>} 
                        </form>
                    </div>
                    <div className='tab' id='pixel-coords-tab'>
                        <this.pixelData name='X' data={pixelData.x}/>
                        <this.pixelData name='Y' data={pixelData.y}/>
                    </div>
                    <div className='tab' id='pixel-color-tab'>
                        <this.pixelData name='R' data={pixelData.r}/>
                        <this.pixelData name='G' data={pixelData.g}/>
                        <this.pixelData name='B' data={pixelData.b}/>
                        <this.pixelData name='A' data={pixelData.a}/>
                    </div>
                    {texture.isCube &&
                        <div className='tab' id='face-tab'>
                            {this._faces.map((value, index) =>
                            <img
                                key={index}
                                className={face == index ? 'icon face button active' : 'icon face button'}
                                src={value}
                                onClick={() => setFace(index)}
                            />)}
                        </div>
                    }
                    {!texture.noMipmap &&
                        <div className='tab' id='mip-tab'>
                            <img title='Mip Preview Up' className='icon button' src={this._mipUp} onClick={() => mipLevel > 0 && setMipLevel(mipLevel - 1)} />
                            <img title='Mip Preview Down' className='icon button' src={this._mipDown} onClick={() => mipLevel < 12 && setMipLevel(mipLevel + 1)} />
                        </div>
                    }
                </div>
                <div className='tab' id='right-tab'>
                    <img title='Reset' className='icon button' src={this._resetButton} onClick={() => resetTexture()}/>
                    <label>
                        <input
                            accept='.jpg, .png, .tga, .dds, .env'
                            type='file'
                            onChange={
                                (evt : React.ChangeEvent<HTMLInputElement>) => {
                                    const files = evt.target.files;
                                    if (files && files.length) {
                                        uploadTexture(files[0]);
                                    }
                            
                                    evt.target.value = "";
                                }
                            }
                        />
                        <img
                            title='Upload'
                            className='icon button'
                            src={this._uploadButton}
                        />
                    </label>
                    <img title='Save' className='icon button' src={this._saveButton} onClick={() => saveTexture()}/>
                </div>
        </div>;
    }
}