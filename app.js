const categories = [
  { name: "Nail polish", icon: "💅" }, { name: "Rings", icon: "💍" },
  { name: "Sunglasses", icon: "🕶️" }, { name: "Key chains", icon: "🔑" },
  { name: "Medicines", icon: "🩹" }, { name: "Water bottles", icon: "🧴" },
  { name: "Pens", icon: "🖊️" }
];

const starterProducts = [
  { id: "polish", name: "Sunday Best Nail Polish", category: "Nail polish", price: 450, stock: 18, badge: "Bestseller", description: "A cheerful, chip-resistant colour for little moments of self-care. Smooth, easy application and a glossy finish.", image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=82", rating: 4.8 },
  { id: "ring", name: "The Everyday Gold Ring", category: "Rings", price: 850, stock: 12, badge: "Little favourite", description: "An easy-to-wear, golden everyday ring with a clean, timeless silhouette. Made to stack or shine all on its own.", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=82", rating: 4.9 },
  { id: "shades", name: "Sunny Side Sunglasses", category: "Sunglasses", price: 1250, stock: 9, badge: "Feel-good find", description: "Your sunny-day companion. A playful, lightweight frame that brings a little extra sunshine to every outing.", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=82", rating: 4.7 },
  { id: "keychain", name: "Tiny Joy Key Chain", category: "Key chains", price: 350, stock: 25, badge: "", description: "A happy little reminder to take the good stuff with you. Clip it to your keys, backpack, or favourite tote.", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=82", rating: 4.6 },
  { id: "care", name: "Everyday Care Kit", category: "Medicines", price: 590, stock: 15, badge: "Everyday essential", description: "A handy, travel-friendly first-aid kit for little everyday bumps. Demo product listing only; always consult a healthcare professional.", image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=800&q=82", rating: 4.8 },
  { id: "bottle", name: "Good Day Water Bottle", category: "Water bottles", price: 950, stock: 14, badge: "Bestseller", description: "Keep a little refreshment close. A reusable, easy-carry bottle for class, the commute, and everywhere in between.", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=82", rating: 4.9 },
  { id: "pen", name: "The Bright Idea Pen Set", category: "Pens", price: 280, stock: 30, badge: "", description: "Four smooth-writing pens in colours that make notes a little more fun. Ready for big ideas, lists, and doodles.", image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=82", rating: 4.7 }
];

const readStore = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch (error) { console.error(`Could not read ${key} from browser storage.`, error); return fallback; }
};
const saveStore = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.error(`Could not save ${key} to browser storage.`, error); showToast("Your browser couldn't save this change."); }
};
let products = readStore("imcs_products", starterProducts);
let cart = readStore("imcs_cart", []);
let orders = readStore("imcs_orders", []);
let reviews = readStore("imcs_reviews", {});
let currentUser = readStore("imcs_user", null);
let activeCategory = "All";
let activeCoupon = "";
let currentPage = "home";
let toastTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const money = amount => `Rs. ${Number(amount).toLocaleString("en-PK")}`;
const safe = text => String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const productById = id => products.find(product => product.id === id);
const customerOrders = () => orders.filter(order => currentUser && order.email === currentUser.email);

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function renderCategories() {
  $("#category-grid").innerHTML = categories.map(category => `
    <button class="category-card" data-category="${safe(category.name)}"><span class="category-emoji">${category.icon}</span><span>${safe(category.name)}</span></button>`).join("");
  $("#category-grid").querySelectorAll(".category-card").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    renderFilters();
    showPage("shop");
    renderProducts();
  }));
}

function productCard(product) {
  const ratingList = reviews[product.id] || [];
  const average = ratingList.length ? ratingList.reduce((sum, review) => sum + review.rating, 0) / ratingList.length : product.rating;
  return `<article class="product-card">
    <div class="product-image" data-product="${safe(product.id)}" role="button" tabindex="0" aria-label="View ${safe(product.name)}">
      <img src="${safe(product.image)}" alt="${safe(product.name)}" loading="lazy">
      ${product.badge ? `<span class="product-badge">${safe(product.badge)}</span>` : ""}
      <button class="quick-add" data-add="${safe(product.id)}" aria-label="Add ${safe(product.name)} to bag" ${product.stock <= 0 ? "disabled" : ""}>${product.stock <= 0 ? "–" : "+"}</button>
    </div>
    <div class="product-info"><div><p class="product-category">${safe(product.category)}</p><h3 class="product-name">${safe(product.name)}</h3></div><p class="product-price">${money(product.price)}</p></div>
    <div class="product-rating">★★★★★ <span>${average.toFixed(1)}${ratingList.length ? ` · ${ratingList.length} review${ratingList.length === 1 ? "" : "s"}` : ""}</span></div>
  </article>`;
}

function renderProducts() {
  const query = $("#product-search").value.trim().toLowerCase();
  let filtered = products.filter(product => (activeCategory === "All" || product.category === activeCategory) &&
    `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query));
  const sort = $("#sort-products").value;
  if (sort === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  $("#all-products").innerHTML = filtered.length ? filtered.map(productCard).join("") : `<div class="empty-state"><div class="empty-icon">⌕</div><h3>No little finds just yet</h3><p>Try another search or category.</p></div>`;
  $("#result-count").textContent = `${filtered.length} ${filtered.length === 1 ? "good thing" : "good things"} to discover`;
  $("#featured-products").innerHTML = [...products].slice(0, 4).map(productCard).join("");
  bindProductCards();
}

function bindProductCards() {
  document.querySelectorAll(".product-image[data-product]").forEach(element => {
    const open = event => { if (!event.target.closest("[data-add]")) openProduct(element.dataset.product); };
    element.addEventListener("click", open);
    element.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openProduct(element.dataset.product); } });
  });
  document.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    addToCart(button.dataset.add);
  }));
}

function renderFilters() {
  const names = ["All", ...categories.map(category => category.name)];
  $("#filter-pills").innerHTML = names.map(name => `<button class="filter-pill ${activeCategory === name ? "active" : ""}" data-filter="${safe(name)}">${safe(name)}</button>`).join("");
  $("#filter-pills").querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    renderFilters();
    renderProducts();
  }));
}

function addToCart(id) {
  const product = productById(id);
  if (!product || product.stock < 1) return showToast("This little find is out of stock.");
  const item = cart.find(row => row.id === id);
  if (item && item.quantity >= product.stock) return showToast("That's all the available stock for now.");
  item ? item.quantity++ : cart.push({ id, quantity: 1 });
  saveStore("imcs_cart", cart);
  renderCart();
  showToast(`${product.name} added to your bag ✳`);
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + (productById(item.id)?.price || 0) * item.quantity, 0);
}

function discountAmount() {
  return activeCoupon === "STUDENT10" ? Math.round(cartSubtotal() * 0.1) : 0;
}

function renderCart() {
  cart = cart.filter(item => productById(item.id));
  $("#cart-count").textContent = cart.reduce((total, item) => total + item.quantity, 0);
  $("#drawer-count").textContent = `(${cart.reduce((total, item) => total + item.quantity, 0)})`;
  $("#cart-items").innerHTML = cart.length ? cart.map(item => {
    const product = productById(item.id);
    return `<div class="cart-item"><img src="${safe(product.image)}" alt=""><div><h3>${safe(product.name)}</h3><span class="item-price">${money(product.price)}</span><div class="quantity-controls"><button data-quantity="${safe(product.id)}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-quantity="${safe(product.id)}" data-change="1" aria-label="Increase quantity">+</button></div></div><button class="remove-item" data-remove="${safe(product.id)}" aria-label="Remove ${safe(product.name)}">×</button></div>`;
  }).join("") : `<div class="empty-state"><div class="empty-icon">♡</div><h3>Your bag is taking a little nap</h3><p>Find something lovely to wake it up.</p></div>`;
  $("#cart-summary").innerHTML = cart.length ? `
    <div class="coupon-row"><input id="coupon-input" placeholder="Coupon code" value="${safe(activeCoupon)}" aria-label="Coupon code"><button id="apply-coupon">Apply</button></div>
    ${activeCoupon ? `<p class="coupon-message">STUDENT10 is ready — 10% off your order!</p>` : ""}
    <div class="summary-row"><span>Subtotal</span><span>${money(cartSubtotal())}</span></div>
    ${discountAmount() ? `<div class="summary-row"><span>Little treat (10%)</span><span>− ${money(discountAmount())}</span></div>` : ""}
    <div class="summary-row total"><span>Total</span><span>${money(cartSubtotal() - discountAmount())}</span></div>
    <button class="button button-dark checkout-button" id="checkout-button">Make it yours <span>↗</span></button><p class="cart-note">Demo checkout · No real payments or card details</p>` : "";
  $("#cart-items").querySelectorAll("[data-quantity]").forEach(button => button.addEventListener("click", () => changeQuantity(button.dataset.quantity, Number(button.dataset.change))));
  $("#cart-items").querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
    cart = cart.filter(item => item.id !== button.dataset.remove);
    saveStore("imcs_cart", cart); renderCart();
  }));
  $("#apply-coupon")?.addEventListener("click", () => {
    const value = $("#coupon-input").value.trim().toUpperCase();
    if (value === "STUDENT10") { activeCoupon = value; renderCart(); showToast("Your 10% little treat is applied ✳"); }
    else { activeCoupon = ""; renderCart(); showToast("That coupon didn't work. Try STUDENT10."); }
  });
  $("#checkout-button")?.addEventListener("click", openCheckout);
  saveStore("imcs_cart", cart);
}

