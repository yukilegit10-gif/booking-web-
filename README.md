# SOM HUIT – "Việc khó có chợ sinh viên lo" 🎓🛒🤝

Nền tảng **SOM (Student • Order • Market)** dành riêng cho sinh viên Đại học Công Thương TP.HCM (HUIT).
Tích hợp:
- **Chợ Đồ Cũ (Order)** & **Việc Vặt Nội Bộ (Market)**
- **Xác thực sinh viên HUIT qua MSSV & Thẻ sinh viên** (tích xanh, gửi về Telegram bot admin duyệt)
- **Hệ thống Bắt tay uy tín (Karma Handshake)** & đánh giá 2 chiều (hoàn toàn không dùng tiền tệ / nạp xu)
- **Nén ảnh tự động phía Client (WebP < 150KB)** bằng `browser-image-compression`
- **Khung chat thời gian thực** bảo mật chỉ 2 bên trong giao dịch được đọc
- **Chế độ Demo sẵn sàng kiểm thử ngay lập tức** mà không cần cấu hình database trước.

---

## 🚀 Khởi Chạy Nhanh Cho Admin Kiểm Thử (Chế độ Demo)

Dự án đã được tích hợp sẵn bộ dữ liệu mẫu sinh viên HUIT trong trình duyệt để Admin có thể thử nghiệm toàn bộ luồng mà không cần tạo tài khoản Supabase ngay:

```bash
# 1. Cài đặt thư viện (nếu chưa cài)
npm install

# 2. Khởi động server phát triển
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000):

### 🎯 Cách Kiểm Thử Tính Năng Admin:
1. **Thanh Banner Đổi Vai (ở trên cùng):**
   - Chuyển đổi qua lại giữa các tài khoản:
     - 👑 **Ban Quản Trị SOM** (Admin)
     - 👨‍💻 **Nguyễn Minh An** (Khoa CNTT - 135 Karma - Đã duyệt MSSV)
     - 👩‍🔬 **Trần Thu Bình** (Khoa Thực phẩm - 48 Karma - Đã duyệt MSSV)
     - 🧑‍🔧 **Lê Quốc Cường** (Khoa Cơ khí - 5 Karma - Chưa duyệt)
     - 👩‍💼 **Phạm Thị Dung** (Khoa QTKD - 12 Karma - Đang gửi ảnh thẻ chờ duyệt)
2. **Kiểm thử Duyệt MSSV:**
   - Bấm vào nút **"Duyệt MSSV"** hoặc truy cập `/admin`.
   - Admin sẽ thấy ảnh thẻ sinh viên của bạn *Phạm Thị Dung*.
   - Bấm **"✅ Duyệt tích xanh"** hoặc **"❌ Từ chối"** để kiểm tra thay đổi tích xanh tức thì.
3. **Kiểm thử Chat 2 chiều & Bắt tay Karma:**
   - Mở 2 tab trình duyệt (hoặc 1 tab thường + 1 tab ẩn danh).
   - Tab 1: Đăng nhập tài khoản *Nguyễn Minh An*.
   - Tab 2: Đăng nhập tài khoản *Trần Thu Bình*.
   - Nhắn tin qua lại và bấm nút **"🤝 Bắt tay (+10 Karma)"** ở cả 2 tab.
   - Khi cả 2 cùng bấm xác nhận, hệ thống cộng +10 điểm Karma cho cả 2 bạn và mở form đánh giá 1–5 sao.
4. **Kiểm thử Đăng tin & Nén ảnh:**
   - Vào `/post` để đăng bán đồ cũ hoặc đăng tìm người giúp việc gấp (SOS).
   - Đính kèm ảnh bất kỳ, hệ thống sẽ tự động nén xuống định dạng WebP < 150KB trước khi tải lên.

---

## 🛠️ Cấu Hình Khi Đưa Vào Sử Dụng Thật (Supabase + Telegram)

Khi bạn muốn kết nối với cơ sở dữ liệu thật trên Supabase và Telegram Bot:

### 1. Khởi tạo Database trên Supabase
1. Vào [Supabase Dashboard](https://supabase.com) tạo một Project mới.
2. Vào mục **SQL Editor**, mở file `supabase/schema.sql` trong dự án và dán toàn bộ vào chạy. Toàn bộ bảng, chính sách bảo mật RLS, triggers và storage buckets sẽ được tự động tạo.

### 2. Điền biến môi trường `.env.local`
Tạo file `.env.local` từ mẫu `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_WEBHOOK_SECRET=chuoi-bi-mat-tu-dat

