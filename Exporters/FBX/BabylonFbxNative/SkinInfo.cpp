#include "stdafx.h"
#include <iostream>
#include "SkinInfo.h"
#include "NodeHelpers.h"
#include "GlobalSettings.h"

void ComputeBoneHierarchy(const std::vector<FbxNode*>& unsortedFlatListOfNodes,
	const std::vector<FbxCluster*>& unsortedFlatListOfClusters,
	std::vector<BoneInfo>& output, std::map<int, int>& clusterIndexToBoneIndex, std::map<int, std::vector<BoneIndexAndWeight>>& controlPointsData, FbxNode* currentRoot = nullptr, int currentRootIndex = -1){
	for (auto ix = 0u; ix < unsortedFlatListOfNodes.size(); ++ix){
		auto node = unsortedFlatListOfNodes[ix];
		auto nodeParent = node->GetParent();
		if (currentRoot == nullptr){
			// node is a match if its parent is not in the flat list
			auto foundParent = std::find(unsortedFlatListOfNodes.begin(), unsortedFlatListOfNodes.end(), nodeParent);
			if (foundParent != unsortedFlatListOfNodes.end()){
				continue;
			}
		}
		else{
			// node is a match if its parent is current root
			if (currentRoot != nodeParent){
				continue;
			}
		}

		// create boneInfo
		BoneInfo info;
		info.cluster = unsortedFlatListOfClusters[ix];
		info.FbxClusterIndex = ix;
		info.linkNode = unsortedFlatListOfNodes[ix];
		info.parentBoneIndex = currentRootIndex;
		info.name = getNodeId(node);
		auto boneIndex = static_cast<int>(output.size());
		output.push_back(info);
		clusterIndexToBoneIndex[ix] = boneIndex;

		auto controlledPointsCount = info.cluster->GetControlPointIndicesCount();
		for (auto cpIndex = 0; cpIndex < controlledPointsCount; ++cpIndex){
			auto controlPoint = info.cluster->GetControlPointIndices()[cpIndex];
			auto weight = info.cluster->GetControlPointWeights()[cpIndex];
			BoneIndexAndWeight biw;
			biw.index = boneIndex;
			biw.weight = weight;
			controlPointsData[controlPoint].push_back(biw);
		}
		// recursively parse children
		ComputeBoneHierarchy(unsortedFlatListOfNodes, unsortedFlatListOfClusters, output, clusterIndexToBoneIndex, controlPointsData, node, static_cast<int>(boneIndex));
	}
}
FbxAMatrix NotDecomposedMultiply(const FbxAMatrix& lhs, const FbxAMatrix& rhs){
	FbxMatrix matL(lhs);
	FbxMatrix matR(rhs);
	auto result = matL*matR;
	return *(FbxAMatrix*) (double*) &result;
}
//FbxAMatrix ComputeTotalMatrix(FbxNode* node, FbxTime time = FBXSDK_TIME_INFINITE){
//
//}
SkinInfo::SkinInfo(FbxNode* meshNode) :
_node(meshNode), _mesh(meshNode->GetMesh()), _skin(nullptr)
{
	int deformerCount = _mesh->GetDeformerCount();
	for (auto ix = 0; ix < deformerCount; ++ix){
		auto skin = reinterpret_cast<FbxSkin*>(_mesh->GetDeformer(ix, FbxDeformer::eSkin));
		if (skin){
			_skin = skin;
			break;
		}
	}
	if (!_skin){
		return;
	}

	std::vector<FbxPose*> bindPoses;
	auto poseCount = _node->GetScene()->GetPoseCount();
	for (auto ix = 0; ix < poseCount; ++ix){
		auto pose = _node->GetScene()->GetPose(ix);
		if (pose->IsBindPose()){
			bindPoses.push_back(pose);
		}
	}

	std::vector<FbxNode*> unsortedFlatListOfNodes;
	std::vector<FbxCluster*> unsortedFlatListOfClusters;
	auto clusterCount = _skin->GetClusterCount();
	for (auto ix = 0; ix < clusterCount; ++ix){
		auto cluster = _skin->GetCluster(ix);
		if (!cluster)
		{
			std::cout << "Invalid skin" << std::endl;
			_skin = nullptr;
			return;
		}
		auto linkNode = cluster->GetLink();
		if (!linkNode){
			std::cout << "Invalid skin" << std::endl;
			_skin = nullptr;
			return;
		}
		unsortedFlatListOfClusters.push_back(cluster);
		unsortedFlatListOfNodes.push_back(linkNode);
	}

	ComputeBoneHierarchy(unsortedFlatListOfNodes, unsortedFlatListOfClusters, _bones, _fbxClusterIndexToBoneIndex, _controlPointToBoneIndicesAndWeights);
	auto deformType = _skin->GetDeformerType();

	auto geometryTransform = GetGeometryTransformation(meshNode);
	// compute all bones global inverse and global matrix
	for (auto& bone : _bones){
		FbxAMatrix transformMatrix;
		FbxAMatrix transformLinkMatrix;
		FbxMatrix globalBindposeInverseMatrix;

		bone.cluster->GetTransformMatrix(transformMatrix);	// The transformation of the mesh at binding time
		bone.cluster->GetTransformLinkMatrix(transformLinkMatrix);	// The transformation of the cluster(joint) at binding time from joint space to world space
		/*for (auto pose : bindPoses){
			auto inPoseIndex = pose->Find(bone.linkNode);
			if (inPoseIndex >= 0){
				auto tempMat = pose->GetMatrix(inPoseIndex);
				transformLinkMatrix = *(FbxAMatrix*) (double*) &tempMat;
				break;
			}
		}*/
		globalBindposeInverseMatrix = FbxMatrix(transformLinkMatrix.Inverse()) * FbxMatrix(transformMatrix) * geometryTransform;


		bone.matrixGlobalBindPose = ConvertToBabylonCoordinateSystem(globalBindposeInverseMatrix.Inverse());
	

		if (bone.parentBoneIndex == -1){
			bone.matrixLocalBindPose = bone.matrixGlobalBindPose;
		}
		else{
			bone.matrixLocalBindPose =
				_bones[bone.parentBoneIndex].matrixGlobalBindPose.Inverse()* bone.matrixGlobalBindPose;
			
		}
	}


	// compute anim
	auto animStack = _node->GetScene()->GetCurrentAnimationStack();
	FbxString animStackName = animStack->GetName();
	//FbxTakeInfo* takeInfo = node->GetScene()->GetTakeInfo(animStackName);
	auto animTimeMode = GlobalSettings::Current().AnimationsTimeMode;
	auto animFrameRate = GlobalSettings::Current().AnimationsFrameRate();
	auto startFrame = animStack->GetLocalTimeSpan().GetStart().GetFrameCount(animTimeMode);
	auto endFrame = animStack->GetLocalTimeSpan().GetStop().GetFrameCount(animTimeMode);
	auto animLengthInFrame = endFrame - startFrame + 1;


	for (auto ix = 0; ix < animLengthInFrame; ix++){
		FbxTime currTime;
		currTime.SetFrame(startFrame + ix, animTimeMode);


		auto currTransformOffset = FbxMatrix(meshNode->EvaluateGlobalTransform(currTime)) * geometryTransform;
		auto currTransformOffsetInverse = currTransformOffset.Inverse();

		// compute global transform and local
		for (auto& bone : _bones){
			BoneAnimKeyFrame kf;
			kf.frame = ix;
			kf.matrixGlobal = ConvertToBabylonCoordinateSystem(currTransformOffsetInverse*bone.linkNode->EvaluateGlobalTransform(currTime));
			


			if (bone.parentBoneIndex == -1){
				kf.matrixLocal = kf.matrixGlobal;
			}
			else{
				auto& parentBone = _bones[bone.parentBoneIndex];
				
				kf.matrixLocal = //bone.matrixLocalBindPose;
					parentBone.keyFrames[parentBone.keyFrames.size() - 1].matrixGlobal.Inverse()* kf.matrixGlobal;

			}


			bone.keyFrames.push_back(kf);
		}

	}
}


