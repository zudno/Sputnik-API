import * as vscode from 'vscode';
import { RestClientPanel } from './panels/RestClientPanel';
import { ActivityBarProvider } from './providers/ActivityBarProvider';

/**
 * Punto de entrada principal de la extensión.
 * Se ejecuta una sola vez cuando la extensión es activada.
 * @param context El contexto proveído por VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "sputnik-api" está activa');

    // Registra el comando que abre o muestra el Webview
    const openCommand = vscode.commands.registerCommand('sputnik-api.open', () => {
        RestClientPanel.render(context);
    });

    // Registra el proveedor de datos para la barra lateral (Activity Bar)
    const activityBarProvider = new ActivityBarProvider();
    // Registra el proveedor para la vista en la Activity Bar
    vscode.window.registerTreeDataProvider('sputnik-api-view', activityBarProvider);

    // Añade los comandos a las suscripciones para que se limpien al desactivar la extensión
    context.subscriptions.push(openCommand);
}

/**
 * Se ejecuta cuando la extensión es desactivada.
 * Permite limpiar recursos si es necesario.
 */
export function deactivate() {}