import * as React from "react";
import type { IToolData, IToolType, IMetadata } from "./textureEditorComponent";
import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import { ColorPicker } from "shared-ui-components/colorPicker/colorPicker";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

export interface ITool extends IToolData {
    instance: IToolType;
}

interface IToolBarProps {
    tools: ITool[];
    addTool(url: string): void;
    changeTool(toolIndex: number): void;
    activeToolIndex: number;
    metadata: IMetadata;
    setMetadata(data: any): void;
    pickerOpen: boolean;
    setPickerOpen(open: boolean): void;
    pickerRef: React.RefObject<HTMLDivElement>;
    hasAlpha: boolean;
}

interface IToolBarState {
    toolURL: string;
    addOpen: boolean;
}

export class ToolBar extends React.Component<IToolBarProps, IToolBarState> {
    private _lockObject = new LockObject();
    constructor(props: IToolBarProps) {
        super(props);
        this.state = {
            toolURL: "",
            addOpen: false,
        };
    }

    computeRGBAColor() {
        const opacityInt = Math.floor(this.props.metadata.alpha * 255);
        const opacityHex = opacityInt.toString(16).padStart(2, "0");

        return Color4.FromHexString(`${this.props.metadata.color}${opacityHex}`);
    }

    shouldComponentUpdate(nextProps: IToolBarProps) {
        return (
            nextProps.tools != this.props.tools ||
            nextProps.activeToolIndex !== this.props.activeToolIndex ||
            nextProps.metadata != this.props.metadata ||
            nextProps.pickerOpen != this.props.pickerOpen
        );
    }

    render() {
        return (
            <div id="toolbar">
                <div id="tools">
                    {this.props.tools.map((item, index) => {
                        return (
                            <img
                                src={`data:image/svg+xml;base64,${item.icon}`}
                                className={index === this.props.activeToolIndex ? "icon button active" : "icon button"}
                                alt={item.name}
                                title={item.name}
                                onClick={(evt) => {
                                    if (evt.button === 0) {
                                        this.props.changeTool(index);
                                    }
                                }}
                                key={index}
                            />
                        );
                    })}
                </div>
                <div
                    id="color"
                    onClick={() => {
                        if (!this.props.pickerOpen) this.props.setPickerOpen(true);
                    }}
                    title="Color"
                    className={`icon button${this.props.pickerOpen ? ` active` : ``}`}
                >
                    <div id="active-color-bg">
                        <div id="active-color" style={{ backgroundColor: this.props.metadata.color, opacity: this.props.metadata.alpha }}></div>
                    </div>
                </div>
                {this.props.pickerOpen && (
                    <div id="color-picker" ref={this.props.pickerRef}>
                        <ColorPicker
                            lockObject={this._lockObject}
                            color={this.computeRGBAColor()}
                            onColorChanged={(color: Color3 | Color4) => {
                                const metadata = { color: color.toHexString(true), alpha: (color as unknown as Color4).a };
                                if (metadata.color !== this.props.metadata.color || metadata.alpha !== this.props.metadata.alpha) {
                                    this.props.setMetadata(metadata);
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }
}
