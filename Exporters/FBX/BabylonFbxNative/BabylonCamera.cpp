#include "stdafx.h"
#include "BabylonCamera.h"
#include "NodeHelpers.h"

web::json::value BabylonCamera::toJson() const
{
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"id"] = web::json::value::string(id);
	if(parentId.size()>0)
		jobj[L"parentId"] = web::json::value::string(parentId);
	if(lockedTargetId.size()>0)
		jobj[L"lockedTargetId"] = web::json::value::string(lockedTargetId);
	jobj[L"type"] = web::json::value::string(type);
	writeVector3(jobj, L"position", position);
	writeVector3(jobj, L"rotation", babylon_vector3(0,0,0));
	writeVector4(jobj, L"rotationQuaternion", rotationQuaternion);
	if(lockedTargetId.size()==0)
		writeVector3(jobj, L"target", target);

	jobj[L"fov"] = web::json::value::number(fov);
	jobj[L"minZ"] = web::json::value::number(minZ);
	jobj[L"maxZ"] = web::json::value::number(maxZ);
	jobj[L"speed"] = web::json::value::number(speed);
	jobj[L"inertia"] = web::json::value::number(inertia);
	jobj[L"checkCollisions"] = web::json::value::boolean(checkCollisions);
	jobj[L"applyGravity"] = web::json::value::boolean(applyGravity);
	writeVector2(jobj, L"ellipsoid", ellipsoid);
	if (animations.size() == 0 && quatAnimations.size() == 0){

		jobj[L"autoAnimate"] = web::json::value::boolean(false);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(false);
		jobj[L"autoAnimateFrom"] = web::json::value::number(0);
		jobj[L"autoAnimateTo"] = web::json::value::number(0);

	}
	else if (animations.size()>0){

		jobj[L"autoAnimate"] = web::json::value::boolean(animations[0]->autoAnimate);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(animations[0]->autoAnimateLoop);
		jobj[L"autoAnimateFrom"] = web::json::value::number(animations[0]->autoAnimateFrom);
		jobj[L"autoAnimateTo"] = web::json::value::number(animations[0]->autoAnimateTo);
	}
	else{
		jobj[L"autoAnimate"] = web::json::value::boolean(quatAnimations[0]->autoAnimate);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(quatAnimations[0]->autoAnimateLoop);
		jobj[L"autoAnimateFrom"] = web::json::value::number(quatAnimations[0]->autoAnimateFrom);
		jobj[L"autoAnimateTo"] = web::json::value::number(quatAnimations[0]->autoAnimateTo);
	}

	auto janimations = web::json::value::array();
	for (const auto& anim : animations){
		janimations[janimations.size()] = anim->toJson();
	}for (const auto& anim : quatAnimations){
		janimations[janimations.size()] = anim->toJson();
	}
	jobj[L"animations"] = janimations;
	return jobj;
}

BabylonCamera::BabylonCamera()
{
}



BabylonCamera::BabylonCamera(BabylonNode& babnode)
{
	auto node = babnode.fbxNode();
	std::string ansiName = node->GetName();
	name = std::wstring(ansiName.begin(), ansiName.end());
	id = getNodeId(node);
	auto parent = node->GetParent();
	if (parent) {
		parentId = getNodeId(parent);
	}
	auto camera = node->GetCamera();
	if (!camera) {
		return;
	}
	type = L"FreeCamera";
	auto targetNode = node->GetTarget();
	if (targetNode) {
		lockedTargetId = getNodeId(targetNode);
	}
	else {
		target = camera->InterestPosition.Get();
	}
	position = babnode.localTranslate();
	rotationQuaternion = babnode.localRotationQuat();
	
	fov = camera->FieldOfViewY * Euler2Rad;
	minZ = camera->FrontPlaneDistance.Get();
	maxZ = camera->BackPlaneDistance.Get();

	auto hasAnimStack = node->GetScene()->GetSrcObjectCount<FbxAnimStack>() > 0;
	if (!hasAnimStack){
		return;
	}
	auto animStack = node->GetScene()->GetSrcObject<FbxAnimStack>(0);
	FbxString animStackName = animStack->GetName();
	FbxTakeInfo* takeInfo = node->GetScene()->GetTakeInfo(animStackName);
	auto startFrame = takeInfo->mLocalTimeSpan.GetStart().GetFrameCount(FbxTime::eFrames24);
	auto endFrame = takeInfo->mLocalTimeSpan.GetStop().GetFrameCount(FbxTime::eFrames24);
	auto animLengthInFrame = endFrame - startFrame + 1;

	auto posAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, 24, L"position", L"position", true, 0, animLengthInFrame, true);
	auto rotAnim = std::make_shared<BabylonAnimation<babylon_vector4>>(BabylonAnimationBase::loopBehavior_Cycle, 24, L"rotation", L"rotation", true, 0, animLengthInFrame, true);
	auto targetAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, 24, L"target", L"target", true, 0, animLengthInFrame, true);
	
	for (auto ix = 0ll; ix < animLengthInFrame; ix++){
		FbxTime currTime;
		currTime.SetFrame(startFrame + ix, FbxTime::eFrames24);

		babylon_animation_key<babylon_vector3> poskey;
		babylon_animation_key<babylon_vector4> rotkey;
		poskey.frame = ix;
		rotkey.frame = ix;

		poskey.values = babnode.localTranslate(currTime);
		rotkey.values = babnode.localRotationQuat(currTime);
		posAnim->appendKey(poskey);
		rotAnim->appendKey(rotkey);

		if (lockedTargetId.size() == 0){

			babylon_animation_key<babylon_vector3> targetKey;
			targetKey.frame = ix;
			targetKey.values = camera->InterestPosition.EvaluateValue(currTime);
			targetAnim->appendKey(targetKey);
		}
	}
	if (!posAnim->isConstant()){
		animations.push_back(posAnim);
	}
	if (!rotAnim->isConstant()){
		quatAnimations.push_back(rotAnim);
	}
	if (!targetAnim->isConstant()){
		animations.push_back(targetAnim);
	}
}


BabylonCamera::~BabylonCamera()
{
}
