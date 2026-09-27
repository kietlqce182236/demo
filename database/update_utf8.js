const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'kidsnutrijournal_dev',
});

async function main() {
  await client.connect();
  await client.query(`
    UPDATE snack_services SET 
      name = 'Gói Năng Lượng Chiều', 
      description = 'Sữa hạt Yến mạch & Bánh Tart Táo Nướng Mật Ong chất lượng tiêu chuẩn 210 kcal/trẻ, đảm bảo không chất bảo quản và đường hóa học.' 
    WHERE id = '55100000-0000-0000-0000-000000000001';
  `);
  await client.query(`
    UPDATE snack_services SET 
      name = 'Gói Dinh Dưỡng Cao Cấp', 
      description = 'Yogurt Trái Cây & Bánh Đậu Xanh Tươi bổ sung vitamin, khoáng chất và men vi sinh giúp bé tiêu hóa tốt.' 
    WHERE id = '55100000-0000-0000-0000-000000000002';
  `);
  await client.query(`
    UPDATE snack_services SET 
      name = 'Gói Tiêu Chuẩn Truyền Thống', 
      description = 'Chè Hạt Sen Long Nhãn & Sữa Đậu Nành tươi giữ gìn hương vị truyền thống và dinh dưỡng thanh mát.' 
    WHERE id = '55100000-0000-0000-0000-000000000003';
  `);
  await client.query(`
    UPDATE snack_services SET 
      name = 'Gói Chăm Sóc Đặc Biệt Bé Nhỏ', 
      description = 'Pudding Ngũ Cốc Tươi & Nước Ép Lê Rơm chế biến mềm, dễ tiêu dành riêng cho lứa tuổi nhà trẻ mầm.' 
    WHERE id = '55100000-0000-0000-0000-000000000004';
  `);
  await client.query(`
    UPDATE snack_services SET 
      name = 'Gói Trái Cây Tươi Mùa Thu', 
      description = 'Dưa Lưới & Táo Bơm Hạt Chia bổ sung chất xơ tự nhiên và lượng nước giàu vitamin.' 
    WHERE id = '55100000-0000-0000-0000-000000000005';
  `);
  console.log('UTF8_UPDATE_SUCCESS');
  await client.end();
}

main().catch(console.error);
