import axios, { AxiosResponse } from 'axios';

/**
 * Interfaz para los datos que llegan desde el Webview.
 */
export interface RequestData {
    url: string;
    method: string;
    headers: string;
    body: string;
}

/**
 * Interfaz para la respuesta que se enviará de vuelta al Webview.
 */
export interface ResponseData {
    status?: number;
    statusText?: string;
    headers?: any;
    data?: any;
    time?: number;
    error?: string;
}

/**
 * Servicio encargado de realizar las peticiones HTTP.
 */
export class ApiService {
    
    /**
     * Realiza una petición HTTP utilizando Axios basándose en los datos proporcionados.
     * @param requestData Objeto con la información de la petición.
     * @returns Promesa con los datos de la respuesta listos para enviar al Webview.
     */
    public static async sendRequest(requestData: RequestData): Promise<ResponseData> {
        try {
            const { url, method, headers, body } = requestData;
            
            const parsedHeaders = this.parseHeaders(headers);
            const startTime = Date.now();
            
            const response: AxiosResponse = await axios({
                method: method,
                url: url,
                headers: parsedHeaders,
                // Evitamos enviar body en GET/HEAD
                data: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
                validateStatus: () => true // Permite capturar códigos 4xx o 5xx sin lanzar error
            });
            
            const timeTaken = Date.now() - startTime;
            
            return {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data: response.data,
                time: timeTaken
            };
        } catch (error: any) {
            return {
                error: error.message || 'Error desconocido al ejecutar la petición'
            };
        }
    }

    /**
     * Convierte un string multilinea de headers en un objeto clave-valor.
     * @param headersString Texto crudo de los headers.
     * @returns Objeto Record con los headers parseados.
     */
    private static parseHeaders(headersString: string): Record<string, string> {
        const parsed: Record<string, string> = {};
        if (!headersString) {
            return parsed;
        }

        headersString.split('\\n').forEach((line: string) => {
            const [key, ...rest] = line.split(':');
            if (key && rest.length > 0) {
                parsed[key.trim()] = rest.join(':').trim();
            }
        });

        return parsed;
    }
}
