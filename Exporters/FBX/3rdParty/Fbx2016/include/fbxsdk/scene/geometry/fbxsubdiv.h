/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsubdiv.h
#ifndef _FBXSDK_SCENE_GEOMETRY_SUB_DIV_H_
#define _FBXSDK_SCENE_GEOMETRY_SUB_DIV_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/scene/geometry/fbxgeometry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxMesh;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

class FBXSDK_DLL FbxSubDiv : public FbxGeometry
{
    FBXSDK_OBJECT_DECLARE(FbxSubDiv, FbxGeometry);

public:
    enum EScheme
    {
        eCatmullClark,  //Catmull CClark subdivision surface
        eDooCSabin,      //Doo CSabin subdivision surface
        eLoop,           //Loop subdivision surface
        eLinear,         //Linear subdivision surface 
    };

    enum ETesselationPattern
    {
        eOddFractional,
        eEvenFractional,
        eInteger,
        ePower2,      //Max, Maya use this one
    };

	enum EDisplaySmoothness
	{
		eHull,
		eRough,
		eMedium,
		eFine,
	};

    /** InitSubdivLevel Initialize the subdiv
      * \param pLevelCount  number of levels
      * \param pScheme      subdivision scheme
      * \param pPattern     Tessellation pattern
      */
    void InitSubdivLevel(int pLevelCount, 
        EScheme pScheme = eCatmullClark, 
        ETesselationPattern pPattern = ePower2);

    virtual FbxNodeAttribute::EType GetAttributeType() const;


    //max subdivision level number
    static const int MAX_SUBDIV_LEVEL = 16;

    //subdiv levels in subdivision, including the base mesh and each subdiv levels
    FbxArray<FbxMesh*> mSubDivLevel;

    //Get the base mesh
    FbxMesh* GetBaseMesh() const; 

    //Get the mesh from finest level
    FbxMesh* GetFinestMesh() const;

    //Set the finest mesh
    bool SetFinestMesh(FbxMesh* pMesh);

    //Set the finest mesh
    bool SetBaseMesh(FbxMesh* pMesh);

    //Get the mesh from specific level
    FbxMesh* GetMesh(int pLevel) const;

    /** SetSubdivLevelMesh Set certain subdivision mesh
      * \param pLevel   working level
      * \param pMesh    new level mesh. pLevel = 0 means base mesh, 
      pLevel = MaxLevel -1 means finest mesh
      */
    void SetSubdivLevelMesh(int pLevel, FbxMesh* pMesh);

    int GetLevelCount() const;
    void SetLevelCount(int pLevelCount);

    int GetCurrentLevel() const;
    void SetCurrentLevel(int pCurrentLevel);

	FbxMesh* GetCurrentMesh() const;

    FbxSubDiv::EScheme GetSubdivScheme() const;

    FbxSubDiv::ETesselationPattern GetTessPattern() const;

    void SetSubdivScheme(FbxSubDiv::EScheme pScheme);

    void SetTessPattern(FbxSubDiv::ETesselationPattern pPattern);

	FbxSubDiv::EDisplaySmoothness GetDisplaySmoothness() const;

	void SetDisplaySmoothness(FbxSubDiv::EDisplaySmoothness pSmoothness);

private:

    //base geometry mesh for subdivision
    FbxMesh* mBaseMesh;

    //finest geometry mesh for subdivision
    FbxMesh* mFinestMesh;

    //current operating subdivision level
    int mCurrLevel;

    //number of subdiv level
    int mLevelCount;

    //scheme of subdiv
    EScheme mScheme;

    //pattern of subdiv
    ETesselationPattern mPattern;

	//display smoothness of subdiv
	EDisplaySmoothness mSmoothness;
};

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_SUB_DIV_H_ */
