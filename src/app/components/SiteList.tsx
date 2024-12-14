'use client';

import { useState, useEffect } from 'react';

interface Site {
  id: string;
  name: string;
  domain: string;
  orderCount: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SiteList() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch(`${API_URL}/api/sites`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch sites');
        }
        const data = await response.json();
        setSites(data);
      } catch (err) {
        setError('Erreur lors du chargement des sites');
        console.error('Error fetching sites:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, []);

  if (isLoading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <div
            key={site.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-800">{site.name}</h3>
            <p className="text-gray-600 mt-2">{site.domain}</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {site.orderCount} commandes
              </span>
              <div className="space-x-2">
                <a
                  href={`https://${site.domain}/wp-admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Admin
                </a>
                <a
                  href={`https://${site.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Voir
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
