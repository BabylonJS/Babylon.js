#include "stdafx.h"
#include "BabylonAbstractMesh.h"


BabylonAbstractMesh::BabylonAbstractMesh()
	:_position(0, 0, 0), _rotationQuaternion(0, 0, 0,0), _scaling(1,1,1)
{
}

BabylonAbstractMesh::BabylonAbstractMesh(BabylonNode* node)
	: _position(node->localTranslate()),
	_rotationQuaternion(node->localRotationQuat()),
	_scaling(node->localScale())
{
	auto n = node->name();
	_name = std::wstring(n.begin(), n.end());
}


web::json::value BabylonAbstractMesh::toJson() 
{
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(_name);
	writeVector3(jobj, L"position", position());
	writeVector4(jobj, L"rotationQuaternion", rotationQuaternion());
	writeVector3(jobj, L"scaling", scaling());
	return jobj;
}

BabylonAbstractMesh::~BabylonAbstractMesh()
{
}
