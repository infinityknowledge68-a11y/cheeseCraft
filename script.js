document.addEventListener('DOMContentLoaded', () => {

    // --- Global Config ---
    const ORDER_WEBHOOK_URL = 'http://localhost:5678/webhook/2419a1aa-c14a-4a83-bcb9-c3343663ecd2';
    const SIGNIN_WEBHOOK_URL = 'http://localhost:5678/webhook/d8ddda43-c97c-4820-9a98-9759a90e6a9e';
    const CHAT_WEBHOOK_URL = 'http://localhost:5678/webhook/58ce88d3-38d6-42bd-b090-1e5e7ad675f4';


    // --- Cart Logic ---
    let cart = [];
    const cartBtn = document.getElementById('cartBtn');
    const cartCountSpan = document.getElementById('cartCount');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalValue = document.getElementById('cartTotalValue');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Open/Close Cart
    const toggleCart = () => {
        cartSidebar.classList.toggle('open');
    }

    if (cartBtn) cartBtn.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);

    // Add to Cart Function
    const addToCart = (name, price) => {
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ name, price: parseInt(price), qty: 1 });
        }
        updateCartUI();
        toggleCart(); // Open cart to show item added
    };

    // Remove from Cart Function
    window.removeFromCart = (name) => {
        cart = cart.filter(item => item.name !== name);
        updateCartUI();
    };

    const updateCartUI = () => {
        // Update Badge
        const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
        cartCountSpan.innerText = `(${totalQty})`;

        // Update Items List
        cartItemsContainer.innerHTML = '';
        let totalAmount = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="padding:1rem; opacity:0.7;">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.qty;
                totalAmount += itemTotal;

                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item');
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.qty} x PKR ${item.price}</p>
                    </div>
                    <div class="cart-item-controls">
                        <span style="font-weight:bold;">PKR ${itemTotal}</span>
                        <button class="btn-remove" onclick="removeFromCart('${item.name}')">&times;</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }

        cartTotalValue.innerText = `PKR ${totalAmount}`;
    };

    // Hook up "Order Now" buttons to Add to Cart
    document.querySelectorAll('.btn-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemName = e.target.getAttribute('data-item');
            const itemPrice = e.target.getAttribute('data-price');
            addToCart(itemName, itemPrice);
        });
    });

    // --- Order Modal Logic (Updated for Cart) ---
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        const closeBtn = orderModal.querySelector('.close-modal');
        const orderForm = document.getElementById('orderForm');
        const orderItemInput = document.getElementById('orderItem');
        const orderQtyInput = document.getElementById('orderQty');

        // Checkout Button Click
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (cart.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }

                // Prepare Order Summary
                const orderSummary = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
                const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

                orderItemInput.value = `Cart: ${orderSummary} (Total: ${cartTotalValue.innerText})`;
                orderQtyInput.value = totalQty; // Aggregate quantity for simple field

                // Close sidebar and open modal
                cartSidebar.classList.remove('open');
                orderModal.classList.add('show');
                orderModal.style.display = 'flex';
            });
        }

        // Close Modal
        const closeModal = () => {
            orderModal.classList.remove('show');
            setTimeout(() => { orderModal.style.display = 'none'; }, 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        window.onclick = (event) => {
            if (event.target == orderModal) {
                closeModal();
            }
        };

        // Submit Order
        if (orderForm) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = orderForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Processing...';
                submitBtn.disabled = true;

                const formData = {
                    itemName: document.getElementById('orderItem').value,
                    customerName: document.getElementById('orderName').value,
                    phone: document.getElementById('orderPhone').value,
                    email: document.getElementById('orderEmail').value,
                    address: document.getElementById('orderAddress').value,
                    quantity: document.getElementById('orderQty').value,
                    cartDetails: cart // Sending full cart object too just in case
                };

                try {
                    const response = await fetch(ORDER_WEBHOOK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        alert('Order placed successfully! We will contact you shortly.');
                        orderForm.reset();
                        closeModal();
                        // Clear Cart
                        cart = [];
                        updateCartUI();
                    } else {
                        throw new Error('Network response was not ok.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('There was an error placing your order. Please try again.');
                } finally {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    // --- Sign In Logic ---
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }

            const submitBtn = signinForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Signing In...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(SIGNIN_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    alert('Login successful! Redirecting...');
                    window.location.href = 'index.html';
                } else {
                    alert('Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during sign in.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Auth Toggle Logic ---
    const showSigninBtn = document.getElementById('showSignin');
    const showSignupBtn = document.getElementById('showSignup');
    const signinFormEl = document.getElementById('signinForm');
    const signupFormEl = document.getElementById('signupForm');
    const formTitle = document.getElementById('formTitle');

    if (showSigninBtn && showSignupBtn && signinFormEl && signupFormEl) {
        showSigninBtn.addEventListener('click', () => {
            showSigninBtn.classList.add('active');
            showSignupBtn.classList.remove('active');
            signinFormEl.classList.add('active');
            signupFormEl.classList.remove('active');
            if (formTitle) formTitle.innerText = 'Sign In';
        });

        showSignupBtn.addEventListener('click', () => {
            showSignupBtn.classList.add('active');
            showSigninBtn.classList.remove('active');
            signupFormEl.classList.add('active');
            signinFormEl.classList.remove('active');
            if (formTitle) formTitle.innerText = 'Create Account';
        });
    }

    // --- Sign Up Logic ---
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Creating Account...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(SIGNUP_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: document.getElementById('new-name').value,
                        email: document.getElementById('new-email').value,
                        password: document.getElementById('new-password').value
                    })
                });

                if (response.ok) {
                    alert('Account created successfully! Please Sign In.');
                    // Switch to sign in view
                    if (showSigninBtn) showSigninBtn.click();
                    signupForm.reset();
                } else {
                    alert('Failed to create account. Please try again.');
                }
            } catch (error) {
                console.error('Signup Error:', error);
                alert('An error occurred during sign up.');
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }

        });
    }

    // --- Social Login Logic ---
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Social Login feature is coming soon!');
        });
    });

    // --- Chatbot Logic ---
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatModal = document.getElementById('chatModal');
    const closeChat = document.getElementById('closeChat');
    const chatSend = document.getElementById('chatSend');
    const chatInput = document.getElementById('chatInput');
    const chatBody = document.getElementById('chatBody');

    if (chatbotBtn && chatModal) {
        chatbotBtn.addEventListener('click', () => {
            const isActive = chatModal.classList.contains('active');
            if (isActive) {
                chatModal.classList.remove('active');
                setTimeout(() => chatModal.style.display = 'none', 300);
            } else {
                chatModal.style.display = 'flex';
                setTimeout(() => chatModal.classList.add('active'), 10);
            }
        });

        if (closeChat) {
            closeChat.addEventListener('click', () => {
                chatModal.classList.remove('active');
                setTimeout(() => chatModal.style.display = 'none', 300);
            });
        }

        const sendMessage = async () => {
            const txt = chatInput.value.trim();
            if (txt) {
                // Add user message
                const userMsg = document.createElement('div');
                userMsg.style.textAlign = 'right';
                userMsg.style.marginBottom = '10px';
                userMsg.innerHTML = `<span style="background:var(--primary-color); padding:5px 10px; border-radius:10px; display:inline-block;">${txt}</span>`;
                chatBody.appendChild(userMsg);

                chatInput.value = '';
                chatBody.scrollTop = chatBody.scrollHeight;

                // Send to Webhook
                try {
                    const response = await fetch(CHAT_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: txt })
                    });

                    const data = await response.json();
                    const replyText = data.output || data.reply || data.message || JSON.stringify(data);

                    const botMsg = document.createElement('div');
                    botMsg.style.textAlign = 'left';
                    botMsg.style.marginBottom = '10px';
                    botMsg.innerHTML = `<span style="background:#ddd; padding:5px 10px; border-radius:10px; display:inline-block;">${replyText}</span>`;
                    chatBody.appendChild(botMsg);
                    chatBody.scrollTop = chatBody.scrollHeight;

                } catch (err) {
                    console.error('Chat Error', err);
                    const botMsg = document.createElement('div');
                    botMsg.style.textAlign = 'left';
                    botMsg.style.marginBottom = '10px';
                    botMsg.innerHTML = `<span style="background:#ffcccc; padding:5px 10px; border-radius:10px; display:inline-block;">Error: Could not connect to bot.</span>`;
                    chatBody.appendChild(botMsg);
                }
            }
        };

        if (chatSend) {
            chatSend.addEventListener('click', sendMessage);
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
    }

});
