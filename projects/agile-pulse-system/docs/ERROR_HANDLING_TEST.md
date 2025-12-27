# Error Handling Test Guide

This document describes how to test various failure scenarios to confirm correct error messages and behaviors across client and server.

## Prerequisites

1. Start the backend server: `cd be && npm start`
2. Start the frontend server: `cd fe && npm start`
3. Open browser console to view error logs

## Test Scenarios

### 1. Authentication Errors

#### 1.1 Invalid Login Credentials
- **Action**: Try to login with incorrect email/password
- **Expected**: 
  - HTTP 401 status code
  - Error message displayed in UI: "Invalid credentials" or similar
  - Console log shows: `[AuthService] HTTP 401 Error`
  - Error message is dismissible

#### 1.2 Missing Login Fields
- **Action**: Submit login form with empty email or password
- **Expected**:
  - Client-side validation errors displayed
  - Field-level error messages shown
  - Form submission prevented

#### 1.3 Network Error During Login
- **Action**: Stop backend server, then try to login
- **Expected**:
  - Network error message: "Network error: Unable to connect to the server..."
  - Console log shows network error details
  - Error displayed in UI with dismiss option

### 2. Story Creation/Update Errors

#### 2.1 Missing Required Fields
- **Action**: Submit story form without title, description, or acceptance criteria
- **Expected**:
  - HTTP 400 status code
  - Field-level validation errors displayed
  - Error message: "Validation failed. Please check your input."
  - Console log shows validation details

#### 2.2 Invalid Story Points
- **Action**: Enter negative story points or non-numeric value
- **Expected**:
  - Client-side validation error: "Story points must be a positive number"
  - Form submission prevented

#### 2.3 Invalid Value/Effort Range
- **Action**: Enter value or effort outside 0-10 range
- **Expected**:
  - Client-side validation error displayed
  - Form submission prevented

#### 2.4 Invalid Status/Priority
- **Action**: Try to submit with invalid status or priority (via API manipulation)
- **Expected**:
  - HTTP 400 status code
  - Error message about invalid enum value
  - Console log shows validation error

#### 2.5 Story Not Found (Update)
- **Action**: Try to update a story with non-existent ID
- **Expected**:
  - HTTP 404 status code
  - Error message: "Story not found" or similar
  - Console log shows 404 error

### 3. Task Management Errors

#### 3.1 Invalid Task Status
- **Action**: Try to update task status to invalid value
- **Expected**:
  - HTTP 400 status code
  - Error message about invalid status
  - Console log shows validation error

#### 3.2 Task Not Found
- **Action**: Try to update/delete non-existent task
- **Expected**:
  - HTTP 404 status code
  - Error message: "Task with ID {id} not found"
  - Console log shows 404 error

#### 3.3 Invalid Assignee
- **Action**: Try to assign task to non-existent user
- **Expected**:
  - HTTP 400 or 404 status code
  - Appropriate error message
  - Console log shows error details

#### 3.4 Negative Actual Hours
- **Action**: Try to set negative actual hours
- **Expected**:
  - HTTP 400 status code
  - Error message: "Actual hours cannot be negative"
  - Console log shows validation error

### 4. Network Errors

#### 4.1 Backend Server Down
- **Action**: Stop backend server, perform any API operation
- **Expected**:
  - Network error message displayed
  - Console log shows network error
  - Error message is user-friendly

#### 4.2 Slow Network/Timeout
- **Action**: Use browser DevTools to throttle network to "Slow 3G"
- **Expected**:
  - Loading states displayed
  - Timeout errors handled gracefully if applicable

### 5. Authorization Errors

#### 5.1 Unauthorized Access
- **Action**: Try to access protected endpoint without token
- **Expected**:
  - HTTP 401 status code
  - Error message: "You are not authorized. Please log in and try again."
  - Redirect to login page (if applicable)

#### 5.2 Forbidden Access
- **Action**: Try to access admin-only endpoint as regular user
- **Expected**:
  - HTTP 403 status code
  - Error message: "You do not have permission to perform this action."
  - Console log shows 403 error

### 6. Server Errors

#### 6.1 Internal Server Error
- **Action**: Trigger a server error (e.g., database connection failure)
- **Expected**:
  - HTTP 500 status code
  - Error message: "Server error. Please try again later."
  - Console log shows detailed error for debugging

#### 6.2 Service Unavailable
- **Action**: Simulate service unavailability
- **Expected**:
  - HTTP 503 status code
  - Error message: "Service unavailable. Please try again later."
  - Console log shows error details

## Verification Checklist

For each test scenario, verify:

- [ ] Correct HTTP status code is returned
- [ ] Error message is displayed in UI
- [ ] Error message is user-friendly and clear
- [ ] Console log contains detailed error information for debugging
- [ ] Error can be dismissed (if applicable)
- [ ] Application remains stable (no crashes)
- [ ] User can recover from error (retry, go back, etc.)

## Error Message Standards

### Client-Side Validation
- Display field-level errors immediately
- Prevent form submission until valid
- Clear errors when user corrects input

### Server-Side Validation
- Display validation errors clearly
- Show which fields have errors
- Provide actionable guidance

### Network Errors
- Clear message about connection issue
- Suggest checking connection
- Allow retry

### Server Errors
- User-friendly message (don't expose technical details)
- Console log contains technical details for debugging
- Suggest trying again later

## Console Logging Standards

All errors should be logged with:
- Timestamp
- Context (component/service name)
- Error message
- HTTP status code (if applicable)
- Additional relevant information

Example:
```
[2024-01-15T10:30:45.123Z] Error in Login: {
  message: "Invalid credentials",
  statusCode: 401,
  error: Error stack trace,
  email: "user@example.com"
}
```

## Testing Tools

1. **Browser DevTools Console**: View error logs
2. **Network Tab**: Inspect HTTP responses and status codes
3. **React DevTools**: Check component state during errors
4. **Postman/curl**: Test API endpoints directly

## Automated Testing

Consider adding automated tests for:
- Error response formats
- Status code correctness
- Error message display
- Error recovery flows

