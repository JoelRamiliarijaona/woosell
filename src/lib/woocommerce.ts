import { SiteModel } from './models/website';

const API_TIMEOUT = 1200000; // 20 minutes

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
  consumerKey: string;
  consumerSecret: string;
  siteUrl: string;

  constructor(
    consumerKey: string,
    consumerSecret: string,
    siteUrl: string
  ) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.siteUrl = siteUrl;
  }

  async createWooCommerceSite(siteData: CreateSiteData): Promise<CreateSiteResponse> {
    try {
      const apiUrl = 'http://51.159.99.74:7999/v3/create_woo_instance';

      const requestBody = {
        domain: siteData.domain,
        name: siteData.name,
        password: siteData.password,
        thematic: "site e-commerce",
        target_audience: "shop",
        key_seo_term: "Shop",
        type: "Shop"
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('API request timeout after', API_TIMEOUT / 1000, 'seconds');
      }, API_TIMEOUT);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
          keepalive: true
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error('API request failed:', {
            status: response.status,
            statusText: response.statusText
          });

          const errorText = await response.text();
          console.error('Error response:', errorText);

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

        // Sauvegarder le site dans la base de données
        const site = new SiteModel({
          storeId: siteData.domain,
          type: 'shop',
          apiHost: `https://${siteData.domain}`,
          apiKey: data.consumerKey || '',
          apiSecret: data.consumerSecret || '',
          name: siteData.name,
          provider: 'woo',
          userId: siteData.userId,
          status: 'pending',
          createdAt: new Date(),
          stats: {
            orderCount: 0,
            revenue: 0,
            lastSync: new Date()
          }
        });

        try {
          await site.save();
          console.log('Site saved to database:', site);

          return {
            success: true,
            data: {
              storeId: site.storeId,
              consumerKey: site.apiKey,
              consumerSecret: site.apiSecret,
              _id: site._id.toString(),
              name: site.name,
              domain: siteData.domain,
              stats: site.stats
            }
          };
        } catch (dbError) {
          console.error('Error saving site to database:', dbError);
          return {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Erreur lors de la sauvegarde du site',
              details: dbError
            }
          };
        }

      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error in API request:', error);
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
            details: error
          }
        };
      }

    } catch (error) {
      console.error('Error in createWooCommerceSite:', error);
      return {
        success: false,
        error: {
          code: 'WOOCOMMERCE_API_ERROR',
          message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
          details: error
        }
      };
    }
  }
}