function changeQuantity(id, delta) {
  const item = cart.find(row => row.id === id);
  const product = productById(id);
  if (!item || !product) return;
  if (delta > 0 && item.quantity >= product.stock) return showToast("That's all the available stock for now.");
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(row => row.id !== id);
  saveStore("imcs_cart", cart); renderCart();
}

function openCart() {
  $("#overlay").classList.add("open");
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
}
function closeCart() {
  $("#overlay").classList.remove("open");
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
}

function openModal(content, className = "") {
  const modal = $("#modal");
  modal.className = `modal ${className}`.trim();
  modal.innerHTML = content;
  $("#modal-wrap").classList.add("open");
  $("#modal-wrap").setAttribute("aria-hidden", "false");
  modal.querySelector(".modal-close")?.addEventListener("click", closeModal);
  $("#modal-wrap").onclick = event => { if (event.target === $("#modal-wrap")) closeModal(); };
}
function closeModal() {
  $("#modal-wrap").classList.remove("open");
  $("#modal-wrap").setAttribute("aria-hidden", "true");
}

function openProduct(id) {
  const product = productById(id);
  if (!product) return;
  const productReviews = reviews[id] || [];
  const average = productReviews.length ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length : product.rating;
  openModal(`<button class="modal-close" aria-label="Close">×</button><img class="product-modal-image" src="${safe(product.image)}" alt="${safe(product.name)}"><div><p class="product-category">${safe(product.category)}</p><h2>${safe(product.name)}</h2><div class="product-rating">★★★★★ <span>${average.toFixed(1)} · ${productReviews.length} review${productReviews.length === 1 ? "" : "s"}</span></div><p class="detail-price">${money(product.price)}</p><p class="detail-description">${safe(product.description)}</p><p class="detail-stock">${product.stock > 0 ? `${product.stock} little finds available` : "Currently out of stock"}</p><button class="button button-dark" data-detail-add="${safe(product.id)}" ${product.stock < 1 ? "disabled" : ""}>Add to bag <span>↗</span></button><div class="review-list">${productReviews.length ? productReviews.map(review => `<p class="review-item"><b>${safe(review.name)}</b><span>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span><br>${safe(review.comment)}</p>`).join("") : `<p class="review-item">No customer reviews yet. Be the first to share a little love.</p>`}</div><button class="review-button" data-review="${safe(id)}">Write a review</button></div>`, "product-modal");
  $(".modal [data-detail-add]")?.addEventListener("click", () => { addToCart(id); closeModal(); openCart(); });
  $(".modal [data-review]")?.addEventListener("click", () => openReview(id));
}

