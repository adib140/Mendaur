export const User = [
  {
    id_user: "user-001",
    role: "< User >",
    nama_user: "John Doe",
    no_hp: "081234567890",
    password: "agus123",
    email: "@",
    total_sampah: 32,
    total_poin: 1200,
    foto: "/public/assets/tumbuh.jpg",
    tanggal_gabung: "2025-10-06",
    sampah_terkumpul: 32,
    poin_terkumpul: 800,
    transaksi: 8,
    ajakan: 2,
    riwayat_aktivitas: [
      "Menyetor 5kg plastik ke Bank Sampah Induk Nusa",
      "Menukar 500 poin dengan sabun ramah lingkungan",
      "Naik ke Level 3"
    ],
    badge_terkumpul: [], // akan diisi otomatis jika pakai hybrid unlock
    badge_aktif: null // tambahkan ini untuk menyimpan badge yang dipilih
  }
];