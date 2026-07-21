import * as vscode from 'vscode';

/**
 * Provider para el TreeView del Activity Bar.
 * Muestra las opciones disponibles en la vista lateral de la extensión.
 */
export class ActivityBarProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    /**
     * Devuelve el elemento del árbol que se va a mostrar.
     * @param element El elemento actual del árbol.
     * @returns El mismo elemento que se va a renderizar.
     */
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Devuelve los hijos del elemento dado o la raíz si no se provee elemento.
     * @param element Elemento padre (opcional).
     * @returns Promesa con un arreglo de elementos hijos.
     */
    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element) {
            // Actualmente no tenemos sub-niveles, así que retornamos vacío.
            return Promise.resolve([]);
        } else {
            // Elementos de la raíz del TreeView
            const item = new vscode.TreeItem("Abrir Cliente REST", vscode.TreeItemCollapsibleState.None);
            
            // Comando que se ejecutará al hacer clic
            item.command = {
                command: 'zudno-postman.open',
                title: 'Abrir Cliente REST'
            };
            
            // Ícono nativo de VS Code
            item.iconPath = new vscode.ThemeIcon('symbol-interface');
            
            return Promise.resolve([item]);
        }
    }
}
