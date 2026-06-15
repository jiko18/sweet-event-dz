const API_BASE = '/api';
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. الوضع المظلم (Dark Mode)
    // ==========================================
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        function applyTheme(isDark, iconElement) {
            if (isDark) {
                document.body.classList.add("dark-mode");
            } else {
                document.body.classList.remove("dark-mode");
            }
            if (iconElement) {
                if (isDark) {
                    iconElement.classList.replace("fa-moon", "fa-sun");
                } else {
                    iconElement.classList.replace("fa-sun", "fa-moon");
                }
            }
            localStorage.setItem("theme", isDark ? "dark" : "light");
        }

        const newBtn = themeToggle.cloneNode(true);
        themeToggle.parentNode.replaceChild(newBtn, themeToggle);

        const finalToggle = document.getElementById("themeToggle");
        const finalIcon = document.getElementById("themeIcon");

        const savedTheme = localStorage.getItem("theme") || "light";
        applyTheme(savedTheme === "dark", finalIcon);

        finalToggle.addEventListener("click", () => {
            const currentlyDark = document.body.classList.contains("dark-mode");
            applyTheme(!currentlyDark, finalIcon);
            showToast(!currentlyDark ? "🌙 الوضع المظلم مفعّل" : "☀️ الوضع المضيء مفعّل");
        });
    }

    // ==========================================
    // 1.5. تفعيل أيقونة المستخدم (حسابي / تسجيل الدخول)
    // ==========================================
 const accountBtn = document.getElementById('accountBtn');

if (accountBtn) {
    accountBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('sweet_event_token');
        
        if (token) {
            // قبل التوجيه.. نتحقق بسرعة إذا كان التوكن فعالاً
            try {
                const res = await fetch(`${API_BASE}/user`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    // التوكن سليم -> توجه للبروفايل
                    const userData = JSON.parse(localStorage.getItem('sweet_event_user') || '{}');
                    window.location.href = (userData.role === 'admin') ? '/admin' : '/profile';
                } else {
                    // التوكن منتهي -> احذفه وافتح نافذة الدخول
                    throw new Error('Expired');
                }
            } catch (err) {
                localStorage.removeItem('sweet_event_token');
                localStorage.removeItem('sweet_event_user');
                openAuthModal(false);
            }
        } else {
            // لا يوجد توكن أصلاً -> افتح نافذة الدخول
            openAuthModal(false);
        }
    });
}

// دالة محسنة لفتح النافذة أو التوجه للرئيسية إذا لم تكن موجودة
function openAuthModal(showRegister = false) {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('active');
        document.getElementById('loginForm').style.display = showRegister ? 'none' : 'block';
        document.getElementById('registerForm').style.display = showRegister ? 'block' : 'none';
    } else {
        // إذا كنت في صفحة فرعية (مثل الكيك) والنافذة غير موجودة، نرسله للرئيسية مع أمر فتح النافذة
        window.location.href = `/?action=${showRegister ? 'register' : 'login'}`;
    }
}
  
// ==========================================
// دالة الترجمة المركزية الوحيدة (Centralized Translation)
// ==========================================
window.updateLanguage = function(lang) {
    
    // 1. حفظ اللغة في المتصفح (تم إخراجه من التعليق)
    localStorage.setItem('lang', lang);
    
    // 2. تغيير اتجاه الصفحة واللغة (مهم جداً للحفاظ على تصميم الموقع)
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";
    
    // 3. تحديث النص الظاهر على زر اللغة (إذا وجد)
    const langLabel = document.getElementById("langLabel");
    if (langLabel) langLabel.textContent = lang.toUpperCase();
    
    // 4. إطلاق حدث عام ليستمع له المحتوى الديناميكي في الصفحات الفرعية
    window.dispatchEvent(new CustomEvent('globalLanguageChanged', { detail: { lang } }));

    // ========================================================
    // ⬅️ إيقاف كود القاموس القديم هنا لتجنب التعارض مع ترجمة جوجل
    // ========================================================
    return; 

    // الأكواد التالية لن يتم تنفيذها بفضل أمر return السابق
    // 5. ترجمة العناصر الثابتة (data-lang)
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        if (window.translations[lang] && window.translations[lang][key]) {
            const value = window.translations[lang][key];
            if (/<\/?[a-z][\s\S]*>/i.test(value)) {
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        }
    });
    
    // 6. ترجمة الحقول النائبة (data-lang-placeholder)
    document.querySelectorAll("[data-lang-placeholder]").forEach(el => {
        const key = el.getAttribute("data-lang-placeholder");
        if (window.translations[lang] && window.translations[lang][key]) {
            el.placeholder = window.translations[lang][key];
        }
    });
};
// ==========================================
// استعادة اللغة المحفوظة عند تحميل الصفحة
// ==========================================
const savedLanguage = localStorage.getItem('lang') || 'ar';
window.updateLanguage(savedLanguage);

// ==========================================
// زر الترجمة الدائري (التحكم في جوجل المخفي)
// ==========================================
const languages = ['ar', 'fr', 'en'];
const langLabels = { 'ar': 'AR', 'fr': 'FR', 'en': 'EN' };
let currentIndex = 0; // اللغة الافتراضية

// التحقق من اللغة الحالية لضبط الزر عند فتح الصفحة
const cookieMatch = document.cookie.match(/googtrans=\/[a-z]{2}\/([a-z]{2})/);
if (cookieMatch && cookieMatch[1]) {
    const activeLang = cookieMatch[1];
    if (languages.includes(activeLang)) {
        currentIndex = languages.indexOf(activeLang);
    }
}

const langBtn = document.getElementById('customLangBtn');

if (langBtn) {
    // عرض اسم اللغة الحالية على الزر
    langBtn.innerText = langLabels[languages[currentIndex]];

    // التبديل عند الضغط
    langBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % languages.length;
        const targetLang = languages[currentIndex];
        
        langBtn.innerText = langLabels[targetLang];

        // تغيير لغة جوجل برمجياً
        const googleSelect = document.querySelector('select.goog-te-combo');
        if (googleSelect) {
            googleSelect.value = targetLang;
            googleSelect.dispatchEvent(new Event('change'));
        } else {
            document.cookie = `googtrans=/ar/${targetLang}; path=/;`;
            window.location.reload();
        }
    });
}
// ==========================================
// باقي الكود الخاص بالمشروع (CartManager، Auth، إلخ)...
// ==========================================
// ... (هنا باقي الكود الأصلي من script.js الخاص بإدارة السلة والمصادقة وكل شيء)
// ولكن يجب ألا نكرر تعريف updateLanguage مرة أخرى.
// نكتفي بإدراج الباقي كما هو مع التأكد من عدم وجود تعارض.
    // ==========================================
    // 📡 إعدادات المصادقة والجلسات
    // ==========================================
    const AUTH_TOKEN_KEY = 'sweet_event_token';
    const USER_DATA_KEY = 'sweet_event_user';
    let currentUser = null;

    function saveToken(token) { localStorage.setItem(AUTH_TOKEN_KEY, token); }
    function getToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
    function removeToken() { localStorage.removeItem(AUTH_TOKEN_KEY); }

    function saveUserData(user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
    function removeUserData() { localStorage.removeItem(USER_DATA_KEY); }

    // دالة استعادة الجلسة لجلب AvatarUrl و Role
    async function restoreSession() {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const detailsRes = await fetch(`${API_BASE}/user/details`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const detailsData = await detailsRes.json();
                if (detailsData.success) {
                    const userInfo = {
                        username: detailsData.user.Username,
                        email: detailsData.user.Email,
                        phone: detailsData.user.Phone,
                        lastname: detailsData.user.LastName,
                        avatarUrl: detailsData.user.AvatarUrl || null,
                        role: detailsData.user.Role
                    };
                    saveUserData(userInfo);
                    currentUser = userInfo;
                } else {
                    const basic = await res.json();
                    currentUser = { username: basic.username, email: basic.email, role: basic.role };
                }
                updateHeaderUI();
            } else {
                removeToken();
                removeUserData();
                currentUser = null;
                updateHeaderUI();
            }
        } catch (e) {
            console.warn('تعذر استعادة الجلسة:', e);
        }
    }

    // 1. الدالة المسؤولة عن تحديث الهيدر
    // 1. الدالة المسؤولة عن تحديث الهيدر
function updateHeaderUI() {
    const userGreeting = document.getElementById('userGreetingContainer');
    const registerBtn = document.getElementById('mainRegisterBtn');
    const currentAccountBtn = document.getElementById('accountBtn');

    if (currentUser) {
        if (userGreeting) {
            let avatarHtml = '';
            if (currentUser.avatarUrl) {
                avatarHtml = `<img src="${currentUser.avatarUrl}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; margin-left:8px;" alt="Avatar">`;
            }
            userGreeting.innerHTML = `
                <span style="display:inline-flex; align-items:center; gap:6px; color:var(--gold); cursor:pointer; text-decoration:underline;" id="profileLink" title="الملف الشخصي">
                    ${avatarHtml} ${currentUser.username}
                </span>
            `;
            const profileLink = document.getElementById('profileLink');
            if (profileLink) {
                profileLink.addEventListener('click', () => {
                    if (currentUser.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                         window.location.href = '/profile';
                    }
                });
            }
        }
        if (registerBtn) registerBtn.style.display = 'none';
        
        // التعديل هنا: جعل الزر يوجه للبروفايل بدل تسجيل الخروج
        if (currentAccountBtn) {
            currentAccountBtn.innerHTML = '<i class="fa-solid fa-user"></i>';
            currentAccountBtn.title = 'حسابي';
            const newBtn = currentAccountBtn.cloneNode(true);
            currentAccountBtn.parentNode.replaceChild(newBtn, currentAccountBtn);
            newBtn.addEventListener('click', () => {
                if (currentUser.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                     window.location.href = '/profile';
                }
            });
        }
    } else {
        if (userGreeting) userGreeting.innerHTML = '';
        if (registerBtn) registerBtn.style.display = '';
        if (currentAccountBtn) {
            currentAccountBtn.innerHTML = '<i class="fa-regular fa-user"></i>';
            currentAccountBtn.title = 'التسجيل لحسابك';
            const newBtn = currentAccountBtn.cloneNode(true);
            currentAccountBtn.parentNode.replaceChild(newBtn, currentAccountBtn);
            newBtn.addEventListener('click', () => openAuthModal(false));
        }
    }
}

    function logout() {
        removeToken();
        removeUserData();
        currentUser = null;
        if (window.CartManager) {
            window.CartManager.clearCart();
        } else {
            localStorage.removeItem('sweet_global_cart');
        }
        updateHeaderUI();
        closeAuthModal();
        showToast('تم تسجيل الخروج بنجاح');
    }
