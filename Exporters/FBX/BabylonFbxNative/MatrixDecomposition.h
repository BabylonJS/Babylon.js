#pragma once
#include <fbxsdk.h>
#include "BabylonVertex.h"
class MatrixDecomposition
{
	babylon_vector3 _trans;
	babylon_vector4 _quat;
	babylon_vector3 _scaling;

	FbxVector4 _fbxtrans;
	FbxQuaternion _fbxrot;
	FbxVector4 _fbxshearing;
	FbxVector4 _fbxscaling;
public:
	const babylon_vector3& translation() { return _trans; }
	const babylon_vector4& rotationQuaternion() { return _quat; }
	const babylon_vector3& scaling() { return _scaling; }


	const FbxVector4& fbxtrans() { return _fbxtrans; };
	const FbxQuaternion& fbxrot() { return _fbxrot; };
	const FbxVector4& fbxshearing() { return _fbxshearing; };
	const FbxVector4& fbxscaling() { return _fbxscaling; };
	MatrixDecomposition(const FbxMatrix& mat){
		
		double sign;
		mat.GetElements(_fbxtrans, _fbxrot, _fbxshearing, _fbxscaling, sign);
		_trans = _fbxtrans;
		_quat = _fbxrot;
		_scaling = _fbxscaling;
	}
};

