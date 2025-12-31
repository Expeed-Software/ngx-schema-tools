import { Injectable, inject } from '@angular/core';
import { JsonSchema, SchemaParserService, SchemaDocument, ModelRegistry } from 'ngx-data-mapper';

@Injectable({
  providedIn: 'root',
})
export class SampleDataService {
  private schemaParser = inject(SchemaParserService);

  constructor() {
    // Register models on service initialization
    this.schemaParser.registerModels(this.getModelDefinitions());
  }

  // Model definitions registry - these could come from an API
  getModelDefinitions(): ModelRegistry {
    return {
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier' },
          firstName: { type: 'string', description: 'Customer first name' },
          lastName: { type: 'string', description: 'Customer last name' },
          middleName: { type: 'string', description: 'Customer middle name' },
          prefix: { type: 'string', description: 'Name prefix (Mr, Mrs, Dr)' },
          suffix: { type: 'string', description: 'Name suffix (Jr, Sr, III)' },
          email: { type: 'string', description: 'Email address' },
          secondaryEmail: { type: 'string', description: 'Secondary email' },
          phone: { type: 'string', description: 'Phone number with area code' },
          mobilePhone: { type: 'string', description: 'Mobile phone number' },
          workPhone: { type: 'string', description: 'Work phone number' },
          fax: { type: 'string', description: 'Fax number' },
          birthDate: { type: 'string', format: 'date', description: 'Date of birth' },
          gender: { type: 'string', description: 'Gender' },
          nationality: { type: 'string', description: 'Nationality' },
          language: { type: 'string', description: 'Preferred language' },
          timezone: { type: 'string', description: 'Timezone' },
          createdAt: { type: 'string', format: 'date-time', description: 'Record creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
          addresses: {
            type: 'array',
            description: 'List of customer addresses',
            items: {
              type: 'object',
              properties: {
                street: { type: 'string', description: 'Street address' },
                street2: { type: 'string', description: 'Street address line 2' },
                city: { type: 'string', description: 'City name' },
                state: { type: 'string', description: 'State code' },
                zipCode: { type: 'string', description: 'Postal code' },
                country: { type: 'string', description: 'Country code' },
                isPrimary: { type: 'boolean', description: 'Primary address flag' },
                addressType: { type: 'string', description: 'Type (home, work, billing)' },
              },
            },
          },
          accountBalance: { type: 'number', description: 'Current account balance' },
          creditLimit: { type: 'number', description: 'Credit limit' },
          loyaltyPoints: { type: 'number', description: 'Loyalty points balance' },
          isActive: { type: 'boolean', description: 'Account active status' },
          isVerified: { type: 'boolean', description: 'Email verified status' },
          marketingOptIn: { type: 'boolean', description: 'Marketing opt-in' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Customer tags',
          },
          notes: { type: 'string', description: 'Internal notes' },
          referralCode: { type: 'string', description: 'Referral code' },
          referredBy: { type: 'string', description: 'Referred by customer ID' },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string', description: 'Full display name' },
          displayName: { type: 'string', description: 'Public display name' },
          initials: { type: 'string', description: 'Name initials' },
          emailAddress: { type: 'string' },
          alternateEmail: { type: 'string', description: 'Alternate email' },
          areaCode: { type: 'string', description: 'Phone area code only' },
          phoneNumber: { type: 'string' },
          mobileNumber: { type: 'string' },
          birthYear: { type: 'string' },
          birthMonth: { type: 'string' },
          age: { type: 'number', description: 'Calculated age' },
          createdAt: { type: 'string', format: 'date-time' },
          lastLoginAt: { type: 'string', format: 'date-time' },
          preferredLanguage: { type: 'string' },
          timezoneName: { type: 'string' },
          locations: {
            type: 'array',
            description: 'List of user locations',
            items: {
              type: 'object',
              properties: {
                fullAddress: { type: 'string', description: 'Combined street and city' },
                streetLine1: { type: 'string' },
                streetLine2: { type: 'string' },
                region: { type: 'string', description: 'State or region' },
                postalCode: { type: 'string', description: 'Postal code' },
                countryCode: { type: 'string' },
                isDefault: { type: 'boolean', description: 'Default location flag' },
                locationType: { type: 'string' },
              },
            },
          },
          location: {
            type: 'object',
            properties: {
              fullAddress: { type: 'string', description: 'Combined street and city' },
              region: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' },
            },
          },
          balance: { type: 'string', description: 'Formatted balance with currency' },
          availableCredit: { type: 'string' },
          rewardPoints: { type: 'number' },
          status: { type: 'string' },
          accountType: { type: 'string' },
          memberSince: { type: 'string' },
          isEmailVerified: { type: 'boolean' },
          isMobileVerified: { type: 'boolean' },
          hasOptedInMarketing: { type: 'boolean' },
          profileImageUrl: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          orderNumber: { type: 'string' },
          customerId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                productName: { type: 'string' },
                quantity: { type: 'integer' },
                unitPrice: { type: 'number' },
              },
            },
          },
          totalAmount: { type: 'number' },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    };
  }

  getSourceSchema(): JsonSchema {
    // Using JSON string format as shown by user
    const inputSchema = `{
      "$ref": "#Customer",
      "exclude": ["id", "createdAt", "updatedAt", "tags"]
    }`;

    return this.schemaParser.parseSchema(inputSchema, 'Customer');
  }

  getTargetSchema(): JsonSchema {
    // Using object format
    const outputSchema: SchemaDocument = {
      $ref: '#UserProfile',
      exclude: ['id', 'createdAt'],
      title: 'User Profile',
    };

    return this.schemaParser.parseSchema(outputSchema, 'User Profile');
  }

  // Alternative: Get schema with inline definitions
  getSchemaWithInlineDefinitions(): JsonSchema {
    const schemaWithDefs = `{
      "$ref": "#/definitions/Order",
      "definitions": {
        "Order": {
          "type": "object",
          "properties": {
            "orderId": { "type": "string" },
            "customer": { "$ref": "#/definitions/CustomerRef" },
            "total": { "type": "number" }
          }
        },
        "CustomerRef": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          }
        }
      }
    }`;

    return this.schemaParser.parseSchema(schemaWithDefs, 'Order');
  }

  getSampleData(): Record<string, unknown> {
    return {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-123-4567',
      birthDate: '1990-05-15',
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      accountBalance: 1234.56,
      isActive: true,
    };
  }

  // Method to parse any schema string
  parseSchemaString(schemaJson: string, name: string): JsonSchema {
    return this.schemaParser.parseSchema(schemaJson, name);
  }

  // Method to register additional models
  registerModels(models: ModelRegistry): void {
    this.schemaParser.registerModels(models);
  }
}