// دالة جلب وعرض التقييمات المعتمدة في صفحة reviews.html مع الصورة الشخصية للمستخدم
async function displayLiveReviews() {
    const container = document.getElementById('dynamicReviewsContainer');
    if (!container) return; // للتأكد من أننا متواجدون في صفحة التقييمات فعلاً وليس صفحة أخرى

    try {
        const res = await fetch('/api/reviews/approved'); // الـ API الخاص بجلب التقييمات المقبولة فقط
        const data = await res.json();

        if (data.success && data.reviews) {
            container.innerHTML = ''; // تفريغ الحاوية

            data.reviews.forEach(review => {
                // الفحص: إذا كان المستخدم مسجلاً ولديه صورة حساب شخصي نستخدمها، وإلا نضع أيقونة مستخدم افتراضية فاخرة
                const userAvatar = (review.user && review.user.profilePic) 
                    ? review.user.profilePic 
                    : 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'; 

                container.innerHTML += `
                    <div class="gallery-review-card">
                        <div class="img-container">
                            <img src="${userAvatar}" alt="${review.userName}" class="user-avatar-img">
                            <span class="category-tag">${review.category || 'تقييم عام'}</span>
                        </div>
                        <div class="card-info">
                            <div class="user-meta">
                                <h4>${review.userName}</h4>
                                <span class="review-date">${review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-DZ') : 'منذ فترة'}</span>
                            </div>
                            <div class="card-stars">
                                ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                            </div>
                            <p>"${review.comment}"</p>
                        </div>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.error("حدث خطأ أثناء جلب التقييمات المعتمدة للموقع:", err);
    }
}

// تشغيل الدالة فور تحميل مستند الصفحة
// تشغيل الدالة
displayLiveReviews();
    // 2. دالة تسجيل الدخول (مع التوجيه حسب role)
    async function performLogin(email, password, redirectAfter = false) {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (data.success) {
                saveToken(data.token);
                const userInfo = {
                    username: data.user.username,
                    email: data.user.email,
                    phone: data.user.phone,
                    lastname: data.user.lastname,
                    role: data.user.role
                };
                saveUserData(userInfo);
                currentUser = userInfo;
                
                try {
                    await restoreSession();
                } catch (sessionError) {
                    console.warn("تنبيه: تعذر جلب تفاصيل الجلسة الإضافية.", sessionError);
                }
                
                updateHeaderUI();
                closeAuthModal();
                
                showToast(`مرحباً ${data.user.username}، تم تسجيل الدخول بنجاح!`);
                
                if (redirectAfter) {
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                         window.location.href = '/profile';
                    }
                }
                return true;
            } else {
                alert(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
                return false;
            }
        } catch (e) {
            console.error("خطأ فعلي في الاتصال:", e);
            alert('تعذر الاتصال بالسيرفر، تأكد من تشغيل الخادم.');
            return false;
        }
    }

    async function performRegister(userData) {
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('registerForm').style.display = 'none';
                return true;
            } else {
                alert(data.error || 'فشل في إنشاء الحساب');
                return false;
            }
        } catch (e) {
            console.error("خطأ في الاتصال بالسيرفر أثناء التسجيل:", e);
            alert('تعذر الاتصال بالسيرفر');
            return false;
        }
    }

    // ==================================================
    // دالة حفظ الطلب (محسّنة لدعم قراءة المتغيرات بكلا الاسمين)
    // ==================================================
    async function saveOrderToDB(orderData) {
        const token = getToken();
        if (!token) {
            console.warn('لا يوجد رمز دخول، لن يتم حفظ الطلب في قاعدة البيانات');
            return false;
        }
        try {
            const items = orderData.items.map(item => ({
                productId: item.productId || item.id,
                quantity: item.quantity || item.qty,
                unitPrice: item.unitPrice || item.price
            }));

            const payload = {
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                customerEmail: orderData.customerEmail || null,
                eventDate: orderData.eventDate || null,
                deliveryAddress: orderData.deliveryAddress || null,  // تمت الإضافة
                notes: orderData.notes || null,
                items: items,
                totalAmount: orderData.totalAmount
            };

            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!data.success) {
                console.error('فشل حفظ الطلب:', data.error);
                return false;
            }
            console.log('تم حفظ الطلب بنجاح في قاعدة البيانات');
            return true;
        } catch(e) {
            console.error('تعذر حفظ الطلب في قاعدة البيانات', e);
            return false;
        }
    }

    // ==================================================
    // دالة مركزية لطلب المصادقة ثم حفظ الطلب
    // ==================================================
    let pendingOrderData = null;

    async function finalizeOrder(orderData) {
        const saved = await saveOrderToDB(orderData);
        if (saved) {
            alert('🎉 تم حفظ طلبك بنجاح! يمكنك تتبع حالته في ملفك الشخصي.');
            if (window.CartManager) window.CartManager.clearCart();
            setTimeout(() => {
                 window.location.href = '/profile';
            }, 1500);
            return true;
        } else {
            alert('⚠️ حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى أو الاتصال بنا.');
            return false;
        }
    }

 window.requestAuthAndSubmit = async function(orderData) {
        if (currentUser) {
            return finalizeOrder(orderData);
        } else {
            pendingOrderData = orderData;
            openAuthModal(false);
        }
    };
const originalPerformLogin = performLogin;
window.performLogin = async function(email, password, redirectAfter = false) {
    const success = await originalPerformLogin(email, password, redirectAfter);
    
    // إذا نجح تسجيل الدخول وكان هناك طلب معلق بانتظاره
    if (success && pendingOrderData) {
        
        // حقن بيانات العميل الحالية داخل الطلب المعلق
        pendingOrderData.customerName = `${currentUser.username} ${currentUser.lastname || ''}`.trim();
        pendingOrderData.customerPhone = currentUser.phone || 'غير متوفر';
        pendingOrderData.customerEmail = currentUser.email || null;
        
        const orderCopy = {...pendingOrderData};
        pendingOrderData = null; // تفريغ المتغير
        
        // استكمال إرسال الطلب لقاعدة البيانات
        await finalizeOrder(orderCopy);
    }
    return success;
};
    const originalPerformRegister = performRegister;
    window.performRegister = async function(userData) {
        const success = await originalPerformRegister(userData);
        if (success && pendingOrderData) {
            const loginSuccess = await window.performLogin(userData.email, userData.password, false);
            if (loginSuccess && pendingOrderData) {
                const orderCopy = {...pendingOrderData};
                pendingOrderData = null;
                await finalizeOrder(orderCopy);
            }
        }
        return success;
    };

    restoreSession();

    // ==========================================
    // 4. القائمة المتنقلة (Mobile Menu)
    // ==========================================
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // 5. حساب أسعار جدول الحلويات (Menu Page)
    const qtyInputs = document.querySelectorAll('.qty-input');
    if (qtyInputs.length > 0) {
        const updateGrandTotal = () => {
            let total = 0;
            document.querySelectorAll('.sweets-table tbody tr').forEach(row => {
                const priceEl = row.querySelector('.price');
                const qtyInput = row.querySelector('.qty-input');
                const totalCell = row.querySelector('.total-cell');
                if (priceEl && qtyInput && totalCell) {
                    const price = parseFloat(priceEl.textContent) || 0;
                    const qty = parseInt(qtyInput.value) || 0;
                    const rowTotal = price * qty;
                    totalCell.textContent = rowTotal;
                    total += rowTotal;
                }
            });
            const grandTotalEl = document.getElementById('grandTotal');
            if (grandTotalEl) grandTotalEl.textContent = total;
        };
        qtyInputs.forEach(input => input.addEventListener('input', updateGrandTotal));
        updateGrandTotal();
    }

    // 6. نظام حجز القاعات (chek.html)
    const hallSelect = document.getElementById('selectedHall');
    const hoursInput = document.getElementById('hoursCount');
    let estPrice = document.getElementById('estimatedPrice') || null;

    function updateEstimate() {
        if (hallSelect && hoursInput && estPrice) {
            const selectedOption = hallSelect.options[hallSelect.selectedIndex];
            const pricePerHour = selectedOption?.dataset?.price ? parseInt(selectedOption.dataset.price) : 0;
            const hours = parseInt(hoursInput.value) || 0;
            estPrice.textContent = pricePerHour * hours;
        }
    }

    if (hallSelect) hallSelect.addEventListener('change', updateEstimate);
    if (hoursInput) hoursInput.addEventListener('input', updateEstimate);

    document.querySelectorAll('.select-hall-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const hallName = this.dataset.hall;
            if (hallSelect) {
                for (let i = 0; i < hallSelect.options.length; i++) {
                    if (hallSelect.options[i].value === hallName) {
                        hallSelect.selectedIndex = i;
                        break;
                    }
                }
                updateEstimate();
                document.getElementById('bookingForm')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 7. معالجة إرسال النماذج العامة
    ['bookingForm', 'reviewForm', 'contact-form'].forEach(id => {
        const form = document.getElementById(id) || document.querySelector('.' + id);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('تم استلام طلبك بنجاح! شكراً لك.');
                this.reset();
                if (estPrice) estPrice.textContent = '0';
            });
        }
    });

    // 8. التمرير السلس
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                navLinks?.classList.remove('active');
            }
        });
    });

    // 9. الهيدر الزجاجي
    const header = document.querySelector('header');
    if (header) {
        header.classList.remove('header-hidden', 'hidden', 'hide-nav');
        header.style.transform = 'translateY(0)';
        header.style.display = '';

        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            header.classList.remove('header-hidden');
            header.style.transform = 'translateY(0)';
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (header.classList.contains('header-hidden')) {
                        header.classList.remove('header-hidden');
                        header.style.transform = 'translateY(0)';
                    }
                }
            });
        });
        observer.observe(header, { attributes: true });
    }

    // 10. تحديد الصفحة النشطة
    const currentLocation = window.location.pathname.split('/').pop();
    const navLinksList = document.querySelectorAll('nav ul li a.nav-link');
    navLinksList.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (currentLocation === linkHref || (currentLocation === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // ==========================================
    // 11. نظام النافذة المنبثقة للحساب
    // ==========================================
    const authModal = document.getElementById('authModal');
    const mainRegisterBtn = document.getElementById('mainRegisterBtn');

    function openAuthModal(showRegister = false) {
        if (!authModal) {
            window.location.href = '/?action=' + (showRegister ? 'register' : 'login');
            return;
        }
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm && registerForm) {
            authModal.classList.add('active');
            loginForm.style.display = showRegister ? 'none' : 'block';
            registerForm.style.display = showRegister ? 'block' : 'none';
        }
    }

    function closeAuthModal() {
        if (authModal) authModal.classList.remove('active');
    }

    if (mainRegisterBtn) {
        const newRegisterBtn = mainRegisterBtn.cloneNode(true);
        mainRegisterBtn.parentNode.replaceChild(newRegisterBtn, mainRegisterBtn);
        document.getElementById('mainRegisterBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal(true);
        });
    }

    if (authModal) {
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            document.getElementById('closeModal').addEventListener('click', closeAuthModal);
        }

        window.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });

        const showRegisterLink = document.getElementById('showRegister');
        const showLoginLink = document.getElementById('showLogin');
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('registerForm').style.display = 'block';
            });
        }
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('loginForm').style.display = 'block';
            });
        }

        const regPassword = document.getElementById('regPassword');
        const regConfirmPassword = document.getElementById('regConfirmPassword');
        const matchMsg = document.getElementById('passwordMatchMsg');
        if (regPassword && regConfirmPassword && matchMsg) {
            function checkMatch() {
                if (!regConfirmPassword.value) { matchMsg.textContent = ''; return; }
                if (regPassword.value === regConfirmPassword.value) {
                    matchMsg.textContent = '✓ كلمتا المرور متطابقتان';
                    matchMsg.style.color = '#27ae60';
                } else {
                    matchMsg.textContent = '✗ كلمتا المرور غير متطابقتين';
                    matchMsg.style.color = '#e74c3c';
                }
            }
            regPassword.addEventListener('input', checkMatch);
            regConfirmPassword.addEventListener('input', checkMatch);
        }

        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                if (!email || !password) return alert('أدخل البريد الإلكتروني وكلمة المرور');
                await window.performLogin(email, password, false);
            });
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const pwd = document.getElementById('regPassword').value;
                const conf = document.getElementById('regConfirmPassword').value;
                const username = document.getElementById('regUsername')?.value?.trim();
                const lastname = document.getElementById('regLastName')?.value?.trim();
                const phone1 = document.getElementById('regPhone1')?.value?.trim();
                const email = document.getElementById('regEmail')?.value?.trim();
                const wilaya = document.getElementById('regWilaya')?.value;

                if (!username || !lastname || !phone1 || !email || !pwd || !conf || !wilaya) {
                    alert('الرجاء ملء جميع الحقول المطلوبة.');
                    return;
                }
                if (pwd !== conf) {
                    alert('كلمات المرور غير متطابقة!');
                    return;
                }
                if (pwd.length < 6) {
                    alert('كلمة المرور يجب ألا تقل عن 6 أحرف.');
                    return;
                }
                const phoneRegex = /^0[5-7][0-9]{8}$/;
                if (!phoneRegex.test(phone1)) {
                    alert('رقم الهاتف الأساسي غير صالح.');
                    return;
                }

                await window.performRegister({ username, lastname, phone: phone1, email, password: pwd, wilaya });
            });
        }
    }

    const urlParamsPage = new URLSearchParams(window.location.search);
    if (urlParamsPage.get('action') === 'register' || urlParamsPage.get('action') === 'login') {
        setTimeout(() => openAuthModal(urlParamsPage.get('action') === 'register'), 200);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // ==========================================
    // 12. دالة Toast عامة
    // ==========================================
    window.showToast = function(msg) {
        const existing = document.querySelector('.toast-notify');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast-notify';
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    };

    // ==================================================
    // دالة تأكيد الطلب المباشر من السلة العامة (توجيه لصفحة الطلب)
    // ==================================================
    window.handleGlobalCartSubmit = async function() {
        const cartItems = window.CartManager.getCart();
        
        if (cartItems.length === 0) {
            showToast('🛒 سلتك فارغة! أضف منتجات أولاً.');
            return;
        }

        // إذا كان الزبون متواجداً بالفعل في صفحة الطلب (order.html)
        if (window.location.pathname.includes('order') || window.location.pathname.includes('order.html')) {
            if (typeof window.closeGlobalCartPopup === 'function') {
                window.closeGlobalCartPopup();
            }
            // النزول برفق إلى نموذج إدخال التاريخ والتأكيد
            document.getElementById('deliveryDateInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('الرجاء تحديد تاريخ التسليم وتأكيد الطلب من هنا.');
            return;
        }

        // إذا كان في صفحة أخرى، نقوم بتوجيهه إلى صفحة الطلب الشامل
        window.location.href = '/order'; // أو '/order.html' حسب إعدادات السيرفر لديك
    };


// =====================================================
    // نظام السلة العالمية المشتركة (النافذة + الزر العائم + الإدارة) - (نسخة مصححة ومستقرة)
    // =====================================================

    let cartCloseTimeout; // لمنع تداخل حركات الإغلاق والفتح

    // 1. دالة إنشاء وتجهيز نافذة السلة المنبثقة
    window.createGlobalCartPopup = function() {
        if (document.getElementById('globalCartPopup')) return;

        const popup = document.createElement('div');
        popup.id = 'globalCartPopup';
        popup.className = 'global-cart-popup-overlay';
        
        // حقن الـ CSS مباشرة لضمان عدم تأثره بأي أخطاء خارجية
        popup.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); z-index: 999999; justify-content: center; align-items: center; backdrop-filter: blur(5px);';

        popup.innerHTML = `
            <div class="global-cart-popup-content" id="cartPopupContent" style="background: var(--surface); width: 90%; max-width: 450px; padding: 20px; border-radius: 15px; border: 1px solid var(--gold); box-shadow: 0 10px 30px rgba(0,0,0,0.3); transform: translateY(-20px); opacity: 0; transition: all 0.3s ease; display: flex; flex-direction: column; direction: rtl;">
                <div class="global-cart-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: var(--gold); font-size: 1.2rem;"><i class="fa-solid fa-basket-shopping"></i> سلة المشتريات</h3>
                    <button class="close-popup-btn" onclick="window.closeGlobalCartPopup()" style="background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--text);">&times;</button>
                </div>
                
                <div id="globalCartItemsList" class="global-cart-items-list" style="max-height: 50vh; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
                </div>
                
                <div class="global-cart-summary" style="border-top: 2px dashed var(--border); padding-top: 15px; margin-bottom: 15px;">
                    <div class="summary-row" style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; color: var(--text);">
                        <span>إجمالي المشتريات:</span>
                        <span id="globalCartTotal" class="global-cart-total-price" style="color: var(--gold);">0 د.ج</span>
                    </div>
                </div>
                
                <div class="global-cart-actions">
                    <button id="globalCartSubmitBtn" class="btn-submit-master" style="width: 100%; border-radius: 8px; padding: 12px; font-size: 1rem; cursor: pointer; background: var(--gold); color: #000; border: none; font-weight: bold; transition: 0.3s;">
                        إرسال الطلب واستكمال البيانات <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);

        // إغلاق عند النقر في الخلفية
        popup.addEventListener('click', (e) => {
            if (e.target === popup) window.closeGlobalCartPopup();
        });
        
        // التوجيه عند الضغط على زر الإرسال
        document.getElementById('globalCartSubmitBtn').addEventListener('click', () => {
            window.closeGlobalCartPopup();
            if (typeof window.handleGlobalCartSubmit === 'function') {
                window.handleGlobalCartSubmit();
            } else {
                window.location.href = '/order.html';
            }
        });
    };

    // 2. دوال الفتح والإغلاق المعالجة
    window.closeGlobalCartPopup = function() {
        const popup = document.getElementById('globalCartPopup');
        const contentPanel = document.getElementById('cartPopupContent');
        if (contentPanel) {
            contentPanel.style.transform = 'translateY(-20px)';
            contentPanel.style.opacity = '0';
        }
        cartCloseTimeout = setTimeout(() => {
            if(popup) popup.style.display = 'none';
        }, 300);
    };

    window.openGlobalCartPopup = function() {
        clearTimeout(cartCloseTimeout); // إيقاف أي عملية إغلاق سابقة
        
        window.createGlobalCartPopup(); // التأكد من إنشائها
        if (window.CartManager) window.CartManager.updateCartPopupContent();
        
        const popup = document.getElementById('globalCartPopup');
        const contentPanel = document.getElementById('cartPopupContent');
        
        if(popup) {
            popup.style.display = 'flex';
            // فرض تحديث للشاشة (Reflow) لضمان عمل الأنيميشن
            void popup.offsetWidth; 
            
            if (contentPanel) {
                contentPanel.style.transform = 'translateY(0)';
                contentPanel.style.opacity = '1';
            }
        }
    };

    // 3. إنشاء الزر العائم (مُصلح لمنع فقدان الـ Event Listeners)
    window.createGlobalFloatingCart = function() {
        let floatCart = document.getElementById('floatingCartBtn');
        if (!floatCart) {
            floatCart = document.createElement('div');
            floatCart.id = 'floatingCartBtn';
            document.body.appendChild(floatCart);
            
            // ربط الأحداث مرة واحدة فقط عند الإنشاء
            floatCart.addEventListener('mouseover', () => floatCart.style.transform = 'scale(1.1)');
            floatCart.addEventListener('mouseout', () => floatCart.style.transform = 'scale(1)');
            floatCart.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // منع انتقال النقر لأي عنصر آخر
                window.openGlobalCartPopup();
            });
        }
        
        floatCart.style.cssText = `
            position: fixed; bottom: 30px; left: 30px; width: 62px; height: 62px;
            background: #c9963e; border-radius: 50%; display: none; align-items: center;
            justify-content: center; z-index: 999999; cursor: pointer;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3); transition: transform 0.3s, background 0.3s;
        `;
        
        // التحقق قبل الحقن لتجنب مسح العناصر النشطة
        if (!document.getElementById('floatBadge')) {
            // ملاحظة: إيقاف Pointer-events للأيقونة حتى يتم التقاط النقرة في الـ div فقط
            floatCart.innerHTML = `
                <i class="fa-solid fa-basket-shopping" style="color:#000; font-size:1.6rem; pointer-events: none;"></i>
                <span id="floatBadge" style="
                    position: absolute; top: -6px; right: -8px; background: #e74c3c;
                    color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 0.75rem;
                    display: flex; align-items: center; justify-content: center; font-weight: 700;
                    pointer-events: none;
                ">0</span>
            `;
        }
    };

    // 4. استرجاع بيانات السلة بأمان
    function getSafeCart() {
        try {
            const data = localStorage.getItem('sweet_global_cart');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            localStorage.removeItem('sweet_global_cart');
            return [];
        }
    }

 // 5. مدير السلة (CartManager)
window.CartManager = {
    cart: getSafeCart(),
    
    save() {
        this.cart = this.cart.filter(item => item && item.id != null);
        localStorage.setItem('sweet_global_cart', JSON.stringify(this.cart));
        this.dispatchUpdate();
    },

    addItem(item, category) {
        const itemId = item.id || item.productId; 
        const itemQty = parseInt(item.qty) || 1; 
        const existing = this.cart.find(i => (i.id == itemId || i.productId == itemId) && String(i.category) === String(category));
        
        if (existing) {
            existing.qty += itemQty;
        } else {
            this.cart.push({ ...item, id: itemId, productId: itemId, qty: itemQty, category });
        }
        this.save();
        showToast(`✅ تمت إضافة ${item.name} إلى السلة`);
    },

    removeItem(id, category) {
        const itemIndex = this.cart.findIndex(i => i.id == id && String(i.category) === String(category));
        if (itemIndex !== -1) {
            const removed = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.save(); 
            showToast(`🗑️ تمت إزالة ${removed.name} من السلة`);
        }
    },

    updateQty(id, category, delta) {
        const item = this.cart.find(i => i.id == id && String(i.category) === String(category));
        if (item) {
            item.qty += delta;
            if (item.qty <= 0) this.removeItem(id, category);
            else this.save();
        }
    },

    setQuantity(id, category, newQty) {
        const item = this.cart.find(i => i.id == id && String(i.category) === String(category));
        if (item) {
            if (newQty <= 0) this.removeItem(id, category);
            else {
                item.qty = newQty;
                this.save();
            }
        }
    },

    getCart() { return [...this.cart]; },
    getTotal() { return this.cart.reduce((s, i) => s + (i.price * i.qty), 0); },
    getCount() { return this.cart.reduce((s, i) => s + i.qty, 0); },
    
    clearCart() { 
        this.cart = []; 
        this.save(); 
        showToast('🗑️ تم إفراغ السلة بالكامل'); 
    },

    dispatchUpdate() {
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: this.cart }));
        this.updateUI();
    },

    bindCartEvents() {
        if (this._eventsBound) return;
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-qty-minus, .btn-qty-plus, .btn-remove-item');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();

            const id = btn.dataset.id;
            const cat = btn.dataset.cat;

            if (btn.classList.contains('btn-qty-minus')) this.updateQty(id, cat, -1);
            else if (btn.classList.contains('btn-qty-plus')) this.updateQty(id, cat, 1);
            else if (btn.classList.contains('btn-remove-item')) this.removeItem(id, cat);
        });
        this._eventsBound = true;
    },

    updateUI() {
        const count = this.getCount();
        
        const floatCart = document.getElementById('floatingCartBtn');
        const floatBadge = document.getElementById('floatBadge');
        if (floatCart) {
            floatCart.style.display = count > 0 ? 'flex' : 'none';
            if (floatBadge) {
                floatBadge.textContent = count;
                floatBadge.style.display = count > 0 ? 'flex' : 'none';
            }
        }

        const globalPopup = document.getElementById('globalCartPopup');
        if (count === 0 && globalPopup && globalPopup.style.display === 'flex') {
            window.closeGlobalCartPopup(); 
        }

        // إزالة الشرط الذي يمنع التحديث، لضمان تحديث السلة الجانبية دائماً
        this.updateCartPopupContent();
        this.bindCartEvents(); 
    },

    updateCartPopupContent() {
        // حاويات السلة المنبثقة العالمية
        const globalContainer = document.getElementById('globalCartItemsList');
        const globalTotalSpan = document.getElementById('globalCartTotal');
        
        // حاويات السلة الجانبية في صفحة الطلب (order.html)
        const sideContainer = document.getElementById('cartItemsList');
        const sideTotalSpan = document.getElementById('cartTotal');

        // إذا لم تكن أي من الحاويتين موجودة، نتوقف
        if (!globalContainer && !sideContainer) return;
        
        const cart = this.getCart();
        let html = '';
        let total = 0;

        if (cart.length === 0) {
            html = `<div style="text-align: center; padding: 2rem;"><i class="fa-solid fa-box-open" style="font-size: 3rem; color: var(--gold);"></i><p>سلتك فارغة حالياً</p></div>`;
            if (globalContainer) globalContainer.innerHTML = html;
            if (sideContainer) sideContainer.innerHTML = html;
            if (globalTotalSpan) globalTotalSpan.textContent = '0 د.ج';
            if (sideTotalSpan) sideTotalSpan.textContent = '0.00';
            return;
        }
        
        cart.forEach(item => {
            if (!item || isNaN(item.price)) return;
            total += item.price * item.qty;
            const itemImage = item.image || 'https://placehold.co/60x60?text=Image'; 
            
            html += `
                <div class="cart-item-mini" data-id="${item.id}" data-cat="${item.category}" style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--border); gap: 10px;">
                    <img src="${itemImage}" alt="${item.name}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0;">
                    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
                        <span style="font-weight:600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem;">${item.name}</span>
                        <span style="color: var(--gold); font-weight: bold; font-size: 0.85rem;">${item.price.toLocaleString()} دج</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
                        <button class="btn-qty-plus" data-id="${item.id}" data-cat="${item.category}" style="background: var(--surface); border: 1px solid var(--border); color: var(--text); width: 28px; height: 28px; border-radius: 50%; cursor: pointer;"><i class="fa-solid fa-plus" style="pointer-events: none; font-size: 0.7rem;"></i></button>
                        <input type="number" class="qty-input" value="${item.qty}" data-id="${item.id}" data-cat="${item.category}" min="1" style="width: 50px; text-align: center; font-weight: bold; color: var(--text); background: transparent; border: 1px solid var(--border); border-radius: 4px; font-size: 0.9rem; padding: 2px;">
                        <button class="btn-qty-minus" data-id="${item.id}" data-cat="${item.category}" style="background: var(--surface); border: 1px solid var(--border); color: var(--text); width: 28px; height: 28px; border-radius: 50%; cursor: pointer;"><i class="fa-solid fa-minus" style="pointer-events: none; font-size: 0.7rem;"></i></button>
                        <button class="btn-remove-item" data-id="${item.id}" data-cat="${item.category}" style="background: #e74c3c15; border: 1px solid #e74c3c; color: #e74c3c; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; margin-right: 5px;"><i class="fa-solid fa-trash-can" style="pointer-events: none; font-size: 0.8rem;"></i></button>
                    </div>
                </div>
            `;
        });
        
        if (globalContainer) globalContainer.innerHTML = html;
        if (sideContainer) sideContainer.innerHTML = html;
        
        if (globalTotalSpan) globalTotalSpan.textContent = total.toLocaleString() + ' د.ج';
        if (sideTotalSpan) sideTotalSpan.textContent = total.toLocaleString();

        this.bindCartEvents(); 
    }
};
// 6. التشغيل التلقائي عند تحميل الصفحة
window.createGlobalCartPopup();
createGlobalFloatingCart();
if (window.CartManager) {
    window.CartManager.updateUI();
}