void SkinInfo::buildBabylonSkeleton(BabylonSkeleton& skel){
	if (!hasSkin()){
		return;
	}
	skel.name = getNodeId(_node) + L"_skeleton";
	for (auto& b : _bones){
		BabylonBone babbone;
		babbone.index = static_cast<int>(skel.bones.size());
		//babbone.matrix = ConvertToBabylonCoordinateSystem( b.matrixLocalBindPose);
		babbone.matrix = b.matrixLocalBindPose;
		babbone.name = b.name;
		babbone.parentBoneIndex = b.parentBoneIndex;

		auto animStack = _node->GetScene()->GetCurrentAnimationStack();
		FbxString animStackName = animStack->GetName();
		//FbxTakeInfo* takeInfo = node->GetScene()->GetTakeInfo(animStackName);
		auto animTimeMode = GlobalSettings::Current().AnimationsTimeMode;
		auto animFrameRate = GlobalSettings::Current().AnimationsFrameRate();
		auto startFrame = animStack->GetLocalTimeSpan().GetStart().GetFrameCount(animTimeMode);
		auto endFrame = animStack->GetLocalTimeSpan().GetStop().GetFrameCount(animTimeMode);
		auto animLengthInFrame = endFrame - startFrame + 1;

		auto matrixAnim = std::make_shared<BabylonAnimation<FbxMatrix>>(BabylonAnimationBase::loopBehavior_Cycle, static_cast<int>(animFrameRate), L"_matrix", L"_matrix", true, 0, static_cast<int>(animLengthInFrame), true);
		for (auto& kf : b.keyFrames){

			babylon_animation_key<FbxMatrix> key;
			key.frame = kf.frame;
			//key.values = ConvertToBabylonCoordinateSystem(kf.matrixLocal);
			key.values = kf.matrixLocal;
			matrixAnim->appendKey(key);
		}

		babbone.animation = matrixAnim;


		skel.bones.push_back(babbone);
	}
}


