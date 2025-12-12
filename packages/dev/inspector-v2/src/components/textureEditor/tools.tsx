import type { FunctionComponent } from "react";
import { useCallback } from "react";

import { makeStyles, tokens, Tooltip, ToggleButton } from "@fluentui/react-components";
import { Color3, Color4 } from "core/Maths/math.color";

import { ColorPickerPopup } from "shared-ui-components/fluent/primitives/colorPicker";

import type { IMetadata, IToolData, IToolType } from "./textureEditor";

/**
 * A tool instance with its data and state
 */
export interface ITool extends IToolData {
    /** The tool instance */
    instance: IToolType;
}

const useStyles = makeStyles({
    toolbar: {
        display: "flex",
        flexDirection: "column",
        padding: tokens.spacingVerticalXS,
        gap: tokens.spacingVerticalXS,
    },
    toolsSection: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
    },
    toolButton: {
        minWidth: "36px",
        minHeight: "36px",
        padding: tokens.spacingVerticalXS,
    },
    toolIcon: {
        width: "24px",
        height: "24px",
    },
    colorSection: {
        display: "flex",
        justifyContent: "center",
        margin: tokens.spacingVerticalS,
    },
});

interface IToolBarProps {
    tools: ITool[];
    addTool: (url: string) => void;
    changeTool: (toolIndex: number) => void;
    activeToolIndex: number;
    metadata: IMetadata;
    setMetadata: (data: any) => void;
    hasAlpha: boolean;
}

/**
 * Toolbar component for texture editing tools
 * @param props - The toolbar properties
 * @returns The toolbar component
 */
export const ToolBar: FunctionComponent<IToolBarProps> = (props) => {
    const { tools, changeTool, activeToolIndex, metadata, setMetadata, hasAlpha } = props;

    const classes = useStyles();

    const computeRGBAColor = useCallback(() => {
        const opacityInt = Math.floor(metadata.alpha * 255);
        const opacityHex = opacityInt.toString(16).padStart(2, "0");
        return Color4.FromHexString(`${metadata.color}${opacityHex}`);
    }, [metadata.color, metadata.alpha]);

    const handleColorChange = useCallback(
        (color: Color3 | Color4) => {
            const newMetadata = {
                color: color.toHexString(true),
                alpha: (color as Partial<Color4>).a ?? 1,
            };
            if (newMetadata.color !== metadata.color || newMetadata.alpha !== metadata.alpha) {
                setMetadata(newMetadata);
            }
        },
        [metadata, setMetadata]
    );

    const handleToolClick = useCallback(
        (index: number) => {
            if (activeToolIndex === index) {
                // Deselect current tool
                changeTool(-1);
            } else {
                changeTool(index);
            }
        },
        [activeToolIndex, changeTool]
    );

    return (
        <div className={classes.toolbar}>
            <div className={classes.colorSection}>
                <ColorPickerPopup value={hasAlpha ? computeRGBAColor() : Color3.FromHexString(metadata.color)} onChange={handleColorChange} />
            </div>
            <div className={classes.toolsSection}>
                {tools.map((tool, index) => {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    const IconComponent = tool.icon;
                    return (
                        <Tooltip key={index} content={tool.name} relationship="label" positioning="after">
                            <ToggleButton
                                className={classes.toolButton}
                                appearance="subtle"
                                checked={index === activeToolIndex}
                                onClick={() => handleToolClick(index)}
                                icon={<IconComponent />}
                            />
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

interface IToolSettingsProps {
    tool: ITool | undefined;
}

/**
 * Displays settings UI for the currently selected tool
 * @param props - The tool settings properties
 * @returns The tool settings component or null
 */
export const ToolSettings: FunctionComponent<IToolSettingsProps> = (props) => {
    const { tool } = props;

    if (!tool || !tool.settingsComponent) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const ToolSettingsComponent = tool.settingsComponent;
    return (
        <div>
            <ToolSettingsComponent instance={tool.instance} />
        </div>
    );
};
