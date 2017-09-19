// ==========================================================
// FreeImage 3 .NET wrapper
// Original FreeImage 3 functions and .NET compatible derived functions
//
// Design and implementation by
// - Jean-Philippe Goerke (jpgoerke@users.sourceforge.net)
// - Carsten Klein (cklein05@users.sourceforge.net)
//
// Contributors:
// - David Boland (davidboland@vodafone.ie)
//
// Main reference : MSDN Knowlede Base
//
// This file is part of FreeImage 3
//
// COVERED CODE IS PROVIDED UNDER THIS LICENSE ON AN "AS IS" BASIS, WITHOUT WARRANTY
// OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES
// THAT THE COVERED CODE IS FREE OF DEFECTS, MERCHANTABLE, FIT FOR A PARTICULAR PURPOSE
// OR NON-INFRINGING. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE COVERED
// CODE IS WITH YOU. SHOULD ANY COVERED CODE PROVE DEFECTIVE IN ANY RESPECT, YOU (NOT
// THE INITIAL DEVELOPER OR ANY OTHER CONTRIBUTOR) ASSUME THE COST OF ANY NECESSARY
// SERVICING, REPAIR OR CORRECTION. THIS DISCLAIMER OF WARRANTY CONSTITUTES AN ESSENTIAL
// PART OF THIS LICENSE. NO USE OF ANY COVERED CODE IS AUTHORIZED HEREUNDER EXCEPT UNDER
// THIS DISCLAIMER.
//
// Use at your own risk!
// ==========================================================

// ==========================================================
// CVS
// $Revision: 1.5 $
// $Date: 2009/02/27 16:36:23 $
// $Id: FIURational.cs,v 1.5 2009/02/27 16:36:23 cklein05 Exp $
// ==========================================================

