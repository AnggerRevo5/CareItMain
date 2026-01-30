# Backend API Documentation

## Server Configuration

- **IP Address**: `10.10.11.34`
- **Port**: `8081`
- **Base URL**: `http://10.10.11.34:8081`

## Required Endpoints

### 1. Health Check

```
GET /tarifRS
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-29T10:30:00Z"
}
```

### 2. Get Tarif Rumah Sakit

```
GET /tarifRS
```

**Query Parameters:**

- `kategori` (optional): Filter by category
  - Values: `"Operatif"`, `"Non Operatif"`, `"Transplantasi Ginjal"`, `"Komplementer"`, `"Med Check Up"`
- `search` (optional): Search by kode or tindakan
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

**Example Request:**

```
GET /tarifRS?kategori=Operatif&search=ABDOMEN
```

**Response:**

```json
[
  {
    "id": 1,
    "kode": "R.TO.0001",
    "tindakan": "ABDOMEN, LAPAROTOMY, TRAUMA REOPERATION",
    "tarif": "17.958.000",
    "kategori": "Operatif",
    "created_at": "2025-11-29T10:00:00Z",
    "updated_at": "2025-11-29T10:00:00Z"
  }
]
```

### 3. Create Tarif Rumah Sakit

```
POST /tarifRS
```

**Request Body:**

```json
{
  "kode": "R.TO.0013",
  "tindakan": "NEW PROCEDURE NAME",
  "tarif": "5.000.000",
  "kategori": "Operatif"
}
```

**Response:**

```json
{
  "id": 13,
  "kode": "R.TO.0013",
  "tindakan": "NEW PROCEDURE NAME",
  "tarif": "5.000.000",
  "kategori": "Operatif",
  "created_at": "2025-11-29T10:30:00Z",
  "updated_at": "2025-11-29T10:30:00Z"
}
```

### 4. Update Tarif Rumah Sakit

```
PUT /tarifRS/{id}
```

**Request Body:** (partial update allowed)

```json
{
  "tarif": "6.000.000"
}
```

### 5. Delete Tarif Rumah Sakit

```
DELETE /tarifRS/{id}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Validation error details"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Error description"
}
```

## CORS Configuration

Please ensure your backend allows CORS for:

- **Origin**: `http://localhost:3000` (development)
- **Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Headers**: `Content-Type, Accept, Authorization`

## Database Schema (Suggested)

### Table: `tarif_rumah_sakit`

```sql
CREATE TABLE tarif_rumah_sakit (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(50) UNIQUE NOT NULL,
    tindakan TEXT NOT NULL,
    tarif VARCHAR(50) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sample Data

```sql
INSERT INTO tarif_rumah_sakit (kode, tindakan, tarif, kategori) VALUES
('R.TO.0001', 'ABDOMEN, LAPAROTOMY, TRAUMA REOPERATION', '17.958.000', 'Operatif'),
('R.TO.0002', 'APPENDECTOMY, LAPAROSCOPIC', '12.500.000', 'Operatif'),
('R.NO.0001', 'KONSULTASI SPESIALIS BEDAH', '350.000', 'Non Operatif'),
('R.TG.0001', 'TRANSPLANTASI GINJAL DONOR HIDUP', '125.000.000', 'Transplantasi Ginjal'),
('R.KM.0001', 'AKUPUNKTUR MEDIK', '200.000', 'Komplementer'),
('R.MC.0001', 'MEDICAL CHECK UP BASIC', '750.000', 'Med Check Up');
```

## Testing

You can test the API endpoints using:

- **Postman**: Import the endpoints above
- **curl**: `curl -X GET http://10.10.11.34:8081/tarifRS`
- **Browser**: Navigate to `http://10.10.11.34:8081/tarifRS`

## Notes

- All timestamps should be in ISO 8601 format
- Tarif values are stored as strings to preserve formatting
- Category values must match exactly (case-sensitive)
- Search should be case-insensitive for kode and tindakan fields
