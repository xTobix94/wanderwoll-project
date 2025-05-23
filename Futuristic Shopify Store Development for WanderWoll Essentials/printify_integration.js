# Printify Integration für WanderWoll essentials

## API-Konfiguration

```javascript
/**
 * WanderWoll essentials - Printify API Integration
 * 
 * Diese Konfiguration verbindet den WanderWoll Shopify-Store mit Printify
 * für nahtlose Print-on-Demand-Produktion.
 */

const PRINTIFY_CONFIG = {
  apiKey: "PRINTIFY_API_KEY_PLACEHOLDER", // Wird bei der Shopify-App-Installation ersetzt
  shopId: "SHOP_ID_PLACEHOLDER", // Wird bei der Shopify-App-Installation ersetzt
  apiEndpoint: "https://api.printify.com/v1",
  webhookEndpoint: "https://wanderwoll-essentials.myshopify.com/api/printify-webhook",
  defaultPrintProviders: {
    tshirt: "prd_eu_merino_provider", // EU-basierter Merino-T-Shirt-Anbieter
    hoodie: "prd_eu_merino_provider", // EU-basierter Merino-Hoodie-Anbieter
    shorts: "prd_eu_merino_provider", // EU-basierter Merino-Shorts-Anbieter
    socks: "prd_eu_sock_provider",    // EU-basierter Socken-Anbieter
    beanie: "prd_eu_merino_provider"  // EU-basierter Merino-Mützen-Anbieter
  },
  productMappings: {
    "merino-tshirt": {
      printifyId: "printify_merino_tshirt_id",
      variantMappings: {
        "forest-green-s": "variant_id_forest_green_s",
        "forest-green-m": "variant_id_forest_green_m",
        "forest-green-l": "variant_id_forest_green_l",
        "forest-green-xl": "variant_id_forest_green_xl",
        "beige-s": "variant_id_beige_s",
        "beige-m": "variant_id_beige_m",
        "beige-l": "variant_id_beige_l",
        "beige-xl": "variant_id_beige_xl",
        "black-s": "variant_id_black_s",
        "black-m": "variant_id_black_m",
        "black-l": "variant_id_black_l",
        "black-xl": "variant_id_black_xl"
      },
      printAreas: {
        front: {
          width: 2400,
          height: 3000,
          position: "center"
        },
        back: {
          width: 2400,
          height: 3000,
          position: "center"
        }
      }
    },
    "merino-hoodie": {
      printifyId: "printify_merino_hoodie_id",
      variantMappings: {
        "forest-green-s": "variant_id_forest_green_s",
        "forest-green-m": "variant_id_forest_green_m",
        "forest-green-l": "variant_id_forest_green_l",
        "forest-green-xl": "variant_id_forest_green_xl",
        "beige-s": "variant_id_beige_s",
        "beige-m": "variant_id_beige_m",
        "beige-l": "variant_id_beige_l",
        "beige-xl": "variant_id_beige_xl",
        "black-s": "variant_id_black_s",
        "black-m": "variant_id_black_m",
        "black-l": "variant_id_black_l",
        "black-xl": "variant_id_black_xl"
      },
      printAreas: {
        front: {
          width: 2400,
          height: 3000,
          position: "center"
        },
        back: {
          width: 2400,
          height: 3000,
          position: "center"
        }
      }
    }
    // Weitere Produkte hier hinzufügen
  }
};
```

## Printify API Client

