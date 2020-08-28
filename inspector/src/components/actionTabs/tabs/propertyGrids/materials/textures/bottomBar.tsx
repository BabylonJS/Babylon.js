import * as React from 'react';
import { BaseTexture } from 'babylonjs';

interface IBottomBarProps {
    texture: BaseTexture;
    mipLevel: number;
}

export class BottomBar extends React.PureComponent<IBottomBarProps> {
    render() {
        const factor = Math.pow(2, this.props.mipLevel);
        const width = Math.ceil(this.props.texture.getSize().width / factor);
        const height = Math.ceil(this.props.texture.getSize().height / factor);
        return <div id='bottom-bar'>
            <span id='file-url'>{this.props.texture.name}</span>
            {!this.props.texture.noMipmap && <span id='mip-level'>MIP Preview: {this.props.mipLevel} {width}x{height}</span>}
        </div>;
    }
}