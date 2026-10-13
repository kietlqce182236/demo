# KidMeal (NutriBud) — Preschool Nutrition and Meal Management System

Hệ thống số hoá và quản lý dinh dưỡng, thực đơn bán trú, kiểm thực 3 bước và theo dõi biểu đồ phát triển thể chất trẻ mầm non theo **Thông tư 28/2016/TT-BGDĐT**, **Quyết định 1246/QĐ-BYT** và **Chuẩn tăng trưởng WHO**.

---

## 🚀 Kiến trúc Hệ thống trên Docker

Hệ thống được đóng gói hoàn chỉnh bằng **Docker & Docker Compose** gồm 6 dịch vụ hoạt động đồng bộ:

| Dịch vụ | Công nghệ | Container Name | Cổng truy cập (Host) | Mục đích |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx Reverse Proxy** | Nginx 1.25 Alpine | `kidmeal_nginx` | `80` (HTTP), `443` (HTTPS) | SSL Termination, Proxy định tuyến API, Web, Socket.IO & MinIO |
| **Frontend** | React 18, Vite, Tailwind CSS | `kidmeal_frontend` | `5173` (hoặc qua Nginx `443`) | Giao diện Single Page Application (SPA) cho 5 vai trò |
| **Backend API** | NestJS 10, TypeORM, Socket.IO | `kidmeal_backend` | `3000` (hoặc qua Nginx `/api/`) | REST API, WebSocket Gateway, Rule Engine, Xác thực JWT |
| **Database** | PostgreSQL 16 Alpine | `kidmeal_postgres` | `5433` (Container `5432`) | Cơ sở dữ liệu quan hệ, RLS Multi-tenancy, tự động nạp `schema.sql` & `seed.sql` |
| **Cache & Realtime** | Redis 7 Alpine | `kidmeal_redis` | `6379` | Cache, Session, Realtime PubSub KDS |
| **Object Storage** | MinIO S3 Object Storage | `kidmeal_minio` | `9000` (API), `9001` (Web Console) | Lưu trữ hình ảnh kiểm thực 3 bước, mẫu lưu thức ăn, avatar |

---

## 🛠️ Hướng dẫn Khởi chạy với Docker

### 1. Yêu cầu Tiên quyết
- Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đảm bảo Docker Engine đang chạy).
- Node.js & pnpm (tùy chọn nếu muốn chạy lệnh trực tiếp từ monorepo).

### 2. Khởi chạy toàn bộ hệ thống
Tại thư mục gốc của dự án, chạy lệnh:

```bash
# Bằng pnpm:
pnpm docker:up

# Hoặc bằng Docker Compose trực tiếp:
docker compose up -d
```

Để build lại images khi có sự thay đổi mã nguồn:
```bash
docker compose up -d --build
```

### 3. Dừng hệ thống
```bash
# Bằng pnpm:
pnpm docker:down

# Hoặc:
docker compose down
```

Nếu muốn xóa sạch toàn bộ database volume để nạp mới lại dữ liệu từ đầu:
```bash
docker compose down -v && docker compose up -d
```

### 4. Xem Logs
```bash
# Xem logs toàn bộ hệ thống:
docker compose logs -f

# Xem riêng logs backend:
docker logs -f kidmeal_backend

# Xem riêng logs frontend:
docker logs -f kidmeal_frontend
```

---

## 🌐 Đường dẫn Truy cập Ứng dụng

Sau khi khởi chạy thành công:

- **Ứng dụng Web chính (HTTPS qua Nginx)**: [https://localhost](https://localhost) *(Khuyến nghị)*
- **Ứng dụng Web trực tiếp (Frontend container)**: [http://localhost:5173](http://localhost:5173)
- **Swagger API Documentation**: [https://localhost/api/docs](https://localhost/api/docs) hoặc [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **MinIO Web Console**: [http://localhost:9001](http://localhost:9001)
  - Username: `minioadmin`
  - Password: `minioadmin123`
- **PostgreSQL Database**: `localhost:5433`
  - Database: `KidMeal`
  - Username: `KidMeal`
  - Password: `kidmeal_secret_2024`

*(Lưu ý: Chứng chỉ SSL tự ký nội bộ cho `localhost` có sẵn tại `nginx/ssl/cert.pem`. Khi mở trình duyệt lần đầu, chọn "Nâng cao" -> "Tiếp tục truy cập localhost (không an toàn)").*

---

## 👥 Tài khoản Thử nghiệm Mặc định

Hệ thống đã được nạp sẵn dữ liệu mẫu thực tế của **Trường Mẫu Giáo Hướng Dương** với đầy đủ các vai trò:

| Vai trò | Email đăng nhập | Mật khẩu | Chức danh |
| :--- | :--- | :--- | :--- |
| **Ban Giám Hiệu** | `hieutruong@huongduong.edu.vn` | `123456` | Hiệu trưởng (Quản trị & Phê duyệt) |
| **Chuyên viên Dinh dưỡng** | `dinhduong@huongduong.edu.vn` | `123456` | Xây dựng thực đơn, cân đối P:L:G |
| **Nhân viên Bếp** | `bep@huongduong.edu.vn` | `123456` | Màn hình bếp (KDS), Kiểm thực 3 bước, Lưu mẫu 24h |
| **Giáo viên Chủ nhiệm** | `giaovien.mam1@huongduong.edu.vn` | `123456` | Điểm danh ăn, ghi nhận mức ăn |

---

## 🧪 Kiểm tra Tính toàn vẹn Cơ sở Dữ liệu

Để kiểm tra 47 bảng, 73 chỉ mục, khóa ngoại và dữ liệu mẫu seed:
```bash
node database/verify_schema.js
```
