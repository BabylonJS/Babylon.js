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