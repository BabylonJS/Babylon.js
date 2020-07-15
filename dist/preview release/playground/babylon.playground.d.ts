/// <reference types="react" />
declare module PLAYGROUND {
    export class GlobalState {
    }
}
declare module PLAYGROUND {
    interface IMonacoComponentProps {
        language: "JS" | "TS";
    }
    export class MonacoComponent extends React.Component<IMonacoComponentProps> {
        private _hostReference;
        private _editor;
        private _definitionWorker;
        private _deprecatedCandidates;
        constructor(props: IMonacoComponentProps);
        setupMonaco(): Promise<void>;
        setupMonacoColorProvider(): void;
        setupMonacoCompilationPipeline(libContent: string): void;
        setupDefinitionWorker(libContent: string): void;
        analyzeCode(): Promise<void>;
        isDeprecatedEntry(details: any): any;
        isDeprecatedTag(tag: any): boolean;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module PLAYGROUND {
    interface IPlaygroundProps {
    }
    export class Playground extends React.Component<IPlaygroundProps, {
        errorMessage: string;
    }> {
        constructor(props: IPlaygroundProps);
        render(): JSX.Element;
        static Show(hostElement: HTMLElement): void;
    }
}