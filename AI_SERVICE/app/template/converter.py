import io
from typing import Dict, List
import pdfplumber
from docx import Document
import pandas as pd


def extract_tables_from_pdf(file_path: str) -> List[List[List[str]]]:
    """
    Extract data from PDF file using text extraction
    
    Returns:
        List of tables, where each table is a list of rows
    """
    all_rows = []
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            # Extract text directly - works better for most invoice PDFs
            text = page.extract_text()
            if text:
                print(f"\n📝 RAW TEXT FROM PDF:\n{'='*40}")
                print(text)
                print('='*40 + "\n")
                
                lines = text.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line:
                        # Keep each line as a single-cell row for now
                        # This preserves the original formatting
                        all_rows.append([line])
    
    if all_rows:
        return [all_rows]
    return []


def extract_tables_from_docx(file_path: str) -> List[List[List[str]]]:
    """
    Extract tables from DOCX file
    
    Returns:
        List of tables, where each table is a list of rows
    """
    doc = Document(file_path)
    tables = []
    
    for table in doc.tables:
        table_data = []
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells]
            table_data.append(row_data)
        if table_data:
            tables.append(table_data)
    
    return tables


def tables_to_csv(tables: List[List[List[str]]]) -> str:
    """
    Convert extracted tables to CSV format
    
    Args:
        tables: List of tables (each table is list of rows)
    
    Returns:
        CSV string
    """
    if not tables:
        raise ValueError("No tables found in document")
    
    # Combine all tables/rows
    main_table = tables[0]
    
    if not main_table:
        raise ValueError("No content found in document")
    
    # For line-based extraction, create a simple CSV with a "line" column
    csv_buffer = io.StringIO()
    csv_buffer.write("line_number,content\n")
    
    for idx, row in enumerate(main_table, 1):
        # Join cells in case there are multiple
        content = " ".join([str(cell) for cell in row if cell]).strip()
        if content:
            # Escape quotes and wrap in quotes for CSV safety
            content = content.replace('"', '""')
            csv_buffer.write(f'{idx},"{content}"\n')
    
    csv_string = csv_buffer.getvalue()
    return csv_string


def convert_file_to_csv(file_path: str, filename: str) -> Dict[str, any]:
    """
    Main conversion function
    
    Args:
        file_path: Path to the file
        filename: Original filename (to determine type)
    
    Returns:
        Dict with csv data and metadata
    """
    filename_lower = filename.lower()
    
    # Extract tables based on file type
    if filename_lower.endswith('.pdf'):
        tables = extract_tables_from_pdf(file_path)
    elif filename_lower.endswith('.docx'):
        tables = extract_tables_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {filename}")
    
    if not tables:
        raise ValueError("No tables found in the document")
    
    # Convert to CSV
    csv_data = tables_to_csv(tables)
    
    # Calculate metadata
    lines = csv_data.strip().split('\n')
    row_count = len(lines) - 1  # Exclude header
    column_count = len(lines[0].split(',')) if lines else 0
    
    warnings = []
    if len(tables) > 1:
        warnings.append(f"Multiple tables found ({len(tables)}). Using only the first table.")
    
    return {
        "csv": csv_data,
        "rowCount": row_count,
        "columnCount": column_count,
        "warnings": warnings
    }
