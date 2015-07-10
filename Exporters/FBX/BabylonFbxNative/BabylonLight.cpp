#include "stdafx.h"
#include "BabylonLight.h"
#include "NodeHelpers.h"
#include "GlobalSettings.h"

web::json::value BabylonLight::toJson() const
{
	auto jobj = web::json::value::object();
	jobj[L"name"] = web::json::value::string(name);
	jobj[L"id"] = web::json::value::string(id);
	if (parentId.size() > 0)
		jobj[L"parentId"] = web::json::value::string(parentId);

	writeVector3(jobj, L"position", position);
	writeVector3(jobj, L"direction", direction);
	jobj[L"type"] = web::json::value::number(type);
	writeVector3(jobj, L"diffuse", diffuse);
	writeVector3(jobj, L"specular", specular);
	jobj[L"intensity"] = web::json::value::number(intensity);
	jobj[L"range"] = web::json::value::number(range);
	jobj[L"exponent"] = web::json::value::number(exponent);
	jobj[L"angle"] = web::json::value::number(angle);
	writeVector3(jobj, L"groundColor", groundColor);

	if (animations.size() == 0){

		jobj[L"autoAnimate"] = web::json::value::boolean(false);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(false);
		jobj[L"autoAnimateFrom"] = web::json::value::number(0);
		jobj[L"autoAnimateTo"] = web::json::value::number(0);

	}
	else{

		jobj[L"autoAnimate"] = web::json::value::boolean(animations[0]->autoAnimate);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(animations[0]->autoAnimateLoop);
		jobj[L"autoAnimateFrom"] = web::json::value::number(animations[0]->autoAnimateFrom);
		jobj[L"autoAnimateTo"] = web::json::value::number(animations[0]->autoAnimateTo);
	}

	auto janimations = web::json::value::array();
	for (const auto& anim : animations){
		janimations[janimations.size()] = anim->toJson();
	}
	jobj[L"animations"] = janimations;
	return jobj;
}

BabylonLight::BabylonLight() :
diffuse(1, 1, 1),
specular(1, 1, 1)
{
}

BabylonLight::BabylonLight(BabylonNode & babnode) :
diffuse(1, 1, 1),
specular(1, 1, 1)
{
	auto node = babnode.fbxNode();
	std::string ansiName = node->GetName();
	name = std::wstring(ansiName.begin(), ansiName.end());
	id = getNodeId(node);
	auto parent = node->GetParent();
	if (parent) {
		parentId = getNodeId(parent);
	}
	position = babnode.localTranslate();
	auto light = node->GetLight();
	switch (light->LightType)
	{
	case FbxLight::ePoint:
		type = type_omni;
		break;
	case FbxLight::eDirectional:
		type = type_direct;
		{
			FbxDouble3 vDir(0, 1, 0);
			FbxAMatrix rotM;
			rotM.SetIdentity();
			rotM.SetQ(babnode.localTransform().GetQ());
			auto transDir = rotM.MultT(vDir);
			direction = transDir;

		}
		break;
	case FbxLight::eSpot:
		type = type_Spot;
		{
			FbxDouble3 vDir(0, 1, 0);
			FbxAMatrix rotM;
			rotM.SetIdentity();
			rotM.SetQ(babnode.localTransform().GetQ());
			auto transDir = rotM.MultT(vDir);
			direction = transDir;
			exponent = 1;
			angle = light->OuterAngle*Euler2Rad;

		}
		break;
	default:
		break;
	}
	diffuse = light->Color.Get();
	intensity = light->Intensity.Get() / 100.0;
	if (light->EnableFarAttenuation.Get()) {
		range = light->FarAttenuationEnd.Get();
	}
	auto hasAnimStack = node->GetScene()->GetSrcObjectCount<FbxAnimStack>() > 0;
	if (!hasAnimStack){
		return;
	}
	auto animStack = node->GetScene()->GetSrcObject<FbxAnimStack>(0);
	FbxString animStackName = animStack->GetName();
	FbxTakeInfo* takeInfo = node->GetScene()->GetTakeInfo(animStackName);
	auto animTimeMode = GlobalSettings::Current().AnimationsTimeMode;
	auto animFrameRate = GlobalSettings::Current().AnimationsFrameRate();
	auto startFrame = takeInfo->mLocalTimeSpan.GetStart().GetFrameCount(animTimeMode);
	auto endFrame = takeInfo->mLocalTimeSpan.GetStop().GetFrameCount(animTimeMode);
	auto animLengthInFrame = endFrame - startFrame + 1;
	auto posAnimName = getNodeId(node);
	auto dirAnimName = getNodeId(node);
	posAnimName.append(L"_position");
	dirAnimName.append(L"_direction");
	auto posAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, animFrameRate, posAnimName, L"position", true, 0, animLengthInFrame, true);
	auto dirAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, animFrameRate, dirAnimName, L"direction", true, 0, animLengthInFrame, true);
	for (auto ix = 0ll; ix < animLengthInFrame; ix++){
		babylon_animation_key<babylon_vector3> key;
		key.frame = ix;
		FbxTime currTime;
		currTime.SetFrame(startFrame + ix, animTimeMode);
		key.values = babnode.localTranslate(currTime);
		posAnim->appendKey(key);

		if (type == type_direct || type == type_Spot){
			babylon_animation_key<babylon_vector3> dirkey;
			dirkey.frame = ix;
			auto transformAtTime = babnode.localTransform(currTime);
			FbxDouble3 vDir(0, 1, 0);
			FbxAMatrix rotM;
			rotM.SetIdentity();
			rotM.SetQ(transformAtTime.GetQ());
			auto transDir = rotM.MultT(vDir);
			dirkey.values = transDir;
			dirAnim->appendKey(dirkey);
		}
	}
	if (!posAnim->isConstant()){
		animations.push_back(posAnim);
	}
	if (!dirAnim->isConstant()){
		animations.push_back(dirAnim);
	}
}


BabylonLight::~BabylonLight()
{
}
