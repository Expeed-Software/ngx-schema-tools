import { Injectable, signal, computed } from '@angular/core';
import { JsonSchema } from '@expeed/ngx-data-mapper';

export interface StoredSchema extends JsonSchema {
  id: string;
}

export interface StoredMapping {
  id: string;
  name: string;
  sourceSchemaId: string;
  targetSchemaId: string;
  mappingData?: unknown; // The actual mapping configuration
  createdAt: string;
  updatedAt: string;
}

export interface SchemaUIConfig {
  schemaId: string;
  columns: 1 | 2;
  defaultFieldColumns: number;
  fieldColumns: Record<string, number>;
  excludeFields: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  // Schemas state
  private _schemas = signal<StoredSchema[]>([]);
  schemas = this._schemas.asReadonly();

  // Mappings state
  private _mappings = signal<StoredMapping[]>([]);
  mappings = this._mappings.asReadonly();

  // UI Configs state
  private _uiConfigs = signal<SchemaUIConfig[]>([]);
  uiConfigs = this._uiConfigs.asReadonly();

  constructor() {
    this.loadFromStorage();
  }

  // --- Storage ---

  private loadFromStorage(): void {
    // Load schemas
    const savedSchemas = localStorage.getItem('objectSchemas');
    if (savedSchemas) {
      try {
        this._schemas.set(JSON.parse(savedSchemas));
      } catch (e) {
        console.error('Failed to load schemas:', e);
      }
    }

    // If no schemas, add default sample schemas
    if (this._schemas().length === 0) {
      this.addDefaultSchemas();
    }

    // Load mappings
    const savedMappings = localStorage.getItem('dataMappings');
    if (savedMappings) {
      try {
        this._mappings.set(JSON.parse(savedMappings));
      } catch (e) {
        console.error('Failed to load mappings:', e);
      }
    }

    // Load UI configs
    const savedUIConfigs = localStorage.getItem('schemaUIConfigs');
    if (savedUIConfigs) {
      try {
        this._uiConfigs.set(JSON.parse(savedUIConfigs));
      } catch (e) {
        console.error('Failed to load UI configs:', e);
      }
    }
  }

  // Reset to default schemas (clears existing and adds defaults)
  resetToDefaults(): void {
    localStorage.removeItem('objectSchemas');
    localStorage.removeItem('dataMappings');
    localStorage.removeItem('schemaUIConfigs');
    this._schemas.set([]);
    this._mappings.set([]);
    this._uiConfigs.set([]);
    this.addDefaultSchemas();
  }

  private addDefaultSchemas(): void {
    // Customer schema (source)
    this.addSchema({
      type: 'object',
      title: 'Customer',
      properties: {
        firstName: { type: 'string', description: 'Customer first name' },
        lastName: { type: 'string', description: 'Customer last name' },
        middleName: { type: 'string', description: 'Customer middle name' },
        prefix: { type: 'string', description: 'Name prefix (Mr, Mrs, Dr)' },
        suffix: { type: 'string', description: 'Name suffix (Jr, Sr, III)' },
        email: { type: 'string', description: 'Email address' },
        secondaryEmail: { type: 'string', description: 'Secondary email' },
        phone: { type: 'string', description: 'Phone number with area code' },
        mobilePhone: { type: 'string', description: 'Mobile phone number' },
        birthDate: { type: 'string', description: 'Date of birth' },
        gender: { type: 'string', description: 'Gender' },
        language: { type: 'string', description: 'Preferred language' },
        address: {
          type: 'object',
          description: 'Customer address',
          properties: {
            street: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City name' },
            state: { type: 'string', description: 'State code' },
            zipCode: { type: 'string', description: 'Postal code' },
            country: { type: 'string', description: 'Country code' },
          },
        },
        accountBalance: { type: 'number', description: 'Current account balance' },
        loyaltyPoints: { type: 'number', description: 'Loyalty points balance' },
        isActive: { type: 'boolean', description: 'Account active status' },
        isVerified: { type: 'boolean', description: 'Email verified status' },
      },
    });

    // UserProfile schema (target)
    this.addSchema({
      type: 'object',
      title: 'UserProfile',
      properties: {
        fullName: { type: 'string', description: 'Full display name' },
        displayName: { type: 'string', description: 'Public display name' },
        emailAddress: { type: 'string', description: 'Email address' },
        alternateEmail: { type: 'string', description: 'Alternate email' },
        phoneNumber: { type: 'string', description: 'Phone number' },
        mobileNumber: { type: 'string', description: 'Mobile number' },
        birthYear: { type: 'string', description: 'Birth year' },
        age: { type: 'number', description: 'Calculated age' },
        preferredLanguage: { type: 'string', description: 'Preferred language' },
        location: {
          type: 'object',
          description: 'User location',
          properties: {
            fullAddress: { type: 'string', description: 'Combined street and city' },
            region: { type: 'string', description: 'State or region' },
            postalCode: { type: 'string', description: 'Postal code' },
            country: { type: 'string', description: 'Country' },
          },
        },
        balance: { type: 'string', description: 'Formatted balance with currency' },
        rewardPoints: { type: 'number', description: 'Reward points' },
        status: { type: 'string', description: 'Account status' },
        isEmailVerified: { type: 'boolean', description: 'Email verified' },
        hasOptedInMarketing: { type: 'boolean', description: 'Marketing opt-in' },
      },
    });
  }

