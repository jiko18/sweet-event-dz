// ==================== SWEET EVENT DZ - MAIN CONTROLLER ====================
(function() {
    // ---------- DOM Elements ----------
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const langToggle = document.getElementById('langToggle');
    const langLabel = document.getElementById('langLabel');
    const authModal = document.getElementById('authModal');
    const closeModalBtn = document.getElementById('closeModal');
    const accountBtn = document.getElementById('accountBtn');
    const loginFormDiv = document.getElementById('loginForm');
    const registerFormDiv = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const userGreetingContainer = document.getElementById('userGreetingContainer');
    const toastEl = document.getElementById('toast');

    // Form Inputs
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const registerBtn = document.getElementById('registerBtn');

    // ---------- State ----------
    const APP_KEY = 'sweet_event_dz';
    let appState = {
        theme: 'light',
        lang: 'ar',
        user: null
    };

   // ---------- Translations (i18n) ----------
const i18n = {
    ar: {
        nav_home:'الرئيسية', nav_cakes:'الكيك', nav_decor:'الديكور', nav_photo:'التصوير', nav_menu:'القائمة',
        contact_us:'اتصل بنا', login_title:'تسجيل الدخول', register_title:'إنشاء حساب جديد',
        login_btn:'دخول', register_btn:'إنشاء حساب', no_account:'ليس لديك حساب؟', create_account:'إنشاء حساب',
        have_account:'لديك حساب بالفعل؟', login_link:'تسجيل الدخول',
        hero_title:'Sweet<br>Event DZ <span>🎉</span>', hero_subtitle:'كل خدمات المناسبات<br>في مكان واحد',
        cat_cakes:'كيك', cat_sweets:'حلويات', cat_decor:'ديكور', cat_photo:'تصوير',
        promo_title:'عرض خاص!', promo_desc:'خصم على الطلب الاول', order_now:'اطلب الآن',
        premium_since: '✦ منذ 2026 ✦',
        about_title: 'نحن لسنا مجرد صناع حلوى<br>نحن <span class="gold-text-accent">صنّاع اللحظات الخالدة</span>',
        about_subtitle: 'من الطابع الملكي إلى أجمل الصالات في الجزائر، ننقل رؤيتك إلى واقع يخطف الأنفاس',
        stat_events: 'مناسبة كبرى', stat_events_desc: 'أعراس & خطوبات & حفلات',
        stat_decor: 'ديكور ضخم فريد', stat_decor_desc: 'بتصاميم حصرية',
        stat_partner: 'شريك موثوق', stat_partner_desc: 'فنادق وقاعات كبرى',
        stat_satisfaction: 'رضا تام', stat_satisfaction_desc: 'عملاء أوصوا بنا',
        gallery_title: '✧بصمة من إبداعنا✧',
        about_quote: '“ ما بدأناه في 2026 بحلم صغير تحول إلى أكبر شبكة خدمات متكاملة للمناسبات في الجزائر. كل مشروع نقوم به نضعه بين الإبداع والدقة المتناهية، لأننا نعلم أن مناسبة عملائنا تستحق الأفضل “',
        free_consult: 'احجز تجربة افتراضية',
        explore_gallery: 'استكشف معرض أعمالنا',
        extra_services_title: "خدمات إضافية للمناسبات",
        extra_services_subtitle: "نكمل حفلتك بأفضل الخدمات",
        add_review_title: "أضف تقييمك",
        full_name_label: "الاسم الكامل",
        star_rating_label: "تقييم النجوم",
        submit_review_btn: "إرسال التقييم",
        footer_slogan_title: "نحن نقدم خدمة مرموقة",
        footer_slogan_desc: "نصنع أحلاماً ونحولها إلى واقع ملموس في كل مناسبة.",
        copyright:'© 2026 Sweet Event DZ. جميع الحقوق محفوظة.', welcome_back:'أهلاً بك،',
        logout:'تسجيل خروج', login_success:'✅ تم تسجيل الدخول بنجاح!',
        register_success:'✅ تم إنشاء الحساب بنجاح!', logout_success:'👋 تم تسجيل الخروج',
        fill_fields:'⚠️ الرجاء ملء جميع الحقول', 
        email_placeholder: 'البريد الإلكتروني', password_placeholder: 'كلمة المرور',
        name_placeholder: 'الاسم الكامل', lang_changed:'🌐 تم تغيير اللغة الى العربية ',
        sending_order: 'جاري إرسال الطلب...', order_success: '✅ تم إرسال طلبك بنجاح!', order_error: '❌ حدث خطأ، يرجى المحاولة لاحقاً.'
    },
    en: {
        nav_home:'Home', nav_cakes:'Cakes', nav_decor:'Decor', nav_photo:'Photography', nav_menu:'Menu',
        contact_us:'Contact Us', login_title:'Login', register_title:'Create Account',
        login_btn:'Login', register_btn:'Register', no_account:"Don't have an account?",
        create_account:'Create Account', have_account:'Already have an account?', login_link:'Login',
        hero_title:'Sweet<br>Event DZ <span>🎉</span>', hero_subtitle:'All event services<br>in one place',
        cat_cakes:'Cakes', cat_sweets:'Sweets', cat_decor:'Decor', cat_photo:'Photography',
        promo_title:'Special Promo!', promo_desc:'DISCOUNT FOR FIRST ORDERS', order_now:'Order Now',
        premium_since: '✦ Since 2026 ✦',
        about_title: 'We are not just candy makers<br>We are <span class="gold-text-accent">creators of timeless moments</span>',
        about_subtitle: 'From royal styles to the most beautiful halls in Algeria, we turn your vision into a breathtaking reality',
        stat_events: 'Major Events', stat_events_desc: 'Weddings & Birthdays & Conferences',
        stat_decor: 'Unique Decor', stat_decor_desc: 'With exclusive designs',
        stat_partner: 'Trusted Partner', stat_partner_desc: 'Major hotels and halls',
        stat_satisfaction: 'Full Satisfaction', stat_satisfaction_desc: 'Clients who recommended us',
        gallery_title: '✧ Our Creative Touch in the Finest Events ✧',
        about_quote: '“ What we started in 2026 with a small dream turned into the largest integrated event services network in Algeria. Every project we do is placed between creativity and ultimate precision. “',
        free_consult: 'Book Free Consultation',
        explore_gallery: 'Explore Our Gallery',
        extra_services_title: "Additional Event Services",
        extra_services_subtitle: "Completing your party with the best services",
        add_review_title: "Add Your Review",
        full_name_label: "Full Name",
        star_rating_label: "Star Rating",
        submit_review_btn: "Submit Review",
        footer_slogan_title: "We provide prestigious service",
        footer_slogan_desc: "We create dreams and turn them into tangible reality in every event.",
        copyright:'© 2026 Sweet Event DZ. All rights reserved.', welcome_back:'Welcome,',
        logout:'Logout', login_success:'✅ Logged in successfully!',
        register_success:'✅ Account created successfully!', logout_success:'👋 Logged out successfully',
        fill_fields:'⚠️ Please fill all fields', lang_changed:'🌐 Language changed to English',
        email_placeholder: 'Email', password_placeholder: 'Password', name_placeholder: 'Full Name',
        dark_mode: 'Dark mode enabled', light_mode: 'Light mode enabled',
        sending_order: 'Sending order...', order_success: '✅ Order submitted successfully!', order_error: '❌ Error occurred, please try again.'
    },
    fr: {
        nav_home:'Accueil', nav_cakes:'Gâteaux', nav_decor:'Décor', nav_photo:'Photographie', nav_menu:'Menu',
        contact_us:'Contactez-nous', login_title:'Connexion', register_title:'Créer un compte',
        login_btn:'Connexion', register_btn:"S'inscrire", no_account:'Pas de compte ?',
        create_account:'Créer un compte', have_account:'Déjà un compte ?', login_link:'Se connecter',
        hero_title:'Sweet<br>Event DZ <span>🎉</span>', hero_subtitle:'Tous les services événementiels<br>en un seul lieu',
        cat_cakes:'Gâteaux', cat_sweets:'Douceurs', cat_decor:'Décor', cat_photo:'Photographie',
        promo_title:'Promo Spéciale !', promo_desc:'RÉDUCTION SUR LES PREMIÈRES COMMANDES', order_now:'Commander',
        premium_since: '✦ Depuis 2026 ✦',
        about_title: 'Nous ne sommes pas que des pâtissiers<br>Nous sommes <span class="gold-text-accent">des créateurs de moments éternels</span>',
        about_subtitle: 'Du style royal aux plus belles salles d\'Algérie, nous transformons votre vision en réalité',
        stat_events: 'Événements Majeurs', stat_events_desc: 'Mariages & Anniversaires',
        stat_decor: 'Décor Unique', stat_decor_desc: 'Avec des designs exclusifs',
        stat_partner: 'Partenaire de Confiance', stat_partner_desc: 'Grands hôtels et salles',
        stat_satisfaction: 'Satisfaction Totale', stat_satisfaction_desc: 'Clients satisfaits',
        gallery_title: '✧ Notre Touche Créative dans les Plus Beaux Événements ✧',
        about_quote: '“ Ce que nous avons commencé en 2026 avec un petit rêve est devenu le plus grand réseau de services événementiels en Algérie. “',
        free_consult: 'Consultation Gratuite',
        explore_gallery: 'Explorer la Galerie',
        extra_services_title: "Services Supplémentaires",
        extra_services_subtitle: "Complétez votre fête avec les meilleurs services",
        add_review_title: "Ajouter votre avis",
        full_name_label: "Nom complet",
        star_rating_label: "Évaluation",
        submit_review_btn: "Envoyer l'avis",
        footer_slogan_title: "Nous offrons un service prestigieux",
        footer_slogan_desc: "Nous créons des rêves et les transformons en réalité à chaque occasion.",
        copyright:'© 2026 Sweet Event DZ. Tous droits réservés.', welcome_back:'Bienvenue,',
        logout:'Déconnexion', login_success:'✅ Connecté avec succès !',
        register_success:'✅ Compte créé avec succès !', logout_success:'👋 Déconnecté avec succès',
        fill_fields:'⚠️ Veuillez remplir tous les champs', lang_changed:'🌐 Langue changée en Français',
        email_placeholder: 'Email', password_placeholder: 'Mot de passe', name_placeholder: 'Nom complet',
        dark_mode: 'Mode sombre activé', light_mode: 'Mode clair activé',
        sending_order: 'Envoi de la commande...', order_success: '✅ Commande envoyée avec succès !', order_error: '❌ Une erreur s\'est produite, veuillez réessayer.'
    }
};
    const langCycle = ['ar', 'en', 'fr'];
    const langLabels = { ar: 'AR', en: 'EN', fr: 'FR' };

    // ---------- Utility: Local Storage ----------
    function loadState() {
        const saved = localStorage.getItem(APP_KEY);
        if (saved) {
            try { appState = { ...appState, ...JSON.parse(saved) }; } catch (e) { console.warn('State corrupted, resetting.'); }
        }
    }
    function saveState() {
        localStorage.setItem(APP_KEY, JSON.stringify(appState));
    }

    // ---------- Toast Notification ----------
    let toastTimer;
    function showToast(msg) {
        if (!toastEl) return;
        clearTimeout(toastTimer);
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
    }

    // ---------- Theme (Dark/Light) ----------
    function applyTheme(theme) {
        body.classList.toggle('dark-mode', theme === 'dark');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        appState.theme = theme;
        saveState();
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            showToast(newTheme === 'dark' ? '🌙 ' + i18n[appState.lang].dark_mode : '☀️ ' + i18n[appState.lang].light_mode);
        });
    }

    // ---------- Language Switching ----------
    function applyLanguage(lang) {
        appState.lang = lang;
        saveState();
        body.dir = lang === 'ar' ? 'rtl' : 'ltr';
        if (langLabel) langLabel.textContent = langLabels[lang];

        // قراءة السمات (data-i18n و data-lang) لضمان توافق جميع الصفحات
        document.querySelectorAll('[data-i18n], [data-lang]').forEach(el => {
            const key = el.getAttribute('data-i18n') || el.getAttribute('data-lang');
            if (i18n[lang]?.[key]) el.innerHTML = i18n[lang][key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (i18n[lang]?.[key]) el.placeholder = i18n[lang][key];
        });
        updateUserGreeting();
    }

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const idx = langCycle.indexOf(appState.lang);
            const next = langCycle[(idx + 1) % 3];
            applyLanguage(next);
            showToast(i18n[next].lang_changed);
        });
    }

    // ---------- Authentication (Login/Register) ----------
    function openModal() { if (authModal) authModal.classList.add('active'); }
    function closeModal() { if (authModal) authModal.classList.remove('active'); }

    if (accountBtn) {
        accountBtn.addEventListener('click', () => {
            if (appState.user) {
                if (confirm(i18n[appState.lang].logout + '؟')) {
                    appState.user = null;
                    saveState();
                    updateUserGreeting();
                    showToast(i18n[appState.lang].logout_success);
                }
            } else {
                openModal();
            }
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeModal();
        });
    }

    function switchToRegister() {
        if (loginFormDiv) loginFormDiv.style.display = 'none';
        if (registerFormDiv) registerFormDiv.style.display = 'block';
    }
    function switchToLogin() {
        if (registerFormDiv) registerFormDiv.style.display = 'none';
        if (loginFormDiv) loginFormDiv.style.display = 'block';
    }

    if (showRegisterLink) showRegisterLink.addEventListener('click', switchToRegister);
    if (showLoginLink) showLoginLink.addEventListener('click', switchToLogin);

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = loginEmail?.value.trim();
            const pass = loginPassword?.value.trim();
            if (!email || !pass) return showToast(i18n[appState.lang].fill_fields);
            appState.user = { name: email.split('@')[0], email };
            saveState();
            updateUserGreeting();
            closeModal();
            showToast(i18n[appState.lang].login_success);
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = regName?.value.trim();
            const email = regEmail?.value.trim();
            const pass = regPassword?.value.trim();
            if (!name || !email || !pass) return showToast(i18n[appState.lang].fill_fields);
            appState.user = { name, email };
            saveState();
            updateUserGreeting();
            closeModal();
            showToast(i18n[appState.lang].register_success);
        });
    }

    function updateUserGreeting() {
        if (!userGreetingContainer || !accountBtn) return;
        if (appState.user) {
            userGreetingContainer.innerHTML = `<span class="user-greeting"><i class="fa-regular fa-circle-user"></i> ${appState.user.name}</span>`;
            accountBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
        } else {
            userGreetingContainer.innerHTML = '';
            accountBtn.innerHTML = '<i class="fa-regular fa-user"></i>';
        }
    }

    // ==========================================
    // حساب أسعار جدول الحلويات (Menu Page)
    // ==========================================
    const qtyInputs = document.querySelectorAll('.qty-input');
    if (qtyInputs.length > 0) {
        qtyInputs.forEach(input => {
            input.addEventListener('input', updateGrandTotal);
        });
    }

    function updateGrandTotal() {
        let total = 0;
        const rows = document.querySelectorAll('.sweets-table tbody tr');
        rows.forEach(row => {
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
    }

    // ==========================================
    // نظام حجز القاعات (Booking Form)
    // ==========================================
    const hallSelect = document.getElementById('hallSelect') || document.getElementById('selectedHall');
    const hoursInput = document.getElementById('hours') || document.getElementById('hoursCount');
    const estPrice = document.getElementById('estPrice') || document.getElementById('estimatedPrice');

    function updateEstimate() {
        if (hallSelect && hoursInput && estPrice) {
            const selectedOption = hallSelect.options[hallSelect.selectedIndex];
            const pricePerHour = selectedOption.dataset.price ? parseInt(selectedOption.dataset.price) : 0;
            const hours = parseInt(hoursInput.value) || 0;
            estPrice.textContent = pricePerHour * hours;
        }
    }

    if (hallSelect) hallSelect.addEventListener('change', updateEstimate);
    if (hoursInput) hoursInput.addEventListener('input', updateEstimate);

    document.querySelectorAll('.select-hall, .select-hall-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const hallName = this.dataset.hall;
            if (hallSelect) {
                for (let i = 0; i < hallSelect.options.length; i++) {
                    if (hallSelect.options[i].value === hallName) {
                        hallSelect.selectedIndex = i;
                        break;
                    }
                }
                updateEstimate();
                const formToScroll = document.getElementById('bookingForm') || document.querySelector('.booking-form');
                if(formToScroll) formToScroll.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ==========================================
    // القائمة المتنقلة (Mobile Menu) والتمرير السلس
    // ==========================================
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu') || document.querySelector('.nav-links') || document.querySelector('nav ul');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                if(navMenu) navMenu.classList.remove('active');
            }
        });
    });

    // ==========================================
    // إرسال الطلب إلى الخادم (Order Submission System) - الإضافة الجديدة
    // ==========================================
    const bookingForm = document.getElementById('bookingForm'); // تأكد من أن الـ form في HTML يحمل هذا الـ id
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showToast(i18n[appState.lang].sending_order);

            // تجميع بيانات الطلب لإرسالها للخادم
            const orderData = {
                clientName: appState.user ? appState.user.name : (document.getElementById('clientName')?.value || 'زائر غير مسجل'),
                phone: document.getElementById('phoneInput')?.value || 'غير محدد',
                serviceType: hallSelect ? hallSelect.value : 'غير محدد',
                price: estPrice ? estPrice.textContent : '0'
            };

            try {
                // ملاحظة: استبدل هذا الرابط برابط الـ API الفعلي الخاص بك على Render لاحقاً
                const response = await fetch('https://your-backend-api-url.onrender.com/api/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    showToast(i18n[appState.lang].order_success);
                    bookingForm.reset();
                    if(estPrice) estPrice.textContent = '0';
                } else {
                    showToast(i18n[appState.lang].order_error);
                }
            } catch (error) {
                console.error('Error connecting to backend:', error);
                showToast(i18n[appState.lang].order_error);
            }
        });
    }

    // ---------- Initialization ----------
    function init() {
        loadState();
        applyTheme(appState.theme);
        applyLanguage(appState.lang);
        updateUserGreeting();
        updateGrandTotal(); // حساب السلة عند فتح الصفحة إذا وجدت
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ==================== SWEET EVENT DZ - SLIDER CONTROLLER ====================
(function() {
    const slider = document.querySelector('.slide');
    const prevBtn = document.querySelector('.button-but .reverse');
    const nextBtn = document.querySelector('.button-but .next');
    
    if (!slider || !prevBtn || !nextBtn) return;

    let currentScroll = 0;
    let itemWidth = 0;
    let itemsPerView = 3;

    function getItemWidth() {
        const item = slider.querySelector('.item');
        if (!item) return 300;
        const style = getComputedStyle(item);
        const marginRight = parseFloat(style.marginRight) || 0;
        const marginLeft = parseFloat(style.marginLeft) || 0;
        return item.offsetWidth + marginRight + marginLeft;
    }

    function updateItemsPerView() {
        if (window.innerWidth <= 600) itemsPerView = 1;
        else if (window.innerWidth <= 992) itemsPerView = 2;
        else itemsPerView = 3;
    }

    function updateButtons() {
        const maxScroll = slider.scrollWidth - slider.offsetWidth;
        prevBtn.disabled = currentScroll <= 0;
        nextBtn.disabled = currentScroll >= maxScroll - 2;
    }

    function scrollSlider(direction) {
        itemWidth = getItemWidth();
        const visibleWidth = slider.offsetWidth;
        const maxScroll = slider.scrollWidth - visibleWidth;

        if (direction === 'next') {
            currentScroll += itemWidth;
            if (currentScroll > maxScroll) currentScroll = maxScroll;
        } else {
            currentScroll -= itemWidth;
            if (currentScroll < 0) currentScroll = 0;
        }

        slider.scrollTo({
            left: currentScroll,
            behavior: 'smooth'
        });

        setTimeout(updateButtons, 400);
    }

    window.addEventListener('resize', () => {
        updateItemsPerView();
        itemWidth = getItemWidth();
        const maxScroll = slider.scrollWidth - slider.offsetWidth;
        if (currentScroll > maxScroll) currentScroll = maxScroll;
        slider.scrollTo({ left: currentScroll, behavior: 'auto' });
        updateButtons();
    });

    nextBtn.addEventListener('click', () => scrollSlider('next'));
    prevBtn.addEventListener('click', () => scrollSlider('prev'));

    updateItemsPerView();
    updateButtons();

    slider.addEventListener('scroll', () => {
        currentScroll = slider.scrollLeft;
        updateButtons();
    });
})();