function openLogin() {
  openModal(`<button class="modal-close" aria-label="Close">×</button><p class="eyebrow">WELCOME TO THE LITTLE THINGS CLUB</p><h2>${currentUser ? "Your account" : "Come on in."}</h2><p class="modal-intro">${currentUser ? `Signed in as ${safe(currentUser.name)} · ${safe(currentUser.email)}` : "Sign in to see your orders, or make a demo account in a moment."}</p>
    ${currentUser ? `<button class="button button-dark" id="account-orders">My orders <span>↗</span></button><button class="review-button" id="sign-out">Sign out</button>` : `<form id="login-form"><div class="form-field"><label for="customer-name">Your name</label><input id="customer-name" name="name" required placeholder="e.g. Ayesha Khan"></div><div class="form-field"><label for="customer-email">Email address</label><input id="customer-email" name="email" type="email" required placeholder="you@example.com"></div><button class="button button-dark">Create / sign in <span>↗</span></button></form><div class="demo-account-hint"><b>Demo customer login</b><br>Name: Demo Customer<br>Email: customer@imcs-demo.test<br>No password is required for this sample account.</div><button class="review-button" id="use-demo-customer">Use demo customer login</button>`}`);
  $("#login-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    currentUser = { name: String(data.get("name")).trim(), email: String(data.get("email")).trim().toLowerCase() };
    saveStore("imcs_user", currentUser);
    renderAccountButton(); closeModal(); showToast(`Welcome, ${currentUser.name.split(" ")[0]} ✳`);
  });
  $("#use-demo-customer")?.addEventListener("click", () => {
    $("#customer-name").value = "Demo Customer";
    $("#customer-email").value = "customer@imcs-demo.test";
    $("#login-form").requestSubmit();
  });
  $("#account-orders")?.addEventListener("click", () => { closeModal(); showPage("orders"); });
  $("#sign-out")?.addEventListener("click", () => { currentUser = null; saveStore("imcs_user", null); renderAccountButton(); closeModal(); showToast("You've signed out."); });
}

