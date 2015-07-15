#pragma once
#include <fbxsdk.h>
#include <vector>
#include <cstdint>
#include "NodeHelpers.h"
#include "BabylonVertex.h"
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
	FbxAMatrix _localTransform;
	FbxAMatrix _globalTransform;
	FbxNode* _node;
	std::vector<BabylonNode> _children;
public:
	BabylonNode() :_node(nullptr){}
	


	explicit BabylonNode(FbxNode* fbxNode);

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

	babylon_vector3 localScale(){
		auto ret = _localTransform.GetS();
		return ret;
	}
	babylon_vector4 localRotationQuat();
	babylon_vector3 localTranslate(){

		auto ret = _localTransform.GetT();
		return ret;
	}



	babylon_vector3 localScale(FbxTime time);
	babylon_vector4 localRotationQuat(FbxTime time);
	babylon_vector3 localTranslate(FbxTime time);

	FbxAMatrix localTransform(FbxTime time){
		return ConvertToBabylonCoordinateSystem(CalculateLocalTransform(_node, time));
	}

	const FbxAMatrix& localTransform() { return _localTransform; }
	const FbxAMatrix& globalTransform() { return _globalTransform; }
};