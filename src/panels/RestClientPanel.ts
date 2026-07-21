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
                retainContextWhenHidden: true, // Mantiene el estado si el usuario cambia de pestaña
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')] // Permite cargar CSS compilado
            }
        );

        // Genera la URI segura para cargar el CSS compilado de Tailwind
        const tailwindUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'dist', 'tailwind.css')
        );

        panel.webview.html = this.getHtmlContent(tailwindUri);

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
     * Genera y retorna el código HTML y JS embebido, inyectando Tailwind CSS.
     * @param tailwindUri La URI segura para cargar el archivo CSS compilado.
     * @returns Un string con el documento HTML completo.
     */
    private static getHtmlContent(tailwindUri: vscode.Uri): string {
        // Clases comunes de Tailwind reutilizadas
        const inputClasses = "bg-transparent text-vsc-input-foreground border border-vsc-panel-border p-2 rounded focus:outline focus:outline-1 focus:outline-vsc-focus focus:border-vsc-focus box-border";
        const labelClasses = "mb-1 text-sm";
        
        return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Zudno Client</title>
            <!-- Inyectar Tailwind CSS -->
            <link href="${tailwindUri}" rel="stylesheet">
        </head>
        <body class="font-sans bg-vsc-background text-vsc-foreground p-5 flex flex-col gap-4">
            
            <h2 class="text-xl font-bold mb-2">Zudno REST Client</h2>
            
            <div class="flex gap-2">
                <div class="flex flex-grow items-stretch border border-vsc-panel-border rounded bg-transparent focus-within:border-vsc-focus focus-within:outline focus-within:outline-1 focus-within:outline-vsc-focus">
                    <div class="flex items-center border-r border-vsc-panel-border relative">
                        <select id="method" class="bg-transparent font-bold cursor-pointer outline-none border-none pl-3 pr-7 py-3 appearance-none text-vsc-http-get h-full" style="background-image: url('data:image/svg+xml;utf8,<svg fill=\\'%239ca3af\\' height=\\'20\\' viewBox=\\'0 0 24 24\\' width=\\'20\\' xmlns=\\'http://www.w3.org/2000/svg\\'><path d=\\'M7 10l5 5 5-5z\\'/></svg>'); background-repeat: no-repeat; background-position: right 4px center;">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>
                    <input type="text" id="url" class="bg-transparent text-vsc-input-foreground flex-grow font-mono px-3 py-3 outline-none border-none w-full" placeholder="https://api.example.com/data" value="https://jsonplaceholder.typicode.com/todos/1">
                </div>
                <button id="sendBtn" class="bg-vsc-postman-blue text-white py-3 px-6 font-bold hover:bg-vsc-postman-hover border-none cursor-pointer rounded transition-colors">Send</button>
            </div>

            <div class="flex flex-col">
                <label for="headers" class="${labelClasses}">Headers (uno por línea, formato Clave: Valor)</label>
                <textarea id="headers" class="${inputClasses} w-full min-h-[100px] resize-y font-mono" placeholder="Content-Type: application/json"></textarea>
            </div>

            <div class="flex flex-col">
                <label for="body" class="${labelClasses}">Body (JSON, Text, etc.)</label>
                <textarea id="body" class="${inputClasses} w-full min-h-[100px] resize-y font-mono" placeholder='{"key": "value"}'></textarea>
            </div>

            <h3 class="text-lg font-semibold mt-2">Response</h3>
            <div id="responseBox" class="border border-vsc-panel-border p-3 bg-vsc-inactive rounded overflow-auto max-h-[400px]">
                <div id="status" class="font-bold mb-2">Waiting for request...</div>
                <pre id="responseBody" class="m-0 font-mono text-sm"></pre>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                // Color dinámico del select según el método
                const methodEl = document.getElementById('method');
                const methodColors = {
                    'GET': 'text-vsc-http-get',
                    'POST': 'text-vsc-http-post',
                    'PUT': 'text-vsc-http-put',
                    'PATCH': 'text-vsc-http-patch',
                    'DELETE': 'text-vsc-http-delete'
                };
                
                methodEl.addEventListener('change', () => {
                    Object.values(methodColors).forEach(c => methodEl.classList.remove(c));
                    const newColor = methodColors[methodEl.value] || 'text-vsc-foreground';
                    methodEl.classList.add(newColor);
                });
                
                document.getElementById('sendBtn').addEventListener('click', () => {
                    const url = document.getElementById('url').value;
                    const method = document.getElementById('method').value;
                    const headers = document.getElementById('headers').value;
                    const body = document.getElementById('body').value;

                    document.getElementById('status').innerText = 'Loading...';
                    document.getElementById('status').className = 'font-bold mb-2';
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
                            statusEl.className = 'font-bold mb-2 text-vsc-error';
                            bodyEl.innerText = message.data.error;
                        } else {
                            const d = message.data;
                            statusEl.innerText = \`Status: \${d.status} \${d.statusText} | Time: \${d.time}ms\`;
                            statusEl.className = \`font-bold mb-2 \${d.status >= 200 && d.status < 300 ? 'text-vsc-success' : 'text-vsc-error'}\`;
                            
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
