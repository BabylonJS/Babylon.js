import * as React from "react";
import * as ReactDOM from "react-dom";

require("./main.scss");

interface ISandboxProps {
}

export class Sandbox extends React.Component<ISandboxProps> {
    public render() {
        return null;
    }

    public static Show(hostElement: HTMLElement) {
        const sandBox = React.createElement(Sandbox, {
        });
        
        ReactDOM.render(sandBox, hostElement);
    }
}