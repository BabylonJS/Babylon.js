import * as React from "react";

interface IFileButtonLineComponentProps {
    label: string,
    onClick: (file: File) => void
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
    }

    render() {
        return (
            <div className="buttonLine">
                <label htmlFor="file-upload" className="file-upload">
                    {this.props.label}
                </label>
                <input id="file-upload" type="file" accept=".dds, .env" onChange={evt => this.onChange(evt)} />
            </div>
        );
    }
}
