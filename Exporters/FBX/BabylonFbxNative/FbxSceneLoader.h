#pragma once
#include "FbxDeleter.h"
#include <fbxsdk.h>
#include <string>
#include <vector>
#include <memory>
#include "BabylonNode.h"
#include "BabylonVertex.h"
#include <map>

class FbxSceneLoader
{
private:
	std::string _filePath;
	std::unique_ptr<FbxManager, FbxManagerDeleter> _fbxMgr;
	FbxScene* _scene;
	std::unique_ptr<BabylonNode> _rootNode;
	std::map<std::uint64_t, BabylonNode*> _nodesMap;
public:
	FbxSceneLoader(const std::string& filePath);
	~FbxSceneLoader();
	FbxScene* getScene(){
		
		return _scene;
	}

	BabylonNode* rootNode() const{
		return _rootNode.get();
	}

	std::map<std::uint64_t, BabylonNode*>& getNodeMap(){
		return _nodesMap;
	}

	
	FbxScene* getScene() const{
		return _scene;
	}
	FbxCamera* GetDefaultCamera() const{
		const int nodeCount = _scene->GetSrcObjectCount<FbxNode>();

		for (int index = 0; index < nodeCount; index++)
		{
			auto node = _scene->GetSrcObject<FbxNode>(index);
			auto camera = node->GetCamera();
			if (!camera){
				// not a geometry node, go to next
				continue;
			}
			return camera;
			// ignore skinned meshes
			/*if (mesh->GetDeformerCount(FbxDeformer::eSkin) == 0){
			this->_meshes.push_back(mesh);
			}*/

		}
		return nullptr;
	}
	babylon_global_settings getGlobalSettings();
};

