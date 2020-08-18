import * as React from 'react';

interface BottomBarProps {
    name: string;
    mipLevel: number;
    hasMips: boolean;
}

export class BottomBar extends React.Component<BottomBarProps> {
    render() {
        return <div id='bottom-bar'>
            <span id='file-url'>{this.props.name} {this.props.hasMips ? "true" : "false"}</span>
            {this.props.hasMips && <span id='mip-level'>MIP Preview: {this.props.mipLevel}</span>}
        </div>;
    }
}