#pragma once
#include <cpprest\json.h>
#include <string>
#include "BabylonVertex.h"
#include <fbxsdk.h>
#include "BabylonNode.h"
#include "BabylonAnimation.h"
#include <memory>
class BabylonCamera
{
public:
	
	std::wstring name;

		
	std::wstring id;

		
	std::wstring parentId;

		
	std::wstring lockedTargetId;

		
	std::wstring type;

		
	babylon_vector3 position;

		
	babylon_vector4 rotationQuaternion = babylon_vector4(0,0,0,1);

		
	babylon_vector3 target;

		
	float fov =.8f;

		
	float minZ = .1f;

		
	float maxZ = 5000;

		
	float speed = 1;

		
	float inertia = .9f;

		
	bool checkCollisions = false;

		
	bool applyGravity = false;

		
	babylon_vector3 ellipsoid;

		
	bool autoAnimate = false;

		
	int autoAnimateFrom = 0;

		
	int autoAnimateTo = 0;

		
	bool autoAnimateLoop = false;


	std::vector<std::shared_ptr < BabylonAnimation<babylon_vector3>>> animations;

	std::vector<std::shared_ptr < BabylonAnimation<babylon_vector4>>> quatAnimations;
	web::json::value toJson() const;

	BabylonCamera();
	BabylonCamera(BabylonNode& babnode);
	BabylonCamera(const BabylonCamera& ) = default;
	BabylonCamera(BabylonCamera&& moved);
	~BabylonCamera();
};


BabylonCamera buildCameraFromBoundingBox(const babylon_boundingbox& box);