require('dotenv').config();
const bcrypt = require('bcrypt');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// استيراد عميل Turso (libsql)
const { createClient } = require('@libsql/client');

// استيراد Cloudinary و Multer-Cloudinary Storage
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const saltRounds = 10;

// إعدادات الملفات
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

// خدمة الملفات الثابتة (قم بتعديل المسار حسب مكان ملفاتك)
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));

// الأسرار
const SECRET_KEY = process.env.JWTS_SECRET || "Test_Secret_Key_12345";

// =====================================================
// إعدادات بوت تيليجرام المطور وفريق العمل
// =====================================================
const TELEGRAM_BOT_TOKEN = "8728009776:AAFxzl8Po5Njl1NeA69juUmNeCi6P271Ffo";

const ROLES_CHAT_IDS = {
    superAdmin: "7545626508", // حسابك أنت (السوبر أدمن)
    decor: "8446426225", // أضف الأيدي الخاص بموظف الديكور
    photo: "8498133481" // المعرف الخاص بموظف التصوير
};

// دالة الإرسال تدعم الآن استقبال نصوص الأزرار (replyMarkup) اختياريًا
async function sendTelegramNotification(chatId, message, replyMarkup = null) {
    if (!chatId) return;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const bodyData = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    };
    
    // إذا وُجدت أزرار تفاعلية نقوم بإرفاقها بالرسالة
    if (replyMarkup) {
        bodyData.reply_markup = replyMarkup;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        return await response.json();
    } catch (err) {
        console.error(`❌ خطأ أثناء الإرسال للمعرّف ${chatId}:`, err.message);
    }
}

// =====================================================
// الاتصال بقاعدة البيانات السحابية Turso
// =====================================================
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function runAsync(sql, params = []) {
    const result = await db.execute({ sql, args: params });
    return {
        lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
        changes: result.rowsAffected,
        rows: result.rows
    };
}

async function getAsync(sql, params = []) {
    const result = await db.execute({ sql, args: params });
    return result.rows[0] || null;
}

async function allAsync(sql, params = []) {
    const result = await db.execute({ sql, args: params });
    return result.rows;
}

// دالة لتسجيل نشاطات المشرفين
async function logAdminAction(adminId, adminName, actionType, details) {
    try {
        await runAsync(
            `INSERT INTO ActivityLogs (AdminId, AdminName, ActionType, Details) VALUES (?, ?, ?, ?)`,
            [adminId, adminName, actionType, details]
        );
    } catch (err) {
        console.error("فشل تسجيل النشاط:", err.message);
    }
}
// إنشاء الجداول تلقائياً عند بدء التشغيل (مع إضافة DeliveryAddress والأحجام Sizes)
(async function createTables() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Users (
                UserID INTEGER PRIMARY KEY AUTOINCREMENT,
                Username TEXT,
                LastName TEXT,
                Email TEXT UNIQUE,
                Phone TEXT,
                Password TEXT,
                Wilaya TEXT,
                CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                IsAdmin INTEGER DEFAULT 0,
                AvatarUrl TEXT,
                Role TEXT DEFAULT 'customer'
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Products (
                ProductId INTEGER PRIMARY KEY AUTOINCREMENT,
                Category TEXT,
                Name TEXT,
                Description TEXT,
                Price REAL,
                ImageUrl TEXT,
                IsActive INTEGER DEFAULT 1,
                CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                MediaFiles TEXT,
                Location TEXT,
                Capacity INTEGER,
                Latitude REAL,
                Longitude REAL,
                Features TEXT,
                UnitType TEXT DEFAULT 'none',
                Sizes TEXT DEFAULT '[]',
                IsDeleted INTEGER DEFAULT 0
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Orders (
                OrderId INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER,
                CustomerName TEXT,
                CustomerPhone TEXT,
                CustomerEmail TEXT,
                EventDate TEXT,
                DeliveryDate TEXT,
                DeliveryAddress TEXT,
                Notes TEXT,
                TotalAmount REAL,
                Status TEXT DEFAULT 'Pending',
                OrderDate TEXT DEFAULT CURRENT_TIMESTAMP,
                IsDeleted INTEGER DEFAULT 0,
                IsArchived INTEGER DEFAULT 0,
                IsDeletedByAdmin INTEGER DEFAULT 0,
                FOREIGN KEY (UserId) REFERENCES Users(UserID)
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS OrderItems (
                ItemId INTEGER PRIMARY KEY AUTOINCREMENT,
                OrderId INTEGER,
                ProductId INTEGER,
                Quantity INTEGER,
                UnitPrice REAL,
                FOREIGN KEY (OrderId) REFERENCES Orders(OrderId) ON DELETE CASCADE,
                FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Reviews (
                ReviewId INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER,
                ReviewerName TEXT,
                Rating INTEGER CHECK(Rating BETWEEN 1 AND 5),
                Comment TEXT,
                IsApproved INTEGER DEFAULT 0,
                CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserId) REFERENCES Users(UserID)
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS Gallery (
                GalleryId INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT,
                ImageUrl TEXT,
                Category TEXT DEFAULT 'general',
                DisplayOrder INTEGER DEFAULT 0,
                IsActive INTEGER DEFAULT 1,
                CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS ActivityLogs (
                LogId INTEGER PRIMARY KEY AUTOINCREMENT,
                AdminId INTEGER,
                AdminName TEXT,
                ActionType TEXT,
                Details TEXT,
                CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ جميع الجداول جاهزة على Turso');
    } catch (err) {
        console.error('❌ فشل إنشاء الجداول:', err.message);
        process.exit(1);
    }
})();
// =====================================================
// Middleware
// =====================================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'لا يوجد توكن' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'توكن غير صالح' });
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'غير مصرح: تحتاج صلاحيات مدير' });
        }
        next();
    });
};