// تم مسح أكواد التفعيل المكررة من هنا لمنع تضارب الأحداث
function syncCartPopupTheme() {
    const popup = document.getElementById('globalCartPopup');
    if (!popup) return;
    if (document.body.classList.contains('dark-mode')) {
        popup.classList.add('dark-mode');
    } else {
        popup.classList.remove('dark-mode');
    }
}
const themeObserver = new MutationObserver(() => syncCartPopupTheme());
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
syncCartPopupTheme();
    // ==================================================
    // دوال جلب المنتجات من الـ API
    // ==================================================
    async function fetchProductsByCategory(category) {
        try {
            const response = await fetch(`${API_BASE}/products?category=${category}`);
            const data = await response.json();
            if (data.success) {
                return data.products;
            } else {
                console.error(`فشل جلب ${category}:`, data.error);
                return [];
            }
        } catch (err) {
            console.error(`خطأ في جلب المنتجات لفئة ${category}:`, err);
            return [];
        }
    }
    window.fetchProductsByCategory = fetchProductsByCategory;
// ==================================================
    // 14. تكامل صفحة الطلب (order.html) - إصدار ديناميكي مع دعم قاعدة البيانات وإضافة عنوان التسليم
    // ==================================================
    const currentPath = window.location.pathname;
    if (currentPath.includes('order.html') || currentPath.endsWith('/order')) {
        initOrderPage();
    }

    async function initOrderPage() {
        let dynamicCakes = await fetchProductsByCategory('cake');
        let dynamicSweets = await fetchProductsByCategory('sweet');
        let dynamicHalls = await fetchProductsByCategory('hall');
        let dynamicDecorAddons = await fetchProductsByCategory('decor');
        let dynamicPhoto = await fetchProductsByCategory('photo');

function renderSimpleProducts(containerId, list, category) {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (!list.length) {
                container.innerHTML = '<div class="product-row">لا توجد منتجات متاحة</div>';
                return;
            }
            
            const safeEscapeHtml = (str) => {
                if (!str) return '';
                return str.replace(/[&<>]/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[m]));
            };

            container.innerHTML = list.map(p => {
                const mediaJson = p.MediaFiles ? safeEscapeHtml(p.MediaFiles) : '[]';
                let parsedMedia = [];
                try { parsedMedia = JSON.parse(p.MediaFiles || '[]'); } catch(e) {}
                
                const imgSrc = p.ImageUrl ? (p.ImageUrl.startsWith('http') ? p.ImageUrl : '/uploads/' + p.ImageUrl) : 'https://placehold.co/60x60?text=No+Image';

                // تمت إضافة data-image لزر الإضافة هنا
                return `
                <div class="product-row">
                    <div class="media-trigger" data-media="${mediaJson}" style="position:relative; cursor:pointer;">
                        <img src="${imgSrc}" 
                             class="product-thumb dynamic-product-img" 
                             data-media="${mediaJson}" 
                             onerror="this.src='https://placehold.co/60x60?text=No+Image'" 
                             alt="${safeEscapeHtml(p.Name)}">
                        ${parsedMedia.length > 1 ? '<i class="fa-solid fa-images" style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.7); color:#fff; font-size:0.5rem; padding:3px; border-radius:4px;"></i>' : ''}
                    </div>
                    <div class="product-details">
                        <div class="pname">${safeEscapeHtml(p.Name)}</div>
                        <div class="pdesc">${safeEscapeHtml(p.Description || '')}</div>
                    </div>
                    <span class="product-price-tag">${parseFloat(p.Price).toLocaleString()} دج</span>
                    <button class="btn-add-glass" data-id="${p.ProductId}" data-cat="${category}" data-name="${safeEscapeHtml(p.Name)}" data-price="${p.Price}" data-image="${imgSrc}"><i class="fa-solid fa-plus"></i> إضافة</button>
                </div>
            `}).join('');

            container.querySelectorAll('.btn-add-glass').forEach(btn => {
                btn.addEventListener('click', function() {
                    const product = {
                        productId: parseInt(this.dataset.id),
                        name: this.dataset.name,
                        price: parseFloat(this.dataset.price),
                        image: this.dataset.image // تمت إضافة تمرير الصورة للسلة هنا
                    };
                    window.CartManager.addItem(product, this.dataset.cat);
                    this.classList.add('added-flash');
                    this.innerHTML = '✓ تم';
                    setTimeout(() => {
                        this.classList.remove('added-flash');
                        this.innerHTML = '<i class="fa-solid fa-plus"></i> إضافة';
                    }, 800);
                });
            });

            container.querySelectorAll('.media-trigger').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    const mediaData = trigger.getAttribute('data-media');
                    if (mediaData) {
                        const mediaArray = JSON.parse(mediaData.replace(/&quot;/g, '"'));
                        if (mediaArray && mediaArray.length > 0) {
                            window.openProductGallery(mediaArray);
                        }
                    }
                });
            });

            if (window.startProductCarousels) window.startProductCarousels();
        }

        function renderDecorSection() {
            const container = document.getElementById('decorProducts');
            if (!container) return;

            let selectedHallsFromMap = [];
            try {
                const stored = localStorage.getItem('selectedHallsFromMap');
                if (stored) selectedHallsFromMap = JSON.parse(stored);
            } catch(e) {}

            let html = '';
            if (selectedHallsFromMap.length > 0) {
                html += `<div class="addons-title"><i class="fa-solid fa-map-pin"></i> 📍 الصالات المختارة من الخريطة</div>`;
                html += `<div class="selected-halls-preview">`;
                selectedHallsFromMap.forEach(h => {
                    const cartItems = CartManager.getCart();
                    const isInCart = cartItems.some(c => c.id == h.id);
                    // يجب أن نتأكد أن الصالات القادمة من الخريطة تحمل صورها إن وجدت
                    const hallImgSrcFromMap = h.image || 'https://placehold.co/100x100?text=Hall';
                    
                    html += `<div class="selected-hall-tag">
                        <span>${h.name} (${h.price.toLocaleString()} دج)</span>
                        ${!isInCart ? `<button class="btn-add-hall" style="padding:0.2rem 0.8rem; font-size:0.7rem;" data-id="${h.id}" data-name="${h.name}" data-price="${h.price}" data-image="${hallImgSrcFromMap}"><i class="fa-solid fa-cart-plus"></i> أضف</button>` : '<span style="color:var(--success);">✓ في السلة</span>'}
                        <span class="remove-tag" data-remove-map="${h.id}"><i class="fa-solid fa-times-circle"></i></span>
                    </div>`;
                });
             html += `</div><button class="btn-open-map" onclick="window.location.href='/map'"><i class="fa-solid fa-map-location-dot"></i> 🗺️ اختر صالة من الخريطة</button>`;
            } else {
                html += `<div class="addons-title"><i class="fa-solid fa-map-location-dot"></i> لم تختر أي صالة بعد</div>`;
                html += `<button class="btn-open-map" onclick="window.location.href='/map'"><i class="fa-solid fa-map"></i> اختر صالة من الخريطة</button>`;
            }

            html += `<div class="addons-title"><i class="fa-solid fa-building"></i> جميع الصالات المتاحة</div>`;
            dynamicHalls.forEach(h => {
                const isFromMap = selectedHallsFromMap.some(s => s.id == h.ProductId);
                const cartItems = CartManager.getCart();
                const isInCart = cartItems.some(c => c.id == h.ProductId);
                
                const hallImgSrc = h.ImageUrl ? (h.ImageUrl.startsWith('http') ? h.ImageUrl : '/uploads/' + h.ImageUrl) : 'https://placehold.co/100x100?text=Hall';

                // تمت إضافة data-image لزر إضافة الصالة
                html += `
                <div class="hall-card" style="${isFromMap ? 'border:2px solid var(--accent-gold);' : ''}">
                    <img src="${hallImgSrc}" class="hall-img" onerror="this.src='https://placehold.co/100x100?text=Hall'" alt="${h.Name}">
                    <div class="hall-info">
                        <h4>${h.Name} ${isFromMap ? '<span style="color:var(--accent-gold);font-size:0.7rem;">📍 مختارة</span>' : ''}</h4>
                        <div style="font-size:0.8rem; color:var(--text-soft);">${h.Description || ''}</div>
                        <div class="hall-meta">
                            <span><i class="fa-solid fa-tag"></i> ${parseFloat(h.Price).toLocaleString()} دج</span>
                        </div>
                        <div class="hall-actions">
                            <button class="btn-add-hall" data-id="${h.ProductId}" data-name="${h.Name}" data-price="${h.Price}" data-image="${hallImgSrc}"><i class="fa-solid fa-cart-plus"></i> ${isInCart ? 'أضف مجدداً' : 'أضف الصالة'}</button>
                        </div>
                    </div>
                </div>`;
            });

            html += `<div class="addons-title"><i class="fa-solid fa-paintbrush"></i> 🎨 إضافات ديكورية</div>`;
            dynamicDecorAddons.forEach(a => {
                const addonImgSrc = a.ImageUrl ? (a.ImageUrl.startsWith('http') ? a.ImageUrl : '/uploads/' + a.ImageUrl) : 'https://placehold.co/60x60?text=Decor';
                
                // تمت إضافة data-image لزر إضافة الديكور
                html += `
                <div class="product-row">
                    <img src="${addonImgSrc}" class="product-thumb" onerror="this.src='https://placehold.co/60x60?text=Decor'" alt="${a.Name}">
                    <div class="product-details">
                        <div class="pname">${a.Name}</div>
                        <div class="pdesc">${a.Description || ''}</div>
                    </div>
                    <span class="product-price-tag">${parseFloat(a.Price).toLocaleString()} دج</span>
                    <button class="btn-add-glass" data-id="${a.ProductId}" data-cat="decorAddon" data-name="${a.Name}" data-price="${a.Price}" data-image="${addonImgSrc}"><i class="fa-solid fa-plus"></i> إضافة</button>
                </div>`;
            });

            container.innerHTML = html;

            container.querySelectorAll('.btn-add-hall').forEach(btn => {
                btn.addEventListener('click', function() {
                    const product = {
                        productId: parseInt(this.dataset.id),
                        name: this.dataset.name,
                        price: parseFloat(this.dataset.price),
                        image: this.dataset.image // تمرير صورة الصالة للسلة
                    };
                    CartManager.addItem(product, 'hall');
                    this.classList.add('added-flash');
                    this.innerHTML = '✓ تم';
                    setTimeout(() => {
                        this.classList.remove('added-flash');
                        this.innerHTML = '<i class="fa-solid fa-cart-plus"></i> أضف الصالة';
                    }, 800);
                });
            });

            container.querySelectorAll('.btn-add-glass').forEach(btn => {
                btn.addEventListener('click', function() {
                    const product = {
                        productId: parseInt(this.dataset.id),
                        name: this.dataset.name,
                        price: parseFloat(this.dataset.price),
                        image: this.dataset.image // تمرير صورة إضافة الديكور للسلة
                    };
                    CartManager.addItem(product, 'decorAddon');
                    this.classList.add('added-flash');
                    this.innerHTML = '✓ تم';
                    setTimeout(() => {
                        this.classList.remove('added-flash');
                        this.innerHTML = '<i class="fa-solid fa-plus"></i> إضافة';
                    }, 800);
                });
            });

            container.querySelectorAll('.remove-tag').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.dataset.removeMap;
                    let stored = JSON.parse(localStorage.getItem('selectedHallsFromMap') || '[]');
                    const updated = stored.filter(h => h.id != id);
                    localStorage.setItem('selectedHallsFromMap', JSON.stringify(updated));
                    renderDecorSection();
                    CartManager.updateUI();
                    showToast('🗑️ تمت إزالة الصالة من المختارة');
                });
            });
        }
        // --- أضف هذه الأسطر هنا لاستدعاء الدوال ورسم المنتجات ---
        renderSimpleProducts('cakeProducts', dynamicCakes, 'cake');
        renderSimpleProducts('sweetsProducts', dynamicSweets, 'sweet');
        renderSimpleProducts('photoProducts', dynamicPhoto, 'photo');
        renderDecorSection();
        // ---------------------------------------------------------

        // التصحيح: استعادة الطلب المعلق (pendingOrder) - تم إصلاح الخطأ
        const pendingOrder = localStorage.getItem('pendingOrder');
        if (pendingOrder) {
            try {
                const data = JSON.parse(pendingOrder);
                if (data.customer) {
                    if (document.getElementById('custName')) document.getElementById('custName').value = data.customer.name || '';
                    if (document.getElementById('custPhone')) document.getElementById('custPhone').value = data.customer.phone || '';
                    if (document.getElementById('custEmail')) document.getElementById('custEmail').value = data.customer.email || '';
                    if (document.getElementById('custDate')) document.getElementById('custDate').value = data.customer.date || '';
                    if (document.getElementById('custNotes')) document.getElementById('custNotes').value = data.customer.notes || '';
                }
                if (data.cart && window.CartManager) {
                    data.cart.forEach(item => window.CartManager.addItem(item, item.category));
                }
                localStorage.removeItem('pendingOrder');
            } catch(e) {
                console.error('خطأ في استعادة الطلب المعلق:', e);
            }
        }
        CartManager.updateUI();

        // --- أضف هذا الكود لتفعيل فتح وإغلاق القوائم المنسدلة (Accordions) ---
        const accordionTriggers = document.querySelectorAll('.accordion-trigger');
        accordionTriggers.forEach(trigger => {
            trigger.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetAccordion = document.getElementById(targetId);
                
                if (targetAccordion) {
                    targetAccordion.classList.toggle('expanded');
                }
            });
        });
        
        // --- التأكد من وجود حقل عنوان التسليم في صفحة order.html ، وإضافته إذا لم يكن موجودًا ---
        let deliveryAddressField = document.getElementById('deliveryAddressInput');
        if (!deliveryAddressField) {
            const customerInfoSection = document.querySelector('.customer-info-section') || document.querySelector('#customerInfo');
            if (customerInfoSection) {
                const addressHtml = `
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="deliveryAddressInput" style="display: block; margin-bottom: 5px; font-weight: bold;">📍 عنوان التسليم <span style="color:red;">*</span></label>
                        <input type="text" id="deliveryAddressInput" placeholder="أدخل عنوان الشحن هنا..." style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text);" required>
                    </div>
                `;
                // إدراج الحقل قبل حقل الملاحظات أو في نهاية القسم
                const notesGroup = document.querySelector('#custNotes')?.closest('.form-group');
                if (notesGroup) {
                    notesGroup.insertAdjacentHTML('beforebegin', addressHtml);
                } else {
                    customerInfoSection.insertAdjacentHTML('beforeend', addressHtml);
                }
                deliveryAddressField = document.getElementById('deliveryAddressInput');
            }
        }
        
