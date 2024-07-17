import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import cv2
import numpy as np
import io
import time


# Path to the Tesseract executable (if not in PATH environment variable)
# pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'  # Linux
# pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Windows

# Ensure the TESSDATA_PREFIX environment variable is set correctly
# on a Mac
os.environ['TESSDATA_PREFIX'] = '/opt/homebrew/share/tessdata/'
# on server
# os.environ['TESSDATA_PREFIX'] = '/usr/share/tesseract-ocr/4.00/tessdata'

# Path to the Tesseract executable
# on a Mac
pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'
# on server
# pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'

def preprocess_image(image):
    img_array = np.array(image)
    gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    return thresh


def detect_text_regions(thresh):
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    regions = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w > 50 and h > 50:  # Filter out small boxes
            regions.append((x, y, w, h))
    return regions


def extract_text_from_regions(img, regions):
    extracted_text = ""
    for region in regions:
        x, y, w, h = region
        roi = img.crop((x, y, x + w, y + h))
        text = pytesseract.image_to_string(roi, lang='ita')
        extracted_text += text + "\n\n"
    return extracted_text


def pdf_image_to_text(pdf_path):
    document = fitz.open(pdf_path)
    text = ""

    for page_num in range(len(document)):
        page = document.load_page(page_num)
        pix = page.get_pixmap()
        img = Image.open(io.BytesIO(pix.tobytes()))
        thresh = preprocess_image(img)

        regions = detect_text_regions(thresh)
        page_text = extract_text_from_regions(img, regions)

        text += page_text + "\n\n"

    return text


def create_output_dir(parent_dir):
    """
    it creates a folder where to store the text files and returns the path
    :return: teh path of the new directory
    """
    # Get the current epoch time
    current_time = int(time.time())

    # Define the directory name using the current epoch time
    dir_name = f"temp_dir_{current_time}"

    # Get the absolute path of the directory
    dir_path = os.path.join(parent_dir, dir_name)

    # Create the directory
    os.makedirs(dir_path)
    return dir_path


def process_pdfs_in_folder(input_folder, parent_output_folder):
    """
    it receives the folder where the pdf files are in image format and generates the text files and returns the new temp folder
    to do so it generates a temporary folder to store the pdf that is then removed and a temporary permanent folder that is kept with the text
    :param parent_output_folder: teh folder where the new directory will be stored
    :param input_folder: the folder with the original pdf file to extract the pages from
    :return: the name of the folder with the text files
    """
    output_folder = create_output_dir(parent_output_folder)
    extracted_text = ""
    for filename in os.listdir(input_folder):
        if filename.lower().endswith('.pdf'):
            pdf_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, f"{os.path.splitext(filename)[0]}.txt")

            print(f"Processing {pdf_path}...")

            extracted_text = pdf_image_to_text(pdf_path)

    return extracted_text

# Process all PDFs in the input folder and save text files to the output folder
# process_pdfs_in_folder(input_folder, output_folder)

# print("All files processed.")
