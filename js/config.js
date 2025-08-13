// Supabase leaderboard config
// Điền thông tin dự án của bạn vào 2 trường dưới đây rồi commit/push
// Ví dụ supabaseUrl: "https://your-project-id.supabase.co"
// Ví dụ supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (ANON PUBLIC KEY)

window.LEADERBOARD_CONFIG = {
	// BẮT BUỘC: URL dự án Supabase
	supabaseUrl: "https://kdnjmcfukicdzygmchzp.supabase.co",
	// BẮT BUỘC: Public ANON KEY (không dùng service_role)
	supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkbmptY2Z1a2ljZHp5Z21jaHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDgxMTEsImV4cCI6MjA3MDYyNDExMX0.7yl9LoDKTpUF59_9ZwBgdScKGkDbrbVf3ac_Z1I_HQA",
	// Tên bảng lưu điểm (giữ nguyên nếu bạn dùng script SQL mình cung cấp)
	table: "scores"
};
