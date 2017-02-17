// FbxRerouteSkeleton.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <fbxsdk.h>
#include <iostream>
#include <string>
#include <vector>
#include <Windows.h>
#include <map>
#include "FbxDeleter.h"
#include <memory>

std::string wstringToUtf8(const std::wstring& src){
	auto size = WideCharToMultiByte(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), nullptr, 0, nullptr, nullptr);
	std::string result;
	result.resize(size, ' ');
	WideCharToMultiByte(CP_UTF8, 0, src.c_str(), static_cast<int>(src.size()), &result[0], size, nullptr, nullptr);
	return result;
}

void populateNodeMap(std::map<std::string, FbxNode*>& m, FbxNode* currNode){
	if (currNode == nullptr){
		return;
	}
	m[currNode->GetName()] = currNode;
	auto mesh = currNode->GetMesh();
	if (mesh) {
		currNode->SetNodeAttribute(nullptr);
	}
	for (auto ix = 0; ix < currNode->GetChildCount(); ++ix){
		populateNodeMap(m, currNode->GetChild(ix));
	}
}

struct ScopedScene{
	FbxScene* scene = nullptr;
	ScopedScene(FbxManager* mgr) :scene(FbxScene::Create(mgr, "TempScene")){}
	~ScopedScene(){
		if (scene){
			scene->Destroy(true);
		}
	}
};

void DeepClone(FbxNode* n, FbxNode* container){
	auto cloned = n->Clone(FbxObject::ECloneType::eDeepClone, container);
	for (auto ix = 0; ix < n->GetChildCount(); ++ix){
		DeepClone(n->GetChild(ix), (FbxNode*) cloned);
	}
}

void importAdditionalFile(FbxScene* globalScene, FbxImporter* importer, const std::string& file){
	importer->Initialize(file.c_str());
	ScopedScene tempScene(globalScene->GetFbxManager());
	importer->Import(tempScene.scene);
	auto tempRootNode = tempScene.scene->GetRootNode();

	std::vector<FbxNode*> childrenToMove;
	int lNumChildren = tempRootNode->GetChildCount();
	for (int i = 0; i < lNumChildren; i++) {

		// Obtain a child node from the currently loaded scene.
		FbxNode* lChildNode = tempRootNode->GetChild(i);

		if (lChildNode){
			childrenToMove.push_back(lChildNode);
		}
	}
	for (auto item : childrenToMove){
		//DeepClone(item, globalScene->GetRootNode());
		globalScene->GetRootNode()->AddChild(item);
	}

	// Remove the children from the root node.
	tempScene.scene->GetRootNode()->DisconnectAllSrcObject();


	std::vector<FbxObject* > objsToMove;
	// Move other objects to the reference scene.
	int lNumSceneObjects = tempScene.scene->GetSrcObjectCount();
	for (int i = 0; i < lNumSceneObjects; i++) {
		FbxObject* lObj = tempScene.scene->GetSrcObject(i);
		auto isAnimStack = lObj->GetClassId() == FbxAnimStack::ClassId;
		if (lObj == tempScene.scene->GetRootNode() || *lObj == tempScene.scene->GetGlobalSettings() || isAnimStack){
			// Don't move the root node or the scene's global settings; these
			// objects are created for every scene.
			continue;
		}

		objsToMove.push_back(lObj);
	}

	for (auto obj : objsToMove){
		obj->ConnectDstObject(globalScene);
	}

	tempScene.scene->DisconnectAllSrcObject();
}

void patchSkins(FbxNode* currentRoot, const std::map<std::string, FbxNode*>& animatedNodes, const std::string& prefix){
	auto mesh = currentRoot->GetMesh();
	if (mesh){
		auto skinCount = mesh->GetDeformerCount(FbxDeformer::EDeformerType::eSkin);
		for (auto ix = 0; ix < skinCount; ++ix){
			auto skin = (FbxSkin*) mesh->GetDeformer(ix, FbxDeformer::EDeformerType::eSkin);
			if (skin){
				std::vector<FbxCluster*> replacements;
				auto clusterCount = skin->GetClusterCount();
				for (auto clusterIx = 0; clusterIx < clusterCount; ++clusterIx){
					auto cluster = skin->GetCluster(clusterIx);
					if (cluster){
						auto linkNode = cluster->GetLink();
						if (linkNode){
							auto candidateName = prefix;
							candidateName.append(linkNode->GetName());
							auto found = animatedNodes.find(candidateName);
							if (found != animatedNodes.end()){
								FbxCluster* newCluster = FbxCluster::Create(currentRoot->GetScene(), "");
								newCluster->SetLink(found->second);
								newCluster->SetLinkMode(cluster->GetLinkMode());
								FbxAMatrix mat;
								newCluster->SetTransformAssociateModelMatrix(cluster->GetTransformAssociateModelMatrix(mat));
								newCluster->SetAssociateModel(cluster->GetAssociateModel());
								newCluster->SetTransformLinkMatrix(cluster->GetTransformLinkMatrix(mat));
								newCluster->SetTransformMatrix(cluster->GetTransformMatrix(mat));
								newCluster->SetTransformParentMatrix(cluster->GetTransformParentMatrix(mat));

								auto indicesAndWeightsCount = cluster->GetControlPointIndicesCount();
								for (auto ix = 0; ix < indicesAndWeightsCount; ++ix){
									newCluster->AddControlPointIndex(cluster->GetControlPointIndices()[ix], cluster->GetControlPointWeights()[ix]);

								}


								replacements.push_back(newCluster);
							}
						}
					}
				}
				if (replacements.size() == clusterCount){
					while (skin->GetClusterCount()>0){
						auto oldCluster = skin->GetCluster(skin->GetClusterCount() - 1);
						skin->RemoveCluster(oldCluster);
						oldCluster->Destroy();
					}
					for (auto c : replacements){
						skin->AddCluster(c);
					}
				}
				else{
					for (auto c : replacements){
						c->Destroy();
					}
				}
			}
		}
	}

	for (auto ix = 0; ix < currentRoot->GetChildCount(); ++ix){
		patchSkins(currentRoot->GetChild(ix), animatedNodes, prefix);
	}
}

