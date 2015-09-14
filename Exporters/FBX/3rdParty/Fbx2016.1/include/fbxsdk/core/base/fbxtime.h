/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxtime.h
#ifndef _FBXSDK_CORE_BASE_TIME_H_
#define _FBXSDK_CORE_BASE_TIME_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxtimecode.h>
#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#define FBXSDK_TIME_INFINITE		FbxTime(FBXSDK_TC_INFINITY)
#define FBXSDK_TIME_MINUS_INFINITE	FbxTime(FBXSDK_TC_MINFINITY)
#define FBXSDK_TIME_ZERO			FbxTime(FBXSDK_TC_ZERO)
#define FBXSDK_TIME_EPSILON			FbxTime(FBXSDK_TC_EPSILON)
#define FBXSDK_TIME_ONE_SECOND		FbxTime(FBXSDK_TC_SECOND)
#define FBXSDK_TIME_ONE_MINUTE		FbxTime(FBXSDK_TC_MINUTE)
#define FBXSDK_TIME_ONE_HOUR		FbxTime(FBXSDK_TC_HOUR)
#define FBXSDK_TIME_ASSERT_EPSILON	0.5
#define FBXSDK_TIME_FORWARD			1
#define FBXSDK_TIME_BACKWARD		-1

class FbxTimeModeObject;

/** Class to encapsulate time units.
  * \nosubgrouping
  * FbxTime can measure time in hour, minute, second, frame, field, residual and also combination of these units.
  * It is recommended to use FbxTime for all time related operations. For example, currently it is used in FbxGlobalSettings,
  * FbxGlobalTimeSettings, FbxCache, all curve filters and all animation-related classes, etc.
  * FbxTime is just used to represent a moment, to represent a period of time, FbxTimeSpan should be used.
  * \see FbxTimeSpan
  */
class FBXSDK_DLL FbxTime 
{
public:
	/** Long long constructor.
	  * \param pTime Initial value defined as a 64bit integer.
	  */
	FbxTime(const FbxLongLong pTime=0){ mTime = pTime; }

	/**
	  * \name Time Modes and Protocols
	  */
    //@{
		/** Time modes.
		  * \remarks
		  * EMode \c eNTSCDropFrame is used for broadcasting operations where 
		  * clock time must be (almost) in sync with time code. To bring back color 
		  * NTSC time code with clock time, this mode drops 2 frames per minute
		  * except for every 10 minutes (00, 10, 20, 30, 40, 50). 108 frames are 
		  * dropped per hour. Over 24 hours the error is 2 frames and 1/4 of a 
		  * frame. A time-code of 01:00:03:18 equals a clock time of 01:00:00:00
		  * 
		  * \par
		  * EMode \c eNTSCFullFrame represents a time address and therefore is NOT 
		  * IN SYNC with clock time. A time code of 01:00:00:00 equals a clock time 
		  * of 01:00:03:18.
		  * 
		  * - \e eDefaultMode		
		  * - \e eFrames120			120 frames/s
		  * - \e eFrames100			100 frames/s
		  * - \e eFrames60          60 frames/s
		  * - \e eFrames50          50 frames/s
		  * - \e eFrames48          48 frame/s
		  * - \e eFrames30          30 frames/s (black and white NTSC)
		  * - \e eFrames30Drop		30 frames/s (use when display in frame is selected, equivalent to NTSC drop)
		  * - \e eNTSCDropFrame		~29.97 frames/s drop color NTSC
		  * - \e eNTSCFullFrame		~29.97 frames/s color NTSC
		  * - \e ePAL				25 frames/s	PAL/SECAM
		  * - \e eFrames24			24 frames/s Film/Cinema
		  * - \e eFrames1000		1000 milli/s (use for date time)
		  * - \e eFilmFullFrame		~23.976 frames/s
		  * - \e eCustom            Custom frame rate value
		  * - \e eFrames96			96 frames/s
		  * - \e eFrames72			72 frames/s
		  * - \e eFrames59dot94		~59.94 frames/s
		  * - \e eModesCount		Number of time modes
		  */
		enum EMode
		{
			eDefaultMode,
			eFrames120,
			eFrames100,
			eFrames60,
			eFrames50,
			eFrames48,
			eFrames30,
			eFrames30Drop,
			eNTSCDropFrame,
			eNTSCFullFrame,
			ePAL,
			eFrames24,
			eFrames1000,
			eFilmFullFrame,
			eCustom,
			eFrames96,
			eFrames72,
			eFrames59dot94,
			eModesCount
		};

