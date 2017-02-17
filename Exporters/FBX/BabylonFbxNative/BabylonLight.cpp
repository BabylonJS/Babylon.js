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

	if (animations.size() == 0) {

		jobj[L"autoAnimate"] = web::json::value::boolean(false);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(false);
		jobj[L"autoAnimateFrom"] = web::json::value::number(0);
		jobj[L"autoAnimateTo"] = web::json::value::number(0);

	}
	else {

		jobj[L"autoAnimate"] = web::json::value::boolean(animations[0]->autoAnimate);
		jobj[L"autoAnimateLoop"] = web::json::value::boolean(animations[0]->autoAnimateLoop);
		jobj[L"autoAnimateFrom"] = web::json::value::number(animations[0]->autoAnimateFrom);
		jobj[L"autoAnimateTo"] = web::json::value::number(animations[0]->autoAnimateTo);
	}

	auto janimations = web::json::value::array();
	for (const auto& anim : animations) {
		janimations[janimations.size()] = anim->toJson();
	}
	jobj[L"animations"] = janimations;

	auto jarray = web::json::value::array();
	for (auto& id : excludedMeshesIds) {
		jarray[jarray.size()] = web::json::value::string(id);
	}
	jobj[L"excludedMeshesIds"] = jarray;

	jarray = web::json::value::array();
	for (auto& id : includedOnlyMeshesIds) {
		jarray[jarray.size()] = web::json::value::string(id);
	}
	jobj[L"includedOnlyMeshesIds"] = jarray;

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
	auto localTransform = babnode.GetLocal();
	position = localTransform.translation();
	auto light = node->GetLight();
	switch (light->LightType)
	{
	case FbxLight::ePoint:
		type = type_omni;
		break;
	case FbxLight::eDirectional:
		type = type_direct;
		{
			FbxDouble3 vDir(0, -1, 0);
			FbxAMatrix rotM;
			rotM.SetIdentity();

			rotM.SetQ(localTransform.fbxrot());
			auto transDir = rotM.MultT(vDir);
			direction = transDir;

		}
		break;
	case FbxLight::eSpot:
		type = type_Spot;
		{
			FbxDouble3 vDir(0, -1, 0);
			FbxAMatrix rotM;
			rotM.SetIdentity();
			rotM.SetQ(localTransform.fbxrot());
			auto transDir = rotM.MultT(vDir);
			direction = transDir;
			exponent = 1;
			angle = static_cast<float>(light->OuterAngle*Euler2Rad);

		}
		break;
	default:
		break;
	}
	diffuse = light->Color.Get();
	intensity = static_cast<float>(light->Intensity.Get() / 100.0);
	if (light->EnableFarAttenuation.Get()) {
		range = static_cast<float>(light->FarAttenuationEnd.Get());
	}
	auto hasAnimStack = node->GetScene()->GetSrcObjectCount<FbxAnimStack>() > 0;
	if (!hasAnimStack) {
		return;
	}
	castShadows = light->CastShadows.Get();
	if (castShadows) {
		shadowGenerator = std::make_shared<BabylonShadowGenerator>(node);
	}
	auto animStack = node->GetScene()->GetCurrentAnimationStack();
	FbxString animStackName = animStack->GetName();
	//FbxTakeInfo* takeInfo = node->GetScene()->GetTakeInfo(animStackName);
	auto animTimeMode = GlobalSettings::Current().AnimationsTimeMode;
	auto animFrameRate = GlobalSettings::Current().AnimationsFrameRate();
	auto startFrame = animStack->GetLocalTimeSpan().GetStart().GetFrameCount(animTimeMode);
	auto endFrame = animStack->GetLocalTimeSpan().GetStop().GetFrameCount(animTimeMode);
	auto animLengthInFrame = endFrame - startFrame + 1;
	auto posAnimName = getNodeId(node);
	auto dirAnimName = getNodeId(node);
	posAnimName.append(L"_position");
	dirAnimName.append(L"_direction");
	auto posAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, static_cast<int>(animFrameRate), posAnimName, L"position", true, 0, static_cast<int>(animLengthInFrame), true);
	auto dirAnim = std::make_shared<BabylonAnimation<babylon_vector3>>(BabylonAnimationBase::loopBehavior_Cycle, static_cast<int>(animFrameRate), dirAnimName, L"direction", true, 0, static_cast<int>(animLengthInFrame), true);
	if (node->LclRotation.GetCurveNode() || node->LclTranslation.GetCurveNode()) {
		for (auto ix = 0; ix < animLengthInFrame; ix++) {
			babylon_animation_key<babylon_vector3> key;
			key.frame = ix;
			FbxTime currTime;
			currTime.SetFrame(startFrame + ix, animTimeMode);
			auto currTransform = babnode.GetLocal(currTime);
			key.values = currTransform.translation();
			posAnim->appendKey(key);

			if (type == type_direct || type == type_Spot) {
				babylon_animation_key<babylon_vector3> dirkey;
				dirkey.frame = ix;
				FbxDouble3 vDir(0, -1, 0);
				FbxAMatrix rotM;
				rotM.SetIdentity();
				rotM.SetQ(currTransform.fbxrot());
				auto transDir = rotM.MultT(vDir);
				dirkey.values = transDir;
				dirAnim->appendKey(dirkey);
			}
		}
	}
	if (!posAnim->isConstant()) {
		animations.push_back(posAnim);
	}
	if (!dirAnim->isConstant()) {
		animations.push_back(dirAnim);
	}
}


