/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsystemunit.h
#ifndef _FBXSDK_CORE_SYSTEM_UNIT_H_
#define _FBXSDK_CORE_SYSTEM_UNIT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxarray.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxAMatrix;
class FbxScene;
class FbxNode;
class FbxAnimCurveNode;

/** \brief This class describes the units of measurement used within a particular scene.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxSystemUnit 
{
public:

    /** Struct to define various options that you can use to convert the system unit of a scene.
      * The default values are:
      *         mConvertRrsNodes = true
      *         mConvertLimits = true
      *         mConvertClusters = true
      *         mConvertLightIntensity = true
      *         mConvertPhotometricLProperties = true
      *         mConvertCameraClipPlanes = true
      *
      * The default configuration have been tested to give the best conversion results in the majority of the case. 
      * \remark Changing any of these values will have a direct impact on the whole scene behavior. 
      */
    struct ConversionOptions
    {
        //! This flag indicates whether or not to convert the nodes that do not inherit their parent's scale.
        bool mConvertRrsNodes;  

        //! This flag indicates whether or not to convert limits.
        bool mConvertLimits;

        //! This flag indicates whether or not to convert clusters.
        bool mConvertClusters;

        //! This flag indicates whether or not to convert the light intensity property.
        bool mConvertLightIntensity;	

        //! This flag indicates whether or not to convert photometric lights properties.
        bool mConvertPhotometricLProperties;

        //! This flag indicates whether or not to convert the cameras clip planes.
        bool mConvertCameraClipPlanes;
    };

	FbxSystemUnit();

    /** Constructor.
      * \param pScaleFactor The equivalent number of centimeters in the new system unit. 
      *                     For example, an inch unit uses a scale factor of 2.54.
      * \param pMultiplier  A multiplier factor of pScaleFactor.
      */
    FbxSystemUnit(double pScaleFactor, double pMultiplier = 1.0);

    /** Destructor.
      */
    ~FbxSystemUnit();

    //! Predefined system unit for millimeters.
    static const FbxSystemUnit mm;

    //! Predefined system unit for decimeters.
    static const FbxSystemUnit dm;

    //! Predefined system unit for centimeters.
    static const FbxSystemUnit cm;

    //! Predefined system unit for meters.
    static const FbxSystemUnit m;

    //! Predefined system unit for kilometers.
    static const FbxSystemUnit km;

    //! Predefined system unit for inches.
    static const FbxSystemUnit Inch;

    //! Predefined system unit for feet.
    static const FbxSystemUnit Foot;
    
    //! Predefined system unit for miles.
    static const FbxSystemUnit Mile;

    //! Predefined system unit for yards.
    static const FbxSystemUnit Yard;

    #define FBXSDK_SYSTEM_UNIT_PREDEF_COUNT 9

    //! Points to a FbxSystemUnit array to store the predefined system units. The array size is FBXSDK_SYSTEM_UNIT_PREDEF_COUNT.
    static const FbxSystemUnit *sPredefinedUnits;

    //! Stores the default conversion options.
    static const ConversionOptions DefaultConversionOptions;

    /** Converts a scene from its system units to this system unit.
      * \param pScene The scene to convert.
      * \param pOptions Conversion options, see:FbxSystemUnit::ConversionOptions.
      */
    void ConvertScene( FbxScene* pScene, const ConversionOptions& pOptions = DefaultConversionOptions ) const;

    /** Converts the child (or children) of the given node from the system unit to this system unit.
      * Unlike the ConvertScene() method, this method does not set the axis system 
      * of the scene to which the pRoot node belongs. It also does not adjust FbxPose
      * as they are not stored under the scene, and not under a particular node.
      * \param pRoot The given node.
      * \param pSrcUnit The source system unit.
      * \param pOptions Conversion options, see:FbxSystemUnit::ConversionOptions.
      */
    void ConvertChildren( FbxNode* pRoot, const FbxSystemUnit& pSrcUnit, const ConversionOptions& pOptions = DefaultConversionOptions ) const;

    /** Converts a scene from its system unit to this system unit, using the specified 
      * Fbx_Root node. This method is provided for backwards compatibility only
      * and instead you should use ConvertScene( FbxScene* , const ConversionOptions&  ) whenever possible.
      * \param pScene The scene to convert.
      * \param pFbxRoot The Fbx_Root node to use for conversion.
      * \param pOptions Conversion options, see:FbxSystemUnit::ConversionOptions
      */
    void ConvertScene( FbxScene* pScene, FbxNode* pFbxRoot, const ConversionOptions& pOptions = DefaultConversionOptions ) const;

    /** Returns the system unit's scale factor, relative to centimeters.
      * This factor scales system unit values to centimeters. If you want to scale values to centimeters, use this value.
      * Ignore the "multiplier" (returned by GetMultiplier()) value. 
      * \return The the system unit's scale factor, relative to centimeters.
      */
    double GetScaleFactor() const;

    /** Returns a unit label for the current scale factor.
      * \param pAbbreviated If \c true, returns abbreviated string. 
      * \return The unit label for the current scale factor.
      */
    FbxString GetScaleFactorAsString(bool pAbbreviated = true) const;

    /** Returns a unit label for the current scale factor. 
      * The first letter of the label is in upper case and the label should be pluralized. 
      * \return The unit label for the current scale factor.
      */
    FbxString GetScaleFactorAsString_Plurial() const;

    /** Returns the multiplier factor of the system unit.
      */
    double GetMultiplier() const;

    /** Equivalence operator.
      * \param pOther Another system unit compared with this system unit.
      * \return \c True if equal, \c false otherwise.
      */   
    bool operator==(const FbxSystemUnit& pOther) const;

    /** Non-equivalence operator.
      * \param pOther Another system unit compared with this system unit.
      * \return \c True if unequal, \c false otherwise.
      */  
    bool operator!=(const FbxSystemUnit& pOther) const;

    /** Assignment operation.
      * \param pSystemUnit Unit system assigned to this one.
      */
	FbxSystemUnit& operator=(const FbxSystemUnit& pSystemUnit);

    /** Returns the conversion factor from this system unit to the target system unit, excluding the multiplier factor.
      * \param pTarget The target system unit.
      */
    double GetConversionFactorTo( const FbxSystemUnit& pTarget ) const;

    /** Returns the conversion factor from the source system unit to this system unit, excluding the multiplier factor.
      * \param pSource The source system unit.
      */
    double GetConversionFactorFrom( const FbxSystemUnit& pSource ) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    void ApplyMultiplier(FbxNode* pRoot, bool pSubChildrenOnly) const;
    void ConvertSTProperties(FbxArray<FbxNode*>& pNodes, double pConversionFactor) const;
    void ConvertSProperty(FbxArray<FbxNode*>& pNodes, double pConversionFactor) const;
    void ConvertAnimCurveNode(FbxArray<FbxAnimCurveNode*>& pFCurves, double pConversionFactor) const;
    double GetConversionFactor(double pTargetScaleFactor, double pSourceScaleFactor) const;
    void AdjustPivots(FbxNode* pNode, double pConversionFactor, FbxAMatrix& pOriginalGlobalM ) const;
    void AdjustLimits(FbxNode* pNode, double pConversionFactor) const;
    void AdjustPoses(FbxScene* pScene, double pConversionFactor) const;
    void AdjustCluster(FbxNode* pNode, double pConversionFactor) const;
    void AdjustLightIntensity(FbxNode* pNode, const double pConversionFactor) const;
    void AdjustPhotometricLightProperties(FbxNode* pNode, const double pConversionFactor) const;
    void AdjustCameraClipPlanes(FbxNode* pNode, const double pConversionFactor) const;
    void ConvertChildren(FbxNode* pRoot, const FbxSystemUnit& pSrcUnit, bool pSubChildrenOnly, const ConversionOptions& pOptions) const;

    double mScaleFactor;
    double mMultiplier;

    friend class FbxGlobalSettings;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_SYSTEM_UNIT_H_ */
