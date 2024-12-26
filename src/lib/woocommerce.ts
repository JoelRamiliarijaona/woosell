import { SiteModel } from './models/website';
import http from 'http';

// Extension du type RequestInit pour inclure l'agent
interface ExtendedRequestInit extends RequestInit {
  agent?: http.Agent;
}

interface CreateSiteResponse {
  success: boolean;
  data?: {
    storeId: string;
    consumerKey: string;
    consumerSecret: string;
    _id: string;
    name: string;
    domain: string;
    stats: {
      orderCount: number;
      revenue: number;
      lastSync: Date | null;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface CreateSiteData {
  domain: string;
  name: string;
  password: string;
  userId: string;
}

export class WooCommerceClient {
  private consumerKey: string;
  private consumerSecret: string;
  private siteUrl: string;
  private agent: http.Agent;

  constructor(
    consumerKey: string,
    consumerSecret: string,
    siteUrl: string
  ) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.siteUrl = siteUrl;

    // Configurer l'agent HTTP avec un timeout de 35 minutes
    this.agent = new http.Agent({
      keepAlive: true,
      timeout: 35 * 60 * 1000, // 35 minutes
    });
  }

  async createWooCommerceSite(siteData: CreateSiteData): Promise<CreateSiteResponse> {
    const apiUrl = 'http://51.159.99.74:7999/v3/create_woo_instance';

    try {
      const requestBody = {
        domain: siteData.domain,
        name: siteData.name,
        password: siteData.password,
        thematic: "site e-commerce",
        target_audience: "shop",
        key_seo_term: "Shop",
        type: "Shop"
      };

      // Créer le site dans la base de données
      const site = new SiteModel({
        storeId: siteData.domain,
        type: 'shop',
        apiHost: `https://${siteData.domain}`,
        apiKey: '',
        apiSecret: '',
        name: siteData.name,
        provider: 'woo',
        userId: siteData.userId,
        status: 'active',
        createdAt: new Date(),
        stats: {
          orderCount: 0,
          revenue: 0,
          lastSync: new Date()
        }
      });
      await site.save();

      console.log('Starting WooCommerce site creation...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        agent: this.agent
      } as ExtendedRequestInit);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: `La requête a échoué avec le statut ${response.status}: ${response.statusText}`,
            details: {
              status: response.status,
              response: errorText
            }
          }
        };
      }

      const data = await response.json();
      console.log('API Response:', data);

      return {
        success: true,
        data: {
          storeId: data.storeId,
          consumerKey: data.consumerKey,
          consumerSecret: data.consumerSecret,
          _id: data._id,
          name: siteData.name,
          domain: siteData.domain,
          stats: {
            orderCount: 0,
            revenue: 0,
            lastSync: null
          }
        }
      };

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error in createWooCommerceSite:', error);
        return {
          success: false,
          error: {
            code: 'WOOCOMMERCE_API_ERROR',
            message: error.message,
            details: error
          }
        };
      } else {
        console.error('Unknown error in createWooCommerceSite:', error);
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: 'Une erreur inconnue est survenue',
            details: error
          }
        };
      }
    }
  }

  async checkSiteStatus(taskId: string): Promise<{
    status: string;
    completed: boolean;
    error?: string;
    consumerKey?: string;
    consumerSecret?: string;
  }> {
    const statusUrl = `http://51.159.99.74:7999/v3/instance_status/${taskId}`;
    
    try {
      const response = await fetch(statusUrl);
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        status: data.status,
        completed: data.completed || false,
        error: data.error,
        consumerKey: data.consumerKey,
        consumerSecret: data.consumerSecret
      };
    } catch (error) {
      console.error('Error checking site status:', error);
      throw error;
    }
  }
}