// --- تفعيل زر تأكيد الطلب في صفحة order.html مع إضافة عنوان التسليم ---
        const submitOrderBtn = document.getElementById('submitOrderBtn');
        if (submitOrderBtn) {
            submitOrderBtn.addEventListener('click', async () => {
                const cartItems = window.CartManager.getCart();

                // 1. التحقق من السلة
                if (cartItems.length === 0) {
                    showToast('🛒 سلتك فارغة! أضف منتجات أولاً.');
                    return;
                }

                // 2. التحقق من تاريخ التسليم
                const dateInput = document.getElementById('deliveryDateInput'); 
                const deliveryDate = dateInput ? dateInput.value : '';
                
                if (!deliveryDate) {
                    showToast('📋 الرجاء تحديد تاريخ التسليم أو موعد المناسبة أولاً.');
                    if (dateInput) dateInput.focus();
                    return;
                }

                const notesInput = document.getElementById('custNotes');
                const custNotes = notesInput ? notesInput.value : '';

                // ✨ [الإصلاح هنا]: جلب قيمة عنوان التسليم من الحقل بشكل آمن
                const addressInput = document.getElementById('deliveryAddressInput');
                const deliveryAddressVal = addressInput ? addressInput.value.trim() : '';

                // 3. إعداد بيانات الطلب الأساسية 
                const orderData = {
                    eventDate: deliveryDate,
                    deliveryAddress: deliveryAddressVal, // ✨ تم وضع القيمة المستخرجة هنا
                    notes: custNotes,
                    items: cartItems.map(item => ({
                        productId: item.productId || item.id,
                        quantity: item.qty,
                        unitPrice: item.price
                    })),
                    totalAmount: window.CartManager.getTotal()
                };

                // 4. التحقق من تسجيل الدخول
                if (typeof currentUser === 'undefined' || !currentUser) {
                    showToast('⚠️ لا يمكنك تأكيد الطلب، الرجاء تسجيل الدخول إلى حسابك أولاً.');
                    pendingOrderData = orderData;
                    setTimeout(() => {
                        if (typeof openAuthModal === 'function') {
                            openAuthModal(false); 
                        }
                    }, 1500); 
                    return;
                }

                // 5. إذا كان مسجلاً، نقوم بحقن بياناته في الطلب
                orderData.customerName = `${currentUser.username || ''} ${currentUser.lastname || ''}`.trim();
                orderData.customerPhone = currentUser.phone || 'غير متوفر';
                orderData.customerEmail = currentUser.email || null;

                // تعطيل الزر وإظهار حالة التحميل
                const originalText = submitOrderBtn.innerHTML;
                submitOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التأكيد...';
                submitOrderBtn.disabled = true;

                try {
                    const success = await saveOrderToDB(orderData);
                    if (success) {
                        window.CartManager.clearCart(); // إفراغ السلة
                        showToast('🎉 تم إرسال طلبك بنجاح! سيتم تحويلك لصفحتك الشخصية.');
                        setTimeout(() => {
                             window.location.href = '/profile';
                        }, 1500);
                    } else {
                        showToast('⚠️ حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى.');
                    }
                } catch (error) {
                    console.error(error);
                    showToast('⚠️ تعذر الاتصال بالخادم.');
                } finally {
                    submitOrderBtn.innerHTML = originalText;
                    submitOrderBtn.disabled = false;
                }
            });
        }
    } // <--- نهاية دالة initOrderPage
}); // <--- نهاية DOMContentLoaded

