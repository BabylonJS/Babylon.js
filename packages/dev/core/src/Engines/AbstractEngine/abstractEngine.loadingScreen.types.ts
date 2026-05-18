import { type ILoadingScreen } from "../../Loading/loadingScreen";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Display the loading screen
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        displayLoadingUI(): void;

        /**
         * Hide the loading screen
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        hideLoadingUI(): void;

        /**
         * Gets or sets the current loading screen object
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        loadingScreen: ILoadingScreen;

        /**
         * Sets the current loading screen text
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        loadingUIText: string;

        /**
         * Sets the current loading screen background color
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
         */
        loadingUIBackgroundColor: string;
    }
}
