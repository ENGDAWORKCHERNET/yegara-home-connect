# Ethiopian Home Hub

Project Title: Yegara Housing Platform - Production Version

Project Goal: Build a fully online, production-ready housing management platform for Ethiopia. This is NOT a local development project. It must be deployed to the cloud with a proper database, authentication, file storage, and security measures suitable for handling sensitive user data and payment receipts. The platform should be able to scale to support 100+ users uploading receipts monthly.

🚀 Deployment & Architecture Requirements

Hosting & Infrastructure:

Deployment: Deploy to Vercel, Netlify, or Railway with automatic builds from Git.

Environment Variables: Use environment variables for all sensitive configuration (API keys, database URLs, JWT secrets).

CI/CD: Configure automatic deployment on push to the main branch.

Domain: Configure to work with a custom domain (if provided).

Database (Cloud PostgreSQL):

Use Supabase PostgreSQL (recommended) or Neon.tech for a cloud-hosted database.

Connection Pooling: Configure connection pooling to handle multiple concurrent users (100+).

Row Level Security (RLS): Implement RLS policies to ensure users can only access their own data. This is critical for preventing users from accessing other users' dashboards via URL manipulation.

Backups: Ensure automatic daily backups are enabled.

Authentication (Supabase Auth):

Use Supabase Auth with JWT-based authentication.

Session Management: Implement refresh tokens and automatic session renewal.

Security Headers: Configure proper CORS, CSP, and other security headers.

No URL Sharing: Implement proper session validation so that a user cannot share their dashboard URL with others. If a user tries to access a protected route without a valid session, they should be redirected to login.

File Storage:

Use Supabase Storage or AWS S3 for storing uploaded images (payment receipts, maintenance photos).

Secure URLs: Generate time-limited, signed URLs for viewing images (not public URLs).

File Validation: Validate file types, sizes, and scan for malware (if possible).

Storage Policies: Implement strict bucket policies to prevent unauthorized access.

👥 User Roles & Features

1. Authentication System:

Registration: Users sign up with name, email, phone, password, and role (Owner, Tenant, Guard). Email verification should be required before they can log in.

Login: Secure login with email/password. Use Supabase's built-in rate limiting to prevent brute force attacks.

Password Reset: Implement a "Forgot Password" flow with email reset links.

Session Security: Sessions should expire after a set time (e.g., 7 days) and users should be required to re-authenticate for sensitive actions (e.g., viewing payment receipts).

Logout: Clear session and redirect to login.

2. Owner Dashboard:

Property Management:

Add houses (number, rent amount, due date, recurrence type).

Edit house details (modal).

View list of owned properties with status (Vacant/Occupied).

See current tenant name and contact info (if occupied).

Tenant Request Management:

View all Pending Tenant Requests in a dedicated section.

Approve or Reject requests.

Auto-reject other pending requests for a house when one is approved.

Payment Verification:

View submitted payment receipts with:

Tenant name & house number.

Upload date and time.

Payment status (Pending/Verified/Late).

AI Trust Score (High/Medium/Low).

Image preview (click to view full image in modal).

Verify/Approve payments (updates status to "verified").

Rent Alerts:

Show real-time alerts for upcoming due dates (within 3 days) and overdue payments.

Color-coded indicators (green = paid, yellow = due soon, red = overdue).

Maintenance Management:

View all maintenance requests from tenants (description, photos, status).

Update status (Pending → In-Progress → Resolved).

Announcements:

Create and post community announcements (title + message).

View all past announcements.

Calendar View:

Interactive calendar showing rent due dates for all owned properties.

Dashboard Overview:

Stats cards: Total Houses, Total Tenants, Pending Payments, Open Maintenance Requests.

Quick action buttons for common tasks.

3. Tenant Dashboard:

Find Houses:

Browse available houses (those without approved tenants).

Filters by price range (optional).

Request to Rent button (only one pending/approved request allowed at a time).

Request Status:

Show "Pending Approval" card while waiting for owner response.

Show "Approved" card with full house details (owner name, house number, rent, due date).

Payment Management:

Upload Payment Receipt form with file validation (image, max 5MB).

Show upload progress indicator.

Payment History table:

Date uploaded.

Status (Pending/Verified/Late).

AI Trust Score.

Option to view receipt image.

Maintenance Requests:

Submit new request (description + optional image).

View request history with status updates.

Rent Alerts:

Show alert when rent is due soon or overdue.

Calendar View:

Interactive calendar showing their own rent due dates.

4. Guard Dashboard:

Community Report:

Table showing all houses with:

House number.

Owner name & phone.

Tenant name & phone (or "Vacant").

Search/filter functionality.

Announcements Feed:

View all community announcements in chronological order.

🤖 AI Integration (Gemini)

Payment Receipt Verification:

When a tenant uploads a payment receipt:

The image is uploaded to cloud storage.

The system calls the Gemini API with:

The expected rent amount (from the house record).

The receipt image (base64 encoded).

Gemini analyzes the image and returns JSON:

extracted_amount: The amount found on the receipt.

amount_match: "yes" or "no".

is_valid_receipt: "yes" or "no".

notes: Brief explanation.

The system calculates a Trust Score:

High: Valid receipt AND amount matches.

Medium: Valid receipt BUT amount doesn't match.

Low: Invalid receipt or API error.

The payment record is saved with the Trust Score.

The next_due_date is automatically calculated and updated.

Graceful Failure: If the Gemini API fails, the upload should still succeed with a "Low" trust score and a user-friendly error message.

🎨 UI/UX Design Requirements

Design Language:

Color Palette: Inspired by the Ethiopian flag for cultural relevance:

Primary Green: #1A7A3A (dark, professional green)

Accent Gold/Yellow: #FCD34D or #EAB308

