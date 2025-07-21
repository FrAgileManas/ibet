'use client';

import { useState, useEffect } from 'react';

// Define the User type to match your database schema
interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-8"><p>Loading profile...</p></div>;
  }

  if (error) {
    return <div className="p-8"><p className="text-red-500">Error: {error}</p></div>;
  }

  if (!user) {
    return <div className="p-8"><p>No profile data found.</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">My Profile</h1>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-gray-600">Name:</p>
            <p className="text-lg text-gray-900">{user.name}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Email:</p>
            <p className="text-lg text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Balance:</p>
            <p className="text-lg text-green-600 font-semibold">${Number(user.balance).toFixed(2)}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Member Since:</p>
            {/* This line is fixed to handle potential null dates */}
            <p className="text-lg text-gray-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