// ==========================================
// نظام التقليب التلقائي وعرض الوسائط المتعددة (المنتجات)
// ==========================================

// 1. التقليب التلقائي للصور (Staggered Auto-Carousel)
window.startProductCarousels = function() {
    const productImages = document.querySelectorAll('.dynamic-product-img');
    
    productImages.forEach((img, index) => {
        try {
            const mediaJson = img.getAttribute('data-media');
            if (!mediaJson) return;
            
            const mediaFiles = JSON.parse(mediaJson);
            // نستثني الفيديوهات من التقليب التلقائي ونعرض الصور فقط
            const imagesOnly = mediaFiles.filter(m => m.match(/\.(jpeg|jpg|gif|png|webp)$/i));

            if (imagesOnly.length > 1) {
                let currentIndex = 0;
                // استخدام الـ index لجعل التقليب يبدأ في أوقات مختلفة (تجنب تغير كل الصور في نفس اللحظة)
                setTimeout(() => {
                    setInterval(() => {
                        currentIndex = (currentIndex + 1) % imagesOnly.length;
                        // تأثير خفوت بسيط
                        img.style.transition = "opacity 0.4s ease";
                        img.style.opacity = "0.7";
                        
                        setTimeout(() => {
                            img.src = imagesOnly[currentIndex];
                            img.style.opacity = "1";
                        }, 400);
                    }, 4000 + (index * 900)); // تتغير كل 4 ثواني + تأخير مبني على ترتيبها
                }, index * 600);
            }
        } catch (e) {
            console.error("خطأ في قراءة وسائط المنتج", e);
        }
    });
};

