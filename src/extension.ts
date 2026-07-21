import * as vscode from 'vscode';
import { RestClientPanel } from './panels/RestClientPanel';
import { ActivityBarProvider } from './providers/ActivityBarProvider';

/**
 * Punto de entrada principal de la extensión.
 * Se ejecuta una sola vez cuando la extensión es activada.
 * @param context El contexto proveído por VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('La extensión "zudno-postman" está activa');

    // Registra el comando que abre el panel principal del Cliente REST
    const openCommand = vscode.commands.registerCommand('zudno-postman.open', () => {
        RestClientPanel.render(context);
    });

    // Registra el proveedor de datos para la barra lateral (Activity Bar)
    const activityBarProvider = new ActivityBarProvider();
    vscode.window.registerTreeDataProvider('zudno-postman-view', activityBarProvider);

    // Añade los comandos a las suscripciones para que se limpien al desactivar la extensión
    context.subscriptions.push(openCommand);
}

/**
 * Se ejecuta cuando la extensión es desactivada.
 * Permite limpiar recursos si es necesario.
 */
export function deactivate() {}