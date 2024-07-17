import shutil
import sys
import uuid
import random
import json

import httpx
from flask import Flask, request, Response, jsonify, session
import json
from flask_session import Session
import redis

from flask import Flask, request, send_from_directory, jsonify, render_template, Response
from PyPDF2 import PdfReader, PdfWriter
from langserve import RemoteRunnable

import utils.scan_documents as scan_docs
import os
import requests

# modify the base path so to be able to  import the modules from ICOS
# Assuming 'PDF Selection' and 'ICOS' are subfolders of 'LLMs'
base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(base_path)

app = Flask(__name__, static_folder='static')

PDF_FOLDER = 'documents/PDFs'
PDF_TEMP_FOLDER = 'documents/TempPDFs'
PARENT_TEXT_FOLDER = 'documents/TextFiles'

file_prefix = "temp_file"


# Define custom escapejs filter
# This filter is typically provided by Flask extensions like Flask-WTF or Flask-JSGlue, but if you don't have those installed, you can manually define a similar filter in your Flask application.
# Let's define a custom escapejs filter in your Flask app to safely pass the JSON data to JavaScript.
def escapejs(value):
    if isinstance(value, str):
        value = value.replace('\\', '\\\\').replace('\n', '\\n').replace('\r', '\\r')
        value = value.replace('"', '\\"').replace("'", "\\'")
        value = value.replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e')
    return value


app.jinja_env.filters['escapejs'] = escapejs

# Secret key for session management
app.secret_key = 'supersecretkey#42'

# Configure session to use Redis
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_REDIS'] = redis.from_url('redis://localhost:6379')
Session(app)
redis_client = app.config['SESSION_REDIS']


#  if you need to remove it all
# redis_client.flushall()


@app.route('/get_user_id', methods=['GET'])
def get_user_id():
    return jsonify({
        'user_id': "user_" + str(random.randint(0, 1000)),
        'session_id': str(uuid.uuid4())
    })


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    question = data.get('question', '')

    conversation_id = str(uuid.uuid4())
    local_chat = RemoteRunnable("http://localhost:8010/chat/", cookies={"user_id": "pop"}, timeout=3000)
    result = local_chat.invoke({'question': question, 'context': ""},
                               {'configurable': {'conversation_id': conversation_id}})
    print(result)
    return result


@app.route('/')
def index():
    return render_template('front_page.html')


@app.route('/multiple_docs')
def multiple_docs():
    return render_template('search_multiple_docs.html')


@app.route('/one_doc')
def one_doc():
    return render_template('catalogue_browsing.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/pdfs', methods=['GET'])
def list_pdfs():
    pdf_files = [f for f in os.listdir(PDF_FOLDER) if f.endswith('.pdf')]
    pdf_files.sort()
    return jsonify(pdf_files)


@app.route('/pdf/<filename>', methods=['GET'])
def get_pdf(filename):
    doc = send_from_directory(PDF_FOLDER, filename)
    return doc


@app.route('/popup')
def popup():
    pdf_doc = request.args.get('pdf_doc')
    page_num = request.args.get('page_num')
    return render_template('show_PDF.html', pdfDoc=pdf_doc, pageNum=page_num)


@app.route('/get_raw_text_from_pdf', methods=['POST'])
def get_raw_text_from_pdf():
    data = request.json
    filename = data['filename']
    start_page = data['start_page']
    end_page = data['end_page']

    # Create a temporary directory
    temp_dir = scan_docs.create_output_dir(PDF_TEMP_FOLDER)

    # Get the absolute path of the temporary directory
    temp_dir_path = os.path.abspath(temp_dir)
    print(f'Temporary directory created at: {temp_dir_path}')

    pdf_path = os.path.join(PDF_FOLDER, filename)

    reader = PdfReader(pdf_path)
    writer = PdfWriter()

    for page_num in range(start_page, end_page + 1):
        writer.add_page(reader.pages[page_num])

    output_filename = f"{file_prefix}_{start_page}_{end_page}_{filename}"
    output_path = os.path.join(temp_dir_path, output_filename)
    with open(output_path, 'wb') as output_pdf:
        writer.write(output_pdf)

    raw_text = scan_docs.process_pdfs_in_folder(temp_dir, PARENT_TEXT_FOLDER)
    # remove the temporary PDF files
    remove_file(temp_dir_path, output_filename)

    return jsonify(raw_text)


