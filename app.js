(function () {
    "use strict";

    var STORAGE_KEYS = {
        menu: "cv_menu_items",
        orders: "cv_orders",
        holdOrders: "cv_hold_orders",
        regularCustomers: "cv_regular_customers",
        expenses: "cv_expenses",
        settings: "cv_settings",
        lastBill: "cv_last_bill_text",
        dailyCosts: "cv_daily_costs",
        monthlyFixed: "cv_monthly_fixed"
    };

    var BUSINESS_NAME = "Cafe Vibes";

    var DEFAULT_MENU_ITEMS = [
        { id: "coffee", name: "Coffee", price: 40, cost: 14 },
        { id: "cappuccino", name: "Cappuccino", price: 90, cost: 31.5 },
        { id: "pizza", name: "Veg Pizza", price: 180, cost: 63 },
        { id: "burger", name: "Cheese Burger", price: 140, cost: 49 },
        { id: "sandwich", name: "Sandwich", price: 110, cost: 38.5 }
    ];

    var HARDCODED_WHATSAPP_TEMPLATE = {
        en: {
            table: [
                "Hello {{customer_name}},",
                "",
                "Thank you for spending your memorable time in *Cafe Vibes* Here's your digital receipt.",
                "",
                "*Order Details  {{table}}*",
                "{{bill_items}}",
                "",
                "*Total Amount:* {{order_total}}",
                "*Order ID:* {{order_id}}",
                "*Time:* {{order_time}}",
                "",
                "Have a wonderful day. Please visit again."
            ].join("\n"),
            takeaway: [
                "Hello {{customer_name}},",
                "",
                "Thank you for ordering in our *Cafe Vibes*.",
                "Here's your digital receipt.",
                "",
                "*Order Details  {{table}}*",
                "{{bill_items}}",
                "",
                "*Total Amount:* {{order_total}}",
                "*Order ID:* {{order_id}}",
                "*Time:* {{order_time}}",
                "",
                "Have a wonderful day. Please visit again."
            ].join("\n")
        },
        mr: {
            table: [
                "नमस्कार {{customer_name}},",
                "",
                "*Cafe Vibes* मध्ये आपला सुंदर वेळ घालवल्याबद्दल धन्यवाद. ही आपली डिजिटल पावती.",
                "",
                "*ऑर्डर तपशील  {{table}}*",
                "{{bill_items}}",
                "",
                "*एकूण रक्कम:* {{order_total}}",
                "*ऑर्डर आयडी:* {{order_id}}",
                "*वेळ:* {{order_time}}",
                "",
                "आपला दिवस आनंददायी जावो. कृपया पुन्हा भेट द्या."
            ].join("\n"),
            takeaway: [
                "नमस्कार {{customer_name}},",
                "",
                "आपण *Cafe Vibes* मधे ऑर्डर दिल्याबद्दल धन्यवाद.",
                "ही आपली डिजिटल पावती.",
                "",
                "*ऑर्डर तपशील  {{table}}*",
                "{{bill_items}}",
                "",
                "*एकूण रक्कम:* {{order_total}}",
                "*ऑर्डर आयडी:* {{order_id}}",
                "*वेळ:* {{order_time}}",
                "",
                "आपला दिवस आनंददायी जावो. कृपया पुन्हा भेट द्या."
            ].join("\n")
        }
    };

    function getHardcodedWhatsAppTemplate(language, table) {
        var selectedLanguage = language === "mr" ? "mr" : "en";
        var tableValue = String(table || "").toLowerCase();
        var mode = (tableValue === "takeaway" || tableValue === "delivery") ? "takeaway" : "table";
        return HARDCODED_WHATSAPP_TEMPLATE[selectedLanguage][mode];
    }

    var pageState = {
        menuItems: [],
        cart: {},
        filteredQuery: ""
    };

    function safeParse(json, fallback) {
        try {
            return json ? JSON.parse(json) : fallback;
        } catch (_error) {
            return fallback;
        }
    }

    function readStorage(key, fallback) {
        return safeParse(window.localStorage.getItem(key), fallback);
    }

    function writeStorage(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function currency(amount) {
        return "\u20b9" + Number(amount || 0).toFixed(2);
    }

    function slug(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 36) || ("item-" + Date.now());
    }

    function loadMenuItems() {
        var saved = readStorage(STORAGE_KEYS.menu, null);
        if (Array.isArray(saved) && saved.length) {
            return saved;
        }
        writeStorage(STORAGE_KEYS.menu, DEFAULT_MENU_ITEMS);
        return DEFAULT_MENU_ITEMS.slice();
    }

    function getOrders() {
        return readStorage(STORAGE_KEYS.orders, []);
    }

    function saveOrders(orders) {
        writeStorage(STORAGE_KEYS.orders, orders);
    }

    function getHoldOrders() {
        return readStorage(STORAGE_KEYS.holdOrders, []);
    }

    function saveHoldOrders(holdOrders) {
        writeStorage(STORAGE_KEYS.holdOrders, holdOrders);
    }

    function getRegularCustomers() {
        return readStorage(STORAGE_KEYS.regularCustomers, []);
    }

    function saveRegularCustomers(customers) {
        writeStorage(STORAGE_KEYS.regularCustomers, customers);
    }

    function applyRegularCustomerProfile(profile) {
        if (!profile) {
            return;
        }

        var phoneEl = document.getElementById("cust-phone");
        var nameEl = document.getElementById("cust-name");
        var paymentTypeEl = document.getElementById("payment-type");

        if (phoneEl) {
            phoneEl.value = profile.phone || "";
        }
        if (nameEl) {
            nameEl.value = profile.name || "";
        }
        if (paymentTypeEl && profile.paymentType) {
            paymentTypeEl.value = profile.paymentType;
        }
    }

    function customerLabel(profile) {
        var name = profile.name || "Customer";
        var phone = profile.phone || "";
        return name + (phone ? (" (" + phone + ")") : "");
    }

    // Resolves what the user typed (label, plain name or phone) to a saved profile
    function findCustomerByText(text) {
        var query = String(text || "").trim().toLowerCase();
        if (!query) {
            return null;
        }

        var digits = query.replace(/\D/g, "");
        var customers = getRegularCustomers();
        var match = customers.find(function (profile) {
            return customerLabel(profile).toLowerCase() === query ||
                String(profile.name || "").trim().toLowerCase() === query ||
                (digits && profile.id === digits);
        });

        return match || null;
    }

    function renderRegularCustomers() {
        var inputEl = document.getElementById("regular-customer-select");
        var listEl = document.getElementById("regular-customer-options");
        if (!inputEl || !listEl) {
            return;
        }

        listEl.innerHTML = getRegularCustomers().map(function (profile) {
            return '<option value="' + escapeHtml(customerLabel(profile)) + '"></option>';
        }).join("");
    }

    function getSettings() {
        return readStorage(STORAGE_KEYS.settings, {});
    }

    function saveSettings(settings) {
        writeStorage(STORAGE_KEYS.settings, settings);
    }

    function cartTotals() {
        var total = 0;
        var cost = 0;

        Object.keys(pageState.cart).forEach(function (itemId) {
            var qty = pageState.cart[itemId];
            if (!qty) {
                return;
            }
            var item = pageState.menuItems.find(function (menuItem) {
                return menuItem.id === itemId;
            });
            if (!item) {
                return;
            }
            total += item.price * qty;
            cost += (item.cost || item.price * 0.35) * qty;
        });

        return { total: total, cost: cost };
    }

    function cartItemCount() {
        return Object.keys(pageState.cart).reduce(function (count, itemId) {
            var qty = Number(pageState.cart[itemId] || 0);
            return count + (qty > 0 ? qty : 0);
        }, 0);
    }

    function getOrderItemsCount(order) {
        if (!order || !Array.isArray(order.items)) {
            return 0;
        }
        return order.items.reduce(function (count, item) {
            var qty = Number(item && item.qty || 0);
            return count + (qty > 0 ? qty : 0);
        }, 0);
    }

    function visibleMenuItems() {
        var query = pageState.filteredQuery.trim().toLowerCase();
        if (!query) {
            return pageState.menuItems;
        }
        return pageState.menuItems.filter(function (item) {
            return item.name.toLowerCase().indexOf(query) !== -1;
        });
    }

    function updateMenuItemCountBadges() {
        var totalMenuItems = Array.isArray(pageState.menuItems) ? pageState.menuItems.length : 0;
        var orderCountEl = document.getElementById("order-menu-count");
        var adminCountEl = document.getElementById("admin-menu-count");

        if (orderCountEl) {
            orderCountEl.textContent = String(totalMenuItems);
        }
        if (adminCountEl) {
            adminCountEl.textContent = String(totalMenuItems);
        }
    }

    function nameToPhotoSlug(name) {
        return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
    }

    // Unsplash fallback when no local file matches
    function getMenuItemKeywordPhoto(name) {
        var n = String(name || "").toLowerCase();
        if (n.indexOf("cappuccino") !== -1 || n.indexOf("coffee") !== -1)
            return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("latte") !== -1)
            return "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("mocha") !== -1)
            return "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("espresso") !== -1)
            return "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("pizza") !== -1)
            return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("burger") !== -1)
            return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("sandwich") !== -1)
            return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("tea") !== -1)
            return "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("pasta") !== -1)
            return "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("cake") !== -1 || n.indexOf("pastry") !== -1)
            return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("muffin") !== -1)
            return "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("waffle") !== -1)
            return "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("pancake") !== -1)
            return "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("juice") !== -1 || n.indexOf("smoothie") !== -1)
            return "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("shake") !== -1 || n.indexOf("milkshake") !== -1)
            return "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("salad") !== -1)
            return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("soup") !== -1)
            return "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("fries") !== -1 || n.indexOf("chips") !== -1)
            return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("noodle") !== -1)
            return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("wrap") !== -1 || n.indexOf("roll") !== -1)
            return "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80";
        if (n.indexOf("ice cream") !== -1 || n.indexOf("icecream") !== -1)
            return "https://images.unsplash.com/photo-1567206563114-c179706e5e5e?auto=format&fit=crop&w=600&q=80";
        return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80";
    }

    // Try local photos/ folder first; falls back through extensions then keyword URL
    window.cvPhotoFallback = function (img, attempt) {
        var name = img.getAttribute("data-item-name") || "";
        var slug = nameToPhotoSlug(name);
        var exts = ["jpg", "jpeg", "png", "webp", "gif"];
        // First pass: slug-based names (veg-momos-steam.ext)
        if (attempt < exts.length) {
            img.onerror = function () { window.cvPhotoFallback(img, attempt + 1); };
            img.src = "photos/" + slug + "." + exts[attempt];
        // Second pass: original name with spaces as-is (Veg momos (Steam).ext)
        } else if (attempt < exts.length * 2) {
            img.onerror = function () { window.cvPhotoFallback(img, attempt + 1); };
            img.src = "photos/" + name + "." + exts[attempt - exts.length];
        } else {
            img.onerror = null;
            img.src = getMenuItemKeywordPhoto(name);
        }
    };

    function getMenuItemPhotoUrl(name) {
        return "photos/" + nameToPhotoSlug(name) + ".jpg";
    }

    function renderMenu() {
        var menuContainer = document.getElementById("menu-container");
        if (!menuContainer) {
            return;
        }

        updateMenuItemCountBadges();

        var menuItems = visibleMenuItems();
        if (!menuItems.length) {
            menuContainer.innerHTML = "<p class=\"status-text\">No matching item found.</p>";
            return;
        }

        menuContainer.innerHTML = "";
        menuItems.forEach(function (item) {
            var wrapper = document.createElement("div");
            wrapper.className = "menu-item-card";

            var button = document.createElement("button");
            button.type = "button";
            button.className = "menu-btn";
            button.innerHTML = [
                '<img class="menu-photo" src="' + escapeHtml(getMenuItemPhotoUrl(item.name)) + '" data-item-name="' + escapeHtml(item.name) + '" alt="' + escapeHtml(item.name) + '" onerror="window.cvPhotoFallback(this,0)">',
                '<span class="menu-card-main">',
                '<strong class="menu-name-editable">' + escapeHtml(item.name) + "</strong>",
                '<span class="menu-price-editable">' + currency(item.price) + "</span>",
                "</span>"
            ].join("");

            button.addEventListener("click", function () {
                updateCart(item.id, 1);
            });

            button.addEventListener("contextmenu", function (event) {
                event.preventDefault();
                updateCart(item.id, -1);
            });

            wrapper.appendChild(button);
            menuContainer.appendChild(wrapper);
        });
    }

    function renderCart() {
        var cartBody = document.getElementById("cart-table-body");
        var totalEl = document.getElementById("cart-total");
        var itemCountEl = document.getElementById("cart-item-count");

        if (!cartBody || !totalEl) {
            return;
        }

        var itemIds = Object.keys(pageState.cart).filter(function (id) {
            return pageState.cart[id] > 0;
        });

        if (!itemIds.length) {
            cartBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;">Cart is empty. Tap items to add.</td></tr>';
            totalEl.textContent = currency(0);
            if (itemCountEl) {
                itemCountEl.textContent = "0";
            }
            return;
        }

        var rows = itemIds.map(function (itemId) {
            var item = pageState.menuItems.find(function (menuItem) {
                return menuItem.id === itemId;
            });
            if (!item) {
                return "";
            }

            var qty = pageState.cart[itemId];
            var lineTotal = item.price * qty;

            return [
                "<tr>",
                "<td>" + escapeHtml(item.name) + "</td>",
                "<td>",
                '<div class="qty-actions">',
                '<button class="icon-btn" type="button" data-action="dec" data-item-id="' + escapeHtml(item.id) + '">-</button>',
                '<span style="min-width:24px;text-align:center;display:inline-flex;align-items:center;justify-content:center;">' + qty + "</span>",
                '<button class="icon-btn" type="button" data-action="inc" data-item-id="' + escapeHtml(item.id) + '">+</button>',
                "</div>",
                "</td>",
                "<td>" + currency(lineTotal) + "</td>",
                '<td><button class="btn btn-danger" type="button" data-action="remove" data-item-id="' + escapeHtml(item.id) + '">Remove</button></td>',
                "</tr>"
            ].join("");
        }).join("");

        cartBody.innerHTML = rows;
        var totals = cartTotals();
        totalEl.textContent = currency(totals.total);
        if (itemCountEl) {
            itemCountEl.textContent = String(cartItemCount());
        }

        cartBody.querySelectorAll("button[data-action]").forEach(function (button) {
            button.addEventListener("click", function () {
                var action = button.getAttribute("data-action");
                var itemId = button.getAttribute("data-item-id");
                if (action === "inc") {
                    updateCart(itemId, 1);
                } else if (action === "dec") {
                    updateCart(itemId, -1);
                } else if (action === "remove") {
                    delete pageState.cart[itemId];
                    renderCart();
                }
            });
        });
    }

    function updateCart(itemId, delta) {
        var current = pageState.cart[itemId] || 0;
        var next = current + delta;
        if (next <= 0) {
            delete pageState.cart[itemId];
        } else {
            pageState.cart[itemId] = next;
        }
        renderCart();
    }

    function buildBillItemsLines() {
        return Object.keys(pageState.cart)
            .filter(function (itemId) {
                return pageState.cart[itemId] > 0;
            })
            .map(function (itemId) {
                var item = pageState.menuItems.find(function (menuItem) {
                    return menuItem.id === itemId;
                });
                if (!item) {
                    return "";
                }
                var qty = pageState.cart[itemId];
                return "- " + item.name + " x " + qty + " = " + currency(item.price * qty);
            })
            .filter(Boolean)
            .join("\n");
    }

    function snapshotCart() {
        var cartCopy = {};
        Object.keys(pageState.cart).forEach(function (itemId) {
            var qty = Number(pageState.cart[itemId] || 0);
            if (qty > 0) {
                cartCopy[itemId] = qty;
            }
        });
        return cartCopy;
    }

    function buildOrderItemsFromCart() {
        return Object.keys(pageState.cart)
            .filter(function (itemId) { return pageState.cart[itemId] > 0; })
            .map(function (itemId) {
                var item = pageState.menuItems.find(function (menuItem) {
                    return menuItem.id === itemId;
                });
                if (!item) {
                    return null;
                }
                return {
                    itemId: item.id,
                    name: item.name,
                    price: item.price,
                    qty: pageState.cart[itemId]
                };
            })
            .filter(Boolean);
    }

    function renderHoldOrders() {
        var holdListEl = document.getElementById("hold-orders-list");
        if (!holdListEl) {
            return;
        }

        var holdOrders = getHoldOrders();
        if (!holdOrders.length) {
            holdListEl.innerHTML = '<p class="status-text">No hold orders yet.</p>';
            return;
        }

        holdListEl.innerHTML = holdOrders.map(function (hold) {
            var holdTotal = Number(hold.total || 0);
            var holdTable = hold.table || "Takeaway";
            var holdCustomer = hold.customerName || "Walk-in";
            return [
                '<div class="hold-order-row">',
                '<div class="hold-order-main">',
                '<strong>' + escapeHtml(holdCustomer) + '</strong>',
                '<span>' + escapeHtml(holdTable) + ' • ' + currency(holdTotal) + '</span>',
                '</div>',
                '<div class="hold-order-actions">',
                '<button type="button" class="btn btn-ghost" data-hold-action="resume" data-hold-id="' + escapeHtml(hold.holdId) + '">Resume</button>',
                '<button type="button" class="btn btn-danger" data-hold-action="delete" data-hold-id="' + escapeHtml(hold.holdId) + '">Delete</button>',
                '</div>',
                '</div>'
            ].join("");
        }).join("");

        holdListEl.querySelectorAll("button[data-hold-action]").forEach(function (button) {
            button.addEventListener("click", function () {
                var holdId = button.getAttribute("data-hold-id");
                var action = button.getAttribute("data-hold-action");
                var list = getHoldOrders();
                var index = list.findIndex(function (entry) {
                    return entry.holdId === holdId;
                });
                if (index === -1) {
                    return;
                }

                if (action === "resume") {
                    var entry = list[index];
                    pageState.cart = entry.cart || {};

                    var tableEl = document.getElementById("bill-table");
                    var phoneEl = document.getElementById("cust-phone");
                    var nameEl = document.getElementById("cust-name");
                    var paymentTypeEl = document.getElementById("payment-type");

                    if (tableEl && entry.table) {
                        tableEl.value = entry.table;
                    }
                    if (phoneEl) {
                        phoneEl.value = entry.customerPhone || "";
                    }
                    if (nameEl) {
                        nameEl.value = entry.customerName || "";
                    }
                    if (paymentTypeEl && entry.paymentType) {
                        paymentTypeEl.value = entry.paymentType;
                    }

                    list.splice(index, 1);
                    saveHoldOrders(list);
                    renderCart();
                    renderHoldOrders();
                    return;
                }

                if (action === "delete") {
                    list.splice(index, 1);
                    saveHoldOrders(list);
                    renderHoldOrders();
                }
            });
        });
    }

    function holdCurrentOrder() {
        if (!Object.keys(pageState.cart).length) {
            window.alert("Cart is empty. Add items first.");
            return;
        }

        var table = (document.getElementById("bill-table") || {}).value || "Takeaway";
        var customerPhone = (document.getElementById("cust-phone") || {}).value || "";
        var customerName = (document.getElementById("cust-name") || {}).value || "";
        var paymentType = (document.getElementById("payment-type") || {}).value || "Cash";
        var totals = cartTotals();

        var holdOrder = {
            holdId: "HOLD-" + Date.now(),
            createdAt: new Date().toISOString(),
            table: table,
            customerPhone: customerPhone,
            customerName: customerName,
            paymentType: paymentType,
            total: totals.total,
            cart: snapshotCart()
        };

        var holdOrders = getHoldOrders();
        holdOrders.unshift(holdOrder);
        saveHoldOrders(holdOrders);

        pageState.cart = {};
        renderCart();
        renderHoldOrders();
        window.alert("Order moved to Hold Orders.");
    }

    function isSameLocalDay(isoString, referenceDate) {
        var date = new Date(isoString || "");
        if (Number.isNaN(date.getTime())) {
            return false;
        }
        return date.getFullYear() === referenceDate.getFullYear() &&
            date.getMonth() === referenceDate.getMonth() &&
            date.getDate() === referenceDate.getDate();
    }

    function showTodayOrdersSummaryPopup() {
        var modalEl = document.getElementById("today-orders-modal");
        var contentEl = document.getElementById("today-orders-summary-content");
        if (!modalEl || !contentEl) {
            return;
        }

        var today = new Date();
        var orders = getOrders().filter(function (order) {
            return isSameLocalDay(order.time, today);
        });

        if (!orders.length) {
            contentEl.innerHTML = '<p class="status-text">No submitted orders found for today.</p>';
            modalEl.classList.remove("hidden");
            return;
        }

        var totalAmount = 0;
        var totalItems = 0;
        var paymentTotals = { Cash: 0, UPI: 0, Card: 0 };
        orders.forEach(function (order) {
            var total = Number(order.total || 0);
            totalAmount += total;
            totalItems += getOrderItemsCount(order);
            var mode = String(order.paymentType || "Cash");
            if (!paymentTotals[mode]) {
                paymentTotals[mode] = 0;
            }
            paymentTotals[mode] += total;
        });

        var orderRows = orders.slice().reverse().map(function (order) {
            var orderTime = new Date(order.time || "");
            var displayTime = Number.isNaN(orderTime.getTime()) ? "-" : orderTime.toLocaleTimeString();
            var customer = order.customerName || "Walk-in";
            var payment = order.paymentType || "Cash";
            var itemLines = Array.isArray(order.items) ? order.items.map(function (item) {
                var qty = Number(item.qty || 0);
                var price = Number(item.price || 0);
                var lineTotal = qty * price;
                return '<small>' + escapeHtml(item.name || "Item") + ' x ' + qty + ' = ' + currency(lineTotal) + '</small>';
            }).join('<br>') : '<small>No item details available.</small>';

            return [
                '<div class="summary-order-item">',
                '<div>',
                '<strong>' + escapeHtml(order.id || "-") + '</strong><br>',
                '<small>' + escapeHtml(customer) + ' • ' + escapeHtml(order.table || "Takeaway") + ' • ' + escapeHtml(payment) + '</small>',
                '<br>',
                itemLines,
                '</div>',
                '<div style="text-align:right;">',
                '<strong>' + currency(order.total || 0) + '</strong><br>',
                '<small>' + escapeHtml(displayTime) + '</small>',
                '</div>',
                '</div>'
            ].join("");
        }).join("");

        contentEl.innerHTML = [
            '<div class="summary-metrics">',
            '<div class="summary-metric"><span>Total Orders</span><strong>' + orders.length + '</strong></div>',
            '<div class="summary-metric"><span>Total Items</span><strong>' + totalItems + '</strong></div>',
            '<div class="summary-metric"><span>Total Sales</span><strong>' + currency(totalAmount) + '</strong></div>',
            '<div class="summary-metric"><span>Cash</span><strong>' + currency(paymentTotals.Cash || 0) + '</strong></div>',
            '<div class="summary-metric"><span>UPI</span><strong>' + currency(paymentTotals.UPI || 0) + '</strong></div>',
            '<div class="summary-metric"><span>Card</span><strong>' + currency(paymentTotals.Card || 0) + '</strong></div>',
            '</div>',
            '<div class="summary-order-list">',
            orderRows,
            '</div>'
        ].join("");

        modalEl.classList.remove("hidden");
    }

    function closeTodayOrdersSummaryPopup() {
        var modalEl = document.getElementById("today-orders-modal");
        if (modalEl) {
            modalEl.classList.add("hidden");
        }
    }

    function saveOrderAndClear(orderMessage, metadata) {
        var totals = cartTotals();
        var now = new Date();
        var details = metadata || {};
        var order = {
            id: details.orderId || ("ORD-" + now.getTime()),
            time: details.orderTimeIso || now.toISOString(),
            total: totals.total,
            cost: totals.cost,
            table: details.table || "Takeaway",
            customerName: details.customerName || "",
            customerPhone: details.customerPhone || "",
            paymentType: details.paymentType || "Cash",
            items: buildOrderItemsFromCart()
        };

        var orders = getOrders();
        orders.push(order);
        saveOrders(orders);

        writeStorage(STORAGE_KEYS.lastBill, orderMessage);
        pageState.cart = {};
        renderCart();
    }

    function processAndSendWhatsAppBill() {
        if (!Object.keys(pageState.cart).length) {
            window.alert("Cart is empty. Add items first.");
            return;
        }

        var settings = getSettings();
        var phoneInput = document.getElementById("cust-phone");
        var customerName = (document.getElementById("cust-name") || {}).value || "Customer";
        var businessName = BUSINESS_NAME;
        var table = (document.getElementById("bill-table") || {}).value || "Takeaway";
        var language = (document.getElementById("msg-language") || {}).value || settings.language || "en";
        var paymentType = (document.getElementById("payment-type") || {}).value || "Cash";

        var rawPhone = (phoneInput && phoneInput.value ? phoneInput.value : "").replace(/[^\d]/g, "");
        if (!rawPhone) {
            window.alert("Please enter customer mobile number.");
            return;
        }

        var totals = cartTotals();
        var now = new Date();
        var orderId = "ORD-" + now.getTime().toString().slice(-6);
        var billItems = buildBillItemsLines();

        var template = getHardcodedWhatsAppTemplate(language, table);
        var message = template
            .replaceAll("{{customer_name}}", customerName || "Customer")
            .replaceAll("{{business_name}}", businessName || "Cafe Vibes")
            .replaceAll("{{table}}", table)
            .replaceAll("{{bill_items}}", billItems)
            .replaceAll("{{order_total}}", currency(totals.total))
            .replaceAll("{{order_time}}", now.toLocaleString())
            .replaceAll("{{order_id}}", orderId) + "\n*Payment Type:* " + paymentType;

        var waUrl = "https://wa.me/" + rawPhone + "?text=" + encodeURIComponent(message);
        window.open(waUrl, "_blank", "noopener");

        saveOrderAndClear(message, {
            orderId: orderId,
            orderTimeIso: now.toISOString(),
            table: table,
            customerName: customerName,
            customerPhone: rawPhone,
            paymentType: paymentType
        });
        renderHoldOrders();
        updateAnalyticsSummary();
    }

    function downloadLastBillImage() {
        var billText = readStorage(STORAGE_KEYS.lastBill, "") || "";
        if (!billText) {
            window.alert("No previous bill found. Send a bill first.");
            return;
        }

        var lines = billText.split("\n");
        var canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = Math.max(280, 70 + lines.length * 30);

        var ctx = canvas.getContext("2d");
        if (!ctx) {
            window.alert("Unable to generate bill image.");
            return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#111827";
        ctx.font = "22px sans-serif";
        ctx.fillText("Cafe Vibes Bill", 40, 45);
        ctx.font = "20px monospace";

        lines.forEach(function (line, index) {
            ctx.fillText(line, 40, 90 + index * 30);
        });

        var link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "cafe-vibes-bill.png";
        link.click();
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function ensureXlsxReady() {
        if (!window.XLSX) {
            window.alert("Excel engine failed to load. Please check internet and reload.");
            return false;
        }
        return true;
    }

    function sheetToObjects(workbook, sheetName) {
        var sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            return [];
        }
        return window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }

    function downloadWorkbook(filename, workbook) {
        window.XLSX.writeFile(workbook, filename);
    }

    // Merges imported items into the menu, skipping duplicates by name
    function mergeMenuItems(newItems) {
        var existing = pageState.menuItems.slice();
        newItems.forEach(function (incoming) {
            if (!incoming || !incoming.name) { return; }
            var exists = existing.some(function (item) {
                return item.name.toLowerCase() === String(incoming.name).toLowerCase();
            });
            if (!exists) {
                existing.push({
                    id: incoming.id || (slug(incoming.name) + "-" + Date.now()),
                    name: incoming.name,
                    price: Number(incoming.price || 0),
                    cost: Number(incoming.cost || Number(incoming.price || 0) * 0.35)
                });
            }
        });
        pageState.menuItems = existing;
        writeStorage(STORAGE_KEYS.menu, existing);
        renderMenu();
        renderCart();
        updateAnalyticsSummary();
    }

    function parseMenuExcelWorkbook(workbook) {
        if (!workbook || !workbook.Sheets || !Array.isArray(workbook.SheetNames) || !workbook.SheetNames.length) {
            return [];
        }

        var preferredSheet = workbook.SheetNames.indexOf("menu_items") !== -1 ? "menu_items" : workbook.SheetNames[0];
        var rows = sheetToObjects(workbook, preferredSheet);
        if (!rows.length) {
            return [];
        }

        function readField(row, keys) {
            for (var i = 0; i < keys.length; i += 1) {
                var key = keys[i];
                if (row[key] != null && String(row[key]).trim() !== "") {
                    return row[key];
                }
            }
            return "";
        }

        var parsedItems = [];
        rows.forEach(function (row) {
            var name = String(readField(row, ["item_name", "name", "item", "menu_item", "Item", "Item Name"]) || "").trim();
            var priceValue = readField(row, ["selling_price", "price", "rate", "amount", "Price", "Selling Price"]);
            var costValue = readField(row, ["raw_cost", "cost", "item_cost", "Cost", "Raw Cost"]);
            var price = Number(priceValue || 0);

            if (!name || !(price > 0)) {
                return;
            }

            parsedItems.push({
                id: slug(name) + "-" + Date.now() + "-" + parsedItems.length,
                name: name,
                price: Number(price.toFixed(2)),
                cost: Number((Number(costValue || 0) > 0 ? Number(costValue) : price * 0.35).toFixed(2))
            });
        });

        return parsedItems;
    }

    function setupOrderEvents() {
        var menuSearchInput = document.getElementById("menu-search-input");
        var clearSearchBtn = document.getElementById("clear-menu-search-btn");
        var savedCustomerSelect = document.getElementById("regular-customer-select");
        var saveCustomerBtn = document.getElementById("save-regular-customer-btn");
        var removeCustomerBtn = document.getElementById("remove-regular-customer-btn");

        if (menuSearchInput) {
            menuSearchInput.addEventListener("input", function () {
                pageState.filteredQuery = menuSearchInput.value || "";
                renderMenu();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", function () {
                pageState.filteredQuery = "";
                if (menuSearchInput) {
                    menuSearchInput.value = "";
                }
                renderMenu();
            });
        }

        if (savedCustomerSelect) {
            savedCustomerSelect.addEventListener("input", function () {
                applyRegularCustomerProfile(findCustomerByText(savedCustomerSelect.value));
            });
        }

        if (saveCustomerBtn) {
            saveCustomerBtn.addEventListener("click", function () {
                var phoneEl = document.getElementById("cust-phone");
                var nameEl = document.getElementById("cust-name");
                var paymentTypeEl = document.getElementById("payment-type");

                var rawPhone = (phoneEl && phoneEl.value ? phoneEl.value : "").trim();
                var digits = rawPhone.replace(/[^\d]/g, "");
                var name = (nameEl && nameEl.value ? nameEl.value : "").trim();

                if (!digits) {
                    window.alert("Enter customer mobile number before saving.");
                    return;
                }
                if (!name) {
                    window.alert("Enter customer name before saving.");
                    return;
                }

                var profile = {
                    id: digits,
                    phone: rawPhone,
                    name: name,
                    paymentType: (paymentTypeEl && paymentTypeEl.value) || "Cash",
                    updatedAt: new Date().toISOString()
                };

                var customers = getRegularCustomers().filter(function (entry) {
                    return entry.id !== profile.id;
                });
                customers.unshift(profile);
                saveRegularCustomers(customers);
                renderRegularCustomers();

                if (savedCustomerSelect) {
                    savedCustomerSelect.value = customerLabel(profile);
                }
                window.alert("Regular customer saved.");
            });
        }

        if (removeCustomerBtn) {
            removeCustomerBtn.addEventListener("click", function () {
                var selectedProfile = savedCustomerSelect ? findCustomerByText(savedCustomerSelect.value) : null;
                if (!selectedProfile) {
                    window.alert("Type or pick a saved customer to remove.");
                    return;
                }

                var customers = getRegularCustomers().filter(function (entry) {
                    return entry.id !== selectedProfile.id;
                });
                saveRegularCustomers(customers);
                savedCustomerSelect.value = "";
                renderRegularCustomers();
                window.alert("Saved customer removed.");
            });
        }
    }

    function setupOrderPage() {
        pageState.menuItems = loadMenuItems();
        setupOrderEvents();
        renderMenu();
        renderCart();
        renderRegularCustomers();
        renderHoldOrders();
        updateAnalyticsSummary();
    }

    function renderAdminMenuList() {
        var listEl = document.getElementById("admin-menu-list");
        if (!listEl) {
            return;
        }

        updateMenuItemCountBadges();

        if (!pageState.menuItems.length) {
            listEl.innerHTML = '<p class="admin-status">No items found. Add your first item below.</p>';
            return;
        }

        listEl.innerHTML = pageState.menuItems.map(function (item, index) {
            return [
                '<div class="admin-row" data-row-index="' + index + '">',
                '<input type="text" data-menu-field="name" value="' + escapeHtml(item.name) + '">',
                '<input type="number" min="0" step="0.01" data-menu-field="price" value="' + Number(item.price || 0).toFixed(2) + '">',
                '<button type="button" class="btn btn-danger" data-admin-remove-item="' + index + '">Remove</button>',
                "</div>"
            ].join("");
        }).join("");

        listEl.querySelectorAll("button[data-admin-remove-item]").forEach(function (button) {
            button.addEventListener("click", function () {
                var index = Number(button.getAttribute("data-admin-remove-item"));
                if (index >= 0 && index < pageState.menuItems.length) {
                    pageState.menuItems.splice(index, 1);
                    renderAdminMenuList();
                    updateAdminStatus("admin-menu-status", "Item removed. Click Save Menu Changes to apply.");
                }
            });
        });
    }

    function updateAdminStatus(statusId, message) {
        var el = document.getElementById(statusId);
        if (el) {
            el.textContent = message;
        }
    }

    function collectAdminMenuChanges() {
        var rows = Array.prototype.slice.call(document.querySelectorAll("#admin-menu-list .admin-row"));
        var updated = [];

        rows.forEach(function (row) {
            var nameInput = row.querySelector('input[data-menu-field="name"]');
            var priceInput = row.querySelector('input[data-menu-field="price"]');

            var name = nameInput ? nameInput.value.trim() : "";
            var price = Number(priceInput ? priceInput.value : 0);

            if (!name || !(price > 0)) {
                return;
            }

            updated.push({
                id: slug(name) + "-" + Date.now() + "-" + updated.length,
                name: name,
                price: Number(price.toFixed(2)),
                cost: Number((price * 0.35).toFixed(2))
            });
        });

        return updated;
    }

    function loadAdminSettingsForm() {
        var settings = getSettings();
        var languageSelect = document.getElementById("admin-message-language");
        var passwordInput = document.getElementById("admin-password");
        var passwordConfirmInput = document.getElementById("admin-password-confirm");

        if (languageSelect) { languageSelect.value = settings.language || "en"; }
        if (passwordInput) { passwordInput.value = ""; }
        if (passwordConfirmInput) { passwordConfirmInput.value = ""; }
    }

    function setupAdminConfigPage() {
        var adminMenuList = document.getElementById("admin-menu-list");
        if (!adminMenuList) {
            return;
        }

        pageState.menuItems = loadMenuItems();
        renderAdminMenuList();
        loadAdminSettingsForm();

        var addItemBtn = document.getElementById("admin-add-item-btn");
        var saveMenuBtn = document.getElementById("admin-save-menu-btn");
        var importMenuBtn = document.getElementById("import-menu-btn");
        var saveSettingsBtn = document.getElementById("admin-save-settings-btn");
        var savePasswordBtn = document.getElementById("admin-save-password-btn");
        var languageSelect = document.getElementById("admin-message-language");

        if (addItemBtn) {
            addItemBtn.addEventListener("click", function () {
                var nameInput = document.getElementById("admin-new-item-name");
                var priceInput = document.getElementById("admin-new-item-price");

                var name = (nameInput && nameInput.value || "").trim();
                var price = Number(priceInput && priceInput.value || 0);

                if (!name || !(price > 0)) {
                    updateAdminStatus("admin-menu-status", "Enter valid item name and selling price.");
                    return;
                }

                var duplicate = pageState.menuItems.some(function (item) {
                    return item.name.trim().toLowerCase() === name.toLowerCase();
                });
                if (duplicate) {
                    updateAdminStatus("admin-menu-status", "\"" + name + "\" already exists in the menu.");
                    return;
                }

                pageState.menuItems.push({
                    id: slug(name) + "-" + Date.now(),
                    name: name,
                    price: Number(price.toFixed(2)),
                    cost: Number((price * 0.35).toFixed(2))
                });
                renderAdminMenuList();

                if (nameInput) {
                    nameInput.value = "";
                }
                if (priceInput) {
                    priceInput.value = "";
                }

                updateAdminStatus("admin-menu-status", "Item added. Click Save Menu Changes to apply.");
            });
        }

        if (saveMenuBtn) {
            saveMenuBtn.addEventListener("click", function () {
                var collected = collectAdminMenuChanges();
                if (!collected.length) {
                    updateAdminStatus("admin-menu-status", "At least one valid menu item is required.");
                    return;
                }
                pageState.menuItems = collected;
                writeStorage(STORAGE_KEYS.menu, collected);
                renderAdminMenuList();
                updateAdminStatus("admin-menu-status", "Menu saved successfully. Order page now uses updated items.");
            });
        }

        if (importMenuBtn) {
            importMenuBtn.addEventListener("click", function () {
                window.importDataWorkbook();
            });
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener("click", function () {
                var settings = getSettings();
                settings.language = languageSelect ? languageSelect.value : "en";
                saveSettings(settings);
                updateAdminStatus("admin-settings-status", "Settings saved.");
            });
        }

        if (savePasswordBtn) {
            savePasswordBtn.addEventListener("click", function () {
                var settings = getSettings();
                var passwordInput = document.getElementById("admin-password");
                var passwordConfirmInput = document.getElementById("admin-password-confirm");
                var passwordStatusEl = document.getElementById("admin-password-status");
                var nextPassword = passwordInput ? passwordInput.value.trim() : "";
                var confirmPassword = passwordConfirmInput ? passwordConfirmInput.value.trim() : "";

                if (!nextPassword || !confirmPassword) {
                    if (passwordStatusEl) {
                        passwordStatusEl.textContent = "Enter password and confirm password.";
                    }
                    return;
                }
                if (nextPassword.length < 4) {
                    if (passwordStatusEl) {
                        passwordStatusEl.textContent = "Password must be at least 4 characters.";
                    }
                    return;
                }
                if (nextPassword !== confirmPassword) {
                    if (passwordStatusEl) {
                        passwordStatusEl.textContent = "Password and confirm password do not match.";
                    }
                    return;
                }

                settings.adminPassword = nextPassword;
                saveSettings(settings);

                if (passwordStatusEl) {
                    passwordStatusEl.textContent = "Admin password saved successfully.";
                }
                if (passwordInput) {
                    passwordInput.value = "";
                }
                if (passwordConfirmInput) {
                    passwordConfirmInput.value = "";
                }
            });
        }

    }

    function getDailyCosts() { return readStorage(STORAGE_KEYS.dailyCosts, {}); }
    function saveDailyCosts(data) { writeStorage(STORAGE_KEYS.dailyCosts, data); }
    function getMonthlyFixed() { return readStorage(STORAGE_KEYS.monthlyFixed, {}); }
    function saveMonthlyFixed(data) { writeStorage(STORAGE_KEYS.monthlyFixed, data); }

    function dateToISO(d) { return d.toISOString().slice(0, 10); }

    function getSalesForDate(dateStr) {
        return getOrders().filter(function (o) { return String(o.time || "").slice(0, 10) === dateStr; })
            .reduce(function (s, o) { return s + Number(o.total || 0); }, 0);
    }
    function getSalesForMonth(monthStr) {
        return getOrders().filter(function (o) { return String(o.time || "").slice(0, 7) === monthStr; })
            .reduce(function (s, o) { return s + Number(o.total || 0); }, 0);
    }
    function getItemsForMonth(monthStr) {
        return getOrders().filter(function (o) { return String(o.time || "").slice(0, 7) === monthStr; })
            .reduce(function (s, o) { return s + getOrderItemsCount(o); }, 0);
    }

    function renderDailyLog() {
        var tbody = document.getElementById("ap-daily-tbody");
        if (!tbody) { return; }
        var dailyCosts = getDailyCosts();
        var dates = Object.keys(dailyCosts).sort().reverse();
        if (!dates.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:14px;">No entries yet.</td></tr>';
            return;
        }
        tbody.innerHTML = dates.map(function (dateStr) {
            var d = dailyCosts[dateStr];
            var sales = getSalesForDate(dateStr);
            var dairy = Number(d.dairy || 0), veggies = Number(d.veggies || 0), raw = Number(d.raw || 0), misc = Number(d.misc || 0);
            var totalCost = dairy + veggies + raw + misc;
            var profit = sales - totalCost;
            return "<tr>" +
                "<td>" + dateStr + "</td>" +
                "<td class='num'>" + currency(sales) + "</td>" +
                "<td class='num'>" + currency(dairy) + "</td>" +
                "<td class='num'>" + currency(veggies) + "</td>" +
                "<td class='num'>" + currency(raw) + "</td>" +
                "<td class='num'>" + currency(misc) + "</td>" +
                "<td class='num'>" + currency(totalCost) + "</td>" +
                "<td class='num " + (profit >= 0 ? "profit" : "loss") + "'>" + currency(profit) + "</td>" +
                "</tr>";
        }).join("");
    }

    function renderMonthlyLog() {
        var tbody = document.getElementById("ap-monthly-tbody");
        if (!tbody) { return; }
        var monthlyFixed = getMonthlyFixed();
        var months = Object.keys(monthlyFixed).sort().reverse();
        if (!months.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:14px;">No entries yet.</td></tr>';
            return;
        }
        tbody.innerHTML = months.map(function (monthStr) {
            var m = monthlyFixed[monthStr];
            var elec = Number(m.electricity || 0), water = Number(m.water || 0), staff = Number(m.staff || 0), gas = Number(m.gas || 0);
            var total = elec + water + staff + gas;
            return "<tr>" +
                "<td>" + monthStr + "</td>" +
                "<td class='num'>" + currency(elec) + "</td>" +
                "<td class='num'>" + currency(water) + "</td>" +
                "<td class='num'>" + currency(staff) + "</td>" +
                "<td class='num'>" + currency(gas) + "</td>" +
                "<td class='num'>" + currency(total) + "</td>" +
                "</tr>";
        }).join("");
    }

    function renderMasterDashboard() {
        var tbody = document.getElementById("ap-master-tbody");
        if (!tbody) { return; }
        var months = {};
        getOrders().forEach(function (o) { var m = String(o.time || "").slice(0, 7); if (m) { months[m] = true; } });
        var dailyCosts = getDailyCosts();
        Object.keys(dailyCosts).forEach(function (d) { var m = d.slice(0, 7); if (m) { months[m] = true; } });
        var monthlyFixed = getMonthlyFixed();
        Object.keys(monthlyFixed).forEach(function (m) { if (m) { months[m] = true; } });
        var sortedMonths = Object.keys(months).sort().reverse();
        if (!sortedMonths.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:14px;">No data yet. Start adding orders and daily entries.</td></tr>';
            return;
        }
        tbody.innerHTML = sortedMonths.map(function (monthStr) {
            var sales = getSalesForMonth(monthStr);
            var items = getItemsForMonth(monthStr);
            var materialCost = Object.keys(dailyCosts)
                .filter(function (d) { return d.slice(0, 7) === monthStr; })
                .reduce(function (sum, d) {
                    var e = dailyCosts[d];
                    return sum + Number(e.dairy || 0) + Number(e.veggies || 0) + Number(e.raw || 0) + Number(e.misc || 0);
                }, 0);
            var fixedEntry = monthlyFixed[monthStr] || {};
            var fixedCost = Number(fixedEntry.electricity || 0) + Number(fixedEntry.water || 0) + Number(fixedEntry.staff || 0) + Number(fixedEntry.gas || 0);
            var totalCost = materialCost + fixedCost;
            var profit = sales - totalCost;
            return "<tr>" +
                "<td><strong>" + monthStr + "</strong></td>" +
                "<td class='num'>" + currency(sales) + "</td>" +
                "<td class='num'>" + items + "</td>" +
                "<td class='num'>" + currency(materialCost) + "</td>" +
                "<td class='num'>" + currency(fixedCost) + "</td>" +
                "<td class='num'>" + currency(totalCost) + "</td>" +
                "<td class='num " + (profit >= 0 ? "profit" : "loss") + "'>" + currency(profit) + "</td>" +
                "</tr>";
        }).join("");
    }

    var dashboardCharts = {};

    function toggleChartEmpty(emptyId, isEmpty) {
        var el = document.getElementById(emptyId);
        if (el) { el.classList.toggle("hidden", !isEmpty); }
    }

    function drawChart(canvasId, emptyId, config, hasData) {
        var canvas = document.getElementById(canvasId);
        if (!canvas) { return; }

        if (dashboardCharts[canvasId]) {
            dashboardCharts[canvasId].destroy();
            delete dashboardCharts[canvasId];
        }

        toggleChartEmpty(emptyId, !hasData);
        canvas.classList.toggle("hidden", !hasData);
        if (!hasData) { return; }

        dashboardCharts[canvasId] = new window.Chart(canvas.getContext("2d"), config);
    }

    function getTopSellingItems(limit) {
        var totals = {};
        getOrders().forEach(function (order) {
            (order.items || []).forEach(function (item) {
                var name = item.name || "Item";
                totals[name] = (totals[name] || 0) + Number(item.qty || 0);
            });
        });
        return Object.keys(totals)
            .map(function (name) { return { name: name, qty: totals[name] }; })
            .filter(function (entry) { return entry.qty > 0; })
            .sort(function (a, b) { return b.qty - a.qty; })
            .slice(0, limit);
    }

    function renderDashboardCharts() {
        if (!window.Chart || !document.getElementById("chart-monthly-performance")) { return; }

        var monthRows = buildMasterRows().slice(-12);
        drawChart("chart-monthly-performance", "chart-monthly-empty", {
            type: "bar",
            data: {
                labels: monthRows.map(function (row) { return row.Month; }),
                datasets: [
                    { label: "Sales", data: monthRows.map(function (row) { return row.Sales; }), backgroundColor: "rgba(37, 99, 235, 0.75)", borderRadius: 6 },
                    { label: "Total Cost", data: monthRows.map(function (row) { return row["Total Cost"]; }), backgroundColor: "rgba(239, 68, 68, 0.75)", borderRadius: 6 },
                    { label: "Net Profit", type: "line", data: monthRows.map(function (row) { return row["Net Profit"]; }), borderColor: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.15)", tension: 0.35, fill: true, pointRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: { y: { beginAtZero: true, ticks: { callback: function (value) { return "\u20b9" + value; } } } }
            }
        }, monthRows.length > 0);

        var dailyCosts = getDailyCosts();
        var costTotals = { dairy: 0, veggies: 0, raw: 0, misc: 0 };
        Object.keys(dailyCosts).forEach(function (date) {
            var entry = dailyCosts[date];
            costTotals.dairy += Number(entry.dairy || 0);
            costTotals.veggies += Number(entry.veggies || 0);
            costTotals.raw += Number(entry.raw || 0);
            costTotals.misc += Number(entry.misc || 0);
        });
        var monthlyFixed = getMonthlyFixed();
        var fixedTotal = Object.keys(monthlyFixed).reduce(function (sum, month) {
            var m = monthlyFixed[month];
            return sum + Number(m.electricity || 0) + Number(m.water || 0) + Number(m.staff || 0) + Number(m.gas || 0);
        }, 0);

        var costValues = [costTotals.dairy, costTotals.veggies, costTotals.raw, costTotals.misc, fixedTotal];
        drawChart("chart-cost-split", "chart-cost-empty", {
            type: "doughnut",
            data: {
                labels: ["Dairy", "Veggies", "Raw Materials", "Miscellaneous", "Fixed Charges"],
                datasets: [{
                    data: costValues,
                    backgroundColor: ["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f87171"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "58%",
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: { callbacks: { label: function (ctx) { return ctx.label + ": " + currency(ctx.parsed); } } }
                }
            }
        }, costValues.some(function (value) { return value > 0; }));

        var topItems = getTopSellingItems(8);
        drawChart("chart-top-items", "chart-items-empty", {
            type: "bar",
            data: {
                labels: topItems.map(function (entry) { return entry.name; }),
                datasets: [{ label: "Qty Sold", data: topItems.map(function (entry) { return entry.qty; }), backgroundColor: "rgba(217, 119, 6, 0.8)", borderRadius: 6 }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        }, topItems.length > 0);
    }

    function updateAnalyticsSummary() {
        var totalSalesEl = document.getElementById("summary-total-sales");
        var totalItemsEl = document.getElementById("summary-total-items");
        var totalExpenseEl = document.getElementById("summary-total-expense");
        var totalMonthlyEl = document.getElementById("summary-total-monthly");
        var netProfitEl = document.getElementById("summary-net-profit");
        if (!totalSalesEl) { return; }

        var orders = getOrders();
        var totalSales = orders.reduce(function (s, o) { return s + Number(o.total || 0); }, 0);
        var totalItems = orders.reduce(function (s, o) { return s + getOrderItemsCount(o); }, 0);

        var dailyCosts = getDailyCosts();
        var totalMaterialCost = Object.keys(dailyCosts).reduce(function (sum, date) {
            var d = dailyCosts[date];
            return sum + Number(d.dairy || 0) + Number(d.veggies || 0) + Number(d.raw || 0) + Number(d.misc || 0);
        }, 0);
        var monthlyFixed = getMonthlyFixed();
        var totalFixedCost = Object.keys(monthlyFixed).reduce(function (sum, month) {
            var m = monthlyFixed[month];
            return sum + Number(m.electricity || 0) + Number(m.water || 0) + Number(m.staff || 0) + Number(m.gas || 0);
        }, 0);
        var netProfit = totalSales - totalMaterialCost - totalFixedCost;

        if (totalSalesEl) { totalSalesEl.textContent = currency(totalSales); }
        if (totalItemsEl) { totalItemsEl.textContent = String(totalItems); }
        if (totalExpenseEl) { totalExpenseEl.textContent = currency(totalMaterialCost); }
        if (totalMonthlyEl) { totalMonthlyEl.textContent = currency(totalFixedCost); }
        if (netProfitEl) {
            netProfitEl.textContent = currency(netProfit);
            netProfitEl.classList.toggle("profit", netProfit >= 0);
            netProfitEl.classList.toggle("loss", netProfit < 0);
        }
        renderMasterDashboard();
        renderDashboardCharts();
    }

    function setupAdminPanelToggle() {
        var showConfigBtn = document.getElementById("show-config-panel-btn");
        var showAnalyticsBtn = document.getElementById("show-analytics-panel-btn");
        var configPanel = document.getElementById("config-panel");
        var analyticsPanel = document.getElementById("analytics-panel");

        if (!showConfigBtn || !showAnalyticsBtn || !configPanel || !analyticsPanel) {
            return;
        }

        function setActivePanel(panel) {
            var showConfig = panel === "config";
            configPanel.classList.toggle("hidden", !showConfig);
            analyticsPanel.classList.toggle("hidden", showConfig);
            showConfigBtn.classList.toggle("active", showConfig);
            showAnalyticsBtn.classList.toggle("active", !showConfig);

            if (!showConfig) {
                updateAnalyticsSummary();
            }
        }

        showConfigBtn.addEventListener("click", function () {
            setActivePanel("config");
        });

        showAnalyticsBtn.addEventListener("click", function () {
            setActivePanel("analytics");
        });

        setActivePanel("config");
    }

    function setupAnalyticsPage() {
        // One-time migration of legacy flat expenses to new per-date/per-month model
        var oldExpenses = readStorage(STORAGE_KEYS.expenses, null);
        if (oldExpenses && typeof oldExpenses === "object" && Object.keys(oldExpenses).length) {
            var today = dateToISO(new Date());
            var thisMonth = today.slice(0, 7);
            var dc = getDailyCosts();
            if (!dc[today]) {
                dc[today] = {
                    dairy: Number(oldExpenses["cost-dairy"] || 0),
                    veggies: Number(oldExpenses["cost-veggies"] || 0),
                    raw: Number(oldExpenses["cost-raw"] || 0),
                    misc: Number(oldExpenses["cost-misc"] || 0)
                };
                saveDailyCosts(dc);
            }
            var mf = getMonthlyFixed();
            if (!mf[thisMonth]) {
                mf[thisMonth] = {
                    electricity: Number(oldExpenses["monthly-electricity"] || 0),
                    water: Number(oldExpenses["monthly-water"] || 0),
                    staff: Number(oldExpenses["monthly-staff"] || 0),
                    gas: Number(oldExpenses["monthly-gas"] || 0)
                };
                saveMonthlyFixed(mf);
            }
            window.localStorage.removeItem(STORAGE_KEYS.expenses);
        }

        // Sub-panel toggle inside analytics panel
        var apDailyBtn = document.getElementById("ap-daily-btn");
        var apMonthlyBtn = document.getElementById("ap-monthly-btn");
        var apDashboardBtn = document.getElementById("ap-dashboard-btn");
        var apDailySection = document.getElementById("ap-daily");
        var apMonthlySection = document.getElementById("ap-monthly");
        var apDashboardSection = document.getElementById("ap-dashboard");

        function setApPanel(panel) {
            [apDailySection, apMonthlySection, apDashboardSection].forEach(function (el) { if (el) { el.classList.add("hidden"); } });
            [apDailyBtn, apMonthlyBtn, apDashboardBtn].forEach(function (btn) { if (btn) { btn.classList.remove("active"); } });
            if (panel === "daily") {
                if (apDailySection) { apDailySection.classList.remove("hidden"); }
                if (apDailyBtn) { apDailyBtn.classList.add("active"); }
            } else if (panel === "monthly") {
                if (apMonthlySection) { apMonthlySection.classList.remove("hidden"); }
                if (apMonthlyBtn) { apMonthlyBtn.classList.add("active"); }
            } else {
                if (apDashboardSection) { apDashboardSection.classList.remove("hidden"); }
                if (apDashboardBtn) { apDashboardBtn.classList.add("active"); }
                updateAnalyticsSummary();
            }
        }

        if (apDailyBtn) { apDailyBtn.addEventListener("click", function () { setApPanel("daily"); }); }
        if (apMonthlyBtn) { apMonthlyBtn.addEventListener("click", function () { setApPanel("monthly"); }); }
        if (apDashboardBtn) { apDashboardBtn.addEventListener("click", function () { setApPanel("dashboard"); }); }

        // ── Daily Entry ──────────────────────────────────────────────────────────
        var apDateInput = document.getElementById("ap-date");
        var apSalesDisplay = document.getElementById("ap-sales-display");
        var apDairyInput = document.getElementById("ap-dairy");
        var apVeggiesInput = document.getElementById("ap-veggies");
        var apRawInput = document.getElementById("ap-raw");
        var apMiscInput = document.getElementById("ap-misc");
        var apSaveDailyBtn = document.getElementById("ap-save-daily-btn");

        function loadDailyEntry(dateStr) {
            var entry = getDailyCosts()[dateStr] || {};
            if (apSalesDisplay) { apSalesDisplay.value = currency(getSalesForDate(dateStr)); }
            if (apDairyInput) { apDairyInput.value = entry.dairy || ""; }
            if (apVeggiesInput) { apVeggiesInput.value = entry.veggies || ""; }
            if (apRawInput) { apRawInput.value = entry.raw || ""; }
            if (apMiscInput) { apMiscInput.value = entry.misc || ""; }
        }

        var todayStr = dateToISO(new Date());
        if (apDateInput) {
            apDateInput.value = todayStr;
            loadDailyEntry(todayStr);
            apDateInput.addEventListener("change", function () { loadDailyEntry(apDateInput.value); });
        }

        if (apSaveDailyBtn) {
            apSaveDailyBtn.addEventListener("click", function () {
                var dateStr = apDateInput ? apDateInput.value : todayStr;
                if (!dateStr) { updateAdminStatus("ap-daily-status", "Select a date first."); return; }
                var dc = getDailyCosts();
                dc[dateStr] = {
                    dairy: Number(apDairyInput && apDairyInput.value || 0),
                    veggies: Number(apVeggiesInput && apVeggiesInput.value || 0),
                    raw: Number(apRawInput && apRawInput.value || 0),
                    misc: Number(apMiscInput && apMiscInput.value || 0)
                };
                saveDailyCosts(dc);
                renderDailyLog();
                updateAdminStatus("ap-daily-status", "Entry saved for " + dateStr + ".");
            });
        }

        renderDailyLog();

        // ── Monthly Fixed Costs ──────────────────────────────────────────────────
        var apMonthInput = document.getElementById("ap-month");
        var apElecInput = document.getElementById("ap-electricity");
        var apWaterInput = document.getElementById("ap-water");
        var apStaffInput = document.getElementById("ap-staff");
        var apGasInput = document.getElementById("ap-gas");
        var apSaveMonthlyBtn = document.getElementById("ap-save-monthly-btn");

        function loadMonthlyEntry(monthStr) {
            var entry = getMonthlyFixed()[monthStr] || {};
            if (apElecInput) { apElecInput.value = entry.electricity || ""; }
            if (apWaterInput) { apWaterInput.value = entry.water || ""; }
            if (apStaffInput) { apStaffInput.value = entry.staff || ""; }
            if (apGasInput) { apGasInput.value = entry.gas || ""; }
        }

        var thisMonthStr = todayStr.slice(0, 7);
        if (apMonthInput) {
            apMonthInput.value = thisMonthStr;
            loadMonthlyEntry(thisMonthStr);
            apMonthInput.addEventListener("change", function () { loadMonthlyEntry(apMonthInput.value); });
        }

        if (apSaveMonthlyBtn) {
            apSaveMonthlyBtn.addEventListener("click", function () {
                var monthStr = apMonthInput ? apMonthInput.value : thisMonthStr;
                if (!monthStr) { updateAdminStatus("ap-monthly-status", "Select a month first."); return; }
                var mf = getMonthlyFixed();
                mf[monthStr] = {
                    electricity: Number(apElecInput && apElecInput.value || 0),
                    water: Number(apWaterInput && apWaterInput.value || 0),
                    staff: Number(apStaffInput && apStaffInput.value || 0),
                    gas: Number(apGasInput && apGasInput.value || 0)
                };
                saveMonthlyFixed(mf);
                renderMonthlyLog();
                updateAdminStatus("ap-monthly-status", "Fixed costs saved for " + monthStr + ".");
            });
        }

        renderMonthlyLog();
        setApPanel("daily");
        updateAnalyticsSummary();
        setupAdminConfigPage();
        setupAdminPanelToggle();
    }

    window.processAndSendWhatsAppBill = processAndSendWhatsAppBill;
    window.holdCurrentOrder = holdCurrentOrder;
    window.showTodayOrdersSummaryPopup = showTodayOrdersSummaryPopup;
    window.closeTodayOrdersSummaryPopup = closeTodayOrdersSummaryPopup;
    window.downloadLastBillImage = downloadLastBillImage;

    // ── Data workbook: full backup / restore of analytics + configuration ───────
    var DATA_SHEETS = {
        daily: "Daily_Entry",
        monthly: "Monthly_Fixed_Cost",
        master: "Master_Dashboard",
        orders: "Orders",
        customers: "Regular Customers",
        menu: "Menu_Items",
        settings: "Settings"
    };

    // Accepted sheet titles per data type, so hand-made workbooks also import
    var SHEET_ALIASES = {
        daily: [DATA_SHEETS.daily, "daily entry", "buisness data per day", "business data per day", "daily data", "per day"],
        monthly: [DATA_SHEETS.monthly, "monthly fixed cost", "buisness data per month", "business data per month", "monthly data", "per month"],
        orders: [DATA_SHEETS.orders, "order log", "sales"],
        customers: [DATA_SHEETS.customers, "regular customers", "saved customers", "customers"],
        menu: [DATA_SHEETS.menu, "menu items", "menu"],
        settings: [DATA_SHEETS.settings, "configuration", "config"]
    };

    function normalizeSheetName(name) {
        return String(name || "").trim().toLowerCase().replace(/[_\s-]+/g, " ");
    }

    function findSheetName(workbook, type) {
        var aliases = (SHEET_ALIASES[type] || []).map(normalizeSheetName);
        var names = (workbook && workbook.SheetNames) || [];
        for (var i = 0; i < names.length; i += 1) {
            if (aliases.indexOf(normalizeSheetName(names[i])) !== -1) {
                return names[i];
            }
        }
        return "";
    }

    function pickField(row, keys) {
        for (var i = 0; i < keys.length; i += 1) {
            if (row[keys[i]] != null && String(row[keys[i]]).trim() !== "") {
                return row[keys[i]];
            }
        }
        return "";
    }

    function pad2(value) {
        return (value < 10 ? "0" : "") + value;
    }

    function toDateKey(value) {
        if (value instanceof Date && !isNaN(value.getTime())) {
            return value.getFullYear() + "-" + pad2(value.getMonth() + 1) + "-" + pad2(value.getDate());
        }
        var match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? match[0] : "";
    }

    function toMonthKey(value) {
        if (value instanceof Date && !isNaN(value.getTime())) {
            return value.getFullYear() + "-" + pad2(value.getMonth() + 1);
        }
        var match = String(value || "").trim().match(/^(\d{4})-(\d{2})/);
        return match ? match[0] : "";
    }

    function buildDailyRows() {
        var dailyCosts = getDailyCosts();
        return Object.keys(dailyCosts).sort().map(function (dateStr) {
            var d = dailyCosts[dateStr];
            var sales = getSalesForDate(dateStr);
            var dairy = Number(d.dairy || 0), veggies = Number(d.veggies || 0), raw = Number(d.raw || 0), misc = Number(d.misc || 0);
            var totalCost = dairy + veggies + raw + misc;
            return { Date: dateStr, Sales: sales, Dairy: dairy, Veggies: veggies, "Raw Materials": raw, Miscellaneous: misc, "Total Cost": totalCost, "Net Profit": sales - totalCost };
        });
    }

    function buildMonthlyRows() {
        var monthlyFixed = getMonthlyFixed();
        return Object.keys(monthlyFixed).sort().map(function (monthStr) {
            var m = monthlyFixed[monthStr];
            var elec = Number(m.electricity || 0), water = Number(m.water || 0), staff = Number(m.staff || 0), gas = Number(m.gas || 0);
            return { Month: monthStr, Electricity: elec, Water: water, Staff: staff, Gas: gas, "Total Fixed Cost": elec + water + staff + gas };
        });
    }

    function buildMasterRows() {
        var months = {};
        getOrders().forEach(function (o) { var m = String(o.time || "").slice(0, 7); if (m) { months[m] = true; } });
        var dailyCosts = getDailyCosts();
        Object.keys(dailyCosts).forEach(function (d) { var m = d.slice(0, 7); if (m) { months[m] = true; } });
        var monthlyFixed = getMonthlyFixed();
        Object.keys(monthlyFixed).forEach(function (m) { if (m) { months[m] = true; } });

        return Object.keys(months).sort().map(function (monthStr) {
            var sales = getSalesForMonth(monthStr);
            var items = getItemsForMonth(monthStr);
            var materialCost = Object.keys(dailyCosts).filter(function (d) { return d.slice(0, 7) === monthStr; })
                .reduce(function (sum, d) { var e = dailyCosts[d]; return sum + Number(e.dairy || 0) + Number(e.veggies || 0) + Number(e.raw || 0) + Number(e.misc || 0); }, 0);
            var fixedEntry = monthlyFixed[monthStr] || {};
            var fixedCost = Number(fixedEntry.electricity || 0) + Number(fixedEntry.water || 0) + Number(fixedEntry.staff || 0) + Number(fixedEntry.gas || 0);
            var totalCost = materialCost + fixedCost;
            return { Month: monthStr, Sales: sales, "Items Sold": items, "Material Cost": materialCost, "Fixed Cost": fixedCost, "Total Cost": totalCost, "Net Profit": sales - totalCost };
        });
    }

    // One row per order line so the sheet stays readable and re-importable
    function buildOrderRows() {
        var rows = [];
        getOrders().forEach(function (order) {
            var items = Array.isArray(order.items) && order.items.length ? order.items : [{ name: "", price: 0, qty: 0 }];
            items.forEach(function (item) {
                rows.push({
                    "Order ID": order.id || "",
                    "Date Time": order.time || "",
                    Table: order.table || "",
                    "Customer Name": order.customerName || "",
                    "Customer Phone": order.customerPhone || "",
                    "Payment Type": order.paymentType || "",
                    Item: item.name || "",
                    Qty: Number(item.qty || 0),
                    Price: Number(item.price || 0),
                    "Order Total": Number(order.total || 0),
                    "Order Cost": Number(order.cost || 0)
                });
            });
        });
        return rows;
    }

    function buildCustomerRows() {
        return getRegularCustomers().map(function (profile) {
            return {
                Name: profile.name || "",
                Phone: profile.phone || "",
                "Payment Type": profile.paymentType || "",
                "Updated At": profile.updatedAt || ""
            };
        });
    }

    function buildMenuRows() {
        return loadMenuItems().map(function (item) {
            return { item_name: item.name, selling_price: Number(item.price || 0), raw_cost: Number(item.cost || 0) };
        });
    }

    function buildSettingsRows() {
        var settings = getSettings();
        return [
            { Setting: "Message Language", Value: settings.language || "en" }
        ];
    }

    function appendSheet(workbook, name, rows) {
        if (!rows.length) {
            return;
        }
        window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.json_to_sheet(rows), name);
    }

    window.exportDataWorkbook = function () {
        if (!ensureXlsxReady()) { return; }

        var wb = window.XLSX.utils.book_new();
        appendSheet(wb, DATA_SHEETS.daily, buildDailyRows());
        appendSheet(wb, DATA_SHEETS.monthly, buildMonthlyRows());
        appendSheet(wb, DATA_SHEETS.customers, buildCustomerRows());
        appendSheet(wb, DATA_SHEETS.orders, buildOrderRows());
        appendSheet(wb, DATA_SHEETS.menu, buildMenuRows());
        appendSheet(wb, DATA_SHEETS.settings, buildSettingsRows());

        if (!wb.SheetNames.length) {
            window.alert("Nothing to export yet.");
            return;
        }

        downloadWorkbook("cafe-vibes-data-workbook.xlsx", wb);
        updateAdminStatus("data-workbook-status", "Data workbook exported with " + wb.SheetNames.length + " sheet(s).");
    };

    function importDailySheet(workbook) {
        var sheetName = findSheetName(workbook, "daily");
        if (!sheetName) { return 0; }

        var rows = sheetToObjects(workbook, sheetName);
        var dailyCosts = getDailyCosts();
        var count = 0;

        rows.forEach(function (row) {
            var dateStr = toDateKey(pickField(row, ["Date", "date", "DATE"]));
            if (!dateStr) { return; }
            dailyCosts[dateStr] = {
                dairy: Number(pickField(row, ["Dairy", "dairy"]) || 0),
                veggies: Number(pickField(row, ["Veggies", "veggies", "Vegetables"]) || 0),
                raw: Number(pickField(row, ["Raw Materials", "raw", "Raw"]) || 0),
                misc: Number(pickField(row, ["Miscellaneous", "misc", "Misc"]) || 0)
            };
            count += 1;
        });

        if (count) { saveDailyCosts(dailyCosts); }
        return count;
    }

    function importMonthlySheet(workbook) {
        var sheetName = findSheetName(workbook, "monthly");
        if (!sheetName) { return 0; }

        var rows = sheetToObjects(workbook, sheetName);
        var monthlyFixed = getMonthlyFixed();
        var count = 0;

        rows.forEach(function (row) {
            var monthStr = toMonthKey(pickField(row, ["Month", "month", "MONTH"]));
            if (!monthStr) { return; }
            monthlyFixed[monthStr] = {
                electricity: Number(pickField(row, ["Electricity", "electricity"]) || 0),
                water: Number(pickField(row, ["Water", "water"]) || 0),
                staff: Number(pickField(row, ["Staff", "staff"]) || 0),
                gas: Number(pickField(row, ["Gas", "gas"]) || 0)
            };
            count += 1;
        });

        if (count) { saveMonthlyFixed(monthlyFixed); }
        return count;
    }

    function importOrdersSheet(workbook) {
        var sheetName = findSheetName(workbook, "orders");
        if (!sheetName) { return 0; }

        var rows = sheetToObjects(workbook, sheetName);
        if (!rows.length) { return 0; }

        var grouped = {};
        var order = [];

        rows.forEach(function (row) {
            var orderId = String(pickField(row, ["Order ID", "order_id", "id"]) || "").trim();
            if (!orderId) { return; }

            if (!grouped[orderId]) {
                var timeValue = pickField(row, ["Date Time", "Time", "time"]);
                grouped[orderId] = {
                    id: orderId,
                    time: timeValue instanceof Date ? timeValue.toISOString() : String(timeValue || ""),
                    total: Number(pickField(row, ["Order Total", "total"]) || 0),
                    cost: Number(pickField(row, ["Order Cost", "cost"]) || 0),
                    table: String(pickField(row, ["Table", "table"]) || ""),
                    customerName: String(pickField(row, ["Customer Name", "customerName"]) || ""),
                    customerPhone: String(pickField(row, ["Customer Phone", "customerPhone"]) || ""),
                    paymentType: String(pickField(row, ["Payment Type", "paymentType"]) || ""),
                    items: []
                };
                order.push(orderId);
            }

            var itemName = String(pickField(row, ["Item", "item", "item_name"]) || "").trim();
            if (itemName) {
                grouped[orderId].items.push({
                    itemId: slug(itemName),
                    name: itemName,
                    price: Number(pickField(row, ["Price", "price"]) || 0),
                    qty: Number(pickField(row, ["Qty", "qty", "Quantity"]) || 0)
                });
            }
        });

        var existing = getOrders();
        var seen = {};
        existing.forEach(function (o) { seen[o.id] = true; });

        var added = 0;
        order.forEach(function (orderId) {
            if (seen[orderId]) { return; }
            existing.push(grouped[orderId]);
            added += 1;
        });

        if (added) {
            existing.sort(function (a, b) { return String(a.time).localeCompare(String(b.time)); });
            saveOrders(existing);
        }
        return added;
    }

    function importCustomersSheet(workbook) {
        var sheetName = findSheetName(workbook, "customers");
        if (!sheetName) { return 0; }

        var rows = sheetToObjects(workbook, sheetName);
        var customers = getRegularCustomers();
        var count = 0;

        rows.forEach(function (row) {
            var phone = String(pickField(row, ["Phone", "phone", "Customer Phone", "Mobile"]) || "").trim();
            var name = String(pickField(row, ["Name", "name", "Customer Name"]) || "").trim();
            var id = phone.replace(/\D/g, "");

            if (!id || !name) { return; }

            var profile = {
                id: id,
                phone: phone,
                name: name,
                paymentType: String(pickField(row, ["Payment Type", "paymentType"]) || ""),
                updatedAt: new Date().toISOString()
            };

            var index = -1;
            customers.forEach(function (saved, position) {
                if (saved.id === id) { index = position; }
            });

            if (index >= 0) {
                customers[index] = profile;
            } else {
                customers.unshift(profile);
            }
            count += 1;
        });

        if (count) { saveRegularCustomers(customers); }
        return count;
    }

    function importSettingsSheet(workbook) {
        var sheetName = findSheetName(workbook, "settings");
        if (!sheetName) { return 0; }

        var rows = sheetToObjects(workbook, sheetName);
        if (!rows.length) { return 0; }

        var settings = getSettings();
        var count = 0;

        rows.forEach(function (row) {
            var key = String(pickField(row, ["Setting", "setting", "Key", "key"]) || "").trim().toLowerCase();
            var value = String(pickField(row, ["Value", "value"]) || "").trim();
            if (!key) { return; }

            if (key === "message language" || key === "language") {
                settings.language = value === "mr" ? "mr" : "en";
                count += 1;
            }
            // Admin password is never restored from a spreadsheet.
        });

        if (count) { saveSettings(settings); }
        return count;
    }

    function importMenuSheet(workbook) {
        var sheetName = findSheetName(workbook, "menu");
        if (!sheetName) { return 0; }

        var before = pageState.menuItems.length;
        var items = parseMenuExcelWorkbook({ SheetNames: [sheetName], Sheets: workbook.Sheets });
        if (!items.length) { return 0; }

        mergeMenuItems(items);
        return pageState.menuItems.length - before;
    }

    function updateImportStatus(message) {
        updateAdminStatus("data-workbook-status", message);
        updateAdminStatus("admin-menu-status", message);
    }

    window.importDataWorkbook = function () {
        if (!ensureXlsxReady()) { return; }

        var picker = document.createElement("input");
        picker.type = "file";
        picker.accept = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        picker.addEventListener("change", function () {
            var file = picker.files && picker.files[0];
            if (!file) { return; }

            var reader = new FileReader();
            reader.onload = function () {
                var workbook;
                try {
                    workbook = window.XLSX.read(reader.result, { type: "array", cellDates: true });
                } catch (_error) {
                    updateImportStatus("Could not read that file. Please pick a valid Excel workbook.");
                    return;
                }

                var summary = [];
                var daily = importDailySheet(workbook);
                if (daily) { summary.push(daily + " daily entries"); }
                var monthly = importMonthlySheet(workbook);
                if (monthly) { summary.push(monthly + " monthly cost entries"); }
                var orders = importOrdersSheet(workbook);
                if (orders) { summary.push(orders + " orders"); }
                var customers = importCustomersSheet(workbook);
                if (customers) { summary.push(customers + " regular customers"); }
                var menuAdded = importMenuSheet(workbook);
                if (menuAdded > 0) { summary.push(menuAdded + " new menu items"); }
                var settings = importSettingsSheet(workbook);
                if (settings) { summary.push("settings"); }

                if (!summary.length) {
                    updateImportStatus("No matching sheets found. Use sheet names like \"Buisness Data per day\", \"Buisness Data per month\", \"" + DATA_SHEETS.customers + "\", \"" + DATA_SHEETS.menu + "\" or \"" + DATA_SHEETS.settings + "\".");
                    return;
                }

                renderAdminMenuList();
                loadAdminSettingsForm();
                renderRegularCustomers();
                renderDailyLog();
                renderMonthlyLog();
                renderMasterDashboard();
                updateAnalyticsSummary();

                updateImportStatus("Imported " + summary.join(", ") + ".");
            };
            reader.readAsArrayBuffer(file);
        });

        picker.click();
    };

    window.exportDailyLog = function () {
        if (!ensureXlsxReady()) { return; }
        var rows = buildDailyRows();
        if (!rows.length) { window.alert("No daily entries to export."); return; }
        var wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(rows), DATA_SHEETS.daily);
        downloadWorkbook("cafe-vibes-daily-log.xlsx", wb);
    };

    window.exportMonthlyLog = function () {
        if (!ensureXlsxReady()) { return; }
        var rows = buildMonthlyRows();
        if (!rows.length) { window.alert("No monthly fixed cost entries to export."); return; }
        var wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(rows), DATA_SHEETS.monthly);
        downloadWorkbook("cafe-vibes-monthly-costs.xlsx", wb);
    };

    window.exportMasterDashboard = function () {
        if (!ensureXlsxReady()) { return; }
        var rows = buildMasterRows();
        if (!rows.length) { window.alert("No data to export."); return; }
        var wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(rows), DATA_SHEETS.master);
        downloadWorkbook("cafe-vibes-master-dashboard.xlsx", wb);
    };

    document.addEventListener("DOMContentLoaded", function () {
        if (document.getElementById("menu-container")) {
            setupOrderPage();
        }
        if (document.getElementById("summary-total-sales")) {
            setupAnalyticsPage();
        }
    });
})();
