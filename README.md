# IMCS EDUMART

A student-project online shop demo built with plain HTML, CSS, and JavaScript. No package installation or build step is needed.

## Run the project

1. Open PowerShell in this folder.
2. Start a local web server:

   ```powershell
   python -m http.server 8000
   ```

3. Open <http://localhost:8000> in your browser.

## Demo features

- Browse seven sample product categories; search, filter, and sort the catalogue.
- Add items to a cart, change quantities, and apply `STUDENT10` for 10% off.
- Sign in as the demo customer (`customer@imcs-demo.test`, name `Demo Customer`) using the **Use demo customer login** button, place an order, and see its status in **My orders**. Customer demo accounts do not use a password.
- Open **Shopkeeper login** in the footer and use username `admin` and password `admin123` to edit products, adjust sample stock, and update order statuses.
- Add product ratings and comments from a product detail view.

Products, cart contents, demo account, orders, and reviews are saved in this browser's local storage. Use fictional details only. Checkout records the selected demo payment option; it does not process payments or request card or bank details. Admin access is intentionally a simple assignment demo, not production authentication.

Product photos are loaded from Unsplash, so an internet connection is needed to display them.