		/** Time protocols enumaration
		  * - \e eSMPTE				SMPTE EProtocol
		  * - \e eFrameCount		Frame count
		  * - \e eDefaultProtocol	Default protocol (initialized to eFRAMES)
		  */
		enum EProtocol {eSMPTE, eFrameCount, eDefaultProtocol};

		/** Set default time mode.
		  * \param pTimeMode  Time mode identifier.
		  * \param pFrameRate Custom framerate, only have effect in case of pTimeMode = FbxTime::eCustom
		  * \remarks It is meaningless to set default time mode to \c eDefaultMode.
		  */
		static void SetGlobalTimeMode(EMode pTimeMode, double pFrameRate=0.0);

		/** Get default time mode.
		  * \return Currently set time mode identifier.
		  * \remarks Default time mode initial value is eFrames30.
		  */
		static EMode GetGlobalTimeMode();

		/** Set default time protocol.
		  * \param pTimeProtocol Time protocol identifier.
		  * \remarks It is meaningless to set default time protocol to \c eDefaultProtocol.
		  */
		static void SetGlobalTimeProtocol(EProtocol pTimeProtocol);

		/** Get default time protocol.
		  * \return Currently set time protocol identifier.
		  * \remarks Default time protocol initial value is eSMPTE.
		  */
		static EProtocol GetGlobalTimeProtocol();

		/** Get frame rate associated with time mode, in frames per second.
		  * \param pTimeMode Time mode identifier.
		  * \return Frame rate value.
		  */
		static double GetFrameRate(EMode pTimeMode);

		/** Get time mode associated with frame rate.
		  * \param pFrameRate The frame rate value.
		  * \param pPrecision The tolerance value.
		  * \return The corresponding time mode identifier or \c eDefaultMode if no time 
		  * mode associated to the given frame rate is found.
		  */
		static EMode ConvertFrameRateToTimeMode(double pFrameRate, double pPrecision=0.00000001);
	//@}
	
	/**
	  * \name Time Conversion
	  */
	//@{
		/** Set time in internal format.
		  * \param pTime Time value to set.
		  */
		inline void Set(FbxLongLong pTime){ mTime = pTime; }

		/** Get time in internal format.
		  * \return Time value.
		  */
		inline FbxLongLong Get() const { return mTime; }

		/** Set time in milliseconds.
		  * \param pMilliSeconds Time value to set.
		  */
		inline void SetMilliSeconds(FbxLongLong pMilliSeconds){ mTime = pMilliSeconds * FBXSDK_TC_MILLISECOND; }

		/** Get time in milliseconds.
		  * \return Time value.
		  */
		inline FbxLongLong GetMilliSeconds() const { return mTime / FBXSDK_TC_MILLISECOND; }

		/** Set time in seconds.
		  * \param pTime Time value to set.
		  */
		void SetSecondDouble(double pTime);

		/** Get time in seconds.
		  * \return Time value.
		  */
		double GetSecondDouble() const;

		/** Set time in hour/minute/second/frame/field format.
		  * \param pHour The hours value.
		  * \param pMinute    The minutes value.
		  * \param pSecond    The seconds value.
		  * \param pFrame     The frames values.
		  * \param pField     The field value.
		  * \param pTimeMode  Time mode identifier.
		  * \remarks Parameters pHour, pMinute, pSecond, pFrame and pField are summed together.
		  * For example, it is possible to set the time to 83 seconds in the following
		  * ways: SetTime(0,1,23) or SetTime(0,0,83).
		  */
		void SetTime(int pHour, int pMinute, int pSecond, int pFrame=0, int pField=0, EMode pTimeMode=eDefaultMode);