  private saveSchemas(): void {
    localStorage.setItem('objectSchemas', JSON.stringify(this._schemas()));
  }

  private saveMappings(): void {
    localStorage.setItem('dataMappings', JSON.stringify(this._mappings()));
  }

  private saveUIConfigs(): void {
    localStorage.setItem('schemaUIConfigs', JSON.stringify(this._uiConfigs()));
  }

  // --- Schema Operations ---

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSchemaById(id: string): StoredSchema | undefined {
    return this._schemas().find(s => s.id === id);
  }

  addSchema(schema: Omit<StoredSchema, 'id'>): StoredSchema {
    const newSchema: StoredSchema = {
      ...schema,
      id: this.generateId('schema'),
    };
    this._schemas.update(list => [...list, newSchema]);
    this.saveSchemas();
    return newSchema;
  }

  updateSchema(id: string, schema: Partial<JsonSchema>): void {
    this._schemas.update(list =>
      list.map(s => {
        if (s.id !== id) return s;
        // Create new schema with only the id preserved, replacing all other properties
        // This ensures removed properties (like empty 'required' array) are actually removed
        const { id: schemaId } = s;
        return { id: schemaId, ...schema } as StoredSchema;
      })
    );
    this.saveSchemas();
  }

  deleteSchema(id: string): void {
    this._schemas.update(list => list.filter(s => s.id !== id));
    this.saveSchemas();
  }

  setSchemas(schemas: StoredSchema[]): void {
    this._schemas.set(schemas);
    this.saveSchemas();
  }

  // --- Mapping Operations ---

  getMappingById(id: string): StoredMapping | undefined {
    return this._mappings().find(m => m.id === id);
  }

  addMapping(mapping: Omit<StoredMapping, 'id' | 'createdAt' | 'updatedAt'>): StoredMapping {
    const now = new Date().toISOString();
    const newMapping: StoredMapping = {
      ...mapping,
      id: this.generateId('mapping'),
      createdAt: now,
      updatedAt: now,
    };
    this._mappings.update(list => [...list, newMapping]);
    this.saveMappings();
    return newMapping;
  }

  updateMapping(id: string, mapping: Partial<StoredMapping>): void {
    this._mappings.update(list =>
      list.map(m => m.id === id ? { ...m, ...mapping, updatedAt: new Date().toISOString() } : m)
    );
    this.saveMappings();
  }

  updateMappingData(id: string, mappingData: unknown): void {
    this.updateMapping(id, { mappingData });
  }

  deleteMapping(id: string): void {
    this._mappings.update(list => list.filter(m => m.id !== id));
    this.saveMappings();
  }

  // --- Helpers ---

  getSchemaName(id: string): string {
    const schema = this.getSchemaById(id);
    return schema?.title || 'Unknown';
  }

  // --- UI Config Operations ---

  getUIConfigBySchemaId(schemaId: string): SchemaUIConfig | undefined {
    return this._uiConfigs().find(c => c.schemaId === schemaId);
  }

  saveUIConfig(config: SchemaUIConfig): void {
    const existingIndex = this._uiConfigs().findIndex(c => c.schemaId === config.schemaId);
    if (existingIndex >= 0) {
      this._uiConfigs.update(list => list.map((c, i) => i === existingIndex ? config : c));
    } else {
      this._uiConfigs.update(list => [...list, config]);
    }
    this.saveUIConfigs();
  }

  deleteUIConfig(schemaId: string): void {
    this._uiConfigs.update(list => list.filter(c => c.schemaId !== schemaId));
    this.saveUIConfigs();
  }
}
