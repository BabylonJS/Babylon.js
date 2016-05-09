/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcameraswitcher.h
#ifndef _FBXSDK_SCENE_GEOMETRY_CAMERA_SWITCHER_H_
#define _FBXSDK_SCENE_GEOMETRY_CAMERA_SWITCHER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This node attribute contains methods for accessing the properties of a camera switcher.
  * The camera switcher is a concept of Motion Builder.
  * The camera switcher lets you switch between the custom cameras placed in your scene so you can create an animation using multiple camera angles.
  * Custom cameras are cameras which created by users, while the default cameras are top, bottom, left, right, front, back and perspective camera.
  * The Camera switcher contains the custom cameras you have created. If you have no custom cameras created in your scene, the Camera switcher is empty.
  * Please read Motion Builder documentation for more details.
  * \nosubgrouping
  * \see FbxCamera and FbxCameraStereo.
  */
class FBXSDK_DLL FbxCameraSwitcher : public FbxNodeAttribute
{
    FBXSDK_OBJECT_DECLARE(FbxCameraSwitcher,FbxNodeAttribute);

    public:
    /**
      * \name Properties
      */
    //@{
        /** This property handles the index of camera.
          *
          * Default value is 1.
          */
        FbxPropertyT<FbxInt>        CameraIndex;
    //@}

    //! Return the type of node attribute which is EType::eCameraSwitcher.
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    /**
      * \name Default Animation Values.
      * These functions provides direct access to default animation values specific to a camera switcher. The default animation
      * values are found in the default take node of the associated node. These functions only work if the camera switcher has been
      * associated with a node.
      *
      * Camera indices start at 1. Out of range indices are clamped between 1 and the number of cameras in the scene. The index of a
      * camera refers to its order of appearance when searching the node tree depth first.
      */
    //@{

        /** Get default camera index.
          * \return Camera index. The return value is an integer between 1 and the number
          *             of cameras in the scene, or 0 if there are no default camera set in the camera switcher.
          */
        int GetDefaultCameraIndex() const;

        /** Set default camera index.
          * \param pIndex The index of the camera to set as default. This parameter has an integer
          *             scale from 1 to the number of cameras in the scene. Its default value is 1 if
          *             there is at least one camera in the camera switcher, 0 if there are none.
          *             No validation checks are made.
          */
        void SetDefaultCameraIndex(int pIndex);

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);

protected:
    virtual void Destruct(bool pRecursive);
    virtual void ConstructProperties(bool pForceSet);

public:
    void AddCameraName(char* pCameraName);
    char* GetCameraName(FbxUInt pIndex) const;
    FbxUInt GetCameraNameCount() const;
	void ClearCameraNames();

protected:
    FbxArray<FbxString*> mCameraNameList;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_CAMERA_SWITCHER_H_ */
