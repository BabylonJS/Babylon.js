/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimutilities.h
#ifndef _FBXSDK_SCENE_ANIMATION_UTILITIES_H_
#define _FBXSDK_SCENE_ANIMATION_UTILITIES_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/scene/animation/fbxanimcurve.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxMultiMap;
class FbxObject;
class FbxProperty;
class FbxScene;
class FbxIO;
class FbxAnimStack;
class FbxAnimLayer;
class FbxAnimCurveNode;
class FbxAnimCurve;

class FBXSDK_DLL FbxAnimUtilities
{
public:
	/** Inspects all the properties of the given object for animation curves.
	  * \param pObj Pointer to the object to query.
	  * \return     \c true if at least one property is animated and \c false otherwise.
	  * \remarks    A property is animated if it contains at least one FbxAnimCurve with keys.
	  */
	static bool IsAnimated(FbxObject* pObj);

	/** Inspects the specified property of the given object for animation curves.
	  * \param pObj             Pointer to the object to query.
	  * \param pPropertyName    Name of the inspected property.
	  * \param pChannelName     Name of the specific channel of the inspected property.
	  * \return                 \c true if the specified channel is animated and \c false otherwise.
	  * \remarks                A property is animated if it contains at least one FbxAnimCurve with keys.
	  */
	static bool IsChannelAnimated(FbxObject* pObj, const char* pPropertyName, const char* pChannelName = NULL);

    class FBXSDK_DLL FbxAnimSplitDef
    {
    public:
        FbxString mName;
        FbxTime   mStart;
        FbxTime   mEnd;
        
        FbxAnimSplitDef()
        {
            mName = "unnamed";
            mStart = 0;
            mEnd = 0;
        }
        
        FbxAnimSplitDef(const FbxString& pName, FbxTime& pStart, FbxTime& pEnd)
        {
            mName = pName;
            mStart = pStart;
            mEnd = pEnd;
        }
        
        FbxAnimSplitDef& operator =(const FbxAnimSplitDef& pRhs)
        {
            mName = pRhs.mName;
            mStart = pRhs.mStart;
            mEnd = pRhs.mEnd;
            return *this;
        }
    } ;

    class FBXSDK_DLL CurveNodeIntfce
    {
    public:
        // pData is a pointer to the private KFCurveNode
        CurveNodeIntfce(void* pData);
        ~CurveNodeIntfce();

        FbxHandle GetHandle();

        char*            GetTimeWarpName() const;
        CurveNodeIntfce  GetTimeWarp();

        CurveNodeIntfce  GetLayer(int pId);

        int              GetCount();
        void*            GetHandle(unsigned int pId);
        void*            GetCurveHandle(int pId = -1);
        void             SetCurveHandle(void* pCurveHandle, int pId = -1);
        CurveNodeIntfce  FindRecursive(const char* pName);

        bool IsValid() { return mImp != NULL; }        
        CurveNodeIntfce& operator=(CurveNodeIntfce& lRhs)
        {
            mImp = lRhs.mImp;
            return *this;
        }

        bool operator==(CurveNodeIntfce& lRhs)
        {
            return (mImp == lRhs.mImp);
        }

    private:
        friend class FbxAnimUtilities;
        void* mImp;
    };

    class FBXSDK_DLL CurveIntfce
    {
    public:
        // pData is a pointer to the private KFCurve
        CurveIntfce(void* pData);
        CurveIntfce(FbxAnimCurve* pAnimCurve);
        ~CurveIntfce();

        float GetValue();
        void  SetValue(float pVal);
        int   KeyGetCount();

        void* GetCurveHandle();
        void  SetCurveHandle(void* pData);

        int GetPreExtrapolation();
        int GetPreExtrapolationCount();
        int GetPostExtrapolation();
        int GetPostExtrapolationCount();


        bool IsValid() { return mImp != NULL; }    
        CurveIntfce& operator=(CurveIntfce& lRhs)
        {
            mImp = lRhs.mImp;
            mIsAnimCurveImp = lRhs.mIsAnimCurveImp;
            return *this;
        }

        bool operator==(CurveIntfce& lRhs)
        {
            return (mImp == lRhs.mImp);
        }

    private:
        friend class FbxAnimUtilities;

        void* mImp;
        bool  mIsAnimCurveImp;
    };

    static int SplitAnimationIntoMultipleStacks(FbxScene* pScene, const FbxArray<FbxAnimSplitDef*>& pAnimSplitDefinitions, const FbxAnimStack* pSrcAnimStack, FbxArray<FbxAnimStack*>& pDstStacks);
    static void ShareAnimCurves(FbxProperty& pDstProperty, FbxProperty& pSrcProperty, FbxScene* pScene);

    // Encapsulate use of private animation data
    static void             SetTimeWarpSet(FbxMultiMap* pTWset);

    static CurveNodeIntfce  CreateCurveNode(const char* pName);
    static CurveNodeIntfce  CreateCurveNode(FbxIO* pFileObject);
    static CurveNodeIntfce  CreateCurveNode(FbxIO* pFileObject, CurveNodeIntfce& pParent, bool pOnlyDefaults = false);
    static CurveNodeIntfce  CreateTimeWarpNode(FbxAnimCurve* pAnimCurve, const char* pFalloffName);
    
    static CurveNodeIntfce  GrabCurveNode(FbxAnimCurveNode* pCN);
    static void             RestrieveCurveNode(CurveNodeIntfce& pData, FbxIO* mFileObject);
    static void             StoreCurveNode(CurveNodeIntfce& pData, FbxIO* mFileObject);
    static void             ReleaseCurveNode(FbxAnimCurveNode* pCurveNode);
    static void             DestroyCurveNode(CurveNodeIntfce& pData);
    static void             DestroyCurve(CurveIntfce& pData);

    static void             ConnectTimeWarp(FbxAnimCurveNode* pCurveNode, CurveNodeIntfce& pData, FbxMultiMap& pTimeWarpsKFCurveNodes);
    static void             MergeLayerAndTimeWarp(FbxObject* pObj, FbxAnimLayer* pAnimLayer);

    static void             CopyFrom(FbxAnimCurve* pAC, CurveIntfce& pFC);
    static bool             CompareCurves(FbxAnimCurve* pAC1, FbxAnimCurve* pAC2); 

    static void             Resample(FbxAnimCurve &pSourceCurve, FbxAnimCurve &pTargetCurve, FbxTime &pStart, FbxTime &pStop, FbxTime &pPeriod, FbxAnimCurveDef::EInterpolationType pInterpolation, FbxAnimCurveDef::ETangentMode pTangentMode, bool pAddStopKey = false);
    static void             Resample(FbxAnimCurve &pSourceCurve, FbxAnimCurve &pTargetCurve, FbxTime &pStart, FbxTime &pStop, FbxTime &pPeriod, bool pAddStopKey = false);
    static void             Resample(FbxAnimCurve &pCurve, FbxTime pPeriod, FbxTime pStart = FBXSDK_TIME_MINUS_INFINITE, FbxTime   pStop = FBXSDK_TIME_INFINITE, bool pKeysOnFrame = false);
};
 
#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_UTILITIES_H_ */
