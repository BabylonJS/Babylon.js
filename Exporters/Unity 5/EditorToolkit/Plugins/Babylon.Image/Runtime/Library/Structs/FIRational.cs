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
// $Id: FIRational.cs,v 1.5 2009/02/27 16:36:23 cklein05 Exp $
// ==========================================================

using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Diagnostics;

namespace FreeImageAPI
{
	/// <summary>
	/// The <b>FIRational</b> structure represents a fraction via two <see cref="Int32"/>
	/// instances which are interpreted as numerator and denominator.
	/// </summary>
	/// <remarks>
	/// The structure tries to approximate the value of <see cref="FreeImageAPI.FIRational(decimal)"/>
	/// when creating a new instance by using a better algorithm than FreeImage does.
	/// <para/>
	/// The structure implements the following operators:
	/// +, -, ++, --, ==, != , >, >==, &lt;, &lt;== and ~ (which switches nominator and denomiator).
	/// <para/>
	/// The structure can be converted into all .NET standard types either implicit or
	/// explicit.
	/// </remarks>
	[Serializable, StructLayout(LayoutKind.Sequential), ComVisible(true)]
	public struct FIRational : IConvertible, IComparable, IFormattable, IComparable<FIRational>, IEquatable<FIRational>
	{
		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private int numerator;

		[DebuggerBrowsable(DebuggerBrowsableState.Never)]
		private int denominator;

		/// <summary>
		/// Represents the largest possible value of <see cref="FIRational"/>. This field is constant.
		/// </summary>
		public static readonly FIRational MaxValue = new FIRational(Int32.MaxValue, 1);

		/// <summary>
		/// Represents the smallest possible value of <see cref="FIRational"/>. This field is constant.
		/// </summary>
		public static readonly FIRational MinValue = new FIRational(Int32.MinValue, 1);

		/// <summary>
		/// Represents the smallest positive <see cref="FIRational"/> value greater than zero. This field is constant.
		/// </summary>
		public static readonly FIRational Epsilon = new FIRational(1, Int32.MaxValue);

		/// <summary>
		/// Initializes a new instance based on the specified parameters.
		/// </summary>
		/// <param name="n">The numerator.</param>
		/// <param name="d">The denominator.</param>
		public FIRational(int n, int d)
		{
			numerator = n;
			denominator = d;
			Normalize();
		}

		/// <summary>
		/// Initializes a new instance based on the specified parameters.
		/// </summary>
		/// <param name="tag">The tag to read the data from.</param>
		public unsafe FIRational(FITAG tag)
		{
			switch (FreeImage.GetTagType(tag))
			{
				case FREE_IMAGE_MDTYPE.FIDT_SRATIONAL:
					int* value = (int*)FreeImage.GetTagValue(tag);
					numerator = (int)value[0];
					denominator = (int)value[1];
					Normalize();
					return;
				default:
					throw new ArgumentException("tag");
			}
		}

