HappyStats - Simplified Project Guide
📋 MVP Overview
This guide outlines the Minimum Viable Product (MVP) for the HappyStats application. The goal is to create a streamlined and intuitive web app that allows users to track, visualize, and analyze their personal data through charts, with a clear path to paid subscriptions.

🏗️ Tech Stack
Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS

Backend: Node.js + Express (or similar)

Database: PostgreSQL

Payments: Stripe

Deployment: Dockerfile for Coolify

🎯 Core Features
1. User Authentication & Tiers

Free Account:

Users can sign up for free.

Limited to creating a maximum of 3 charts.

Monthly Subscription:

Price: €1 for the first month, then €9.99/month.

Benefits: Unlimited charts and priority support.

Lifetime Access:

Price: €99.99 one-time payment.

Benefits: Lifetime access, unlimited charts, "super support," and access to all future features.

2. User Dashboard

A clean and simple interface to:

View all created charts.

Create new charts.

Edit existing charts.

Filter charts by category.

Search for charts by name.

3. Chart Functionality

Chart Creation:

Users can create charts with a name and category.

Data Points:

Each data point includes a measurement, a date, and a name.

Trending Line:

All charts will automatically display a trending line.

Full-View & Editing:

Charts can be opened in a full-view mode.

In full-view, users can:

View all data points.

Edit existing data points.

Add new data points.

Filter data points by a date range.

4. Data Import/Export

Export to CSV: Users can export their chart data to a CSV file.

Import from CSV: Users can create new charts by uploading a CSV file.

5. Landing Page

A visually appealing and persuasive landing page to attract new users.

Clear calls-to-action to encourage sign-ups.

A section that teases the future AI assistant feature.

