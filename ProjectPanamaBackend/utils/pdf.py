import pdfkit
import os
from io import BytesIO
import subprocess
import PyPDF2
import tempfile
import qrcode
from PIL import Image as PILImage
import requests
from io import BytesIO
from qrcode.image.styledpil import StyledPilImage
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from docxtpl import DocxTemplate, InlineImage
from docx.shared import Inches
import shutil

def html2pdf(titulo, html_path, pdf_path, header_path, footer_path, orientation='Portrait'):
    """
    Convertir HTML a PDF utilizando pdfkit, que es un envoltorio de wkhtmltopdf.
    """
    current_directory = os.path.dirname(os.path.abspath(__file__))
    templates_directory = os.path.abspath(os.path.join(current_directory, '..', 'templates'))

    header_p = os.path.join(templates_directory, 'renderheader.html')
    footer_p = os.path.join(templates_directory, 'renderfooter.html')

    options = {
        'page-size': 'Letter',
        'margin-top': '1.2in',
        'margin-right': '0.6in',
        'margin-bottom': '0.50in',
        'margin-left': '0.6in',
        'encoding': "UTF-8",
        'no-outline': None,
        'enable-local-file-access': None,  
        'header-spacing': '3',
        'header-html': header_path,
        'header-center': titulo,
        '--header-font-name': 'Times New Roman', 
        '--header-font-size': '12',
        'footer-center': 'Pág [page] de [topage]',  
        'footer-html': footer_path,
        'footer-font-size': '9',
        'orientation': orientation,        
    }

    if isinstance(pdf_path, BytesIO):
        with open(html_path) as f:
            pdf_bytes = pdfkit.from_file(f, False, options=options)
        pdf_path.write(pdf_bytes)
    elif isinstance(pdf_path, (str, os.PathLike)):
        with open(html_path) as f: 
            pdfkit.from_file(f, pdf_path, options=options)

def docx2pdf(docx_path):
    """
    Convertir un archivo DOCX a PDF utilizando libreoffice
    """
    subprocess.run([
        'C:\Program Files\LibreOffice\program\soffice.exe', '--headless', '--convert-to', 'pdf', '--outdir', os.path.dirname(docx_path), docx_path
      ], check=True)

def merge_pdfs(pdf_list):
    """
    Une una lista de archivos PDF en un solo PDF temporal y retorna su ruta.
    """
    pdf_merger = PyPDF2.PdfMerger()

    try:
        for pdf in pdf_list:
            pdf_merger.append(pdf)
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        pdf_merger.write(temp_file.name)
        pdf_merger.close()
        
        return temp_file.name # Ruta del archivo temporal generado

    except Exception as e:
        pdf_merger.close()
        raise RuntimeError(f"Error al unir los PDFs: {e}")
    
def qr_pdf(route_app, qr_path, data, pdf_path):

    styles = getSampleStyleSheet()

    full_url = f"{route_app}{qr_path}/{data['vehicle_number']}"

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_qr:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(full_url)
        qr.make(fit=True)

        img_qr = qr.make_image(image_factory=StyledPilImage).convert('RGB')

        qr_width, qr_height = img_qr.size

        response = requests.get(data['company_logo'])
        logo = PILImage.open(BytesIO(response.content)).convert("RGBA")
        white_bg = PILImage.new("RGB", logo.size, (255, 255, 255))
        white_bg.paste(logo, mask=logo.split()[3])
        logo = white_bg
        logo_size = qr_width // 3
        logo.thumbnail((logo_size, logo_size))

        pos = ((img_qr.size[0] - logo.size[0]) // 2, (img_qr.size[1] - logo.size[1]) // 2)
        img_qr.paste(logo, pos)

        img_qr.save(tmp_qr.name)
        qr_path_temp = tmp_qr.name

    story = []

    story.append(Paragraph("QR de ingreso a patio", styles['Title']))
    story.append(Spacer(1, 10))

    qr_img = Image(qr_path_temp, width=300, height=300)
    story.append(qr_img)

    story.append(Spacer(1, 10))

    info = f"""
    Unidad: {data['vehicle_number']}<br/>
    Placa: {data['plate']}<br/>
    Marca: {data['brand']} - {data['model']}<br/>
    Estado: {data['vehicle_state']}<br/>
    Cupo: {data['quota']}<br/>
    Propietario: {data['owner']}<br/>
    Conductor: {data['driver_name']}<br/>
    Código del conductor: {data['driver_code']}<br/>
    Teléfono del conductor: {data['driver_phone']}<br/>
    """
    story.append(Paragraph("Información del vehículo:", styles['Heading2']))
    
    custom_style = styles['Normal'].clone('CustomNormal')
    custom_style.leading = 18
    
    story.append(Paragraph(info, custom_style))

    story.append(Spacer(1, 10))

    repair_type = data.get('repair_type') or "Sin especificar"
    story.append(Paragraph("Tipo de reparación:", styles['Heading2']))
    story.append(Paragraph(repair_type, styles['Normal']))

    story.append(Spacer(1, 10))

    justificacion = data['justification'] or "Sin justificación"
    story.append(Paragraph("Justificación:", styles['Heading2']))
    story.append(Paragraph(justificacion, styles['Normal']))

    doc = SimpleDocTemplate(pdf_path)
    doc.build(story)

    os.remove(qr_path_temp)

def generate_contract_pdf(current_docx_path, temp_docx_path, data, final_signature_path, final_signature_path_representative, base_path, vehicle):
    doc = DocxTemplate(current_docx_path)

    data['Firma'] = InlineImage(doc, final_signature_path, width=Inches(2))
    data['FirmaRepresenta'] = InlineImage(doc, final_signature_path_representative, width=Inches(2))

    doc.render(data)
    doc.save(temp_docx_path)

    docx2pdf(temp_docx_path)

    temp_pdf_path = temp_docx_path.replace('.docx', '.pdf')

    if not os.path.exists(temp_pdf_path):
        raise FileNotFoundError(f"El archivo PDF no se generó correctamente: {temp_pdf_path}")

    final_pdf_path = os.path.join(base_path, "docu07.pdf").replace('\\', '/')
    shutil.copy(temp_pdf_path, final_pdf_path)

    os.remove(temp_docx_path)

    return temp_pdf_path