#include "BabylonNode.h"
#include "BabylonNode.h"
#include "stdafx.h"
#include "BabylonNode.h"
#include "NodeHelpers.h"

BabylonNode::BabylonNode(FbxNode* fbxNode) : _node(fbxNode){
	_localTransform = ConvertToBabylonCoordinateSystem(CalculateLocalTransform( fbxNode));
	_globalTransform = ConvertToBabylonCoordinateSystem(CalculateLocalTransform(fbxNode));
	auto childCount = fbxNode->GetChildCount();
	for (int i = 0; i < childCount; ++i){
		_children.emplace_back(fbxNode->GetChild(i));
	}
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

babylon_vector3 BabylonNode::localScale(FbxTime time){
	auto transform = ConvertToBabylonCoordinateSystem(CalculateLocalTransform(_node,time));
	return transform.GetS();

}

babylon_vector4 BabylonNode::localRotationQuat(){
	auto ret = _localTransform.GetQ();
	return babylon_vector4(ret[0], ret[1], ret[2], ret[3]);
}
babylon_vector4 BabylonNode::localRotationQuat(FbxTime time){

	auto transform = ConvertToBabylonCoordinateSystem(CalculateLocalTransform(_node, time));
	auto ret = transform.GetQ();
	return babylon_vector4(ret[0], ret[1], ret[2], ret[3]);
}
babylon_vector3 BabylonNode::localTranslate(FbxTime time){
	auto transform = ConvertToBabylonCoordinateSystem(CalculateLocalTransform(_node, time));
	return transform.GetT();

}