		/** Set time in hour/minute/second/frame/field/residual format.
		  * \param pHour The hours value.
		  * \param pMinute       The minutes value.
		  * \param pSecond       The seconds value.
		  * \param pFrame        The frames values.
		  * \param pField        The field value.
		  * \param pResidual     The hundredths of frame value.
		  * \param pTimeMode     Time mode identifier.
		  * \remarks Parameters pHour, pMinute, pSecond, pFrame, pField and pResidual 
		  * are summed together, just like above.
		  * pResidual represents hundredths of frame, and won't necessarily
		  * correspond to an exact internal value.
		  *
		  * \remarks The time mode can't have a default value, because
		  *         otherwise SetTime(int, int, int, int, int, int)
		  *         would be ambiguous. Please specify DEFAULT_MODE.
		  */
		void SetTime(int pHour, int pMinute, int pSecond, int pFrame, int pField, int pResidual, EMode pTimeMode);

		/** Get time in hour/minute/second/frame/field/residual format.
		  * \param pHour       The returned hours value.
		  * \param pMinute     The returned minutes value.
		  * \param pSecond     The returned seconds value.
		  * \param pFrame      The returned frames values.
		  * \param pField      The returned field value.
		  * \param pResidual   The returned hundredths of frame value.
		  * \param pTimeMode   The time mode identifier which will dictate the extraction algorithm.
		  * \return \c true if the pTimeMode parameter is a valid identifier and thus the extraction
		  * succeeded. If the function returns \c false, all the values are set to 0.
		  */
		bool GetTime(int& pHour, int& pMinute, int& pSecond, int& pFrame, int& pField, int& pResidual, EMode pTimeMode=eDefaultMode) const;

		/** Snaps a time value to the time value associated with the nearest frame.
		  * \param pRound  If \c true the return value is rounded to the nearest integer.
		  * \return        The snapped time value.
		  */
		FbxTime	GetFramedTime(bool pRound=true) const;

		/** Set time in frame format.
		  * \param pFrames The number of frames.
		  * \param pTimeMode The time mode identifier which will dictate the extraction algorithm.
		  */
		void SetFrame(FbxLongLong pFrames, EMode pTimeMode=eDefaultMode);

		/** Set time in frame format, including fractions.
		  * \param pFrames The number of frames in decimal value.
		  * \param pTimeMode The time mode identifier which will dictate the extraction algorithm.
		  */
		void SetFramePrecise(FbxDouble pFrames, EMode pTimeMode=eDefaultMode);

		/** Get number of hours in time.
		  * \return Hours value.
		  */
		int GetHourCount() const;

		/** Get number of minutes in time.
		  * \return Minutes value.
		  */
		int GetMinuteCount() const;

		/** Get number of seconds in time.
		  * \return Seconds value.
		  */
		int GetSecondCount() const;

		/** Get number of frames in time.
		  * \param pTimeMode Time mode identifier.
		  * \return Integer value representing the frame count.
		  */
		FbxLongLong GetFrameCount(EMode pTimeMode=eDefaultMode) const;

		/** Get precise number of frames in time, including fractions.
		  * \param pTimeMode Time mode identifier.
		  * \return Decimal value representing the frame count, including fractions.
		  */
		FbxDouble GetFrameCountPrecise(EMode pTimeMode=eDefaultMode) const;

		/** Get number of fields in time.
		  * \param pTimeMode Time mode identifier.
		  * \return Fields value.
		  */
		FbxLongLong GetFieldCount(EMode pTimeMode=eDefaultMode) const;

		/** Get residual time exceeding last full field.
		  * \param pTimeMode Time mode identifier.
		  * \return Residual value.
		  */
		int GetResidual(EMode pTimeMode=eDefaultMode) const;

