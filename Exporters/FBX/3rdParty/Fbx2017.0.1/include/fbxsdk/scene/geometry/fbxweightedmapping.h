/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxweightedmapping.h
#ifndef _FBXSDK_SCENE_GEOMETRY_WEIGHTED_MAPPING_H_
#define _FBXSDK_SCENE_GEOMETRY_WEIGHTED_MAPPING_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	Define a weighted bidirectional mapping relation on objects.
  * \nosubgrouping
  * There are two object set. The source object of mapping is in source set. 
  * The destination object is in destination set.
  * Each object can have multiple mapping relation with other objects.
  */
class FBXSDK_DLL FbxWeightedMapping
{
public:
	/** Object set type in the mapping relation.   
     */
    enum ESet
	{
		eSource,        //!< Object is as source.
		eDestination    //!< Object is as destination. 
	};

	/** Record one mapping from one object.  */
    struct Element
	{
		//! The index of another object in the mapping in the another ESet array.
        int mIndex;
        //! Weight of the mapping.
		double mWeight;
	};

	/** 
	  * \name Constructor and Destructor
	  */
	//@{

	/** Constructor.
      * Initialize the source set and destination set.
	  * \param pSourceSize       Source set size
	  * \param pDestinationSize  Destination set size
	  */
	FbxWeightedMapping(int pSourceSize, int pDestinationSize);

	//! Destructor.
	~FbxWeightedMapping();
    //@}


	/** Remove all weighted relations and give new source and destination sets sizes.
	  * \param pSourceSize       New source set size.
	  * \param pDestinationSize  New destination set size.
	  */
	void Reset(int pSourceSize, int pDestinationSize);

	/** Add a weighted mapping relation.
	  * \param pSourceIndex         Index of the source object.  
	  * \param pDestinationIndex    Index of the destination object.  
	  * \param pWeight              Weight of the mapping.           
	  */
	void Add(int pSourceIndex, int pDestinationIndex, double pWeight);

	/** Get the number of elements of a set.
	  * \param pSet source or destination set.              
	  */
	int GetElementCount(ESet pSet) const;

	/** Get the number of relations an element of a set is linked to.
      * For example, for one object (which index is specified by pElement) in source set (specified by pSet),
      * the function return how many objects (as destination) the object (as source) mapping to.
	  * \param pSet     Source or destination set.              
	  * \param pElement Object index in the set.          
	  */
	int GetRelationCount(ESet pSet, int pElement) const;

	/** Get one of the relations an element of a set is linked to.
	  * \param pSet         Source or destination set.                 
	  * \param pElement     Object index in the set.          
	  * \param pIndex       Relation index of the object linked to.
	  * \return                  Element gives the index of an element in the other set and the assigned weight.
	  */
	Element& GetRelation(ESet pSet, int pElement, int pIndex);

	/** Given the index of an element in the other set, get the index of one of the relations 
	  *  an element of a set is linked to. Returns -1 if there is not relation between these elements.
	  * \param pSet             Source or destination set.  
	  * \param pElementInSet    Object index in the set.
	  * \param pElementInOtherSet   Object index in another set.
	  * \return                  The index of one of the relations, -1 if there is not relation between these elements.         
	  */
	int GetRelationIndex(ESet pSet, int pElementInSet, int pElementInOtherSet) const;

	/** Get the sum of the weights from the relations an element of a set is linked to.
	  * \param pSet             Source or destination set.  
	  * \param pElement         Object index in the set.
	  * \param pAbsoluteValue   Flag to convert negative value to positive value.
	  * \return                 The sum of the weights  from the relations.
	  */
	double GetRelationSum(ESet pSet, int pElement, bool pAbsoluteValue) const;
	

	/** Normalize the weights of the relations of all the elements of a set.
	  * \param pSet             Source or destination set. 
	  * \param pAbsoluteValue   Flag to convert negative value to positive value.
	  */
	void Normalize(ESet pSet, bool pAbsoluteValue);
	
    FbxWeightedMapping& operator=(const FbxWeightedMapping& pWMap);

private:

	//! Remove all weighted relations.
	void Clear();

	FbxArray<FbxArray<Element>*> mElements[2];

};		

typedef class FbxArray<FbxWeightedMapping::Element> FbxArrayTemplateElement;
typedef class FbxArray<FbxArray<FbxWeightedMapping::Element>*> FbxArrayTemplateArrayTemplateElement;

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_WEIGHTED_MAPPING_H_ */
