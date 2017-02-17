#pragma once
#include <string>
#include <sstream>
#include <fbxsdk.h>
#include <DirectXMath.h>

inline std::wstring getNodeId(FbxNode* node) {
	auto nId = node->GetUniqueID();
	std::wstringstream strstream;
	strstream << nId;
	auto name = node->GetName();
	if (name) {
		strstream << L"_" << name;
	}
	return strstream.str();
}

const double Euler2Rad = 3.141592653589793238462 / 180;

inline FbxMatrix GetGeometryTransformation(FbxNode* inNode)
{
	if (!inNode)
	{
		throw std::exception("Null for mesh geometry");
	}

	const FbxVector4 lT = inNode->GetGeometricTranslation(FbxNode::eSourcePivot);
	const FbxVector4 lR = inNode->GetGeometricRotation(FbxNode::eSourcePivot);
	const FbxVector4 lS = inNode->GetGeometricScaling(FbxNode::eSourcePivot);

	return FbxMatrix(lT, lR, lS);
}

inline FbxMatrix ConvertToBabylonCoordinateSystem(const FbxMatrix& origin){
	FbxVector4 trans;
	FbxQuaternion rot;
	FbxVector4 shearing;
	FbxVector4 scaling;
	double sign;
	origin.GetElements(trans, rot, shearing, scaling, sign);
	trans[2] = -trans[2]; // This negate Z of Translation Component of the matrix
	rot[0] = -rot[0];
	rot[1] = -rot[1];
	return FbxMatrix (trans, rot, scaling);
}