@app.route('/start_chat_on_PDF', methods=['POST'])
def start_chat_on_pdf():
    data = request.json
    raw_text = data['raw_text']
    question = data.get('question', '')
    user_id = data.get('user_id', 'idx')
    session_id = data.get('session_id')
    filter = data.get('filter')

    # Store the full prompt, user_id, and session_id in a session or other storage
    # For this example, we'll use a simple global variable (not suitable for production)
    # Store the prompt, user_id, and session_id in the session
    session['question'] = question
    session['raw_text'] = raw_text
    session['user_id'] = user_id
    session['session_id'] = session_id
    session['filter'] = filter

    return jsonify({'status': 'ok'})


def generate_chunks(path, current_user_id, current_session_id, question, raw_text, filter):
    with app.app_context():
        try:
            chat_runnable = RemoteRunnable(path,
                                           cookies={"user_id": current_user_id}, timeout=3000)
            for chunk in chat_runnable.stream({'question': question, 'context': raw_text, 'filter': filter},
                                              {'configurable': {'conversation_id': current_session_id}}):

                # print(chunk)
                result = {'documents': []}
                if 'documents' in chunk.keys():
                    for doc in chunk['documents']:
                        result['documents'].append(
                            {"page_content": doc['page_content'], "metadata": doc['metadata']})
                else:
                    result = chunk
                try:
                    result = json.dumps(result)
                except (TypeError, ValueError) as e:
                    print(f"Error serializing chunk to JSON: {e}")
                    continue  # Skip this chunk if it can't be serialized
                yield f"data: {result}\n\n"
        except httpx.HTTPStatusError as e:
            print(str(e))
            error_message = f"event: error\ndata: {{\"error\": \"{str(e)}\"}}\n\n"
            yield error_message
        except Exception as e:
            print(str(e))
            error_message = f"event: error\ndata: {{\"error\": \"{str(e)}\"}}\n\n"
            yield error_message


@app.route('/query_the_catalogues')
def stream_chat():
    current_user_id = request.args.get('user_id')
    current_session_id = request.args.get('session_id')
    if current_user_id != session.get('user_id') or current_session_id != session.get('session_id'):
        return Response("Invalid session or user ID", status=400)

    question = session.get('question')
    raw_text = session.get('raw_text')
    filter = session.get('filter')

    response = Response(generate_chunks("http://localhost:8010/query_the_catalogues/",
                                        current_user_id, current_session_id,
                                        question, raw_text, filter),
                        mimetype='text/event-stream')
    return response


@app.route('/query_a_doc')
def process_with_context():
    current_user_id = request.args.get('user_id')
    current_session_id = request.args.get('session_id')
    filter = request.args.get('filter')

    if current_user_id != session.get('user_id') or current_session_id != session.get('session_id'):
        return Response("Invalid session or user ID", status=400)

    question = session.get('question')
    raw_text = session.get('raw_text')

    result = Response(generate_chunks("http://localhost:8010/query_a_doc/",
                                      current_user_id, current_session_id,
                                      question, raw_text, filter)
                      , mimetype='text/event-stream')
    return result


@app.route('/retrieve_documents', methods=['GET'])
def retrieve_documents():
    current_user_id = request.args.get('user_id')
    current_session_id = request.args.get('session_id')
    current_filter = request.args.get('filter')

    if current_user_id != session.get('user_id') or current_session_id != session.get('session_id'):
        return jsonify({"error": "Invalid session or user ID"}), 400

    question = session.get('question')
    try:
        response = invoke_system_retrieval("http://localhost:8010/retrieve", current_user_id, current_session_id,
                                           question, current_filter)
        return jsonify(response)
    except httpx.HTTPStatusError as e:
        print(str(e))
        return jsonify({"error": str(e)}), e.response.status_code
    except Exception as e:
        print(str(e))
        return jsonify({"error": str(e)}), 500


import httpx


