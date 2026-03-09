/* eslint-disable @typescript-eslint/naming-convention */
export type NamingScheme = string;

export type RestPoseDataUpdate = Array<{ name: string; data: { position?: number[]; scaling?: number[]; quaternion?: number[] } }>;

export const Avatars: {
    [name: string]: {
        path: string;
        namingScheme: NamingScheme;
        restPoseUpdate?: RestPoseDataUpdate;
    };
} = {
    Goblin: {
        path: "https://assets.babylonjs.com/mixamo/Characters/goblin_d_shareyko.glb",
        namingScheme: "Mixamo",
    },
    "Big Vegas": {
        path: "https://assets.babylonjs.com/mixamo/Characters/Big Vegas.glb",
        namingScheme: "Mixamo",
    },
    "White Clown": {
        path: "https://assets.babylonjs.com/mixamo/Characters/Whiteclown N Hallin.glb",
        namingScheme: "Mixamo",
    },
    Mousey: {
        path: "https://assets.babylonjs.com/mixamo/Characters/Ch14_nonPBR.glb",
        namingScheme: "Mixamo",
    },
    "Ready Player Me": {
        path: "https://assets.babylonjs.com/mixamo/Characters/rpm.glb",
        namingScheme: "Mixamo No Namespace",
        restPoseUpdate: [
            { name: "Neck", data: { quaternion: [0.034619355720038936, 4.672305324509115e-8, 1.2327723869642098e-7, 0.9994005701445136] } },
            { name: "Head", data: { quaternion: [-0.01219221211246064, -3.615570438034387e-7, -3.367146232302434e-7, 0.9999256702455088] } },
            { name: "LeftShoulder", data: { quaternion: [-0.4888535487255111, -0.5055423403794744, 0.5302840821460562, -0.4735482630931305] } },
            { name: "LeftArm", data: { quaternion: [0.008704805528198944, 0.06488486926052185, 0.02791158863460149, 0.9974643477902022] } },
            { name: "LeftForeArm", data: { quaternion: [-0.05352775158188574, 0.0119205769810382, 0.003214396597565389, 0.9984900280144573] } },
            { name: "RightShoulder", data: { quaternion: [0.4670848252944479, -0.5257200898704908, 0.549788596763065, 0.45075786114169936] } },
            { name: "RightArm", data: { quaternion: [0.007797015816145728, -0.0649425313836908, -0.06250639119864947, 0.9958988971488447] } },
            { name: "RightForeArm", data: { quaternion: [-0.053545557969461616, -0.01182403014636169, -0.0013402246314159288, 0.9984945051130866] } },
            { name: "LeftUpLeg", data: { quaternion: [-0.0016660471658626209, 0.00970464150074662, 0.9999236137302893, -0.007470431708105472] } },
            { name: "RightUpLeg", data: { quaternion: [0.0017072740086764113, 0.009685813129036259, 0.9999064759389724, 0.009503174401248248] } },
        ],
    },
    Dude: {
        path: "https://assets.babylonjs.com/meshes/Dude/dude.babylon",
        namingScheme: "Dude",
        restPoseUpdate: [
            { name: "bone0", data: { quaternion: [-0.4956382108411332, -0.495637539287752, -0.5043240625640419, 0.5043247225089963] } },
            {
                name: "bone7",
                data: {
                    quaternion: [6.118323346972899e-7, 2.566696352359036e-7, -0.06278098256710099, 0.9980273310171722],
                    position: [3.953911542892456, 0.00007303011079784483, -0.000011959440598729998],
                },
            },
            {
                name: "bone13",
                data: {
                    quaternion: [-0.017243666667216433, -0.09375516674288878, 0.011190084226846867, 0.9953830427505721],
                    position: [6.843832969665527, 0.0000010450148693053052, -0.0000037226973290671594],
                },
            },
            {
                name: "bone14",
                data: {
                    quaternion: [-2.2745848490743344e-7, -7.993348609217729e-7, -0.04529758609725934, 0.9989735431461285],
                    position: [13.142180442810059, 0.00011519173858687282, -0.0005142003647051752],
                },
            },
            {
                name: "bone32",
                data: {
                    quaternion: [0.014759507524885264, 0.05232950511551538, 0.02534179747048678, 0.9981991601312742],
                    position: [6.843867778778076, 0.000034889206290245056, -0.000012921306733915117],
                },
            },
            {
                name: "bone33",
                data: {
                    quaternion: [-4.979581737795843e-7, -6.461808455694249e-7, -0.021828819836246977, 0.9997617243966206],
                    position: [13.14214038848877, -0.000036571920645656064, 0.00035435488098300993],
                },
            },
            {
                name: "bone50",
                data: {
                    quaternion: [-0.024342876199033407, 0.9955010539441587, 0.08997531640320489, -0.017015403996628355],
                    position: [-3.7692983150482178, -0.3552809953689575, 3.4951446056365967],
                },
            },
            {
                name: "bone51",
                data: {
                    quaternion: [-1.7234181971844284e-7, -3.178950951473535e-7, -0.04279816521194403, 0.9990837399656395],
                    position: [18.257123947143555, 0.000011578077646845486, 1.4664297509625612e-7],
                },
            },
            {
                name: "bone54",
                data: {
                    quaternion: [0.013458383790773848, 0.9953978033355617, -0.08915652455748883, 0.03245303966196451],
                    position: [-3.7693002223968506, -0.35523295402526855, -3.4951460361480713],
                },
            },
            {
                name: "bone55",
                data: {
                    quaternion: [2.8163977536254093e-8, -2.0904395193615398e-7, -0.09351755875877536, 0.995617629309489],
                    position: [18.25729751586914, 0.000010011796803155448, -0.00000868310235091485],
                },
            },
        ],
    },
};