```javascript
/**
 * WanderWoll essentials - Printify API Client
 * 
 * Dieser Client ermöglicht die Kommunikation mit der Printify API
 * für die Verwaltung von Print-on-Demand-Produkten.
 */

class PrintifyClient {
  /**
   * Initialisiert den Printify API Client
   * @param {Object} config - Konfigurationsobjekt
   */
  constructor(config = PRINTIFY_CONFIG) {
    this.config = config;
    this.baseUrl = config.apiEndpoint;
    this.shopId = config.shopId;
    this.apiKey = config.apiKey;
  }

  /**
   * Führt einen API-Request aus
   * @param {string} endpoint - API-Endpunkt
   * @param {string} method - HTTP-Methode
   * @param {Object} data - Request-Daten
   * @returns {Promise<Object>} - API-Antwort
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Printify API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Printify API Request Error:', error);
      throw error;
    }
  }
  
  /**
   * Holt alle Produkte vom Shop
   * @returns {Promise<Array>} - Liste der Produkte
   */
  async getProducts() {
    return this.request(`/shops/${this.shopId}/products.json`);
  }
  
  /**
   * Holt ein bestimmtes Produkt
   * @param {string} productId - Produkt-ID
   * @returns {Promise<Object>} - Produktdetails
   */
  async getProduct(productId) {
    return this.request(`/shops/${this.shopId}/products/${productId}.json`);
  }
  
  /**
   * Erstellt ein neues Produkt
   * @param {Object} productData - Produktdaten
   * @returns {Promise<Object>} - Erstelltes Produkt
   */
  async createProduct(productData) {
    return this.request(`/shops/${this.shopId}/products.json`, 'POST', productData);
  }
  
  /**
   * Aktualisiert ein bestehendes Produkt
   * @param {string} productId - Produkt-ID
   * @param {Object} productData - Aktualisierte Produktdaten
   * @returns {Promise<Object>} - Aktualisiertes Produkt
   */
  async updateProduct(productId, productData) {
    return this.request(`/shops/${this.shopId}/products/${productId}.json`, 'PUT', productData);
  }
  
  /**
   * Veröffentlicht ein Produkt im Shopify-Store
   * @param {string} productId - Produkt-ID
   * @returns {Promise<Object>} - Veröffentlichungsstatus
   */
  async publishProduct(productId) {
    return this.request(`/shops/${this.shopId}/products/${productId}/publish.json`, 'POST');
  }
  
  /**
   * Lädt ein Bild für ein Produkt hoch
   * @param {string} imageData - Base64-kodiertes Bild
   * @returns {Promise<Object>} - Hochgeladenes Bild
   */
  async uploadImage(imageData) {
    return this.request(`/uploads/images.json`, 'POST', {
      file_name: `wanderwoll_custom_design_${Date.now()}.png`,
      contents: imageData.replace(/^data:image\/\w+;base64,/, '')
    });
  }
  
  /**
   * Erstellt eine Bestellung
   * @param {Object} orderData - Bestelldaten
   * @returns {Promise<Object>} - Erstellte Bestellung
   */
  async createOrder(orderData) {
    return this.request(`/shops/${this.shopId}/orders.json`, 'POST', orderData);
  }
  
  /**
   * Holt den Status einer Bestellung
   * @param {string} orderId - Bestell-ID
   * @returns {Promise<Object>} - Bestellstatus
   */
  async getOrderStatus(orderId) {
    return this.request(`/shops/${this.shopId}/orders/${orderId}.json`);
  }
  
  /**
   * Storniert eine Bestellung
   * @param {string} orderId - Bestell-ID
   * @returns {Promise<Object>} - Stornierungsstatus
   */
  async cancelOrder(orderId) {
    return this.request(`/shops/${this.shopId}/orders/${orderId}/cancel.json`, 'POST');
  }
  
  /**
   * Erstellt ein benutzerdefiniertes Design für ein Produkt
   * @param {string} productType - Produkttyp (z.B. 'tshirt', 'hoodie')
   * @param {string} variantKey - Varianten-Schlüssel (z.B. 'forest-green-m')
   * @param {Object} designData - Design-Daten
   * @returns {Promise<Object>} - Erstelltes Produkt mit benutzerdefiniertem Design
   */
  async createCustomDesignProduct(productType, variantKey, designData) {
    try {
      // Produktkonfiguration abrufen
      const productConfig = this.config.productMappings[productType];
      if (!productConfig) {
        throw new Error(`Produkttyp nicht gefunden: ${productType}`);
      }
      
      // Varianten-ID abrufen
      const variantId = productConfig.variantMappings[variantKey];
      if (!variantId) {
        throw new Error(`Variante nicht gefunden: ${variantKey}`);
      }
      
      // Design-Bild hochladen
      const uploadedImage = await this.uploadImage(designData.dataUrl);
      
      // Druckbereich konfigurieren
      const printArea = productConfig.printAreas.front;
      
      // Produkt erstellen
      const productData = {
        title: `WanderWoll ${productType} - Custom Design`,
        description: "Individuell gestaltetes WanderWoll Produkt mit deinem eigenen Design.",
        blueprint_id: productConfig.printifyId,
        print_provider_id: this.config.defaultPrintProviders[productType.split('-')[0]],
        variants: [
          {
            id: variantId,
            price: 0, // Preis wird vom Shopify-Produkt übernommen
            is_enabled: true
          }
        ],
        print_areas: {
          front: {
            artwork: uploadedImage.id,
            position: {
              x: (printArea.width / 2) * (designData.transform.position.x - 0.5),
              y: (printArea.height / 2) * (designData.transform.position.y - 0.5),
              scale: designData.transform.scale,
              angle: designData.transform.rotation
            },
            options: {
              brightness: designData.colorAdjustments?.brightness || 0,
              contrast: designData.colorAdjustments?.contrast || 0,
              saturation: designData.colorAdjustments?.saturation || 0,
              hue: designData.colorAdjustments?.hue || 0
            }
          }
        }
      };
      
      // Produkt in Printify erstellen
      const createdProduct = await this.createProduct(productData);
      
      // Produkt im Shopify-Store veröffentlichen
      await this.publishProduct(createdProduct.id);
      
      return createdProduct;
    } catch (error) {
      console.error('Fehler beim Erstellen des benutzerdefinierten Designs:', error);
      throw error;
    }
  }
}
```

