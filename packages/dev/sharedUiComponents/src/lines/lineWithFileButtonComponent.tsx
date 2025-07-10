import * as React from "react";
import { DataStorage } from "core/Misc/dataStorage";
import { FileUploadLine } from "../fluent/hoc/fileUploadLine";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

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

    renderFluent() {
        return (
            <FileUploadLine
                label={this.props.title ?? "file-upload"}
                accept={this.props.accept}
                onClick={(files) => {
                    if (files && files.length) {
                        for (const file of files) {
                            this.props.onIconClick(file);
                        }
                    }
                }}
            />
        );
    }

    renderOriginal() {
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
    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent() : this.renderOriginal())}</ToolContext.Consumer>;
    }
}