function openCheckout() {
  if (!cart.length) return;
  if (!currentUser) { closeCart(); openLogin(); showToast("Sign in first so we can save your order."); return; }
  openModal(`<button class="modal-close" aria-label="Close">×</button><p class="eyebrow">ALMOST YOURS</p><h2>One last little thing.</h2><p class="modal-intro">Confirm your details and choose a demo payment method. No real transaction will be made.</p><form id="checkout-form">
    <div class="form-field"><label for="checkout-name">Name</label><input id="checkout-name" name="name" required value="${safe(currentUser.name)}"></div>
    <div class="form-field"><label for="checkout-email">Email</label><input id="checkout-email" name="email" type="email" required value="${safe(currentUser.email)}"></div>
    <div class="form-field"><label for="checkout-phone">Contact number (demo)</label><input id="checkout-phone" name="phone" required placeholder="03XX-XXXXXXX"></div>
    <div class="form-field"><label for="payment-method">Demo payment option</label><select id="payment-method" name="payment"><option>Cash at the shop</option><option>Demo online payment (no charge)</option></select></div>
    <div class="summary-row total"><span>Order total</span><span>${money(cartSubtotal() - discountAmount())}</span></div>
    <button class="button button-dark">Place my demo order <span>↗</span></button></form><div class="demo-account-hint">This is a student project demo. No card or bank information is requested or processed.</div>`);
  $("#checkout-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    const unavailable = cart.find(item => (productById(item.id)?.stock ?? 0) < item.quantity);
    if (unavailable) return showToast(`${productById(unavailable.id)?.name || "An item"} is no longer available in that quantity.`);
    const order = {
      id: `IMCS-${Date.now().toString().slice(-7)}`,
      name: String(data.get("name")).trim(), email,
      phone: String(data.get("phone")).trim(),
      payment: String(data.get("payment")),
      coupon: activeCoupon,
      items: cart.map(item => ({ id: item.id, name: productById(item.id).name, price: productById(item.id).price, quantity: item.quantity })),
      total: cartSubtotal() - discountAmount(),
      date: new Date().toISOString(), status: "Received"
    };
    cart.forEach(item => { const product = productById(item.id); product.stock -= item.quantity; });
    orders.unshift(order);
    currentUser = { name: order.name, email: order.email };
    saveStore("imcs_products", products); saveStore("imcs_orders", orders); saveStore("imcs_user", currentUser);
    cart = []; activeCoupon = "";
    saveStore("imcs_cart", cart);
    renderProducts(); renderCart(); renderAccountButton(); closeModal(); closeCart();
    openModal(`<button class="modal-close" aria-label="Close">×</button><div class="empty-icon">✳</div><p class="eyebrow">IT'S OFFICIALLY YOURS</p><h2>Good things are on their way.</h2><p class="modal-intro">Your order has been received. This is a demo confirmation — no payment has been processed.</p><div class="demo-account-hint"><b>Order ${safe(order.id)}</b><br>${order.items.map(item => `${safe(item.name)} × ${item.quantity}`).join("<br>")}<br><br>Total: ${money(order.total)} · ${safe(order.payment)}</div><button class="button button-dark" id="confirmation-orders">View my orders <span>↗</span></button>`);
    $("#confirmation-orders").addEventListener("click", () => { closeModal(); showPage("orders"); });
  });
}

