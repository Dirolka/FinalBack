# Project Report: Product Manager

**Assignment 4 — Backend Application with MVC, Authentication & RBAC**

---

## 1. Executive Summary

This report describes the **Product Manager** web application built with Node.js, Express, and MongoDB. The project implements a modular MVC architecture, JWT-based authentication, role-based access control (RBAC), and full CRUD operations for products and categories, plus order management. The frontend is a single-page application (SPA) with four main pages: Home, Product List, Single Product, and Account/Admin panel.

---

## 2. Technologies Used

| Layer        | Technologies |
|-------------|--------------|
| Backend     | Node.js, Express.js |
| Database    | MongoDB (Mongoose ODM) |
| Authentication | JWT (JSON Web Tokens), bcrypt for password hashing |
| Frontend    | HTML5, CSS3, vanilla JavaScript (SPA with hash-based routing) |

---

## 3. Architecture: MVC Pattern

The codebase is organized according to the **Model–View–Controller** pattern.

### 3.1 Models (`src/models/`)

- **User** — email, hashed password (bcrypt), role (user | admin). Passwords are never stored in plain text.
- **Category** — name, model, memory, color, description. Used for product classification and filtering.
- **Product** — name, price, category (reference to Category), description.
- **Order** — user (reference), product (reference), quantity, totalPrice, status (pending | confirmed | cancelled).

### 3.2 Controllers (`src/controllers/`)

- **auth.controller.js** — register, login, get current user (getMe).
- **category.controller.js** — create, getAll, getById, update, delete categories.
- **product.controller.js** — create, getAll (with filters), getById, update, delete products.
- **order.controller.js** — create order (purchase), get current user’s orders.

### 3.3 Routes (`src/routes/`)

- **auth.routes.js** — POST /auth/register, POST /auth/login, GET /auth/me.
- **products.routes.js** — GET/POST /products, GET/PUT/DELETE /products/:id.
- **category.routes.js** — GET/POST /categories, GET/PUT/DELETE /categories/:id.
- **order.routes.js** — POST /orders, GET /orders (both protected by JWT).

### 3.4 Middleware (`src/middleware/`)

- **auth.middleware.js** — JWT verification (authenticate), admin-only access (authorizeAdmin).
- **error.middleware.js** — 404 handler, Mongoose validation/Cast error handling, generic 500.

---

## 4. Authentication & Role-Based Access Control (RBAC)

### 4.1 User Model

- **Registration:** email, password (min 6 characters), optional role (user or admin).
- **Password storage:** bcrypt hashing (12 rounds) before save; plain-text passwords are never stored.
- **JWT:** Issued on login/register; used in `Authorization: Bearer <token>` for protected routes.

### 4.2 Access Rules

| Resource              | GET (read) | POST / PUT / DELETE |
|-----------------------|------------|----------------------|
| Products              | Public     | Admin only           |
| Categories             | Public     | Admin only           |
| Orders                 | Authenticated user | Authenticated user |
| Auth (register/login)  | —          | Public               |
| Auth (me)              | Authenticated     | —                    |

- **Public:** No token required (e.g. list products, list categories).
- **Authenticated:** Valid JWT required (e.g. create order, get my orders).
- **Admin:** Valid JWT + role `admin` (e.g. create/update/delete products and categories).

---

## 5. Database Schema (MongoDB)

### 5.1 Collections

- **users** — email (unique), password (hashed), role, timestamps.
- **categories** — name, model, memory, color, description, timestamps.
- **products** — name, price, category (ObjectId ref), description, timestamps.
- **orders** — user (ObjectId ref), product (ObjectId ref), quantity, totalPrice, status, timestamps.

### 5.2 Relationships

- One **Category** has many **Products**.
- One **User** has many **Orders**.
- One **Product** can appear in many **Orders**.

---

## 6. API Overview

### 6.1 Auth