int _tmain(int argc, _TCHAR* argv [])
{
	std::cout << "usage : FbxRerouteSkeleton.exe /m:<origin mesh and skeleton data.fbx> /m:<other origin mesh and skeleton data.fbx> /a:<animated skeleton.fbx> /o:<output fbx> [/prefix:<prefix added to each bone in animated skeleton.fbx>]" << std::endl;
	std::vector<std::string> meshFiles;
	std::string skeletonFile;
	std::string outputPath;
	std::string prefix;
	for (auto ix = 1; ix < argc; ++ix){
		std::wstring warg = argv[ix];
		if (warg.find(L"/m:") == 0){
			meshFiles.push_back(wstringToUtf8(warg.substr(3)));
		}
		else if (warg.find(L"/a:") == 0)
		{
			if (skeletonFile.size()>0){

				std::wcout << L"only one animated skeleton file is allowed" << std::endl;
				return -2;
			}
			skeletonFile = wstringToUtf8(warg.substr(3));
		}
		else if (warg.find(L"/o:") == 0){
			if (outputPath.size() > 0){

				std::wcout << L"only one output file is allowed" << std::endl;
				return -3;
			}

			CloseHandle(CreateFile(warg.substr(3).c_str(), GENERIC_READ | GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS, 0, nullptr));
			outputPath = wstringToUtf8(warg.substr(3));
		}
		else if (warg.find(L"/prefix:") == 0){
			if (prefix.size() > 0){

				std::wcout << L"only one prefix is allowed" << std::endl;
				return -4;
			}
			prefix = wstringToUtf8(warg.substr(8));
		}
		else{
			std::wcout << L"unrecognized parameter " << warg << std::endl;
			return -1;
		}
	}
	if (meshFiles.size() == 0){

		std::wcout << L"no origin mesh file" << std::endl;
		return -5;
	}
	if (skeletonFile.size() == 0){

		std::wcout << L"skeleton file unspecified" << std::endl;
		return -6;
	}
	if (outputPath.size() == 0){

		std::wcout << L"output file unspecified" << std::endl;
		return -7;
	}

	auto fbxManager = std::unique_ptr<FbxManager, FbxManagerDeleter>( FbxManager::Create());
	auto iosettings = std::unique_ptr<FbxIOSettings, FbxDeleter>(FbxIOSettings::Create(fbxManager.get(), IOSROOT));

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


	iosettings->SetBoolProp(EXP_FBX_MATERIAL, true);
	iosettings->SetBoolProp(EXP_FBX_TEXTURE, true);
	iosettings->SetBoolProp(EXP_MESHPOLY, true);
	iosettings->SetBoolProp(EXP_FBX_SHAPE, true);
	iosettings->SetBoolProp(EXP_FBX_GOBO, true);
	iosettings->SetBoolProp(EXP_FBX_ANIMATION, true);
	iosettings->SetBoolProp(EXP_SKINS, true);
	iosettings->SetBoolProp(EXP_DEFORMATION, true);
	iosettings->SetBoolProp(EXP_FBX_GLOBAL_SETTINGS, true);
	iosettings->SetBoolProp(EXP_MESHTRIANGLE, true);
	iosettings->SetBoolProp(EXP_EMBEDTEXTURE, true);
	fbxManager->SetIOSettings(iosettings.get());

	auto importer = std::unique_ptr<FbxImporter, FbxDeleter> (FbxImporter::Create(fbxManager.get(), "SceneImporter"));
	importer->Initialize(skeletonFile.c_str(), -1, iosettings.get());
	auto globalScene = std::unique_ptr<FbxScene, FbxDeleter>(FbxScene::Create(fbxManager.get(), "merged scene"));
	importer->Import(globalScene.get());

	std::map<std::string, FbxNode*> animatedSkeletonNodesMap;
	populateNodeMap(animatedSkeletonNodesMap, globalScene->GetRootNode());

	for (auto& f : meshFiles){
		importAdditionalFile(globalScene.get(), importer.get(), f);
	}

	patchSkins(globalScene->GetRootNode(), animatedSkeletonNodesMap, prefix);

	auto exporter = std::unique_ptr<FbxExporter, FbxDeleter>(FbxExporter::Create(fbxManager.get(), "SceneExporter"));
	auto res = exporter->Initialize(outputPath.c_str(), -1, iosettings.get());
	res = exporter->Export(globalScene.get());
	auto status = exporter->GetStatus();

	return 0;
}