function openReview(id) {
  if (!currentUser) { closeModal(); openLogin(); showToast("Sign in to leave a review."); return; }
  openModal(`<button class="modal-close" aria-label="Close">×</button><p class="eyebrow">PASS ON A LITTLE LOVE</p><h2>How was your find?</h2><p class="modal-intro">Your feedback helps other shoppers find their favourite little things.</p><form id="review-form"><div class="form-field"><label for="review-rating">Your rating</label><select id="review-rating" name="rating" required><option value="5">★★★★★ — Loved it</option><option value="4">★★★★☆ — Really liked it</option><option value="3">★★★☆☆ — It's nice</option><option value="2">★★☆☆☆ — Not for me</option><option value="1">★☆☆☆☆ — Disappointed</option></select></div><div class="form-field"><label for="review-comment">A little note</label><textarea id="review-comment" name="comment" maxlength="240" required placeholder="What did you think? (240 characters max)"></textarea></div><button class="button button-dark">Share my review <span>↗</span></button></form>`);
  $("#review-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const productReviews = reviews[id] || [];
    productReviews.unshift({ name: currentUser.name, rating: Number(data.get("rating")), comment: String(data.get("comment")).trim(), date: new Date().toISOString() });
    reviews[id] = productReviews;
    saveStore("imcs_reviews", reviews); closeModal(); renderProducts(); openProduct(id); showToast("Thanks for sharing a little love ✳");
  });
}

