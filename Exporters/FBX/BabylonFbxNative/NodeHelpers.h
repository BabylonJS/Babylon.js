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

inline FbxAMatrix GetGeometryTransformation(FbxNode* inNode)
{
	if (!inNode)
	{
		throw std::exception("Null for mesh geometry");
	}

	const FbxVector4 lT = inNode->GetGeometricTranslation(FbxNode::eSourcePivot);
	const FbxVector4 lR = inNode->GetGeometricRotation(FbxNode::eSourcePivot);
	const FbxVector4 lS = inNode->GetGeometricScaling(FbxNode::eSourcePivot);

	return FbxAMatrix(lT, lR, lS);
}

inline FbxAMatrix ConvertToBabylonCoordinateSystem(const FbxAMatrix& origin){
	FbxAMatrix input = origin;
	FbxVector4 translation = input.GetT();
	auto rotationQ = input.GetQ();
	translation.Set(translation.mData[0], translation.mData[1], -translation.mData[2]); // This negate Z of Translation Component of the matrix
	rotationQ[0] = -rotationQ[0];
	rotationQ[1] = -rotationQ[1];
	//rotationQ[2] = -rotationQ[2];
	//rotation.Set(-rotation.mData[0], -rotation.mData[1], rotation.mData[2]); // This negate X,Y of Rotation Component of the matrix
	// These 2 lines finally set "input" to the eventual converted result
	input.SetT(translation);
	input.SetQ(rotationQ);
	return input;
}

inline FbxAMatrix CalculateGlobalTransform(FbxNode* pNode, const FbxTime& time = FBXSDK_TIME_INFINITE)
{
	FbxAMatrix lTranlationM, lScalingM, lScalingPivotM, lScalingOffsetM, lRotationOffsetM, lRotationPivotM, \
		lPreRotationM, lRotationM, lPostRotationM, lTransform;

	FbxAMatrix lParentGX, lGlobalT, lGlobalRS;

	if (!pNode)
	{
		lTransform.SetIdentity();
		return lTransform;
	}

	// Construct translation matrix
	FbxVector4 lTranslation = pNode->LclTranslation.EvaluateValue(time);
	lTranlationM.SetT(lTranslation);

	// Construct rotation matrices
	FbxVector4 lRotation = pNode->LclRotation.EvaluateValue(time);
	FbxVector4 lPreRotation = pNode->PreRotation.EvaluateValue(time);
	FbxVector4 lPostRotation = pNode->PostRotation.EvaluateValue(time);
	lRotationM.SetR(lRotation);
	lPreRotationM.SetR(lPreRotation);
	lPostRotationM.SetR(lPostRotation);

	// Construct scaling matrix
	FbxVector4 lScaling = pNode->LclScaling.EvaluateValue(time);
	lScalingM.SetS(lScaling);

	// Construct offset and pivot matrices
	FbxVector4 lScalingOffset = pNode->ScalingOffset.EvaluateValue(time);
	FbxVector4 lScalingPivot = pNode->ScalingPivot.EvaluateValue(time);
	FbxVector4 lRotationOffset = pNode->RotationOffset.EvaluateValue(time);
	FbxVector4 lRotationPivot = pNode->RotationPivot.EvaluateValue(time);
	lScalingOffsetM.SetT(lScalingOffset);
	lScalingPivotM.SetT(lScalingPivot);
	lRotationOffsetM.SetT(lRotationOffset);
	lRotationPivotM.SetT(lRotationPivot);

	// Calculate the global transform matrix of the parent node
	FbxNode* lParentNode = pNode->GetParent();
	if (lParentNode)
	{
		lParentGX = CalculateGlobalTransform(lParentNode);
	}
	else
	{
		lParentGX.SetIdentity();
	}

	//Construct Global Rotation
	FbxAMatrix lLRM, lParentGRM;
	FbxVector4 lParentGR = lParentGX.GetR();
	lParentGRM.SetR(lParentGR);
	lLRM = lPreRotationM * lRotationM * lPostRotationM;

	//Construct Global Shear*Scaling
	//FBX SDK does not support shear, to patch this, we use:
	//Shear*Scaling = RotationMatrix.Inverse * TranslationMatrix.Inverse * WholeTranformMatrix
	FbxAMatrix lLSM, lParentGSM, lParentGRSM, lParentTM;
	FbxVector4 lParentGT = lParentGX.GetT();
	lParentTM.SetT(lParentGT);
	lParentGRSM = lParentTM.Inverse() * lParentGX;
	lParentGSM = lParentGRM.Inverse() * lParentGRSM;
	lLSM = lScalingM;

	//Do not consider translation now
	FbxTransform::EInheritType lInheritType = pNode->InheritType.EvaluateValue(time);
	if (lInheritType == FbxTransform::eInheritRrSs)
	{
		lGlobalRS = lParentGRM * lLRM * lParentGSM * lLSM;
	}
	else if (lInheritType == FbxTransform::eInheritRSrs)
	{
		lGlobalRS = lParentGRM * lParentGSM * lLRM * lLSM;
	}
	else if (lInheritType == FbxTransform::eInheritRrs)
	{
		FbxAMatrix lParentLSM;
		FbxVector4 lParentLS = lParentNode->LclScaling.EvaluateValue(time);
		lParentLSM.SetS(lParentLS);

		FbxAMatrix lParentGSM_noLocal = lParentGSM * lParentLSM.Inverse();
		lGlobalRS = lParentGRM * lLRM * lParentGSM_noLocal * lLSM;
	}
	else
	{
		FBXSDK_printf("error, unknown inherit type! \n");
	}

	// Construct translation matrix
	// Calculate the local transform matrix
	lTransform = lTranlationM * lRotationOffsetM * lRotationPivotM * lPreRotationM * lRotationM * lPostRotationM * lRotationPivotM.Inverse()\
		* lScalingOffsetM * lScalingPivotM * lScalingM * lScalingPivotM.Inverse();
	FbxVector4 lLocalTWithAllPivotAndOffsetInfo = lTransform.GetT();
	// Calculate global translation vector according to: 
	// GlobalTranslation = ParentGlobalTransform * LocalTranslationWithPivotAndOffsetInfo
	FbxVector4 lGlobalTranslation = lParentGX.MultT(lLocalTWithAllPivotAndOffsetInfo);
	lGlobalT.SetT(lGlobalTranslation);

	//Construct the whole global transform
	lTransform = lGlobalT * lGlobalRS;

	return lTransform;
}


