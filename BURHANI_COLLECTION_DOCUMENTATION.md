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

### 1.3 Key Features
- **Modern UI/UX**: Built with React and Tailwind CSS for a premium, responsive design.
- **Secure Authentication**: JWT-based authentication with access and refresh tokens.
- **Advanced Product Management**: Support for color variants, multi-image galleries, and stock tracking.
- **Integrated Payments**: Native Razorpay integration for secure and reliable checkouts.
- **Admin Dashboard**: A dedicated interface for managing the entire store's lifecycle.
- **WhatsApp Integration**: Direct ordering and support via WhatsApp.

---

## Chapter 2: System Design and Architecture

### 2.1 Architectural Overview
The system follows a modern decoupled architecture, separating the concerns of the presentation layer and the business logic layer.

- **Frontend**: A Single Page Application (SPA) built with React, communicating with the backend via RESTful APIs.
- **Backend**: A high-performance API service built with FastAPI (Python), handling data persistence, authentication, and external integrations.
- **Database**: A relational database (PostgreSQL for production, SQLite for development) managed through SQLAlchemy ORM.

### 2.2 Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, Framer Motion, Axios |
| **Backend** | FastAPI, Python 3.9+, SQLAlchemy, Pydantic, Passlib |
| **Database** | PostgreSQL / SQLite |
| **Payments** | Razorpay SDK |
| **Authentication** | JWT (JSON Web Tokens) |

### 2.3 Database Schema
The core database models ensure data integrity and support complex product relationships:
1.  **User**: Stores credentials (hashed), roles (Customer/Admin), and contact info.
2.  **Category**: Hierarchical organization of products.
3.  **Product**: Main product details including base price and description.
4.  **ProductColorVariant**: Enables stock tracking and unique galleries for different colors.
5.  **ProductImage**: Manages multiple images per product/variant.
6.  **Order & OrderItem**: Tracks transaction history, payment status, and individual line items.

### 2.4 Core Workflows
- **Authentication**: Uses a dual-token system (Access & Refresh) to maintain secure sessions while allowing long-term login stability.
- **Order Processing**: Uses database transactions to ensure stock consistency. Stock is only committed/deducted upon successful payment verification.
- **Payment Lifecycle**: Backend creates a Razorpay order -> Frontend executes payment -> Backend verifies signature -> Order status updated to 'Paid'.

---

## Chapter 3: User Manual

### 3.1 For Customers
#### 3.1.1 Account Management
- **Registration**: Navigate to the 'Register' page, provide your email/phone and a secure password.
- **Login**: Use your credentials to access your profile and order history.

#### 3.1.2 Shopping Experience
- **Browsing**: Use the category filters and search bar to find products.
- **Product Details**: Click on a product to view images, select color variants, and check stock availability.
- **Cart**: Add items to your cart. The cart is persistent across sessions using local storage.

#### 3.1.3 Checkout & Payment
- **Review Order**: Confirm quantities and total price in the cart.
- **Payment**: Choose between Razorpay (for card/UPI/Netbanking) or use the WhatsApp order feature for manual inquiries.
- **Confirmation**: Once paid, you will receive an order confirmation and can track the status in your dashboard.

### 3.2 For Administrators
#### 3.2.1 Accessing the Dashboard
- Log in with an account that has the `ADMIN` role.
- Access the management interface via the `/admin` route.

#### 3.2.2 Product Management
- **Adding Products**: Use the 'Add Product' form to enter names, descriptions, and base prices.
- **Managing Variants**: Add color variants with specific stock levels and unique image sets.
- **Stock Updates**: Update inventory levels in real-time to prevent overselling.

#### 3.2.3 Order Management
- **Order List**: View all pending and completed orders.
- **Status Updates**: Manually update order status (e.g., Processing, Shipped, Delivered) as the fulfillment progresses.
- **Payment Verification**: Monitor payment logs to resolve any transaction discrepancies.