// 2. إنشاء وتشغيل النافذة المنبثقة (Global Lightbox) لعرض الصور والفيديوهات
window.openProductGallery = function(mediaArray) {
    if (!mediaArray || mediaArray.length === 0) return;
    
    let lightbox = document.getElementById('globalProductLightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'globalProductLightbox';
        lightbox.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100000;
            display: none; align-items: center; justify-content: center; flex-direction: column;
        `;
        document.body.appendChild(lightbox);
    }

    let currentIndex = 0;
    
    const renderMedia = () => {
        const file = mediaArray[currentIndex];
        const isVideo = file.match(/\.(mp4|webm|ogg)$/i);
        const url = file;
        
        let mediaHtml = isVideo 
            ? `<video src="${url}" controls autoplay style="max-width: 90vw; max-height: 80vh; border-radius: 15px; border: 2px solid var(--gold);"></video>`
            : `<img src="${url}" style="max-width: 90vw; max-height: 80vh; border-radius: 15px; border: 2px solid var(--gold); object-fit: contain;">`;

        lightbox.innerHTML = `
            <span style="position:absolute; top:20px; right:30px; color:#fff; font-size:2.5rem; cursor:pointer;" onclick="document.getElementById('globalProductLightbox').style.display='none'">&times;</span>
            <div style="display:flex; align-items:center; gap:20px;">
                ${mediaArray.length > 1 ? `<button id="lbPrev" style="background:var(--gold); border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; font-size:1.2rem;"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
                ${mediaHtml}
                ${mediaArray.length > 1 ? `<button id="lbNext" style="background:var(--gold); border:none; border-radius:50%; width:40px; height:40px; cursor:pointer; font-size:1.2rem;"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
            </div>
            ${mediaArray.length > 1 ? `<div style="color:#fff; margin-top:15px; font-family:sans-serif;">${currentIndex + 1} / ${mediaArray.length}</div>` : ''}
        `;

        if (mediaArray.length > 1) {
            document.getElementById('lbNext').onclick = (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % mediaArray.length; renderMedia(); };
            document.getElementById('lbPrev').onclick = (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + mediaArray.length) % mediaArray.length; renderMedia(); };
        }
    };

    renderMedia();
    lightbox.style.display = 'flex';
};
// =====================================================
// دوال تقرير المبيعات والطباعة
// =====================================================

// دالة لتحديث نص التاريخ المطبوع
function updatePrintDateText() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const dateTextElement = document.getElementById('report-date-text');

    if (startDate && endDate) {
        dateTextElement.innerText = `الفترة: من ${startDate} إلى ${endDate}`;
    } else if (startDate) {
        dateTextElement.innerText = `الفترة: من ${startDate} وما بعد`;
    } else if (endDate) {
        dateTextElement.innerText = `الفترة: حتى تاريخ ${endDate}`;
    } else {
        dateTextElement.innerText = `الفترة: كل الأوقات (التقرير الشامل)`;
    }
}

// دالة جلب التقرير (يجب أن تربطها مع الباك إند الخاص بك)
async function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    // نقوم بتحديث النص الخاص بالطباعة فوراً
    updatePrintDateText();

    try {
        // إرسال التواريخ للباك إند (server.js) عبر الـ Query Parameters
        // تأكد من تعديل الرابط حسب مسار الـ API الموجود لديك
        const response = await fetch(`/api/admin/reports?start=${startDate}&end=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}` // إذا كنت تستخدم توكن
            }
        });

        const result = await response.json();
        
        if (result.success) {
            // هنا تقوم بمسح الجدول القديم وتعبئته بالبيانات الجديدة
            // (هذا يعتمد على كيفية كتابتك لكود تعبئة الجدول سابقاً)
            
            // مثال لتحديث التوتال:
            document.getElementById('report-grand-total').innerText = result.grandTotal + ' د.ج';
        } else {
            alert('فشل في جلب التقرير: ' + result.error);
        }
    } catch (error) {
        console.error("خطأ أثناء جلب التقرير:", error);
    }
}

// دالة الطباعة
function printReport() {
    // التأكد من تحديث نص التاريخ قبل الطباعة مباشرة
    updatePrintDateText();
    // استدعاء نافذة الطباعة الخاصة بالمتصفح
    window.print();
}
// ==================================================
// نظام الخلفيات الديناميكية (الرئيسية & من نحن) - نسخة محسنة ونهائية
// ==================================================
async function loadDynamicBackground(elementSelector, category) {
    const container = document.querySelector(elementSelector);
    if (!container) {
        console.warn(`❌ العنصر ${elementSelector} غير موجود في الصفحة.`);
        return;
    }

    try {
        // إضافة timestamp لمنع التخزين المؤقت
        const url = `${API_BASE}/gallery?category=${category}&t=${new Date().getTime()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.images && data.images.length > 0) {
            // نأخذ أول عنصر نشط (الآدمن يمكنه التحكم بالترتيب)
            const bgItem = data.images[0];
            const fileUrl = bgItem.ImageUrl;
            const isVideo = fileUrl.match(/\.(mp4|webm|ogg|mov)$/i);

            // تنظيف أي خلفية سابقة
            const oldMedia = container.querySelector('.bg-media-element');
            if (oldMedia) oldMedia.remove();
            // إعادة تعيين الخلفية المباشرة
            container.style.backgroundImage = '';
            container.style.backgroundColor = 'transparent';

            if (isVideo) {
                // إزالة صورة الخلفية الثابتة إذا كانت موجودة
                container.style.backgroundImage = 'none';
                
                const video = document.createElement('video');
                video.className = 'bg-media-element';
                video.src = fileUrl;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                // ضبط الفيديو ليكون في الخلف
                video.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    min-width: 100%;
                    min-height: 100%;
                    width: auto;
                    height: auto;
                    transform: translate(-50%, -50%);
                    object-fit: cover;
                    z-index: -2;
                `;
                container.insertBefore(video, container.firstChild);
                // التأكد من أن الحاوية لها position relative و overflow hidden
                if (getComputedStyle(container).position === 'static') {
                    container.style.position = 'relative';
                }
                container.style.overflow = 'hidden';
                console.log(`✅ تم تحميل فيديو خلفية لفئة ${category}`);
            } else {
                // إذا رفع الآدمن صورة
                container.style.backgroundImage = `url('${fileUrl}')`;
                container.style.backgroundSize = 'cover';
                container.style.backgroundPosition = 'center';
                container.style.backgroundRepeat = 'no-repeat';
                console.log(`✅ تم تحميل صورة خلفية لفئة ${category}`);
            }
        } else {
            console.warn(`⚠️ لم يتم العثور على صور للفئة: ${category}`);
            // (اختياري) يمكنك وضع صورة افتراضية هنا
            // container.style.backgroundImage = "url('images/default-bg.jpg')";
        }
    } catch (err) {
        console.error(`❌ خطأ في تحميل خلفية ${category}:`, err);
    }
}

// تشغيل جلب الخلفيات عند اكتمال تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    console.log("جاري تحميل الخلفيات للصفحة:", path);
    
    // صفحة الرئيسية
    if (path.includes('index.html') || path === '/' || path === '/index.html' || path === '') {
        loadDynamicBackground('.hero', 'hero_home');
    }
    // صفحة من نحن
    if (path.includes('about.html')) {
        loadDynamicBackground('.hero-about', 'hero_about');
    }
});
// ========================================================
// تحديد الصفحة النشطة تلقائياً (الحل النهائي)
// ========================================================
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    // إذا كان المسار فارغاً أو / نعتبره الرئيسية، وإلا نأخذ المسار كما هو
    const currentPage = (path === '/' || path === '') ? '/' : path;
    const navLinks = document.querySelectorAll('header nav ul li a');

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // مطابقة المسار بدقة
        if (linkHref === currentPage || (currentPage === '/' && linkHref === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
// ==========================================
// نظام التقييمات المتصل بقاعدة البيانات (الـ API)
// ==========================================
(function() {
    // دالة لجلب التقييمات (المرئية فقط) من السيرفر
window.fetchAndRenderReviews = async function(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:var(--text-light); grid-column: 1/-1; padding:20px;">جاري تحميل آراء الزبائن...</p>';

    try {
        const res = await fetch(`${API_BASE}/reviews`);
        const data = await res.json();

        if (data.success && data.reviews) {
            if (data.reviews.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:var(--text-light); grid-column: 1/-1; padding:30px; background:var(--surface); border-radius:10px; border:1px dashed var(--border);">لا توجد تقييمات معروضة حالياً. كن أول من يشارك تجربته!</p>';
                return;
            }

            // بناء كروت التقييمات
            container.innerHTML = data.reviews.map(r => {
                const reviewerName = r.ReviewerName || r.Username || 'زبون مجهول';
                const stars = '⭐'.repeat(r.Rating);
                const comment = r.Comment || '';
                const reviewDate = r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString('ar-DZ') : '';

                return `
                    <div class="review-card" style="background: var(--surface); border: 1px solid var(--border); padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; transition: var(--transition);">
                        <div>
                            <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <strong class="reviewer-name" style="color: var(--gold); font-size: 1.1rem; font-family: 'Tajawal', sans-serif;">${reviewerName}</strong>
                                <span class="review-stars" style="font-size: 0.9rem;">${stars}</span>
                            </div>
                            <p class="review-comment" style="color: var(--text); line-height: 1.7; font-size: 0.95rem; margin: 0 0 15px 0; white-space: pre-line;">${comment}</p>
                        </div>
                        <small class="review-date" style="color: #888; display: block; text-align: left; font-size: 0.8rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px;">${reviewDate}</small>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">فشل في تحميل التقييمات المعتمدة.</p>';
        }
    } catch (err) {
        console.error("Error fetching reviews:", err);
        container.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">حدث خطأ أثناء الاتصال بالخادم لتحديث التقييمات.</p>';
    }
};
    window.renderStars = function(rating) {
        let stars = '';
        const full = Math.floor(rating);
        const half = (rating % 1) !== 0;
        for (let i = 0; i < full; i++) stars += '<i class="fa-solid fa-star"></i>';
        if (half) stars += '<i class="fa-solid fa-star-half-alt"></i>';
        for (let i = full + (half ? 1 : 0); i < 5; i++) stars += '<i class="fa-regular fa-star"></i>';
        return stars;
    };

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            return {'&': '&amp;', '<': '&lt;', '>': '&gt;'}[m];
        });
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('reviewerName').value.trim();
            const starsSelect = document.getElementById('reviewStars').value;
            const commentInput = document.getElementById('reviewText').value.trim();
            const msgDiv = document.getElementById('reviewMessage');
            const submitBtn = this.querySelector('button[type="submit"]');

            if (!nameInput || !starsSelect || !commentInput) {
                if (msgDiv) msgDiv.innerHTML = '<span style="color:#e74c3c;">⚠️ الرجاء ملء جميع الحقول</span>';
                return;
            }

            // إرسال التقييم للسيرفر
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';
                
                const token = localStorage.getItem('sweet_event_token'); // إذا كان مسجلاً للدخول
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${API_BASE}/reviews`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        reviewerName: nameInput,
                        rating: starsSelect,
                        comment: commentInput
                    })
                });

                const data = await res.json();

                if (data.success) {
                    reviewForm.reset();
                    if (msgDiv) msgDiv.innerHTML = '<span style="color:#27ae60;">✅ تم إرسال تقييمك بنجاح! سيتم نشره بعد مراجعة الإدارة.</span>';
                } else {
                    if (msgDiv) msgDiv.innerHTML = `<span style="color:#e74c3c;">❌ خطأ: ${data.error}</span>`;
                }
            } catch (error) {
                if (msgDiv) msgDiv.innerHTML = '<span style="color:#e74c3c;">❌ حدث خطأ في الاتصال بالسيرفر.</span>';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-regular fa-paper-plane"></i> إرسال التقييم';
                setTimeout(() => { if(msgDiv) msgDiv.innerHTML = ''; }, 5000);
            }
        });
    }

    // تشغيل جلب التقييمات عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
        if(document.querySelector('.reviews-container')) {
            window.fetchAndRenderReviews('.reviews-container');
        }
    });
    // =====================================================
    // التحكم في إدخال الكميات يدوياً داخل حقول السلة
    // =====================================================
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('qty-input')) {
            const input = e.target;
            const productId = input.getAttribute('data-id');
            const category = input.getAttribute('data-cat');
            let value = parseInt(input.value);

            // صمام أمان: إذا ترك الزبون الحقل فارغاً أو كتب رقماً سالباً أو صفراً
            if (isNaN(value) || value < 1) {
                value = 1;
                input.value = 1;
            }

            // تحديث الكمية في السلة عبر الدالة الجديدة
            if (window.CartManager && typeof window.CartManager.setQuantity === 'function') {
                window.CartManager.setQuantity(productId, category, value);
            }
        }
    });
})();
// =====================================================
// التحكم في زر تغيير اللغة المخصص (Google Translate)
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    const customLangBtn = document.getElementById('customLangBtn');
    
    if (customLangBtn) {
        customLangBtn.addEventListener('click', function() {
            // الوصول إلى قائمة جوجل المخفية
            const select = document.querySelector('.goog-te-combo');
            
            if (select) {
                let currentLang = select.value || 'ar';
                let nextLang = 'fr'; 
                let btnText = 'FR';  

                // التبديل بين اللغات (عربي -> فرنسي -> إنجليزي ثم العودة للعربي)
                if (currentLang === 'ar') {
                    nextLang = 'fr';
                    btnText = 'FR';
                } else if (currentLang === 'fr') {
                    nextLang = 'en';
                    btnText = 'EN';
                } else {
                    nextLang = 'ar';
                    btnText = 'ع';
                }

                // تعيين اللغة الجديدة في أداة جوجل
                select.value = nextLang;
                
                // تفعيل حدث التغيير لتقوم الأداة بالترجمة فوراً
                select.dispatchEvent(new Event('change'));

                // تحديث النص داخل زرك الدائري ليُظهر اللغة التالية أو الحالية
                this.textContent = btnText;
            }
        });
    }
});
// =====================================================
// ترقية معرض الصور (Gallery) لدعم السحب باللمس (Swipe)
// =====================================================
window.openProductGallery = function(images) {
    if (!images || images.length === 0) return;

    // إزالة أي نافذة سابقة إن وجدت
    let existingModal = document.getElementById('globalGalleryModal');
    if (existingModal) existingModal.remove();

    let currentIndex = 0;
    
    // إيقاف التمرير في خلفية الموقع أثناء فتح الصور
    document.body.style.overflow = 'hidden'; 

    // إنشاء خلفية النافذة الزجاجية (Overlay)
    const modal = document.createElement('div');
    modal.id = 'globalGalleryModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 7, 5, 0.95); z-index: 100000;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; backdrop-filter: blur(15px);
    `;

    // إنشاء عنصر الصورة مع تأثيرات الانتقال
    const img = document.createElement('img');
    img.style.cssText = `
        max-width: 95%; max-height: 80vh; object-fit: contain;
        border-radius: 16px; box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        transition: transform 0.3s ease, opacity 0.3s ease; user-select: none;
    `;
    img.src = images[currentIndex];

    // زر الإغلاق
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.style.cssText = `
        position: absolute; top: 25px; right: 25px;
        background: rgba(201, 150, 62, 0.1); border: 1px solid #c9963e;
        color: #c9963e; font-size: 20px; cursor: pointer; z-index: 100001;
        width: 45px; height: 45px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    closeBtn.onmouseover = () => { closeBtn.style.background = '#c9963e'; closeBtn.style.color = '#000'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = 'rgba(201, 150, 62, 0.1)'; closeBtn.style.color = '#c9963e'; };

    // حاوية أزرار التنقل 
    const controls = document.createElement('div');
    controls.style.cssText = `
        position: absolute; width: 100%; display: flex;
        justify-content: space-between; top: 50%; transform: translateY(-50%);
        padding: 0 20px; box-sizing: border-box; pointer-events: none;
    `;

    const btnStyle = `
        background: rgba(20, 15, 12, 0.8); color: #c9963e;
        border: 1px solid #c9963e; border-radius: 50%; width: 50px; height: 50px;
        font-size: 18px; cursor: pointer; pointer-events: auto;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4); transition: 0.3s;
    `;

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>'; 
    prevBtn.style.cssText = btnStyle;
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>'; 
    nextBtn.style.cssText = btnStyle;

    [prevBtn, nextBtn].forEach(btn => {
        btn.onmouseover = () => { btn.style.background = '#c9963e'; btn.style.color = '#000'; };
        btn.onmouseout = () => { btn.style.background = 'rgba(20, 15, 12, 0.8)'; btn.style.color = '#c9963e'; };
    });

    // العداد (رقم الصورة)
    const counter = document.createElement('div');
    counter.style.cssText = `
        position: absolute; bottom: 30px; color: #c9963e;
        font-family: 'Cairo', sans-serif; font-size: 1rem; font-weight: 700;
        background: rgba(20, 15, 12, 0.8); padding: 6px 20px; 
        border-radius: 30px; border: 1px solid #c9963e;
    `;

    // دالة تحديث الصورة مع تأثير الحركة
    function updateGallery(direction) {
        img.style.opacity = '0.3';
        img.style.transform = direction === 'next' ? 'scale(0.95) translateX(-40px)' : 'scale(0.95) translateX(40px)';
        
        setTimeout(() => {
            img.src = images[currentIndex];
            img.style.opacity = '1';
            img.style.transform = 'scale(1) translateX(0)';
            counter.textContent = `${currentIndex + 1} / ${images.length}`;
        }, 200);
    }

    prevBtn.onclick = (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + images.length) % images.length; updateGallery('prev'); };
    nextBtn.onclick = (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % images.length; updateGallery('next'); };

    // ==========================================
    // 📱 إضافة دعم السحب (Touch Swipe) للهواتف
    // ==========================================
    let touchStartX = 0;
    let touchEndX = 0;

    modal.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    modal.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50; // الحد الأدنى للمسافة لاحتساب السحبة
        if (touchEndX < touchStartX - swipeThreshold) {
            // سحب لليسار -> الصورة التالية
            nextBtn.click();
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            // سحب لليمين -> الصورة السابقة
            prevBtn.click();
        }
    }

    // ==========================================
    // ⌨️ دعم لوحة المفاتيح (للحاسوب)
    // ==========================================
    const keyHandler = (e) => {
        if (e.key === 'ArrowLeft') nextBtn.click();
        if (e.key === 'ArrowRight') prevBtn.click();
        if (e.key === 'Escape') cleanUp();
    };
    document.addEventListener('keydown', keyHandler);

    // دالة التنظيف عند الإغلاق
    const cleanUp = () => {
        modal.remove();
        document.body.style.overflow = ''; // إعادة تفعيل التمرير
        document.removeEventListener('keydown', keyHandler);
    };

    closeBtn.onclick = cleanUp;
    modal.onclick = (e) => { if (e.target === modal) cleanUp(); };

    // تجميع العناصر
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    modal.appendChild(closeBtn);
    modal.appendChild(img);
    
    if (images.length > 1) {
        modal.appendChild(controls);
        modal.appendChild(counter);
        counter.textContent = `1 / ${images.length}`;
    }
    
    document.body.appendChild(modal);
};