function renderOrders() {
  const mine = customerOrders();
  $("#orders-page").innerHTML = `<p class="eyebrow">YOUR LITTLE THINGS, ALL IN ONE PLACE</p><h1 class="page-title">My orders.</h1><p class="page-intro">${currentUser ? `A little look at what you've ordered, ${safe(currentUser.name.split(" ")[0])}.` : "Sign in to see the orders connected to your account."}</p>
    ${!currentUser ? `<div class="empty-state"><div class="empty-icon">♡</div><h3>Your orders live here</h3><p>Sign in with your demo account to see your order history.</p><button class="button button-dark" id="orders-login">Sign in <span>↗</span></button></div>` : mine.length ? mine.map(order => `<article class="order-card"><div class="order-top"><div><div class="order-number">${safe(order.id)}</div><div class="order-date">${new Date(order.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })} · ${safe(order.payment)}</div></div><span class="status-badge">${safe(order.status)}</span></div>${order.items.map(item => `<div class="order-row"><span>${safe(item.name)} × ${item.quantity}</span><span>${money(item.price * item.quantity)}</span></div>`).join("")}<div class="order-row" style="font-weight:700;border-top:1px solid #e8e9e2;margin-top:9px;padding-top:12px"><span>Order total</span><span>${money(order.total)}</span></div></article>`).join("") : `<div class="empty-state"><div class="empty-icon">♡</div><h3>No little finds ordered yet</h3><p>When you place a demo order, it'll be waiting right here.</p><button class="button button-dark" data-page="shop">Find your thing <span>↗</span></button></div>`}`;
  $("#orders-login")?.addEventListener("click", openLogin);
}

function renderAdmin() {
  $("#admin-page").innerHTML = `<p class="eyebrow">THE SHOPKEEPER'S CORNER</p><h1 class="page-title">Behind the happy place.</h1><p class="page-intro">Manage demo stock and keep an eye on incoming orders. Changes stay in this browser.</p><p class="demo-warning">Demo admin area — no real inventory or customer database is connected.</p>
    <div class="admin-toolbar"><h2>Products <span class="product-category">(${products.length})</span></h2><button class="button button-dark" id="add-product">Add a product <span>+</span></button></div>
    <div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sample stock</th><th>Action</th></tr></thead><tbody>${products.map(product => `<tr><td>${safe(product.name)}</td><td>${safe(product.category)}</td><td>${money(product.price)}</td><td><input type="number" min="0" value="${product.stock}" data-stock="${safe(product.id)}" aria-label="Stock for ${safe(product.name)}"></td><td><button data-edit="${safe(product.id)}">Edit</button></td></tr>`).join("")}</tbody></table></div>
    <div class="admin-toolbar" style="margin-top:35px"><h2>Incoming orders <span class="product-category">(${orders.length})</span></h2></div>
    ${orders.length ? `<div style="overflow-x:auto"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>${orders.map(order => `<tr><td>${safe(order.id)}</td><td>${safe(order.name)}<br>${safe(order.email)}</td><td>${order.items.map(item => `${safe(item.name)} ×${item.quantity}`).join("<br>")}</td><td>${money(order.total)}</td><td><select data-status="${safe(order.id)}" aria-label="Status for ${safe(order.id)}">${["Received", "Preparing", "Ready for Pickup", "Completed"].map(status => `<option ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><p>No orders just yet — they'll show up here when customers check out.</p></div>`}`;
  $("#admin-page").querySelectorAll("[data-stock]").forEach(input => input.addEventListener("change", () => {
    const product = productById(input.dataset.stock);
    product.stock = Math.max(0, Math.floor(Number(input.value) || 0));
    saveStore("imcs_products", products); renderProducts(); showToast("Sample stock updated.");
  }));
  $("#admin-page").querySelectorAll("[data-status]").forEach(select => select.addEventListener("change", () => {
    const order = orders.find(row => row.id === select.dataset.status);
    if (order) { order.status = select.value; saveStore("imcs_orders", orders); showToast("Order status updated."); }
  }));
  $("#admin-page").querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openEditProduct(button.dataset.edit)));
  $("#add-product").addEventListener("click", () => openEditProduct(null));
}

function openEditProduct(id) {
  const product = id ? productById(id) : { id: "", name: "", category: categories[0].name, price: 0, stock: 0, badge: "", description: "", image: "", rating: 5 };
  openModal(`<button class="modal-close" aria-label="Close">×</button><p class="eyebrow">SHOPKEEPER'S CORNER</p><h2>${id ? "A little edit." : "A new good thing."}</h2><form id="product-form">
    <div class="form-field"><label for="admin-name">Name</label><input id="admin-name" name="name" required value="${safe(product.name)}"></div>
    <div class="form-row"><div class="form-field"><label for="admin-category">Category</label><select id="admin-category" name="category">${categories.map(category => `<option ${category.name === product.category ? "selected" : ""}>${safe(category.name)}</option>`).join("")}</select></div><div class="form-field"><label for="admin-price">Price (Rs.)</label><input id="admin-price" name="price" type="number" min="1" required value="${product.price}"></div></div>
    <div class="form-row"><div class="form-field"><label for="admin-stock">Sample stock</label><input id="admin-stock" name="stock" type="number" min="0" required value="${product.stock}"></div><div class="form-field"><label for="admin-badge">Badge (optional)</label><input id="admin-badge" name="badge" value="${safe(product.badge)}"></div></div>
    <div class="form-field"><label for="admin-image">Image URL</label><input id="admin-image" name="image" type="url" required value="${safe(product.image)}"></div>
    <div class="form-field"><label for="admin-description">Description</label><textarea id="admin-description" name="description" required>${safe(product.description)}</textarea></div>
    <button class="button button-dark">Save product <span>↗</span></button></form>`);
  $("#product-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const updated = { ...product, id: id || `item-${Date.now()}`, name: String(data.get("name")).trim(), category: String(data.get("category")), price: Math.max(1, Number(data.get("price"))), stock: Math.max(0, Number(data.get("stock"))), badge: String(data.get("badge")).trim(), image: String(data.get("image")).trim(), description: String(data.get("description")).trim() };
    if (id) products = products.map(row => row.id === id ? updated : row);
    else products.push(updated);
    saveStore("imcs_products", products); closeModal(); renderAdmin(); renderProducts(); showToast("Product details saved.");
  });
}

function renderAccountButton() {
  $("#account-button").innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg><span class="account-label">${currentUser ? safe(currentUser.name.split(" ")[0]) : "Sign in"}</span>`;
}

function showPage(page) {
  currentPage = page;
  const homeIds = ["#home-page", ".category-strip", ".featured-section", ".promo-band", "#shop-page", ".info-strip"];
  homeIds.forEach(selector => document.querySelector(selector).classList.toggle("hidden", page !== "home" && page !== "shop"));
  $("#orders-page").classList.toggle("hidden", page !== "orders");
  $("#admin-page").classList.toggle("hidden", page !== "admin");
  document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.page === page || (page === "admin" && button.dataset.page === "home")));
  if (page === "orders") renderOrders();
  if (page === "admin") renderAdmin();
  $("#main-nav")?.classList.remove("mobile-open");
  if (page === "shop") $("#shop-page").scrollIntoView({ behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", event => {
  event.preventDefault();
  showPage(button.dataset.page);
}));
$("#cart-button").addEventListener("click", openCart);
$("#account-button").addEventListener("click", openLogin);
$("#overlay").addEventListener("click", closeCart);
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeCart));
$("#menu-button").addEventListener("click", () => $(".main-nav").classList.toggle("mobile-open"));
$("#product-search").addEventListener("input", renderProducts);
$("#sort-products").addEventListener("change", renderProducts);
$("#copy-coupon").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText("STUDENT10"); showToast("STUDENT10 copied — a little treat for you ✳"); }
  catch { activeCoupon = "STUDENT10"; openCart(); showToast("Use STUDENT10 at checkout for 10% off."); }
});
$("#admin-link").addEventListener("click", () => {
  openModal(`<button class="modal-close" aria-label="Close">×</button><p class="eyebrow">SHOPKEEPER'S CORNER</p><h2>Admin access.</h2><p class="modal-intro">This student demo uses a simple, fictional login. It does not provide production-grade admin security.</p><form id="admin-login"><div class="form-field"><label for="admin-username">Username</label><input id="admin-username" autocomplete="username" required placeholder="Admin username"></div><div class="form-field"><label for="admin-code">Password</label><input id="admin-code" type="password" autocomplete="current-password" required placeholder="Admin password"></div><button class="button button-dark">Open admin area <span>↗</span></button></form><div class="demo-account-hint">Demo admin login<br>Username: <b>admin</b><br>Password: <b>admin123</b></div>`);
  $("#admin-login").addEventListener("submit", event => {
    event.preventDefault();
    if ($("#admin-username").value.trim() !== "admin" || $("#admin-code").value !== "admin123") return showToast("Those demo admin details aren't quite right.");
    closeModal(); showPage("admin");
  });
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeModal(); closeCart(); }
});

renderCategories();
renderFilters();
renderProducts();
renderCart();
renderAccountButton();
