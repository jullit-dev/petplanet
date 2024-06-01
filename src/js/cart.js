import { fetchCartItems, submitOrder } from "./api";
import { renderCartItems, createOrderMessage } from "./dom";

const cartButton = document.querySelector('.store__cart-button');
const cartCount = cartButton.querySelector('.store__cart-cnt');
const modalOverlay = document.querySelector('.modal-overlay');
const cartItemsList = document.querySelector('.modal__cart-items');
const modalCloseButton = document.querySelector('.modal-overlay__close-button');
const cartTotalPriceElement = document.querySelector('.modal__cart-price');
const cartForm = document.querySelector('.modal__cart-form');
const buttonOrder = document.querySelector('.modal__cart-button');

const calculateTotalPrice = (cartItems, products) => cartItems.reduce((acc, item) => {
  const product = products.find(prod => prod.id === item.id);
  return acc + product.price * item.count;
}, 0);

// вывод количества товаров на кнопке корзина
const updateCartCount = () => {
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const cartItemsCount = (cartItems) => cartItems.reduce((acc, item) => {
    return acc + item.count;
  }, 0);

  cartCount.textContent = cartItemsCount(cartItems);
};

// добавляет в корзину
export const addToCart = (productId) => {
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

  const existingItem = cartItems.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.count += 1;
  } else {
    cartItems.push({id: productId, count: 1});
  }

  localStorage.setItem('cartItems', JSON.stringify(cartItems));
  updateCartCount();
};

const updateCartItem = (productId, change) => {
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const itemIndex = cartItems.findIndex(item => item.id === productId);

  if (itemIndex !== -1) {
    cartItems[itemIndex].count += change;

    if (cartItems[itemIndex].count <= 0) {
      cartItems.splice(itemIndex, 1);
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    const products = JSON.parse(localStorage.getItem('cartProductDetails') || '[]');
    updateCartCount();
    renderCartItems(cartItemsList, cartItems, products);

    const totalPrice = calculateTotalPrice(cartItems, products);
    cartTotalPriceElement.innerHTML = `${totalPrice}&nbsp;₽`;
  }
}

cartItemsList.addEventListener('click', ({ target }) => {
  if (target.classList.contains('modal__plus')) {
    const productId = target.dataset.id;
    const product = updateCartItem(productId, 1)
  }

  if (target.classList.contains('modal__minus')) {
    const productId = target.dataset.id;
    updateCartItem(productId, -1)
  }

});

// открытие модального окна с корзиной
cartButton.addEventListener('click', async () => {
  modalOverlay.style.display = 'flex';

  if (buttonOrder.disabled) {
    buttonOrder.removeAttribute('disabled');
  };
  
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const ids = cartItems.map(item => item.id);

  if (!ids.length) {
    cartItemsList.textContent = "";
    const listItem = document.createElement('li');
    listItem.textContent = 'Корзина пуста';
    cartItemsList.append(listItem);
    buttonOrder.disabled = 'disabled';
    return;
  }

  const products = await fetchCartItems(ids);
  localStorage.setItem('cartProductDetails', JSON.stringify(products)); 
  renderCartItems(cartItemsList, cartItems, products);

  const totalPrice = calculateTotalPrice(cartItems, products);
  cartTotalPriceElement.innerHTML = `${totalPrice}&nbsp;₽`;
});

// закрытие модального окна с корзиной
modalOverlay.addEventListener('click', ({target}) => {
  if (target === modalOverlay || target.closest('.modal-overlay__close-button')) {
    modalOverlay.style.display = 'none';
  };
});

cartForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const storeId = cartForm.store.value;
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

  const products = cartItems.map(({ id, count }) => ({
    id,
    quantity: count,
  }));

  const {orderId} = await submitOrder(storeId, products);

  localStorage.removeItem('cartItems');
  localStorage.removeItem('cartProductDetails');

  document.body.append(createOrderMessage(orderId));

  modalOverlay.style.display = 'none';
  updateCartCount();
});

updateCartCount();