def invoke_system_retrieval(path, user_id, session_id, question, filter):
    chat = RemoteRunnable(path, cookies={"user_id": user_id}, timeout=3000)
    returned_object = chat.invoke({'question': question, 'context': "", 'filter': filter},
                                  {'configurable': {'conversation_id': session_id}})

    # Construct the result dictionary
    result = {
        'answer': returned_object['answer'],
        'docs': [
            {
                "page_content": doc['page_content'],
                "metadata": doc['metadata']
            }
            for doc in returned_object['documents']
        ]
    }

    # Print the entire result for debugging
    print(result)

    return result


def send_post_request(url, user_id, session_id, question, raw_text):
    payload = {
        'user_id': user_id,
        'session_id': session_id,
        'question': question,
        'raw_text': raw_text
    }

    response = httpx.post(url, json=payload)
    response.raise_for_status()
    return response


def chat_with_system(user_id, session_id, question, raw_text, filter):
    full_prompt = question + "<CONTEXT>\"\"\"" + raw_text + "\"\"\""
    chat_runnable = RemoteRunnable("http://localhost:8010/chat/", cookies={"user_id": user_id}, timeout=3000)
    chunk_list = []
    for chunk in chat_runnable.stream({'question': full_prompt, 'filter': filter},
                                      {'configurable': {'conversation_id': session_id}}):
        if 'documents' in chunk:
            result = {'documents': [
                {"page_content": doc.page_content, "metadata": doc.metadata}
                for doc in chunk['documents']]}
            print(result)
            chunk_list.append(result)
        else:
            print(chunk)
            chunk_list.append(chunk)
    return jsonify(chunk_list)


def remove_file(temp_dir_path, output_pdf):
    output_path = os.path.join(temp_dir_path, output_pdf)
    # Ensure the file exists before trying to remove it
    if os.path.exists(output_path):
        os.remove(output_path)
        print(f"File removed: {output_path}")
    else:
        print(f"File not found: {output_path}")

    # Ensure the directory exists before trying to remove it
    if os.path.exists(temp_dir_path):
        shutil.rmtree(temp_dir_path)
        print(f"Directory removed: {temp_dir_path}")
    else:
        print(f"Directory not found: {temp_dir_path}")


# saved queries into redis

@app.route('/save-documents', methods=['POST'])
def save_documents():
    data = request.json
    documents = data.get('documents_list', [])
    question = data.get('question', 'no question provided')
    response = data.get('response', 'no response provided')
    note = data.get('note', 'no note provided')
    session_id = request.args.get('session_id', str(uuid.uuid4()))  # Generate a random session ID if not provided

    # Save the documents in a hash
    redis_client.hmset(session_id, {
        'documents_list': json.dumps(documents),
        'question': question,
        'response': response,
        'note': note
    })
    return jsonify({'message': 'Documents saved successfully', 'session_id': session_id}), 200


@app.route('/get-sessions', methods=['GET'])
def get_sessions():
    keys = redis_client.keys()
    sessions = []

    for key in keys:
        try:
            session_data = redis_client.hgetall(key)
            print(f"Session data for key {key}: {session_data}")
            query = session_data.get(b'question')
            note = session_data.get(b'note', b'').decode('utf-8')

            if query:
                query_decoded = query.decode('utf-8')
                if query_decoded.strip():
                    sessions.append({
                        'session_id': key.decode('utf-8'),
                        'question': query_decoded,
                        'note': note
                    })
        except Exception as e:
            print(f'Error processing key {key}: {e}')

    return jsonify({'sessions': sessions}), 200


@app.route('/get-session/<session_id>', methods=['GET'])
def get_session(session_id):
    session_data = redis_client.hgetall(session_id)
    if not session_data:
        return jsonify({'error': 'Session not found'}), 404
    documents = session_data.get(b'documents_list', b'').decode('utf-8')

    return jsonify({
        'session_id': session_id,
        'documents_list': json.loads(documents),
        'question': session_data.get(b'question', b'').decode('utf-8'),
        'response': session_data.get(b'response', b'').decode('utf-8'),
        'note': session_data.get(b'note', b'').decode('utf-8')
    }), 200


if __name__ == '__main__':
    app.run(debug=False, port=5055)
