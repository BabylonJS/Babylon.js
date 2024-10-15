import * as React from "react";
import { DataStorage } from "core/Misc/dataStorage";

interface ILineWithFileButtonComponentProps {
    title: string;
    closed?: boolean;
    multiple?: boolean;
    label: string;
    iconImage: any;
    onIconClick: (file: File) => void;
    accept: string;
    uploadName?: string;
}

export class LineWithFileButtonComponent extends React.Component<ILineWithFileButtonComponentProps, { isExpanded: boolean }> {
    private _uploadRef: React.RefObject<HTMLInputElement>;
    constructor(props: ILineWithFileButtonComponentProps) {
        super(props);

        const initialState = DataStorage.ReadBoolean(this.props.title, !this.props.closed);
        this.state = { isExpanded: initialState };
        this._uploadRef = React.createRef();
    }

    onChange(evt: any) {
        const files: File[] = evt.target.files;
        if (files && files.length) {
            for (const file of files) {
                this.props.onIconClick(file);
            }
        }
        evt.target.value = "";
    }

    switchExpandedState(): void {
        const newState = !this.state.isExpanded;
        DataStorage.WriteBoolean(this.props.title, newState);
        this.setState({ isExpanded: newState });
    }

    override render() {
        return (
            <div className="nonDraggableLine withButton">
                {this.props.label}
                <div className="icon" title={this.props.title}>
                    <img className="img" src={this.props.iconImage} />
                </div>
                <div className="buttonLine" title={this.props.title}>
                    <label htmlFor={this.props.uploadName ? this.props.uploadName : "file-upload"} className="file-upload" />
                    <input
                        ref={this._uploadRef}
                        id={this.props.uploadName ? this.props.uploadName : "file-upload"}
                        type="file"
                        multiple={this.props.multiple}
                        accept={this.props.accept}
                        onChange={(evt) => this.onChange(evt)}
                    />
                </div>
            </div>
        );
    }
}
