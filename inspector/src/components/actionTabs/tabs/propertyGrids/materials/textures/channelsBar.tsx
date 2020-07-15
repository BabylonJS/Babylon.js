import * as React from 'react';

export interface Channel {
    visible: boolean;
    editable: boolean;
    name: string;
    id: 'R' | 'G' | 'B' | 'A';
    icon: any;
}

interface ChannelsBarProps {
    channels: Channel[];
    setChannels(channelState : Channel[]) : void;
}

const eyeOpen = require('./assets/eyeOpen.svg');
const eyeClosed = require('./assets/eyeClosed.svg');

export class ChannelsBar extends React.Component<ChannelsBarProps> {
    render() {
        return <div id='channels-bar'>
            {this.props.channels.map(
                (channel,index) =>
                    <div key={channel.name} className={channel.editable ? 'channel' : 'channel uneditable'}>
                        <img
                            className={channel.visible ? 'icon channel-visibility visible' : 'icon channel-visibility'}
                            onClick={() => {
                                let newChannels = this.props.channels;
                                newChannels[index].visible = !newChannels[index].visible;
                                this.props.setChannels(newChannels);
                            }}
                            src={channel.visible ? eyeOpen : eyeClosed}
                        />
                        <span
                            className='icon channel-name'
                            onClick={() => {
                                let newChannels = this.props.channels;
                                newChannels[index].editable = !newChannels[index].editable;
                                this.props.setChannels(newChannels);
                            }}
                        ><img src={channel.icon}/></span>
                    </div>
            )}
        </div>;
    }
}