		/// <summary>
		/// Initializes a new instance based on the specified parameters.
		/// </summary>
		/// <param name="value">The value to convert into a fraction.</param>
		/// <exception cref="OverflowException">
		/// <paramref name="value"/> cannot be converted into a fraction
		/// represented by two integer values.</exception>
		public FIRational(decimal value)
		{
			try
			{
				int sign = value < 0 ? -1 : 1;
				value = Math.Abs(value);
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
				numerator *= sign;
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
		public int Numerator
		{
			get { return numerator; }
		}

		/// <summary>
		/// The denominator of the fraction.
		/// </summary>
		public int Denominator
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
		private static long Gcd(long a, long b)
		{
			a = Math.Abs(a);
			b = Math.Abs(b);
			long r;
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
		private static long Scm(int n, int m)
		{
			return Math.Abs((long)n * (long)m) / Gcd(n, m);
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
				int common = (int)Gcd(numerator, denominator);
				if (common != 1 && common != 0)
				{
					numerator /= common;
					denominator /= common;
				}
			}

			if (denominator < 0)
			{
				numerator *= -1;
				denominator *= -1;
			}
		}

		/// <summary>
		/// Normalizes a fraction.
		/// </summary>
		private static void Normalize(ref long numerator, ref long denominator)
		{
			if (denominator == 0)
			{
				numerator = 0;
				denominator = 1;
			}
			else if (numerator != 1 && denominator != 1)
			{
				long common = Gcd(numerator, denominator);
				if (common != 1)
				{
					numerator /= common;
					denominator /= common;
				}
			}
			if (denominator < 0)
			{
				numerator *= -1;
				denominator *= -1;
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
		private static void CreateFraction(int[] continuedFraction, out int numerator, out int denominator)
		{
			numerator = 1;
			denominator = 0;
			int temp;

			for (int i = continuedFraction.Length - 1; i > -1; i--)
			{
				temp = numerator;
				numerator = continuedFraction[i] * numerator + denominator;
				denominator = temp;
			}
		}

		/// <summary>
		/// Tries 'brute force' to approximate <paramref name="value"/> with a fraction.
		/// </summary>
		private static void ApproximateFraction(decimal value, int maxDen, out int num, out int den)
		{
			num = 0;
			den = 0;
			decimal bestDifference = 1m;
			decimal currentDifference = -1m;
			int digits = GetDigits(value);

			if (digits <= 9)
			{
				int mul = 1;
				for (int i = 1; i <= digits; i++)
				{
					mul *= 10;
				}
				if (mul <= maxDen)
				{
					num = (int)(value * mul);
					den = mul;
					return;
				}
			}

			for (int i = 1; i <= maxDen; i++)
			{
				int numerator = (int)Math.Floor(value * (decimal)i + 0.5m);
				currentDifference = Math.Abs(value - (decimal)numerator / (decimal)i);
				if (currentDifference < bestDifference)
				{
					num = numerator;
					den = i;
					bestDifference = currentDifference;
				}
			}
		}

		/// <summary>
		/// Converts the numeric value of the <see cref="FIRational"/> object
		/// to its equivalent string representation.
		/// </summary>
		/// <returns>The string representation of the value of this instance.</returns>
		public override string ToString()
		{
			return ((IConvertible)this).ToDouble(null).ToString();
		}

		/// <summary>
		/// Tests whether the specified object is a <see cref="FIRational"/> structure
		/// and is equivalent to this <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="obj">The object to test.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRational"/> structure
		/// equivalent to this <see cref="FIRational"/> structure; otherwise, <b>false</b>.</returns>
		public override bool Equals(object obj)
		{
			return ((obj is FIRational) && (this == ((FIRational)obj)));
		}

		/// <summary>
		/// Returns a hash code for this <see cref="FIRational"/> structure.
		/// </summary>
		/// <returns>An integer value that specifies the hash code for this <see cref="FIRational"/>.</returns>
		public override int GetHashCode()
		{
			return base.GetHashCode();
		}

		#region Operators

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator +(FIRational r1)
		{
			return r1;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator -(FIRational r1)
		{
			r1.numerator *= -1;
			return r1;
		}

		/// <summary>
		/// Returns the reciprocal value of this instance.
		/// </summary>
		public static FIRational operator ~(FIRational r1)
		{
			int temp = r1.denominator;
			r1.denominator = r1.numerator;
			r1.numerator = temp;
			r1.Normalize();
			return r1;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator ++(FIRational r1)
		{
			checked
			{
				r1.numerator += r1.denominator;
			}
			return r1;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator --(FIRational r1)
		{
			checked
			{
				r1.numerator -= r1.denominator;
			}
			return r1;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator +(FIRational r1, FIRational r2)
		{
			long numerator = 0;
			long denominator = Scm(r1.denominator, r2.denominator);
			numerator = (r1.numerator * (denominator / r1.denominator)) + (r2.numerator * (denominator / r2.denominator));
			Normalize(ref numerator, ref denominator);
			checked
			{
				return new FIRational((int)numerator, (int)denominator);
			}
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator -(FIRational r1, FIRational r2)
		{
			return r1 + (-r2);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator *(FIRational r1, FIRational r2)
		{
			long numerator = r1.numerator * r2.numerator;
			long denominator = r1.denominator * r2.denominator;
			Normalize(ref numerator, ref denominator);
			checked
			{
				return new FIRational((int)numerator, (int)denominator);
			}
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator /(FIRational r1, FIRational r2)
		{
			int temp = r2.denominator;
			r2.denominator = r2.numerator;
			r2.numerator = temp;
			return r1 * r2;
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static FIRational operator %(FIRational r1, FIRational r2)
		{
			r2.Normalize();
			if (Math.Abs(r2.numerator) < r2.denominator)
				return new FIRational(0, 0);
			int div = (int)(r1 / r2);
			return r1 - (r2 * div);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator ==(FIRational r1, FIRational r2)
		{
			r1.Normalize();
			r2.Normalize();
			return (r1.numerator == r2.numerator) && (r1.denominator == r2.denominator);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator !=(FIRational r1, FIRational r2)
		{
			return !(r1 == r2);
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator >(FIRational r1, FIRational r2)
		{
			long denominator = Scm(r1.denominator, r2.denominator);
			return (r1.numerator * (denominator / r1.denominator)) > (r2.numerator * (denominator / r2.denominator));
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator <(FIRational r1, FIRational r2)
		{
			long denominator = Scm(r1.denominator, r2.denominator);
			return (r1.numerator * (denominator / r1.denominator)) < (r2.numerator * (denominator / r2.denominator));
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator >=(FIRational r1, FIRational r2)
		{
			long denominator = Scm(r1.denominator, r2.denominator);
			return (r1.numerator * (denominator / r1.denominator)) >= (r2.numerator * (denominator / r2.denominator));
		}

		/// <summary>
		/// Standard implementation of the operator.
		/// </summary>
		public static bool operator <=(FIRational r1, FIRational r2)
		{
			long denominator = Scm(r1.denominator, r2.denominator);
			return (r1.numerator * (denominator / r1.denominator)) <= (r2.numerator * (denominator / r2.denominator));
		}

		#endregion

		#region Conversions

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="Boolean"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Boolean"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator bool(FIRational value)
		{
			return (value.numerator != 0);
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="Byte"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Byte"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator byte(FIRational value)
		{
			return (byte)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="Char"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Char"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator char(FIRational value)
		{
			return (char)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="Decimal"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Decimal"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator decimal(FIRational value)
		{
			return value.denominator == 0 ? 0m : (decimal)value.numerator / (decimal)value.denominator;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="Double"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Double"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator double(FIRational value)
		{
			return value.denominator == 0 ? 0d : (double)value.numerator / (double)value.denominator;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to an <see cref="Int16"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Int16"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator short(FIRational value)
		{
			return (short)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to an <see cref="Int32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Int32"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator int(FIRational value)
		{
			return (int)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to an <see cref="Int64"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Int64"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator long(FIRational value)
		{
			return (byte)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="Single"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="Single"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator float(FIRational value)
		{
			return value.denominator == 0 ? 0f : (float)value.numerator / (float)value.denominator;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to a <see cref="SByte"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="SByte"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator sbyte(FIRational value)
		{
			return (sbyte)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to an <see cref="UInt16"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="UInt16"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator ushort(FIRational value)
		{
			return (ushort)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to an <see cref="UInt32"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="UInt32"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator uint(FIRational value)
		{
			return (uint)(double)value;
		}

		/// <summary>
		/// Converts the value of a <see cref="FIRational"/> structure to an <see cref="UInt64"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="FIRational"/> structure.</param>
		/// <returns>A new instance of <see cref="UInt64"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator ulong(FIRational value)
		{
			return (ulong)(double)value;
		}

		//

		/// <summary>
		/// Converts the value of a <see cref="Boolean"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Boolean"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(bool value)
		{
			return new FIRational(value ? 1 : 0, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="Byte"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Byte"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRational(byte value)
		{
			return new FIRational(value, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="Char"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Char"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRational(char value)
		{
			return new FIRational(value, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="Decimal"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Decimal"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(decimal value)
		{
			return new FIRational(value);
		}

		/// <summary>
		/// Converts the value of a <see cref="Double"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Double"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(double value)
		{
			return new FIRational((decimal)value);
		}

		/// <summary>
		/// Converts the value of an <see cref="Int16"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="Int16"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRational(short value)
		{
			return new FIRational(value, 1);
		}

		/// <summary>
		/// Converts the value of an <see cref="Int32"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="Int32"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRational(int value)
		{
			return new FIRational(value, 1);
		}

		/// <summary>
		/// Converts the value of an <see cref="Int64"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="Int64"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(long value)
		{
			return new FIRational((int)value, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="SByte"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="SByte"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRational(sbyte value)
		{
			return new FIRational(value, 1);
		}

		/// <summary>
		/// Converts the value of a <see cref="Single"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">A <see cref="Single"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(float value)
		{
			return new FIRational((decimal)value);
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt16"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt16"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static implicit operator FIRational(ushort value)
		{
			return new FIRational(value, 1);
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt32"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt32"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(uint value)
		{
			return new FIRational((int)value, 1);
		}

		/// <summary>
		/// Converts the value of an <see cref="UInt64"/> structure to a <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="value">An <see cref="UInt64"/> structure.</param>
		/// <returns>A new instance of <see cref="FIRational"/> initialized to <paramref name="value"/>.</returns>
		public static explicit operator FIRational(ulong value)
		{
			return new FIRational((int)value, 1);
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
		/// <exception cref="ArgumentException"><paramref name="obj"/> is not a <see cref="FIRational"/>.</exception>
		public int CompareTo(object obj)
		{
			if (obj == null)
			{
				return 1;
			}
			if (!(obj is FIRational))
			{
				throw new ArgumentException();
			}
			return CompareTo((FIRational)obj);
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

		#region IEquatable<FIRational> Member

		/// <summary>
		/// Tests whether the specified <see cref="FIRational"/> structure is equivalent to this <see cref="FIRational"/> structure.
		/// </summary>
		/// <param name="other">A <see cref="FIRational"/> structure to compare to this instance.</param>
		/// <returns><b>true</b> if <paramref name="obj"/> is a <see cref="FIRational"/> structure
		/// equivalent to this <see cref="FIRational"/> structure; otherwise, <b>false</b>.</returns>
		public bool Equals(FIRational other)
		{
			return (this == other);
		}

		#endregion

		#region IComparable<FIRational> Member

		/// <summary>
		/// Compares this instance with a specified <see cref="FIRational"/> object.
		/// </summary>
		/// <param name="other">A <see cref="FIRational"/> to compare.</param>
		/// <returns>A signed number indicating the relative values of this instance
		/// and <paramref name="other"/>.</returns>
		public int CompareTo(FIRational other)
		{
			FIRational difference = this - other;
			difference.Normalize();
			if (difference.numerator > 0) return 1;
			if (difference.numerator < 0) return -1;
			else return 0;
		}

		#endregion
	}
}