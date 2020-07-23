import * as React from 'react';
import { SketchPicker } from 'react-color';

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
    pickerEnabled : boolean;
}

const addTool = require('./assets/addTool.svg');

export class ToolBar extends React.Component<ToolBarProps, ToolBarState> {
    private pickerRef : React.RefObject<HTMLDivElement>;
    constructor(props : ToolBarProps) {
        super(props);
        this.state = {
            toolURL: "",
            pickerEnabled: false
        };
        this.pickerRef = React.createRef();
    }

    computeRGBAColor() {
        const opacityInt = Math.floor(this.props.metadata.opacity * 255);
        const opacityHex = opacityInt.toString(16).padStart(2, '0');
        return `${this.props.metadata.color}${opacityHex}`;
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
                            title={item.name}
                            onClick={() => this.props.changeTool(index)}
                            key={index}
                        />
                    }
                )}
                <img src={addTool} className='icon button' title='Add Tool' alt='Add Tool'/>
            </div>
                <div id='color' onClick={() => this.setState({pickerEnabled: !this.state.pickerEnabled})} title='Color' className='icon button'>
                    <div id='activeColor' style={{backgroundColor: this.props.metadata.color}}></div>
                </div>
                {
                    this.state.pickerEnabled &&
                    <>
                        <div className='color-picker-cover' onClick={evt => {
                            if (evt.target !== this.pickerRef.current?.ownerDocument.querySelector('.color-picker-cover')) {
                                return;
                            }
                            this.setState({pickerEnabled: false});
                        }}>
                        </div>
                        <div className='color-picker' ref={this.pickerRef}>
                                <SketchPicker disableAlpha={false} color={this.computeRGBAColor()}  onChangeComplete={color => this.props.setMetadata({color: color.hex, opacity: color.rgb.a})}/>
                        </div>
                    </>
                }
        </div>;
    }
}