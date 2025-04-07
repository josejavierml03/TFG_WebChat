import os
import openai
from openai import OpenAI
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Cargar variables desde .env
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Crear cliente de OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__, static_folder="static")

@app.route('/')
def serve_index():
    return send_from_directory("static", "index.html")

@app.route('/query', methods=['POST'])
def handle_query():
    """Recibe la consulta del usuario y la envía a OpenAI."""
    data = request.json
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"response": "La consulta no puede estar vacía."})

    try:
        # Enviar la consulta a la API de OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto en HTML. Responde con ejemplos de código usando bloques de código en Markdown (```html ...```). Solo puedes responder preguntas sobre HTML y su sintaxis. Si la pregunta no es sobre HTML, responde con 'Solo puedo responder preguntas sobre HTML'."},
                {"role": "user", "content": query}
            ]
        )

        chatgpt_response = response.choices[0].message.content
        return jsonify({"response": chatgpt_response})

    except Exception as e:
        return jsonify({"response": f"Error al conectar con ChatGPT: {str(e)}"})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)