		/** Test for Drop Frame mode
		  * \param pTimeMode Time mode identifier.
		  * \return True if the pTimeMode is a Drop Frame mode.
		  */
		static bool IsDropFrame(EMode pTimeMode=eDefaultMode);

		/** Separator char between second and frame.
		  * \param pTimeMode Time mode identifier.
		  * \return ';' is returned if pTimeMode is a DropFrame mode otherwise ':'.
		  */
		char GetFrameSeparator(EMode pTimeMode=eDefaultMode) const;

		/** Get time in a human readable format.
		  * \param pTimeString An array large enough to contain a minimum of 19 characters.
          * \param pTimeStringSize Size of the pTimeString buffer used with secure functions.
		  * \param pInfo The amount of information if time protocol is \c eSMPTE:
		  * <ul><li>1 means hours only
		  *     <li>2 means hours and minutes
		  *     <li>3 means hours, minutes and seconds
		  *     <li>4 means hours, minutes, seconds and frames
		  *     <li>5 means hours, minutes, seconds, frames and field
		  *     <li>6 means hours, minutes, seconds, frames, field and residual value</ul>
		  * \param pTimeMode Requested time mode.
		  * \param pTimeFormat Requested time protocol.
		  * \return pTimeString parameter filled with a time value or set to a empty string
		  * if parameter pInfo is not valid.
		  */
		char* GetTimeString(char* pTimeString, const FbxUShort& pTimeStringSize, int pInfo=5, EMode pTimeMode=eDefaultMode, EProtocol pTimeFormat=eDefaultProtocol) const;

		enum EElement {eHours, eMinutes, eSeconds, eFrames, eField, eResidual};

		/** Get the time in a human readable format.
		* \param pStart The starting element type used to format the time string.
		* \param pEnd The last element type used to format the time string.
		* \param pTimeMode The time mode requested.
		* \param pTimeFormat The time format requested.
		* \return The human readable time string. */
		FbxString GetTimeString(EElement pStart=eHours, EElement pEnd=eResidual, EMode pTimeMode=eDefaultMode, EProtocol pTimeFormat=eDefaultProtocol) const;

        /** Set time in a human readable format.
		  * \param pTime An array of a maximum of 18 characters.
		  * If time protocol is \c eSMPTE, pTimeString must be formatted this way:
		  * "[hours:]minutes[:seconds[.frames[.fields]]]". Hours, minutes, seconds, 
		  * frames and fields are parsed as integers and brackets indicate optional 
		  * parts. 
		  * If time protocol is \c eFRAME, pTimeString must be formatted this way:
		  * "frames". Frames is parsed as a 64 bits integer.
		  * \param pTimeMode   Given time mode.
		  * \param pTimeFormat Given time protocol.
		  * \return True if the set time string succeed, otherwise return false.
		  */
		bool SetTimeString(const char* pTime, EMode pTimeMode=eDefaultMode, EProtocol pTimeFormat=eDefaultProtocol);
    //@}

	/**
	  * \name Time Operators
	  */
	//@{
		/** Equality operator.
		  * \param pTime The FbxTime to be compared.
		  * \return \c true if equal, \c false otherwise.
		  */
		inline bool operator==(const FbxTime& pTime) const { return mTime == pTime.mTime; }

		/** Inequality operator.
		  * \param pTime The FbxTime to be compared.
		  * \return \c true if unequal, \c false otherwise.
		  */
		inline bool operator!=(const FbxTime& pTime) const { return mTime != pTime.mTime; }

		/** Superior or equal to operator.
		  * \param pTime The FbxTime to be compared.
		  * \return \c true if this FbxTime is superior or equal to the passed FbxTime, \c false otherwise.
		  */
		inline bool operator>=(const FbxTime& pTime) const { return mTime >= pTime.mTime; }

		/** Inferior or equal to operator.
		  * \param pTime The FbxTime to be compared.
		  * \return \c true if this FbxTime is inferior or equal to the passed FbxTime, \c false otherwise.
		  */
		inline bool operator<=(const FbxTime& pTime) const { return mTime <= pTime.mTime; }

