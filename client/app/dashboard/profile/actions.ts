'use server';

import { revalidatePath } from 'next/cache';

/**
 * Server Action to change user password
 * This runs on the server, keeping validation logic server-side
 * and avoiding client-side bundle bloat
 */
export async function changePassword(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Server-side validation (lightweight, no libraries needed)
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { 
      success: false, 
      message: 'All fields are required' 
    };
  }

  if (newPassword.length < 6) {
    return { 
      success: false, 
      message: 'New password must be at least 6 characters' 
    };
  }

  if (newPassword !== confirmPassword) {
    return { 
      success: false, 
      message: 'New passwords do not match' 
    };
  }

  if (currentPassword === newPassword) {
    return { 
      success: false, 
      message: 'New password must be different from current password' 
    };
  }

  try {
    // Get API URL from environment
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // Make request to backend API
    // Note: We'll need to pass the token from the client
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || 'Failed to change password' 
      };
    }

    // Revalidate the profile page to ensure fresh data
    revalidatePath('/dashboard/profile');

    return { 
      success: true, 
      message: 'Password changed successfully' 
    };
  } catch (error) {
    console.error('Change password error:', error);
    return { 
      success: false, 
      message: 'Server error. Please try again.' 
    };
  }
}
