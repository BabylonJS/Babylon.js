#pragma once
#include <string>
#include <cpprest\json.h>
#include "BabylonVertex.h"
#include "BabylonNode.h"

// base class for meshes and mesh instances (instances not implemented yet)
class BabylonAbstractMesh
{
private:
	std::wstring _name;
	babylon_vector3 _position;
	babylon_vector4 _rotationQuaternion;
	babylon_vector3 _scaling;
public:
	const std::wstring& name() const{
		return _name;
	}
	void name(const std::wstring& value){
		_name = value;
	}
	babylon_vector3 position() const{
		return _position;
	}
	void position(babylon_vector3 value){
		_position = value;
	}
	babylon_vector4 rotationQuaternion() const{
		return _rotationQuaternion;
	}
	void rotationQuaternion(babylon_vector4 value){
		_rotationQuaternion = value;
	}
	babylon_vector3 scaling() const{
		return _scaling;
	}
	void scaling(babylon_vector3 value){
		_scaling = value;
	}
	BabylonAbstractMesh();

	BabylonAbstractMesh(BabylonNode* node);
	BabylonAbstractMesh(const BabylonAbstractMesh& ) = default;

	virtual web::json::value toJson() ;
	virtual ~BabylonAbstractMesh();
};

