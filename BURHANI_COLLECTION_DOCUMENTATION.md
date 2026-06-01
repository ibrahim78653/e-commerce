# Burhani Collection - Technical Documentation

## Chapter 1: Introduction

### 1.1 Project Overview
**Burhani Collection** is a high-performance, production-ready e-commerce platform designed to provide a seamless shopping experience. Built with a modern tech stack, the platform prioritizes scalability, security, and user engagement. It serves as a comprehensive solution for online retail, featuring robust inventory management, secure payment processing, and administrative controls.

### 1.2 Purpose and Objectives
The primary goal of Burhani Collection is to bridge the gap between traditional retail and digital commerce by offering:
- **Fast and Responsive Interface**: Ensuring a smooth experience across all devices.
- **Secure Transactions**: Integrating industry-standard payment gateways like Razorpay.
- **Efficient Management**: Providing administrators with tools to manage products, stock, and orders in real-time.
- **Direct Communication**: Leveraging WhatsApp for order inquiries and alternative ordering workflows.

---

## Chapter 2: Functional, Non-Functional, and Technological Details

### 2.1 Functional Requirements
- **User Authentication**: Secure login/registration via Email or Phone, supported by JWT access and refresh tokens.
- **Product Management**: Ability for administrators to perform CRUD operations on products, including uploading up to 3 images per product and tracking stock variations based on color variants.
- **Shopping Cart**: A persistent cart mechanism utilizing local storage to maintain user selections across sessions.
- **Checkout and Payments**: Integrated Razorpay checkout flow with signature verification, and an alternative WhatsApp order placement feature.
- **Order Tracking & Admin Dashboard**: An intuitive interface for tracking payment statuses, updating order stages, and managing the overall store catalog.

### 2.2 Non-Functional Requirements
- **Performance**: High availability and rapid response times powered by a decoupled SPA frontend and a highly optimized FastAPI backend.
- **Security**: Robust protection measures including JWT authentication, rate limiting, and secure transaction handshakes. Passwords are cryptographically hashed using Passlib.
- **Scalability**: Stateless backend API design allowing horizontal scaling, backed by a robust PostgreSQL relational database system.
- **Usability**: Responsive, mobile-first design implemented with Tailwind CSS and enhanced with Framer Motion animations for smooth user interactions.

### 2.3 Technological Details
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand (for state management), Framer Motion, and React Hook Form.
- **Backend**: Python 3.9+, FastAPI, SQLAlchemy ORM, Pydantic (data validation), and Uvicorn.
- **Database**: PostgreSQL (for production) and SQLite (for development environments).
- **Payment Gateway**: Razorpay SDK.
- **Deployment & Hosting**: Configured for deployment on platforms like Vercel (frontend) and Render/Railway (backend).

---

## Chapter 3: System Architecture

### 3.1 Architectural Overview
The platform utilizes a modern client-server architectural pattern:
- **Presentation Layer (Frontend)**: A Single Page Application (SPA) communicating with the backend exclusively via RESTful APIs. It handles UI rendering, local state, and form validation.
- **Application Layer (Backend)**: An asynchronous FastAPI service acting as the core engine, managing business logic, routing, request validation, and external service integration.
- **Data Layer (Database)**: A relational database structured to enforce data integrity and manage complex relationships among users, products, variants, and orders.

### 3.2 Database Schema Architecture
The core entities within the database include:
1. **User**: Centralizes credentials, roles (e.g., Customer, Admin), and contact information.
2. **Category**: Manages the hierarchical organization of inventory.
3. **Product**: Contains core product data, base pricing, and comprehensive descriptions.
4. **ProductColorVariant**: Essential for tracking granular stock levels and variant-specific galleries.
5. **ProductImage**: Handles associations between multiple images and specific products or variants.
6. **Order & OrderItem**: Manages the end-to-end transactional lifecycle, line items, and payment synchronization.

### 3.3 Core Workflows
- **Authentication Flow**: Users receive a short-lived access token and a long-lived refresh token, enabling secure, continuous sessions without repeated logins.
- **Payment & Order Lifecycle**: The backend initiates an order ID with Razorpay -> the frontend processes the user's payment -> the backend cryptographically verifies the response -> database commits stock deduction and finalizes order status.
- **Inventory Concurrency**: System uses transaction isolation to prevent race conditions during the final checkout phase, ensuring accurate stock tracking.

---

## Summary
The **Burhani Collection** platform is a cohesive, modern e-commerce solution that leverages the speed of FastAPI and the dynamic capabilities of React. By structurally decoupling the architecture and enforcing secure communication via RESTful APIs, the project provides a highly scalable and robust system. It successfully balances sophisticated functional capabilities—like multi-variant stock tracking and dual-channel order processing (Razorpay and WhatsApp)—with strict non-functional requirements targeting security, performance, and cross-device responsiveness.
