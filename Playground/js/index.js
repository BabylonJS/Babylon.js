class Index {
    constructor() {

        this.examples = new Examples(this);
        this.utils = new Utils(this);
        this.monacoCreator = new MonacoCreator(this);
        this.settingsPG = new SettingsPG(this);
        this.menuPG = new MenuPG(this);
        this.zipTool = new ZipTool(this);
        this.main = new Main(this);

        /**
         * View split
         */
        this.splitInstance = Split(['#jsEditor', '#canvasZone'], {minSize: 0});

        /**
         * Run the main script
         */
        this.main.initialize();
    }
}
index = new Index();

// defeinsive, in case there was an error loading babylon.js
// This is done so that search bots will still be able to render the page, even when babylon had a problem while downloading
if (!window.BABYLON) {
    window.BABYLON = {
        Vector3: function () {},
        Vector2: function () {},
        Mesh: function () {},
        Matrix: function () {},
        GLTF2: {
            GLTFLoader: {
                RegisterExtension: function () {}
            }
        },
        SceneLoader: {
            OnPluginActivatedObservable: {
                add: function () {}
            }
        }
    }
    BABYLON.Vector3.Up = function () {};
    BABYLON.Vector3.Zero = function () {};
    BABYLON.Vector2.Zero = function () {};
    BABYLON.Matrix.Zero = function () {};
}