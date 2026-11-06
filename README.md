# SECOND ME — The Emberforge

Game giải đố hành động bằng React, TypeScript và Vite, sử dụng Echo để ghi và phát lại đường đi.

## Nội dung

- Intro, màn tải và lobby rừng để chọn màn.
- 5 màn giải đố có giới hạn 6 giây cho từng chặng.
- Bẫy dập, đá rơi và dây leo làm chậm.
- Thu thập 5 di vật, rèn Kiếm Echo và đánh boss ở màn 6.
- Trung tâm thông báo và cài đặt âm lượng, tắt âm, giảm chuyển động, hướng dẫn.
- Hoàn thành chiến dịch sẽ mở cả 6 màn để tự do chơi lại.
- Nhấn `Y` bốn lần liên tiếp để mở toàn bộ màn trong phiên kiểm thử hiện tại.

## Chạy dự án

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`.

## Điều khiển

- `WASD` hoặc phím mũi tên: di chuyển
- `R`: bắt đầu/dừng ghi đường đi
- `E`: gọi Echo
- `Q`: xóa Echo
- `J` hoặc `Space`: chém kiếm khi đánh boss
- `Shift`: lướt né
- `Esc`: tạm dừng
- `T`: chơi lại màn

## Kiểm tra

```bash
pnpm exec tsx --test src/game/GameEngine.test.ts src/game/logic/*.test.ts
pnpm exec tsc --noEmit
pnpm build
```

Hiện có 43 bài kiểm tra tự động cho Echo, cổng, bẫy, đồng hồ, lobby, dev unlock, chiến dịch và boss.
