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
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build')] // Permite cargar recursos de React
            }
        );

        // Genera la URI segura para cargar el CSS compilado de Tailwind
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build', 'assets', 'index.js')
        );
        const styleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build', 'assets', 'index.css')
        );

        // Define the HTML for the Webview
        panel.webview.html = this.getHtmlContent(scriptUri, styleUri);

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
     * Genera y retorna el código HTML y JS embebido, inyectando los assets compilados de React.
     * @param scriptUri La URI segura para cargar el archivo JS.
     * @param styleUri La URI segura para cargar el archivo CSS.
     * @returns Un string con el documento HTML completo.
     */
    private static getHtmlContent(scriptUri: vscode.Uri, styleUri: vscode.Uri): string {
        return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Zudno Client</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div id="root"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
