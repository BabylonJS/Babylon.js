import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
const addButton = require('../../imgs/add.svg');

interface ILineWithFileButtonContainerComponentProps {
    title: string;
    children: any[] | any;
    closed?: boolean;
    label: string;
    onClick: (file: File) => void;
    accept: string;
    uploadName?: string;
}

export class LineWithFileButtonContainerComponent extends React.Component<ILineWithFileButtonContainerComponentProps, { isExpanded: boolean }> {
    private uploadRef: React.RefObject<HTMLInputElement>
    constructor(props: ILineWithFileButtonContainerComponentProps) {
        super(props);

        let initialState = DataStorage.ReadBoolean(this.props.title, !this.props.closed);

        this.state = { isExpanded: initialState };
        this.uploadRef = React.createRef();
    }

    onChange(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(files[0]);
        }

        evt.target.value = "";
    }


    switchExpandedState(): void {
        const newState = !this.state.isExpanded;

        DataStorage.WriteBoolean(this.props.title, newState);

        this.setState({ isExpanded: newState });
    }

    renderHeader() {
        let className = this.state.isExpanded ? "collapse" : "collapse closed";

        return (
            <div className="header" onClick={() => this.switchExpandedState()}>
                <div className="title">
                    {this.props.title}
                </div>
                <div className="buttonIcon" title="Upload Custom">
                <label htmlFor={this.props.uploadName ? this.props.uploadName : "file-upload"} className="file-upload">
                        </label>
                    <div className="icon">
                    <img title="Add" className="addIcon" src={addButton}/>
                    </div>
                    <div className="icon">
                    <input ref={this.uploadRef} id={this.props.uploadName ? this.props.uploadName : "file-upload"} type="file" accept={this.props.accept} onChange={evt => this.onChange(evt)} />
                    </div>
                    <div className={className}>
                    <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                </div>
               
            </div>
        );
    }
    
    render() {
        
        if (!this.state.isExpanded) {
            return (
                <div className="paneContainer">
                    <div className="paneContainer-content">
                        {
                            this.renderHeader()
                        }
                    </div>
                </div>
            );
        }

        return (
            <div className="paneContainer">
                <div className="paneContainer-content">
                    {
                        this.renderHeader()
                    }
                    <div className="paneList">
                        {this.props.children}
                    </div >
                </div>
            </div>
        );
    }
}
