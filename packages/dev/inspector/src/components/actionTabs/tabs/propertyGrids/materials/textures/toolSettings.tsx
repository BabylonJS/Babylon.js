import * as React from "react";
import type { ITool } from "./toolBar";

interface IToolSettingsProps {
    tool: ITool | undefined;
}

export class ToolSettings extends React.Component<IToolSettingsProps> {
    render() {
        if (!this.props.tool || !this.props.tool.settingsComponent) return <></>;
        return <div id="tool-ui">{<this.props.tool.settingsComponent instance={this.props.tool.instance} />}</div>;
    }
}
