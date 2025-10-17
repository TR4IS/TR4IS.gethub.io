# app.py

import os
from flask import Flask, request, render_template, send_file, url_for
from PIL import Image
from datetime import datetime

# Initialize the Flask application
app = Flask(__name__)

# A4 paper size in pixels at 300 DPI
A4_WIDTH, A4_HEIGHT = 2480, 3508

@app.route('/')
def index():
    """Renders the main page."""
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    """Handles file upload and PDF conversion."""
    uploaded_files = request.files.getlist('images')
    
    if not uploaded_files:
        return "No files were uploaded!", 400

    # This list will hold the final, page-sized images
    pages = []
    
    # Process each uploaded image
    for file in uploaded_files:
        if file and file.filename != '':
            img = Image.open(file.stream).convert("RGB")
            page = _compose_on_a4(img)
            pages.append(page)
    
    if not pages:
        return "No valid image files to convert.", 400
        
    # --- Filename Logic ---
    # Get the optional filename from the form
    custom_name = request.form.get('pdf_name', '').strip()
    
    # If the user provided a name, use it. Otherwise, create a timestamp.
    if custom_name:
        filename = f"{custom_name}.pdf"
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"converted_{timestamp}.pdf"

    # Define a temporary path to save the PDF
    # In a real app, you might use a temporary directory
    pdf_path = os.path.join("temp_output.pdf")
    
    # Save the PDF
    pages[0].save(
        pdf_path,
        save_all=True,
        append_images=pages[1:]
    )
    
    # Send the PDF to the user for download
    return send_file(
        pdf_path,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )

# --- Helper functions from your original script ---

def _compose_on_a4(img, bg="white"):
    """Returns a new A4-sized RGB page with the image centered and fitted."""
    fitted = _resize_fit(img, A4_WIDTH, A4_HEIGHT)
    page = Image.new("RGB", (A4_WIDTH, A4_HEIGHT), bg)
    x = (A4_WIDTH - fitted.width) // 2
    y = (A4_HEIGHT - fitted.height) // 2
    page.paste(fitted, (x, y))
    return page

def _resize_fit(image, max_width, max_height):
    """Resize image to fit within max dimensions while preserving aspect ratio."""
    img_ratio = image.width / image.height
    target_ratio = max_width / max_height
    if img_ratio > target_ratio:
        new_width = max_width
        new_height = int(max_width / img_ratio)
    else:
        new_height = max_height
        new_width = int(max_height * img_ratio)
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

if __name__ == '__main__':
    app.run(debug=True)