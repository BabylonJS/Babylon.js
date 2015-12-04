#include "stdafx.h"
#include "BabylonNode.h"
#include "NodeHelpers.h"

BabylonNode::BabylonNode(FbxNode* fbxNode) : _node(fbxNode){
	auto childCount = fbxNode->GetChildCount();
	for (int i = 0; i < childCount; ++i){
		_children.emplace_back(fbxNode->GetChild(i));
	}
}

BabylonNode::BabylonNode(BabylonNode && moved) :
	 _node(moved._node),
	_children(std::move(moved._children))
{
}

BabylonNodeType BabylonNode::nodeType(){
	if (_node->GetMesh()){
		return BabylonNodeType::Mesh;
	}
	if (_node->GetCamera()){
		return BabylonNodeType::Camera;
	}
	if (_node->GetSkeleton()){
		return BabylonNodeType::Skeleton;
	}
	if (_node->GetLight()) {
		return BabylonNodeType::Light;
	}
	return BabylonNodeType::Empty;
}

bool BabylonNode::isEmptySkeletonOrEmptyMesh()
{
	auto type = nodeType();
	switch (type)
	{
	case BabylonNodeType::Mesh:
	{
		auto mesh = _node->GetMesh();
		if (mesh->GetPolygonCount() == 0) {
			return true;
		}
		else {
			return false;
		}
	}
	case BabylonNodeType::Skeleton:
	case BabylonNodeType::Empty:
		return true;
	default:
		return false;
	}
}

bool BabylonNode::isEmptySkeletonOrEmptyMeshRecursive()
{
	if (!isEmptySkeletonOrEmptyMesh()) {
		return false;
	}

	for (auto& c : children()) {
		if (!c.isEmptySkeletonOrEmptyMeshRecursive()) {
			return false;
		}
	}
	return true;
}
