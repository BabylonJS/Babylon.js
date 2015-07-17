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
	BoneInfo(const BoneInfo&) = default;
	BoneInfo(BoneInfo&& moved) :
		linkNode(std::move(moved.linkNode)),
		cluster(std::move(moved.cluster)),
		FbxClusterIndex(std::move(moved.FbxClusterIndex)),
		parentBoneIndex(std::move(moved.parentBoneIndex)),
		name(std::move(moved.name)),
		matrixGlobalBindPose(std::move(moved.matrixGlobalBindPose)),
		matrixLocalBindPose(std::move(moved.matrixLocalBindPose)),
		keyFrames(std::move(moved.keyFrames))
	{
	}
	BoneInfo() = default;
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

	SkinInfo(const SkinInfo&) = default;
	SkinInfo(SkinInfo&& moved) : 
		_node(std::move(moved._node)),
		_mesh(std::move(moved._mesh)),
		_skin(std::move(moved._skin)),
		_bones(std::move(moved._bones)),
		_fbxClusterIndexToBoneIndex(std::move(moved._fbxClusterIndexToBoneIndex)),
		_controlPointToBoneIndicesAndWeights(std::move(moved._controlPointToBoneIndicesAndWeights))
	{}
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

