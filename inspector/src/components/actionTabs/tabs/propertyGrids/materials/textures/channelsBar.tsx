import * as React from 'react';

export interface IChannel {
    visible: boolean;
    editable: boolean;
    name: string;
    id: 'R' | 'G' | 'B' | 'A';
    icon: any;
}

interface IChannelsBarProps {
    channels: IChannel[];
    setChannels(channelState : IChannel[]) : void;
}

const eyeOpen = require('./assets/eyeOpen.svg');
const eyeClosed = require('./assets/eyeClosed.svg');

export class ChannelsBar extends React.Component<IChannelsBarProps> {
    render() {
        return <div id='channels-bar'>
            {this.props.channels.map(
                (channel,index) => {
                    const visTip = channel.visible ? 'Hide' : 'Show';
                    const editTip = channel.editable ? 'Lock' : 'Unlock'
                    return <div key={channel.name} className={channel.editable ? 'channel' : 'channel uneditable'}>
                        <img
                            className={channel.visible ? 'icon channel-visibility visible' : 'icon channel-visibility'}
                            onClick={() => {
                                let newChannels = this.props.channels;
                                newChannels[index].visible = !newChannels[index].visible;
                                this.props.setChannels(newChannels);
                            }}
                            src={channel.visible ? eyeOpen : eyeClosed}
                            title={`${visTip} ${channel.name}`}
                        />
                        <img
                            className='icon channel-name'
                            onClick={() => {
                                let newChannels = this.props.channels;
                                newChannels[index].editable = !newChannels[index].editable;
                                this.props.setChannels(newChannels);
                            }}
                            src={channel.icon}
                            title={`${editTip} ${channel.name}`}
                        />
                    </div>
                }
            )}
        </div>;
    }
}