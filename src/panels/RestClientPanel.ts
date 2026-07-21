import * as vscode from 'vscode';
import { ApiService, RequestData } from '../services/ApiService';

/**
 * Clase que gestiona el ciclo de vida y la comunicación del Webview del Cliente REST.
 */
export class RestClientPanel {
    
    /**
     * Instancia un nuevo panel o lo muestra si ya existe.
     * @param context Contexto de la extensión para manejar recursos.
     */
    public static render(context: vscode.ExtensionContext): void {
        const panel = vscode.window.createWebviewPanel(
            'zudnoPostman',
            'Zudno Client',
            vscode.ViewColumn.One,
            { 
                enableScripts: true,
                retainContextWhenHidden: true // Mantiene el estado si el usuario cambia de pestaña
            }
        );

        panel.webview.html = this.getHtmlContent();

        // Escuchar mensajes provenientes del Webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'sendRequest') {
                    const requestData = message.data as RequestData;
                    // Llama al servicio API para hacer la petición
                    const response = await ApiService.sendRequest(requestData);
                    
                    // Envía la respuesta de vuelta al Webview
                    panel.webview.postMessage({
                        command: 'response',
                        data: response
                    });
                }
            },
            undefined,
            context.subscriptions
        );
    }

    /**
     * Genera y retorna el código HTML, CSS y JS embebido para la interfaz del usuario.
     * @returns Un string con el documento HTML completo.
     */
    private static getHtmlContent(): string {
        return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Zudno Client</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .row {
                    display: flex;
                    gap: 10px;
                }
                input, select, textarea {
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 8px;
                    border-radius: 4px;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                input:focus, select:focus, textarea:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    border-color: var(--vscode-focusBorder);
                }
                .url-input {
                    flex-grow: 1;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    border-radius: 4px;
                    font-weight: bold;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                textarea {
                    width: 100%;
                    min-height: 100px;
                    resize: vertical;
                    font-family: monospace;
                }
                .section {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .response-container {
                    border: 1px solid var(--vscode-panel-border);
                    padding: 10px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                    overflow: auto;
                    max-height: 400px;
                }
                pre {
                    margin: 0;
                }
                .status {
                    font-weight: bold;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <h2>Zudno REST Client</h2>
            <div class="row">
                <select id="method">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>
                <input type="text" id="url" class="url-input" placeholder="https://api.example.com/data" value="https://jsonplaceholder.typicode.com/todos/1">
                <button id="sendBtn">Send</button>
            </div>

            <div class="section">
                <label for="headers">Headers (uno por línea, formato Clave: Valor)</label>
                <textarea id="headers" placeholder="Content-Type: application/json"></textarea>
            </div>

            <div class="section">
                <label for="body">Body (JSON, Text, etc.)</label>
                <textarea id="body" placeholder='{"key": "value"}'></textarea>
            </div>

            <h3>Response</h3>
            <div class="response-container" id="responseBox">
                <div id="status" class="status">Waiting for request...</div>
                <pre id="responseBody"></pre>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('sendBtn').addEventListener('click', () => {
                    const url = document.getElementById('url').value;
                    const method = document.getElementById('method').value;
                    const headers = document.getElementById('headers').value;
                    const body = document.getElementById('body').value;

                    document.getElementById('status').innerText = 'Loading...';
                    document.getElementById('responseBody').innerText = '';

                    vscode.postMessage({
                        command: 'sendRequest',
                        data: { url, method, headers, body }
                    });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'response') {
                        const statusEl = document.getElementById('status');
                        const bodyEl = document.getElementById('responseBody');
                        
                        if (message.data.error) {
                            statusEl.innerText = 'Error';
                            statusEl.style.color = 'var(--vscode-errorForeground)';
                            bodyEl.innerText = message.data.error;
                        } else {
                            const d = message.data;
                            statusEl.innerText = \`Status: \${d.status} \${d.statusText} | Time: \${d.time}ms\`;
                            statusEl.style.color = d.status >= 200 && d.status < 300 ? '#4caf50' : 'var(--vscode-errorForeground)';
                            
                            try {
                                if (typeof d.data === 'object') {
                                    bodyEl.innerText = JSON.stringify(d.data, null, 2);
                                } else {
                                    const parsed = JSON.parse(d.data);
                                    bodyEl.innerText = JSON.stringify(parsed, null, 2);
                                }
                            } catch(e) {
                                bodyEl.innerText = d.data;
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
