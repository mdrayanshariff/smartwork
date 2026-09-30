from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
import pdfplumber


def rgb_to_hex(rgb_tuple):
  """Converts PDF RGB float/int values to Hex color string for Excel."""
  if not rgb_tuple or not isinstance(rgb_tuple, (tuple, list)):
    return None
  try:
    if all(isinstance(c, float) and c <= 1.0 for c in rgb_tuple):
      rgb_tuple = [int(c * 255) for c in rgb_tuple]
    return f'{rgb_tuple[0]:02X}{rgb_tuple[1]:02X}{rgb_tuple[2]:02X}'
  except Exception:
    return None


def extract_formatted_tables(pdf_path, output_excel_path):
  import openpyxl

  wb = openpyxl.Workbook()
  # Remove default sheet
  wb.remove(wb.active)

  thin_border = Side(style='thin', color='CCCCCC')
  cell_border = Border(
      left=thin_border, right=thin_border, top=thin_border, bottom=thin_border
  )

  with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages, start=1):
      ws = wb.create_sheet(title=f'Page_{page_num}')

      # Extract visual table data
      tables = page.extract_tables()

      if not tables:
        # Fallback to general text lines if no formal tables are detected
        text = page.extract_text()
        if text:
          for row_idx, line in enumerate(text.split('\n'), start=1):
            ws.cell(row=row_idx, column=1, value=line.strip())
        continue

      current_excel_row = 1

      for table in tables:
        for row_data in table:
          for col_idx, cell_value in enumerate(row_data, start=1):
            cell = ws.cell(
                row=current_excel_row, column=col_idx, value=cell_value
            )

            # Enable auto-wrap and vertical alignment
            cell.alignment = Alignment(
                wrap_text=True, vertical='top', horizontal='left'
            )
            cell.border = cell_border

          current_excel_row += 1

        # Add a blank row space between multiple tables on the same page
        current_excel_row += 2

      # Auto-adjust column widths
      for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 50)

  wb.save(output_excel_path)
  print(
      f'Successfully extracted exact table data with formatting to'
      f' {output_excel_path}'
  )


# Execute with your PDF full path
parse_pdf_path = (
    r'C:\Users\mdray\Downloads\MJ-3943B-CHALASANIS RESIDENCE_2.pdf'
)
output_excel = 'Output_Exact_Formatted.xlsx'

extract_formatted_tables(parse_pdf_path, output_excel)