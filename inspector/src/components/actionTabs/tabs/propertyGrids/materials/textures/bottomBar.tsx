import * as React from 'react';

interface BottomBarProps {
    name: string;
}

export class BottomBar extends React.Component<BottomBarProps> {
    render() {
        return <div id='bottom-bar'>
            <span id='file-url'>{this.props.name}</span>
        </div>;
    }
}