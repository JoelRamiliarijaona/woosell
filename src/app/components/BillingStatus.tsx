'use client';

import { useState, useEffect } from 'react';

interface BillingData {
  totalOrders: number;
  monthlyFee: number;
  orderFee: number;
  totalAmount: number;
}

export default function BillingStatus() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const response = await fetch('/api/billing');
        if (!response.ok) {
          throw new Error('Failed to fetch billing data');
        }
        const data = await response.json();
        setBillingData(data);
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  if (isLoading) {
    return <div>Chargement des données de facturation...</div>;
  }

  if (!billingData) {
    return <div>Erreur lors du chargement des données de facturation</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Facturation du mois</h2>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Nombre total de commandes</span>
          <span className="font-medium">{billingData.totalOrders}</span>
        </div>
        <div className="flex justify-between">
          <span>Frais mensuel de base</span>
          <span className="font-medium">{billingData.monthlyFee}€</span>
        </div>
        <div className="flex justify-between">
          <span>Frais par commande ({billingData.totalOrders} × 0.50€)</span>
          <span className="font-medium">{billingData.orderFee}€</span>
        </div>
        <div className="border-t pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{billingData.totalAmount}€</span>
        </div>
      </div>
    </div>
  );
}
