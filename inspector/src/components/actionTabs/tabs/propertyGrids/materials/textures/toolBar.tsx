import * as React from 'react';
import { SketchPicker } from 'react-color';
import { IToolData, IToolType, IMetadata } from './textureEditorComponent';

export interface ITool extends IToolData {
    instance: IToolType;
}

interface IToolBarProps {
    tools: ITool[];
    addTool(url: string): void;
    changeTool(toolIndex : number): void;
    activeToolIndex : number;
    metadata: IMetadata;
    setMetadata(data : any): void;
}

interface IToolBarState {
    toolURL : string;
    pickerOpen : boolean;
    addOpen : boolean;
}


export class ToolBar extends React.Component<IToolBarProps, IToolBarState> {
    private _addTool = require('./assets/addTool.svg');

    private _pickerRef : React.RefObject<HTMLDivElement>;
    constructor(props : IToolBarProps) {
        super(props);
        this.state = {
            toolURL: "",
            pickerOpen: false,
            addOpen: false
        };
        this._pickerRef = React.createRef();
    }

    computeRGBAColor() {
        const opacityInt = Math.floor(this.props.metadata.alpha * 255);
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
                            onClick={evt => {
                                if (evt.button === 0) {
                                    this.props.changeTool(index)
                                }
                            }}
                            key={index}
                        />
                    }
                )}
            </div>
            <div id='color' onClick={() => this.setState({pickerOpen: !this.state.pickerOpen})} title='Color' className={`icon button${this.state.pickerOpen ? ` active` : ``}`}>
                <div id='active-color-bg'>
                    <div id='active-color' style={{backgroundColor: this.props.metadata.color, opacity: this.props.metadata.alpha}}></div>
                </div>
            </div>
            {
                this.state.pickerOpen &&
                <>
                    <div className='color-picker-cover' onClick={evt => {
                        if (evt.target !== this._pickerRef.current?.ownerDocument.querySelector('.color-picker-cover')) {
                            return;
                        }
                        this.setState({pickerOpen: false});
                    }}>
                    </div>
                    <div className='color-picker' ref={this._pickerRef}>
                            <SketchPicker color={this.computeRGBAColor()}  onChange={color => this.props.setMetadata({color: color.hex, alpha: color.rgb.a})}/>
                    </div>
                </>
            }
        </div>;
    }
}