using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FIURational</b> structure represents a fraction via two <see cref="UInt32"/>
	/// instances which are interpreted as numerator and denominator.
	/// </summary>
	/// <remarks>
	/// The structure tries to approximate the value of <see cref="FreeImageAPI.FIURational(decimal)"/>
	/// when creating a new instance by using a better algorithm than FreeImage does.
	/// <para/>
	/// The structure implements the following operators:
	/// +, ++, --, ==, != , >, >==, &lt;, &lt;== and ~ (which switches nominator and denomiator).
	/// <para/>
	/// The structure can be converted into all .NET standard types either implicit or
	/// explicit.
	/// </remarks>
	[Serializable, StructLayout(LayoutKind.Sequential), ComVisible(true)]
	public struct FIURational : IConvertible, IComparable, IFormattable, IComparable<FIURational>, IEquatable<FIURational>
	{
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private uint numerator;

		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private uint denominator;

		/// <summary>
		/// Represents the largest possible value of <see cref="FIURational"/>. This field is constant.
		/// </summary>
		public static readonly FIURational MaxValue = new FIURational(UInt32.MaxValue, 1u);

		/// <summary>
		/// Represents the smallest possible value of <see cref="FIURational"/>. This field is constant.
		/// </summary>
		public static readonly FIURational MinValue = new FIURational(0u, 1u);

		/// <summary>
		/// Represents the smallest positive <see cref="FIURational"/> value greater than zero. This field is constant.
		/// </summary>
		public static readonly FIURational Epsilon = new FIURational(1u, UInt32.MaxValue);

		/// <summary>
		/// Initializes a new instance based on the specified parameters.
		/// </summary>
		/// <param name="n">The numerator.</param>
		/// <param name="d">The denominator.</param>
		public FIURational(uint n, uint d)
		{
			numerator = n;
			denominator = d;
			Normalize();
		}

		/// <summary>
		/// Initializes a new instance based on the specified parameters.
		/// </summary>
		/// <param name="tag">The tag to read the data from.</param>
		public unsafe FIURational(FITAG tag)
		{
			switch (FreeImage.GetTagType(tag))
			{
				case FREE_IMAGE_MDTYPE.FIDT_RATIONAL:
					uint* pvalue = (uint*)FreeImage.GetTagValue(tag);
					numerator = pvalue[0];
					denominator = pvalue[1];
					Normalize();
					return;
				default:
					throw new ArgumentException("tag");
			}
		}

		/// <summary>
		///Initializes a new instance based on the specified parameters.
		/// </summary>
		/// <param name="value">The value to convert into a fraction.</param>
		/// <exception cref="OverflowException">
		/// <paramref name="value"/> cannot be converted into a fraction
		/// represented by two unsigned integer values.</exception>
		public FIURational(decimal value)
		{
			try
			{
				if (value < 0)
				{
					throw new OverflowException("value");
				}
				try
				{
					int[] contFract = CreateContinuedFraction(value);
					CreateFraction(contFract, out numerator, out denominator);
					Normalize();
				}
				catch
				{
					numerator = 0;
					denominator = 1;
				}
				if (Math.Abs(((decimal)numerator / (decimal)denominator) - value) > 0.0001m)
				{
					int maxDen = (Int32.MaxValue / (int)value) - 2;
					maxDen = maxDen < 10000 ? maxDen : 10000;
					ApproximateFraction(value, maxDen, out numerator, out denominator);
					Normalize();
					if (Math.Abs(((decimal)numerator / (decimal)denominator) - value) > 0.0001m)
					{
						throw new OverflowException("Unable to convert value into a fraction");
					}
				}
				Normalize();
			}
			catch (Exception ex)
			{
				throw new OverflowException("Unable to calculate fraction.", ex);
			}
		}

		/// <summary>
		/// The numerator of the fraction.
		/// </summary>
		public uint Numerator
		{
			get { return numerator; }
		}

		/// <summary>
		/// The denominator of the fraction.
		/// </summary>
		public uint Denominator
		{
			get { return denominator; }
		}

		/// <summary>
		/// Returns the truncated value of the fraction.
		/// </summary>
		/// <returns></returns>
		public int Truncate()
		{
			return denominator > 0 ? (int)(numerator / denominator) : 0;
		}

		/// <summary>
		/// Returns whether the fraction is representing an integer value.
		/// </summary>
		public bool IsInteger
		{
			get
			{
				return (denominator == 1 ||
					(denominator != 0 && (numerator % denominator == 0)) ||
					(denominator == 0 && numerator == 0));
			}
		}

		/// <summary>
		/// Calculated the greatest common divisor of 'a' and 'b'.
		/// </summary>
		private static ulong Gcd(ulong a, ulong b)
		{
			ulong r;
			while (b > 0)
			{
				r = a % b;
				a = b;
				b = r;
			}
			return a;
		}

		/// <summary>
		/// Calculated the smallest common multiple of 'a' and 'b'.
		/// </summary>
		private static ulong Scm(uint n, uint m)
		{
			return (ulong)n * (ulong)m / Gcd(n, m);
		}

		/// <summary>
		/// Normalizes the fraction.
		/// </summary>
		private void Normalize()
		{
			if (denominator == 0)
			{
				numerator = 0;
				denominator = 1;
				return;
			}

			if (numerator != 1 && denominator != 1)
			{
				uint common = (uint)Gcd(numerator, denominator);
				if (common != 1 && common != 0)
				{
					numerator /= common;
					denominator /= common;
				}
			}
		}

		/// <summary>
		/// Normalizes a fraction.
		/// </summary>
		private static void Normalize(ref ulong numerator, ref ulong denominator)
		{
			if (denominator == 0)
			{
				numerator = 0;
				denominator = 1;
			}
			else if (numerator != 1 && denominator != 1)
			{
				ulong common = Gcd(numerator, denominator);
				if (common != 1)
				{
					numerator /= common;
					denominator /= common;
				}
			}
		}

		/// <summary>
		/// Returns the digits after the point.
		/// </summary>
		private static int GetDigits(decimal value)
		{
			int result = 0;
			value -= decimal.Truncate(value);
			while (value != 0)
			{
				value *= 10;
				value -= decimal.Truncate(value);
				result++;
			}
			return result;
		}

		/// <summary>
		/// Creates a continued fraction of a decimal value.
		/// </summary>
		private static int[] CreateContinuedFraction(decimal value)
		{
			int precision = GetDigits(value);
			decimal epsilon = 0.0000001m;
			List<int> list = new List<int>();
			value = Math.Abs(value);

			byte b = 0;

			list.Add((int)value);
			value -= ((int)value);

			while (value != 0m)
			{
				if (++b == byte.MaxValue || value < epsilon)
				{
					break;
				}
				value = 1m / value;
				if (Math.Abs((Math.Round(value, precision - 1) - value)) < epsilon)
				{
					value = Math.Round(value, precision - 1);
				}
				list.Add((int)value);
				value -= ((int)value);
			}
			return list.ToArray();
		}

		/// <summary>
		/// Creates a fraction from a continued fraction.
		/// </summary>
		private static void CreateFraction(int[] continuedFraction, out uint numerator, out uint denominator)
		{
			numerator = 1;
			denominator = 0;
			uint temp;

			for (int i = continuedFraction.Length - 1; i > -1; i--)
			{
				temp = numerator;
				numerator = (uint)(continuedFraction[i] * numerator + denominator);
				denominator = temp;
			}
		}

		/// <summary>
		/// Tries 'brute force' to approximate <paramref name="value"/> with a fraction.
		/// </summary>
		private static void ApproximateFraction(decimal value, int maxDen, out uint num, out uint den)
		{
			num = 0;
			den = 0;
			decimal bestDifference = 1m;
			decimal currentDifference = -1m;
			int digits = GetDigits(value);

			if (digits <= 9)
			{
				uint mul = 1;
				for (int i = 1; i <= digits; i++)
				{
					mul *= 10;
				}
				if (mul <= maxDen)
				{
					num = (uint)(value * mul);
					den = mul;
					return;
				}
			}

			for (uint u = 1; u <= maxDen; u++)
			{
				uint numerator = (uint)Math.Floor(value * (decimal)u + 0.5m);
				currentDifference = Math.Abs(value - (decimal)numerator / (decimal)u);
				if (currentDifference < bestDifference)
				{
					num = numerator;
					den = u;
					bestDifference = currentDifference;
				}
			}
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FIURational"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return ((IConvertible)this).ToDouble(null).ToString();
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="FIURational"/> structure
		/// and is equivalent to this <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIURational"/> structure
		/// equivalent to this <see cref="FIURational"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is FIURational) && (this == ((FIURational)obj)));
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FIURational"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FIURational"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		#region Operators

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator +(FIURational value)
		{
			return value;
		}

		/// <summary>
		/// Returns the reciprocal value of this instance.
		/// </summary>
		public static FIURational operator ~(FIURational value)
		{
			uint temp = value.denominator;
			value.denominator = value.numerator;
			value.numerator = temp;
			value.Normalize();
			return value;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator ++(FIURational value)
		{
			checked
			{
				value.numerator += value.denominator;
			}
			return value;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator --(FIURational value)
		{
			checked
			{
				value.numerator -= value.denominator;
			}
			return value;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator +(FIURational left, FIURational right)
		{
			ulong numerator = 0;
			ulong denominator = Scm(left.denominator, right.denominator);
			numerator = (left.numerator * (denominator / left.denominator)) +
						(right.numerator * (denominator / right.denominator));
			Normalize(ref numerator, ref denominator);
			checked
			{
				return new FIURational((uint)numerator, (uint)denominator);
			}
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator -(FIURational left, FIURational right)
		{
			checked
			{
				if (left.denominator != right.denominator)
				{
					uint denom = left.denominator;
					left.numerator *= right.denominator;
					left.denominator *= right.denominator;
					right.numerator *= denom;
					right.denominator *= denom;
				}
				left.numerator -= right.numerator;
				left.Normalize();
				return left;
			}
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator *(FIURational left, FIURational r2)
		{
			ulong numerator = left.numerator * r2.numerator;
			ulong denominator = left.denominator * r2.denominator;
			Normalize(ref numerator, ref denominator);
			checked
			{
				return new FIURational((uint)numerator, (uint)denominator);
			}
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator /(FIURational left, FIURational right)
		{
			uint temp = right.denominator;
			right.denominator = right.numerator;
			right.numerator = temp;
			return left * right;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIURational operator %(FIURational left, FIURational right)
		{
			right.Normalize();
			if (Math.Abs(right.numerator) < right.denominator)
				return new FIURational(0, 0);
			int div = (int)(left / right);
			return left - (right * div);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator ==(FIURational left, FIURational right)
		{
			left.Normalize();
			right.Normalize();
			return (left.numerator == right.numerator) && (left.denominator == right.denominator);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator !=(FIURational left, FIURational right)
		{
			left.Normalize();
			right.Normalize();
			return (left.numerator != right.numerator) || (left.denominator != right.denominator);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator >(FIURational left, FIURational right)
		{
			ulong denominator = Scm(left.denominator, right.denominator);
			return (left.numerator * (denominator / left.denominator)) >
				(right.numerator * (denominator / right.denominator));
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator <(FIURational left, FIURational right)
		{
			ulong denominator = Scm(left.denominator, right.denominator);
			return (left.numerator * (denominator / left.denominator)) <
				(right.numerator * (denominator / right.denominator));
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator >=(FIURational left, FIURational right)
		{
			ulong denominator = Scm(left.denominator, right.denominator);
			return (left.numerator * (denominator / left.denominator)) >=
				(right.numerator * (denominator / right.denominator));
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator <=(FIURational left, FIURational right)
		{
			ulong denominator = Scm(left.denominator, right.denominator);
			return (left.numerator * (denominator / left.denominator)) <=
				(right.numerator * (denominator / right.denominator));
		}

		#endregion

		#region Conversions

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="Boolean"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Boolean"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator bool(FIURational value)
		{
			return (value.numerator != 0);
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="Byte"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Byte"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator byte(FIURational value)
		{
			return (byte)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="Char"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Char"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator char(FIURational value)
		{
			return (char)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="Decimal"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Decimal"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator decimal(FIURational value)
		{
			return value.denominator == 0 ? 0m : (decimal)value.numerator / (decimal)value.denominator;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="Double"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Double"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator double(FIURational value)
		{
			return value.denominator == 0 ? 0d : (double)value.numerator / (double)value.denominator;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to an <see cref="Int16"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Int16"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator short(FIURational value)
		{
			return (short)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to an <see cref="Int32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Int32"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator int(FIURational value)
		{
			return (int)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to an <see cref="Int64"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Int64"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator long(FIURational value)
		{
			return (byte)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="Single"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="Single"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator float(FIURational value)
		{
			return value.denominator == 0 ? 0f : (float)value.numerator / (float)value.denominator;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to a <see cref="SByte"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="SByte"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator sbyte(FIURational value)
		{
			return (sbyte)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to an <see cref="UInt16"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="UInt16"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator ushort(FIURational value)
		{
			return (ushort)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to an <see cref="UInt32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="UInt32"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator uint(FIURational value)
		{
			return (uint)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIURational"/> structure to an <see cref="UInt32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIURational"/> structure.</param>
		/// <returns>A new instance of <see cref="UInt32"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator ulong(FIURational value)
		{
			return (ulong)(double)value;
		}

		//

		/// <summary>
		/// Converts the value of a <see cref="Boolean"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Boolean"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(bool value)
		{
			return new FIURational(value ? 1u : 0u, 1u);
		}

		/// <summary>
		/// Converts the value of a <see cref="Byte"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Byte"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIURational(byte value)
		{
			return new FIURational(value, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="Char"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Char"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIURational(char value)
		{
			return new FIURational(value, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="Decimal"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Decimal"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(decimal value)
		{
			return new FIURational(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="Double"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Double"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(double value)
		{
			return new FIURational((decimal)value);
		}

		/// <summary>
		/// Converts the value of an <see cref="Int16"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="Int16"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIURational(short value)
		{
			return new FIURational((uint)value, 1u);
		}

		/// <summary>
		/// Converts the value of an <see cref="Int32"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="Int32"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIURational(int value)
		{
			return new FIURational((uint)value, 1u);
		}

		/// <summary>
		/// Converts the value of an <see cref="Int64"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="Int64"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(long value)
		{
			return new FIURational((uint)value, 1u);
		}

		/// <summary>
		/// Converts the value of a <see cref="SByte"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="SByte"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIURational(sbyte value)
		{
			return new FIURational((uint)value, 1u);
		}

		/// <summary>
		/// Converts the value of a <see cref="Single"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Single"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(float value)
		{
			return new FIURational((decimal)value);
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt16"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt16"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIURational(ushort value)
		{
			return new FIURational(value, 1);
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt32"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt32"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(uint value)
		{
			return new FIURational(value, 1u);
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt64"/> structure to a <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt64"/> structure.</param>
		/// <returns>A new instance of <see cref="FIURational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIURational(ulong value)
		{
			return new FIURational((uint)value, 1u);
		}

		#endregion

		#region IConvertible Member

		TypeCode IConvertible.GetTypeCode()
		{
			return TypeCode.Double;
		}

		bool IConvertible.ToBoolean(IFormatProvider provider)
		{
			return (bool)this;
		}

		byte IConvertible.ToByte(IFormatProvider provider)
		{
			return (byte)this;
		}

		char IConvertible.ToChar(IFormatProvider provider)
		{
			return (char)this;
		}

		DateTime IConvertible.ToDateTime(IFormatProvider provider)
		{
			return Convert.ToDateTime(((IConvertible)this).ToDouble(provider));
		}

		decimal IConvertible.ToDecimal(IFormatProvider provider)
		{
			return this;
		}

		double IConvertible.ToDouble(IFormatProvider provider)
		{
			return this;
		}

		short IConvertible.ToInt16(IFormatProvider provider)
		{
			return (short)this;
		}

		int IConvertible.ToInt32(IFormatProvider provider)
		{
			return (int)this;
		}

		long IConvertible.ToInt64(IFormatProvider provider)
		{
			return (long)this;
		}

		sbyte IConvertible.ToSByte(IFormatProvider provider)
		{
			return (sbyte)this;
		}

		float IConvertible.ToSingle(IFormatProvider provider)
		{
			return this;
		}

		string IConvertible.ToString(IFormatProvider provider)
		{
			return ToString(((double)this).ToString(), provider);
		}

		object IConvertible.ToType(Type conversionType, IFormatProvider provider)
		{
			return Convert.ChangeType(((IConvertible)this).ToDouble(provider), conversionType, provider);
		}

		ushort IConvertible.ToUInt16(IFormatProvider provider)
		{
			return (ushort)this;
		}

		uint IConvertible.ToUInt32(IFormatProvider provider)
		{
			return (uint)this;
		}

		ulong IConvertible.ToUInt64(IFormatProvider provider)
		{
			return (ulong)this;
		}

		#endregion

		#region IComparable Member

		/// <summary>
		/// Compares this instance with a specified <see cref="Object"/>.
		/// </summary>
		/// <param name="obj">An object to compare with this instance.</param>
		/// <returns>A 32-bit signed integer indicating the lexical relationship between the two comparands.</returns>
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FIURational"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FIURational))
			{
				throw new ArgumentException();
			}
			return CompareTo((FIURational)obj);
		}

		#endregion

		#region IFormattable Member

		/// <summary>
		/// Formats the value of the current instance using the specified format.
		/// </summary>
		/// <param name="format">The String specifying the format to use.</param>
		/// <param name="formatProvider">The IFormatProvider to use to format the value.</param>
		/// <returns>A String containing the value of the current instance in the specified format.</returns>
		public string ToString(string format, IFormatProvider formatProvider)
		{
			if (format == null)
			{
				format = "";
			}
			return String.Format(formatProvider, format, ((IConvertible)this).ToDouble(formatProvider));
		}

		#endregion

		#region IEquatable<FIURational> Member

		/// <summary>
		/// Tests whether the specified <see cref="FIURational"/> structure is equivalent to this <see cref="FIURational"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="FIURational"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIURational"/> structure
		/// equivalent to this <see cref="FIURational"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(FIURational other)
		{
			return (this == other);
		}

		#endregion

		#region IComparable<FIURational> Member

		/// <summary>
		/// Compares this instance with a specified <see cref="FIURational"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FIURational"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FIURational other)
		{
			FIURational difference = this - other;
			difference.Normalize();
			if (difference.numerator > 0) return 1;
			if (difference.numerator < 0) return -1;
			else return 0;
		}

		#endregion
	}
}