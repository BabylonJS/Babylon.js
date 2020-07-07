/// <reference types="react" />
declare module PLAYGROUND {
    export class GlobalState {
    }
}
declare module PLAYGROUND {
    interface IPlaygroundProps {
    }
    export class Playground extends React.Component<IPlaygroundProps, {
        isFooterVisible: boolean;
        errorMessage: string;
    }> {
        constructor(props: IPlaygroundProps);
        render(): JSX.Element;
        static Show(hostElement: HTMLElement): void;
    }
}