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
        return <div id="tools">
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
                    this.props.addTool(this.state.toolURL);
                    this.setState({toolURL: ""});
                    event.preventDefault();
                }}>
                <label>
                    Tool URL:
                    <input
                        onChange={(event) => this.setState({toolURL: event.target.value})}
                        type="text"
                        value={this.state.toolURL}
                        placeholder="http://..."
                    />
                </label>
                <button>Add Tool</button>
            </form>
        </div>;
    }
}