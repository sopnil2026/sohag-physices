# Sohag Physics — Website

Bilingual (Bangla / English) responsive website for **Sohag Physics — Academic & Admission Care**, Bogura.
Pure HTML/CSS/JS (no build step), works on GitHub Pages.

## Pages
Home · All Courses · Blog · Hall of Fame · About Us · Contact · Student Portal (Login, New Registration, Programs, Online Exam, Privacy Policy) · Student Dashboard (admission request after login) · Admin Panel (`#/admin`).

## Admin panel
Open `/#/admin`. Manage students (block/delete/export CSV), admission requests, messages, courses, blog, Hall of Fame, online exams, batches, teacher profile, contact/social/WhatsApp/YouTube settings, and see the login log. Change the admin password under **Site Settings**.

## Important: data storage
`js/store.js` currently saves data in the visitor's **browser (localStorage)**. That means student accounts and admin data are **not shared between devices**, and the admin login is checked in the browser, so it is **not secure for real student data**.
Before using it for real students, replace `js/store.js` with a real backend (e.g. Supabase/PostgreSQL or your own API with server-side password hashing and sessions). All UI code talks only to `Store.*`, so only that one file needs to change.

## Edit content
Everything shown on the site (courses, blog, Hall of Fame, schedule, phones, WhatsApp, YouTube, offer text, teacher profile) is editable from the Admin panel — no code needed.
