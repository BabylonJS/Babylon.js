import * as React from 'react';

export interface Tool {
    type: any,
    name: string,
    instance: any
}

interface ToolbarProps {
    tools: Tool[];
    addTool : any;
    changeTool: any;
    activeToolIndex : number;
    metadata: any;
    setMetadata: any;
}

interface ToolbarState {
    toolURL : string;
}

export class Toolbar extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props : ToolbarProps) {
        super(props);
        this.state = {
            toolURL: "",
        };
    }
    render() {
        return <div id="toolbar">
                <div id="tools">
                    <select
                        id="tool-select"
                        value={this.props.activeToolIndex}
                        onChange={event => {this.props.changeTool(event.target.value)}}
                    >
                        <option value={-1}>NO TOOL SELECTED</option>
                        {this.props.tools.map(
                            (item, index) => {
                                return <option value={index}>{item.name}</option>
                            }
                        )}
                    </select>
                    <form
                        id="tool-loading"
                        onSubmit={(event) => {
                            const urls = this.state.toolURL.split(",");
                            urls.forEach((url) => this.props.addTool(url));
                            this.setState({toolURL: ""});
                            event.preventDefault();
                        }}>
                        <input
                            onChange={event => this.setState({toolURL: event.target.value})}
                            type="text"
                            value={this.state.toolURL}
                            placeholder="Enter Tool URL"
                        />
                        <button>Add Tool</button>
                    </form>
                </div>
                <div id="color">
                    <label>Color <input type="color" onChange={event => this.props.setMetadata({color: event.target.value})} value={this.props.metadata.color} /></label>
                    <label>Opacity <input type="range" min={0} max={100} value={this.props.metadata.opacity*100} onChange={event => this.props.setMetadata({opacity: parseInt(event.target.value)/100})} /></label>
                </div>
        </div>;
    }
}