// =====================================================
// إعداد Cloudinary ومخزن Multer السحابي
// =====================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sweet_event_dz_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'ogg', 'mov'],
        resource_type: 'auto',
    },
});

const upload = multer({ storage: storage });

// =====================================================
// 1. تسجيل حساب جديد
// =====================================================
app.post('/api/register', async (req, res) => {
    try {
        const { username, lastname, phone, email, password, wilaya } = req.body;
        const existing = await getAsync(`SELECT UserID FROM Users WHERE Email = ?`, [email]);
        if (existing) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مستخدم بالفعل' });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await runAsync(
            `INSERT INTO Users (Username, LastName, Phone, Email, Password, Wilaya, IsAdmin, Role)
             VALUES (?, ?, ?, ?, ?, ?, 0, 'customer')`,
            [username, lastname, phone, email, hashedPassword, wilaya]
        );
        res.json({ success: true, message: 'تم إنشاء الحساب بنجاح!' });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 2. تسجيل الدخول
// =====================================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getAsync(`SELECT UserID, Username, Email, Phone, LastName, Password, IsAdmin, Role FROM Users WHERE Email = ?`, [email]);
        if (!user) {
            return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        const match = await bcrypt.compare(password, user.Password);
        if (!match) {
            return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        const role = (user.IsAdmin === 1 || user.Role === 'admin') ? 'admin' : 'customer';
        const token = jwt.sign(
            { userId: user.UserID, email: user.Email, username: user.Username, role: role },
            SECRET_KEY,
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            token: token,
            role: role,
            user: {
                userId: user.UserID,
                username: user.Username,
                email: user.Email,
                phone: user.Phone,
                lastname: user.LastName,
                role: role
            }
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 3. التحقق من التوكن
// =====================================================
app.get('/api/user', verifyToken, (req, res) => {
    res.json({
        username: req.user.username,
        email: req.user.email,
        userId: req.user.userId,
        role: req.user.role
    });
});

// =====================================================
// 4. جلب تفاصيل المستخدم
// =====================================================
app.get('/api/user/details', verifyToken, async (req, res) => {
    try {
        const user = await getAsync(`SELECT Username, LastName, Phone, Email, Wilaya, AvatarUrl, IsAdmin, Role FROM Users WHERE UserID = ?`, [req.user.userId]);
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        res.json({
            success: true,
            user: {
                Username: user.Username,
                LastName: user.LastName,
                Phone: user.Phone,
                Email: user.Email,
                Wilaya: user.Wilaya,
                AvatarUrl: user.AvatarUrl,
                Role: (user.IsAdmin === 1 || user.Role === 'admin') ? 'admin' : 'customer'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================================
// 5. تحديث بيانات المستخدم (مع تغيير كلمة المرور)
// =====================================================
app.put('/api/user/update', verifyToken, async (req, res) => {
    try {
        const { username, lastname, phone, newEmail, password, wilaya, currentPassword } = req.body;
        if (password && password.trim() !== '') {
            const user = await getAsync(`SELECT Password FROM Users WHERE UserID = ?`, [req.user.userId]);
            if (!user) return res.status(401).json({ success: false, error: 'المستخدم غير موجود' });
            const isValid = await bcrypt.compare(currentPassword, user.Password);
            if (!isValid) return res.status(401).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' });
        }
        let updateQuery = `UPDATE Users SET Username = ?, LastName = ?, Phone = ?, Email = ?, Wilaya = ?`;
        let params = [username, lastname, phone, newEmail, wilaya];
        if (password && password.trim() !== '') {
            const hashed = await bcrypt.hash(password, saltRounds);
            updateQuery += `, Password = ?`;
            params.push(hashed);
        }
        updateQuery += ` WHERE UserID = ?`;
        params.push(req.user.userId);
        await runAsync(updateQuery, params);
        const newToken = jwt.sign(
            { userId: req.user.userId, email: newEmail, username: username, role: req.user.role },
            SECRET_KEY,
            { expiresIn: '7d' }
        );
        res.json({ success: true, message: 'تم تحديث بياناتك!', token: newToken });
    } catch (err) {
        console.error("Update Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 5.5. رفع الصورة الرمزية
// =====================================================
app.post('/api/user/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'لم يتم رفع أي ملف' });
        const avatarUrl = req.file.path;
        await runAsync(`UPDATE Users SET AvatarUrl = ? WHERE UserID = ?`, [avatarUrl, req.user.userId]);
        res.json({ success: true, message: 'تم تحديث الصورة الرمزية', avatarUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 6. جلب المنتجات
// =====================================================
app.get('/api/products', async (req, res) => {
    try {
        let { category } = req.query;
        let sql = `SELECT * FROM Products WHERE IsActive = 1 AND (IsDeleted = 0 OR IsDeleted IS NULL)`;
        let params = [];
        if (category && category !== 'all') {
            sql += ` AND Category = ?`;
            params.push(category);
        }
        sql += ` ORDER BY ProductId DESC`;
        const products = await allAsync(sql, params);
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 7. حفظ طلب جديد (مع دعم عنوان التسليم - تم إزالة شرط الإجبار)
// =====================================================
app.post('/api/orders', verifyToken, async (req, res) => {
    try {
        const { customerName, customerPhone, customerEmail, eventDate, deliveryDate, deliveryAddress, notes, items, totalAmount } = req.body;
        if (!customerName || !customerPhone) return res.status(400).json({ success: false, error: 'يرجى ملء الاسم ورقم الهاتف' });
        if (!items || !items.length) return res.status(400).json({ success: false, error: 'الطلب فارغ' });
        const finalDate = eventDate || deliveryDate;
        if (!finalDate) return res.status(400).json({ success: false, error: 'يرجى تحديد تاريخ التسليم' });

        // إدخال الطلب الرئيسي مع عنوان التسليم (يمكن أن يكون فارغاً)
        const result = await runAsync(
            `INSERT INTO Orders (UserId, CustomerName, CustomerPhone, CustomerEmail, DeliveryDate, DeliveryAddress, Notes, TotalAmount, Status, OrderDate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)`,
            [req.user.userId, customerName, customerPhone, customerEmail || null, finalDate, deliveryAddress || null, notes || null, totalAmount]
        );
        const orderId = result.lastID;

        // إدخال عناصر الطلب
        for (const item of items) {
            const productId = item.productId || item.ProductId || item.id || item.Id || null;
            const quantity = item.quantity || item.Quantity || 1;
            const unitPrice = item.unitPrice || item.UnitPrice || item.price || item.Price || 0;

            await runAsync(
                `INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice) VALUES (?, ?, ?, ?)`,
                [orderId, productId, quantity, unitPrice]
            );
        }
        
        // --- الفرز البرمجي وإرسال إشعارات تيليجرام التفاعلية ---
        let superAdminProductsText = ""; 
        let decorProductsText = ""; 
        let photoProductsText = ""; // متغير لجمع طلبات التصوير
        let hasDecor = false;
        let hasPhoto = false;

        // مصفوفة لتجميع عناصر الديكور بتفاصيلها لاستخدامها في الرسالة المخصصة
        let decorItems = [];

        // المرور على عناصر السلة وفرزها
        for (const item of items) {
            const productId = item.productId || item.ProductId || item.id || item.Id || null;
            let productName = item.Name || item.name || `منتج ${productId}`;
            let productCategory = item.Category || item.category || '';

            // محاولة جلب التفاصيل من قاعدة البيانات إذا لم تكن متوفرة في الطلب
            if (productId && (!productCategory || !productName || productName.startsWith('منتج'))) {
                const product = await getAsync(`SELECT Name, Category FROM Products WHERE ProductId = ?`, [productId]);
                if (product) {
                    productName = product.Name || productName;
                    productCategory = product.Category || productCategory;
                }
            }

            const quantity = item.quantity || item.Quantity || 1;
            const unitPrice = item.unitPrice || item.UnitPrice || item.price || item.Price || 0;
            const itemLine = `• ${productName} (الكمية: ${quantity})\n`;
            
            // السوبر أدمن تصله كافة التفاصيل
            superAdminProductsText += itemLine;

            // فرز الديكور والتصوير
            const categoryLower = (productCategory || '').toLowerCase().trim();
            
            if (categoryLower === 'decor' || categoryLower === 'ديكور') {
                decorProductsText += itemLine;
                hasDecor = true;
                // حفظ بيانات العنصر لاستخدامها في رسالة الديكور المفصلة
                decorItems.push({
                    name: productName,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    notes: item.notes || ''
                });
            } else if (categoryLower === 'photo' || categoryLower === 'photography' || categoryLower === 'تصوير') {
                photoProductsText += itemLine;
                hasPhoto = true;
            }
        }

        // صياغة وإرسال رسالة السوبر أدمن (علي) الشاملة
        const superAdminMessage = `
<b>🔔 طلب كامل جديد رقم: #${orderId}</b>
👤 <b>اسم الزبون:</b> ${customerName}
📞 <b>رقم الهاتف:</b> ${customerPhone}

📦 <b>تفاصيل الطلب الشاملة:</b>
${superAdminProductsText}
        `;
        await sendTelegramNotification(ROLES_CHAT_IDS.superAdmin, superAdminMessage);

        // --- رسالة مسؤول الديكور المخصصة (مطوّرة حسب الطلب) ---
        if (hasDecor) {
            // حساب إجمالي الديكور من العناصر المجمعة
            const decorTotal = decorItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);

            let decorMessage = `🔔 <b>طلب تنسيق ديكور جديد!</b> 🔔\n\n`;
            decorMessage += `📦 <b>رقم الطلبية:</b> #${orderId}\n`;
            decorMessage += `👤 <b>اسم الزبون:</b> ${customerName}\n`;
            decorMessage += `📞 <b>رقم الهاتف:</b> ${customerPhone}\n`;
            decorMessage += `📅 <b>تاريخ المناسبة:</b> ${finalDate || 'غير محدد'}\n`;
            decorMessage += `📍 <b>الموقع/العنوان:</b> ${deliveryAddress || 'غير محدد'}\n\n`;
            decorMessage += `📋 <b>العناصر المطلوبة للديكور:</b> \n`;
            
            decorItems.forEach((item, index) => {
                decorMessage += `${index + 1}. 🔹 <b>${item.name}</b> (الكمية: ${item.quantity})\n`;
                if (item.notes) decorMessage += `   ✍️ ملاحظة: ${item.notes}\n`;
            });

            if (notes) {
                decorMessage += `\n📝 <b>تفاصيل إضافية وتخصيص:</b> \n${notes}\n`;
            }

            decorMessage += `\n💰 <b>الإجمالي الخاص بالديكور:</b> ${decorTotal || 'موضح في الفاتورة'} دج\n`;
            decorMessage += `\nاضغط على الأزرار أدناه لتحديث حالة التجهيز.`;

            // بناء الأزرار التفاعلية المدمجة
            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: "✅ قبول وتأكيد التجهيز", callback_data: `decor_approve_${orderId}` },
                        { text: "❌ تعذر العمل / إلغاء", callback_data: `decor_reject_${orderId}` }
                    ]
                ]
            };

            // إرسال الرسالة التفاعلية لمسؤول الديكور
            await sendTelegramNotification(ROLES_CHAT_IDS.decor, decorMessage, inlineKeyboard);
            console.log("🚀 تم إرسال إشعار الديكور المفصل بنجاح إلى مسؤول الديكور.");
        }

        // صياغة وإرسال رسالة مسؤول التصوير
        if (hasPhoto) {
            const photoMessage = `
<b>📸 طلب تصوير جديد رقم: #${orderId}</b>
👤 <b>اسم الزبون:</b> ${customerName}
📞 <b>رقم الهاتف:</b> ${customerPhone}

🎬 <b>الخدمات المطلوبة:</b>
${photoProductsText}
            `;

            const inlineKeyboardPhoto = {
                inline_keyboard: [
                    [
                        { text: "✅ موافق (جاهز)", callback_data: `photo_approve_${orderId}` },
                        { text: "❌ إلغاء (غير جاهز)", callback_data: `photo_reject_${orderId}` }
                    ]
                ]
            };

            await sendTelegramNotification(ROLES_CHAT_IDS.photo, photoMessage, inlineKeyboardPhoto);
        }

        res.json({ success: true, message: 'تم حفظ طلبك بنجاح', orderId });
    } catch (err) {
        console.error("Order Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// طلب خدمة/منتج مخصص (شامل لجميع الأقسام)
// =====================================================
app.post('/api/orders/custom', verifyToken, upload.single('inspirationImage'), async (req, res) => {
    try {
        const { eventDate, category, customDetails, notes, selectedItemId, selectedItemName, selectedItemPrice } = req.body;
        
        let finalNotes = `--- طلب ${category || 'مخصص'} ---\n${customDetails || ''}\nملاحظات الزبون: ${notes || 'لا يوجد'}`;
        
        if (selectedItemName) {
            finalNotes += `\nالعنصر الأساسي المختار: ${selectedItemName}`;
        }

        if (req.file) {
            finalNotes += `\n[IMAGE:${req.file.path}]`;
        }

        const user = await getAsync(`SELECT Username, LastName, Phone, Email FROM Users WHERE UserID = ?`, [req.user.userId]);
        if (!user) throw new Error('المستخدم غير موجود');
        const customerName = `${user.Username} ${user.LastName || ''}`.trim();

        let productId;
        let unitPrice = parseFloat(selectedItemPrice) || 0;

        if (selectedItemId) {
            productId = parseInt(selectedItemId);
        } else {
            const prodName = `طلب ${category || 'مخصص'} (حسب الطلب)`;
            const prod = await getAsync(`SELECT ProductId FROM Products WHERE Name = ?`, [prodName]);
            if (prod) {
                productId = prod.ProductId;
            } else {
                const insertProd = await runAsync(
                    `INSERT INTO Products (Name, Description, Price, Category, IsActive, CreatedAt)
                     VALUES (?, 'طلب بمواصفات خاصة من الزبون', 0, 'custom', 1, CURRENT_TIMESTAMP)`,
                     [prodName]
                );
                productId = insertProd.lastID;
            }
        }

        const orderResult = await runAsync(
            `INSERT INTO Orders (UserId, CustomerName, CustomerPhone, CustomerEmail, DeliveryDate, Notes, TotalAmount, Status, OrderDate)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)`,
            [req.user.userId, customerName, user.Phone || 'غير متوفر', user.Email || null, eventDate, finalNotes, unitPrice]
        );
        const orderId = orderResult.lastID;

        await runAsync(
            `INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice) VALUES (?, ?, 1, ?)`,
            [orderId, productId, unitPrice]
        );

        // إشعار السوبر أدمن الموحد
        const customNotification = `
🌟 <b>طلب ${category || 'مخصص'} جديد!</b> 🌟
رقم الطلب: #${orderId}
الزبون: ${customerName}
الهاتف: ${user.Phone || 'غير متوفر'}
تاريخ المناسبة: ${eventDate || 'غير محدد'}
${customDetails || ''}
ملاحظات: ${notes || 'لا يوجد'}
        `;
        await sendTelegramNotification(ROLES_CHAT_IDS.superAdmin, customNotification);

        res.json({ success: true, orderId, message: 'تم استلام طلبك المخصص بنجاح' });
    } catch (err) {
        console.error("Custom Order Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 8. جلب طلبات المستخدم الحالي
// =====================================================
app.get('/api/user/orders', verifyToken, async (req, res) => {
    try {
        const orders = await allAsync(`SELECT * FROM Orders WHERE UserId = ? ORDER BY OrderDate DESC`, [req.user.userId]);
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// جلب تفاصيل طلبية محددة للزبون
// =====================================================
app.get('/api/orders/:id', verifyToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await getAsync(
            `SELECT * FROM Orders WHERE OrderId = ? AND UserId = ?`,
            [orderId, req.user.userId]
        );
        if (!order) {
            return res.status(404).json({ success: false, error: 'الطلب غير موجود أو لا تملك صلاحية الوصول إليه' });
        }
        const items = await allAsync(`
            SELECT oi.Quantity, oi.UnitPrice, p.ProductId, p.Name, p.ImageUrl
            FROM OrderItems oi
            JOIN Products p ON oi.ProductId = p.ProductId
            WHERE oi.OrderId = ?
        `, [orderId]);
        res.json({ success: true, order, items });
    } catch (err) {
        console.error("Fetch Order Details Error:", err.message);
        res.status(500).json({ success: false, error: 'حدث خطأ في الخادم' });
    }
});

// =====================================================
// 9. إضافة تقييم جديد
// =====================================================
app.post('/api/reviews', async (req, res) => {
    try {
        const { reviewerName, rating, comment } = req.body;
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                userId = decoded.userId;
            } catch(e) {}
        }
        await runAsync(
            `INSERT INTO Reviews (UserId, ReviewerName, Rating, Comment, IsApproved, CreatedAt)
             VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [userId, reviewerName, rating, comment]
        );
        res.json({ success: true, message: 'تم إرسال تقييمك، سيتم نشره بعد المراجعة' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// جلب التقييمات المعتمدة للموقع العام
// =====================================================
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await allAsync(
            `SELECT * FROM Reviews WHERE IsApproved = 1 ORDER BY CreatedAt DESC`
        );
        res.json({ success: true, reviews });
    } catch (err) {
        console.error("Fetch Public Reviews Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 11. جلب تقييمات المستخدم
// =====================================================
app.get('/api/user/reviews', verifyToken, async (req, res) => {
    try {
        const reviews = await allAsync(`SELECT ReviewId, Rating, Comment, IsApproved, CreatedAt FROM Reviews WHERE UserId = ? ORDER BY CreatedAt DESC`, [req.user.userId]);
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 12. التحقق من الرتبة
// =====================================================
app.get('/api/check-role', verifyToken, (req, res) => {
    res.json({ role: req.user.role });
});

// =====================================================
// مسار مؤقت لإضافة عمود DeliveryAddress إلى جدول الطلبيات في Turso
// =====================================================
app.get('/api/fix-db', async (req, res) => {
    try {
        await db.execute('ALTER TABLE Orders ADD COLUMN DeliveryAddress TEXT;');
        res.json({ success: true, message: 'تم إضافة عمود عنوان التسليم بنجاح! قاعدة البيانات جاهزة الآن.' });
    } catch (err) {
        res.json({ success: false, message: 'العمود موجود مسبقاً أو حدث خطأ', error: err.message });
    }
});

// =====================================================
// 12.5. إدارة التقييمات للأدمن
// =====================================================
app.get('/api/admin/reviews', verifyAdmin, async (req, res) => {
    try {
        const reviews = await allAsync(`SELECT r.*, u.Username FROM Reviews r LEFT JOIN Users u ON r.UserId = u.UserID ORDER BY r.CreatedAt DESC`);
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// تحديث حالة التقييم (موافقة / إخفاء) للإدارة
// =====================================================
app.put('/api/admin/reviews/:id/status', verifyAdmin, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { isApproved } = req.body;
        await runAsync(
            `UPDATE Reviews SET IsApproved = ? WHERE ReviewId = ?`,
            [isApproved, reviewId]
        );
        res.json({ success: true, message: 'تم تحديث حالة التقييم بنجاح' });
    } catch (err) {
        console.error("Update Review Status Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// حذف تقييم للإدارة
// =====================================================
app.delete('/api/admin/reviews/:id', verifyAdmin, async (req, res) => {
    try {
        const reviewId = req.params.id;
        await runAsync(`DELETE FROM Reviews WHERE ReviewId = ?`, [reviewId]);
        res.json({ success: true, message: 'تم حذف التقييم نهائياً' });
    } catch (err) {
        console.error("Delete Review Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 13. أرشفة طلب
// =====================================================
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await runAsync(`UPDATE Orders SET IsArchived = 1 WHERE OrderId = ?`, [req.params.id]);
        res.json({ success: true, message: "تم نقل الطلب إلى الأرشيف" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// مسارات لوحة تحكم الإدارة (المنتجات)
// =====================================================
app.get('/api/admin/products', verifyAdmin, async (req, res) => {
    try {
        const products = await allAsync(`SELECT * FROM Products WHERE IsDeleted = 0 OR IsDeleted IS NULL ORDER BY ProductId DESC`);
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/products', verifyAdmin, (req, res) => {
    upload.array('media', 10)(req, res, async function (err) {
        if (err) return res.status(400).json({ success: false, error: err.message });
        try {
            const { name, description, price, category, isActive, location, capacity, lat, lng, features, unitType } = req.body;
            const activeBit = isActive === 'true' ? 1 : 0;
            let imageUrl = '';
            let mediaFiles = '[]';
            if (req.files && req.files.length > 0) {
                const urls = req.files.map(f => f.path);
                imageUrl = urls[0];
                mediaFiles = JSON.stringify(urls);
            }
            await runAsync(
                `INSERT INTO Products (Name, Description, Price, Category, ImageUrl, MediaFiles, IsActive, CreatedAt, Location, Capacity, Latitude, Longitude, Features, UnitType)
                 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)`,
                [name, description || '', price, category, imageUrl, mediaFiles, activeBit,
                 location || null, capacity ? parseInt(capacity) : null,
                 lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null,
                 features || null, unitType || 'none']
            );
            res.json({ success: true, message: 'تمت إضافة المنتج بنجاح' });
        } catch (err) {
            console.error("Admin Add Product Error:", err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });
});

app.put('/api/admin/products/:id', verifyAdmin, (req, res) => {
    upload.array('media', 10)(req, res, async function (err) {
        if (err) return res.status(400).json({ success: false, error: err.message });
        try {
            const productId = parseInt(req.params.id);
            if (isNaN(productId)) return res.status(400).json({ success: false, error: 'معرّف المنتج غير صالح' });
            const { name, description, price, category, isActive, location, capacity, lat, lng, features, unitType, keptMedia } = req.body;
            const activeBit = isActive === 'true' ? 1 : 0;
            let keptMediaArray = [];
            if (keptMedia) try { keptMediaArray = JSON.parse(keptMedia); } catch(e) {}
            let newMedia = [];
            if (req.files && req.files.length > 0) newMedia = req.files.map(f => f.path);
            let mergedMedia = [...keptMediaArray, ...newMedia];
            let mergedMediaJson = JSON.stringify(mergedMedia);
            let finalImageUrl = '';
            if (mergedMedia.length > 0) {
                const firstImage = mergedMedia.find(f => /\.(jpeg|jpg|png|gif|webp)$/i.test(f));
                finalImageUrl = firstImage || mergedMedia[0];
            }
            await runAsync(
                `UPDATE Products SET 
                    Name = ?, Description = ?, Price = ?, Category = ?, IsActive = ?,
                    Location = ?, Capacity = ?, Latitude = ?, Longitude = ?, Features = ?,
                    UnitType = ?, ImageUrl = ?, MediaFiles = ?
                 WHERE ProductId = ?`,
                [name, description || '', price, category, activeBit,
                 location || null, capacity ? parseInt(capacity) : null,
                 lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null,
                 features || null, unitType || 'none',
                 finalImageUrl, mergedMediaJson, productId]
            );
            res.json({ success: true, message: 'تم تحديث المنتج بنجاح' });
        } catch (err) {
            console.error("Admin Update Product Error:", err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });
});

app.delete('/api/admin/products/:id', verifyAdmin, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) return res.status(400).json({ success: false, error: 'معرّف المنتج غير صحيح' });
        await runAsync(`UPDATE Products SET IsDeleted = 1, IsActive = 0 WHERE ProductId = ?`, [productId]);
        res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// مسارات المستخدمين للإدارة
// =====================================================
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const users = await allAsync(`SELECT UserID, Username, LastName, Email, Phone, Wilaya, IsAdmin, CreatedAt FROM Users ORDER BY CreatedAt DESC`);
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/admin/users/:id/role', verifyAdmin, async (req, res) => {
    try {
        const { isAdmin } = req.body;
        const role = isAdmin ? 'admin' : 'customer';
        await runAsync(`UPDATE Users SET IsAdmin = ?, Role = ? WHERE UserID = ?`, [isAdmin ? 1 : 0, role, req.params.id]);
        res.json({ success: true, message: 'تم تحديث صلاحيات المستخدم' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        await runAsync(`DELETE FROM Users WHERE UserID = ?`, [req.params.id]);
        res.json({ success: true, message: 'تم حذف المستخدم' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// مسارات معرض الأعمال (Gallery)
// =====================================================
app.get('/api/gallery', async (req, res) => {
    try {
        let sql = `SELECT GalleryId, Title, ImageUrl, Category, DisplayOrder FROM Gallery WHERE IsActive = 1`;
        let params = [];
        if (req.query.category) {
            sql += ` AND Category = ?`;
            params.push(req.query.category);
        }
        sql += ` ORDER BY DisplayOrder ASC, GalleryId DESC`;
        const images = await allAsync(sql, params);
        res.json({ success: true, images });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/admin/gallery', verifyAdmin, async (req, res) => {
    try {
        const images = await allAsync(`SELECT * FROM Gallery ORDER BY DisplayOrder ASC, GalleryId DESC`);
        res.json({ success: true, images });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/admin/gallery', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { title, category, displayOrder, isActive } = req.body;
        if (!req.file) return res.status(400).json({ success: false, error: 'الصورة مطلوبة' });
        const imageUrl = req.file.path;
        const activeBit = (isActive === 'true' || isActive === true) ? 1 : 0;
        const order = parseInt(displayOrder) || 0;
        await runAsync(
            `INSERT INTO Gallery (Title, ImageUrl, Category, DisplayOrder, IsActive, CreatedAt)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [title || '', imageUrl, category || 'general', order, activeBit]
        );
        res.json({ success: true, message: 'تمت إضافة الصورة إلى المعرض' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/admin/gallery/:id', verifyAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const imgRow = await getAsync(`SELECT ImageUrl FROM Gallery WHERE GalleryId = ?`, [id]);
        if (imgRow && imgRow.ImageUrl) {
            const oldPath = path.join(__dirname, 'uploads', imgRow.ImageUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        await runAsync(`DELETE FROM Gallery WHERE GalleryId = ?`, [id]);
        res.json({ success: true, message: 'تم حذف الصورة من المعرض' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// مسارات الطلبات للإدارة (مع إضافة DeliveryAddress)
// =====================================================
app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await allAsync(`
            SELECT 
                o.OrderId, 
                o.Status, 
                o.TotalAmount,
                o.OrderDate,
                o.DeliveryDate,
                o.DeliveryAddress,
                o.Notes,
                o.UserId,
                o.CustomerName,
                o.CustomerPhone,
                o.CustomerEmail,
                u.Username
            FROM Orders o
            LEFT JOIN Users u ON o.UserId = u.UserID
            WHERE (o.IsDeletedByAdmin = 0 OR o.IsDeletedByAdmin IS NULL)
            ORDER BY o.OrderDate DESC
        `);

        if (orders.length > 0) {
            const orderIds = orders.map(o => o.OrderId);
            const placeholders = orderIds.map(() => '?').join(',');
            
            const items = await allAsync(`
                SELECT oi.OrderId, oi.Quantity, oi.UnitPrice, p.Name, p.ImageUrl
                FROM OrderItems oi
                JOIN Products p ON oi.ProductId = p.ProductId
                WHERE oi.OrderId IN (${placeholders})
            `, orderIds);

            orders.forEach(o => {
                o.items = items.filter(i => i.OrderId === o.OrderId);
            });
        }

        res.json({ success: true, orders: orders });
    } catch (err) {
        console.error("خطأ بالسيرفر أثناء جلب طلبات الإدارة:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// تحديث حالة الطلب للإدارة
// =====================================================
app.put('/api/admin/orders/:id/status', verifyAdmin, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, error: 'يرجى تحديد الحالة الجديدة' });
        }
        await runAsync(
            `UPDATE Orders SET Status = ? WHERE OrderId = ?`, 
            [status, orderId]
        );
        res.json({ success: true, message: 'تم تحديث حالة الطلب بنجاح' });
    } catch (err) {
        console.error("Update Order Status Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// إحصائيات لوحة التحكم
// =====================================================
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const timeframe = req.query.timeframe || 'monthly';
        const usersCount = await getAsync(`SELECT COUNT(*) as count FROM Users`);
        const pendingOrders = await getAsync(`SELECT COUNT(*) as count FROM Orders WHERE Status IN ('Pending', 'Studying', 'Approved', 'InProgress') AND (IsDeleted = 0 OR IsDeleted IS NULL) AND (IsDeletedByAdmin = 0 OR IsDeletedByAdmin IS NULL)`);
        const completedOrders = await getAsync(`SELECT COUNT(*) as count FROM Orders WHERE Status = 'Delivered'`);
        const totalSales = await getAsync(`SELECT IFNULL(SUM(TotalAmount), 0) as total FROM Orders WHERE Status = 'Delivered'`);
        const ordersByStatus = await allAsync(`SELECT Status, COUNT(*) as count FROM Orders WHERE (IsDeleted = 0 OR IsDeleted IS NULL) GROUP BY Status`);

        let salesData = [];
        if (timeframe === 'daily') {
            salesData = await allAsync(`
                SELECT strftime('%Y-%m-%d', OrderDate) as dateLabel,
                       IFNULL(SUM(CASE WHEN Status = 'Delivered' THEN TotalAmount ELSE 0 END), 0) as totalSales,
                       COUNT(CASE WHEN (IsDeleted = 0 OR IsDeleted IS NULL) THEN 1 END) as count
                FROM Orders
                GROUP BY dateLabel
                ORDER BY dateLabel ASC
            `);
        } else if (timeframe === 'weekly') {
            salesData = await allAsync(`
                SELECT strftime('%Y-%W', OrderDate) as dateLabel,
                       IFNULL(SUM(CASE WHEN Status = 'Delivered' THEN TotalAmount ELSE 0 END), 0) as totalSales,
                       COUNT(CASE WHEN (IsDeleted = 0 OR IsDeleted IS NULL) THEN 1 END) as count
                FROM Orders
                GROUP BY dateLabel
                ORDER BY dateLabel ASC
            `);
        } else {
            salesData = await allAsync(`
                SELECT strftime('%Y-%m', OrderDate) as dateLabel,
                       IFNULL(SUM(CASE WHEN Status = 'Delivered' THEN TotalAmount ELSE 0 END), 0) as totalSales,
                       COUNT(CASE WHEN (IsDeleted = 0 OR IsDeleted IS NULL) THEN 1 END) as count
                FROM Orders
                GROUP BY dateLabel
                ORDER BY dateLabel ASC
            `);
        }

        const recentOrders = await allAsync(`
            SELECT OrderId, CustomerName, TotalAmount, Status, OrderDate
            FROM Orders
            WHERE (IsDeleted = 0 OR IsDeleted IS NULL)
            ORDER BY OrderDate DESC
            LIMIT 8
        `);

        const topProducts = await allAsync(`
            SELECT p.Name as name, SUM(oi.Quantity) as count
            FROM OrderItems oi
            JOIN Products p ON oi.ProductId = p.ProductId
            JOIN Orders o ON oi.OrderId = o.OrderId
            WHERE o.Status = 'Delivered'
            GROUP BY p.Name
            ORDER BY count DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            stats: {
                totalUsers: usersCount?.count || 0,
                pendingOrders: pendingOrders?.count || 0,
                completedOrders: completedOrders?.count || 0,
                totalSales: totalSales?.total || 0,
                ordersByStatus: ordersByStatus,
                salesData: salesData,
                recentOrders: recentOrders,
                topProducts: topProducts
            }
        });
    } catch (err) {
        console.error("Admin Stats Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// إخفاء الطلب من لوحة الإدارة (Soft Delete)
// =====================================================
app.delete('/api/admin/orders/:id', verifyAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await runAsync(`UPDATE Orders SET IsDeletedByAdmin = 1 WHERE OrderId = ?`, [id]);
        res.json({ success: true, message: 'تم إخفاء الطلب من لوحة التحكم بنجاح، الأرباح محفوظة.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// 14. تقرير المبيعات المخصص (الشهري / حسب التاريخ)
// =====================================================
app.get('/api/admin/report', verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = "";
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = "AND DATE(o.OrderDate) >= DATE(?) AND DATE(o.OrderDate) <= DATE(?)";
            params.push(startDate, endDate);
        }

        const reportData = await allAsync(`
            SELECT p.Name, SUM(oi.Quantity) as TotalQuantity, SUM(oi.Quantity * oi.UnitPrice) as TotalRevenue
            FROM OrderItems oi
            JOIN Orders o ON oi.OrderId = o.OrderId
            JOIN Products p ON oi.ProductId = p.ProductId
            WHERE o.Status = 'Delivered' AND (o.IsDeletedByAdmin = 0 OR o.IsDeletedByAdmin IS NULL) ${dateFilter}
            GROUP BY p.ProductId, p.Name
            ORDER BY TotalRevenue DESC
        `, params);

        const grandTotal = reportData.reduce((sum, item) => sum + item.TotalRevenue, 0);
        res.json({ success: true, data: reportData, grandTotal });
    } catch (err) {
        console.error("Report Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// جلب سجل نشاطات المشرفين (لصفحة الإعدادات)
// =====================================================
app.get('/api/admin/logs', verifyAdmin, async (req, res) => {
    try {
        const logs = await allAsync(`SELECT * FROM ActivityLogs ORDER BY CreatedAt DESC LIMIT 50`);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =====================================================
// مسار استقبال نقرات الأزرار من تيليجرام (Webhook)
// =====================================================
app.post('/api/telegram-webhook', async (req, res) => {
    // الرد الفوري على خادم تيليجرام لإعلامه باستلام الإشارة بنجاح
    res.sendStatus(200); 

    const update = req.body;
    if (!update.callback_query) return;

    const callbackQuery = update.callback_query;
    const callbackData = callbackQuery.data; 
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const originalText = callbackQuery.message.text;

    // معالجة نقرات أقسام الديكور والتصوير معاً
    if (callbackData.startsWith('decor_approve_') || callbackData.startsWith('decor_reject_') ||
        callbackData.startsWith('photo_approve_') || callbackData.startsWith('photo_reject_')) {
        
        const isDecor = callbackData.includes('decor_');
        const isApprove = callbackData.includes('_approve_');
        const orderId = callbackData.split('_').pop(); 
        
        const statusText = isApprove ? "✅ تم القبول والموافقة" : "❌ تم الاعتذار والرفض";
        const departmentName = isDecor ? "الديكور" : "التصوير الفوتوغرافي";
        
        // صياغة الرسالة التي ستصل إليك كسوبر أدمن لإعلامك بما حدث
        const bossNotifyText = isApprove 
            ? `<b>📢 تحديث من قسم ${departmentName}:</b>\nقام مسؤول القسم بـ <b>الموافقة</b> وتأكيد الطلب رقم <b>#${orderId}</b>.`
            : `<b>🚨 تنبيه من قسم ${departmentName}:</b>\nقام مسؤول القسم بـ <b>إلغاء/رفض</b> المهمة للطلب رقم <b>#${orderId}</b>.`;

        // 1. تحديث الرسالة الأصلية عند الموظف (لتختفي الأزرار ويظهر النص الجديد)
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: `${originalText}\n\n⚠️ <b>إجرائك الحالي:</b> ${statusText}`,
                    parse_mode: 'HTML'
                })
            });
        } catch (e) { console.error("خطأ أثناء تحديث رسالة الموظف:", e.message); }

        // 2. إرسال الإشعار الفوري لك (السوبر أدمن) لتعرف النتيجة
        await sendTelegramNotification(ROLES_CHAT_IDS.superAdmin, bossNotifyText);

        // 3. إنهاء حالة التحميل للزر في تطبيق تيليجرام
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    callback_query_id: callbackQuery.id, 
                    text: isApprove ? "تم إرسال موافقتك للمدير" : "تم إرسال اعتذارك للمدير" 
                })
            });
        } catch (e) { console.error("خطأ في قفل حدث النقر:", e.message); }
    }
});

// =====================================================
// معالج الأخطاء العام والمسارات غير الموجودة (يجب أن يكون في النهاية تماماً)
// =====================================================
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'المسار غير موجود' });
});

app.use((err, req, res, next) => {
    console.error("❌ خطأ غير متوقع:", err.stack);
    res.status(500).json({ success: false, error: 'حدث خطأ داخلي في الخادم' });
});

// =====================================================
// تشغيل السيرفر
// =====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
    console.log(`⚠️  تذكير: لتفعيل استقبال ضغطات الأزرار، يجب تعيين Webhook للبوت عبر: https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://your-domain.com/api/telegram-webhook`);
});