Secondary Red: #B91C1C (for alerts/errors)

Neutral backgrounds: #F8FAFC, #F1F5F9

Text: #1E293B (dark slate), #64748B (slate)

Typography: Inter or Poppins (Google Fonts).

Components: Use Shadcn UI for consistent, accessible components.

Layout: Professional sidebar navigation for dashboards, top navbar for public pages.

Responsive: Fully mobile-first responsive design.

Key UI Elements:

Dashboard Layout: Left sidebar with navigation, main content area on the right.

Stats Cards: On Owner Dashboard, show key metrics with icons.

Data Tables: Clean, sortable tables with search/filter options.

Modals: Use modals for editing houses, viewing images, etc.

Toast Notifications: Success/error messages should appear as toast notifications (not inline alerts).

Loading States: Show loading skeletons or spinners during data fetching and file uploads.

Empty States: Friendly messages when tables have no data.

📊 Database Schema (Supabase PostgreSQL)

Tables (as per your existing schema):

users - Extended with Supabase Auth fields.

houses - Property listings.

tenant_assignments - House rental requests/assignments.

payments - Rent payment records with AI trust scores.

announcements - Community announcements.

maintenance_requests - Maintenance issues reported by tenants.

Row Level Security (RLS) Policies:

Users: Users can only read/update their own profile.

Houses: Owners can CRUD their own houses. Tenants can only read houses they are assigned to.

Tenant Assignments: Owners can read/write assignments for their houses. Tenants can read/update their own assignments.

Payments: Tenants can only read/insert their own payments. Owners can read payments for their houses.

Maintenance: Tenants can CRUD their own requests. Owners can read/update requests for their houses.

Announcements: Anyone logged in can read. Only owners can create.

🔒 Security Requirements

Critical Security Measures:

Environment Variables: All secrets (API keys, database URLs, JWT secrets) must be in .env and NOT in the codebase.

HTTPS: Enforce HTTPS in production.

CORS: Restrict API access to only your domain.

Rate Limiting: Limit login attempts, file uploads, and API requests per IP.

Input Validation: Sanitize all user inputs on both client and server.

File Upload Security:

Validate file type (images only).

Validate file size (max 5MB).

Store files with random names (not user-provided).

Scan for malware (if possible).

SQL Injection Prevention: Use parameterized queries or an ORM.

XSS Prevention: Sanitize all user-generated content before rendering.

CSRF Protection: Use CSRF tokens on all forms.

Session Security:

HttpOnly, Secure, SameSite cookies.

Session expiration.

Automatic logout on inactivity.

Data Encryption: Encrypt sensitive data (e.g., phone numbers) at rest (if required by regulations).

⚙️ Technical Stack (Recommended for Lovable)

Frontend: React + TypeScript

Backend: Node.js + Express + TypeScript (or Supabase Edge Functions)

Database: Supabase PostgreSQL (with Row Level Security)

Authentication: Supabase Auth

File Storage: Supabase Storage (or AWS S3)

Styling: Tailwind CSS + Shadcn UI

State Management: Zustand or React Context

API Client: Supabase JS Client or React Query

Hosting: Vercel or Netlify

AI: Gemini API (Google AI Studio)

📋 Core Logic Requirements

Payment Due Date Calculation:

When a payment is verified, automatically calculate the next due date based on the house's recurrence type (monthly/quarterly/yearly).

Update the next_due_date field in the houses table.

Tenant Request Workflow:

A tenant can only have one pending or approved request at a time.

When an owner approves a tenant, reject all other pending requests for that house.

Payment Status:

"Pending" = Uploaded, not yet verified by owner.

"Verified" = Confirmed by owner.

"Late" = Payment is overdue (calculated automatically).

"Paid" = Verified and on-time.

Rent Alerts:

Check next_due_date for all houses every time the dashboard loads.

Show alerts for due dates within 3 days and overdue payments.

Maintenance Request Status:

"Pending" = New request.

"In-Progress" = Owner acknowledged and working on it.

"Resolved" = Completed.

📱 Mobile-First Experience

All dashboards must be fully responsive.

Sidebar should collapse to a hamburger menu on mobile.

Tables should scroll horizontally on mobile.

File uploads should work on mobile browsers (support camera access).

Touch-friendly buttons and form controls.

🔧 Development & Testing Requirements

TypeScript: Use TypeScript for type safety across the entire codebase.

Testing: Include unit tests for critical functions (payment logic, authentication).

Error Handling: Comprehensive error handling with user-friendly messages.

Logging: Implement logging for debugging and monitoring.

Performance: Optimize database queries with indexes.

Documentation: Generate API documentation (OpenAPI/Swagger) for the backend.

📦 Final Deliverables

A complete, production-ready web application that:

Works online (not localhost).

Uses a cloud database (Supabase) with RLS.

Has secure authentication (Supabase Auth).

Stores files in the cloud (Supabase Storage).

Integrates Gemini AI for receipt verification.

Scales to 100+ users with monthly receipts.

Is fully responsive and professional-looking.

Is deployed to a public URL.

Has proper security measures (session management, input validation, etc.).

Is connected to a Git repository for version control and CI/CD.

⚠️ Important Notes for Lovable

No Local Development Files: This is a production build. Do not create XAMPP, PHP, or MySQL-specific files. Everything must be cloud-native.

Use Supabase: It's the recommended solution for this project. It handles authentication, database, storage, and RLS out of the box.

Security First: Every feature must be built with security in mind. RLS policies are mandatory.

Professional UI: The design should be good enough to present to investors or launch publicly. Use Shadcn UI for a polished look.

Scalable Architecture: The code should be structured to handle growth. Use proper folder structure, component separation, and state management.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://yegara-home-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/026887d1-73eb-488e-a701-b385725d8628).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
