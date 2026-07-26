from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
import io
import os
import base64
from datetime import datetime
from fastapi.staticfiles import StaticFiles

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

app = FastAPI(title="AVIPOUL PDF Service")

# Servir les assets statiques (images du ticket)
if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html"]),
)


def format_number(value):
    return f"{value:,.0f}".replace(",", " ")


jinja_env.filters["format_number"] = format_number


@app.get("/health")
def health():
    return {"status": "ok"}


def render_cycle_html(data: dict) -> str:
    data["date_generation"] = datetime.now().strftime("%d/%m/%Y à %H:%M")

    # Pre-compute categories from depenses
    categories = {}
    for d in data.get("depenses", []):
        cat = d.get("categorie", "Autre")
        montant = d.get("montant", 0)
        categories[cat] = categories.get(cat, 0) + montant

    template = jinja_env.get_template("cycle-report.html")
    return template.render(
        cycle=data["cycle"],
        mortalites=data.get("mortalites", []),
        depenses=data.get("depenses", []),
        ventes=data.get("ventes", []),
        bilan=data.get("bilan", {}),
        categories=categories,
        date_generation=data["date_generation"],
        total_ventes_quantite=data.get("total_ventes_quantite", 0),
        total_ventes_montant=data.get("total_ventes_montant", 0),
    )


@app.post("/rapport-cycle")
async def rapport_cycle(data: dict):
    if "cycle" not in data:
        raise HTTPException(status_code=400, detail="Champ 'cycle' manquant dans les données")

    try:
        html_content = render_cycle_html(data)
        pdf_bytes = HTML(string=html_content).write_pdf()

        numero = data["cycle"].get("numero_cycle", "X")
        filename = f"rapport-cycle-{numero}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Template cycle-report.html introuvable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du PDF: {str(e)}")


@app.post("/rapport-cycle-html")
async def rapport_cycle_html(data: dict):
    if "cycle" not in data:
        raise HTTPException(status_code=400, detail="Champ 'cycle' manquant dans les données")

    try:
        html_content = render_cycle_html(data)
        return HTMLResponse(content=html_content)

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Template cycle-report.html introuvable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du rendu HTML: {str(e)}")


def _logo_data_uri() -> str:
    logo_path = os.path.join(STATIC_DIR, "monochrome-impur.png")
    if not os.path.isfile(logo_path):
        return ""
    with open(logo_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()
    return f"data:image/png;base64,{encoded}"


def render_facture_html(data: dict) -> str:
    template = jinja_env.get_template("invoice.html")
    return template.render(
        facture=data["facture"],
        client=data["client"],
        articles=data.get("articles", []),
        logo_url=_logo_data_uri(),
    )


@app.post("/facture")
async def facture(data: dict):
    if "facture" not in data:
        raise HTTPException(status_code=400, detail="Champ 'facture' manquant dans les données")
    if "client" not in data:
        raise HTTPException(status_code=400, detail="Champ 'client' manquant dans les données")

    try:
        html_content = render_facture_html(data)
        pdf_bytes = HTML(string=html_content).write_pdf()

        numero = data["facture"].get("numero", "FACTURE")
        filename = f"facture-{numero}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Template invoice.html introuvable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du PDF: {str(e)}")


@app.post("/facture-html")
async def facture_html(data: dict):
    if "facture" not in data:
        raise HTTPException(status_code=400, detail="Champ 'facture' manquant dans les données")
    if "client" not in data:
        raise HTTPException(status_code=400, detail="Champ 'client' manquant dans les données")

    try:
        html_content = render_facture_html(data)
        return HTMLResponse(content=html_content)

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Template invoice.html introuvable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du rendu HTML: {str(e)}")