inline FbxAMatrix CalculateLocalTransform(FbxNode* pNode, const FbxTime& time = FBXSDK_TIME_INFINITE)
{
	FbxAMatrix lTranlationM, lScalingM, lScalingPivotM, lScalingOffsetM, lRotationOffsetM, lRotationPivotM, \
		lPreRotationM, lRotationM, lPostRotationM, lTransform;


	if (!pNode)
	{
		lTransform.SetIdentity();
		return lTransform;
	}

	// Construct translation matrix
	FbxVector4 lTranslation = pNode->LclTranslation.EvaluateValue(time);
	lTranlationM.SetT(lTranslation);

	// Construct rotation matrices
	FbxVector4 lRotation = pNode->LclRotation.EvaluateValue(time);
	FbxVector4 lPreRotation = pNode->PreRotation.EvaluateValue(time);
	FbxVector4 lPostRotation = pNode->PostRotation.EvaluateValue(time);
	lRotationM.SetR(lRotation);
	lPreRotationM.SetR(lPreRotation);
	lPostRotationM.SetR(lPostRotation);

	// Construct scaling matrix
	FbxVector4 lScaling = pNode->LclScaling.EvaluateValue(time);
	lScalingM.SetS(lScaling);

	// Construct offset and pivot matrices
	FbxVector4 lScalingOffset = pNode->ScalingOffset.EvaluateValue(time);
	FbxVector4 lScalingPivot = pNode->ScalingPivot.EvaluateValue(time);
	FbxVector4 lRotationOffset = pNode->RotationOffset.EvaluateValue(time);
	FbxVector4 lRotationPivot = pNode->RotationPivot.EvaluateValue(time);
	lScalingOffsetM.SetT(lScalingOffset);
	lScalingPivotM.SetT(lScalingPivot);
	lRotationOffsetM.SetT(lRotationOffset);
	lRotationPivotM.SetT(lRotationPivot);

	
	

	// Construct translation matrix
	// Calculate the local transform matrix
	lTransform = lTranlationM * lRotationOffsetM * lRotationPivotM * lPreRotationM * lRotationM * lPostRotationM * lRotationPivotM.Inverse()\
		* lScalingOffsetM * lScalingPivotM * lScalingM * lScalingPivotM.Inverse();
	

	return lTransform;
}