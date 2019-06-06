var baseUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/master/Output/";
// Views for comparison: https://bghgary.github.io/glTF-Assets-Viewer/?manifest=https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/master/Output/Manifest.json&folder=0&model=0

// const desiredFolder = "Mesh_PrimitiveAttribute"; // Replace this string to restrict the test to a single folder.

// TODO: Implement XMLHttpRequest JSON handling in the native layer; then this can be switched to a real web request.
const manifestString = `[
  {
    "folder": "Animation_Node",
    "id": 0,
    "models": [
      {
        "fileName": "Animation_Node_00.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Node_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_Node_01.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Node_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_Node_02.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Node_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_Node_03.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Node_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_Node_04.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Node_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_Node_05.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Node_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Animation_NodeMisc",
    "id": 1,
    "models": [
      {
        "fileName": "Animation_NodeMisc_00.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_01.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_02.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_03.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_04.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_05.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_06.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Animation_NodeMisc_07.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_NodeMisc_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Animation_Skin",
    "id": 2,
    "models": [
      {
        "fileName": "Animation_Skin_00.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_00.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_01.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_01.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_02.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_02.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_03.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_03.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_04.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_04.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_05.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_05.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_06.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_06.png",
        "camera": {
          "translation": [
            0.8,
            0.0,
            1.0
          ]
        }
      },
      {
        "fileName": "Animation_Skin_07.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_07.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_Skin_08.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_08.png",
        "camera": {
          "translation": [
            0.5,
            0.6,
            1.1
          ]
        }
      },
      {
        "fileName": "Animation_Skin_09.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_09.png",
        "camera": {
          "translation": [
            1.5,
            0.0,
            1.0
          ]
        }
      },
      {
        "fileName": "Animation_Skin_10.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_10.png",
        "camera": {
          "translation": [
            1.5,
            0.0,
            1.0
          ]
        }
      },
      {
        "fileName": "Animation_Skin_11.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_Skin_11.png",
        "camera": {
          "translation": [
            1.5,
            0.0,
            1.0
          ]
        }
      }
    ]
  },
  {
    "folder": "Animation_SkinType",
    "id": 3,
    "models": [
      {
        "fileName": "Animation_SkinType_00.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_SkinType_00.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_SkinType_01.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_SkinType_01.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_SkinType_02.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_SkinType_02.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      },
      {
        "fileName": "Animation_SkinType_03.gltf",
        "sampleImageName": "Figures/SampleImages/Animation_SkinType_03.png",
        "camera": {
          "translation": [
            0.5,
            0.0,
            0.6
          ]
        }
      }
    ]
  },
  {
    "folder": "Buffer_Interleaved",
    "id": 4,
    "models": [
      {
        "fileName": "Buffer_Interleaved_00.gltf",
        "sampleImageName": "Figures/SampleImages/Buffer_Interleaved_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Buffer_Interleaved_01.gltf",
        "sampleImageName": "Figures/SampleImages/Buffer_Interleaved_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Buffer_Interleaved_02.gltf",
        "sampleImageName": "Figures/SampleImages/Buffer_Interleaved_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Buffer_Interleaved_03.gltf",
        "sampleImageName": "Figures/SampleImages/Buffer_Interleaved_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Buffer_Interleaved_04.gltf",
        "sampleImageName": "Figures/SampleImages/Buffer_Interleaved_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Compatibility",
    "id": 5,
    "models": [
      {
        "fileName": "Compatibility_00.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Compatibility_01.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Compatibility_02.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Compatibility_03.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Compatibility_04.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Compatibility_05.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Compatibility_06.gltf",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material",
    "id": 6,
    "models": [
      {
        "fileName": "Material_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_03.gltf",
        "sampleImageName": "Figures/SampleImages/Material_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_04.gltf",
        "sampleImageName": "Figures/SampleImages/Material_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_05.gltf",
        "sampleImageName": "Figures/SampleImages/Material_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_06.gltf",
        "sampleImageName": "Figures/SampleImages/Material_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_07.gltf",
        "sampleImageName": "Figures/SampleImages/Material_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material_AlphaBlend",
    "id": 7,
    "models": [
      {
        "fileName": "Material_AlphaBlend_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaBlend_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaBlend_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaBlend_03.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaBlend_04.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaBlend_05.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaBlend_06.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaBlend_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material_AlphaMask",
    "id": 8,
    "models": [
      {
        "fileName": "Material_AlphaMask_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaMask_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaMask_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaMask_03.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaMask_04.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaMask_05.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_AlphaMask_06.gltf",
        "sampleImageName": "Figures/SampleImages/Material_AlphaMask_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material_DoubleSided",
    "id": 9,
    "models": [
      {
        "fileName": "Material_DoubleSided_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_DoubleSided_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_DoubleSided_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_DoubleSided_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_DoubleSided_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_DoubleSided_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_DoubleSided_03.gltf",
        "sampleImageName": "Figures/SampleImages/Material_DoubleSided_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material_MetallicRoughness",
    "id": 10,
    "models": [
      {
        "fileName": "Material_MetallicRoughness_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_03.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_04.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_05.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_06.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_07.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_08.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_08.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_09.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_09.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_10.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_10.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_MetallicRoughness_11.gltf",
        "sampleImageName": "Figures/SampleImages/Material_MetallicRoughness_11.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material_Mixed",
    "id": 11,
    "models": [
      {
        "fileName": "Material_Mixed_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_Mixed_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_Mixed_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_Mixed_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_Mixed_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_Mixed_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Material_SpecularGlossiness",
    "id": 12,
    "models": [
      {
        "fileName": "Material_SpecularGlossiness_00.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_01.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_02.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_03.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_04.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_05.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_06.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_07.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_08.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_08.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_09.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_09.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_10.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_10.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_11.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_11.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_12.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_12.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Material_SpecularGlossiness_13.gltf",
        "sampleImageName": "Figures/SampleImages/Material_SpecularGlossiness_13.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Mesh_PrimitiveAttribute",
    "id": 13,
    "models": [
      {
        "fileName": "Mesh_PrimitiveAttribute_00.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveAttribute_01.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveAttribute_02.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveAttribute_03.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveAttribute_04.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveAttribute_05.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveAttribute_06.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveAttribute_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Mesh_PrimitiveMode",
    "id": 14,
    "models": [
      {
        "fileName": "Mesh_PrimitiveMode_00.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_01.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_02.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_03.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_04.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_05.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_06.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_07.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_08.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_08.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_09.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_09.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_10.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_10.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_11.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_11.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_12.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_12.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_13.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_13.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_14.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_14.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveMode_15.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveMode_15.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Mesh_PrimitiveRestart",
    "id": 15,
    "models": [
      {
        "fileName": "Mesh_PrimitiveRestart_00.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_01.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_02.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_03.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_04.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_05.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_06.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_07.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_08.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_09.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_10.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_11.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_12.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveRestart_13.gltf",
        "valid": false,
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Mesh_PrimitiveVertexColor",
    "id": 16,
    "models": [
      {
        "fileName": "Mesh_PrimitiveVertexColor_00.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveVertexColor_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveVertexColor_01.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveVertexColor_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveVertexColor_02.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveVertexColor_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveVertexColor_03.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveVertexColor_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveVertexColor_04.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveVertexColor_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitiveVertexColor_05.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitiveVertexColor_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Mesh_Primitives",
    "id": 17,
    "models": [
      {
        "fileName": "Mesh_Primitives_00.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_Primitives_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Mesh_PrimitivesUV",
    "id": 18,
    "models": [
      {
        "fileName": "Mesh_PrimitivesUV_00.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_01.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_02.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_03.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_04.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_05.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_06.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_07.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Mesh_PrimitivesUV_08.gltf",
        "sampleImageName": "Figures/SampleImages/Mesh_PrimitivesUV_08.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  },
  {
    "folder": "Node_Attribute",
    "id": 19,
    "models": [
      {
        "fileName": "Node_Attribute_00.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_00.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_01.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_01.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_02.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_02.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_03.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_03.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_04.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_04.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_05.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_05.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_06.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_06.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_07.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_07.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_Attribute_08.gltf",
        "sampleImageName": "Figures/SampleImages/Node_Attribute_08.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      }
    ]
  },
  {
    "folder": "Node_NegativeScale",
    "id": 20,
    "models": [
      {
        "fileName": "Node_NegativeScale_00.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_00.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_01.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_01.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_02.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_02.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_03.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_03.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_04.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_04.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_05.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_05.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_06.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_06.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_07.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_07.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_08.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_08.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_09.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_09.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_10.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_10.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_11.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_11.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      },
      {
        "fileName": "Node_NegativeScale_12.gltf",
        "sampleImageName": "Figures/SampleImages/Node_NegativeScale_12.png",
        "camera": {
          "translation": [
            0.0,
            20.0,
            -20.0
          ]
        }
      }
    ]
  },
  {
    "folder": "Texture_Sampler",
    "id": 21,
    "models": [
      {
        "fileName": "Texture_Sampler_00.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_00.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_01.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_01.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_02.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_02.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_03.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_03.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_04.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_04.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_05.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_05.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_06.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_06.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_07.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_07.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_08.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_08.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_09.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_09.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_10.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_10.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_11.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_11.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_12.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_12.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      },
      {
        "fileName": "Texture_Sampler_13.gltf",
        "sampleImageName": "Figures/SampleImages/Texture_Sampler_13.png",
        "camera": {
          "translation": [
            0.0,
            0.0,
            1.3
          ]
        }
      }
    ]
  }
]`;