## Shopify-Printify Webhook Handler

```javascript
/**
 * WanderWoll essentials - Printify Webhook Handler
 * 
 * Dieser Handler verarbeitet Webhooks von Printify, um den Bestellstatus
 * zu aktualisieren und Kunden zu benachrichtigen.
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

// Webhook-Secret für die Validierung
const WEBHOOK_SECRET = process.env.PRINTIFY_WEBHOOK_SECRET;

// Validiert den Webhook-Request
function validateWebhook(req) {
  const hmac = req.headers['x-printify-signature'];
  const body = JSON.stringify(req.body);
  const calculatedHmac = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  return hmac === calculatedHmac;
}

// Verarbeitet Bestellstatus-Updates
app.post('/api/printify-webhook', async (req, res) => {
  try {
    // Webhook validieren
    if (!validateWebhook(req)) {
      console.error('Ungültiger Webhook-Request');
      return res.status(401).send('Ungültiger Webhook-Request');
    }
    
    const { event, data } = req.body;
    
    // Verschiedene Ereignistypen verarbeiten
    switch (event) {
      case 'order:created':
        await handleOrderCreated(data);
        break;
      case 'order:status-changed':
        await handleOrderStatusChanged(data);
        break;
      case 'order:shipment-created':
        await handleShipmentCreated(data);
        break;
      case 'order:fulfillment-error':
        await handleFulfillmentError(data);
        break;
      default:
        console.log(`Unbehandeltes Ereignis: ${event}`);
    }
    
    res.status(200).send('Webhook empfangen');
  } catch (error) {
    console.error('Fehler bei der Webhook-Verarbeitung:', error);
    res.status(500).send('Interner Serverfehler');
  }
});

// Verarbeitet neue Bestellungen
async function handleOrderCreated(data) {
  const { order_id, external_id } = data;
  
  // Shopify-Bestellung aktualisieren
  await updateShopifyOrder(external_id, {
    tags: 'printify-processing',
    note: `Printify-Bestellung erstellt: ${order_id}`
  });
  
  // Kunden benachrichtigen
  await notifyCustomer(external_id, {
    subject: 'Deine WanderWoll-Bestellung wird bearbeitet',
    message: 'Deine Bestellung mit individuellem Design wird jetzt bearbeitet. Wir informieren dich, sobald sie in Produktion geht.'
  });
}

// Verarbeitet Statusänderungen
async function handleOrderStatusChanged(data) {
  const { order_id, external_id, status } = data;
  
  // Shopify-Bestellung aktualisieren
  await updateShopifyOrder(external_id, {
    tags: `printify-${status}`,
    note: `Printify-Status aktualisiert: ${status}`
  });
  
  // Kunden benachrichtigen
  let subject, message;
  
  switch (status) {
    case 'pending':
      subject = 'Deine WanderWoll-Bestellung wird vorbereitet';
      message = 'Deine Bestellung wird gerade für die Produktion vorbereitet.';
      break;
    case 'in_production':
      subject = 'Deine WanderWoll-Bestellung ist in Produktion';
      message = 'Dein individuelles Design wird jetzt produziert. Dies dauert etwa 2-4 Werktage.';
      break;
    case 'completed':
      subject = 'Deine WanderWoll-Bestellung ist fertiggestellt';
      message = 'Deine Bestellung wurde erfolgreich produziert und wird bald versendet.';
      break;
    case 'canceled':
      subject = 'Deine WanderWoll-Bestellung wurde storniert';
      message = 'Deine Bestellung wurde leider storniert. Bitte kontaktiere unseren Kundenservice für weitere Informationen.';
      break;
  }
  
  if (subject && message) {
    await notifyCustomer(external_id, { subject, message });
  }
}

// Verarbeitet Versandereignisse
async function handleShipmentCreated(data) {
  const { order_id, external_id, tracking_number, tracking_url, carrier } = data;
  
  // Shopify-Bestellung aktualisieren
  await updateShopifyOrder(external_id, {
    fulfillment_status: 'fulfilled',
    tags: 'printify-shipped',
    note: `Versand mit ${carrier}: ${tracking_number}`
  });
  
  // Kunden benachrichtigen
  await notifyCustomer(external_id, {
    subject: 'Deine WanderWoll-Bestellung wurde versendet',
    message: `Deine Bestellung ist unterwegs! Verfolge deine Sendung mit der Tracking-Nummer ${tracking_number} unter ${tracking_url}.`
  });
}

// Verarbeitet Produktionsfehler
async function handleFulfillmentError(data) {
  const { order_id, external_id, error_message } = data;
  
  // Shopify-Bestellung aktualisieren
  await updateShopifyOrder(external_id, {
    tags: 'printify-error',
    note: `Produktionsfehler: ${error_message}`
  });
  
  // Kunden benachrichtigen
  await notifyCustomer(external_id, {
    subject: 'Problem mit deiner WanderWoll-Bestellung',
    message: 'Bei der Produktion deiner Bestellung ist ein Problem aufgetreten. Unser Kundenservice wird sich in Kürze mit dir in Verbindung setzen.'
  });
  
  // Kundenservice benachrichtigen
  await notifyCustomerService(external_id, error_message);
}

// Hilfsfunktionen für Shopify-API und Benachrichtigungen
async function updateShopifyOrder(orderId, updateData) {
  // Implementierung der Shopify-API-Aufrufe
}

async function notifyCustomer(orderId, notification) {
  // Implementierung der Kunden-Benachrichtigung
}

async function notifyCustomerService(orderId, errorMessage) {
  // Implementierung der Kundenservice-Benachrichtigung
}

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Printify Webhook Server läuft auf Port ${PORT}`);
});
```

## Shopify-Printify Bestellverarbeitung

```javascript
/**
 * WanderWoll essentials - Bestellverarbeitung
 * 
 * Dieses Skript verarbeitet Shopify-Bestellungen und sendet sie an Printify
 * für die Print-on-Demand-Produktion.
 */

const PrintifyClient = require('./printify-client');

class OrderProcessor {
  constructor() {
    this.printifyClient = new PrintifyClient();
  }
  
  /**
   * Verarbeitet eine neue Shopify-Bestellung
   * @param {Object} order - Shopify-Bestelldaten
   * @returns {Promise<Object>} - Verarbeitungsergebnis
   */
  async processOrder(order) {
    try {
      console.log(`Verarbeite Bestellung #${order.order_number}`);
      
      // Bestellpositionen mit benutzerdefinierten Designs
(Content truncated due to size limit. Use line ranges to read in chunks)