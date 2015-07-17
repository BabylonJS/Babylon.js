#pragma once
#include <fbxsdk.h>
#include <vector>
#include <cstdint>
#include "NodeHelpers.h"
#include "BabylonVertex.h"
#include "MatrixDecomposition.h"
enum class BabylonNodeType{
	Camera,
	Mesh,
	Skeleton,
	Light,
	Empty
};
class BabylonNode;
class BabylonNode
{
private:
	FbxNode* _node;
	std::vector<BabylonNode> _children;
public:
	BabylonNode() :_node(nullptr){}
	


	explicit BabylonNode(FbxNode* fbxNode);
	BabylonNode(const BabylonNode&) = default;
	BabylonNode(BabylonNode&& moved);

	std::vector<BabylonNode>& children(){
		return _children;
	}
	BabylonNodeType nodeType();

	FbxNode* fbxNode(){ return _node; }
	
	bool isEmptySkeletonOrEmptyMesh();
	bool isEmptySkeletonOrEmptyMeshRecursive();
	void appendChild(FbxNode* fbxNode){
		_children.emplace_back(fbxNode);
	}

	std::uint64_t uniqueId()const{
		return _node->GetUniqueID();
	}

	std::string name() const{
		return std::string(_node->GetName());
	}

	bool hasOnlySkeletonDescendants(){
		if (nodeType() != BabylonNodeType::Skeleton){
			return false;
		}
		for (auto& child : _children){
			if (!child.hasOnlySkeletonDescendants()){
				return false;
			}
		}
		return true;
	}

	MatrixDecomposition GetLocal() {
		return MatrixDecomposition(ConvertToBabylonCoordinateSystem(_node->EvaluateLocalTransform()));
	}
	MatrixDecomposition GetLocal(const FbxTime& time) {
		return MatrixDecomposition(ConvertToBabylonCoordinateSystem(_node->EvaluateLocalTransform(time)));
	}

};