# CYY Backend - Supabase Backend Services

Backend services for CYY Medication Reminder App's social features.

## 🏗️ Architecture

This backend is built on Supabase and provides:

- **Authentication**: User signup/login with email
- **User Profiles**: Username-based profiles
- **Friend System**: Add friends via invite links or username search
- **Medication Sharing**: Share medication info with friends
- **Friend Reminders**: Send and receive medication reminders
- **Real-time Updates**: Live updates for friend activities

## 📁 Project Structure

```
CYYBackend/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql    # Database schema
│   └── functions/
│       ├── send-reminder/             # Send friend reminders
│       └── process-friend-request/    # Handle friend requests
├── scripts/
│   ├── test-connection.js             # Test database connection
│   ├── test-auth.js                   # Test authentication
│   └── test-realtime.js              # Test real-time features
├── docs/
│   └── instruction.md                 # Setup instructions
└── package.json
```

## 🚀 Quick Start

1. **Setup Supabase Project**
   - Follow the instructions in `instruction.md`
   - Create a Supabase project
   - Run the database migrations

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Test Connection**
   ```bash
   npm install
   npm run test:connection
   ```

## 📊 Database Schema

### Tables

- **profiles**: User profiles with username and display name
- **friendships**: Friend relationships and requests
- **invite_codes**: Temporary invite codes for adding friends
- **shared_medications**: Medications shared between friends
- **medication_logs**: Synced medication taking history
- **friend_reminders**: Reminder messages between friends

### Key Features

- Row Level Security (RLS) for data privacy
- Automatic friendship reciprocity
- Invite code expiration
- Real-time subscriptions

## 🔐 Security

- All tables use Row Level Security
- Users can only access their own data
- Friend relationships control data visibility
- Invite codes expire after 7 days

## 🔄 Edge Functions

### send-reminder
Sends a reminder notification to a friend about their medication.

### process-friend-request
Handles accepting/rejecting friend requests with automatic reciprocal creation.

## 📱 Mobile App Integration

The mobile app integrates with this backend through:

1. **Supabase Client**: Direct database access
2. **Edge Functions**: Business logic execution
3. **Real-time Subscriptions**: Live updates
4. **OneSignal**: Push notifications

## 🧪 Testing

Run the test scripts to verify your setup:

```bash
# Test database connection
npm run test:connection

# Test authentication flow
npm run test:auth

# Test real-time features
npm run test:realtime

# Run all tests
npm run verify
```

## 📚 Documentation

- [Setup Instructions](./instruction.md)
- [Supabase Docs](https://supabase.com/docs)
- [Database Schema](./supabase/migrations/001_initial_schema.sql)

## 🤝 Contributing

1. Test changes locally using Supabase CLI
2. Update migrations for schema changes
3. Test Edge Functions thoroughly
4. Update documentation

## 📄 License

Part of the CYY Medication Reminder App project.