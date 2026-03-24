import pytesseract
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import io
import pypdfium2 as pdfium

class OCRService:

    def _load_as_image(self, file_bytes: bytes, content_type: str | None = None, filename: str | None = None) -> Image.Image:
        is_pdf = (
            (content_type == "application/pdf")
            or (filename or "").lower().endswith(".pdf")
            or file_bytes.startswith(b"%PDF")
        )

        if is_pdf:
            pdf = pdfium.PdfDocument(io.BytesIO(file_bytes))
            if len(pdf) == 0:
                raise ValueError("Uploaded PDF has no pages")
            page = pdf[0]
            bitmap = page.render(scale=2.0)
            return bitmap.to_pil().convert("RGB")

        return Image.open(io.BytesIO(file_bytes))

    def preprocess(self, img: Image.Image) -> Image.Image:

        # handles PNG with alpha channel
        img = img.convert("RGB")

        # upscale small images — tesseract works best at ~300 DPI equivalent
        w, h = img.size
        if w < 1000:
            scale = 1000 / w
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        # grayscale
        img = img.convert("L")

        # auto-fix brightness/contrast (handles dark or washed-out scans)
        img = ImageOps.autocontrast(img, cutoff=2)

        # double sharpen — helps with table borders and thin receipt characters
        img = img.filter(ImageFilter.SHARPEN)
        img = img.filter(ImageFilter.SHARPEN)

        # boost contrast
        img = ImageEnhance.Contrast(img).enhance(2.0)

        return img

    def extract_text(self, file_bytes: bytes, content_type: str | None = None, filename: str | None = None) -> str:
        image = self._load_as_image(file_bytes, content_type=content_type, filename=filename)
        img = self.preprocess(image)

        # PSM 4  = single column of variable-size text
        #          best for receipts — handles tables + headers + item rows
        # OEM 3  = LSTM neural net — best accuracy for printed text
        # preserve_interword_spaces = keeps table column spacing intact
        config = "--psm 4 --oem 3 -c preserve_interword_spaces=1"

        text = pytesseract.image_to_string(img, lang="eng", config=config)
        return text
