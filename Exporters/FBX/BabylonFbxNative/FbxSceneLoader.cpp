#include "stdafx.h"
#include "FbxSceneLoader.h"
#include "FbxLoadException.h"
#include <vector>


void MapNodes(std::map<std::uint64_t, BabylonNode*> map, BabylonNode* node){
	map[node->uniqueId()] = node;
	for (auto& child : node->children()){
		MapNodes(map, &child);
	}
}

FbxSceneLoader::FbxSceneLoader(const std::string& filePath) :_scene(nullptr), _filePath(filePath), _fbxMgr(FbxManager::Create())
{
	std::unique_ptr<FbxIOSettings, FbxDeleter> iosettings(FbxIOSettings::Create(_fbxMgr.get(), IOSROOT));

	iosettings->SetBoolProp(IMP_FBX_MATERIAL, true);
	iosettings->SetBoolProp(IMP_FBX_TEXTURE, true);
	iosettings->SetBoolProp(IMP_FBX_LINK, true);
	iosettings->SetBoolProp(IMP_FBX_SHAPE, true);
	iosettings->SetBoolProp(IMP_FBX_GOBO, true);
	iosettings->SetBoolProp(IMP_FBX_ANIMATION, true);
	iosettings->SetBoolProp(IMP_SKINS, true);
	iosettings->SetBoolProp(IMP_DEFORMATION, true);
	iosettings->SetBoolProp(IMP_FBX_GLOBAL_SETTINGS, true);
	iosettings->SetBoolProp(IMP_TAKE, true);
	_fbxMgr->SetIOSettings(iosettings.get());

	std::unique_ptr<FbxImporter, FbxDeleter> importer(FbxImporter::Create(_fbxMgr.get(), "SceneImporter"));
	if (!importer->Initialize(_filePath.c_str())){
		throw FbxLoadException(importer->GetStatus().GetErrorString());
	}
	_scene = FbxScene::Create(_fbxMgr.get(), filePath.c_str());
	importer->Import(_scene);

	
	
	_rootNode = std::make_unique<BabylonNode>(_scene->GetRootNode());
	MapNodes(_nodesMap, _rootNode.get());
}



FbxSceneLoader::~FbxSceneLoader()
{
	_scene->Destroy(true);
}


babylon_global_settings FbxSceneLoader::getGlobalSettings(){
	babylon_global_settings result;
	auto& settings = _scene->GetGlobalSettings();
	
	return result;
}