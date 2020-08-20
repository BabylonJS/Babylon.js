import * as React from 'react';
import { ITool } from './toolBar';

interface IToolUIProps {
    tool: ITool | undefined;
}

export class ToolUI extends React.Component<IToolUIProps> {
    render() {
        if (!this.props.tool || !this.props.tool.GUI) return <></>;
        return <div id='tool-ui'>
            {<this.props.tool.GUI instance={this.props.tool.instance}/>}
        </div>;
    }
}