BabylonLight::BabylonLight(BabylonLight && moved)  : 
name(std::move(moved.name)),
id(std::move(moved.id)),
parentId(std::move(moved.parentId)),
position(std::move(moved.position)),
direction(std::move(moved.direction)),
type(std::move(moved.type)),
diffuse(std::move(moved.diffuse)),
specular(std::move(moved.specular)),
intensity(std::move(moved.intensity)),
range(std::move(moved.range)),
exponent(std::move(moved.exponent)),
angle(std::move(moved.angle)),
groundColor(std::move(moved.groundColor)),
castShadows(std::move(moved.castShadows)),
includedOnlyMeshesIds(std::move(moved.includedOnlyMeshesIds)),
excludedMeshesIds(std::move(moved.excludedMeshesIds)),
shadowGenerator(std::move(moved.shadowGenerator)),
animations(std::move(moved.animations))
{
}

BabylonLight::~BabylonLight()
{
}

BabylonShadowGenerator::BabylonShadowGenerator(FbxNode * lightNode)
{
	auto light = lightNode->GetLight();
	lightId = getNodeId(lightNode);
	mapSize = 2048;
	bias = 0.00005f;
	useBlurVarianceShadowMap = true;
	blurScale = 2;
	blurBoxOffset = 1;
	useVarianceShadowMap = false;
	usePoissonSampling = false;
	auto nodeCount = lightNode->GetScene()->GetNodeCount();
	for (auto ix = 0;ix < nodeCount;++ix) {
		auto mnode = lightNode->GetScene()->GetNode(ix);
		auto mesh = mnode->GetMesh();
		if (mesh && mesh->CastShadow.Get()) {
			renderList.push_back(getNodeId(mnode));
		}
	}

}

BabylonShadowGenerator::BabylonShadowGenerator(BabylonShadowGenerator && moved) : 
	mapSize(std::move(moved.mapSize)),
	bias(std::move(moved.bias)),
	lightId(std::move(moved.lightId)),
	useVarianceShadowMap(std::move(moved.useVarianceShadowMap)),
	usePoissonSampling(std::move(moved.usePoissonSampling)),
	useBlurVarianceShadowMap(std::move(moved.useBlurVarianceShadowMap)),
	blurScale(std::move(moved.blurScale)),
	blurBoxOffset(std::move(moved.blurBoxOffset)),
	renderList(std::move(moved.renderList))
{
}

web::json::value BabylonShadowGenerator::toJson()
{
	auto jobj =web::json::value::object();
	jobj[L"mapSize"] = web::json::value::number(mapSize);
	jobj[L"lightId"] = web::json::value::string(lightId);
	jobj[L"useVarianceShadowMap"] = web::json::value::boolean(useVarianceShadowMap);
	jobj[L"usePoissonSampling"] = web::json::value::boolean(usePoissonSampling);
	/*jobj[L"useBlurVarianceShadowMap"] = web::json::value::boolean(useBlurVarianceShadowMap);
	jobj[L"blurScale"] = web::json::value::number(blurScale);
	jobj[L"blurBoxOffset"] = web::json::value::number(blurBoxOffset);*/
	auto jarr = web::json::value::array();
	for (auto& id : renderList) {
		jarr[jarr.size()] = web::json::value::string(id);
	}
	jobj[L"renderList"] = jarr;
	return jobj;
}
