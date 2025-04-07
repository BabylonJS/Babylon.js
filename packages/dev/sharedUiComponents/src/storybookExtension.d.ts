import "react";

declare module "react" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface FunctionComponent {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __docgenInfo?: {
            description: string;
            displayName: string;
            methods: any;
            props?: any;
        };
    }
}

declare module "react" {
    namespace Component {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let __docgenInfo: {
            description: string;
            displayName: string;
            methods: any;
            props?: any;
        };
    }
}
