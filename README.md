# Birthday Reminder Service

A backend service that stores user data and sends "Happy Birthday" messages at 9 AM in each user's local timezone.

## Running with Docker

**Prerequisites:** Docker and Docker Compose installed.

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Build and start the services:

   ```bash
   docker compose up --build -d
   ```

The API will be available at `http://localhost:3000`. MongoDB and the birthday worker start automatically alongside the app.

To stop:

```bash
docker compose down
```

## Running Tests

```bash
npm test
```

## API Reference

All endpoints are prefixed with `/api/v1`.

### Create a user

```
POST /api/v1/users
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "birthday": "1990-06-15",
  "timezone": "Asia/Jakarta"
}
```

Response `201`:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "birthday": "1990-06-15",
  "timezone": "Asia/Jakarta"
}
```

### Get a user

```
GET /api/v1/users/:id
```

Response `200`: user object. `404` if not found.

### Update a user

```
PATCH /api/v1/users/:id
```

All fields are optional. Only `birthday` and `timezone` changes trigger rescheduling.

```json
{
  "timezone": "Asia/Tokyo"
}
```

Response `200`: updated user object. `404` if not found.

### Delete a user

```
DELETE /api/v1/users/:id
```

Response `204`. Cancels any pending birthday jobs for the user. `404` if not found.

## Sample Simulations

- To simulate the scheduler, register a user. This will automatically register a schedule for the birthday reminder.
- Adjust the job data to run at past timestamp. You can use this snippet with `mongosh` for simplicity.

```
db.agendaJobs.updateOne({
	"data.userId": "<registered_user_id>"
},
{
	$set: {
		nextRunAt: new Date("2026-04-22")
	}
})
```

- The birthday reminder will be logged on the application level.

<img width="1321" height="225" alt="image" src="https://github.com/user-attachments/assets/f56c2303-9318-4d96-8dc8-1c08620a5565" />


## Design Decisions

### Scheduling

- Jobs are persisted in MongoDB (`agendaJobs` collection), so scheduled reminders survive restarts. Each job stores only the `userId`; the user record is fetched fresh at fire time.

### Timezone Handling

- Birthdays are scheduled at exactly 9:00 AM in the user's IANA timezone using Luxon, then stored as UTC. Rescheduling happens immediately on user creation and whenever `birthday` or `timezone` is updated.

### Job Audit

- After a job fires, Agenda inserts a new job document for next year rather than updating in-place, leaving a finished record behind. This is a known tradeoff: it provides a natural audit log but grows the collection over time.

## Assumptions & Limitations

- The messaging client is a console log stub. Swapping it for a real email/SMS provider requires further implementation.
- No authentication or rate limiting on the API.
- Birthday year in the `birthday` field is stored but only the month and day are used for scheduling.
- Users born on Feb 29 receive their message on Feb 28 in non-leap years.
