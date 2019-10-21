import * as React from "react";

interface IFileButtonLineComponentProps {
    label: string;
    onClick: (file: File) => void;
    accept: string;
}

export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
    constructor(props: IFileButtonLineComponentProps) {
        super(props);
    }

    onChange(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(files[0]);
        }

        evt.target.value = "";
    }

    render() {
        return (
            <div className="buttonLine">
                <label htmlFor="file-upload" className="file-upload">
                    {this.props.label}
                </label>
                <input ref="upload" id="file-upload" type="file" accept={this.props.accept} onChange={evt => this.onChange(evt)} />
            </div>
        );
    }
}
