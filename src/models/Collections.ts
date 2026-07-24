import { RequestData } from '../services/ApiService';

/**
 * Representa una petición guardada en una colección.
 */
export interface SavedRequest {
    id: string;
    name: string;
    requestData: RequestData;
}

/**
 * Representa una colección (carpeta) que puede contener peticiones guardadas.
 */
export interface Collection {
    id: string;
    name: string;
    requests: SavedRequest[];
}
