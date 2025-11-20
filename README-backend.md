# Backend (Node/Express + MongoDB)

This project includes a simple backend scaffold using Express and MongoDB (Mongoose).

Files added:
- `server.js` — main server entry
- `models/` — Mongoose models: `product.js`, `order.js`, `contact.js`
- `routes/` — API routes: `products.js`, `orders.js`, `contact.js`, `admin.js`
- `package.json`, `.env.example`, `.gitignore`

Setup
1. Copy `.env.example` to `.env` and fill `MONGO_URI` with your Atlas connection string. DO NOT commit `.env`.

   Example MONGO_URI format (Atlas):
   mongodb+srv://<user>:<password>@cluster0.mongodb.net/coffee-shop?retryWrites=true&w=majority

   Your connection string should replace `<password>` with the password for the user. For example:
   MONGO_URI="mongodb+srv://ashiqurrahmantusher007_db_user:<YOUR_PASSWORD>@test.aajg8xr.mongodb.net/coffee-shop?retryWrites=true&w=majority"

2. Install dependencies:

```powershell
cd "c:\Users\Ashiqur Rahman\Desktop\DSD TEST\coffee-shop"
npm install
```

3. Start server:

```powershell
npm run dev   # requires nodemon (already in devDependencies)
# or
npm start
```

API Endpoints (examples)
- GET `/api/products` — list products
- POST `/api/products` — create product (optional admin header `x-admin-key` if `ADMIN_KEY` is set)
- GET `/api/orders` — list orders
- POST `/api/orders` — create order
- POST `/api/contact` — submit a contact message
- POST `/api/admin/login` — admin login using `ADMIN_USER` / `ADMIN_PASS` from `.env`

Security notes
- Never commit real credentials. Use `.env` and keep it private.
- This scaffold uses simple admin checks for demo purposes — for production use JWT or other secure auth flows.
