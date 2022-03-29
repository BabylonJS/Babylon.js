import * as React from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IPixelData } from "./textureCanvasManager";
import type { ISize } from "core/Maths/math.size";

interface IPropertiesBarProps {
    texture: BaseTexture;
    size: ISize;
    saveTexture(): void;
    pixelData: IPixelData;
    face: number;
    setFace(face: number): void;
    resetTexture(): void;
    resizeTexture(width: number, height: number): void;
    uploadTexture(file: File): void;
    mipLevel: number;
    setMipLevel: (mipLevel: number) => void;
}

interface IPropertiesBarState {
    width: number;
    height: number;
}

interface IPixelDataProps {
    name: string;
    data: number | undefined;
}

import _resetButton from "./assets/reset.svg";
import _uploadButton from "./assets/upload.svg";
import _saveButton from "./assets/save.svg";
import _babylonLogo from "./assets/babylonLogo.svg";

import _resizeButton from "./assets/resizeTool.svg";

import _mipUp from "./assets/mipUp.svg";
import _mipDown from "./assets/mipDown.svg";

import posX from "./assets/posX.svg";
import negX from "./assets/negX.svg";
import posY from "./assets/posY.svg";
import negY from "./assets/negY.svg";
import posZ from "./assets/posZ.svg";
import negZ from "./assets/negZ.svg";

export class PropertiesBar extends React.PureComponent<IPropertiesBarProps, IPropertiesBarState> {
    private _faces = [posX, negX, posY, negY, posZ, negZ];

    constructor(props: IPropertiesBarProps) {
        super(props);

        this.state = {
            width: props.size.width,
            height: props.size.height,
        };
    }

    private _pixelData(props: IPixelDataProps) {
        return (
            <span className="pixel-data">
                {props.name}: <span className="value">{props.data !== undefined ? props.data : "-"}</span>
            </span>
        );
    }

    private _getNewDimension(oldDim: number, newDim: any) {
        if (!isNaN(newDim)) {
            if (parseInt(newDim) > 0) {
                if (Number.isInteger(parseInt(newDim))) return parseInt(newDim);
            }
        }
        return oldDim;
    }

    componentWillUpdate(nextProps: IPropertiesBarProps) {
        if (nextProps.size.width != this.props.size.width || nextProps.size.height != this.props.size.height) {
            this.setState({
                width: nextProps.size.width,
                height: nextProps.size.height,
            });
        }
    }

    render() {
        const { mipLevel, setMipLevel, pixelData, resizeTexture, texture, face, setFace, saveTexture, resetTexture, uploadTexture } = this.props;
        const maxLevels = Math.floor(Math.log2(Math.max(texture.getSize().width, texture.getSize().height)));
        const engine = texture.getScene()!.getEngine();
        const mipsEnabled = !texture.noMipmap && engine.getCaps().textureLOD;
        return (
            <div id="properties">
                <div className="tab" id="logo-tab">
                    <img className="icon" src={_babylonLogo} />
                </div>
                <div id="left">
                    <div className="tab" id="dimensions-tab">
                        <form
                            onSubmit={(evt) => {
                                this.props.resizeTexture(this.state.width, this.state.height);
                                evt.preventDefault();
                            }}
                        >
                            <label className="dimensions">
                                W:{" "}
                                <input
                                    type="text"
                                    value={this.state.width}
                                    readOnly={texture.isCube}
                                    onChange={(evt) => this.setState({ width: this._getNewDimension(this.state.width, evt.target.value) })}
                                />
                            </label>
                            <label className="dimensions">
                                H:{" "}
                                <input
                                    type="text"
                                    value={this.state.height}
                                    readOnly={texture.isCube}
                                    onChange={(evt) => this.setState({ height: this._getNewDimension(this.state.height, evt.target.value) })}
                                />
                            </label>
                            {!texture.isCube && (
                                <img
                                    id="resize"
                                    className="icon button"
                                    title="Resize"
                                    alt="Resize"
                                    src={_resizeButton}
                                    onClick={() => resizeTexture(this.state.width, this.state.height)}
                                />
                            )}
                        </form>
                    </div>
                    <div className="tab" id="pixel-coords-tab">
                        <this._pixelData name="X" data={pixelData.x} />
                        <this._pixelData name="Y" data={pixelData.y} />
                    </div>
                    <div className="tab" id="pixel-color-tab">
                        <this._pixelData name="R" data={pixelData.r} />
                        <this._pixelData name="G" data={pixelData.g} />
                        <this._pixelData name="B" data={pixelData.b} />
                        <this._pixelData name="A" data={pixelData.a} />
                    </div>
                    {texture.isCube && (
                        <div className="tab" id="face-tab">
                            {this._faces.map((value, index) => (
                                <img key={index} className={face == index ? "icon face button active" : "icon face button"} src={value} onClick={() => setFace(index)} />
                            ))}
                        </div>
                    )}
                    {mipsEnabled && (
                        <div className="tab" id="mip-tab">
                            <img title="Mip Preview Up" className="icon button" src={_mipUp} onClick={() => mipLevel > 0 && setMipLevel(mipLevel - 1)} />
                            <img title="Mip Preview Down" className="icon button" src={_mipDown} onClick={() => mipLevel < maxLevels && setMipLevel(mipLevel + 1)} />
                        </div>
                    )}
                </div>
                <div className="tab" id="right-tab">
                    <img title="Reset" className="icon button" src={_resetButton} onClick={() => resetTexture()} />
                    <label>
                        <input
                            accept=".jpg, .png, .tga, .dds, .env"
                            type="file"
                            onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                                const files = evt.target.files;
                                if (files && files.length) {
                                    uploadTexture(files[0]);
                                }

                                evt.target.value = "";
                            }}
                        />
                        <img title="Upload" className="icon button" src={_uploadButton} />
                    </label>
                    <img title="Save" className="icon button" src={_saveButton} onClick={() => saveTexture()} />
                </div>
            </div>
        );
    }
}
