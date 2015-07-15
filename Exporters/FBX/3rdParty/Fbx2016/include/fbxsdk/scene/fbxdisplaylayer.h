/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdisplaylayer.h
#ifndef _FBXSDK_SCENE_DISPLAY_LAYER_H_
#define _FBXSDK_SCENE_DISPLAY_LAYER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxcollectionexclusive.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Class for display layers.
* \nosubgrouping
* Display layers are overlapping views of your scene that contain a list of members. 
* The members are exclusive. Members cannot be part of multiple display layers. 
* Display layers enables user to organize elements of scene and affect visibility and manipulation attributes of multiple objects at once. 
*/
class FBXSDK_DLL FbxDisplayLayer : public FbxCollectionExclusive
{
    FBXSDK_OBJECT_DECLARE(FbxDisplayLayer, FbxCollectionExclusive);

public:
    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////
    /** This property stores the color of this display layer.
    *
    * Default value is FbxDouble3(0.8,0.8,0.8).
    */
    FbxPropertyT<FbxDouble3>       Color;
    /** This property stores the visibility of this display layer.
    *
    * Default value is true.
    */
    FbxPropertyT<FbxBool>         Show;
    /** This property stores the manipulation state of this display layer.
    *
    * Default value is false.
    */
    FbxPropertyT<FbxBool>         Freeze;
    /** This property stores the level of detail mode of this display layer.
    *
    * Default value is false.
    */
    FbxPropertyT<FbxBool>         LODBox;

    //////////////////////////////////////////////////////////////////////////
    // Static values
    //////////////////////////////////////////////////////////////////////////

    // Default property values
    static const FbxDouble3 sColorDefault;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);  
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_DISPLAY_LAYER_H_ */