# Phân quyền admin
ADMIN_EMAILS=admin@som.huit,bqt@huit.edu.vn
```

### 3. Đăng ký Webhook Telegram (cho nút Duyệt/Từ chối)
Chạy lệnh curl một lần sau khi bạn deploy website lên domain công khai (Vercel):
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram-webhook", "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"}'
```

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
├── app/
│   ├── api/
│   │   ├── admin/verifications/route.ts # API duyệt thẻ cho Admin
│   │   ├── telegram-webhook/route.ts    # Webhook Telegram nhận nút Duyệt / Từ chối
│   │   └── verify-student/route.ts      # API gửi yêu cầu thẻ SV về Telegram bot
│   ├── chat/                            # Danh sách tin nhắn & phòng chat thời gian thực
│   │   └── [ticketId]/page.tsx          # Chatroom + Bắt tay uy tín + Đánh giá sao
│   ├── listings/[id]/page.tsx           # Chi tiết tin đăng & hồ sơ người bán
│   ├── post/page.tsx                    # Form đăng tin Chợ đồ cũ / Việc vặt
│   ├── profile/page.tsx                 # Hồ sơ, điểm Karma, gửi ảnh thẻ SV
│   ├── admin/page.tsx                   # Bảng điều khiển admin duyệt MSSV
│   ├── login/page.tsx                   # Đăng nhập (+ Quick login cho tester)
│   ├── register/page.tsx                # Đăng ký tài khoản
│   ├── globals.css                      # Màu sắc & thiết kế chuẩn thương hiệu SOM
│   ├── layout.tsx                       # Layout chính
│   └── page.tsx                         # Trang chủ Chợ SOM (toggle Goods/Gigs)
├── components/
│   ├── AuthProvider.tsx                 # Quản lý phiên đăng nhập
│   ├── BottomNav.tsx                    # Menu điều hướng chân trang mobile
│   ├── DemoBanner.tsx                   # Thanh công cụ đổi vai kiểm thử admin
│   ├── FilterBar.tsx                    # Bộ lọc danh mục & điểm hẹn an toàn
│   ├── ImageUploader.tsx                # Bộ tải & nén ảnh WebP < 150KB
│   ├── ListingCard.tsx                  # Thẻ hiển thị tin chuẩn PeerZu style
│   ├── ModeToggle.tsx                   # Chuyển đổi Chợ Đồ Cũ ⇋ Việc Vặt
│   ├── Navbar.tsx                       # Thanh điều hướng với Logo SOM HUIT
│   └── SosTicker.tsx                    # Ticker tin khẩn cấp SOS
├── lib/
│   ├── api/                             # Bộ xử lý dữ liệu chung (Demo & Supabase)
│   ├── constants.ts                     # Danh mục HUIT, khoa, điểm hẹn an toàn
│   ├── image-compression.ts             # Tiện ích nén ảnh client WebP
│   ├── types.ts                         # Định nghĩa kiểu dữ liệu TypeScript
│   └── utils.ts                         # Tiện ích định dạng tiền tệ, ngày giờ, karma
├── public/
│   └── logo-som.png                     # Logo chính thức của SOM HUIT
└── supabase/
    └── schema.sql                       # Toàn bộ mã SQL Supabase đã tối ưu bảo mật
```
