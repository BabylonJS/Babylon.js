#include "stdafx.h"
#include "BabylonScene.h"


web::json::value BabylonScene::toJson() 
{
	auto jobj = web::json::value::object();
	jobj[L"autoClear"] = web::json::value::boolean(_autoClear);
	writeVector3(jobj, L"clearColor", _clearColor);
	writeVector3(jobj, L"ambientColor", _ambientColor);
	jobj[L"fogMode"] = web::json::value::boolean(_fogMode);
	writeVector3(jobj, L"fogColor", _fogColor);
	jobj[L"fogStart"] = web::json::value::number(_fogStart);
	jobj[L"fogEnd"] = web::json::value::number(_fogEnd);
	jobj[L"fogDensity"] = web::json::value::number(_fogDensity);
	writeVector3(jobj, L"gravity", _gravity);
	jobj[L"activeCameraID"] = web::json::value::string(_activeCameraID);

	auto jcameras = web::json::value::array();

	for (auto& cam : _cameras) {
		jcameras[jcameras.size()] = cam.toJson();
	}

	jobj[L"cameras"] = jcameras;

	auto jmeshes = web::json::value::array();
	for (auto& mesh : _meshes) {
		jmeshes[jmeshes.size()] = mesh.toJson();
	}
	jobj[L"meshes"] = jmeshes;


	auto jmats = web::json::value::array();
	for (auto& mat : _materials) {
		jmats[jmats.size()] = mat.toJson();
	}
	jobj[L"materials"] = jmats;

	auto jmulmats = web::json::value::array();
	for (auto& mat : _multiMaterials) {
		jmulmats[jmulmats.size()] = mat.toJson();
	}
	jobj[L"multiMaterials"] = jmulmats;

	auto jlights = web::json::value::array();
	for (auto& light : _lights) {
		jlights[jlights.size()] = light.toJson();
	}
	jobj[L"lights"] = jlights;

	auto jskeletons = web::json::value::array();
	for (auto& skel : _skeletons){
		jskeletons[jskeletons.size()] = skel->toJson();
	}
	jobj[L"skeletons"] = jskeletons;

	return jobj;
}

BabylonScene::BabylonScene() :
_autoClear(true),
_clearColor(.2f, .2f, .3f),
_ambientColor(0,0,0),
_gravity(0,0,-.9f)
{
}


BabylonScene::~BabylonScene()
{
}