- **POST /auth/register** — Body: email, password, optional role. Returns user + JWT.
- **POST /auth/login** — Body: email, password. Returns user + JWT.
- **GET /auth/me** — Headers: Authorization Bearer token. Returns current user.

### 6.2 Products

- **GET /products** — Optional query: category, model, color, memory, minPrice, maxPrice. Returns filtered list with populated category.
- **GET /products/:id** — Returns one product with category.
- **POST /products** — Body: name, price, category, description. Admin only.
- **PUT /products/:id** — Body: same as POST. Admin only.
- **DELETE /products/:id** — Admin only.

### 6.3 Categories

- **GET /categories** — Returns all categories.
- **GET /categories/:id** — Returns one category.
- **POST /categories** — Body: name, optional model, memory, color, description. Admin only.
- **PUT /categories/:id** — Body: same. Admin only.
- **DELETE /categories/:id** — Admin only; blocked if category is in use by products.

### 6.4 Orders

- **POST /orders** — Body: product (id), quantity. Creates order, sets totalPrice. Authenticated.
- **GET /orders** — Returns orders for the current user (product populated). Authenticated.

---

## 7. Frontend (SPA)

### 7.1 Pages (4 minimum)

1. **Home** — Welcome text, link to product list, login/register prompt.
2. **Product List** — Filters (category, model, color, memory, price range), product cards with “Details” and “Buy”, admin form to create products.
3. **Single Product** — One product by ID: name, category, description, price, “Buy” and “Back to list”.
4. **Account / Admin** — For guests: “Sign in” message. For users: profile (email, role), “My orders” list. For admins: same plus “Admin: Categories” (create category form + category list).

### 7.2 Navigation & Routing

- Hash-based routing: `#home`, `#products`, `#product/:id`, `#account`.
- Header: links to Home, Products, Account; Login/Register or user info + Logout.
- Active page highlighted in the nav.

### 7.3 Features

- **Login / Register** — Modal windows; JWT stored in localStorage.
- **Filters** — Category, model, color, memory, min/max price (dropdowns only, no free text).
- **Purchase** — Modal: product info, quantity, total; POST /orders on confirm.
- **Admin** — Create product (on Product List page), create category and list categories (on Account page); delete product/category where allowed.

---

## 8. Security Measures

- **Passwords:** bcrypt hashing; never stored in plain text.
- **JWT:** Used for authenticated and admin routes; secret in environment variable.
- **RBAC:** Admin-only middleware for POST/PUT/DELETE on products and categories.
- **Validation:** Required fields and types validated in controllers; Mongoose schema validation.

---

## 9. Project Structure

```
assignment3/
├── public/
│   ├── index.html    (all 4 pages + modals)
│   ├── style.css
│   └── site.js       (routing, API calls, UI logic)
├── src/
│   ├── controllers/  (auth, category, order, product)
│   ├── middleware/   (auth, error)
│   ├── models/       (user, category, product, order)
│   ├── routes/       (auth, categories, products, orders)
│   ├── index.js      (entry, load env, start server)
│   ├── server.js     (Express app, routes, static, errors)
│   └── seed.js       (sample users, categories, products)
├── .env
├── package.json
└── README.md
```

---

## 10. Conclusion

The Product Manager project delivers:

- **MVC structure** with clear separation of models, controllers, and routes.
- **Two main entities with full CRUD:** Products and Categories (with Products referencing Categories).
- **User system** with email, hashed password, and role (user/admin).
- **JWT-based authentication** and **RBAC** (public read, authenticated orders, admin for create/update/delete).
- **Four-page SPA:** Home, Product List, Single Product, Account/Admin.
- **Filtering** by category, model, color, memory, and price (select-only).
- **Order flow** (purchase) and “My orders” in the account page.
- **Database schema and API** documented in README for GitHub.

The application is suitable for deployment with Node.js and MongoDB and can be extended with more entities or features while keeping the same architecture.
