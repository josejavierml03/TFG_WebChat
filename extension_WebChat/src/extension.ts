import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.showPanel', () => {
        const panel = vscode.window.createWebviewPanel(
            'askAPI', // Identificador único
            'Consulta API', // Título del panel
            vscode.ViewColumn.Beside, // Mostrar al lado
            {
                enableScripts: true, // Habilitar scripts dentro del Webview
            }
        );

        // HTML del Webview
        panel.webview.html = getWebviewContent();

        // Enviar la pregunta cuando se hace clic en el botón
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'askQuestion':
                    // Aquí envías la pregunta a la API
                    sendQuestionToAPI(message.text).then(response => {
                        panel.webview.postMessage({ command: 'showResponse', text: response });
                    });
                    return;
            }
        });
    });

    context.subscriptions.push(disposable);
}

// Función para obtener el contenido HTML
function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Consulta API</title>
           <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                height: 100vh;
                background-color: #1e1e1e;
                color: #d4d4d4;
            }

            #response {
                flex-grow: 1;
                overflow-y: auto;
                padding: 15px;
                background-color: #1e1e1e;
                border-bottom: 2px solid #333;
            }

            #input-container {
                display: flex;
                padding: 10px;
                border-top: 2px solid #333;
                background-color: #252526;
            }

            #input-container input {
                flex-grow: 1;
                padding: 10px;
                border-radius: 5px;
                border: 1px solid #555;
                background-color: #1e1e1e;
                color: #ffffff;
                outline: none;
            }

            #input-container input::placeholder {
                color: #888;
            }

            #input-container button {
                margin-left: 10px;
                background-color: #007acc;
                color: white;
                padding: 10px 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            #input-container button:hover {
                background-color: #005f99;
            }

            pre {
                background-color: #2d2d2d;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                color: #dcdcdc;
            }

            code {
                font-family: 'Courier New', monospace;
                color: #9cdcfe;
            }

            a {
                color: #3794ff;
            }
        </style>

        </head>
        <body>
            <div id="response"></div>
            <div id="input-container">
                <input type="text" id="question" placeholder="Escribe tu pregunta...">
                <button id="sendButton">Enviar</button>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <script>
                window.addEventListener('DOMContentLoaded', () => {
                    const vscode = acquireVsCodeApi();

                    document.getElementById('sendButton').onclick = () => {
                        const question = document.getElementById('question').value;
                        vscode.postMessage({ command: 'askQuestion', text: question });
                    };

                    document.getElementById('question').addEventListener('keydown', (event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault(); // evita que se envíe un formulario o refresque
                            document.getElementById('sendButton').click(); // simula clic en el botón
                        }
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        console.log("Mensaje recibido:", message);

                        if (message.command === 'showResponse') {
                            const responseDiv = document.getElementById('response');
                            const newResponse = document.createElement('div');

                            try {
                                newResponse.innerHTML = marked.parse(message.text);
                            } catch (err) {
                                console.error("Error al procesar Markdown:", err);
                                newResponse.textContent = message.text;
                            }

                            responseDiv.appendChild(newResponse);
                            responseDiv.scrollTop = responseDiv.scrollHeight;
                        }
                    });
                });
            </script>
        </body>
        </html>
    `;
}

// Definir una interfaz para la respuesta de la API
interface ApiResponse {
    response: string; // Aquí definimos que el campo 'response' es un string
}

// Función para enviar la pregunta a la API
async function sendQuestionToAPI(question: string): Promise<string> {
    console.log("Simulando respuesta de la API para la pregunta:", question);

    const markdownResponse = `
Claro, en HTML los párrafos se crean utilizando la etiqueta \`<p>\`. Esta etiqueta define un párrafo de texto y automáticamente inserta un espacio en blanco antes y después del párrafo.

Aquí tienes un ejemplo de cómo se vería un párrafo en HTML:

\`\`\`html
<p>Este es un párrafo de ejemplo en HTML. Aquí puedes escribir tu texto.</p>
\`\`\`

Y puedes agregar tantos párrafos como desees en tu documento HTML:

\`\`\`html
<p>Este es el primer párrafo.</p>

<p>Este es el segundo párrafo.</p>

<p>Y este sería un tercer párrafo en el documento.</p>
\`\`\`

Recuerda que el navegador automáticamente añadirá algo de espacio antes y después de cada párrafo para facilitar la lectura y visualización del contenido.
`;

    return markdownResponse;

    /*
    // Realizar la petición a la API
    const response = await fetch('http://192.168.18.5:8080/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question })
    });

    // Verificamos que la respuesta sea válida
    if (!response.ok) {
        throw new Error('Error al obtener la respuesta de la API');
    }

    // Parsear la respuesta como ApiResponse
    const data = (await response.json()) as ApiResponse;
    
    // Retornar el campo 'response' de la respuesta
    console.log("Respuesta recibida de la API:", data.response);
    return data.response;
    */
}