export const Animations: {
    [name: string]: {
        path: string;
        namingScheme: NamingScheme;
        restPoseUpdate?: RestPoseDataUpdate;
    };
} = {
    "Rumba Dancing": {
        path: "https://assets.babylonjs.com/mixamo/Animations/Rumba Dancing.glb",
        namingScheme: "Mixamo",
    },
    "Hip Hop Dancing": {
        path: "https://assets.babylonjs.com/mixamo/Animations/Hip Hop Dancing.glb",
        namingScheme: "Mixamo",
    },
    "Sitting Clap": {
        path: "https://assets.babylonjs.com/mixamo/Animations/Sitting Clap.glb",
        namingScheme: "Mixamo",
    },
    Walking: {
        path: "https://assets.babylonjs.com/mixamo/Animations/Walking.glb",
        namingScheme: "Mixamo",
    },
    "Catwalk Walking": {
        path: "https://assets.babylonjs.com/mixamo/Animations/Catwalk Walking.glb",
        namingScheme: "Mixamo",
    },
    Praying: {
        path: "https://assets.babylonjs.com/mixamo/Animations/Praying.glb",
        namingScheme: "Mixamo",
    },
    "Mousey walking": {
        path: "https://assets.babylonjs.com/mixamo/Animations/Mousey_walking.glb",
        namingScheme: "Mixamo",
    },
    "Hip Hop": {
        path: "https://assets.babylonjs.com/mixamo/Animations/hiphop.glb",
        namingScheme: "Mixamo No Namespace",
        restPoseUpdate: [
            {
                name: "Hiphop",
                data: {
                    scaling: [0.009999999776482582, 0.009999998410327421, 0.009999998410327421],
                    quaternion: [0.030719497659612304, 0, 0, 0.9995280448609439],
                    position: [0, 0.02035129815340042, 1.1486760377883911],
                },
            },
            {
                name: "Hips",
                data: {
                    scaling: [0.9999986007074148, 0.9999962094110727, 0.999997142588067],
                    quaternion: [0.052553157917843873, -0.01805944576098157, 0.004367241634189689, 0.9984452660071943],
                    position: [13.188420295715332, 99.95006561279297, -98.15790557861328],
                },
            },
            { name: "RightUpLeg", data: { quaternion: [-0.08596637511297929, 0.014617736988054434, -0.013545213999786802, 0.9960987055974838] } },
            { name: "LeftUpLeg", data: { quaternion: [-0.07820982526524597, 0.11147862411271901, 0.030835694345175777, 0.990204473607429] } },
            { name: "Spine1", data: { quaternion: [0.04900287931205046, 0.027042963899555204, -0.024301365217254737, 0.9981366838120086] } },
            { name: "LeftShoulder", data: { quaternion: [-0.04931914589884397, -0.12596940975740217, 0.06417621343333987, 0.988726829454192] } },
            { name: "LeftArm", data: { quaternion: [0.6732927881818989, 0.04568916112857387, -0.12122590687031896, 0.7279379104299217] } },
            { name: "RightShoulder", data: { quaternion: [-0.0012312282728442689, 0.048555807875653556, -0.03611679100293636, 0.9981665166725106] } },
            { name: "RightArm", data: { quaternion: [0.60239787641809, -0.02177013258724727, 0.07259245132646759, 0.7945899545202696] } },
            { name: "Neck", data: { quaternion: [-0.1367366086184092, -0.008306950825413764, 0.009321711794875032, 0.9905287477507827] } },
        ],
    },
};
