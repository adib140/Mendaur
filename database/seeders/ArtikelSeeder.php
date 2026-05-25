<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Artikel;
use Illuminate\Support\Str;

class ArtikelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $artikels = [
            [
                'judul' => '5 Cara Mudah Memilah Sampah di Rumah',
                'konten' => "Memilah sampah merupakan langkah pertama dalam pengelolaan limbah yang bertanggung jawab. Berikut adalah 5 cara mudah yang bisa Anda terapkan di rumah:\n\n1. Sediakan Tempat Sampah Terpisah\nSiapkan minimal 3 tempat sampah dengan warna berbeda: hijau untuk organik, kuning untuk anorganik, dan merah untuk B3 (Bahan Berbahaya dan Beracun).\n\n2. Kenali Jenis Sampah\nPelajari perbedaan antara sampah organik (sisa makanan, daun) dan anorganik (plastik, kertas, logam). Sampah organik bisa dikompos, sementara anorganik bisa didaur ulang.\n\n3. Cuci Kemasan Sebelum Dibuang\nKemasan makanan atau minuman sebaiknya dibilas terlebih dahulu sebelum dimasukkan ke tempat sampah anorganik. Ini memudahkan proses daur ulang.\n\n4. Pisahkan Sampah Berbahaya\nBaterai bekas, lampu neon, dan obat kadaluarsa termasuk sampah B3 yang harus dipisahkan dan dibuang di tempat khusus.\n\n5. Konsisten dan Ajak Keluarga\nLibatkan seluruh anggota keluarga dalam pemilahan sampah. Konsistensi adalah kunci keberhasilan pengelolaan sampah di rumah.\n\nDengan menerapkan 5 cara ini, Anda sudah berkontribusi besar dalam menjaga lingkungan!",
                'penulis' => 'Tim Mendaur',
                'kategori' => 'Tips & Trik',
                'tanggal_publikasi' => '2024-11-01',
                'views' => 245,
            ],
            [
                'judul' => 'Manfaat Daur Ulang Plastik untuk Lingkungan',
                'konten' => "Sampah plastik menjadi salah satu masalah lingkungan terbesar di dunia. Indonesia sendiri menghasilkan 67,2 juta ton sampah per tahun, dengan 14% di antaranya adalah plastik. Namun, daur ulang plastik dapat memberikan dampak positif yang signifikan:\n\nMengurangi Pencemaran Laut\nSetiap tahun, 8 juta ton plastik masuk ke laut. Dengan mendaur ulang, kita mengurangi jumlah plastik yang berakhir di ekosistem laut dan membahayakan kehidupan maritim.\n\nMenghemat Energi\nProduksi plastik baru dari bahan mentah membutuhkan 88% energi lebih banyak dibandingkan menggunakan plastik daur ulang. Daur ulang plastik menghemat energi setara dengan 1,8 miliar liter bensin per tahun.\n\nMengurangi Emisi Karbon\nProses daur ulang plastik mengurangi emisi gas rumah kaca hingga 30% dibandingkan produksi plastik virgin. Ini berarti udara lebih bersih dan perubahan iklim dapat diperlambat.\n\nMenciptakan Lapangan Kerja\nIndustri daur ulang menyerap banyak tenaga kerja, mulai dari pengumpul, pemilah, hingga teknisi pengolahan. Di Indonesia, sektor ini mempekerjakan lebih dari 4 juta orang.\n\nMenghasilkan Produk Baru\nPlastik daur ulang dapat diubah menjadi berbagai produk bermanfaat seperti tas belanja, furniture, pakaian, hingga komponen otomotif.\n\nMari mulai dari hal kecil: pilah sampah plastik Anda dan setor ke bank sampah terdekat!",
                'penulis' => 'Dr. Budi Santoso',
                'kategori' => 'Edukasi',
                'tanggal_publikasi' => '2024-11-05',
                'views' => 892,
            ],
            [
                'judul' => 'Kisah Sukses Bank Sampah Sumber Rejeki',
                'konten' => "Bank Sampah Sumber Rejeki di Surabaya telah beroperasi sejak 2015 dan kini menjadi contoh sukses pengelolaan sampah berbasis masyarakat.\n\nAwal Mula\nDimulai oleh Ibu Siti Maryam yang prihatin melihat tumpukan sampah di lingkungannya. Dengan modal awal Rp 5 juta, beliau mengajak 20 warga untuk memilah dan menjual sampah ke pengepul.\n\nPerkembangan Pesat\nKini Bank Sampah Sumber Rejeki memiliki 450 nasabah aktif dengan omzet Rp 45 juta per bulan. Mereka mengelola 8 ton sampah yang terdiri dari plastik, kertas, logam, dan kaca.\n\nDampak Sosial\nSetiap nasabah rata-rata mendapat penghasilan tambahan Rp 200.000-500.000 per bulan. Dana hasil pengelolaan sampah juga digunakan untuk kegiatan sosial seperti santunan anak yatim dan bantuan kesehatan warga kurang mampu.\n\nInovasi Produk\nBank sampah ini juga mengembangkan produk kerajinan dari sampah plastik seperti tas, dompet, dan vas bunga yang dipasarkan secara online. Omzet dari produk kerajinan mencapai Rp 15 juta per bulan.\n\nPenghargaan\nBerkat dedikasinya, Bank Sampah Sumber Rejeki meraih penghargaan Bank Sampah Terbaik tingkat Nasional 2023 dari Kementerian Lingkungan Hidup.\n\nKesuksesan Bank Sampah Sumber Rejeki membuktikan bahwa sampah bisa menjadi berkah jika dikelola dengan baik. Tertarik untuk mendirikan bank sampah di lingkungan Anda?",
                'penulis' => 'Rina Wijaya',
                'kategori' => 'Inspirasi',
                'tanggal_publikasi' => '2024-11-10',
                'views' => 1563,
            ],
            [
                'judul' => 'Mengubah Sampah Organik Menjadi Kompos Berkualitas',
                'konten' => "Kompos adalah pupuk alami yang dibuat dari sampah organik. Prosesnya mudah dan bisa dilakukan di rumah!\n\nPersiapan Alat dan Bahan\n- Komposter atau ember berlubang\n- Sampah organik (sisa sayur, buah, daun)\n- Tanah secukupnya\n- EM4 atau MOL (Mikroorganisme Lokal)\n- Sekam atau serbuk gergaji\n\nLangkah Pembuatan\n1. Cacah sampah organik menjadi potongan kecil (2-3 cm)\n2. Masukkan lapisan sampah organik 10 cm ke dalam komposter\n3. Taburi tanah dan sekam tipis-tipis\n4. Siram dengan larutan EM4 atau MOL\n5. Ulangi hingga komposter penuh\n6. Tutup rapat dan biarkan 3-4 minggu\n7. Aduk setiap 3 hari sekali untuk aerasi\n8. Kompos siap digunakan jika berwarna coklat kehitaman dan berbau tanah\n\nTips Sukses\n- Jaga kelembaban kompos (seperti tanah yang diperas)\n- Hindari sampah berlemak, daging, atau tulang\n- Tambahkan daun kering jika terlalu basah\n- Letakkan komposter di tempat teduh\n\nManfaat Kompos\n- Menyuburkan tanah tanpa bahan kimia\n- Memperbaiki struktur tanah\n- Meningkatkan daya serap air tanah\n- Menghemat biaya pupuk\n- Mengurangi sampah rumah tangga hingga 40%\n\nDengan membuat kompos, Anda tidak hanya mengolah sampah tetapi juga mendukung pertanian organik!",
                'penulis' => 'Agus Hermawan',
                'kategori' => 'Tutorial',
                'tanggal_publikasi' => '2024-11-12',
                'views' => 678,
            ],
            [
                'judul' => 'Dampak Sampah Plastik Terhadap Ekosistem Laut',
                'konten' => "Laut kita sedang dalam bahaya! Setiap tahun, 8 juta ton plastik masuk ke lautan dunia, dan Indonesia menjadi kontributor terbesar kedua setelah China.\n\nFakta Mengejutkan\n- 100.000 hewan laut mati setiap tahun karena terjerat atau memakan plastik\n- Mikroplastik ditemukan di 90% burung laut\n- Pada tahun 2050, diprediksi plastik di laut akan lebih banyak dari ikan\n- 73% sampah di pantai Indonesia adalah plastik\n\nJenis Plastik Berbahaya\n1. Tas Plastik: Terurai dalam 20 tahun, sering dimakan penyu yang mengira itu ubur-ubur\n2. Botol Plastik: Terurai dalam 450 tahun, melepaskan mikroplastik berbahaya\n3. Styrofoam: Tidak pernah terurai, mencemari rantai makanan\n4. Jaring Ikan: Menjerat mamalia laut dan menyebabkan kematian lambat\n\nDampak pada Manusia\nMikroplastik yang dimakan ikan laut akhirnya masuk ke tubuh manusia melalui konsumsi seafood. Penelitian menemukan mikroplastik dalam darah manusia, yang berpotensi menyebabkan gangguan hormonal dan reproduksi.\n\nSolusi yang Bisa Dilakukan\n- Kurangi penggunaan plastik sekali pakai\n- Gunakan tas belanja dan botol minum reusable\n- Ikut kegiatan beach clean-up\n- Pilah dan daur ulang sampah plastik\n- Dukung kebijakan pengurangan plastik\n\nLaut yang sehat adalah masa depan kita. Mari bertindak sekarang sebelum terlambat!",
                'penulis' => 'Dr. Maria Kusuma',
                'kategori' => 'Lingkungan',
                'tanggal_publikasi' => '2024-11-14',
                'views' => 2341,
            ],
            [
                'judul' => 'Kreasi DIY: Membuat Pot Tanaman dari Botol Plastik',
                'konten' => "Jangan buang botol plastik bekas! Ubah menjadi pot tanaman yang cantik dan fungsional. Berikut tutorialnya:\n\nAlat dan Bahan\n- Botol plastik bekas (berbagai ukuran)\n- Cutter atau gunting\n- Cat akrilik atau spray paint\n- Kuas\n- Spidol permanen\n- Tali goni (opsional untuk gantung)\n- Tanah dan tanaman\n\nCara Membuat Pot Vertikal\n1. Cuci bersih botol plastik\n2. Potong botol secara horizontal (1/3 bagian atas)\n3. Lubangi bagian bawah untuk drainase air\n4. Cat atau hias sesuai selera\n5. Isi dengan tanah dan tanam bibit\n6. Gantung atau tata di dinding\n\nCara Membuat Pot Karakter\n1. Gunakan botol 1,5 liter\n2. Potong botol bagian atas (sisakan 2/3 bagian bawah)\n3. Gambar wajah lucu dengan spidol permanen\n4. Cat dengan warna-warna cerah\n5. Isi tanah dan tanam tanaman kecil sebagai 'rambut'\n\nTanaman yang Cocok\n- Sirih gading (mudah perawatan)\n- Kaktus mini (hemat air)\n- Sukulen (tahan panas)\n- Cabai atau tomat ceri (produktif)\n- Selada atau bayam (sayuran cepat panen)\n\nTips Dekorasi\n- Gunakan cat warna-warni untuk tampilan ceria\n- Susun bertingkat untuk taman vertikal\n- Tambahkan stiker atau glitter untuk anak-anak\n- Gunakan teknik decoupage dengan kertas koran\n\nManfaat\n- Menghemat biaya pot tanaman\n- Mengurangi sampah plastik\n- Menambah keindahan rumah\n- Edukasi anak tentang daur ulang\n- Hobi berkebun jadi lebih menyenangkan\n\nSelamat berkreasi! Bagikan hasil karya Anda dengan hashtag #MendaurKreatif",
                'penulis' => 'Dewi Lestari',
                'kategori' => 'DIY',
                'tanggal_publikasi' => '2024-11-15',
                'views' => 1127,
            ],
            [
                'judul' => 'Regulasi Terbaru: Kebijakan Pengurangan Sampah Plastik di Indonesia',
                'konten' => "Pemerintah Indonesia terus berupaya mengatasi krisis sampah plastik melalui berbagai regulasi. Apa saja kebijakan terbaru?\n\nPeraturan Presiden No. 97 Tahun 2023\nMengatur tentang Kebijakan dan Strategi Nasional Pengelolaan Sampah Rumah Tangga dan Sampah Sejenis Sampah Rumah Tangga dengan target:\n- Pengurangan sampah 30% pada tahun 2025\n- Penanganan sampah 70% pada tahun 2025\n- Pencapaian zero waste to landfill pada tahun 2040\n\nLarangan Kantong Plastik\nBerbagai daerah telah menerapkan larangan kantong plastik sekali pakai:\n- Jakarta: Larangan total sejak Juli 2020\n- Bali: Larangan sejak Desember 2018\n- Bandung: Larangan sejak Februari 2019\n- Bogor: Larangan sejak Desember 2018\n\nPajak Plastik (Cukai)\nPemerintah berencana menerapkan cukai plastik untuk kantong plastik dan kemasan sekali pakai mulai 2025. Besaran cukai berkisar Rp 200-500 per lembar/unit.\n\nExtended Producer Responsibility (EPR)\nKebijakan yang mewajibkan produsen bertanggung jawab atas daur ulang kemasan produknya:\n- Target daur ulang minimal 30% pada 2025\n- Meningkat hingga 80% pada 2030\n- Produsen wajib memiliki sistem take-back\n\nInsentif Bisnis Ramah Lingkungan\n- Keringanan pajak untuk industri daur ulang\n- Subsidi untuk teknologi pengolahan sampah\n- Bantuan modal usaha bank sampah\n\nSanksi Pelanggaran\n- Denda administratif hingga Rp 100 juta\n- Pencabutan izin usaha untuk pelanggar berulang\n- Kerja sosial untuk pelanggaran ringan\n\nPeran Masyarakat\nRegulasi ini akan efektif jika didukung kesadaran masyarakat. Mari patuhi aturan dan ubah gaya hidup menjadi lebih ramah lingkungan!\n\nSumber: Kementerian Lingkungan Hidup dan Kehutanan RI",
                'penulis' => 'Andi Prasetyo',
                'kategori' => 'Berita',
                'tanggal_publikasi' => '2024-11-16',
                'views' => 445,
            ],
            [
                'judul' => '10 Manfaat Ekonomi dari Pengelolaan Sampah yang Baik',
                'konten' => "Pengelolaan sampah bukan hanya masalah lingkungan, tetapi juga peluang ekonomi! Berikut 10 manfaat ekonominya:\n\n1. Penghasilan Tambahan untuk Rumah Tangga\nDengan menjual sampah anorganik ke bank sampah, rata-rata rumah tangga bisa mendapat penghasilan Rp 100.000-300.000 per bulan.\n\n2. Lapangan Kerja Baru\nIndustri pengelolaan sampah menyerap jutaan tenaga kerja: pengumpul sampah, sopir truk sampah, operator TPA, pekerja bank sampah, hingga desainer produk daur ulang.\n\n3. Industri Daur Ulang\nNilai ekonomi industri daur ulang di Indonesia mencapai Rp 50 triliun per tahun dengan potensi pertumbuhan 15% annually.\n\n4. Penghematan Biaya Pengelolaan Sampah\nDengan pengurangan volume sampah melalui 3R (Reduce, Reuse, Recycle), pemerintah bisa menghemat biaya operasional TPA hingga 40%.\n\n5. Produk Kerajinan Bernilai Tinggi\nKreasi dari sampah daur ulang seperti tas dari plastik daur ulang bisa dijual Rp 50.000-500.000 tergantung desain dan kualitas.\n\n6. Energi Listrik dari Sampah\nPLTSa (Pembangkit Listrik Tenaga Sampah) dapat menghasilkan listrik. 1 ton sampah menghasilkan 500-600 kWh listrik.\n\n7. Pupuk Kompos\nKompos dari sampah organik bernilai Rp 1.000-2.000 per kg. Potensi pasar pupuk organik Indonesia mencapai Rp 10 triliun.\n\n8. Pengurangan Impor Bahan Baku\nDengan mendaur ulang plastik, kita mengurangi impor resin plastik yang menguras devisa negara.\n\n9. Wisata Edukasi\nBank sampah dan fasilitas pengolahan sampah modern bisa menjadi objek wisata edukasi yang menghasilkan pendapatan.\n\n10. Investasi Teknologi Hijau\nPertumbuhan industri waste-to-energy dan teknologi daur ulang menarik investasi asing dan domestik.\n\nKesimpulan\nSampah adalah sumber daya ekonomi yang belum dimanfaatkan optimal. Dengan pengelolaan yang baik, sampah bisa menjadi emas!",
                'penulis' => 'Siti Nurhaliza',
                'kategori' => 'Ekonomi',
                'tanggal_publikasi' => '2024-11-17',
                'views' => 156,
            ],
        ];

        foreach ($artikels as $artikel) {
            Artikel::updateOrCreate(
                ['judul' => $artikel['judul']], // Unique key
                [
                    'judul' => $artikel['judul'],
                    'slug' => Str::slug($artikel['judul']),
                    'konten' => $artikel['konten'],
                    'foto_cover' => null, // Will be handled by frontend upload
                    'penulis' => $artikel['penulis'],
                    'kategori' => $artikel['kategori'],
                    'tanggal_publikasi' => $artikel['tanggal_publikasi'],
                    'views' => $artikel['views'],
                ]
            );
        }

        $this->command->info('✅ Successfully seeded ' . count($artikels) . ' artikels!');
    }
}
