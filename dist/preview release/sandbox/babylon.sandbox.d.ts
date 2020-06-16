/// <reference types="react" />
declare module SANDBOX {
    interface ISandboxProps {
    }
    export class Sandbox extends React.Component<ISandboxProps> {
        render(): null;
        static Show(hostElement: HTMLElement): void;
    }
}