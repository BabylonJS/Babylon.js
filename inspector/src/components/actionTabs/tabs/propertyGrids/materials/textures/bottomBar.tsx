import * as React from 'react';

interface IBottomBarProps {
    name: string;
    mipLevel: number;
    hasMips: boolean;
}

export class BottomBar extends React.PureComponent<IBottomBarProps> {
    render() {
        return <div id='bottom-bar'>
            <span id='file-url'>{this.props.name}</span>
            {this.props.hasMips && <span id='mip-level'>MIP Preview: {this.props.mipLevel}</span>}
        </div>;
    }
}