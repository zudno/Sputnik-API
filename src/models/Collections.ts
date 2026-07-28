import { RequestData } from '../services/ApiService';

/**
 * Representa una petición guardada en una colección.
 */
export interface SavedRequest {
    id: string;
    name: string;
    requestData: RequestData;
}

export type ItemType = 'folder' | 'request';

export interface CollectionItem {
    id: string;
    type: ItemType;
    name: string;
    
    // For folders
    expanded?: boolean;
    items?: CollectionItem[];
    
    // For requests
    requestData?: RequestData;
}

/**
 * Representa una colección (carpeta raíz) que puede contener elementos.
 */
export interface Collection {
    id: string;
    name: string;
    items: CollectionItem[];
    expanded?: boolean;
    // Legacy support (optional)
    requests?: any[];
}
