// FbxTests.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include "..\BabylonFbxNative\FbxSceneLoader.h"
#include "..\BabylonFbxNative\FbxMeshLoader.h"
#include "..\BabylonFbxNative\Export.h"


int _tmain(int argc, _TCHAR* argv[])
{
	std::vector<babylon_mesh<babylon_vertex_normal_uv_color>> meshes;
	
	FbxSceneLoader sceneLoader("C:\\ws\\babylon\\BabylonExport\\Test scenes\\Dude\\dude.fbx");
	auto camera = sceneLoader.GetDefaultCamera();
	auto spaceshipSettings = sceneLoader.getGlobalSettings();
	FbxMaterialStore materials(L"C:\\ws\\babylon\\BabylonExport\\Test scenes\\Dude", L".", TextureFormat::Dds);
	for (int i = 0; i < sceneLoader.getMeshCount(); ++i){
		meshes.push_back(loadStaticMesh<babylon_vertex_normal_uv_color>(sceneLoader.getFbxMesh(i), sceneLoader.getScene(), materials));
	}
	auto json = exportScene(spaceshipSettings, materials.buildMaterialVector(), meshes);
	auto text = json.serialize();
	return 0;
}

