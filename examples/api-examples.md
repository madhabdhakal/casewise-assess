# Sample API Request/Response Examples

## POST /v1/assessments

### Request
```bash
curl -X POST http://localhost:3000/v1/assessments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "profile_data": {
      "person": {
        "date_of_birth": "1992-03-15",
        "nationality": "IND",
        "marital_status": "married"
      },
      "location": {
        "current_country": "AUS",
        "current_state": "NSW",
        "regional_postcode": "2000"
      },
      "visa_history": {
        "current_visa_subclass": "485",
        "visa_expiry_date": "2025-06-30",
        "previous_refusals": false,
        "previous_cancellations": false,
        "compliance_issues": false,
        "notes": "Currently on Temporary Graduate visa"
      },
      "occupation": {
        "anzsco_code": "261313",
        "occupation_title": "Software Engineer",
        "skills_assessment": {
          "status": "positive",
          "assessing_authority": "ACS",
          "issue_date": "2024-06-15",
          "expiry_date": "2026-06-15",
          "notes": "Positive assessment for Software Engineer"
        }
      },
      "english": {
        "test_type": "IELTS",
        "overall": 7.0,
        "listening": 7.5,
        "reading": 7.0,
        "writing": 6.5,
        "speaking": 7.0,
        "test_date": "2024-06-15"
      },
      "education": [
        {
          "level": "bachelor",
          "field": "Computer Science",
          "country": "IND",
          "completed_date": "2014-05-30"
        }
      ],
      "employment": [
        {
          "employer": "Tech Solutions Pty Ltd",
          "country": "AUS",
          "start_date": "2022-07-01",
          "end_date": null,
          "hours_per_week": 38,
          "employment_type": "full_time",
          "role_title": "Software Engineer",
          "duties_alignment": "high",
          "evidence_strength": "strong"
        }
      ],
      "points_claim": {
        "total_points_claimed": 70,
        "age_points": 25,
        "english_points": 10,
        "education_points": 15,
        "australian_experience_points": 5,
        "overseas_experience_points": 10,
        "partner_points": 5,
        "naati_points": 0,
        "professional_year_points": 0,
        "regional_study_points": 0,
        "state_nomination_points": 0
      },
      "state_nomination": {
        "seeking_nomination": false,
        "state": "",
        "occupation_list_status": "unknown",
        "notes": "Considering 189 pathway first"
      },
      "documents": {
        "passport": true,
        "skills_assessment": true,
        "english_test": true,
        "employment_reference_letters": true,
        "employment_contracts": true,
        "payslips": true,
        "bank_statements": false,
        "cv": true
      }
    },
    "policy_snapshot_id": "au-2026-01-01"
  }'
```

### Response (201 Created)
```json
{
  "assessment_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

## GET /v1/assessments/{id}

### Request
```bash
curl -H "X-API-Key: test-api-key-12345" \
  http://localhost:3000/v1/assessments/550e8400-e29b-41d4-a716-446655440000
```

### Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-uuid",
  "profile_id": "profile-uuid",
  "policy_snapshot_id": "au-2026-01-01",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00.000Z",
  "completed_at": "2024-01-15T10:31:00.000Z"
}
```

## POST /v1/assessments/{id}/signoff

### Request
```bash
curl -X POST http://localhost:3000/v1/assessments/550e8400-e29b-41d4-a716-446655440000/signoff \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "reviewer_name": "John Smith",
    "mara_number": "1234567",
    "comments": "Assessment reviewed and approved for client presentation."
  }'
```

### Response (201 Created)
```json
{
  "success": true
}
```