		/** Superior to operator.
		  * \param pTime The FbxTime to be compared.
		  * \return \c true if this FbxTime is superior to the passed FbxTime, \c false otherwise.
		  */
		inline bool operator>(const FbxTime& pTime) const { return mTime > pTime.mTime; }

		/** Inferior to operator.
		  * \param pTime The FbxTime to be compared.
		  * \return \c true if this FbxTime is inferior to the passed FbxTime, \c false otherwise.
		  */
		inline bool operator<(const FbxTime& pTime) const { return mTime < pTime.mTime; } 

		/** Assignment operator.
		  * \param pTime The FbxTime to be assigned.
		  */
		inline FbxTime& operator=(const FbxTime& pTime) { mTime = pTime.mTime; return *this; }

		/** Addition operator.
		  * \param  pTime The FbxTime to be added.
		  * \return This FbxTime after addition.
		  */
		inline FbxTime& operator+=(const FbxTime& pTime) { mTime += pTime.mTime; return *this; }

		/** Subtraction operator.
		  * \param pTime The FbxTime to be subtracted.
		  * \return This FbxTime after subtraction.
		  */
		inline FbxTime& operator-=(const FbxTime& pTime) { mTime -= pTime.mTime; return *this; }

		/** Addition operator.
		  * \param pTime The FbxTime to be added.
		  * \return A temporary FbxTime after addition. 
		  */
		FbxTime operator+(const FbxTime& pTime) const;

		/** Subtraction operator.
		  * \param pTime The FbxTime to be subtracted.
		  * \return A temporary FbxTime after subtraction. 
		  */
		FbxTime operator-(const FbxTime& pTime) const;

		/** Multiplication operator.
		  * \param Mult Multiply this FbxTime by int Mult.
		  * \return A temporary FbxTime after multiplication. 
		  */
		FbxTime operator*(const int Mult) const;

		/** Division operator.
		  * \param pTime Divide this FbxTime by pTime.
		  * \return A temporary FbxTime after division. 
		  */
		FbxTime operator/(const FbxTime& pTime) const;

		/** Multiplication operator.
		  * \param pTime Multiply this FbxTime by pTime.
		  * \return A temporary FbxTime after multiplication. 
		  */
		FbxTime operator*(const FbxTime& pTime) const;
/*
		//! Increment time of one unit of the internal format (prefix form).
		inline FbxTime& operator++() { mTime += 1; return (*this); }

		//! Increment time of one unit of the internal format (postfix form).
		inline const FbxTime operator++(int) { FbxTime lOld = *this; ++(*this); return lOld; }

		//! Decrement time of one unit of the internal format (prefix form).
		inline FbxTime& operator--() { mTime -= 1; return (*this); }

		//! Decrement time of one unit of the internal format (postfix form).
		inline const FbxTime operator--(int) { FbxTime lOld = *this; --(*this); return lOld; }*/
	//@}

	/** One frame value for a specified time mode.
	  * \param pTimeMode Time mode identifier.
	  * \return the time code of a one frame.
	  */
	static FbxLongLong GetOneFrameValue(EMode pTimeMode=eDefaultMode);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	// Keep compatibility with old fbx format
	enum EOldMode
	{
		eOLD_DEFAULT_MODE,		//Default mode set using FbxTime::SetGlobalTimeMode(EMode pTimeMode)
		eOLD_CINEMA,			//24 frameOLD_s/s
		eOLD_PAL,				//25 frameOLD_s/s	 PAL/SECAM
		eOLD_FRAMES30,			//30 frameOLD_s/s	 BLACK & WHITE NTSC
		eOLD_NTSC_DROP_FRAME,   //29.97002617 frameOLD_s/s COLOR NTSC
		eOLD_FRAMES50,			//50 frameOLD_s/s
		eOLD_FRAMES60,			//60 frameOLD_s/s
		eOLD_FRAMES100,			//100 frameOLD_s/s
		eOLD_FRAMES120,			//120 frameOLD_s/s
		eOLD_NTSC_FULL_FRAME,	//29.97002617 frameOLD_s/s COLOR NTSC
		eOLD_FRAMES30_DROP,		//30 frameOLD_s/s
		eOLD_FRAMES1000			//1000 frameOLD_s/s
	};

private:
	FbxLongLong					mTime; //In 1 / 46,186,158,000 Seconds

