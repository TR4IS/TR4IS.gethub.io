# functions/main.py

import os
import io # Required for in-memory file handling
from flask import Flask, request, render_template, send_file
from PIL import Image
from datetime import datetime
from firebase_functions import https_fn

# Initialize the Flask application
app = Flask(__name__, static_folder='../public/static', template_folder='../public')

# A4 paper size in pixels at 300 DPI
A4_WIDTH, A4_HEIGHT = 2480, 3508

# IMPORTANT: Cloud Functions will look for this 'app' object.
# We wrap our Flask app in a Cloud Function.
@https_fn.on_request()
def pdf_converter_app(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()

# NOTE: The routes are now part of the Flask app *inside* the function.

@app.route('/')
def index():
    """Renders the main page."""
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    """Handles file upload and PDF conversion."""
    uploaded_files = request.files.getlist('images')
    if not uploaded_files or uploaded_files[0].filename == '':
        return "No files were uploaded!", 400

    pages = []
    for file in uploaded_files:
        img = Image.open(file.stream).convert("RGB")
        page = _compose_on_a4(img)
        pages.append(page)

    custom_name = request.form.get('pdf_name', '').strip()
    filename = f"{custom_name}.pdf" if custom_name else f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    # --- Create PDF in memory ---
    pdf_buffer = io.BytesIO()
    pages[0].save(pdf_buffer, "PDF", resolution=100.0, save_all=True, append_images=pages[1:])
    pdf_buffer.seek(0) # Rewind buffer to the beginning

    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )

# --- Helper functions (no changes needed here) ---
def _compose_on_a4(img, bg="white"):
    fitted = _resize_fit(img, A4_WIDTH, A4_HEIGHT)
    page = Image.new("RGB", (A4_WIDTH, A4_HEIGHT), bg)
    x = (A4_WIDTH - fitted.width) // 2
    y = (A4_HEIGHT - fitted.height) // 2
    page.paste(fitted, (x, y))
    return page

def _resize_fit(image, max_width, max_height):
    img_ratio = image.width / image.height
    target_ratio = max_width / max_height
    if img_ratio > target_ratio:
        new_width = max_width
        new_height = int(max_width / img_ratio)
    else:
        new_height = max_height
        new_width = int(max_height * img_ratio)
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)