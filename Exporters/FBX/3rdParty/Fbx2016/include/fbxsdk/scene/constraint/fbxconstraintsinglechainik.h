/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxconstraintsinglechainik.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_SINGLE_CHAIN_IK_H_
#define _FBXSDK_SCENE_CONSTRAINT_SINGLE_CHAIN_IK_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/constraint/fbxconstraint.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief This constraint class contains methods for accessing the properties of a single chain IK constraint.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxConstraintSingleChainIK : public FbxConstraint
{
    FBXSDK_OBJECT_DECLARE(FbxConstraintSingleChainIK, FbxConstraint);

public:
    /** Solver pole vector mode.
      */
    enum ESolverMode
    {
        eRotatePlane,	//! Rotate plane solver.
        eSingleChain	//! Single chain solver.
    };

    /** Pole vector mode.
      */
    enum EPoleVectorMode
    {
        eVector,	//! Pole vector type is vector.
        eObject		//! Pole vector type is object.
    };

	/** If the constraints read its animation on Translation and Scale for the nodes it constraints.
	  */
	enum EEvaluationMode
	{
		eNeverTS,		//! The constraints never read its animation on translation and scale for the nodes.
		eAutoDetect,	//! The constraints read its animation on translation and scale for the nodes according to automatic detection.
		eAlwaysTS		//! The constraints always read its animation on translation and scale for the nodes.
	};

	/**
	  * \name Properties
	  */
	//@{            
		/** This property handles pole vector type.
		  */
		FbxPropertyT<FbxEnum>        PoleVectorType;

		/** This property handles solver type.
		  */
		FbxPropertyT<FbxEnum>        SolverType;

		/** This property handles evaluate TS animation.
		  */
		FbxPropertyT<FbxEnum>        EvaluateTSAnim;

		/** This property handles pole vector objects.
		  */
		FbxPropertyT<FbxReference>    PoleVectorObjects;

		/** This property handles pole vector.
		  *
		  * Default value is (0, 1, 0).
		  */
		FbxPropertyT<FbxDouble3>    PoleVector;

		/** This property handles twist value.
		  *
		  * Default value is 0.
		  */
		FbxPropertyT<FbxDouble>    Twist;

		/** This property handles first joint object.
		  */
		FbxPropertyT<FbxReference> FirstJointObject;

		/** This property handles end joint object.
		  */
		FbxPropertyT<FbxReference> EndJointObject;

		/** This property handles effector object.
		  */
		FbxPropertyT<FbxReference> EffectorObject;
	//@}

    /** Get the weight of a source.
      * \param pObject     Source object that we want the weight.
      */
    double GetPoleVectorObjectWeight(const FbxObject* pObject) const;

    /** Add a source to the constraint.
      * \param pObject     New source object.
      * \param pWeight     Weight value of the source object expressed as a percentage.
      * \remarks           pWeight value is 100 percent by default.
      */
    void AddPoleVectorObject(FbxObject* pObject, double pWeight = 100);

    /** Retrieve the constraint source count.
      * \return     Current constraint source count.
      */
    int GetConstraintPoleVectorCount() const;

    /** Retrieve a constraint source object.
      * \param pIndex     Index of constraint source object.
      * \return           Current source at the specified index.
      */
    FbxObject* GetPoleVectorObject(int pIndex) const;

    /** Set the first joint object.
      * \param pObject     The first joint object.
      */
    void SetFirstJointObject(FbxObject* pObject);

    /** Retrieve the first joint object.
      * \return Current first joint object.
      */
    FbxObject* GetFirstJointObject() const;

    /** Set the end joint object.
      * \param pObject     The end joint object.
      */
    void SetEndJointObject(FbxObject* pObject);

    /** Retrieve the end joint object.
      * \return     Current end joint object.
      */
    FbxObject* GetEndJointObject() const;

    /** Set the effector object.
      * \param pObject     The effector object.
      */
    void SetEffectorObject(FbxObject* pObject);

    /** Retrieve the effector object.
      * \return     Current effector object.
      */
    FbxObject* GetEffectorObject() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);
    virtual EType GetConstraintType() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxConstraintSingleChainIK::EPoleVectorMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxConstraintSingleChainIK::ESolverMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxConstraintSingleChainIK::EEvaluationMode&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_SINGLE_CHAIN_IK_H_ */