function CreateInputHandling(scene) {
    var inputManager = new InputManager();
    var priorX = inputManager.pointerX;
    var priorY = inputManager.pointerY;
    var x = 0;
    var y = 0;
    scene.onBeforeRenderObservable.add(function () {
        x = inputManager.pointerX;
        y = inputManager.pointerY;

        if (inputManager.isPointerDown) {
            scene.activeCamera.alpha += 0.01 * (priorX - x);
            scene.activeCamera.beta += 0.01 * (priorY - y);
        }

        priorX = x;
        priorY = y;
    });
};

var currentMesh;

function loadItem(idx, urls, scene) {
    if (scene.isDisposed) {
        return;
    }

    BABYLON.SceneLoader.ImportMeshAsync("", urls[idx]).then(function (result) {
        if (currentMesh) {
            currentMesh.dispose(false, true);
        }

        currentMesh = result.meshes[0];

        scene.createDefaultCamera(true, true, true);
        scene.activeCamera.alpha += Math.PI;

        if (idx < urls.length - 1) {
            setTimeout(function () {
                loadItem(idx + 1, urls, scene);
            }, 2000);
        }
    });
};

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    CreateInputHandling(scene);
    scene.createDefaultCamera(true, true, false);
    scene.createDefaultLight(true);

    setTimeout(function () {
        // TODO: Do this through an actual XMLHttpRequest once we have proper JSON support in.
        var urls = [];
        JSON.parse(manifestString).forEach(function (folder) {
            if (typeof desiredFolder === "undefined" || desiredFolder === folder.folder) {
                folder.models.forEach(function (model) {
                    var url = baseUrl + folder.folder + "/" + model.fileName;
                    urls.push(url);
                });
            }
        });

        loadItem(0, urls, scene);

    }, 1000);

    return scene;
};