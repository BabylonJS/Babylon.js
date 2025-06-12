import { DataStorage } from "@babylonjs/core/Misc/dataStorage.js";
import * as react from "react";

interface ILineWithFileButtonComponentProps {
    title: string;
    closed?: boolean;
    label: string;
    iconImage: any;
    onIconClick: (file: File) => void;
    accept: string;
    uploadName?: string;
    allowMultiple?: boolean;
}

export class LineWithFileButtonComponent extends react.Component<
    ILineWithFileButtonComponentProps,
    { isExpanded: boolean }
> {
    private _uploadRef: react.RefObject<HTMLInputElement>;
    constructor(props: ILineWithFileButtonComponentProps) {
        super(props);

        const initialState = DataStorage.ReadBoolean(this.props.title, !this.props.closed);
        this.state = { isExpanded: initialState };
        this._uploadRef = react.createRef();
    }

    onChange(evt: any) {
        const files: File[] = evt.target.files;
        if (files) {
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
                    <img className="img" src={this.props.iconImage} alt="icon" />
                </div>
                <div className="buttonLine" title={this.props.title}>
                    <label
                        htmlFor={this.props.uploadName ? this.props.uploadName : "file-upload"}
                        className="file-upload"
                    />
                    <input
                        ref={this._uploadRef}
                        id={this.props.uploadName ? this.props.uploadName : "file-upload"}
                        type="file"
                        accept={this.props.accept}
                        multiple={!!this.props.allowMultiple}
                        onChange={(evt) => this.onChange(evt)}
                    />
                </div>
            </div>
        );
    }
}
