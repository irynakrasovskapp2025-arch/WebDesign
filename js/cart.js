const cartToggle = document.querySelector("#cart-toggle");
const cartDialog = document.querySelector("#cart-dialog");
const cartClose = document.querySelector(".cart-close");
const cartItemsList = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartTotal = document.querySelector("#cart-total");
const cartCount = document.querySelector(".cart-count");
const productCards = [...document.querySelectorAll(".product-card")];
const cart = new Map();
const productDialog = document.querySelector("#product-dialog");
const productDialogClose = document.querySelector(".product-dialog-close");
const productDialogAdd = document.querySelector("#product-dialog-add");
let activeProductId = null;
let productDetailTrigger = null;

const products = productCards.map((card, index) => {
  const priceText = card.querySelector(".product-price").textContent;

  return {
    id: String(index),
    name: card.querySelector(".product-name").textContent.trim(),
    description: card.querySelector(".product-desc").textContent.trim(),
    price: Number(priceText.replace(/[^\d]/g, "")),
    image: card.querySelector(".product-img").getAttribute("src"),
    imageAlt: card.querySelector(".product-img").alt,
    wick: ["Вовняний", "Дерев’яний", "Дерев’яний", "Вовняний", "Дерев’яний", "Дерев’яний"][index],
    wax: index === 1 || index === 3 ? "Кокосовий" : "Соєвий",
    burnTime: index === 4 ? "До 20 годин кожна свічка" : "Приблизно 35 годин"
  };
});

function addProductToCart(productId) {
  const product = products[productId];
  if (!product) return;

  const entry = cart.get(product.id);
  if (entry) {
    entry.quantity += 1;
  } else {
    cart.set(product.id, { product, quantity: 1 });
  }

  updateCart();
}

function openProductDetails(productId, trigger) {
  const product = products[productId];
  if (!product) return;

  activeProductId = productId;
  productDetailTrigger = trigger;
  productDialog.querySelector("#product-dialog-title").textContent = product.name;
  productDialog.querySelector("#product-dialog-image").src = product.image;
  productDialog.querySelector("#product-dialog-image").alt = product.imageAlt;
  productDialog.querySelector("#product-dialog-description").textContent = product.description;
  productDialog.querySelector("#product-dialog-wick").textContent = product.wick;
  productDialog.querySelector("#product-dialog-wax").textContent = product.wax;
  productDialog.querySelector("#product-dialog-burn-time").textContent = product.burnTime;
  productDialog.querySelector("#product-dialog-price").textContent = formatPrice(product.price);
  productDialog.returnValue = trigger;
  productDialog.showModal();
}

function formatPrice(price) {
  return `${new Intl.NumberFormat("uk-UA").format(price)} грн`;
}

function updateCart() {
  const entries = [...cart.values()];
  const itemCount = entries.reduce((total, item) => total + item.quantity, 0);
  const total = entries.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  cartCount.textContent = `Кошик (${itemCount})`;
  cartEmpty.hidden = entries.length > 0;
  cartTotal.textContent = formatPrice(total);
  cartItemsList.replaceChildren();

  for (const { product, quantity } of entries) {
    const item = document.createElement("li");
    item.className = "cart-item";

    const image = document.createElement("img");
    image.className = "cart-item-image";
    image.src = product.image;
    image.alt = product.imageAlt;
    image.loading = "lazy";
    image.decoding = "async";

    const details = document.createElement("div");
    details.className = "cart-item-details";

    const name = document.createElement("h3");
    name.className = "cart-item-name";
    name.textContent = product.name;

    const description = document.createElement("p");
    description.className = "cart-item-description";
    description.textContent = product.description;

    const itemPrice = document.createElement("p");
    itemPrice.className = "cart-item-price";
    itemPrice.textContent = formatPrice(product.price * quantity);

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";

    const decreaseButton = document.createElement("button");
    decreaseButton.className = "cart-quantity-button";
    decreaseButton.type = "button";
    decreaseButton.dataset.action = "decrease";
    decreaseButton.dataset.productId = product.id;
    decreaseButton.setAttribute("aria-label", `Зменшити кількість: ${product.name}`);
    decreaseButton.textContent = "−";

    const quantityLabel = document.createElement("span");
    quantityLabel.className = "cart-item-quantity";
    quantityLabel.textContent = String(quantity);
    quantityLabel.setAttribute("aria-label", `Кількість: ${quantity}`);

    const increaseButton = document.createElement("button");
    increaseButton.className = "cart-quantity-button";
    increaseButton.type = "button";
    increaseButton.dataset.action = "increase";
    increaseButton.dataset.productId = product.id;
    increaseButton.setAttribute("aria-label", `Збільшити кількість: ${product.name}`);
    increaseButton.textContent = "+";

    const removeButton = document.createElement("button");
    removeButton.className = "cart-remove";
    removeButton.type = "button";
    removeButton.dataset.action = "remove";
    removeButton.dataset.productId = product.id;
    removeButton.textContent = "Видалити";

    controls.append(decreaseButton, quantityLabel, increaseButton, removeButton);
    details.append(name, description, itemPrice, controls);
    item.append(image, details);
    cartItemsList.append(item);
  }
}

cartToggle.addEventListener("click", () => {
  updateCart();
  cartDialog.showModal();
  cartToggle.setAttribute("aria-expanded", "true");
});

cartClose.addEventListener("click", () => cartDialog.close());

cartDialog.addEventListener("close", () => {
  cartToggle.setAttribute("aria-expanded", "false");
  cartToggle.focus();
});

cartDialog.addEventListener("click", (event) => {
  if (event.target === cartDialog) {
    cartDialog.close();
  }
});

cartItemsList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const entry = cart.get(button.dataset.productId);
  if (!entry) return;

  if (button.dataset.action === "increase") {
    entry.quantity += 1;
  } else if (button.dataset.action === "decrease") {
    entry.quantity -= 1;
    if (entry.quantity === 0) cart.delete(button.dataset.productId);
  } else if (button.dataset.action === "remove") {
    cart.delete(button.dataset.productId);
  }

  updateCart();
});

for (const [index, card] of productCards.entries()) {
  for (const trigger of card.querySelectorAll(".product-details-trigger, .product-image-trigger")) {
    trigger.addEventListener("click", (event) => {
      openProductDetails(String(index), event.currentTarget);
    });
  }

  card.querySelector(".product-btn button").addEventListener("click", () => {
    addProductToCart(String(index));
  });
}

productDialogClose.addEventListener("click", () => productDialog.close());

productDialog.addEventListener("close", () => {
  if (productDetailTrigger?.isConnected) productDetailTrigger.focus();
  activeProductId = null;
  productDetailTrigger = null;
});

productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) productDialog.close();
});

productDialogAdd.addEventListener("click", () => {
  if (activeProductId !== null) addProductToCart(activeProductId);
  productDialog.close();
});

document.addEventListener("candle:add-to-cart", (event) => {
  addProductToCart(event.detail.productId);
});

updateCart();
