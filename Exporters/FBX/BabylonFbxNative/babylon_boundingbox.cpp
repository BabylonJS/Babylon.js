#include "stdafx.h"
#include "BabylonVertex.h"
#include <numeric>
#include <algorithm>
#include "BabylonCamera.h"


babylon_boundingbox::babylon_boundingbox()
	: _minX(std::numeric_limits<float>::max()),
	  _minY(std::numeric_limits<float>::max()),
	  _minZ(std::numeric_limits<float>::max()),
	  _maxX(std::numeric_limits<float>::min()),
	  _maxY(std::numeric_limits<float>::min()),
	  _maxZ(std::numeric_limits<float>::min())
{
}


babylon_boundingbox::babylon_boundingbox(FbxScene* scene){
	FbxVector4 vmin, vmax, vcenter;
	scene->ComputeBoundingBoxMinMaxCenter(vmin, vmax, vcenter);
	_minX = static_cast<float>(vmin[0]);
	_minY = static_cast<float>(vmin[1]);
	_minZ = static_cast<float>(vmin[2]);
	_maxX = static_cast<float>(vmax[0]);
	_maxY = static_cast<float>(vmax[1]);
	_maxZ = static_cast<float>(vmax[2]);

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
