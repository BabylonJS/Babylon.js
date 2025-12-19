import type { FunctionComponent } from "react";

import { useCallback } from "react";
import { makeStyles, tokens, ToggleButton, Tooltip, Body1, mergeClasses } from "@fluentui/react-components";
import { EyeOffRegular, EyeRegular, LockClosedRegular, LockOpenRegular } from "@fluentui/react-icons";

/**
 * Represents a color channel in the texture editor
 */
export type Channel = {
    /** Whether the channel is visible */
    visible: boolean;
    /** Whether the channel is editable */
    editable: boolean;
    /** Display name for the channel */
    name: string;
    /** Channel identifier */
    id: "R" | "G" | "B" | "A";
};

const useStyles = makeStyles({
    channelsBar: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: tokens.colorNeutralBackground1,
        padding: tokens.spacingVerticalXS,
        gap: tokens.spacingVerticalXS,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow8,
    },
    channel: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        padding: tokens.spacingVerticalXS,
        borderRadius: tokens.borderRadiusMedium,
    },
    channelLabel: {
        fontWeight: tokens.fontWeightSemibold,
        margin: `0 ${tokens.spacingHorizontalXS}`,
        textAlign: "center",
    },
    channelR: {
        color: tokens.colorPaletteRedBorderActive,
    },
    channelG: {
        color: tokens.colorPaletteGreenBorderActive,
    },
    channelB: {
        color: tokens.colorPaletteBlueBorderActive,
    },
    channelA: {
        color: tokens.colorNeutralForeground1,
    },
    uneditable: {
        opacity: 0.5,
    },
});

type ChannelsBarProps = {
    channels: Channel[];
    setChannels: (channels: Channel[]) => void;
};

/**
 * Displays channel visibility and editability controls
 * @param props - The channels bar properties
 * @returns The channels bar component
 */
export const ChannelsBar: FunctionComponent<ChannelsBarProps> = (props) => {
    const { channels, setChannels } = props;
    const classes = useStyles();

    const toggleVisibility = useCallback(
        (index: number) => {
            const newChannels = [...channels];
            newChannels[index] = { ...newChannels[index], visible: !newChannels[index].visible };
            setChannels(newChannels);
        },
        [channels, setChannels]
    );

    const toggleEditable = useCallback(
        (index: number) => {
            const newChannels = [...channels];
            newChannels[index] = { ...newChannels[index], editable: !newChannels[index].editable };
            setChannels(newChannels);
        },
        [channels, setChannels]
    );

    const getChannelColorClass = (id: string) => {
        switch (id) {
            case "R":
                return classes.channelR;
            case "G":
                return classes.channelG;
            case "B":
                return classes.channelB;
            default:
                return classes.channelA;
        }
    };

    return (
        <div className={classes.channelsBar}>
            {channels.map((channel, index) => {
                const visTip = channel.visible ? "Hide" : "Show";
                const editTip = channel.editable ? "Lock" : "Unlock";

                return (
                    <div key={channel.id} className={`${classes.channel} ${!channel.editable ? classes.uneditable : ""}`}>
                        <Tooltip content={`${visTip} ${channel.name}`} relationship="label" positioning="before">
                            <ToggleButton
                                appearance="transparent"
                                size="small"
                                checked={channel.visible}
                                icon={channel.visible ? <EyeRegular /> : <EyeOffRegular />}
                                onClick={() => toggleVisibility(index)}
                            />
                        </Tooltip>
                        <Tooltip content={`${editTip} ${channel.name}`} relationship="label" positioning="before">
                            <ToggleButton
                                appearance="transparent"
                                size="small"
                                checked={channel.editable}
                                icon={channel.editable ? <LockOpenRegular /> : <LockClosedRegular />}
                                onClick={() => toggleEditable(index)}
                            />
                        </Tooltip>
                        <Body1 className={mergeClasses(classes.channelLabel, getChannelColorClass(channel.id))}>{channel.id}</Body1>
                    </div>
                );
            })}
        </div>
    );
};
