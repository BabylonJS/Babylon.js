/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcolladaanimationelement.h
#ifndef _FBXSDK_FILEIO_COLLADA_ANIMATION_ELEMENT_H_
#define _FBXSDK_FILEIO_COLLADA_ANIMATION_ELEMENT_H_

#include <fbxsdk.h>

#include <fbxsdk/fileio/collada/fbxcolladaelement.h>

#include <map>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Representing a COLLADA animation element.
  */
class AnimationElement : public ElementBase
{
public:
    typedef ElementBase base_type;

    AnimationElement();
    virtual ~AnimationElement();

    /** Get the count of animation channels in the element.
      * \return Return the channel count.
      */
    int GetChannelCount() const;

    /** Initialize with the content of a COLLADA element.
      * This method should be called before ToFBX.
      */
    void FromCOLLADA(xmlNode * pElement, const SourceElementMapType & pSourceElements);

    /** Initialize with an animation curve.
      * This method should be called before ToCOLLADA.
      * \param pCurve The specific animation curve.
      * \param pUnitConversion The unit conversion for key value.
      */
    void FromFBX(const FbxAnimCurve * pCurve, double pUnitConversion = 1.0);

    /** Copy the channel with specific index to the FBX animation curve.
      * \param pFBXCurve The destination FBX animation curve.
      * \param pChannelIndex The index of the source channel.
      * \param pUnitConversion The unit conversion from local element to global.
      */
    void ToFBX(FbxAnimCurve * pFBXCurve, int pChannelIndex,
        double pUnitConversion = 1.0) const;

    /** Copy the matrix animation to the FBX node TRS properties.
      * \param pFBXNode The destination FBX node.
      * \param pAnimLayer The animation layer whose X, Y and Z curves will be set up.
      * \param pUnitConversion The unit conversion from local element to global.
      */
    void ToFBX(FbxNode * pFBXNode, FbxAnimLayer * pAnimLayer,
        double pUnitConversion = 1.0) const;

    /** Add the content to COLLADA animation library.
      * \param pAnimationLibrary The COLLADA animation library element.
      * \param pNodeID The ID of the element to who this curve is belong.
      * \param pAttributeSID The ID the attribute to who this curve is belong.
      */
    void ToCOLLADA(xmlNode * pAnimationLibrary, const char * pNodeID,
        const char * pAttributeSID);

private:
    int mKeyCount;
    double * mInputArray;
    double * mOutputArray;
    int mOutputStride;
    FbxString * mInterpolationArray;
    int mInterpolationStride;
    double * mInTangentArray;
    int mInTangentStride;
    double * mOutTangentArray;
    int mOutTangentStride;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_ANIMATION_ELEMENT_H_ */
