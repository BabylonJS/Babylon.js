#include "stdafx.h"
#include "BabylonCamera.h"
#include "NodeHelpers.h"
#include "GlobalSettings.h"

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
	writeVector3(jobj, L"ellipsoid", ellipsoid);
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


BabylonCamera buildCameraFromBoundingBox(const babylon_boundingbox& box){
	BabylonCamera result;
	result.name = L"defaultcamera";
	result.id = L"defaultcamera";

	result.target = box.getCenter();
	result.position = babylon_vector3(result.target.x, result.target.y, result.target.z - 2 * std::max(box.getWidth(), std::max(box.getHeight(), box.getDepth())));
	result.fov = 0.8576f;
	result.minZ = -0.01f*result.position.z;
	result.maxZ = -5 * result.position.z;
	result.speed = (-result.position.z - result.target.z) / 10;
	result.inertia = 0.9f;
	result.checkCollisions = false;
	result.applyGravity = false;
	result.ellipsoid = babylon_vector3(.2f, .9f, .2f);
	return result;
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
	auto localTransformAtStart = babnode.GetLocal();
	position = localTransformAtStart.translation();
	rotationQuaternion = localTransformAtStart.rotationQuaternion();
	
	fov = static_cast<float>(camera->FieldOfViewY * Euler2Rad);
	
	
	minZ = static_cast<float>(camera->NearPlane.Get());
	maxZ = static_cast<float>(camera->FarPlane.Get());

	auto hasAnimStack = node->GetScene()->GetSrcObjectCount<FbxAnimStack>() > 0;
	if (!hasAnimStack){
		return;
	}
	auto animStack = node->GetScene()->GetCurrentAnimationStack();
	FbxString animStackName = animStack->GetName();
	//FbxTakeInfo* takeInfo = node->GetScene()->GetTakeInfo(animStackName);
	auto animTimeMode = GlobalSettings::Current().AnimationsTimeMode;
	auto animFrameRate = GlobalSettings::Current().AnimationsFrameRate();
	auto startFrame = animStack->GetLocalTimeSpan().GetStart().GetFrameCount(animTimeMode);
	auto endFrame = animStack->GetLocalTimeSpan().GetStop().GetFrameCount(animTimeMode);
	auto animLengthInFrame = endFrame - startFrame + 1;

	auto posAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, static_cast<int>(animFrameRate), L"position", L"position", true, 0, static_cast<int>(animLengthInFrame), true);
	auto rotAnim = std::make_shared<BabylonAnimation<babylon_vector4>>(BabylonAnimationBase::loopBehavior_Cycle, static_cast<int>(animFrameRate), L"rotation", L"rotation", true, 0, static_cast<int>(animLengthInFrame), true);
	auto targetAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, static_cast<int>(animFrameRate), L"target", L"target", true, 0, static_cast<int>(animLengthInFrame), true);
	if (node->LclRotation.GetCurveNode() || node->LclScaling.GetCurveNode() || node->LclTranslation.GetCurveNode() || camera->InterestPosition.GetCurveNode()) {
		for (auto ix = 0; ix < animLengthInFrame; ix++) {
			FbxTime currTime;
			currTime.SetFrame(startFrame + ix, animTimeMode);

			babylon_animation_key<babylon_vector3> poskey;
			babylon_animation_key<babylon_vector4> rotkey;
			poskey.frame = ix;
			rotkey.frame = ix;


			auto transformAtT = babnode.GetLocal(currTime);

			poskey.values = transformAtT.translation();
			rotkey.values = transformAtT.rotationQuaternion();
			posAnim->appendKey(poskey);
			rotAnim->appendKey(rotkey);

			if (lockedTargetId.size() == 0) {

				babylon_animation_key<babylon_vector3> targetKey;
				targetKey.frame = ix;
				targetKey.values = camera->InterestPosition.EvaluateValue(currTime);
				targetAnim->appendKey(targetKey);
			}
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


BabylonCamera::BabylonCamera(BabylonCamera && moved) : 
	name(std::move(moved.name)),
	id(std::move(moved.id)),
	parentId(std::move(moved.parentId)),
	lockedTargetId(std::move(moved.lockedTargetId)),
	type(std::move(moved.type)),
	position(std::move(moved.position)),
	rotationQuaternion(std::move(moved.rotationQuaternion)),
	target(std::move(moved.target)),
	fov(std::move(moved.fov)),
	minZ(std::move(moved.minZ)),
	maxZ(std::move(moved.maxZ)),
	speed(std::move(moved.speed)),
	inertia(std::move(moved.inertia)),
	checkCollisions(std::move(moved.checkCollisions)),
	applyGravity(std::move(moved.applyGravity)),
	ellipsoid(std::move(moved.ellipsoid)),
	autoAnimate(std::move(moved.autoAnimate)),
	autoAnimateFrom(std::move(moved.autoAnimateFrom)),
	autoAnimateTo(std::move(moved.autoAnimateTo)),
	autoAnimateLoop(std::move(moved.autoAnimateLoop)),
	animations(std::move(moved.animations)),
	quatAnimations(std::move(moved.quatAnimations))
{
}

BabylonCamera::~BabylonCamera()
{
}
