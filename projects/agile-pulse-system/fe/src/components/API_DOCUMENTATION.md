# Project Members API Documentation

This document describes the API endpoints expected by the ProjectMembers component.

## Base URL
```
http://localhost:3001/api/projects
```

## Endpoints

### GET /api/projects/members
Retrieves a list of all project members.

**Request:**
```
GET http://localhost:3001/api/projects/members
Headers:
  Content-Type: application/json
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Developer"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "Product Owner"
  }
]
```

**Status Codes:**
- `200 OK`: Success
- `500 Internal Server Error`: Server error

---

### POST /api/projects/members
Adds a new member to the project.

**Request:**
```
POST http://localhost:3001/api/projects/members
Headers:
  Content-Type: application/json
Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Developer"
}
```

**Request Body Fields:**
- `name` (string, required): Full name of the member
- `email` (string, required): Email address (must be valid email format)
- `role` (string, required): Role of the member. Valid values:
  - "Product Owner"
  - "Scrum Master"
  - "Developer"
  - "Stakeholder"

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "Developer"
}
```

**Status Codes:**
- `201 Created`: Member created successfully
- `400 Bad Request`: Validation error (missing fields, invalid email, etc.)
- `500 Internal Server Error`: Server error

---

### DELETE /api/projects/members/:id
Removes a member from the project.

**Request:**
```
DELETE http://localhost:3001/api/projects/members/1
Headers:
  Content-Type: application/json
```

**URL Parameters:**
- `id` (number, required): The ID of the member to remove

**Response:**
```
Status: 200 OK
Body: (empty or success message)
```

**Status Codes:**
- `200 OK`: Member removed successfully
- `404 Not Found`: Member with given ID not found
- `500 Internal Server Error`: Server error

---

## Error Response Format

When an error occurs, the API should return:

```json
{
  "message": "Error description here"
}
```

---

## Notes

1. All endpoints expect and return JSON.
2. The component handles network errors gracefully and displays user-friendly error messages.
3. After successful POST or DELETE operations, the component automatically refreshes the members list.
4. The component includes client-side validation for email format and required fields.

