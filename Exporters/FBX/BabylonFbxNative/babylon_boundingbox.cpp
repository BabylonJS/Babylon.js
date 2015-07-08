#include "stdafx.h"
#include "BabylonVertex.h"
#include <numeric>
#include <algorithm>


babylon_boundingbox::babylon_boundingbox()
	: _minX(std::numeric_limits<float>::max()),
	  _minY(std::numeric_limits<float>::max()),
	  _minZ(std::numeric_limits<float>::max()),
	  _maxX(std::numeric_limits<float>::min()),
	  _maxY(std::numeric_limits<float>::min()),
	  _maxZ(std::numeric_limits<float>::min())
{
}
void babylon_boundingbox::addPosition(float x, float y, float z){
	_minX = std::min(x, _minX);
	_minY = std::min(y, _minY);
	_minZ = std::min(z, _minZ);

	_maxX = std::max(x, _maxX);
	_maxY = std::max(y, _maxY);
	_maxZ = std::max(z, _maxZ);
}

babylon_boundingbox::~babylon_boundingbox()
{
}
babylon_boundingbox mergeBoundingBoxes(const std::vector<babylon_boundingbox>& boxes){
	babylon_boundingbox result;
	for (const auto& b : boxes){
		result.addPosition(b.getMin());
		result.addPosition(b.getMax());
	}
	return result;
}

babylon_camera buildCameraFromBoundingBox(const babylon_boundingbox& box){
	babylon_camera result;
	result.name = "defaultcamera";
	result.id = "defaultcamera";

	result.target = box.getCenter();
	result.position = babylon_vector3(result.target.x, result.target.y, result.target.z - 2 * std::max(box.getWidth(), std::max(box.getHeight(), box.getDepth())));
	result.fov = 0.8576f;
	result.minZ = -0.01*result.position.z;
	result.maxZ = -5 * result.position.z;
	result.speed = (-result.position.z - result.target.z) / 10;
	result.inertia = 0.9f;
	result.checkCollisions = false;
	result.applyGravity = false;
	result.ellipsoid = babylon_vector3(.2f, .9f, .2f);
	result.rotation = babylon_vector3(0, 0, 0);
	return result;
}