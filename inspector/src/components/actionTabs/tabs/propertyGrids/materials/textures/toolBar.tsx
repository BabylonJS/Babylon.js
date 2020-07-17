import * as React from 'react';

export interface Tool {
    type: any,
    name: string,
    instance: any,
    icon: string
}

interface ToolBarProps {
    tools: Tool[];
    addTool(url: string): void;
    changeTool(toolIndex : number): void;
    activeToolIndex : number;
    metadata: any;
    setMetadata(data : any): any;
}

interface ToolBarState {
    toolURL : string;
}

export class ToolBar extends React.Component<ToolBarProps, ToolBarState> {
    constructor(props : ToolBarProps) {
        super(props);
        this.state = {
            toolURL: "",
        };
    }
    render() {
        return <div id='toolbar'>
            <div id='tools'>
                {this.props.tools.map(
                    (item, index) => {
                        return <img
                            src={`data:image/svg+xml;base64,${item.icon}`}
                            className={index === this.props.activeToolIndex ? 'icon button active' : 'icon button'}
                            alt={item.name}
                            onClick={() => this.props.changeTool(index)}
                            key={index}
                        />
                    }
                )}
            </div>
            <div id='color' className='icon button'>
                <div id='activeColor' style={{backgroundColor: this.props.metadata.color}}></div>
            </div>

                {/*<div id="tools">
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
                </div>*/}
        </div>;
    }
}