import * as React from "react";
import { GlobalState } from '../globalState';

interface IGraphEditorProps {
    globalState: GlobalState;
}

export class GraphEditor extends React.Component<IGraphEditorProps> {
    constructor(props: IGraphEditorProps) {
        super(props);
    }

    render() {

        return (
            <div>
            </div>
        );
    }
}