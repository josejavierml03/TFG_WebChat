import os
from openai import OpenAI
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from flask import Response

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__, static_folder="static")

@app.route('/')
def serve_index():
    return send_from_directory("static", "index.html")

@app.route('/query', methods=['POST'])
def handle_query():
    data = request.json
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"response": "La consulta no puede estar vacía."})

    def generate():
        try:
            stream = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Eres un experto en programación web. Responde con una explicación textual y ejemplos de código usando bloques de código en Markdown (```html ...```). "
                "                               Solo puedes responder preguntas sobre programación web, si la pregunta no es sobre este tema, responde con 'Solo puedo responder preguntas sobre programación web'."},
                    {"role": "user", "content": query}
                ],
                stream=True
            )

            for chunk in stream:
                delta = chunk.choices[0].delta
                content = getattr(delta, "content", None)
                if content is not None:
                    yield content.encode('utf-8')

        except Exception as e:
            yield f"[ERROR] {str(e)}".encode('utf-8')


    return Response(generate(), mimetype='text/plain; charset=utf-8')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)
