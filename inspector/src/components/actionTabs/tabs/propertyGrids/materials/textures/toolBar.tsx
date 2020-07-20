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
    setMetadata(data : any): void;
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
        // No need to display toolbar if there aren't any tools loaded
        if (this.props.tools.length === 0) return <></>;
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
        </div>;
    }
}