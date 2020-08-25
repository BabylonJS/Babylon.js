import * as React from "react";
import { DataStorage } from 'babylonjs/Misc/dataStorage';

interface ILineWithFileButtonComponentProps {
    title: string;
    closed?: boolean;
    label: string;
    iconImage: any;
    onIconClick: (file: File) => void;
    accept: string;
    uploadName?: string;
}

export class LineWithFileButtonComponent extends React.Component<ILineWithFileButtonComponentProps, { isExpanded: boolean }> {
    private uploadRef: React.RefObject<HTMLInputElement>
    constructor(props: ILineWithFileButtonComponentProps) {
        super(props);

        let initialState = DataStorage.ReadBoolean(this.props.title, !this.props.closed);
        this.state = { isExpanded: initialState };
        this.uploadRef = React.createRef();
    }

    onChange(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onIconClick(files[0]);
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
            <div className="nonDraggableLine withButton">
                {this.props.label}
                <div className="icon" title={this.props.title}>
                <img className="img" src={this.props.iconImage}/>
                </div>
                <div className="buttonLine" title={this.props.title}>
                    <label htmlFor={this.props.uploadName ? this.props.uploadName : "file-upload"} className="file-upload"/>   
                    <input ref={this.uploadRef} id={this.props.uploadName ? this.props.uploadName : "file-upload"} type="file" accept={this.props.accept} onChange={evt => this.onChange(evt)} />
                </div>
            </div>
        ); 
    }
}