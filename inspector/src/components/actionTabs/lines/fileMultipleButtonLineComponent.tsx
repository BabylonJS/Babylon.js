import * as React from "react";

interface IFileMultipleButtonLineComponentProps {
    label: string;
    onClick: (event: any) => void;
    accept: string;
}

export class FileMultipleButtonLineComponent extends React.Component<IFileMultipleButtonLineComponentProps> {
    private static _IDGenerator = 0;
    private _id = FileMultipleButtonLineComponent._IDGenerator++;

    constructor(props: IFileMultipleButtonLineComponentProps) {
        super(props);
    }

    onChange(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(evt);
        }

        evt.target.value = "";
    }

    render() {
        return (
            <div className="buttonLine">
                <label htmlFor={"file-upload" + this._id} className="file-upload">
                    {this.props.label}
                </label>
                <input ref="upload" id={"file-upload" + this._id} type="file" accept={this.props.accept} onChange={evt => this.onChange(evt)} multiple />
            </div>
        );
    }
}
