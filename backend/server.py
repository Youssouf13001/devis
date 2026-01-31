from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'devispro-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# SendGrid Config
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')

# Create the main app
app = FastAPI(title="DevisPro API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CompanySettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str = "CREATIVINDUSTRY"
    address: str = "15 RUE AUGER, 13004 MARSEILLE 4 - France"
    email: str = "CONTACT@CREATIVINDUSTRY.COM"
    phone: str = "06 68 89 69 96"
    status: str = "Entrepreneur individuel"
    siren: str = "951.984.111"
    tva_number: str = "FR66951984111"
    bank_name: str = "QONTO"
    iban: str = "FR7616958000010827407974101"
    bic: str = "QNTOFRP1XXX"
    logo_url: Optional[str] = None

class CompanySettingsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    siren: Optional[str] = None
    tva_number: Optional[str] = None
    bank_name: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    logo_url: Optional[str] = None

class ClientCreate(BaseModel):
    name: str
    address: str
    email: EmailStr
    phone: str

class ClientResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    address: str
    email: str
    phone: str
    created_at: str

class ServiceCreate(BaseModel):
    name: str
    unit: str = "heure"
    price_ht: float
    tva_rate: float = 0.0
    description: Optional[str] = None

class ServiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    unit: str
    price_ht: float
    tva_rate: float
    description: Optional[str] = None
    created_at: str

class QuoteLineItem(BaseModel):
    service_name: str
    quantity: float
    unit: str
    price_ht: float
    tva_rate: float = 0.0

class QuoteCreate(BaseModel):
    client_id: str
    expiration_date: str
    event_date: Optional[str] = None
    items: List[QuoteLineItem]
    discount: float = 0.0
    notes: Optional[str] = None

class QuoteUpdate(BaseModel):
    client_id: Optional[str] = None
    expiration_date: Optional[str] = None
    event_date: Optional[str] = None
    items: Optional[List[QuoteLineItem]] = None
    discount: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class QuoteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    quote_number: str
    client_id: str
    client_name: str
    client_email: str
    client_address: str
    client_phone: str
    emission_date: str
    expiration_date: str
    items: List[QuoteLineItem]
    total_ht_before_discount: float
    discount: float
    total_ht: float
    total_tva: float
    total_ttc: float
    status: str
    created_at: str
    sent_at: Optional[str] = None

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    invoice_number: str
    quote_id: str
    client_id: str
    client_name: str
    client_email: str
    client_address: str
    client_phone: str
    emission_date: str
    due_date: str
    items: List[QuoteLineItem]
    total_ht_before_discount: float
    discount: float
    total_ht: float
    total_tva: float
    total_ttc: float
    status: str
    created_at: str

class DashboardStats(BaseModel):
    total_quotes: int
    quotes_sent: int
    quotes_accepted: int
    quotes_refused: int
    quotes_draft: int
    total_invoices: int
    total_revenue: float
    conversion_rate: float
    total_clients: int
    total_services: int

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hash_password(user.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create default company settings
    company_doc = CompanySettings(user_id=user_id).model_dump()
    company_doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.company_settings.insert_one(company_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user.email,
            name=user.name,
            created_at=user_doc['created_at']
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if not db_user or not verify_password(user.password, db_user['password']):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(db_user['id'])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=db_user['id'],
            email=db_user['email'],
            name=db_user['name'],
            created_at=db_user['created_at']
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ============ COMPANY SETTINGS ROUTES ============

@api_router.get("/company", response_model=CompanySettings)
async def get_company_settings(user: dict = Depends(get_current_user)):
    settings = await db.company_settings.find_one({"user_id": user['id']}, {"_id": 0})
    if not settings:
        # Create default settings
        settings = CompanySettings(user_id=user['id']).model_dump()
        settings['created_at'] = datetime.now(timezone.utc).isoformat()
        await db.company_settings.insert_one(settings)
    return CompanySettings(**settings)

@api_router.put("/company", response_model=CompanySettings)
async def update_company_settings(update: CompanySettingsUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.company_settings.update_one(
            {"user_id": user['id']},
            {"$set": update_data}
        )
    settings = await db.company_settings.find_one({"user_id": user['id']}, {"_id": 0})
    return CompanySettings(**settings)

# ============ CLIENTS ROUTES ============

@api_router.post("/clients", response_model=ClientResponse)
async def create_client(client: ClientCreate, user: dict = Depends(get_current_user)):
    client_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "name": client.name,
        "address": client.address,
        "email": client.email,
        "phone": client.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clients.insert_one(client_doc)
    return ClientResponse(**{k: v for k, v in client_doc.items() if k != '_id'})

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(user: dict = Depends(get_current_user)):
    clients = await db.clients.find({"user_id": user['id']}, {"_id": 0}).to_list(1000)
    return [ClientResponse(**c) for c in clients]

@api_router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "user_id": user['id']}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return ClientResponse(**client)

@api_router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(client_id: str, client: ClientCreate, user: dict = Depends(get_current_user)):
    result = await db.clients.update_one(
        {"id": client_id, "user_id": user['id']},
        {"$set": client.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return ClientResponse(**updated)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "user_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return {"message": "Client supprimé"}

# ============ SERVICES ROUTES ============

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, user: dict = Depends(get_current_user)):
    service_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        **service.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.services.insert_one(service_doc)
    return ServiceResponse(**{k: v for k, v in service_doc.items() if k != '_id'})

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(user: dict = Depends(get_current_user)):
    services = await db.services.find({"user_id": user['id']}, {"_id": 0}).to_list(1000)
    return [ServiceResponse(**s) for s in services]

@api_router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: str, user: dict = Depends(get_current_user)):
    service = await db.services.find_one({"id": service_id, "user_id": user['id']}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Prestation non trouvée")
    return ServiceResponse(**service)

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service: ServiceCreate, user: dict = Depends(get_current_user)):
    result = await db.services.update_one(
        {"id": service_id, "user_id": user['id']},
        {"$set": service.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prestation non trouvée")
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    return ServiceResponse(**updated)

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"id": service_id, "user_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prestation non trouvée")
    return {"message": "Prestation supprimée"}

# ============ QUOTES ROUTES ============

async def get_next_quote_number(user_id: str) -> str:
    year = datetime.now().year
    count = await db.quotes.count_documents({"user_id": user_id})
    return f"D-{year}-{count + 1:03d}"

@api_router.post("/quotes", response_model=QuoteResponse)
async def create_quote(quote: QuoteCreate, user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": quote.client_id, "user_id": user['id']}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    # Calculate totals
    total_ht_before_discount = sum(item.quantity * item.price_ht for item in quote.items)
    total_ht = total_ht_before_discount - quote.discount
    total_tva = sum(item.quantity * item.price_ht * (item.tva_rate / 100) for item in quote.items)
    total_ttc = total_ht + total_tva
    
    quote_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "quote_number": await get_next_quote_number(user['id']),
        "client_id": client['id'],
        "client_name": client['name'],
        "client_email": client['email'],
        "client_address": client['address'],
        "client_phone": client['phone'],
        "emission_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "expiration_date": quote.expiration_date,
        "items": [item.model_dump() for item in quote.items],
        "total_ht_before_discount": total_ht_before_discount,
        "discount": quote.discount,
        "total_ht": total_ht,
        "total_tva": total_tva,
        "total_ttc": total_ttc,
        "status": "brouillon",
        "notes": quote.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sent_at": None
    }
    await db.quotes.insert_one(quote_doc)
    return QuoteResponse(**{k: v for k, v in quote_doc.items() if k != '_id'})

@api_router.get("/quotes", response_model=List[QuoteResponse])
async def get_quotes(user: dict = Depends(get_current_user)):
    quotes = await db.quotes.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [QuoteResponse(**q) for q in quotes]

@api_router.get("/quotes/{quote_id}", response_model=QuoteResponse)
async def get_quote(quote_id: str, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": user['id']}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return QuoteResponse(**quote)

@api_router.put("/quotes/{quote_id}", response_model=QuoteResponse)
async def update_quote(quote_id: str, update: QuoteUpdate, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": user['id']}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if 'client_id' in update_data:
        client = await db.clients.find_one({"id": update_data['client_id'], "user_id": user['id']}, {"_id": 0})
        if client:
            update_data['client_name'] = client['name']
            update_data['client_email'] = client['email']
            update_data['client_address'] = client['address']
            update_data['client_phone'] = client['phone']
    
    if 'items' in update_data:
        items = [QuoteLineItem(**i) if isinstance(i, dict) else i for i in update_data['items']]
        update_data['items'] = [i.model_dump() if hasattr(i, 'model_dump') else i for i in items]
        total_ht_before_discount = sum(i['quantity'] * i['price_ht'] for i in update_data['items'])
        discount = update_data.get('discount', quote.get('discount', 0))
        total_ht = total_ht_before_discount - discount
        total_tva = sum(i['quantity'] * i['price_ht'] * (i['tva_rate'] / 100) for i in update_data['items'])
        update_data['total_ht_before_discount'] = total_ht_before_discount
        update_data['total_ht'] = total_ht
        update_data['total_tva'] = total_tva
        update_data['total_ttc'] = total_ht + total_tva
    
    if update_data:
        await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    
    updated = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    return QuoteResponse(**updated)

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, user: dict = Depends(get_current_user)):
    result = await db.quotes.delete_one({"id": quote_id, "user_id": user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return {"message": "Devis supprimé"}

# ============ PDF GENERATION ============

def generate_quote_pdf(quote: dict, company: dict) -> bytes:
    """Generate PDF from quote data using reportlab"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=15*mm, bottomMargin=15*mm)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#0066cc'), spaceAfter=10)
    header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#333333'))
    section_title = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=11, textColor=colors.HexColor('#0066cc'), spaceBefore=15, spaceAfter=5)
    normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=9)
    small_style = ParagraphStyle('Small', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#666666'))
    
    elements = []
    
    # Format numbers
    def fmt_price(val):
        return f"{val:,.2f} €".replace(",", " ").replace(".", ",").replace(" ", " ")
    
    def fmt_date(date_str):
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d")
            months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
            return f"{d.day} {months[d.month-1]} {d.year}"
        except:
            return date_str
    
    # Header with company info
    company_name = company.get('name', 'CREATIVINDUSTRY')
    company_info = f"""{company.get('address', '')}<br/>
Email: {company.get('email', '')}<br/>
Tél: {company.get('phone', '')}<br/>
{company.get('status', '')} - SIREN: {company.get('siren', '')}<br/>
N° TVA: {company.get('tva_number', '')}"""
    
    quote_info = f"""<b>DEVIS</b><br/>
N°: {quote['quote_number']}<br/>
Date: {fmt_date(quote['emission_date'])}<br/>
Validité: {fmt_date(quote['expiration_date'])}<br/>
Type: Prestations de services"""
    
    header_data = [
        [Paragraph(f"<b>{company_name}</b>", title_style), Paragraph(quote_info, header_style)],
        [Paragraph(company_info, small_style), '']
    ]
    header_table = Table(header_data, colWidths=[120*mm, 50*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 1), (-1, 1), 2, colors.HexColor('#0066cc')),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 10),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10*mm))
    
    # Client section
    elements.append(Paragraph("Client ou Cliente", section_title))
    client_info = f"""<b>{quote['client_name']}</b><br/>
{quote['client_address']}<br/>
Email: {quote['client_email']}<br/>
Tél: {quote['client_phone']}"""
    elements.append(Paragraph(client_info, normal_style))
    elements.append(Spacer(1, 8*mm))
    
    # Items table
    elements.append(Paragraph("Détail des prestations", section_title))
    
    items_data = [['Produits', 'Qté', 'Prix unitaire HT', 'TVA (%)', 'Total HT']]
    for item in quote['items']:
        total_ht = item['quantity'] * item['price_ht']
        tva_text = f"{item['tva_rate']}%" if item['tva_rate'] > 0 else "Aucune"
        items_data.append([
            item['service_name'],
            f"{item['quantity']} {item['unit']}",
            fmt_price(item['price_ht']),
            tva_text,
            fmt_price(total_ht)
        ])
    
    items_table = Table(items_data, colWidths=[60*mm, 25*mm, 35*mm, 20*mm, 30*mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066cc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8*mm))
    
    # TVA details
    elements.append(Paragraph("Détails TVA", section_title))
    tva_details = {}
    for item in quote['items']:
        rate = item['tva_rate']
        base = item['quantity'] * item['price_ht']
        tva_amount = base * (rate / 100)
        if rate not in tva_details:
            tva_details[rate] = {"base": 0, "amount": 0}
        tva_details[rate]["base"] += base
        tva_details[rate]["amount"] += tva_amount
    
    tva_data = [['Taux', 'Montant TVA', 'Base HT']]
    for rate, vals in tva_details.items():
        tva_text = f"{rate}%" if rate > 0 else "Aucune"
        tva_data.append([tva_text, fmt_price(vals['amount']), fmt_price(vals['base'])])
    
    tva_table = Table(tva_data, colWidths=[40*mm, 40*mm, 40*mm])
    tva_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066cc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(tva_table)
    elements.append(Spacer(1, 8*mm))
    
    # Totals
    totals_data = [
        ['Total HT avant remise', fmt_price(quote['total_ht_before_discount'])],
        ['Remise', fmt_price(quote['discount'])],
        ['Total HT', fmt_price(quote['total_ht'])],
        ['Total TVA', fmt_price(quote['total_tva'])],
        ['Total TTC', fmt_price(quote['total_ttc'])],
    ]
    
    totals_table = Table(totals_data, colWidths=[120*mm, 50*mm])
    totals_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEBELOW', (0, 0), (-1, 3), 0.5, colors.HexColor('#eeeeee')),
        ('LINEABOVE', (0, 4), (-1, 4), 2, colors.HexColor('#0066cc')),
        ('FONTSIZE', (0, 4), (-1, 4), 11),
        ('TEXTCOLOR', (0, 4), (-1, 4), colors.HexColor('#0066cc')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 10*mm))
    
    # Payment info
    elements.append(Paragraph("Informations de paiement", section_title))
    payment_info = f"""Établissement: {company.get('bank_name', 'QONTO')}<br/>
IBAN: {company.get('iban', '')}<br/>
BIC: {company.get('bic', '')}"""
    elements.append(Paragraph(payment_info, normal_style))
    elements.append(Spacer(1, 8*mm))
    
    # Conditions
    elements.append(Paragraph("Conditions", section_title))
    conditions = """Pénalités de retard: trois fois le taux annuel d'intérêt légal en vigueur calculé depuis la date d'échéance jusqu'à complet paiement du prix.<br/>
Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement: 40 €"""
    elements.append(Paragraph(conditions, small_style))
    elements.append(Spacer(1, 10*mm))
    
    # Signature
    elements.append(Paragraph('Date et signature précédées de la mention "Bon pour accord"', small_style))
    elements.append(Spacer(1, 20*mm))
    
    doc.build(elements)
    return buffer.getvalue()

@api_router.get("/quotes/{quote_id}/pdf")
async def get_quote_pdf(quote_id: str, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": user['id']}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    company = await db.company_settings.find_one({"user_id": user['id']}, {"_id": 0})
    if not company:
        company = CompanySettings(user_id=user['id']).model_dump()
    
    pdf_bytes = generate_quote_pdf(quote, company)
    
    filename = f"Devis-{quote['client_name']}-{quote['quote_number']}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# ============ EMAIL SENDING ============

async def send_quote_email(quote: dict, company: dict, pdf_bytes: bytes):
    """Send quote via email with PDF attachment"""
    if not SENDGRID_API_KEY or not SENDER_EMAIL:
        logger.error("SendGrid not configured")
        return False
    
    try:
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=quote['client_email'],
            subject=f"Devis {quote['quote_number']} - {company.get('name', 'CREATIVINDUSTRY')}",
            html_content=f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0066cc;">Bonjour {quote['client_name']},</h2>
                <p>Veuillez trouver ci-joint notre devis <strong>{quote['quote_number']}</strong> d'un montant de <strong>{quote['total_ttc']:,.2f} € TTC</strong>.</p>
                <p>Ce devis est valable jusqu'au <strong>{quote['expiration_date']}</strong>.</p>
                <p>N'hésitez pas à nous contacter pour toute question.</p>
                <br>
                <p>Cordialement,</p>
                <p><strong>{company.get('name', 'CREATIVINDUSTRY')}</strong><br>
                {company.get('phone', '')}<br>
                {company.get('email', '')}</p>
            </body>
            </html>
            """
        )
        
        # Attach PDF
        encoded_pdf = base64.b64encode(pdf_bytes).decode()
        attachment = Attachment(
            FileContent(encoded_pdf),
            FileName(f"Devis-{quote['quote_number']}.pdf"),
            FileType("application/pdf"),
            Disposition("attachment")
        )
        message.attachment = attachment
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        return response.status_code == 202
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

@api_router.post("/quotes/{quote_id}/send")
async def send_quote(quote_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": user['id']}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    company = await db.company_settings.find_one({"user_id": user['id']}, {"_id": 0})
    if not company:
        company = CompanySettings(user_id=user['id']).model_dump()
    
    # Generate PDF
    pdf_bytes = generate_quote_pdf(quote, company)
    
    # Send email
    success = await send_quote_email(quote, company, pdf_bytes)
    
    if success:
        await db.quotes.update_one(
            {"id": quote_id},
            {"$set": {"status": "envoyé", "sent_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Devis envoyé avec succès", "status": "success"}
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email")

# ============ INVOICES ROUTES ============

async def get_next_invoice_number(user_id: str) -> str:
    year = datetime.now().year
    count = await db.invoices.count_documents({"user_id": user_id})
    return f"F-{year}-{count + 1:03d}"

@api_router.post("/quotes/{quote_id}/convert-to-invoice", response_model=InvoiceResponse)
async def convert_quote_to_invoice(quote_id: str, user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id, "user_id": user['id']}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    
    # Check if already converted
    existing = await db.invoices.find_one({"quote_id": quote_id})
    if existing:
        raise HTTPException(status_code=400, detail="Ce devis a déjà été converti en facture")
    
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user['id'],
        "invoice_number": await get_next_invoice_number(user['id']),
        "quote_id": quote_id,
        "client_id": quote['client_id'],
        "client_name": quote['client_name'],
        "client_email": quote['client_email'],
        "client_address": quote['client_address'],
        "client_phone": quote['client_phone'],
        "emission_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"),
        "items": quote['items'],
        "total_ht_before_discount": quote['total_ht_before_discount'],
        "discount": quote['discount'],
        "total_ht": quote['total_ht'],
        "total_tva": quote['total_tva'],
        "total_ttc": quote['total_ttc'],
        "status": "en attente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invoices.insert_one(invoice_doc)
    await db.quotes.update_one({"id": quote_id}, {"$set": {"status": "accepté"}})
    
    return InvoiceResponse(**{k: v for k, v in invoice_doc.items() if k != '_id'})

@api_router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({"user_id": user['id']}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [InvoiceResponse(**i) for i in invoices]

@api_router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id, "user_id": user['id']}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return InvoiceResponse(**invoice)

@api_router.put("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str, user: dict = Depends(get_current_user)):
    valid_statuses = ["en attente", "payée", "annulée"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs acceptées: {valid_statuses}")
    
    result = await db.invoices.update_one(
        {"id": invoice_id, "user_id": user['id']},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return {"message": "Statut mis à jour"}

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    total_quotes = await db.quotes.count_documents({"user_id": user['id']})
    quotes_sent = await db.quotes.count_documents({"user_id": user['id'], "status": "envoyé"})
    quotes_accepted = await db.quotes.count_documents({"user_id": user['id'], "status": "accepté"})
    quotes_refused = await db.quotes.count_documents({"user_id": user['id'], "status": "refusé"})
    quotes_draft = await db.quotes.count_documents({"user_id": user['id'], "status": "brouillon"})
    
    total_invoices = await db.invoices.count_documents({"user_id": user['id']})
    
    # Calculate total revenue from paid invoices
    paid_invoices = await db.invoices.find(
        {"user_id": user['id'], "status": "payée"},
        {"_id": 0, "total_ttc": 1}
    ).to_list(1000)
    total_revenue = sum(inv.get('total_ttc', 0) for inv in paid_invoices)
    
    # Conversion rate
    conversion_rate = (quotes_accepted / total_quotes * 100) if total_quotes > 0 else 0
    
    total_clients = await db.clients.count_documents({"user_id": user['id']})
    total_services = await db.services.count_documents({"user_id": user['id']})
    
    return DashboardStats(
        total_quotes=total_quotes,
        quotes_sent=quotes_sent,
        quotes_accepted=quotes_accepted,
        quotes_refused=quotes_refused,
        quotes_draft=quotes_draft,
        total_invoices=total_invoices,
        total_revenue=total_revenue,
        conversion_rate=round(conversion_rate, 1),
        total_clients=total_clients,
        total_services=total_services
    )

# ============ HEALTH CHECK ============

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "devispro-api"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
