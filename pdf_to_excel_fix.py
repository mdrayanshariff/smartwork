import pandas as pd
import openpyxl
from openpyxl.styles import Alignment
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer, LTChar, LTAnno
import re

def extract_pdf_words(pdf_path):
    words = []
    for page_layout in extract_pages(pdf_path):
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                for text_line in element:
                    line_text = ""
                    x0, y0, x1, y1 = None, None, None, None
                    for character in text_line:
                        if isinstance(character, LTChar):
                            line_text += character.get_text()
                            if x0 is None:
                                x0, y0, x1, y1 = character.bbox
                            else:
                                x0 = min(x0, character.bbox[0])
                                y0 = min(y0, character.bbox[1])
                                x1 = max(x1, character.bbox[2])
                                y1 = max(y1, character.bbox[3])
                        elif isinstance(character, LTAnno):
                            line_text += character.get_text()
                    if line_text.strip():
                        words.append({
                            'text': line_text.strip(),
                            'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1,
                            'top': 842 - y1
                        })
    return words

def group_words_into_rows(words, y_threshold=5):
    sorted_words = sorted(words, key=lambda w: (w['top'], w['x0']))
    rows, current_row, last_top = [], [], None
    for word in sorted_words:
        if last_top is None or abs(word['top'] - last_top) <= y_threshold:
            current_row.append(word)
        else:
            rows.append(current_row)
            current_row = [word]
            last_top = word['top']
    if current_row:
        rows.append(current_row)
    return rows

def parse_pdf_to_excel(pdf_path, output_excel_path):
    words = extract_pdf_words(pdf_path)
    grouped_rows = group_words_into_rows(words)
    parsed_data = []
    for row in grouped_rows:
        row_text = " ".join([w['text'] for w in row])
        cleaned_text = re.sub(r'[₹|₹\s]', '', row_text).strip()
        parsed_data.append({"Extracted Row Text": cleaned_text})

    df = pd.DataFrame(parsed_data)
    with pd.ExcelWriter(output_excel_path, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Clean Extracted Data')
        worksheet = writer.sheets['Clean Extracted Data']
        worksheet.column_dimensions['A'].width = 80
        for cell in worksheet['A']:
            cell.alignment = Alignment(wrap_text=True, vertical='top')

    print(f"Successfully converted and saved to {output_excel_path}")

parse_pdf_to_excel("MJ-3943B-CHALASANIS RESIDENCE_2.pdf", "Output_Cleaned.xlsx")
