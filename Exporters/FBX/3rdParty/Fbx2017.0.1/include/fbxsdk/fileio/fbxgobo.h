/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxgobo.h
#ifndef _FBXSDK_FILEIO_GOBO_H_
#define _FBXSDK_FILEIO_GOBO_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**
 * \brief A gobo is a filter placed over a spot light to project light patterns through fog on a surface.
 * You can also use an image file as a gobo, which cause the light to project an image, much like a projector. 
 */
class FbxGobo
{
public:
	FbxGobo(char* pName) :
	  mName(pName)
	  {
	  }

	//! Gobo name.
    FbxString mName;
    //! path and file name of the image file.
    FbxString mFileName;
    //! Flag that if shows the light projected on the ground.
    bool mDrawGroundProjection;
    //! Flag that lets you create a volumetric lighting effect by making the light stream visible.
    bool mVolumetricLightProjection;
    //! Flag that front facing light occurs when the camera view is looking down or up the light stream of a Spot light, which makes the light stream look three-dimensional.
    bool mFrontVolumetricLightProjection;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_GOBO_H_ */