	static EMode				gsGlobalTimeMode;
	static EProtocol			gsGlobalTimeProtocol;
	static FbxTimeModeObject*	gsTimeObject;

	void InternalSetTime(int pHour, int pMinute, int pSecond, FbxLongLong pFrame, int pField, EMode pTimeMode);

    friend FBXSDK_DLL FbxTime::EMode		FbxGetGlobalTimeMode();
	friend FBXSDK_DLL FbxTimeModeObject*	FbxGetGlobalTimeModeObject();
    friend FBXSDK_DLL FbxTime::EProtocol	FbxGetGlobalTimeFormat();
	friend FBXSDK_DLL void					FbxSetGlobalTimeMode(FbxTime::EMode pTimeMode, double pFrameRate);
    friend FBXSDK_DLL void					FbxSetGlobalTimeFormat(FbxTime::EProtocol pTimeFormat);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** FbxTime in seconds constructor.
  * \param pTime 
  */
FBXSDK_DLL inline FbxTime FbxTimeSeconds(const FbxDouble& pTime=0.0)
{
	FbxTime lTime;
	lTime.SetSecondDouble(pTime);
	return lTime;
}

/** Class to encapsulate time intervals.
  * \nosubgrouping
  * \see FbxTime 
  */
class FBXSDK_DLL FbxTimeSpan
{
public:
	//! Constructor.
	FbxTimeSpan() {}

	/** Constructor.
	  * \param pStart Beginning of the time interval.
	  * \param pStop  Ending of the time interval.
	  */
	FbxTimeSpan(FbxTime pStart, FbxTime pStop){ mStart = pStart; mStop = pStop; }

	/** Set start and stop time.
	  * \param pStart Beginning of the time interval.
	  * \param pStop  Ending of the time interval.
	  */
	inline void Set(FbxTime pStart, FbxTime pStop){ mStart = pStart; mStop = pStop; }

	/** Set start time.
	  * \param pStart Beginning of the time interval.
	  */
	inline void SetStart(FbxTime pStart){ mStart = pStart; }

	/** Set stop time.
	  * \param pStop  Ending of the time interval.
	  */
	inline void SetStop(FbxTime pStop){ mStop = pStop; }

	/** Get start time.
	  * \return Beginning of time interval.
	  */
	inline FbxTime GetStart() const { return mStart; }

	/** Get stop time.
	  * \return Ending of time interval.
	  */
	inline FbxTime GetStop() const { return mStop; }

	/** Get time interval in absolute value.
	  * \return Time interval.
	  */
	inline FbxTime GetDuration() const { if( mStop > mStart ) return mStop - mStart; else return mStart - mStop; }

	/** Get time interval.
	  * \return Signed time interval.
	  */
	inline FbxTime GetSignedDuration() const { return mStop - mStart; }

	/** Get direction of the time interval.
	  * \return \c FBXSDK_TIME_FORWARD if time interval is forward, \c FBXSDK_TIME_BACKWARD if backward.
	  */
	inline int GetDirection() const { if( mStop >= mStart ) return FBXSDK_TIME_FORWARD; else return FBXSDK_TIME_BACKWARD; }

	/** Return \c true if the time is inside the timespan.
	  * \param pTime Judge whether pTime is inside the timespan.
	  * \return \c True if is, \c false otherwise.
	  */
	bool IsInside(FbxTime pTime) const;

