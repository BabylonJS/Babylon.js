#pragma once
#include <fbxsdk.h>
#include <memory>
#include <vector>
#include <map>
#include <string>
#include "BabylonSkeleton.h"

struct BoneAnimKeyFrame{
	int frame;
	FbxMatrix matrixLocal;
	FbxMatrix matrixGlobal;
};
struct BoneInfo{
	FbxNode*  linkNode;
	FbxCluster* cluster;
	int FbxClusterIndex;
	int parentBoneIndex;
	std::wstring name;

	FbxMatrix matrixGlobalBindPose;
	FbxMatrix matrixLocalBindPose;
	std::vector<BoneAnimKeyFrame> keyFrames;
};

struct BoneIndexAndWeight{
	int index;
	double weight;
};

class SkinInfo
{
private:
	FbxNode* _node;
	FbxMesh* _mesh;
	FbxSkin* _skin;
	std::vector<BoneInfo> _bones;
	std::map<int, int> _fbxClusterIndexToBoneIndex;
	std::map<int, std::vector<BoneIndexAndWeight>> _controlPointToBoneIndicesAndWeights;
	
public:
	SkinInfo(FbxNode* meshNode);

	bool hasSkin() const{
		return _skin != nullptr;
	}
	const std::vector<BoneIndexAndWeight>& controlPointBoneIndicesAndWeights(int cpIndex)const {
		return _controlPointToBoneIndicesAndWeights.find(cpIndex)->second;
	}

	int bonesCount() const{
		return static_cast<int>( _bones.size());
	}

	void buildBabylonSkeleton(BabylonSkeleton& skel);
};

