import * as vscode from 'vscode';
import { RestClientPanel } from './panels/RestClientPanel';
import { SidebarProvider } from './providers/SidebarProvider';

/**
 * Punto de entrada principal de la extensión.
 * Se ejecuta una sola vez cuando la extensión es activada.
 * @param context El contexto proveído por VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "sputnik-api" está activa');

    // Registra el proveedor de datos para la barra lateral (Activity Bar) como WebviewView
    const sidebarProvider = new SidebarProvider(context);
    
    // Registra el proveedor para la vista en la Activity Bar
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'sputnik-api-view',
            sidebarProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Registra el comando que abre o muestra el Webview
    const openCommand = vscode.commands.registerCommand('sputnik-api.open', () => {
        RestClientPanel.render(context);
    });

    // Permite guardar una petición desde el Webview (se expone el provider al panel)
    RestClientPanel.setSidebarProvider(sidebarProvider);

    // Añade los comandos a las suscripciones para que se limpien al desactivar la extensión
    context.subscriptions.push(
        openCommand
    );
}

/**
 * Se ejecuta cuando la extensión es desactivada.
 * Permite limpiar recursos si es necesario.
 */
export function deactivate() {}