	/** Return the intersection of the two time spans.
	  * \param pTime 
	  * \return The intersection of pTime and this FbxTimeSpan.
	  */
	FbxTimeSpan Intersect(const FbxTimeSpan& pTime) const;

	/** Inequality operator.
	  * \param pTime FbxTimeSpan compared with this one.
	  * \return \c True if unequal, \c false otherwise.
	  */
	bool operator!=(const FbxTimeSpan& pTime) const;

	/** Equality operator.
	  * \param pTime FbxTimeSpan compared with this one.
	  * \return \c True if equal, \c false otherwise.
	  */
	bool operator==(const FbxTimeSpan& pTime) const;

	/** Unite with another FbxTimeSpan
	  * \param pSpan The FbxTimeSpan
	  * \param pDirection FBXSDK_TIME_FORWARD or FBXSDK_TIME_BACKWARD
	  * \remarks This function assumes both of the FbxTimeSpan objects are in the same direction.
	  * Use FBXSDK_TIME_FORWARD when start < stop in both timespan
	  * Use FBXSDK_TIME_BACKWARD when start > stop in both timespan
	  */
	void UnionAssignment(const FbxTimeSpan& pSpan, int pDirection=FBXSDK_TIME_FORWARD);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	FbxTime mStart;
	FbxTime mStop;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

class FBXSDK_DLL FbxLocalTime
{
public:
	FbxLocalTime();

	int mYear;
	int mMonth;
	int mDay;
	int mHour;
	int mMinute;
	int mSecond;
	int mMillisecond;
};

FBXSDK_DLL void					FbxGetCurrentLocalTime(FbxLocalTime& pLocalTime);

FBXSDK_DLL FbxTime::EMode		FbxGetGlobalTimeMode();
FBXSDK_DLL FbxTimeModeObject*	FbxGetGlobalTimeModeObject();
FBXSDK_DLL FbxTime::EProtocol	FbxGetGlobalTimeFormat();
FBXSDK_DLL void					FbxSetGlobalTimeMode(FbxTime::EMode pTimeMode, double pFrameRate=0.0);
FBXSDK_DLL void					FbxSetGlobalTimeFormat(FbxTime::EProtocol pTimeFormat);

// Use those functions to keep the compatibility with old time mode since we added new time mode.
FBXSDK_DLL FbxTime::EOldMode		FbxGetOldTimeModeCorrespondance(FbxTime::EMode pMode);
FBXSDK_DLL FbxTime::EMode		FbxGetTimeModeFromOldValue(FbxTime::EOldMode pOldMode);

// We now store the framerate instead of the time mode.
FBXSDK_DLL FbxTime::EMode		FbxGetTimeModeFromFrameRate(char* pFrameRate);
FBXSDK_DLL void					FbxGetControlStringList(char* pControlString, FbxTime::EProtocol pTimeFormat);
FBXSDK_DLL const char*			FbxGetGlobalFrameRateString(FbxTime::EMode pTimeMode);
FBXSDK_DLL const char*			FbxGetGlobalTimeModeString(FbxTime::EMode pTimeMode);
FBXSDK_DLL double				FbxGetFrameRate(FbxTime::EMode pTimeMode);

// Time format
FBXSDK_DLL FbxTime::EProtocol	FbxSelectionToTimeFormat(int pSelection);
FBXSDK_DLL FbxTime::EMode		FbxSelectionToTimeMode(int pSelection);
FBXSDK_DLL int					FbxTimeToSelection(FbxTime::EMode pTimeMode=FbxTime::eDefaultMode, int pTimeFormat=FbxTime::eDefaultProtocol);
FBXSDK_DLL const char*			FbxGetTimeModeName(FbxTime::EMode pTimeMode);
FBXSDK_DLL int					FbxGetFrameRateStringListIndex(FbxTime::EMode pTimeMode);
FBXSDK_DLL bool					FbxIsValidCustomFrameRate(double pFramerate);
FBXSDK_DLL bool					FbxGetNearestCustomFrameRate(double pFramerate, double& pNearestRate);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_TIME_H_ */
