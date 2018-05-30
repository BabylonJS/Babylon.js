import { ConfigurationContainer } from "./configurationContainer";

export class ViewerGlobals {

    public disableInit: boolean = false;
    public disableWebGL2Support: boolean = false;

    public configurations: { [id: string]: ConfigurationContainer };

}

export let viewerGlobals: ViewerGlobals = new ViewerGlobals();