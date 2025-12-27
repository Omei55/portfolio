# Export Service

This module provides functionality to export user stories to external platforms (Jira and Taiga).

## Features

- **Multi-platform support**: Export to Jira or Taiga
- **Flexible authentication**: Supports API tokens, Basic auth, and OAuth for Jira; Token auth for Taiga
- **Retry logic**: Automatic retry with exponential backoff for transient failures
- **Comprehensive logging**: Request/response logging for debugging
- **Error handling**: Graceful error handling with detailed error messages
- **Field mapping**: Automatic mapping of Agile Pulse story fields to platform-specific formats

## API Endpoint

### POST `/api/export/stories`

Export user stories to Jira or Taiga.

**Authentication**: Requires JWT token (Bearer token in Authorization header)

**Request Body**:
```json
{
  "storyIds": ["story-id-1", "story-id-2"],
  "config": {
    "platform": "jira" | "taiga",
    "baseUrl": "https://your-instance.com",
    "projectKey": "PROJECT_KEY",
    "issueType": "Story", // Optional, for Jira only
    "auth": {
      // Jira auth options
      "type": "api_token" | "basic" | "oauth",
      "username": "user@example.com", // For api_token or basic
      "apiToken": "your-api-token", // For api_token
      "password": "password", // For basic
      "accessToken": "oauth-token", // For oauth
      
      // OR Taiga auth
      "type": "token",
      "token": "taiga-api-token"
    }
  }
}
```

**Response**:
```json
{
  "platform": "jira",
  "totalStories": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "storyId": "story-id-1",
      "success": true,
      "externalId": "PROJ-123"
    },
    {
      "storyId": "story-id-2",
      "success": true,
      "externalId": "PROJ-124"
    }
  ]
}
```

## Field Mapping

### Jira Mapping
- `title` → `summary`
- `description` → `description` (includes acceptance criteria, value, effort)
- `priority` → `priority` (mapped: High→Highest, Medium→Medium, Low→Lowest)
- `storyPoints` → `customfield_10016` (Story Points field)
- `assignee` → `assignee.name`
- `tags` → `labels`
- `epic` → `customfield_10011` (Epic Link)

### Taiga Mapping
- `title` → `subject`
- `description` → `description` (includes acceptance criteria, value, effort)
- `priority` → `priority` (mapped: High→4, Medium→2, Low→1)
- `storyPoints` → `points`
- `assignee` → `assigned_to`
- `tags` → `tags`
- `epic` → `epic` (project ID)

## Authentication

### Jira

1. **API Token** (Recommended):
   - Generate API token from: https://id.atlassian.com/manage-profile/security/api-tokens
   - Use email as username and API token as password

2. **Basic Auth**:
   - Username and password

3. **OAuth**:
   - OAuth access token

### Taiga

1. **Token Auth**:
   - Generate token from Taiga API: `POST /api/v1/auth`
   - Use token in Authorization header as Bearer token

## Error Handling

The service implements retry logic with exponential backoff:
- **Max retries**: 3
- **Initial delay**: 1 second
- **Max delay**: 10 seconds
- **Backoff multiplier**: 2

Retries are performed for:
- Server errors (5xx)
- Rate limiting (429)
- Network errors

Client errors (4xx, except 429) are not retried.

## Logging

The service logs:
- Export start/completion
- Individual story export results
- API request details (endpoint, payload)
- API response details (status, body)
- Errors and retry attempts

Logs are available in the application logs at DEBUG level.

## Testing

Run unit tests:
```bash
npm test -- export
```

Test files:
- `payload-generators/jira-payload-generator.spec.ts`
- `payload-generators/taiga-payload-generator.spec.ts`
- `export.service.spec.ts`

## Usage Example

```typescript
// Export to Jira
const exportDto = {
  storyIds: ['story-1', 'story-2'],
  config: {
    platform: ExportPlatform.JIRA,
    baseUrl: 'https://company.atlassian.net',
    projectKey: 'PROJ',
    issueType: 'Story',
    auth: {
      type: JiraAuthType.API_TOKEN,
      username: 'user@example.com',
      apiToken: 'api-token-123',
    },
  },
};

const result = await exportService.exportStories(exportDto);
```


