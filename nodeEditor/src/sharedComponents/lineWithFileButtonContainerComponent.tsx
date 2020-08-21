import * as React from "react";
import { DataStorage } from 'babylonjs/Misc/dataStorage';
const addButton = require('../../imgs/add.svg');

interface ILineWithFileButtonContainerComponentProps {
    title: string;
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

    render() {
        return (
            <div className="nonDraggableLine withButton" title="add">
                Add
                <div className="icon" title="Upload Custom">
                <img src={addButton}/>
                </div>
                <div className="buttonLine" title="Upload Custom">
                    <label htmlFor={this.props.uploadName ? this.props.uploadName : "file-upload"} className="file-upload"/>   
                    <input ref={this.uploadRef} id={this.props.uploadName ? this.props.uploadName : "file-upload"} type="file" accept={this.props.accept} onChange={evt => this.onChange(evt)} />
                </div>
                
            </div>
        );
    
    }
}
