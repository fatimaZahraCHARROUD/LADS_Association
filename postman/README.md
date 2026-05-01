# LADS Association – Postman Collection

## Files

| File | Description |
|---|---|
| `LADS_API.postman_collection.json` | All API endpoints organized by resource |
| `LADS_local.postman_environment.json` | Environment variables for local development |

## Import

1. Open Postman → click **Import** (top left)
2. Drag and drop both `.json` files (or select them)
3. Select **LADS – Local** from the environment dropdown (top right corner)

## Base URL

The environment is pre-configured with:

```
baseUrl = http://localhost:3000
```

Make sure the backend is running (`npm run start:dev` inside `backend/`) before sending requests.

## ID Variables

After creating a resource with a POST request, copy the `_id` from the response body and paste it into the matching environment variable. This lets all subsequent GET / PATCH / DELETE requests for that resource work without manual URL editing.

| Variable | Used for |
|---|---|
| `userId` | `/users/:id` routes |
| `eventId` | `/events/:id` routes + event registration filter |
| `activityId` | `/activities/:id` routes |
| `newsId` | `/news/:id` routes |
| `ladsInfoId` | `/lads-info/:id` routes |
| `contactMessageId` | `/contact-messages/:id` routes |
| `membershipRequestId` | `/membership-requests/:id` routes |
| `registrationId` | `/event-registrations/:id` routes |

## Endpoints Overview

### Users — `/users`
| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Events — `/events`
| Method | Path | Description |
|---|---|---|
| GET | `/events` | List all events (`?status=upcoming&isPublished=true`) |
| GET | `/events/:id` | Get event by ID |
| POST | `/events` | Create event |
| PATCH | `/events/:id` | Update event |
| PATCH | `/events/:id/publish` | Toggle published state |
| DELETE | `/events/:id` | Delete event |

### Activities — `/activities`
| Method | Path | Description |
|---|---|---|
| GET | `/activities` | List all activities |
| GET | `/activities/:id` | Get activity by ID |
| POST | `/activities` | Create activity |
| PATCH | `/activities/:id` | Update activity |
| PATCH | `/activities/:id/publish` | Toggle published state |
| DELETE | `/activities/:id` | Delete activity |

### News — `/news`
| Method | Path | Description |
|---|---|---|
| GET | `/news` | List all news |
| GET | `/news/:id` | Get news by ID |
| POST | `/news` | Create news article |
| PATCH | `/news/:id` | Update news article |
| PATCH | `/news/:id/publish` | Toggle published state |
| DELETE | `/news/:id` | Delete news article |

### LADS Info — `/lads-info`
| Method | Path | Description |
|---|---|---|
| GET | `/lads-info` | List all info entries |
| GET | `/lads-info/:id` | Get entry by ID |
| POST | `/lads-info` | Create info entry |
| PATCH | `/lads-info/:id` | Update info entry |
| DELETE | `/lads-info/:id` | Delete info entry |

### Contact Messages — `/contact-messages`
| Method | Path | Description |
|---|---|---|
| GET | `/contact-messages` | List all messages (admin) |
| GET | `/contact-messages/:id` | Get message by ID (admin) |
| POST | `/contact-messages` | Submit message (public form) |
| DELETE | `/contact-messages/:id` | Delete message (admin) |

### Membership Requests — `/membership-requests`
| Method | Path | Description |
|---|---|---|
| GET | `/membership-requests` | List all requests (admin) |
| GET | `/membership-requests/:id` | Get request by ID (admin) |
| POST | `/membership-requests` | Submit request (public form) |
| DELETE | `/membership-requests/:id` | Delete request (admin) |

### Event Registrations — `/event-registrations`
| Method | Path | Description |
|---|---|---|
| GET | `/event-registrations` | List all registrations (`?eventId=...` to filter) |
| GET | `/event-registrations/:id` | Get registration by ID |
| POST | `/event-registrations` | Register for an event (public) |
| DELETE | `/event-registrations/:id` | Cancel registration |

## Multilingual Fields

Events, Activities, News, and LADS Info use trilingual objects for text content:

```json
{
  "title": { "en": "...", "fr": "...", "ar": "..." },
  "description": { "en": "...", "fr": "...", "ar": "..." }
}
```

Always provide all three languages when creating or updating content.
