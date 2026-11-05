import React, { useState, useEffect, useRef } from "react";
import { 
  Wand2, 
  BookOpen, 
  IdCard, 
  Sliders, 
  Image as ImageIcon, 
  FileText, 
  FileJson, 
  Download, 
  Upload, 
  Printer, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  GraduationCap,
  Heart,
  Book,
  Layers,
  Info,
  FileType,
  Keyboard,
  ListOrdered,
  BarChart3,
  Gamepad2,
  Key,
  Shuffle,
  RefreshCw,
  CheckCircle2,
  Award,
  CheckCheck,
  FileCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Percent,
  ClipboardCheck,
  Sparkles,
  FileUp,
  UserCheck,
  FileDown,
  Filter,
  Clock,
  Play,
  Pause,
  Timer,
  AlertTriangle,
  Volume2,
  VolumeX,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MoveVertical,
  Search,
  Bell,
  Calendar,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from "./lib/utils";
import { PdfExportModal } from "./components/PdfExportModal";
import { ItemAnalysis } from "./components/ItemAnalysis";
import { DashboardOverview } from "./components/DashboardOverview";

import * as pdfjs from "pdfjs-dist";

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// --- Types ---

type Curriculum = "merdeka" | "kbc" | "k13" | "hybrid";

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  answer: string;
  difficulty: "mudah" | "sedang" | "sulit";
  cognitiveLevel: string;
  explanation?: string;
  indicator?: string;
}

interface GradeDetail {
  qIndex: number;
  qNum: number;
  question: string;
  type: string;
  options?: string[];
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface GradingSummary {
  studentName: string;
  studentClass: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  scorePercentage: number;
  predicate: {
    grade: string;
    label: string;
    color: string;
    bg: string;
    badgeBg: string;
  };
  details: GradeDetail[];
  evaluatedAt: string;
}

interface AppState {
  curriculum: Curriculum;
  guru: string;
  sekolah: string;
  jenjang: string;
  kelas: string;
  mapel: string;
  mapelCustom: string;
  topik: string;
  materiMethod: "none" | "pdf" | "txt" | "manual";
  materiText: string;
  materiInstruction: string;
  jenisAsesmen: string;
  opsiJawaban: "4" | "5";
  shuffleQuestions: boolean;
  counts: {
    pg: number;
    isian: number;
    essay: number;
    pgKompleks: number;
    bs: number;
    jodoh: number;
    urutan: number;
    tabel: number;
    sebabAkibat: number;
  };
  proportions: {
    mudah: number;
    sedang: number;
    sulit: number;
  };
  cognitiveLevels: string[];
  visuals: {
    ilustrasi: number;
    diagram: number;
    mindmap: number;
  };
}

// --- Constants ---

const COGNITIVE_LEVELS = ["C1", "C2", "C3", "C4", "C5", "C6"];

export interface MapelGroup {
  groupName: string;
  items: string[];
}

export const JENJANG_OPTIONS = [
  { value: "SD", label: "SD / MI (Sekolah Dasar)" },
  { value: "SMP", label: "SMP / MTs (Sekolah Menengah Pertama)" },
  { value: "SMA", label: "SMA / MA (Sekolah Menengah Atas)" },
  { value: "SMK", label: "SMK (Sekolah Menengah Kejuruan)" },
];

export const MAPEL_STRUCTURE_BY_JENJANG: Record<string, MapelGroup[]> = {
  SMK: [
    {
      groupName: "Mata Pelajaran Kejuruan & Produktif",
      items: [
        "Teknik Komputer dan Jaringan (TKJ)",
        "Teknik dan Bisnis Sepeda Motor (TBSM / TSM)",
        "Teknik Kendaraan Ringan (TKR / TKRO)",
        "Rekayasa Perangkat Lunak (RPL)",
        "Desain Komunikasi Visual (DKV)",
        "Akuntansi dan Keuangan Lembaga (AKL)",
        "Manajemen Perkantoran (MPLB)",
        "Bisnis Digital / Pemasaran",
        "Teknik Pengelasan",
        "Teknik Pemesinan",
        "Teknik Instalasi Tenaga Listrik (TITL)",
        "Kuliner / Tata Boga",
        "Tata Busana",
        "Perhotelan",
        "Agribisnis Tanaman (ATPH)",
        "Farmasi Klinis",
        "Projek IPAS (IPAS SMK)",
        "Produk Kreatif dan Kewirausahaan (PKK)",
      ],
    },
    {
      groupName: "Mata Pelajaran Umum (SMK)",
      items: [
        "Bahasa Indonesia",
        "Matematika",
        "Pendidikan Pancasila",
        "Bahasa Inggris",
        "Sejarah",
        "PAI (Pendidikan Agama Islam)",
        "PJOK",
        "Seni Budaya",
        "Bahasa Arab",
        "Bahasa Jawa",
        "Bahasa Daerah",
        "Muatan Lokal",
      ],
    },
  ],
  SMA: [
    {
      groupName: "Mata Pelajaran Umum",
      items: [
        "Bahasa Indonesia",
        "Matematika",
        "Pendidikan Pancasila",
        "PPKn",
        "Bahasa Inggris",
        "Sejarah",
        "PAI (Pendidikan Agama Islam)",
        "PJOK",
        "Seni Budaya",
        "Seni Rupa",
        "Seni Musik",
        "Seni Tari",
        "Informatika",
        "PKWU (Prakarya & Kewirausahaan)",
        "Bahasa Arab",
        "Bahasa Jawa",
        "Bahasa Daerah",
        "Muatan Lokal",
      ],
    },
    {
      groupName: "Mata Pelajaran Pilihan / Peminatan",
      items: [
        "Fisika",
        "Kimia",
        "Biologi",
        "Matematika Tingkat Lanjut",
        "Ekonomi",
        "Sosiologi",
        "Geografi",
        "Sejarah Tingkat Lanjut",
        "Antropologi",
      ],
    },
  ],
  SMP: [
    {
      groupName: "Mata Pelajaran Pokok",
      items: [
        "Bahasa Indonesia",
        "Matematika",
        "IPA (Ilmu Pengetahuan Alam)",
        "IPS (Ilmu Pengetahuan Sosial)",
        "IPAS",
        "Pendidikan Pancasila",
        "PPKn",
        "Bahasa Inggris",
        "Informatika",
        "PAI (Pendidikan Agama Islam)",
        "PJOK",
        "Seni Budaya",
        "Seni Rupa",
        "Seni Musik",
        "Seni Tari",
        "Prakarya",
        "Bahasa Arab",
        "Bahasa Jawa",
        "Bahasa Daerah",
        "Muatan Lokal",
      ],
    },
  ],
  SD: [
    {
      groupName: "Mata Pelajaran Pokok",
      items: [
        "Bahasa Indonesia",
        "Matematika",
        "IPAS (Ilmu Pengetahuan Alam dan Sosial)",
        "IPA",
        "IPS",
        "Pendidikan Pancasila",
        "PPKn",
        "PAI (Pendidikan Agama Islam)",
        "PJOK",
        "Seni Budaya",
        "Seni Rupa",
        "Seni Musik",
        "Seni Tari",
        "Bahasa Inggris",
        "Bahasa Arab",
        "Bahasa Jawa",
        "Bahasa Daerah",
        "Muatan Lokal",
      ],
    },
  ],
};

export const MADRASAH_KEAGAMAAN_GROUP: MapelGroup = {
  groupName: "Pendidikan Keagamaan Islam (Madrasah / KBC)",
  items: [
    "Al-Qur'an Hadits",
    "Akidah Akhlak",
    "Fikih",
    "Sejarah Kebudayaan Islam (SKI)",
    "Bahasa Arab (Madrasah)",
    "Aswaja / Ke-NU-an / Kemuhammadiyahan",
  ],
};

export const getAvailableMapelGroups = (jenjang: string, curriculum: Curriculum): MapelGroup[] => {
  const norm = jenjang.toUpperCase().includes("SMK")
    ? "SMK"
    : jenjang.toUpperCase().includes("SMA")
    ? "SMA"
    : jenjang.toUpperCase().includes("SMP")
    ? "SMP"
    : "SD";

  const base = MAPEL_STRUCTURE_BY_JENJANG[norm] || MAPEL_STRUCTURE_BY_JENJANG.SD;
  if (curriculum === "kbc") {
    return [MADRASAH_KEAGAMAAN_GROUP, ...base];
  }
  return base;
};

export const getSmartTopicSuggestions = (mapel: string, jenjang: string): { placeholder: string; suggestions: string[] } => {
  if (!mapel) {
    return {
      placeholder: "Pilih mata pelajaran untuk melihat rekomendasi materi relevan...",
      suggestions: ["Pecahan & Desimal", "Siklus Air", "Ciri-Ciri Makhluk Hidup"],
    };
  }

  const m = mapel.toLowerCase();

  // Kejuruan & Produktif SMK
  if (m.includes("komputer") || m.includes("tkj")) {
    return {
      placeholder: "Contoh: Konfigurasi Routing MikroTik, VLAN & Trunking, Subnetting IPv4/IPv6, Keamanan Jaringan...",
      suggestions: ["Routing MikroTik", "VLAN & Trunking", "Subnetting IPv4", "Keamanan Jaringan Firewall"],
    };
  }
  if (m.includes("sepeda motor") || m.includes("tbsm") || m.includes("tsm")) {
    return {
      placeholder: "Contoh: Perawatan Sistem Injeksi PGM-FI, Sistem Kelistrikan & CVT, Overhaul Kepala Silinder...",
      suggestions: ["Injeksi PGM-FI", "Sistem CVT Matic", "Overhaul Silinder", "Diagnosa Kelistrikan Bodi"],
    };
  }
  if (m.includes("kendaraan ringan") || m.includes("tkr") || m.includes("tkro")) {
    return {
      placeholder: "Contoh: Diagnosa Sistem EFI, Sistem Rem ABS, Tune-up Mesin Diesel Common Rail, Transmisi Manual...",
      suggestions: ["Sistem EFI Bensin", "Sistem Rem ABS", "Diesel Common Rail", "Transmisi Manual & Kopling"],
    };
  }
  if (m.includes("perangkat lunak") || m.includes("rpl")) {
    return {
      placeholder: "Contoh: Pemrograman Berorientasi Objek (OOP) Java/PHP, Relasi Basis Data MySQL, RESTful API...",
      suggestions: ["OOP Java/PHP", "Relasi Basis Data MySQL", "RESTful API Express", "MVC Framework Laravel"],
    };
  }
  if (m.includes("visual") || m.includes("dkv")) {
    return {
      placeholder: "Contoh: Prinsip Tipografi & Nirmana, Desain Vektor Logo, Storyboard Animasi, Tata Letak...",
      suggestions: ["Tipografi & Nirmana", "Desain Vektor Logo", "Storyboard Animasi", "Layout Editorial Majalah"],
    };
  }
  if (m.includes("akuntansi") || m.includes("akl")) {
    return {
      placeholder: "Contoh: Jurnal Penyesuaian, Buku Besar & Neraca Saldo, Akuntansi Perusahaan Dagang, Rekonsiliasi Bank...",
      suggestions: ["Jurnal Penyesuaian", "Neraca Saldo Perusahaan Dagang", "Rekonsiliasi Bank", "Laporan Keuangan Laba Rugi"],
    };
  }
  if (m.includes("perkantoran") || m.includes("mplb")) {
    return {
      placeholder: "Contoh: Tata Kelola Kearsipan Sistem Elektronik, Korespondensi Surat Dinas, Prosedur Rapat...",
      suggestions: ["Arsip Elektronik", "Surat Dinas Resmi", "Penyelenggaraan Rapat", "Humas & Keprotokolan"],
    };
  }
  if (m.includes("bisnis digital") || m.includes("pemasaran")) {
    return {
      placeholder: "Contoh: Digital Advertising SEM & Social Media, Analisis Funnel Konversi Penjualan, Copywriting...",
      suggestions: ["Search Engine Marketing (SEM)", "Social Media Marketing", "Funnel Penjualan", "Copywriting Promosi"],
    };
  }
  if (m.includes("pengelasan")) {
    return {
      placeholder: "Contoh: Pengelasan SMAW Posisi 3G, Teknik Las TIG/MIG Argon, Analisa Cacat Las & Pengujian...",
      suggestions: ["SMAW Posisi 3G", "Las TIG/GTAW Argon", "Inspeksi Cacat Las", "Uji Tarik Sambungan Las"],
    };
  }
  if (m.includes("pemesinan")) {
    return {
      placeholder: "Contoh: Kecepatan Potong Mesin Bubut, Pemrograman CNC Milling Kode G & M, Toleransi Presisi...",
      suggestions: ["Mesin Bubut Konvensional", "CNC Milling Kode G & M", "Toleransi Geometris", "Mesin Frais Vertikal"],
    };
  }
  if (m.includes("listrik") || m.includes("titl")) {
    return {
      placeholder: "Contoh: Rangkaian Pengendali Motor Listrik DOL, Panel Distribusi 3 Fasa, Pengaman Beban Lebih MCB...",
      suggestions: ["Kontrol Motor DOL Forward-Reverse", "Instalasi Penerangan 3 Fasa", "Proteksi Beban Lebih MCB", "PLC Otomasi Industri"],
    };
  }
  if (m.includes("kuliner") || m.includes("boga")) {
    return {
      placeholder: "Contoh: Teknik Pengolahan Pastry & Bakery, Standar Hygiene Sanitasi HACCP, Main Course Kontinental...",
      suggestions: ["Pastry & Bakery Modern", "Hygiene HACCP", "Main Course Kontinental", "Food Plating & Garnish"],
    };
  }
  if (m.includes("busana")) {
    return {
      placeholder: "Contoh: Pembuatan Pola Busana Pesta, Analisis Bentuk Tubuh, Teknik Menjahit Drapery & Finishing...",
      suggestions: ["Pola Dasar Busana Pesta", "Teknik Menjahit Drapery", "Analisis Proporsi Tubuh", "Finishing Busana Haute Couture"],
    };
  }
  if (m.includes("hotel") || m.includes("perhotelan")) {
    return {
      placeholder: "Contoh: SOP Check-in Front Office, Housekeeping Make Up Room, Table Manner & F&B Service...",
      suggestions: ["Front Office Check-in Prosedur", "Housekeeping Make Up Room", "F&B Table Service", "Handling Guest Complaint"],
    };
  }
  if (m.includes("agribisnis") || m.includes("atph") || m.includes("tanaman")) {
    return {
      placeholder: "Contoh: Teknik Okulasi Tanaman Buah, Budidaya Hidroponik Sistem NFT, Pengendalian Hama Terpadu (PHT)...",
      suggestions: ["Okulasi & Sambung Pucuk", "Hidroponik Sistem NFT", "Pengendalian Hama Terpadu", "Kultur Jaringan Tanaman"],
    };
  }
  if (m.includes("farmasi")) {
    return {
      placeholder: "Contoh: Perhitungan Dosis Maksimum Resep, Sediaan Pulveres & Salep, Penggolongan Obat Keras...",
      suggestions: ["Perhitungan Dosis Maksimum", "Sediaan Pulveres & Kapsul", "Penggolongan Obat Keras", "Farmakologi Antibiotik"],
    };
  }
  if (m.includes("projek ipas") || m.includes("ipas smk")) {
    return {
      placeholder: "Contoh: Zat dan Perubahannya, Mitigasi Bencana Lingkungan Hidup, Energi Terbarukan & Efisiensi...",
      suggestions: ["Zat dan Perubahannya", "Mitigasi Bencana Alam", "Energi Terbarukan", "Ekosistem & AMDAL"],
    };
  }
  if (m.includes("pkk") || m.includes("kreatif") || m.includes("kewirausahaan") || m.includes("pkwu")) {
    return {
      placeholder: "Contoh: Analisis Titik Impas (BEP), Pembuatan Prototipe Produk Barang/Jasa, Hak Cipta HKI...",
      suggestions: ["Analisis Titik Impas (BEP)", "Prototipe Produk Barang", "Hak Kekayaan Intelektual (HKI)", "Proposal Usaha & Cash Flow"],
    };
  }

  // Mapel Umum & Peminatan
  if (m.includes("matematika")) {
    if (m.includes("lanjut")) {
      return {
        placeholder: "Contoh: Vektor Ruang R3, Matriks & Transformasi Geometri, Turunan Fungsi Trigonometri, Integral Parsial...",
        suggestions: ["Matriks & Transformasi", "Turunan Trigonometri", "Integral Parsial", "Vektor Dimensi Tiga"],
      };
    }
    return {
      placeholder: "Contoh: Teorema Pythagoras, Persamaan Linear Dua Variabel (SPLDV), Bangun Ruang, Peluang & Statistik...",
      suggestions: ["Teorema Pythagoras", "Sistem Persamaan Linear (SPLDV)", "Statistika & Peluang", "Barisan & Deret Aritmatika"],
    };
  }
  if (m.includes("fisika")) {
    return {
      placeholder: "Contoh: Hukum Newton tentang Gravitasi, Termodinamika & Gas Ideal, Gelombang Cahaya, Induksi Elektromagnetik...",
      suggestions: ["Hukum Newton tentang Gerak", "Termodinamika Gas Ideal", "Gelombang Bunyi & Cahaya", "Induksi Elektromagnetik"],
    };
  }
  if (m.includes("kimia")) {
    return {
      placeholder: "Contoh: Stoikiometri Larutan, Tabel Periodik & Ikatan Kimia, Asam Basa & Titrasi, Laju Reaksi...",
      suggestions: ["Stoikiometri Larutan", "Ikatan Kimia Kovalen", "Asam Basa & pH Titrasi", "Laju Reaksi & Kesetimbangan"],
    };
  }
  if (m.includes("biologi")) {
    return {
      placeholder: "Contoh: Sintesis Protein & DNA, Sistem Peredaran Darah Manusia, Metabolisme Enzim, Pewarisan Sifat Mendel...",
      suggestions: ["Sintesis Protein & DNA", "Sistem Peredaran Darah", "Metabolisme Sel & Enzim", "Hereditas Hukum Mendel"],
    };
  }
  if (m.includes("ipas")) {
    return {
      placeholder: "Contoh: Rantai Makanan & Ekosistem, Perubahan Wujud Zat, Gaya dan Gerak, Siklus Daur Air Bumi...",
      suggestions: ["Rantai Makanan & Ekosistem", "Perubahan Wujud Benda", "Gaya & Magnet", "Siklus Air Bumi"],
    };
  }
  if (m.includes("ipa")) {
    return {
      placeholder: "Contoh: Sistem Ekskresi Manusia, Pesawat Sederhana, Pewarisan Sifat, Tekkanan Zat Padat & Cair...",
      suggestions: ["Sistem Ekskresi Manusia", "Pesawat Sederhana", "Tekanan Hidrostatis", "Listrik Dinamis & Hukum Ohm"],
    };
  }
  if (m.includes("ips")) {
    return {
      placeholder: "Contoh: Keunggulan dan Keterbatasan Ruang Antarwilayah, Masa Praaksara Indonesia, Dinamika Kependudukan...",
      suggestions: ["Kerjasama Antarruang ASEAN", "Masa Praaksara Indonesia", "Dinamika Kependudukan", "Permintaan & Penawaran Pasar"],
    };
  }
  if (m.includes("bahasa indonesia")) {
    return {
      placeholder: "Contoh: Gagasan Utama Teks Eksplanasi, Kaidah Kebahasaan Teks Negosiasi, Unsur Intrinsik Cerpen, Struktur Pidato...",
      suggestions: ["Teks Eksplanasi Fenomena Alam", "Teks Negosiasi & Debat", "Unsur Intrinsik Cerpen", "Teks Laporan Hasil Observasi"],
    };
  }
  if (m.includes("inggris")) {
    return {
      placeholder: "Contoh: Narrative Text generic structure, Passive Voice, Conditional Sentences Type 2, Analytical Exposition...",
      suggestions: ["Narrative Text Fairy Tales", "Passive Voice tenses", "Conditional Sentence Type 2 & 3", "Analytical Exposition Text"],
    };
  }
  if (m.includes("sejarah")) {
    return {
      placeholder: "Contoh: Peristiwa Rengasdengklok & Proklamasi, Perang Dunia II di Asia Pasifik, Kerajaan Majapahit...",
      suggestions: ["Proklamasi Kemerdekaan RI", "Pergerakan Nasional Budi Utomo", "Perang Dunia II Pasifik", "Kerajaan Maritim Nusantara"],
    };
  }
  if (m.includes("ekonomi")) {
    return {
      placeholder: "Contoh: Elastisitas Penawaran & Permintaan, Kebijakan Moneter BI, Pendapatan Nasional PDB/PDRB, Pasar Modal...",
      suggestions: ["Elastisitas Permintaan", "Kebijakan Moneter & Fiskal", "Pendapatan Nasional (PDB)", "Manajemen Badan Usaha BUMN"],
    };
  }
  if (m.includes("sosiologi")) {
    return {
      placeholder: "Contoh: Diferensiasi dan Stratifikasi Sosial, Konflik & Resolusi Sosial, Globalisasi dan Kearifan Lokal...",
      suggestions: ["Stratifikasi Sosial Masyarakat", "Konflik Sosial & Resolusi", "Perubahan Sosial di Era Digital", "Globalisasi & Kearifan Lokal"],
    };
  }
  if (m.includes("geografi")) {
    return {
      placeholder: "Contoh: Dinamika Litosfer dan Dampaknya, Pemanfaatan Penginderaan Jauh & SIG, Pola Keruangan Desa dan Kota...",
      suggestions: ["Dinamika Litosfer & Gempa", "Penginderaan Jauh & SIG", "Pola Keruangan Desa-Kota", "Dinamika Atmosfer & Cuaca"],
    };
  }
  if (m.includes("antropologi")) {
    return {
      placeholder: "Contoh: Konsep Etnografi & Budaya Nusantara, Kekerabatan & Sistem Pewarisan, Dinamika Tradisi Lisan...",
      suggestions: ["Etnografi Budaya Nusantara", "Sistem Kekerabatan Adat", "Tradisi Lisan & Folklor", "Akulturasi Kebudayaan"],
    };
  }
  if (m.includes("informatika")) {
    return {
      placeholder: "Contoh: Algoritma Pencarian & Sorting, Berpikir Komputasional Decomposisi, Analisis Data Spreadsheet...",
      suggestions: ["Algoritma Binary Search", "Berpikir Komputasional", "Analisis Data Logika Excel", "Jaringan Komputer & Topologi"],
    };
  }
  if (m.includes("pancasila") || m.includes("ppkn")) {
    return {
      placeholder: "Contoh: Makna Sila-Sila Pancasila dalam Kehidupan, Hak dan Kewajiban Warga Negara, Tata Urutan Perundang-undangan...",
      suggestions: ["Pengamalan Sila Pancasila", "Hak & Kewajiban Asasi Warga", "UUD NRI Tahun 1945 Amandemen", "Bhinneka Tunggal Ika Harmoni"],
    };
  }
  if (m.includes("pjok")) {
    return {
      placeholder: "Contoh: Teknik Passing & Dribble Bola Basket, Kebugaran Jasmani Daya Tahan, Pola Hidup Sehat & Gizi...",
      suggestions: ["Permainan Bola Basket", "Kebugaran Jasmani Aerobik", "Atletik Lari Jarak Pendek", "Pola Hidup Bersih & Sehat"],
    };
  }
  if (m.includes("seni")) {
    return {
      placeholder: "Contoh: Teknik Arsir & Proporsi Gambar Bentuk, Akor Mayor & Minor Musik Melodis, Gerak Tari Tradisional...",
      suggestions: ["Seni Rupa Menggambar Bentuk", "Tangga Nada & Harmoni Musik", "Gerak Dasar Tari Tradisional", "Unsur Desain Nirmana"],
    };
  }
  if (m.includes("prakarya")) {
    return {
      placeholder: "Contoh: Pengolahan Bahan Pangan Nabati, Kerajinan Bahan Lunak dan Keras, Teknik Budidaya Tanaman Sayuran...",
      suggestions: ["Pengolahan Bahan Nabati", "Kerajinan Bahan Keras Kayu", "Budidaya Tanaman Sayur", "Rekayasa Alat Sederhana"],
    };
  }
  if (m.includes("qur'an") || m.includes("hadits")) {
    return {
      placeholder: "Contoh: Hukum Bacaan Nun Sukun & Tanwin, Kandungan Surah Al-Hujurat Ayat 13, Hadits tentang Menuntut Ilmu...",
      suggestions: ["Tajwid Nun Sukun & Mim Sukun", "Surah Al-Hujurat Ayat 13", "Hadits Menuntut Ilmu", "Tafsir Ayat Toleransi Beragama"],
    };
  }
  if (m.includes("akidah") || m.includes("akhlak")) {
    return {
      placeholder: "Contoh: Iman kepada Hari Akhir, Asmaul Husna Al-Karim & Al-Mukmin, Perilaku Tawadhu dan Menghindari Riya...",
      suggestions: ["Iman kepada Hari Kiamat", "Asmaul Husna Keutamaan", "Akhlak Terpuji (Mahmudah)", "Menghindari Sifat Mazmumah"],
    };
  }
  if (m.includes("fikih")) {
    return {
      placeholder: "Contoh: Tata Cara Shalat Jamak & Qashar, Fikih Muamalah Jual Beli & Riba, Thaharah & Najis, Zakat Fitrah & Mal...",
      suggestions: ["Shalat Jamak & Qashar Musafir", "Fikih Muamalah Jual Beli", "Thaharah Wudhu & Tayamum", "Zakat Fitrah & Zakat Mal"],
    };
  }
  if (m.includes("ski") || m.includes("sejarah kebudayaan islam")) {
    return {
      placeholder: "Contoh: Strategi Dakwah Rasulullah di Madinah, Kepemimpinan Khulafaur Rasyidin, Peran Walisongo di Pulau Jawa...",
      suggestions: ["Dakwah Piagam Madinah", "Khulafaur Rasyidin Abu Bakar", "Walisongo Penyebaran Islam", "Bani Umayyah & Abbasiyah"],
    };
  }
  if (m.includes("aswaja")) {
    return {
      placeholder: "Contoh: Mabadi Khaira Ummah, Sejarah Berdirinya Nahdlatul Ulama, Nilai Moderasi Islam (Tawasuth & Tawazun)...",
      suggestions: ["Mabadi Khaira Ummah", "Sejarah Nahdlatul Ulama 1926", "Prinsip Moderasi Tawasuth", "Amaliah Tradisi Aswaja"],
    };
  }
  if (m.includes("arab")) {
    return {
      placeholder: "Contoh: Tarkib Jumlah Fi'liyyah dan Ismiyyah, Dhomir Munfashil, Percakapan Keseharian di Madrasah...",
      suggestions: ["Jumlah Fi'liyyah & Ismiyyah", "Dhomir & Fi'il Mudhari'", "Mufrodat Sekolah & Rumah", "Hiwar Percakapan Sehari-hari"],
    };
  }
  if (m.includes("jawa") || m.includes("daerah")) {
    return {
      placeholder: "Contoh: Aksara Jawa Sandhangan & Pasangan, Unggah-Ungguh Basa Ngoko & Krama Alus, Tembang Macapat Pocung...",
      suggestions: ["Aksara Jawa Sandhangan", "Basa Ngoko & Krama Alus", "Tembang Macapat Sinom/Pocung", "Paribasan & Saloka Jawa"],
    };
  }

  return {
    placeholder: `Contoh topik materi pembelajaran relevan untuk ${mapel}...`,
    suggestions: ["Konsep Dasar & Teori", "Analisis Studi Kasus", "Karakteristik & Unsur", "Penerapan Praktis"],
  };
};

const CURRICULUM_INFO = {
  merdeka: {
    title: "Kurikulum Merdeka",
    desc: "Pendekatan Deep Learning dengan Profil Pelajar Pancasila. Format soal mengikuti standar Permendikbudristek terbaru.",
    color: "indigo"
  },
  kbc: {
    title: "KBC (Madrasah)",
    desc: "Kurikulum Berbasis Cinta untuk lingkungan Madrasah. Menekankan pada nilai-nilai karakter dan spiritual.",
    color: "emerald"
  },
  k13: {
    title: "Kurikulum 2013",
    desc: "Pendekatan Saintifik dengan penilaian autentik. Fokus pada kompetensi inti dan kompetensi dasar.",
    color: "amber"
  },
  hybrid: {
    title: "Hybrid",
    desc: "Gabungan berbagai pendekatan kurikulum untuk fleksibilitas pengajaran.",
    color: "purple"
  }
};

const CURRICULUM_THEMES: Record<Curriculum, {
  activeCard: string;
  inactiveCard: string;
  iconActive: string;
  iconInactive: string;
  textColorActive: string;
  badgeActive: string;
  badgeInactive: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
}> = {
  merdeka: {
    activeCard: "border-indigo-500 bg-gradient-to-br from-indigo-50 via-indigo-50/80 to-blue-50/50 shadow-md shadow-indigo-100 ring-2 ring-indigo-300/60",
    inactiveCard: "border-indigo-100/80 bg-white hover:border-indigo-300 hover:bg-indigo-50/20",
    iconActive: "bg-indigo-600 text-white shadow-sm shadow-indigo-200",
    iconInactive: "bg-indigo-100/80 text-indigo-600",
    textColorActive: "text-indigo-950 font-bold",
    badgeActive: "bg-indigo-200/80 text-indigo-800 font-bold",
    badgeInactive: "bg-indigo-50 text-indigo-600",
    bannerBg: "bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/70",
    bannerBorder: "border-indigo-200",
    bannerText: "text-indigo-800"
  },
  kbc: {
    activeCard: "border-emerald-500 bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-teal-50/50 shadow-md shadow-emerald-100 ring-2 ring-emerald-300/60",
    inactiveCard: "border-emerald-100/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/20",
    iconActive: "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
    iconInactive: "bg-emerald-100/80 text-emerald-600",
    textColorActive: "text-emerald-950 font-bold",
    badgeActive: "bg-emerald-200/80 text-emerald-800 font-bold",
    badgeInactive: "bg-emerald-50 text-emerald-600",
    bannerBg: "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70",
    bannerBorder: "border-emerald-200",
    bannerText: "text-emerald-800"
  },
  k13: {
    activeCard: "border-amber-500 bg-gradient-to-br from-amber-50 via-amber-50/80 to-yellow-50/50 shadow-md shadow-amber-100 ring-2 ring-amber-300/60",
    inactiveCard: "border-amber-100/80 bg-white hover:border-amber-300 hover:bg-amber-50/20",
    iconActive: "bg-amber-600 text-white shadow-sm shadow-amber-200",
    iconInactive: "bg-amber-100/80 text-amber-700",
    textColorActive: "text-amber-950 font-bold",
    badgeActive: "bg-amber-200/80 text-amber-900 font-bold",
    badgeInactive: "bg-amber-50 text-amber-700",
    bannerBg: "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/70",
    bannerBorder: "border-amber-200",
    bannerText: "text-amber-800"
  },
  hybrid: {
    activeCard: "border-purple-500 bg-gradient-to-br from-purple-50 via-purple-50/80 to-fuchsia-50/50 shadow-md shadow-purple-100 ring-2 ring-purple-300/60",
    inactiveCard: "border-purple-100/80 bg-white hover:border-purple-300 hover:bg-purple-50/20",
    iconActive: "bg-purple-600 text-white shadow-sm shadow-purple-200",
    iconInactive: "bg-purple-100/80 text-purple-600",
    textColorActive: "text-purple-950 font-bold",
    badgeActive: "bg-purple-200/80 text-purple-900 font-bold",
    badgeInactive: "bg-purple-50 text-purple-700",
    bannerBg: "bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-50/70",
    bannerBorder: "border-purple-200",
    bannerText: "text-purple-800"
  }
};

const QUESTION_TYPE_THEMES: Record<string, { label: string; bg: string; text: string; border: string; badge: string; countBg: string }> = {
  pg: { label: "Pilihan Ganda", bg: "bg-blue-50/80", text: "text-blue-900", border: "border-blue-200", badge: "bg-blue-600 text-white", countBg: "bg-white text-blue-900" },
  isian: { label: "Isian Singkat", bg: "bg-emerald-50/80", text: "text-emerald-900", border: "border-emerald-200", badge: "bg-emerald-600 text-white", countBg: "bg-white text-emerald-900" },
  essay: { label: "Uraian / Essay", bg: "bg-amber-50/80", text: "text-amber-900", border: "border-amber-200", badge: "bg-amber-600 text-white", countBg: "bg-white text-amber-900" },
  pgKompleks: { label: "PG Kompleks", bg: "bg-purple-50/80", text: "text-purple-900", border: "border-purple-200", badge: "bg-purple-600 text-white", countBg: "bg-white text-purple-900" },
  bs: { label: "Benar / Salah", bg: "bg-rose-50/80", text: "text-rose-900", border: "border-rose-200", badge: "bg-rose-600 text-white", countBg: "bg-white text-rose-900" },
  jodoh: { label: "Menjodohkan", bg: "bg-teal-50/80", text: "text-teal-900", border: "border-teal-200", badge: "bg-teal-600 text-white", countBg: "bg-white text-teal-900" },
  urutan: { label: "Mengurutkan", bg: "bg-orange-50/80", text: "text-orange-900", border: "border-orange-200", badge: "bg-orange-600 text-white", countBg: "bg-white text-orange-900" },
  tabel: { label: "Lengkapi Tabel", bg: "bg-indigo-50/80", text: "text-indigo-900", border: "border-indigo-200", badge: "bg-indigo-600 text-white", countBg: "bg-white text-indigo-900" },
  sebabAkibat: { label: "Sebab Akibat", bg: "bg-violet-50/80", text: "text-violet-900", border: "border-violet-200", badge: "bg-violet-600 text-white", countBg: "bg-white text-violet-900" },
};

const COGNITIVE_LEVEL_THEMES: Record<string, { active: string; inactive: string; name: string }> = {
  C1: { active: "bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-300", inactive: "bg-blue-50/90 text-blue-700 border border-blue-200 hover:bg-blue-100", name: "Mengingat" },
  C2: { active: "bg-cyan-600 text-white shadow-md shadow-cyan-200 ring-2 ring-cyan-300", inactive: "bg-cyan-50/90 text-cyan-700 border border-cyan-200 hover:bg-cyan-100", name: "Memahami" },
  C3: { active: "bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-300", inactive: "bg-emerald-50/90 text-emerald-700 border border-emerald-200 hover:bg-emerald-100", name: "Menerapkan" },
  C4: { active: "bg-amber-600 text-white shadow-md shadow-amber-200 ring-2 ring-amber-300", inactive: "bg-amber-50/90 text-amber-800 border border-amber-200 hover:bg-amber-100", name: "Menganalisis" },
  C5: { active: "bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-300", inactive: "bg-rose-50/90 text-rose-700 border border-rose-200 hover:bg-rose-100", name: "Mengevaluasi" },
  C6: { active: "bg-purple-600 text-white shadow-md shadow-purple-200 ring-2 ring-purple-300", inactive: "bg-purple-50/90 text-purple-700 border border-purple-200 hover:bg-purple-100", name: "Mencipta" },
};

const VISUAL_THEMES: Record<string, { label: string; bg: string; text: string; border: string; accent: string }> = {
  ilustrasi: { label: "Ilustrasi Gambar", bg: "bg-pink-50/80", text: "text-pink-900", border: "border-pink-200", accent: "text-pink-600" },
  diagram: { label: "Diagram / Skema", bg: "bg-sky-50/80", text: "text-sky-900", border: "border-sky-200", accent: "text-sky-600" },
  mindmap: { label: "Peta Konsep / Mindmap", bg: "bg-amber-50/80", text: "text-amber-900", border: "border-amber-200", accent: "text-amber-600" },
};


// --- App Component ---

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  const [state, setState] = useState<AppState>({
    curriculum: "merdeka",
    guru: "",
    sekolah: "",
    jenjang: "SD",
    kelas: "1",
    mapel: "",
    mapelCustom: "",
    topik: "",
    materiMethod: "none",
    materiText: "",
    materiInstruction: "",
    jenisAsesmen: "Sumatif Harian",
    opsiJawaban: "4",
    shuffleQuestions: false,
    counts: {
      pg: 5,
      isian: 0,
      essay: 0,
      pgKompleks: 0,
      bs: 0,
      jodoh: 0,
      urutan: 0,
      tabel: 0,
      sebabAkibat: 0,
    },
    proportions: {
      mudah: 30,
      sedang: 50,
      sulit: 20,
    },
    cognitiveLevels: ["C1", "C2", "C3"],
    visuals: {
      ilustrasi: 0,
      diagram: 0,
      mindmap: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"dashboard" | "soal" | "kunci" | "kisikisi" | "kuis" | "analisis" | "koreksi">("soal");
  const [showSettings, setShowSettings] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "mudah" | "sedang" | "sulit">("all");
  
  // Drag and Drop Question Reorder States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isQuickReorderOpen, setIsQuickReorderOpen] = useState<boolean>(false);
  const [reorderNotification, setReorderNotification] = useState<string | null>(null);
  
  // Interactive Quiz Timer States
  const [quizTimerDuration, setQuizTimerDuration] = useState<number>(10 * 60); // 10 minutes default (in seconds)
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(10 * 60);
  const [quizTimerRunning, setQuizTimerRunning] = useState<boolean>(false);
  const [quizTimerEnabled, setQuizTimerEnabled] = useState<boolean>(true);
  const [quizTimeSpent, setQuizTimeSpent] = useState<number>(0);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizTimeUp, setQuizTimeUp] = useState<boolean>(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState<boolean>(false);
  const [quizFeedbackMode, setQuizFeedbackMode] = useState<"exam" | "instant">("exam");
  const [quizSoundEnabled, setQuizSoundEnabled] = useState<boolean>(true);
  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>("10");
  const [showCustomTimerInput, setShowCustomTimerInput] = useState<boolean>(false);
  
  // Auto-Grade States
  const [studentInfo, setStudentInfo] = useState({ name: "", class: "" });
  const [autoGradeInputMode, setAutoGradeInputMode] = useState<"upload" | "manual" | "form">("upload");
  const [manualAnswerText, setManualAnswerText] = useState("");
  const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
  const [gradingResult, setGradingResult] = useState<GradingSummary | null>(null);
  const [gradeFilter, setGradeFilter] = useState<"all" | "incorrect" | "correct">("all");
  const studentFileInputRef = useRef<HTMLInputElement>(null);
  
  // Header Settings
  const [headerSettings, setHeaderSettings] = useState({
    instansi: "Yayasan Pendidikan ...",
    sekolah: "SD/SMP/SMA ...",
    alamat: "Jl. ...",
    telp: "(021) ...",
    email: "info@sekolah.sch.id",
    logo: "https://i.imghippo.com/files/nrnU9752iR.png?v=2"
  });

  const totalSoal = (Object.values(state.counts) as number[]).reduce((a, b) => a + b, 0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        handleInputChange("materiText", fullText);
        handleInputChange("materiMethod", "manual");
      } else if (file.type === "text/plain") {
        const text = await file.text();
        handleInputChange("materiText", text);
        handleInputChange("materiMethod", "manual");
      } else {
        setError("Format file tidak didukung. Gunakan PDF atau TXT.");
      }
    } catch (err) {
      console.error(err);
      setError("Gagal membaca file.");
    } finally {
      setLoading(false);
    }
  };

  const handleJenjangChange = (newJenjang: string) => {
    const currentMapel = state.mapel;
    const groups = getAvailableMapelGroups(newJenjang, state.curriculum);
    const allValidItems = groups.flatMap(g => g.items);

    let nextMapel = currentMapel;
    if (currentMapel === "Lainnya (Ketik Sendiri)" || currentMapel === "custom") {
      nextMapel = currentMapel;
    } else if (currentMapel && !allValidItems.includes(currentMapel)) {
      // Check if normalized match exists (e.g. "IPA" vs "IPA (Ilmu Pengetahuan Alam)")
      const found = allValidItems.find(item => {
        const a = item.toLowerCase().replace(/[\(\)\/\-]/g, " ").trim();
        const b = currentMapel.toLowerCase().replace(/[\(\)\/\-]/g, " ").trim();
        return a === b || a.startsWith(b) || b.startsWith(a);
      });

      if (found) {
        nextMapel = found;
      } else {
        // Default to first item of first group
        nextMapel = allValidItems[0] || "Bahasa Indonesia";
      }
    } else if (!currentMapel) {
      nextMapel = allValidItems[0] || "Bahasa Indonesia";
    }

    // Auto-adjust default grade/kelas if not matching jenjang
    let nextKelas = state.kelas;
    if (newJenjang === "SD" && (!["1", "2", "3", "4", "5", "6"].includes(nextKelas))) {
      nextKelas = "4";
    } else if (newJenjang === "SMP" && (!["7", "8", "9"].includes(nextKelas))) {
      nextKelas = "8";
    } else if ((newJenjang === "SMA" || newJenjang === "SMK") && (!["10", "11", "12"].includes(nextKelas))) {
      nextKelas = "10";
    }

    setState(prev => ({
      ...prev,
      jenjang: newJenjang,
      mapel: nextMapel,
      kelas: nextKelas,
    }));
  };

  const handleInputChange = (field: keyof AppState, value: any) => {
    if (field === "jenjang") {
      handleJenjangChange(value);
      return;
    }
    if (field === "curriculum") {
      const newCurr = value as Curriculum;
      const groups = getAvailableMapelGroups(state.jenjang, newCurr);
      const allValidItems = groups.flatMap(g => g.items);
      let nextMapel = state.mapel;
      if (nextMapel && nextMapel !== "Lainnya (Ketik Sendiri)" && !allValidItems.includes(nextMapel)) {
        const found = allValidItems.find(it => it.toLowerCase().startsWith(nextMapel.toLowerCase().slice(0, 4)));
        if (found) nextMapel = found;
      }
      setState(prev => ({ ...prev, curriculum: newCurr, mapel: nextMapel }));
      return;
    }
    setState(prev => ({ ...prev, [field]: value }));
  };

  const handleCountChange = (type: keyof AppState["counts"], value: number) => {
    setState(prev => ({
      ...prev,
      counts: { ...prev.counts, [type]: Math.max(0, value) }
    }));
  };

  const handleProportionChange = (type: keyof AppState["proportions"], value: number) => {
    setState(prev => ({
      ...prev,
      proportions: { ...prev.proportions, [type]: Math.max(0, Math.min(100, value)) }
    }));
  };

  const handleVisualChange = (type: keyof AppState["visuals"], value: number) => {
    setState(prev => ({
      ...prev,
      visuals: { ...prev.visuals, [type]: Math.max(0, value) }
    }));
  };

  const toggleCognitiveLevel = (level: string) => {
    setState(prev => ({
      ...prev,
      cognitiveLevels: prev.cognitiveLevels.includes(level)
        ? prev.cognitiveLevels.filter(l => l !== level)
        : [...prev.cognitiveLevels, level]
    }));
  };

  // Helper to shuffle an array using Fisher-Yates algorithm
  const shuffleArray = <T,>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Toggle shuffle state and re-order existing questions
  const toggleShuffle = () => {
    const nextShuffle = !state.shuffleQuestions;
    handleInputChange("shuffleQuestions", nextShuffle);

    const base = originalQuestions.length > 0 ? originalQuestions : questions;
    if (base.length > 0) {
      if (originalQuestions.length === 0) {
        setOriginalQuestions(base);
      }
      if (nextShuffle) {
        setQuestions(shuffleArray(base));
      } else {
        setQuestions([...base]);
      }
    }
  };

  // Explicitly re-shuffle questions
  const handleReshuffle = () => {
    const base = originalQuestions.length > 0 ? originalQuestions : questions;
    if (base.length > 0) {
      if (!state.shuffleQuestions) {
        handleInputChange("shuffleQuestions", true);
      }
      setQuestions(shuffleArray(base));
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    setOriginalQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Drag and Drop & Manual Question Reordering Handler
  const handleReorderQuestion = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex || 
      fromIndex < 0 || 
      toIndex < 0 || 
      fromIndex >= questions.length || 
      toIndex >= questions.length
    ) {
      return;
    }

    setQuestions(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });

    setOriginalQuestions(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });

    setReorderNotification(`Urutan soal berhasil diperbarui: Soal dipindahkan ke posisi #${toIndex + 1}`);
    setTimeout(() => {
      setReorderNotification(null);
    }, 2800);
  };

  const handleDownload = () => {
    if (questions.length === 0) return;
    const content = JSON.stringify(questions, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soal-${state.topik.replace(/\s+/g, "_") || "ujian"}-${state.shuffleQuestions ? "shuffled" : "original"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Interactive Quiz Timer Handlers & Helpers ---

  // Play safe web audio tone for timer alerts
  const playQuizSound = (frequency = 600, duration = 0.25) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio might be blocked prior to user interaction
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    let timer: any = null;
    if (quizTimerRunning && quizTimerEnabled && quizTimeRemaining > 0 && !quizSubmitted) {
      timer = setInterval(() => {
        setQuizTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setQuizTimerRunning(false);
            setQuizTimeUp(true);
            setQuizSubmitted(true);
            setShowTimeUpModal(true);
            if (quizSoundEnabled) {
              playQuizSound(440, 0.4);
              setTimeout(() => playQuizSound(330, 0.5), 250);
            }
            return 0;
          }
          if (quizSoundEnabled && prev <= 6 && prev > 1) {
            playQuizSound(880, 0.05);
          }
          return prev - 1;
        });
        setQuizTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizTimerRunning, quizTimerEnabled, quizTimeRemaining, quizSubmitted, quizSoundEnabled]);

  const handleStartQuizTimer = () => {
    if (quizTimeRemaining === 0 || quizSubmitted) {
      setQuizTimeRemaining(quizTimerDuration);
      setQuizTimeSpent(0);
      setQuizSubmitted(false);
      setQuizTimeUp(false);
      setQuizAnswers({});
    }
    setQuizTimerRunning(true);
  };

  const handlePauseQuizTimer = () => {
    setQuizTimerRunning(false);
  };

  const handleResetQuizTimer = (duration = quizTimerDuration) => {
    setQuizTimerRunning(false);
    setQuizTimerDuration(duration);
    setQuizTimeRemaining(duration);
    setQuizTimeSpent(0);
    setQuizSubmitted(false);
    setQuizTimeUp(false);
    setShowTimeUpModal(false);
    setQuizAnswers({});
  };

  const handleSelectQuizPreset = (minutes: number) => {
    const secs = minutes * 60;
    setQuizTimerDuration(secs);
    setQuizTimeRemaining(secs);
    setQuizTimeSpent(0);
    setQuizTimerRunning(false);
    setQuizSubmitted(false);
    setQuizTimeUp(false);
    setShowTimeUpModal(false);
  };

  const handleApplyCustomQuizTimer = () => {
    const mins = parseInt(customTimerMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      handleSelectQuizPreset(mins);
      setShowCustomTimerInput(false);
    }
  };

  const handleSubmitQuizEarly = () => {
    setQuizTimerRunning(false);
    setQuizSubmitted(true);
    setShowTimeUpModal(true);
    if (quizSoundEnabled) {
      playQuizSound(523.25, 0.2);
      setTimeout(() => playQuizSound(659.25, 0.3), 150);
    }
  };

  const formatTimerDigits = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getQuizScoreStats = () => {
    const totalQuestions = questions.length;
    let correctCount = 0;
    let answeredCount = 0;

    questions.forEach((q) => {
      const studentAns = quizAnswers[q.id];
      if (studentAns) {
        answeredCount++;
        if (q.answer.trim().toUpperCase().startsWith(studentAns.toUpperCase())) {
          correctCount++;
        }
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    
    let predicate = {
      label: "Perlu Latihan (D)",
      color: "text-rose-700 bg-rose-50 border-rose-200",
      desc: "Perlu bimbingan dan pendalaman materi lebih lanjut.",
    };
    if (percentage >= 90) {
      predicate = {
        label: "Istimewa (A+)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        desc: "Luar biasa! Penguasaan materi sangat mendalam.",
      };
    } else if (percentage >= 80) {
      predicate = {
        label: "Sangat Baik (A)",
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
        desc: "Hebat! Pemahaman konsep sangat kuat dan tuntas.",
      };
    } else if (percentage >= 70) {
      predicate = {
        label: "Baik (B)",
        color: "text-teal-700 bg-teal-50 border-teal-200",
        desc: "Tuntas KKM dengan baik, pertahankan performamu.",
      };
    } else if (percentage >= 60) {
      predicate = {
        label: "Cukup (C)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
        desc: "Cukup baik, pelajari kembali soal yang belum tepat.",
      };
    }

    return { totalQuestions, answeredCount, correctCount, percentage, predicate };
  };

  // --- Auto-Grade Helper Methods ---

  // Helper to extract option letter (A, B, C, D, E)
  const extractOptionLetter = (str: string): string | null => {
    if (!str) return null;
    const trimmed = str.trim().toUpperCase();
    const match = trimmed.match(/^[\(\[]?([A-E])[\.\)\:\-\s\]]?/);
    if (match) return match[1];
    if (/^[A-E]$/.test(trimmed)) return trimmed;
    return null;
  };

  // Evaluate whether student answer matches question answer
  const evaluateAnswerMatch = (studentAns: string, correctAns: string, type: string, options?: string[]): boolean => {
    const s = (studentAns || "").trim();
    const c = (correctAns || "").trim();
    if (!s || !c) return false;

    // Check multiple-choice / options
    if ((options && options.length > 0) || type === "pg") {
      const sLetter = extractOptionLetter(s);
      const cLetter = extractOptionLetter(c);
      if (sLetter && cLetter) {
        return sLetter === cLetter;
      }
      // If student wrote option text
      if (options && options.length > 0) {
        const sLower = s.toLowerCase();
        const cLower = c.toLowerCase();
        if (sLower === cLower) return true;
        if (cLetter) {
          const cIdx = cLetter.charCodeAt(0) - 65;
          if (options[cIdx] && options[cIdx].toLowerCase().trim() === sLower) {
            return true;
          }
        }
      }
    }

    // Boolean True/False
    if (type === "bs") {
      const sNorm = s.toLowerCase();
      const cNorm = c.toLowerCase();
      const isSTrue = sNorm.startsWith("b") || sNorm.startsWith("t") || sNorm === "benar" || sNorm === "true";
      const isCTrue = cNorm.startsWith("b") || cNorm.startsWith("t") || cNorm === "benar" || cNorm === "true";
      const isSFalse = sNorm.startsWith("s") || sNorm.startsWith("f") || sNorm === "salah" || sNorm === "false";
      const isCFalse = cNorm.startsWith("s") || cNorm.startsWith("f") || cNorm === "salah" || cNorm === "false";
      if (isSTrue && isCTrue) return true;
      if (isSFalse && isCFalse) return true;
    }

    // Normalized text matching
    const cleanS = s.toLowerCase().replace(/[\.\,\;\:\-\_\'\"\(\)]/g, "").trim();
    const cleanC = c.toLowerCase().replace(/[\.\,\;\:\-\_\'\"\(\)]/g, "").trim();
    if (cleanS === cleanC) return true;
    if (cleanS.length >= 3 && cleanC.length >= 3) {
      if (cleanS.includes(cleanC) || cleanC.includes(cleanS)) return true;
    }

    return false;
  };

  // Parse answer key text (JSON, CSV, or formatted text e.g. "1. A, 2. B" or lines)
  const parseStudentAnswersFromText = (text: string, count: number): Record<number, string> => {
    const result: Record<number, string> = {};
    if (!text || !text.trim()) return result;

    const trimmed = text.trim();

    // 1. JSON format
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          parsed.forEach((val, idx) => {
            if (idx < count) {
              result[idx + 1] = String(val).trim();
            }
          });
          return result;
        } else if (typeof parsed === "object" && parsed !== null) {
          const obj = parsed.answers || parsed.jawaban || parsed;
          Object.entries(obj).forEach(([key, val]) => {
            const num = parseInt(key, 10);
            if (!isNaN(num) && num > 0) {
              result[num] = String(val).trim();
            }
          });
          return result;
        }
      } catch {
        // Fallback to text parsing
      }
    }

    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // CSV format with potential header
    let startIndex = 0;
    if (lines.length > 0 && /^(no|nomor|number|soal|id)[\,\;\t]/i.test(lines[0])) {
      startIndex = 1;
    }

    let numberedFound = false;
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const numberedMatch = line.match(/^(?:no\.?|soal\s*)?(\d+)[\.\:\-\)\,\;\t\s]+(.+)$/i);
      if (numberedMatch) {
        const num = parseInt(numberedMatch[1], 10);
        const ans = numberedMatch[2].trim();
        if (!isNaN(num) && num > 0) {
          result[num] = ans;
          numberedFound = true;
        }
      }
    }

    if (numberedFound && Object.keys(result).length > 0) {
      return result;
    }

    // Inline multiple items e.g. "1. A, 2. B, 3. C"
    const inlineMatches = [...trimmed.matchAll(/(?:(?:no\.?|soal\s*)?(\d+)[\.\:\-\)\s]+([A-Za-z0-9\s\w\-\/]+?)(?=[,\n;]|$))/gi)];
    if (inlineMatches.length > 1) {
      inlineMatches.forEach(m => {
        const num = parseInt(m[1], 10);
        const ans = m[2].trim();
        if (!isNaN(num) && num > 0) {
          result[num] = ans;
        }
      });
      if (Object.keys(result).length > 0) return result;
    }

    // Comma-separated sequential list (e.g. "A, B, C, D, A")
    const commaTokens = trimmed.split(/[,\t]+/).map(t => t.trim()).filter(Boolean);
    if (commaTokens.length > 1) {
      commaTokens.forEach((token, idx) => {
        if (idx < count) {
          result[idx + 1] = token;
        }
      });
      return result;
    }

    // Line by line sequential
    if (lines.length > 0) {
      lines.forEach((line, idx) => {
        if (idx < count) {
          result[idx + 1] = line;
        }
      });
      return result;
    }

    return result;
  };

  // Grade predicate classification
  const getPredicate = (pct: number) => {
    if (pct >= 90) {
      return {
        grade: "A",
        label: "Sangat Baik (Istimewa)",
        color: "text-emerald-700 border-emerald-300 bg-emerald-50",
        bg: "bg-emerald-600",
        badgeBg: "bg-emerald-100 text-emerald-800"
      };
    } else if (pct >= 80) {
      return {
        grade: "B",
        label: "Baik (Tuntas)",
        color: "text-indigo-700 border-indigo-300 bg-indigo-50",
        bg: "bg-indigo-600",
        badgeBg: "bg-indigo-100 text-indigo-800"
      };
    } else if (pct >= 70) {
      return {
        grade: "C",
        label: "Cukup (Memenuhi KKM)",
        color: "text-amber-700 border-amber-300 bg-amber-50",
        bg: "bg-amber-600",
        badgeBg: "bg-amber-100 text-amber-800"
      };
    } else {
      return {
        grade: "D",
        label: "Perlu Bimbingan (Remedial)",
        color: "text-red-700 border-red-300 bg-red-50",
        bg: "bg-red-600",
        badgeBg: "bg-red-100 text-red-800"
      };
    }
  };

  // Run auto-grading comparison
  const runAutoGrading = (answersToGrade?: Record<number, string>) => {
    if (questions.length === 0) return;
    const currentAnswers = answersToGrade || studentAnswers;
    
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const details: GradeDetail[] = questions.map((q, idx) => {
      const qNum = idx + 1;
      const stdAns = (currentAnswers[qNum] || "").trim();
      const corrAns = (q.answer || "").trim();
      const isAnswered = stdAns.length > 0;
      
      let isCorrect = false;
      if (isAnswered) {
        isCorrect = evaluateAnswerMatch(stdAns, corrAns, q.type, q.options);
        if (isCorrect) correctCount++;
        else incorrectCount++;
      } else {
        unansweredCount++;
      }

      return {
        qIndex: idx,
        qNum,
        question: q.question,
        type: q.type,
        options: q.options,
        studentAnswer: stdAns,
        correctAnswer: corrAns,
        isCorrect,
        explanation: q.explanation
      };
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 1000) / 10 : 0;
    const predicate = getPredicate(percentage);

    setGradingResult({
      studentName: studentInfo.name.trim() || "Siswa",
      studentClass: studentInfo.class.trim() || "-",
      totalQuestions: total,
      correctCount,
      incorrectCount,
      unansweredCount,
      scorePercentage: percentage,
      predicate,
      details,
      evaluatedAt: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    });
  };

  // Handle uploaded student answer key file
  const handleStudentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setManualAnswerText(text);
      const parsed = parseStudentAnswersFromText(text, questions.length);
      setStudentAnswers(parsed);
      runAutoGrading(parsed);
    } catch (err) {
      console.error(err);
      setError("Gagal membaca file kunci jawaban siswa.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Apply answers from manual textarea
  const handleApplyManualText = () => {
    const parsed = parseStudentAnswersFromText(manualAnswerText, questions.length);
    setStudentAnswers(parsed);
    runAutoGrading(parsed);
  };

  // Update specific question answer in interactive grid
  const handleSetStudentAnswerForQuestion = (qNum: number, ans: string) => {
    const updated = { ...studentAnswers, [qNum]: ans };
    setStudentAnswers(updated);
    // Also sync text in manualAnswerText
    const lines = Object.entries(updated)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([num, val]) => `${num}. ${val}`)
      .join("\n");
    setManualAnswerText(lines);
    if (gradingResult) {
      runAutoGrading(updated);
    }
  };

  // Generate realistic sample student answers for 1-click test
  const handleGenerateSampleStudentAnswers = () => {
    if (questions.length === 0) return;
    const sample: Record<number, string> = {};
    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const isTargetCorrect = Math.random() < 0.8;
      if (q.options && q.options.length > 0) {
        const correctLetter = extractOptionLetter(q.answer) || "A";
        if (isTargetCorrect) {
          sample[qNum] = correctLetter;
        } else {
          const letters = ["A", "B", "C", "D"].slice(0, Math.min(q.options.length, 5));
          const wrongLetters = letters.filter(l => l !== correctLetter);
          sample[qNum] = wrongLetters.length > 0 
            ? wrongLetters[Math.floor(Math.random() * wrongLetters.length)] 
            : "B";
        }
      } else if (q.type === "bs") {
        sample[qNum] = isTargetCorrect 
          ? (q.answer.toLowerCase().includes("b") ? "Benar" : "Salah") 
          : (q.answer.toLowerCase().includes("b") ? "Salah" : "Benar");
      } else {
        sample[qNum] = isTargetCorrect ? q.answer : "Jawaban kurang tepat";
      }
    });

    setStudentAnswers(sample);
    const textLines = Object.entries(sample)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([num, ans]) => `${num}. ${ans}`)
      .join("\n");
    setManualAnswerText(textLines);
    if (!studentInfo.name) {
      setStudentInfo({ name: "Ahmad Fauzi", class: "Kelas VIII-A / No. 14" });
    }
    runAutoGrading(sample);
  };

  // Reset auto grading state
  const handleResetGrading = () => {
    setStudentAnswers({});
    setManualAnswerText("");
    setGradingResult(null);
  };

  // Export grading report as CSV
  const handleDownloadGradeReport = () => {
    if (!gradingResult) return;
    let csv = `LAPORAN HASIL KOREKSI OTOMATIS SOAL\n`;
    csv += `Nama Siswa,${gradingResult.studentName}\n`;
    csv += `Kelas / Absen,${gradingResult.studentClass}\n`;
    csv += `Mata Pelajaran,${state.mapel === "custom" ? state.mapelCustom : state.mapel || "Umum"}\n`;
    csv += `Topik Materi,${state.topik}\n`;
    csv += `Waktu Evaluasi,${gradingResult.evaluatedAt}\n`;
    csv += `Skor Persentase,${gradingResult.scorePercentage}%\n`;
    csv += `Predikat,${gradingResult.predicate.label} (${gradingResult.predicate.grade})\n`;
    csv += `Total Soal,${gradingResult.totalQuestions}\n`;
    csv += `Jawaban Benar,${gradingResult.correctCount}\n`;
    csv += `Jawaban Salah,${gradingResult.incorrectCount}\n`;
    csv += `Tidak Dijawab,${gradingResult.unansweredCount}\n\n`;
    csv += `No,Tipe Soal,Jawaban Siswa,Kunci Jawaban,Status\n`;

    gradingResult.details.forEach(d => {
      const status = d.isCorrect ? "BENAR" : (d.studentAnswer ? "SALAH" : "KOSONG");
      const cleanStd = `"${(d.studentAnswer || "-").replace(/"/g, '""')}"`;
      const cleanCorr = `"${(d.correctAnswer || "-").replace(/"/g, '""')}"`;
      csv += `${d.qNum},"${d.type}",${cleanStd},${cleanCorr},${status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hasil_Koreksi_${gradingResult.studentName.replace(/\s+/g, "_") || "Siswa"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSoal = async () => {
    if (!state.topik) {
      setError("Topik/Materi harus diisi!");
      return;
    }
    if (totalSoal === 0) {
      setError("Jumlah soal tidak boleh nol!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `
        Buatlah soal-soal ujian berdasarkan data berikut:
        Kurikulum: ${state.curriculum}
        Mata Pelajaran: ${state.mapel === "custom" ? state.mapelCustom : state.mapel}
        Jenjang: ${state.jenjang} (Kelas ${state.kelas})
        Topik: ${state.topik}
        Jenis Asesmen: ${state.jenisAsesmen}
        
        Jumlah Soal:
        - Pilihan Ganda: ${state.counts.pg} (Opsi: ${state.opsiJawaban})
        - Isian Singkat: ${state.counts.isian}
        - Essay: ${state.counts.essay}
        - PG Kompleks: ${state.counts.pgKompleks}
        - Benar/Salah: ${state.counts.bs}
        - Menjodohkan: ${state.counts.jodoh}
        - Urutan: ${state.counts.urutan}
        - Isi Tabel: ${state.counts.tabel}
        - Sebab-Akibat: ${state.counts.sebabAkibat}
        
        Proporsi Kesulitan: Mudah ${state.proportions.mudah}%, Sedang ${state.proportions.sedang}%, Sulit ${state.proportions.sulit}%
        Level Kognitif: ${state.cognitiveLevels.join(", ")}
        
        Kebutuhan Visual (Sertakan deskripsi visual dalam teks soal jika diperlukan):
        - Ilustrasi: ${state.visuals.ilustrasi}
        - Diagram: ${state.visuals.diagram}
        - Mindmap: ${state.visuals.mindmap}
        
        Materi Referensi: ${state.materiText || "Gunakan pengetahuan umum sesuai kurikulum"}
        Instruksi Tambahan: ${state.materiInstruction || "Tidak ada"}
        
        Format output harus JSON ARRAY of objects dengan struktur:
        {
          "id": "string",
          "type": "pg" | "isian" | "essay" | "pg-kompleks" | "bs" | "jodoh" | "urutan" | "tabel" | "sebab-akibat",
          "question": "string",
          "options": ["string"] (hanya untuk pg),
          "answer": "string",
          "difficulty": "mudah" | "sedang" | "sulit",
          "cognitiveLevel": "string",
          "explanation": "string",
          "indicator": "string"
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const rawResult: Question[] = JSON.parse(response.text || "[]");
      const formattedResult: Question[] = rawResult.map((q, idx) => ({
        ...q,
        id: q.id || `q-${Date.now()}-${idx}`
      }));

      // Store un-shuffled baseline
      setOriginalQuestions(formattedResult);

      // Shuffle order of generated questions before displaying them to the user if enabled
      const finalQuestions = state.shuffleQuestions 
        ? shuffleArray(formattedResult) 
        : formattedResult;

      setQuestions(finalQuestions);
      setQuizAnswers({});
      setGradingResult(null);
      setStudentAnswers({});
      setManualAnswerText("");
      setDifficultyFilter("all");
      setActiveTab("soal");
    } catch (err) {
      console.error(err);
      setError("Gagal membuat soal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar matching the reference image */}
      <nav className="h-16 bg-[#0B132B] border-b border-white/10 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0 no-print">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0B132B] rounded-[9px] flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base md:text-lg tracking-tight text-white">Super App AI Soal</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  CBT Pro
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Smart Solution for Educational Assessment
              </p>
            </div>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="relative flex-1 max-w-md mx-4 hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari butir soal, topik, atau kata kunci..."
            className="w-full pl-10 pr-9 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 focus:border-blue-400 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Date pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{new Date().toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>

          {/* Notification */}
          <div className="relative">
            <button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0B132B]">
              {questions.length > 0 ? "5" : "1"}
            </span>
          </div>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
            title="Kop Surat & Identitas Lembaga"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30">
                EG
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B132B] absolute bottom-0 right-0"></span>
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-white leading-tight">Eko Cahyono</div>
              <div className="text-[10px] text-blue-400 font-medium leading-tight">Guru Pengampu</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout Body: Canvas */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Main Canvas */}
        <main className="flex-1 bg-[#F0F4FA] text-slate-800 min-w-0 p-4 md:p-6 overflow-x-hidden">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Sidebar - Form */}
            <div className="lg:col-span-2 space-y-5 no-print">
          {/* Curriculum Selection */}
          <section className="glass-card rounded-2xl p-5 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 border border-indigo-100 shadow-sm shadow-indigo-100/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="text-sm font-black text-gray-900">Pilih Kurikulum</span>
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full uppercase">
                {CURRICULUM_INFO[state.curriculum].title}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(CURRICULUM_INFO) as Curriculum[]).map(curr => {
                const theme = CURRICULUM_THEMES[curr];
                const isSelected = state.curriculum === curr;
                return (
                  <button
                    key={curr}
                    onClick={() => handleInputChange("curriculum", curr)}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                      isSelected ? theme.activeCard : theme.inactiveCard
                    )}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? theme.iconActive : theme.iconInactive
                      )}>
                        {curr === "merdeka" && <GraduationCap className="w-4 h-4" />}
                        {curr === "kbc" && <Heart className="w-4 h-4" />}
                        {curr === "k13" && <Book className="w-4 h-4" />}
                        {curr === "hybrid" && <Layers className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={cn(
                          "text-xs font-bold block truncate",
                          isSelected ? theme.textColorActive : "text-gray-700"
                        )}>
                          {CURRICULUM_INFO[curr].title}
                        </span>
                        <span className={cn(
                          "text-[9px] uppercase tracking-wider inline-block px-1.5 py-0.5 rounded mt-0.5",
                          isSelected ? theme.badgeActive : theme.badgeInactive
                        )}>
                          {curr === "merdeka" ? "Deep Learning" : curr === "kbc" ? "Madrasah" : curr === "k13" ? "Standard" : "Gabungan"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={state.curriculum}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "mt-4 p-3 rounded-xl border flex items-start gap-2.5 transition-colors",
                  CURRICULUM_THEMES[state.curriculum].bannerBg,
                  CURRICULUM_THEMES[state.curriculum].bannerBorder
                )}
              >
                <Info className={cn("w-4 h-4 mt-0.5 shrink-0", CURRICULUM_THEMES[state.curriculum].bannerText)} />
                <div>
                  <p className={cn("text-xs font-black", CURRICULUM_THEMES[state.curriculum].bannerText)}>
                    {CURRICULUM_INFO[state.curriculum].title}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                    {CURRICULUM_INFO[state.curriculum].desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Identity Form */}
          <section className="glass-card rounded-2xl p-5 bg-gradient-to-br from-sky-50/40 via-white to-blue-50/30 border border-sky-100 shadow-sm shadow-sky-100/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs">
                  <IdCard className="w-4 h-4" />
                </span>
                <span className="text-sm font-black text-gray-900">Identitas Soal</span>
              </h3>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-full uppercase">
                Profil Guru & Sekolah
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-600 mb-1 block">Nama Guru</label>
                <input 
                  type="text" 
                  value={state.guru}
                  onChange={e => handleInputChange("guru", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-200/80 rounded-xl text-xs font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition"
                  placeholder="Nama Anda"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-600 mb-1 block">Nama Sekolah</label>
                <input 
                  type="text" 
                  value={state.sekolah}
                  onChange={e => handleInputChange("sekolah", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-200/80 rounded-xl text-xs font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition"
                  placeholder="SDN/SMPN/..."
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Jenjang</span>
                  <span className="text-[10px] text-sky-600 font-extrabold uppercase">{state.jenjang}</span>
                </label>
                <select 
                  value={state.jenjang}
                  onChange={e => handleInputChange("jenjang", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-200/80 rounded-xl text-xs font-bold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-xs"
                >
                  {JENJANG_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-700 mb-1 block">Kelas</label>
                <input 
                  type="text" 
                  value={state.kelas}
                  onChange={e => handleInputChange("kelas", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-200/80 rounded-xl text-xs font-bold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-xs"
                  placeholder={state.jenjang === "SD" ? "1-6" : state.jenjang === "SMP" ? "7-9" : "10-12"}
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Mata Pelajaran</label>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    {state.jenjang === "SMK" ? "Kejuruan & Umum SMK" : state.jenjang === "SMA" ? "Umum & Peminatan SMA" : `${state.jenjang} / Pokok`}
                  </span>
                </div>
                <select 
                  value={state.mapel}
                  onChange={e => handleInputChange("mapel", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-200/80 rounded-xl text-xs font-bold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-xs"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {getAvailableMapelGroups(state.jenjang, state.curriculum).map(group => (
                    <optgroup key={group.groupName} label={group.groupName}>
                      {group.items.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <optgroup label="Kustom / Pilihan Sendiri">
                    <option value="Lainnya (Ketik Sendiri)">Lainnya (Ketik Sendiri)</option>
                  </optgroup>
                </select>
                {state.mapel === "Lainnya (Ketik Sendiri)" && (
                  <input 
                    type="text" 
                    value={state.mapelCustom}
                    onChange={e => handleInputChange("mapelCustom", e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold text-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition shadow-xs"
                    placeholder="Ketik nama mata pelajaran atau keahlian khusus..."
                  />
                )}
              </div>
              <div className="col-span-2">
                {(() => {
                  const effectiveMapel = state.mapel === "Lainnya (Ketik Sendiri)" ? state.mapelCustom : state.mapel;
                  const smartData = getSmartTopicSuggestions(effectiveMapel, state.jenjang);
                  return (
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                        <span>Topik/Materi Pembelajaran <span className="text-red-500">*</span></span>
                        <span className="text-[10px] font-normal text-sky-600">Wajib Diisi</span>
                      </label>
                      <input 
                        type="text" 
                        value={state.topik}
                        onChange={e => handleInputChange("topik", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-sky-300 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 focus:outline-none transition shadow-xs"
                        placeholder={smartData.placeholder}
                      />
                      
                      {/* Rekomendasi Topik Cerdas Chips */}
                      {smartData.suggestions.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Rekomendasi Cerdas:</span>
                          </span>
                          {smartData.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleInputChange("topik", suggestion)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 hover:border-sky-400 transition cursor-pointer"
                              title={`Gunakan topik "${suggestion}"`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* Reference Material */}
          <section className="glass-card rounded-2xl p-5 bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/30 border border-teal-100 shadow-sm shadow-teal-100/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-xs">
                  <FileType className="w-4 h-4" />
                </span>
                <span className="text-sm font-black text-gray-900">Materi Referensi</span>
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase">
                Sumber Naskah
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3.5">
              Jika tidak diisi, AI akan merancang soal berdasarkan topik kurikulum secara mandiri.
            </p>
            
            <div className="flex gap-2 mb-3.5">
              {[
                { id: "none", label: "Tanpa", active: "bg-slate-700 text-white shadow-sm", inactive: "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80" },
                { id: "pdf", label: "Unggah PDF", active: "bg-rose-600 text-white shadow-sm shadow-rose-200", inactive: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80" },
                { id: "txt", label: "File TXT", active: "bg-amber-600 text-white shadow-sm shadow-amber-200", inactive: "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80" },
                { id: "manual", label: "Ketik Manual", active: "bg-teal-600 text-white shadow-sm shadow-teal-200", inactive: "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80" },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    handleInputChange("materiMethod", method.id);
                    if (method.id === "pdf" || method.id === "txt") {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap",
                    state.materiMethod === method.id 
                      ? method.active 
                      : method.inactive
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt"
              className="hidden"
            />

            {(state.materiMethod === "manual" || state.materiText) && (
              <textarea
                value={state.materiText}
                onChange={e => handleInputChange("materiText", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-teal-200 rounded-xl text-xs font-medium focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition min-h-[110px]"
                placeholder="Ketik atau paste materi pembelajaran di sini..."
              />
            )}

            {state.materiMethod !== "none" && (
              <div className="mt-3">
                <label className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1 block">Instruksi Tambahan</label>
                <input 
                  type="text" 
                  value={state.materiInstruction}
                  onChange={e => handleInputChange("materiInstruction", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl text-xs focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
                  placeholder="Contoh: Fokus pada bab 3..."
                />
              </div>
            )}
          </section>

          {/* Configuration */}
          <section className="glass-card rounded-2xl p-5 bg-gradient-to-br from-purple-50/40 via-white to-fuchsia-50/30 border border-purple-100 shadow-sm shadow-purple-100/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                  <Sliders className="w-4 h-4" />
                </span>
                <span className="text-sm font-black text-gray-900">Konfigurasi Soal</span>
              </h3>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full uppercase">
                Format & Parameter
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Jenis Asesmen</label>
                <select 
                  value={state.jenisAsesmen}
                  onChange={e => handleInputChange("jenisAsesmen", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200/80 rounded-xl text-xs font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition"
                >
                  <option>Sumatif Harian</option>
                  <option>Sumatif Tengah Semester (STS)</option>
                  <option>Sumatif Akhir Semester (SAS)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Opsi Jawaban (PG)</label>
                <select 
                  value={state.opsiJawaban}
                  onChange={e => handleInputChange("opsiJawaban", e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200/80 rounded-xl text-xs font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition"
                >
                  <option value="4">4 Opsi (A-D)</option>
                  <option value="5">5 Opsi (A-E)</option>
                </select>
              </div>
            </div>

            {/* Shuffle Order Toggle Feature */}
            <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                  state.shuffleQuestions 
                    ? "bg-purple-600 text-white shadow-md shadow-purple-200" 
                    : "bg-white text-purple-400 border border-purple-200"
                )}>
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-800">Acak Urutan Soal (Shuffle)</span>
                    {state.shuffleQuestions && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    Kocok nomor soal secara otomatis sebelum ditampilkan
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.shuffleQuestions}
                onClick={toggleShuffle}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  state.shuffleQuestions ? "bg-purple-600" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                    state.shuffleQuestions ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Jumlah Soal 9 Boxes Berwarna-warni */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-purple-600" /> Komposisi Jumlah Soal
                </label>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-black">
                  Total: {totalSoal} Soal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(state.counts).map(([key, val]) => {
                  const theme = QUESTION_TYPE_THEMES[key] || {
                    label: key,
                    bg: "bg-gray-50",
                    text: "text-gray-800",
                    border: "border-gray-200",
                    badge: "bg-gray-600 text-white",
                    countBg: "bg-white text-gray-900"
                  };
                  return (
                    <div 
                      key={key} 
                      className={cn(
                        "rounded-xl p-2.5 border transition-all shadow-xs flex flex-col justify-between",
                        theme.bg,
                        theme.border
                      )}
                    >
                      <label className={cn("text-[10px] font-bold block mb-1.5 truncate leading-tight", theme.text)}>
                        {theme.label}
                      </label>
                      <input 
                        type="number" 
                        min={0}
                        max={50}
                        value={val}
                        onChange={e => handleCountChange(key as keyof AppState["counts"], parseInt(e.target.value) || 0)}
                        className={cn(
                          "w-full rounded-lg text-sm text-center font-black focus:outline-none py-1 border border-black/5 shadow-inner",
                          theme.countBg
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tingkat Kesulitan Berwarna-warni */}
            <div className="mt-5">
              <label className="text-xs font-black text-gray-800 mb-2.5 block">Tingkat Kesulitan (%)</label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(state.proportions).map(([key, val]) => {
                  const diffStyles = {
                    mudah: "border-emerald-200 bg-emerald-50/90 text-emerald-900 focus:border-emerald-500",
                    sedang: "border-amber-200 bg-amber-50/90 text-amber-900 focus:border-amber-500",
                    sulit: "border-rose-200 bg-rose-50/90 text-rose-900 focus:border-rose-500",
                  }[key] || "border-gray-200 bg-gray-50 text-gray-800";

                  return (
                    <div key={key} className="text-center">
                      <label className="text-[10px] font-bold text-gray-600 block mb-1 uppercase tracking-wider">{key}</label>
                      <input 
                        type="number" 
                        value={val}
                        onChange={e => handleProportionChange(key as keyof AppState["proportions"], parseInt(e.target.value) || 0)}
                        className={cn(
                          "w-full px-2 py-2 border-2 rounded-xl text-sm text-center font-black focus:outline-none transition shadow-xs",
                          diffStyles
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Level Kognitif Berwarna-warni */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-gray-800">Level Kognitif (Taksonomi Bloom)</label>
                <span className="text-[10px] font-bold text-gray-400">{state.cognitiveLevels.length} Terpilih</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {COGNITIVE_LEVELS.map(level => {
                  const theme = COGNITIVE_LEVEL_THEMES[level] || { active: "bg-indigo-600 text-white", inactive: "bg-gray-100 text-gray-700", name: "" };
                  const isSelected = state.cognitiveLevels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleCognitiveLevel(level)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center",
                        isSelected ? theme.active : theme.inactive
                      )}
                    >
                      <span className="font-mono font-black text-xs">{level}</span>
                      <span className="text-[9px] font-normal truncate mt-0.5 opacity-90">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pengaturan Visual Berwarna-warni */}
            <div className="mt-5">
              <label className="text-xs font-black text-gray-800 mb-2.5 block flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" /> Kebutuhan Visual / Gambar (Jumlah)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(state.visuals).map(([key, val]) => {
                  const theme = VISUAL_THEMES[key] || { label: key, bg: "bg-gray-50", text: "text-gray-800", border: "border-gray-200", accent: "text-purple-600" };
                  return (
                    <div 
                      key={key} 
                      className={cn(
                        "rounded-xl p-2.5 border transition-all shadow-xs flex flex-col justify-between",
                        theme.bg,
                        theme.border
                      )}
                    >
                      <label className={cn("text-[10px] font-bold block mb-1 truncate leading-tight", theme.text)}>
                        {theme.label}
                      </label>
                      <input 
                        type="number" 
                        min={0}
                        max={20}
                        value={val}
                        onChange={e => handleVisualChange(key as keyof AppState["visuals"], parseInt(e.target.value) || 0)}
                        className="w-full bg-white rounded-lg text-sm text-center font-black focus:outline-none py-1 border border-black/5 shadow-inner"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <button 
            onClick={generateSoal}
            disabled={loading}
            className="w-full gradient-bg text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
            <span>{loading ? "Sedang Membuat Soal..." : "Buat Soal Otomatis"}</span>
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border-2 border-red-100 text-red-700 rounded-2xl text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        {/* Right Content Area - Results */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
            {/* Tabs Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 no-print overflow-x-auto bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50">
              <div className="flex gap-2">
                {[
                  { 
                    id: "dashboard", 
                    label: "Ringkasan", 
                    icon: LayoutDashboard, 
                    activeClass: "bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400/40",
                    inactiveClass: "bg-blue-50/90 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-blue-100 text-blue-600",
                  },
                  { 
                    id: "soal", 
                    label: "Soal", 
                    icon: FileText, 
                    activeClass: "bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400/40",
                    inactiveClass: "bg-indigo-50/90 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-indigo-100 text-indigo-600",
                  },
                  { 
                    id: "kunci", 
                    label: "Kunci", 
                    icon: Key, 
                    activeClass: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-400/40",
                    inactiveClass: "bg-emerald-50/90 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-emerald-100 text-emerald-600",
                  },
                  { 
                    id: "kisikisi", 
                    label: "Kisi-Kisi", 
                    icon: Layers, 
                    activeClass: "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-400/40",
                    inactiveClass: "bg-amber-50/90 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-amber-100 text-amber-700",
                  },
                  { 
                    id: "kuis", 
                    label: "Kuis", 
                    icon: Gamepad2, 
                    activeClass: "bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 text-white shadow-md shadow-pink-200 ring-2 ring-pink-400/40",
                    inactiveClass: "bg-pink-50/90 text-pink-700 border border-pink-200 hover:bg-pink-100 hover:border-pink-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-pink-100 text-pink-600",
                  },
                  { 
                    id: "analisis", 
                    label: "Analisis", 
                    icon: BarChart3, 
                    activeClass: "bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white shadow-md shadow-purple-200 ring-2 ring-purple-400/40",
                    inactiveClass: "bg-purple-50/90 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-purple-100 text-purple-600",
                  },
                  { 
                    id: "koreksi", 
                    label: "Auto-Grade", 
                    icon: CheckCheck, 
                    activeClass: "bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-600 text-white shadow-md shadow-teal-200 ring-2 ring-teal-400/40",
                    inactiveClass: "bg-teal-50/90 text-teal-800 border border-teal-200 hover:bg-teal-100 hover:border-teal-300",
                    iconActive: "bg-white/20 text-white",
                    iconInactive: "bg-teal-100 text-teal-700",
                  },
                ].map(tab => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-xs",
                        isActive ? tab.activeClass : tab.inactiveClass
                      )}
                    >
                      <span className={cn(
                        "p-1 rounded-lg flex items-center justify-center transition-colors",
                        isActive ? tab.iconActive : tab.iconInactive
                      )}>
                        <tab.icon className="w-3.5 h-3.5" />
                      </span>
                      <span>{tab.label}</span>
                      {tab.id === "kuis" && quizTimerRunning && quizTimerEnabled && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimerDigits(quizTimeRemaining)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {questions.length > 0 && (
                  <div className="flex items-center bg-violet-50/80 p-1 rounded-xl border border-violet-200">
                    <button
                      onClick={toggleShuffle}
                      title={state.shuffleQuestions ? "Urutan soal sedang diacak. Klik untuk kembali ke urutan asli." : "Klik untuk mengacak urutan soal."}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        state.shuffleQuestions 
                          ? "bg-purple-600 text-white shadow-sm" 
                          : "text-purple-700 hover:bg-purple-100"
                      )}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Acak: {state.shuffleQuestions ? "ON" : "OFF"}</span>
                    </button>
                    {state.shuffleQuestions && (
                      <button
                        onClick={handleReshuffle}
                        title="Kocok ulang urutan soal"
                        className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {questions.length > 0 && (
                  <button 
                    onClick={() => setShowPdfModal(true)}
                    title="Ekspor Naskah Soal Ujian ke PDF A4 Resmi"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-200 active:scale-95"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ekspor PDF</span>
                  </button>
                )}

                <button 
                  onClick={handleDownload}
                  title="Unduh Soal (JSON)"
                  className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowPdfModal(true)}
                  title="Cetak / Pratinjau Naskah Soal Resmi"
                  className="p-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 hover:text-rose-700 transition"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  title="Pengaturan Kop Surat"
                  className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 hover:text-amber-800 transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1">
              {activeTab === "dashboard" ? (
                <DashboardOverview
                  state={state}
                  questions={questions}
                  totalSoal={totalSoal}
                  gradingResult={gradingResult}
                  quizAnswers={quizAnswers}
                  quizTimeSpent={quizTimeSpent}
                  quizSubmitted={quizSubmitted}
                  onOpenQuestions={() => setActiveTab("soal")}
                  onOpenQuiz={() => setActiveTab("kuis")}
                  onOpenGrade={() => setActiveTab("koreksi")}
                  onOpenAnalysis={() => setActiveTab("analisis")}
                  onOpenReorder={() => setIsQuickReorderOpen(true)}
                  onOpenPdf={() => setShowPdfModal(true)}
                  onQuickSampleGrade={handleGenerateSampleStudentAnswers}
                />
              ) : questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <img 
                      key={headerSettings.logo}
                      src={headerSettings.logo} 
                      alt="Logo" 
                      className="w-12 h-12 object-contain opacity-40"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700">Siap Membuat Soal</h3>
                  <p className="text-gray-400 text-sm mt-2 max-w-xs leading-relaxed">
                    Lengkapi form di sebelah kiri, lalu klik tombol "Buat Soal Otomatis" untuk memulai keajaiban AI.
                  </p>
                  {state.shuffleQuestions && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700">
                      <Shuffle className="w-3.5 h-3.5" /> Mode Acak Urutan Aktif
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Shuffle & Reorder Status Banner */}
                  <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 no-print">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">
                        {questions.length} Butir Soal Terbentuk
                      </span>
                      <span className="text-gray-300">•</span>
                      {state.shuffleQuestions ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          <Shuffle className="w-3 h-3" /> Urutan Diacak (Shuffled)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-200/80 text-gray-600">
                          Urutan Terstruktur
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsQuickReorderOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                        title="Buka tampilan ringkas drag & drop untuk menata urutan soal"
                      >
                        <MoveVertical className="w-3.5 h-3.5" />
                        <span>Susun Urutan Soal</span>
                      </button>

                      <button
                        onClick={() => setShowPdfModal(true)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Ekspor PDF Resmi</span>
                      </button>

                      <button
                        onClick={toggleShuffle}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
                          state.shuffleQuestions 
                            ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        {state.shuffleQuestions ? "Kembalikan Asli" : "Acak Urutan"}
                      </button>
                      {state.shuffleQuestions && (
                        <button
                          onClick={handleReshuffle}
                          title="Kocok ulang susunan urutan soal"
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Kocok Ulang</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reorder Toast Notification */}
                  {reorderNotification && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-1 shadow-sm no-print">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{reorderNotification}</span>
                    </div>
                  )}

                  {/* Drag and Drop Guide Banner */}
                  <div className="px-4 py-2.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900 no-print">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="leading-snug">
                        <strong>Atur Nomor Soal:</strong> Anda dapat langsung <strong>menyeret (drag & drop)</strong> kartu soal di bawah ini atau menekan tombol panah <strong>(⬆️ / ⬇️)</strong> untuk menata urutan nomor sebelum dicetak ke lembar PDF.
                      </span>
                    </div>
                    <button
                      onClick={() => setIsQuickReorderOpen(true)}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0 whitespace-nowrap"
                    >
                      Buka Mode Susun Cepat →
                    </button>
                  </div>

                  {/* Tab: SOAL */}
                  {activeTab === "soal" && (() => {
                    const normalizeDiff = (diff?: string) => (diff || "").toLowerCase().trim();
                    const mudahCount = questions.filter(q => normalizeDiff(q.difficulty).includes("mudah")).length;
                    const sedangCount = questions.filter(q => normalizeDiff(q.difficulty).includes("sedang")).length;
                    const sulitCount = questions.filter(q => normalizeDiff(q.difficulty).includes("sulit")).length;

                    const filteredItems = questions
                      .map((q, originalIdx) => ({ q, originalIdx }))
                      .filter(({ q }) => {
                        if (difficultyFilter !== "all" && !normalizeDiff(q.difficulty).includes(difficultyFilter)) return false;
                        if (searchQuery.trim()) {
                          const query = searchQuery.toLowerCase().trim();
                          const qText = (q.question || "").toLowerCase();
                          const qAns = (q.answer || "").toLowerCase();
                          const qExp = (q.explanation || "").toLowerCase();
                          const qOpts = (q.options || []).join(" ").toLowerCase();
                          if (!qText.includes(query) && !qAns.includes(query) && !qExp.includes(query) && !qOpts.includes(query)) {
                            return false;
                          }
                        }
                        return true;
                      });

                    const getDifficultyTheme = (diff?: string) => {
                      const norm = normalizeDiff(diff);
                      if (norm.includes("mudah")) {
                        return {
                          borderClass: "border-l-4 border-emerald-500",
                          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          dotClass: "bg-emerald-500",
                          label: "Mudah",
                        };
                      }
                      if (norm.includes("sedang")) {
                        return {
                          borderClass: "border-l-4 border-amber-500",
                          badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
                          dotClass: "bg-amber-500",
                          label: "Sedang",
                        };
                      }
                      if (norm.includes("sulit")) {
                        return {
                          borderClass: "border-l-4 border-rose-500",
                          badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
                          dotClass: "bg-rose-500",
                          label: "Sulit",
                        };
                      }
                      return {
                        borderClass: "border-l-4 border-indigo-500",
                        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
                        dotClass: "bg-indigo-500",
                        label: diff || "Umum",
                      };
                    };

                    return (
                      <div className="space-y-5">
                        {/* Difficulty Filtering Toolbar */}
                        <div className="bg-white p-3.5 rounded-2xl border border-gray-100/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                              <Filter className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <span>Filter Tingkat Kesulitan</span>
                                {difficultyFilter !== "all" && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold uppercase">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400">
                                {difficultyFilter === "all"
                                  ? `Menampilkan seluruh ${questions.length} butir soal`
                                  : `Menampilkan ${filteredItems.length} dari ${questions.length} butir soal (${difficultyFilter})`}
                              </p>
                            </div>
                          </div>

                          {/* Difficulty Filter Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Semua */}
                            <button
                              type="button"
                              onClick={() => setDifficultyFilter("all")}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                                difficultyFilter === "all"
                                  ? "bg-gray-800 text-white shadow-sm ring-2 ring-gray-800/20"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              <span>Semua</span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                                  difficultyFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200/90 text-gray-700"
                                )}
                              >
                                {questions.length}
                              </span>
                            </button>

                            {/* Mudah */}
                            <button
                              type="button"
                              onClick={() => setDifficultyFilter("mudah")}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                                difficultyFilter === "mudah"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100 ring-2 ring-emerald-500/20"
                                  : "bg-emerald-50/70 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100"
                              )}
                            >
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                difficultyFilter === "mudah" ? "bg-emerald-200" : "bg-emerald-500"
                              )} />
                              <span>Mudah</span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                                  difficultyFilter === "mudah" ? "bg-white/25 text-white" : "bg-emerald-200/80 text-emerald-800"
                                )}
                              >
                                {mudahCount}
                              </span>
                            </button>

                            {/* Sedang */}
                            <button
                              type="button"
                              onClick={() => setDifficultyFilter("sedang")}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                                difficultyFilter === "sedang"
                                  ? "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-100 ring-2 ring-amber-500/20"
                                  : "bg-amber-50/70 text-amber-800 border-amber-200/80 hover:bg-amber-100"
                              )}
                            >
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                difficultyFilter === "sedang" ? "bg-amber-200" : "bg-amber-500"
                              )} />
                              <span>Sedang</span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                                  difficultyFilter === "sedang" ? "bg-white/25 text-white" : "bg-amber-200/80 text-amber-800"
                                )}
                              >
                                {sedangCount}
                              </span>
                            </button>

                            {/* Sulit */}
                            <button
                              type="button"
                              onClick={() => setDifficultyFilter("sulit")}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
                                difficultyFilter === "sulit"
                                  ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-100 ring-2 ring-rose-500/20"
                                  : "bg-rose-50/70 text-rose-800 border-rose-200/80 hover:bg-rose-100"
                              )}
                            >
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                difficultyFilter === "sulit" ? "bg-rose-200" : "bg-rose-500"
                              )} />
                              <span>Sulit</span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                                  difficultyFilter === "sulit" ? "bg-white/25 text-white" : "bg-rose-200/80 text-rose-800"
                                )}
                              >
                                {sulitCount}
                              </span>
                            </button>

                            {/* Reset button if active */}
                            {difficultyFilter !== "all" && (
                              <button
                                type="button"
                                onClick={() => setDifficultyFilter("all")}
                                title="Reset filter tingkat kesulitan"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filtered Empty State */}
                        {filteredItems.length === 0 ? (
                          <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                              <Filter className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-gray-800">
                              Tidak Ditemukan Soal Tingkat "{difficultyFilter.toUpperCase()}"
                            </h4>
                            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
                              Tidak ada butir soal dalam paket ini yang bertingkat kesulitan {difficultyFilter}. Silakan beralih ke tingkat kesulitan lain atau lihat semua soal.
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDifficultyFilter("all")}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                              >
                                Tampilkan Semua Soal ({questions.length})
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {filteredItems.map(({ q, originalIdx }, idx) => {
                              const theme = getDifficultyTheme(q.difficulty);
                              const isDraggingThis = draggedIndex === originalIdx;
                              const isDragOverThis = dragOverIndex === originalIdx && draggedIndex !== originalIdx;

                              return (
                                <div 
                                  key={q.id} 
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", originalIdx.toString());
                                    e.dataTransfer.effectAllowed = "move";
                                    setDraggedIndex(originalIdx);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (dragOverIndex !== originalIdx) {
                                      setDragOverIndex(originalIdx);
                                    }
                                  }}
                                  onDragEnter={(e) => {
                                    e.preventDefault();
                                    if (dragOverIndex !== originalIdx) {
                                      setDragOverIndex(originalIdx);
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                    if (dragOverIndex === originalIdx) {
                                      setDragOverIndex(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (draggedIndex !== null && draggedIndex !== originalIdx) {
                                      handleReorderQuestion(draggedIndex, originalIdx);
                                    }
                                    setDraggedIndex(null);
                                    setDragOverIndex(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedIndex(null);
                                    setDragOverIndex(null);
                                  }}
                                  className={cn(
                                    "p-5 bg-white rounded-r-2xl shadow-sm border border-gray-100/80 hover:shadow-md transition-all duration-150 relative",
                                    theme.borderClass,
                                    isDraggingThis && "opacity-40 scale-[0.99] border-dashed border-2 border-indigo-500 bg-indigo-50/20 shadow-none",
                                    isDragOverThis && "ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50/40 shadow-lg scale-[1.01]"
                                  )}
                                >
                                  {isDragOverThis && (
                                    <div className="absolute -top-3 left-4 right-4 h-1.5 bg-indigo-600 rounded-full shadow-sm animate-pulse" />
                                  )}

                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* Drag Handle with Grip Icon */}
                                      <div 
                                        className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-600 p-1 -ml-1 rounded-lg hover:bg-indigo-50/80 transition select-none group/grip"
                                        title="Tahan & seret untuk memindahkan urutan nomor soal"
                                      >
                                        <GripVertical className="w-4 h-4 text-gray-400 group-hover/grip:text-indigo-600 shrink-0" />
                                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
                                          {idx + 1}
                                        </span>
                                      </div>

                                      {difficultyFilter !== "all" && (
                                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md" title="Nomor urut dalam naskah lengkap">
                                          Soal Asli #{originalIdx + 1}
                                        </span>
                                      )}
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                        {q.type} • {q.cognitiveLevel}
                                      </span>
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border flex items-center gap-1",
                                        theme.badgeClass
                                      )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", theme.dotClass)} />
                                        {theme.label}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 no-print">
                                      {/* Reorder Buttons (Up & Down) */}
                                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                                        <button 
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => {
                                            const targetIdx = difficultyFilter === "all" ? originalIdx - 1 : filteredItems[idx - 1].originalIdx;
                                            handleReorderQuestion(originalIdx, targetIdx);
                                          }}
                                          title="Pindahkan ke nomor sebelumnya"
                                          className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-25 transition"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-[10px] text-gray-300 font-bold">|</span>
                                        <button 
                                          type="button"
                                          disabled={idx === filteredItems.length - 1}
                                          onClick={() => {
                                            const targetIdx = difficultyFilter === "all" ? originalIdx + 1 : filteredItems[idx + 1].originalIdx;
                                            handleReorderQuestion(originalIdx, targetIdx);
                                          }}
                                          title="Pindahkan ke nomor berikutnya"
                                          className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-25 transition"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <button 
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        title="Hapus Soal"
                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-3">
                                    {q.question}
                                  </p>
                                  {q.options && q.options.length > 0 && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                      {q.options.map((opt, i) => (
                                        <div key={i} className="text-xs text-gray-700 p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-md bg-white border border-gray-200 font-bold flex items-center justify-center shrink-0 text-gray-600 text-[11px]">
                                            {String.fromCharCode(65 + i)}
                                          </span>
                                          <span className="pt-0.5">{opt}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {q.indicator && (
                                    <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100 italic">
                                      Indikator: {q.indicator}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Tab: KUNCI JAWABAN */}
                  {activeTab === "kunci" && (
                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div key={q.id} className="p-5 border-l-4 border-emerald-500 bg-white rounded-r-2xl shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-700 line-clamp-1">
                              {q.question}
                            </span>
                          </div>
                          <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Kunci Jawaban: {q.answer}</span>
                            </div>
                            {q.explanation && (
                              <p className="text-xs text-emerald-900/80 mt-1.5 pl-5 leading-relaxed">
                                <span className="font-semibold">Pembahasan:</span> {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab: KISI-KISI */}
                  {activeTab === "kisikisi" && (
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200">
                          <tr>
                            <th className="p-3 w-12 text-center">No</th>
                            <th className="p-3">Materi / Indikator</th>
                            <th className="p-3">Bentuk Soal</th>
                            <th className="p-3">Level Kognitif</th>
                            <th className="p-3">Tingkat Kesulitan</th>
                            <th className="p-3">Kunci</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {questions.map((q, idx) => (
                            <tr key={q.id} className="hover:bg-gray-50 transition">
                              <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                              <td className="p-3 font-medium text-gray-800">{q.indicator || state.topik}</td>
                              <td className="p-3 uppercase font-semibold text-indigo-600">{q.type}</td>
                              <td className="p-3 font-bold text-amber-700">{q.cognitiveLevel}</td>
                              <td className="p-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                  q.difficulty === "mudah" ? "bg-green-100 text-green-700" :
                                  q.difficulty === "sedang" ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-700"
                                )}>
                                  {q.difficulty}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-emerald-600">{q.answer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tab: KUIS INTERAKTIF DENGAN TIMER */}
                  {activeTab === "kuis" && (() => {
                    const quizStats = getQuizScoreStats();
                    const progressPercent = quizTimerDuration > 0 
                      ? Math.max(0, Math.min(100, Math.round((quizTimeRemaining / quizTimerDuration) * 100))) 
                      : 0;
                    const isUrgent = quizTimerEnabled && quizTimerRunning && quizTimeRemaining <= 30 && quizTimeRemaining > 0;
                    const isWarning = quizTimerEnabled && quizTimerRunning && quizTimeRemaining <= 60 && quizTimeRemaining > 30;

                    return (
                      <div className="space-y-6">
                        {/* Sticky Timer HUD Bar */}
                        <div className={cn(
                          "sticky top-2 z-30 p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300",
                          isUrgent 
                            ? "bg-rose-50/95 border-rose-300 ring-2 ring-rose-500/40 shadow-rose-200/50" 
                            : isWarning
                              ? "bg-amber-50/95 border-amber-300 ring-2 ring-amber-400/30 shadow-amber-200/40"
                              : quizTimeUp
                                ? "bg-red-50/95 border-red-300 shadow-red-100"
                                : quizSubmitted
                                  ? "bg-emerald-50/95 border-emerald-300 shadow-emerald-100"
                                  : "bg-white/95 border-pink-200/90 shadow-pink-100/50"
                        )}>
                          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Left: Info & Mode */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <div className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 transition-transform",
                                isUrgent 
                                  ? "bg-rose-600 animate-pulse scale-105" 
                                  : isWarning 
                                    ? "bg-amber-600" 
                                    : quizTimeUp
                                      ? "bg-red-600"
                                      : quizSubmitted
                                        ? "bg-emerald-600"
                                        : "bg-gradient-to-tr from-pink-500 to-rose-500"
                              )}>
                                {quizTimeUp ? (
                                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                                ) : quizSubmitted ? (
                                  <Award className="w-6 h-6" />
                                ) : (
                                  <Timer className={cn("w-6 h-6", quizTimerRunning && "animate-spin")} style={{ animationDuration: "8s" }} />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-gray-900 text-sm">
                                    {quizTimeUp 
                                      ? "Waktu Ujian Telah Habis!" 
                                      : quizSubmitted 
                                        ? "Kuis Telah Dikumpulkan" 
                                        : "Simulasi Ujian & Kuis Bertempo"}
                                  </h4>
                                  {quizTimerEnabled && (
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                      quizTimeUp
                                        ? "bg-rose-200 text-rose-800"
                                        : quizSubmitted
                                          ? "bg-emerald-200 text-emerald-800"
                                          : quizTimerRunning
                                            ? "bg-rose-100 text-rose-700 animate-pulse"
                                            : quizTimeSpent > 0
                                              ? "bg-amber-100 text-amber-800"
                                              : "bg-gray-100 text-gray-700"
                                    )}>
                                      {quizTimeUp 
                                        ? "WAKTU HABIS" 
                                        : quizSubmitted 
                                          ? "SELESAI" 
                                          : quizTimerRunning 
                                            ? "BERJALAN" 
                                            : quizTimeSpent > 0 
                                              ? "DIJEDA" 
                                              : "SIAP"}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                  <span>
                                    Terjawab: <strong className="text-gray-800">{quizStats.answeredCount}</strong> dari <strong className="text-gray-800">{quizStats.totalQuestions}</strong> Soal
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Mode: <strong className="text-pink-700">{quizFeedbackMode === "exam" ? "Ujian Resmi" : "Latihan Instan"}</strong>
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Center: Live Countdown Clock */}
                            {quizTimerEnabled && (
                              <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-2xl border border-gray-200/80 shadow-inner">
                                <Clock className={cn(
                                  "w-5 h-5",
                                  isUrgent 
                                    ? "text-rose-600 animate-spin" 
                                    : isWarning 
                                      ? "text-amber-600 animate-pulse" 
                                      : "text-pink-600"
                                )} style={{ animationDuration: isUrgent ? "2s" : undefined }} />
                                
                                <div className="text-center">
                                  <span className={cn(
                                    "font-mono font-black text-2xl md:text-3xl tracking-widest block leading-none",
                                    isUrgent 
                                      ? "text-rose-600 animate-pulse drop-shadow-sm" 
                                      : isWarning 
                                        ? "text-amber-600" 
                                        : quizTimeUp
                                          ? "text-red-700"
                                          : "text-gray-900"
                                  )}>
                                    {formatTimerDigits(quizTimeRemaining)}
                                  </span>
                                  <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-wider block mt-0.5",
                                    isUrgent 
                                      ? "text-rose-600 font-black animate-bounce" 
                                      : isWarning 
                                        ? "text-amber-700 font-extrabold" 
                                        : "text-gray-400"
                                  )}>
                                    {isUrgent 
                                      ? "Waktu Hampir Habis!" 
                                      : isWarning 
                                        ? "< 1 Menit Tersisa" 
                                        : quizTimeUp 
                                          ? "Selesai" 
                                          : `Dari ${formatTimerDigits(quizTimerDuration)}`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Right: Timer Action Controls */}
                            <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
                              {/* Start / Pause / Resume */}
                              {quizTimerEnabled && !quizSubmitted && !quizTimeUp && (
                                <>
                                  {!quizTimerRunning ? (
                                    <button
                                      type="button"
                                      onClick={handleStartQuizTimer}
                                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
                                      title={quizTimeSpent > 0 ? "Lanjutkan Pengerjaan" : "Mulai Hitung Mundur"}
                                    >
                                      <Play className="w-4 h-4 fill-current" />
                                      <span>{quizTimeSpent > 0 ? "Lanjutkan" : "Mulai Timer"}</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={handlePauseQuizTimer}
                                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
                                      title="Jeda Waktu Pengerjaan"
                                    >
                                      <Pause className="w-4 h-4 fill-current" />
                                      <span>Jeda</span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Finish & Submit Early Button */}
                              {!quizSubmitted && !quizTimeUp && (
                                <button
                                  type="button"
                                  onClick={handleSubmitQuizEarly}
                                  className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
                                  title="Kumpulkan Jawaban dan Lihat Skor Sekarang"
                                >
                                  <CheckCheck className="w-4 h-4" />
                                  <span>Kumpulkan</span>
                                </button>
                              )}

                              {/* Show Score Summary Modal Button (if already submitted or time up) */}
                              {(quizSubmitted || quizTimeUp) && (
                                <button
                                  type="button"
                                  onClick={() => setShowTimeUpModal(true)}
                                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
                                >
                                  <Award className="w-4 h-4" />
                                  <span>Rapor Nilai</span>
                                </button>
                              )}

                              {/* Reset Quiz & Timer */}
                              <button
                                type="button"
                                onClick={() => handleResetQuizTimer()}
                                className="p-2 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-sm active:scale-95"
                                title="Atur ulang timer dan jawaban kuis"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>

                              {/* Sound Toggle */}
                              <button
                                type="button"
                                onClick={() => setQuizSoundEnabled(!quizSoundEnabled)}
                                className={cn(
                                  "p-2 rounded-xl border transition shadow-sm active:scale-95",
                                  quizSoundEnabled 
                                    ? "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" 
                                    : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                                )}
                                title={quizSoundEnabled ? "Suara Peringatan Timer: Aktif" : "Suara Peringatan Timer: Senyap"}
                              >
                                {quizSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar Underneath Header */}
                          {quizTimerEnabled && (
                            <div className="w-full bg-gray-200/80 h-2 rounded-full overflow-hidden mt-3 relative">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isUrgent 
                                    ? "bg-rose-500 animate-pulse" 
                                    : isWarning 
                                      ? "bg-amber-500" 
                                      : "bg-gradient-to-r from-pink-500 to-indigo-600"
                                )}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Timer Settings Toolbar & Presets */}
                        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-gray-600 mr-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-pink-600" /> Durasi:
                              </span>
                              {[
                                { min: 3, label: "3 Mnt" },
                                { min: 5, label: "5 Mnt" },
                                { min: 10, label: "10 Mnt" },
                                { min: 15, label: "15 Mnt" },
                                { min: 20, label: "20 Mnt" },
                                { min: 30, label: "30 Mnt" },
                              ].map(preset => {
                                const isCurrent = quizTimerDuration === preset.min * 60;
                                return (
                                  <button
                                    key={preset.min}
                                    type="button"
                                    onClick={() => handleSelectQuizPreset(preset.min)}
                                    className={cn(
                                      "px-2.5 py-1 rounded-lg font-bold transition text-xs",
                                      isCurrent
                                        ? "bg-pink-600 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}

                              {/* Custom Minutes Toggle */}
                              <button
                                type="button"
                                onClick={() => setShowCustomTimerInput(!showCustomTimerInput)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg font-bold transition text-xs border",
                                  showCustomTimerInput
                                    ? "bg-pink-50 border-pink-300 text-pink-700"
                                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                Kustom
                              </button>
                            </div>

                            {/* Mode & Timer Toggle Switch */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Exam vs Instant Mode */}
                              <button
                                type="button"
                                onClick={() => setQuizFeedbackMode(quizFeedbackMode === "exam" ? "instant" : "exam")}
                                className="px-3 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 transition flex items-center gap-1"
                                title="Klik untuk beralih antara Mode Ujian Resmi dan Latihan Langsung"
                              >
                                <span>Mode:</span>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] uppercase font-black",
                                  quizFeedbackMode === "exam" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                                )}>
                                  {quizFeedbackMode === "exam" ? "Ujian (Kunci Terkunci)" : "Latihan (Instan)"}
                                </span>
                              </button>

                              {/* Enable / Disable Timer */}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = !quizTimerEnabled;
                                  setQuizTimerEnabled(next);
                                  if (!next) setQuizTimerRunning(false);
                                }}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-xs font-bold transition border flex items-center gap-1",
                                  quizTimerEnabled 
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                                    : "bg-gray-100 text-gray-600 border-gray-300"
                                )}
                              >
                                <Timer className="w-3.5 h-3.5" />
                                <span>Batas Waktu: {quizTimerEnabled ? "AKTIF" : "NONAKTIF"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Custom Duration Input Form (if toggled) */}
                          {showCustomTimerInput && (
                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">Masukkan Durasi:</span>
                              <input
                                type="number"
                                min="1"
                                max="180"
                                value={customTimerMinutes}
                                onChange={e => setCustomTimerMinutes(e.target.value)}
                                className="w-20 px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-pink-500"
                                placeholder="Menit"
                              />
                              <span className="text-xs text-gray-500">menit</span>
                              <button
                                type="button"
                                onClick={handleApplyCustomQuizTimer}
                                className="px-3 py-1 bg-pink-600 text-white rounded-lg text-xs font-bold hover:bg-pink-700 transition"
                              >
                                Terapkan
                              </button>
                            </div>
                          )}

                          {/* Timing hint */}
                          <div className="text-[11px] text-gray-500 flex items-center justify-between">
                            <span>
                              💡 Alokasi waktu rata-rata: ~{questions.length > 0 ? Math.round(quizTimerDuration / questions.length) : 0} detik per butir soal.
                            </span>
                            {quizFeedbackMode === "exam" && !quizSubmitted && !quizTimeUp && (
                              <span className="text-indigo-600 font-semibold">
                                * Kunci jawaban & pembahasan akan ditampilkan setelah waktu habis atau menekan "Kumpulkan".
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Paused State Banner */}
                        {!quizTimerRunning && quizTimeSpent > 0 && !quizSubmitted && !quizTimeUp && quizTimerEnabled && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                                <Pause className="w-5 h-5 fill-current" />
                              </div>
                              <div>
                                <h4 className="font-bold text-amber-900 text-sm">Pengerjaan Kuis Sedang Dijeda</h4>
                                <p className="text-xs text-amber-700">Waktu berhenti sementara. Klik tombol "Lanjutkan" untuk meneruskan pengerjaan ujian.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleStartQuizTimer}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition shrink-0"
                            >
                              <Play className="w-4 h-4 fill-current" />
                              <span>Lanjutkan Ujian</span>
                            </button>
                          </div>
                        )}

                        {/* Time's Up / Finished Banner */}
                        {(quizTimeUp || quizSubmitted) && (
                          <div className={cn(
                            "p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm",
                            quizTimeUp 
                              ? "bg-rose-50 border-rose-200 text-rose-950" 
                              : "bg-emerald-50 border-emerald-200 text-emerald-950"
                          )}>
                            <div className="flex items-center gap-3.5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0",
                                quizTimeUp ? "bg-rose-600" : "bg-emerald-600"
                              )}>
                                {quizStats.percentage}%
                              </div>
                              <div>
                                <h4 className="font-extrabold text-base">
                                  {quizTimeUp ? "Waktu Pengerjaan Habis!" : "Ujian Kuis Selesai Dikerjakan!"}
                                </h4>
                                <p className="text-xs opacity-80 mt-0.5">
                                  Benar <strong>{quizStats.correctCount}</strong> dari <strong>{quizStats.totalQuestions}</strong> soal • Waktu terpakai: <strong>{formatTimerDigits(quizTimeSpent)}</strong> • Predikat: <strong>{quizStats.predicate.label}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowTimeUpModal(true)}
                                className={cn(
                                  "px-4 py-2 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition",
                                  quizTimeUp ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                                )}
                              >
                                <Award className="w-4 h-4" />
                                <span>Lihat Rincian Skor</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetQuizTimer()}
                                className="px-3.5 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span>Ulangi Kuis</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Question List */}
                        <div className="space-y-4">
                          {questions.map((q, idx) => {
                            const isAnswered = !!quizAnswers[q.id];
                            const selectedOption = quizAnswers[q.id];
                            const isExamEvaluating = quizSubmitted || quizTimeUp || quizFeedbackMode === "instant";

                            return (
                              <div 
                                key={q.id} 
                                className={cn(
                                  "p-5 bg-white rounded-2xl border transition-all shadow-sm",
                                  isExamEvaluating && selectedOption
                                    ? q.answer.trim().toUpperCase().startsWith(selectedOption.toUpperCase())
                                      ? "border-emerald-300 ring-1 ring-emerald-200"
                                      : "border-rose-300 ring-1 ring-rose-200"
                                    : "border-gray-100 hover:border-gray-200"
                                )}
                              >
                                {/* Question Header */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold uppercase text-gray-400">{q.type}</span>
                                    {q.difficulty && (
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                        q.difficulty === "mudah" ? "bg-green-100 text-green-700" :
                                        q.difficulty === "sedang" ? "bg-amber-100 text-amber-700" :
                                        "bg-red-100 text-red-700"
                                      )}>
                                        {q.difficulty}
                                      </span>
                                    )}
                                    {q.cognitiveLevel && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {q.cognitiveLevel}
                                      </span>
                                    )}
                                  </div>

                                  {/* Evaluation Badge for this question */}
                                  {isExamEvaluating && selectedOption && (
                                    <div>
                                      {q.answer.trim().toUpperCase().startsWith(selectedOption.toUpperCase()) ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          <Check className="w-3 h-3 text-emerald-600" /> Benar
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                          <X className="w-3 h-3 text-rose-600" /> Salah
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Question Text */}
                                <p className="text-sm font-semibold text-gray-800 mb-4 leading-relaxed">
                                  {q.question}
                                </p>

                                {/* Options for Multiple Choice */}
                                {q.options && q.options.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {q.options.map((opt, i) => {
                                      const optLetter = String.fromCharCode(65 + i);
                                      const isSelected = selectedOption === optLetter;
                                      const isOptionCorrect = q.answer.trim().toUpperCase().startsWith(optLetter);

                                      // Determine button styling based on mode and evaluation state
                                      let buttonClass = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                                      let badgeClass = "bg-white border text-gray-600";

                                      if (isSelected) {
                                        if (isExamEvaluating) {
                                          if (isOptionCorrect) {
                                            buttonClass = "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm font-bold ring-1 ring-emerald-300";
                                            badgeClass = "bg-emerald-600 text-white";
                                          } else {
                                            buttonClass = "bg-rose-50 border-rose-400 text-rose-950 shadow-sm font-bold ring-1 ring-rose-300";
                                            badgeClass = "bg-rose-600 text-white";
                                          }
                                        } else {
                                          // Exam mode during timed exam (answers hidden)
                                          buttonClass = "bg-pink-50 border-pink-400 text-pink-900 shadow-sm font-bold ring-2 ring-pink-300/50";
                                          badgeClass = "bg-pink-600 text-white";
                                        }
                                      } else if (isExamEvaluating && isOptionCorrect && selectedOption) {
                                        // Highlight correct answer if user answered wrong
                                        buttonClass = "bg-emerald-50/50 border-dashed border-emerald-400 text-emerald-900";
                                        badgeClass = "bg-emerald-100 text-emerald-800 border border-emerald-300";
                                      }

                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          disabled={quizSubmitted || quizTimeUp}
                                          onClick={() => {
                                            if (quizSubmitted || quizTimeUp) return;
                                            setQuizAnswers(prev => ({ ...prev, [q.id]: optLetter }));
                                            // Start timer automatically on first answer if enabled and not running
                                            if (quizTimerEnabled && !quizTimerRunning && quizTimeSpent === 0) {
                                              handleStartQuizTimer();
                                            }
                                          }}
                                          className={cn(
                                            "text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start justify-between gap-2",
                                            buttonClass,
                                            (quizSubmitted || quizTimeUp) && "cursor-default"
                                          )}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            <span className={cn(
                                              "w-5 h-5 rounded-md font-bold flex items-center justify-center shrink-0 text-[11px]",
                                              badgeClass
                                            )}>
                                              {optLetter}
                                            </span>
                                            <span className="pt-0.5">{opt}</span>
                                          </div>

                                          {/* Mini indicator icon in evaluation mode */}
                                          {isExamEvaluating && (
                                            <div className="shrink-0 pt-0.5">
                                              {isSelected && isOptionCorrect && (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                              )}
                                              {isSelected && !isOptionCorrect && (
                                                <XCircle className="w-4 h-4 text-rose-600" />
                                              )}
                                              {!isSelected && isOptionCorrect && selectedOption && (
                                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                  Kunci Benar
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  /* Text field for non-PG questions (Isian / Essay) */
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      disabled={quizSubmitted || quizTimeUp}
                                      value={quizAnswers[q.id] || ""}
                                      onChange={e => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      placeholder="Tuliskan jawaban Anda di sini..."
                                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-pink-500 focus:outline-none transition"
                                    />
                                    {isExamEvaluating && (
                                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                                        <span className="font-bold text-emerald-900 block mb-0.5">Kunci Jawaban Resmi:</span>
                                        <span className="text-emerald-800 font-semibold">{q.answer}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Explanation block (revealed when evaluating) */}
                                {isExamEvaluating && isAnswered && q.explanation && (
                                  <div className="mt-3.5 p-3.5 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-200/80 leading-relaxed">
                                    <span className="font-bold text-gray-900 block mb-1 flex items-center gap-1.5">
                                      <Info className="w-3.5 h-3.5 text-pink-600" /> Pembahasan & Keterangan:
                                    </span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                          <span className="text-xs font-bold text-gray-600">
                            {quizStats.answeredCount} dari {quizStats.totalQuestions} Soal Telah Dijawab
                          </span>

                          <div className="flex items-center gap-2">
                            {!quizSubmitted && !quizTimeUp && (
                              <button
                                type="button"
                                onClick={handleSubmitQuizEarly}
                                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>Kumpulkan Ujian Sekarang</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleResetQuizTimer()}
                              className="px-4 py-2.5 bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 font-bold text-xs rounded-xl shadow-sm transition"
                            >
                              Atur Ulang Kuis
                            </button>
                          </div>
                        </div>

                        {/* TIME'S UP / RESULT MODAL */}
                        <AnimatePresence>
                          {showTimeUpModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-6"
                              >
                                {/* Modal Header */}
                                <div className="text-center">
                                  <div className={cn(
                                    "w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg mb-3",
                                    quizTimeUp 
                                      ? "bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-200" 
                                      : "bg-gradient-to-tr from-pink-500 to-indigo-600 shadow-pink-200"
                                  )}>
                                    {quizTimeUp ? (
                                      <Clock className="w-8 h-8 animate-bounce" />
                                    ) : (
                                      <Award className="w-8 h-8" />
                                    )}
                                  </div>
                                  <h3 className="text-xl font-black text-gray-900">
                                    {quizTimeUp ? "Waktu Pengerjaan Habis!" : "Ujian Kuis Selesai!"}
                                  </h3>
                                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                    {quizTimeUp 
                                      ? "Durasi waktu pengerjaan telah mencapai 00:00. Semua lembar jawaban Anda otomatis disimpan dan dinilai."
                                      : "Selamat! Anda telah menyelesaikan seluruh pengerjaan kuis dengan baik."}
                                  </p>
                                </div>

                                {/* Score Big Card */}
                                <div className="p-5 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-2xl border border-pink-100 text-center">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                    Skor Akhir Anda
                                  </span>
                                  <span className="text-5xl font-black text-pink-600 block leading-tight font-mono">
                                    {quizStats.percentage}%
                                  </span>
                                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border"
                                    style={{
                                      backgroundColor: quizStats.percentage >= 70 ? "#ECFDF5" : "#FFF1F2",
                                      borderColor: quizStats.percentage >= 70 ? "#A7F3D0" : "#FECDD3",
                                      color: quizStats.percentage >= 70 ? "#047857" : "#BE123C",
                                    }}
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>{quizStats.predicate.label}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    {quizStats.predicate.desc}
                                  </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center">
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Total Soal</span>
                                    <span className="text-lg font-black text-gray-800">{quizStats.totalQuestions}</span>
                                  </div>
                                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="text-[10px] font-bold text-emerald-700 block uppercase">Benar</span>
                                    <span className="text-lg font-black text-emerald-700">{quizStats.correctCount}</span>
                                  </div>
                                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                                    <span className="text-[10px] font-bold text-rose-700 block uppercase">Salah / Kosong</span>
                                    <span className="text-lg font-black text-rose-700">{quizStats.totalQuestions - quizStats.correctCount}</span>
                                  </div>
                                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <span className="text-[10px] font-bold text-indigo-700 block uppercase">Waktu</span>
                                    <span className="text-sm font-black text-indigo-700">{formatTimerDigits(quizTimeSpent)}</span>
                                  </div>
                                </div>

                                {/* Modal Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowTimeUpModal(false)}
                                    className="flex-1 py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm text-center"
                                  >
                                    Tinjau Jawaban & Pembahasan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleResetQuizTimer();
                                      handleStartQuizTimer();
                                    }}
                                    className="py-3 px-4 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Ulangi Kuis</span>
                                  </button>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  {/* Tab: ANALISIS (ITEM ANALYSIS - P-VALUE & D-INDEX) */}
                  {activeTab === "analisis" && (
                    <ItemAnalysis 
                      questions={questions}
                      state={state}
                      quizAnswers={quizAnswers}
                      studentAnswers={studentAnswers}
                      onNavigateToQuestion={() => {
                        setActiveTab("soal");
                      }}
                    />
                  )}

                  {/* Tab: KOREKSI (AUTO-GRADE) */}
                  {activeTab === "koreksi" && (
                    <div className="space-y-6">
                      {/* Auto-Grade Header Banner */}
                      <div className="p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 rounded-2xl border border-teal-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 bg-teal-600 text-white rounded-lg shadow-sm">
                              <CheckCheck className="w-4 h-4" />
                            </span>
                            <h3 className="font-bold text-gray-800 text-base">Koreksi Otomatis (Auto-Grade)</h3>
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wide rounded-full">
                              Smart Grader
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                            Bandingkan lembar jawaban siswa dengan kunci jawaban dari {questions.length} butir soal yang aktif. Unggah file jawaban atau input secara manual untuk menghitung persentase nilai secara otomatis.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                          <button
                            onClick={handleGenerateSampleStudentAnswers}
                            title="Isi contoh lembar jawaban siswa secara otomatis untuk uji coba"
                            className="px-3.5 py-2 bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>Contoh Jawaban Siswa</span>
                          </button>
                          {gradingResult && (
                            <button
                              onClick={handleResetGrading}
                              title="Reset data koreksi dan jawaban siswa"
                              className="p-2 bg-white text-gray-500 border border-gray-200 hover:bg-gray-100 rounded-xl transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Student Info Card */}
                      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-teal-600" /> Nama Siswa
                            </label>
                            <input
                              type="text"
                              value={studentInfo.name}
                              onChange={e => setStudentInfo(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Contoh: Ahmad Fauzi / Siti Aminah"
                              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:border-teal-500 focus:bg-white focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-teal-600" /> Kelas / Nomor Absen
                            </label>
                            <input
                              type="text"
                              value={studentInfo.class}
                              onChange={e => setStudentInfo(prev => ({ ...prev, class: e.target.value }))}
                              placeholder="Contoh: Kelas VIII-A / No. 14"
                              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:border-teal-500 focus:bg-white focus:outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Method Selection Tabs */}
                      <div className="space-y-4">
                        <div className="flex border-b border-gray-200 gap-2">
                          {[
                            { 
                              id: "upload", 
                              label: "Unggah File Kunci", 
                              icon: FileUp,
                              active: "border-teal-600 text-teal-800 bg-teal-50 rounded-t-xl shadow-xs",
                              inactive: "border-transparent text-gray-500 hover:text-teal-700 hover:bg-teal-50/40"
                            },
                            { 
                              id: "manual", 
                              label: "Ketik / Tempel Batch Teks", 
                              icon: Keyboard,
                              active: "border-indigo-600 text-indigo-800 bg-indigo-50 rounded-t-xl shadow-xs",
                              inactive: "border-transparent text-gray-500 hover:text-indigo-700 hover:bg-indigo-50/40"
                            },
                            { 
                              id: "form", 
                              label: "Lembar Jawaban Interaktif (Per Nomor)", 
                              icon: ListOrdered,
                              active: "border-amber-600 text-amber-800 bg-amber-50 rounded-t-xl shadow-xs",
                              inactive: "border-transparent text-gray-500 hover:text-amber-700 hover:bg-amber-50/40"
                            },
                          ].map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setAutoGradeInputMode(mode.id as any)}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
                                autoGradeInputMode === mode.id ? mode.active : mode.inactive
                              )}
                            >
                              <mode.icon className="w-4 h-4" />
                              <span>{mode.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* MODE 1: FILE UPLOAD */}
                        {autoGradeInputMode === "upload" && (
                          <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-teal-200 hover:border-teal-400 transition-all text-center">
                            <input 
                              type="file"
                              ref={studentFileInputRef}
                              accept=".txt,.csv,.json"
                              onChange={handleStudentFileUpload}
                              className="hidden"
                            />

                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <FileUp className="w-6 h-6" />
                            </div>

                            <h4 className="text-sm font-bold text-gray-800">Unggah Dokumen Kunci Jawaban Siswa</h4>
                            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                              Pilih file berformat <strong className="text-teal-700">.txt</strong>, <strong className="text-teal-700">.csv</strong>, atau <strong className="text-teal-700">.json</strong> yang memuat jawaban siswa.
                            </p>

                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                              <button
                                onClick={() => studentFileInputRef.current?.click()}
                                className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition shadow-sm flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" /> Pilih File Jawaban
                              </button>
                            </div>

                            {/* Format Guide */}
                            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-700 block mb-1">Format TXT</span>
                                <code className="text-[10px] text-gray-600 block whitespace-pre leading-relaxed font-mono">
                                  1. A&#10;2. B&#10;3. C&#10;atau: A, B, C, D
                                </code>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-700 block mb-1">Format CSV</span>
                                <code className="text-[10px] text-gray-600 block whitespace-pre leading-relaxed font-mono">
                                  No,Jawaban&#10;1,A&#10;2,B&#10;3,C
                                </code>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-[11px] font-bold text-gray-700 block mb-1">Format JSON</span>
                                <code className="text-[10px] text-gray-600 block whitespace-pre leading-relaxed font-mono">
                                  &#123;"1":"A", "2":"B", "3":"C"&#125;&#10;atau: ["A", "B", "C"]
                                </code>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* MODE 2: MANUAL TEXTAREA */}
                        {autoGradeInputMode === "manual" && (
                          <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <Keyboard className="w-3.5 h-3.5 text-teal-600" /> Tempelkan Jawaban Siswa
                              </label>
                              <span className="text-[11px] font-semibold text-gray-400">
                                Terdeteksi: {Object.keys(parseStudentAnswersFromText(manualAnswerText, questions.length)).length} jawaban
                              </span>
                            </div>

                            <textarea
                              rows={5}
                              value={manualAnswerText}
                              onChange={e => setManualAnswerText(e.target.value)}
                              placeholder={`Contoh:\n1. A\n2. C\n3. B\n4. D\natau dalam satu baris: A, C, B, D, A\natau JSON: {"1": "A", "2": "C"}`}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:border-teal-500 focus:bg-white focus:outline-none transition leading-relaxed"
                            />

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-gray-400">
                                Mendukung format nomor (1. A), baris baru, koma, atau JSON.
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setManualAnswerText("")}
                                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 transition font-medium"
                                >
                                  Bersihkan
                                </button>
                                <button
                                  onClick={handleApplyManualText}
                                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition shadow-sm flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> Terapkan & Hitung
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* MODE 3: INTERACTIVE GRID PER NOMOR */}
                        {autoGradeInputMode === "form" && (
                          <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                              <div>
                                <h4 className="text-xs font-bold text-gray-800">Lembar Isian Jawaban Siswa</h4>
                                <p className="text-[11px] text-gray-400">Klik pilihan huruf atau masukkan teks jawaban untuk tiap nomor soal.</p>
                              </div>
                              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold">
                                {Object.keys(studentAnswers).filter(k => (studentAnswers[Number(k)] || "").trim() !== "").length} / {questions.length} Terisi
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
                              {questions.map((q, idx) => {
                                const qNum = idx + 1;
                                const currentVal = studentAnswers[qNum] || "";
                                const hasOptions = q.options && q.options.length > 0;
                                const optionLetters = hasOptions ? q.options!.map((_, i) => String.fromCharCode(65 + i)) : ["A", "B", "C", "D"];

                                return (
                                  <div key={q.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex flex-col justify-between gap-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-gray-700">No. {qNum}</span>
                                      <span className="text-[10px] font-bold uppercase text-gray-400 px-1.5 py-0.5 bg-white rounded border">
                                        {q.type}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 line-clamp-1" title={q.question}>
                                      {q.question}
                                    </p>

                                    {hasOptions || q.type === "pg" ? (
                                      <div className="flex items-center gap-1 mt-1">
                                        {optionLetters.map(letter => {
                                          const isSelected = extractOptionLetter(currentVal) === letter;
                                          return (
                                            <button
                                              key={letter}
                                              onClick={() => handleSetStudentAnswerForQuestion(qNum, letter)}
                                              className={cn(
                                                "flex-1 h-7 rounded-lg text-xs font-bold transition-all",
                                                isSelected
                                                  ? "bg-teal-600 text-white shadow-sm"
                                                  : "bg-white text-gray-600 border border-gray-200 hover:bg-teal-50"
                                              )}
                                            >
                                              {letter}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        value={currentVal}
                                        onChange={e => handleSetStudentAnswerForQuestion(qNum, e.target.value)}
                                        placeholder="Jawaban siswa..."
                                        className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:border-teal-500 focus:outline-none"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Grade Action Button */}
                      <div className="flex items-center justify-end gap-3 no-print">
                        <button
                          onClick={() => runAutoGrading()}
                          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-teal-200 transition-all active:scale-95"
                        >
                          <Award className="w-4 h-4" />
                          <span>Hitung & Tampilkan Nilai Siswa</span>
                        </button>
                      </div>

                      {/* --- RESULTS SECTION --- */}
                      {gradingResult && (
                        <div className="space-y-6 pt-2">
                          {/* Score Hero Banner */}
                          <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                              {/* Percentage Circle / Badge */}
                              <div className={cn(
                                "w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-lg shrink-0",
                                gradingResult.predicate.bg
                              )}>
                                <span className="text-2xl font-black tracking-tight">{gradingResult.scorePercentage}%</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Nilai Akhir</span>
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                                  <h4 className="text-xl font-black text-gray-800">
                                    {gradingResult.studentName}
                                  </h4>
                                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-black", gradingResult.predicate.badgeBg)}>
                                    Predikat {gradingResult.predicate.grade}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-gray-500">
                                  {gradingResult.studentClass !== "-" ? `${gradingResult.studentClass} • ` : ""}
                                  Evaluasi {gradingResult.totalQuestions} Soal • {gradingResult.evaluatedAt}
                                </p>
                                <span className={cn("inline-block mt-2 px-3 py-1 rounded-xl text-xs font-bold border", gradingResult.predicate.color)}>
                                  {gradingResult.predicate.label}
                                </span>
                              </div>
                            </div>

                            {/* Export / Print Buttons */}
                            <div className="flex items-center gap-2 no-print">
                              <button
                                onClick={handleDownloadGradeReport}
                                className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                              >
                                <Download className="w-4 h-4 text-gray-500" /> Unduh CSV
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                              >
                                <Printer className="w-4 h-4" /> Cetak Lembar Nilai
                              </button>
                            </div>
                          </div>

                          {/* 4 Stat Metric Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Soal</span>
                              <span className="text-2xl font-black text-gray-800">{gradingResult.totalQuestions}</span>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Benar</span>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <span className="text-2xl font-black text-emerald-800">{gradingResult.correctCount}</span>
                              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                                {Math.round((gradingResult.correctCount / gradingResult.totalQuestions) * 100)}% dari total
                              </span>
                            </div>
                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Salah</span>
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                              </div>
                              <span className="text-2xl font-black text-red-800">{gradingResult.incorrectCount}</span>
                              <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                                {Math.round((gradingResult.incorrectCount / gradingResult.totalQuestions) * 100)}% dari total
                              </span>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Tidak Dijawab</span>
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              </div>
                              <span className="text-2xl font-black text-amber-800">{gradingResult.unansweredCount}</span>
                              <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">
                                {Math.round((gradingResult.unansweredCount / gradingResult.totalQuestions) * 100)}% dari total
                              </span>
                            </div>
                          </div>

                          {/* Detail Breakdown Title & Filters */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                              <ClipboardCheck className="w-4 h-4 text-teal-600" />
                              Rincian Hasil Evaluasi Per Soal
                            </h4>

                            <div className="flex items-center gap-1.5 no-print">
                              {[
                                { id: "all", label: `Semua (${gradingResult.details.length})` },
                                { id: "incorrect", label: `Salah (${gradingResult.incorrectCount + gradingResult.unansweredCount})` },
                                { id: "correct", label: `Benar (${gradingResult.correctCount})` },
                              ].map(filter => (
                                <button
                                  key={filter.id}
                                  onClick={() => setGradeFilter(filter.id as any)}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                    gradeFilter === filter.id
                                      ? "bg-teal-600 text-white shadow-xs"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  )}
                                >
                                  {filter.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Question Comparison Cards */}
                          <div className="space-y-3">
                            {gradingResult.details
                              .filter(d => {
                                if (gradeFilter === "correct") return d.isCorrect;
                                if (gradeFilter === "incorrect") return !d.isCorrect;
                                return true;
                              })
                              .map(item => (
                                <div
                                  key={item.qNum}
                                  className={cn(
                                    "p-4 rounded-2xl border transition-all",
                                    item.isCorrect
                                      ? "bg-emerald-50/30 border-emerald-200"
                                      : item.studentAnswer
                                        ? "bg-red-50/30 border-red-200"
                                        : "bg-amber-50/30 border-amber-200"
                                  )}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center">
                                        {item.qNum}
                                      </span>
                                      <span className="text-[10px] font-bold uppercase text-gray-400 bg-white px-2 py-0.5 rounded border">
                                        {item.type}
                                      </span>
                                    </div>

                                    {item.isCorrect ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <Check className="w-3 h-3 text-emerald-700" /> Benar
                                      </span>
                                    ) : item.studentAnswer ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
                                        <X className="w-3 h-3 text-red-700" /> Salah
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                                        <AlertCircle className="w-3 h-3 text-amber-700" /> Kosong
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs font-semibold text-gray-800 mb-3 leading-relaxed">
                                    {item.question}
                                  </p>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {/* Student Answer */}
                                    <div className={cn(
                                      "p-2.5 rounded-xl border flex items-start gap-2",
                                      item.isCorrect
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                        : item.studentAnswer
                                          ? "bg-red-50 border-red-300 text-red-900"
                                          : "bg-gray-100 border-gray-300 text-gray-500"
                                    )}>
                                      <span className="font-bold shrink-0">Jawaban Siswa:</span>
                                      <span className="font-medium break-all">{item.studentAnswer || "(Tidak dijawab)"}</span>
                                    </div>

                                    {/* Correct Answer */}
                                    <div className="p-2.5 rounded-xl border bg-emerald-100/60 border-emerald-300 text-emerald-900 flex items-start gap-2">
                                      <span className="font-bold shrink-0">Kunci Jawaban:</span>
                                      <span className="font-medium break-all">{item.correctAnswer}</span>
                                    </div>
                                  </div>

                                  {/* Explanation */}
                                  {item.explanation && (
                                    <div className="mt-2.5 p-2.5 bg-white/80 rounded-xl text-[11px] text-gray-600 border border-gray-100">
                                      <strong className="text-gray-700">Pembahasan:</strong> {item.explanation}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" /> Pengaturan Output
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Logo URL</label>
                <input 
                  type="text" 
                  value={headerSettings.logo}
                  onChange={e => setHeaderSettings(prev => ({ ...prev, logo: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:border-indigo-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nama Instansi</label>
                <input 
                  type="text" 
                  value={headerSettings.instansi}
                  onChange={e => setHeaderSettings(prev => ({ ...prev, instansi: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:border-indigo-400 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Nama Sekolah</label>
                <input 
                  type="text" 
                  value={headerSettings.sekolah}
                  onChange={e => setHeaderSettings(prev => ({ ...prev, sekolah: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:border-indigo-400 focus:outline-none transition"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Tutup
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="px-6 py-2.5 gradient-bg text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md"
              >
                Simpan Perubahan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Reorder Modal (Drag and Drop Full List) */}
      {isQuickReorderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
                  <MoveVertical className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                    Susun Urutan Soal ({questions.length} Butir)
                  </h2>
                  <p className="text-xs text-indigo-200">
                    Geser (drag-and-drop) baris soal untuk mengatur urutan nomor naskah ujian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickReorderOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-800">
                <GripVertical className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  <strong>Panduan:</strong> Tahan ikon ⠿ (grip) dan seret baris soal ke atas atau bawah, atau klik tombol panah ⬆️ / ⬇️. Urutan baru ini otomatis diterapkan ke naskah soal saat diekspor ke PDF.
                </span>
              </div>

              {reorderNotification && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reorderNotification}</span>
                </div>
              )}

              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", idx.toString());
                      setDraggedIndex(idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverIndex !== idx) setDragOverIndex(idx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex !== null && draggedIndex !== idx) {
                        handleReorderQuestion(draggedIndex, idx);
                      }
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={cn(
                      "p-3 rounded-2xl border transition-all flex items-center gap-3 bg-white select-none",
                      draggedIndex === idx && "opacity-40 border-dashed border-indigo-400 bg-indigo-50/50",
                      dragOverIndex === idx && draggedIndex !== idx && "ring-2 ring-indigo-500 bg-indigo-50/80 shadow-md",
                      "hover:border-indigo-200 hover:shadow-xs"
                    )}
                  >
                    <div 
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-gray-100"
                      title="Seret untuk mengubah urutan nomor"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>

                    <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {q.type}
                        </span>
                        <span className="text-[10px] text-gray-400">•</span>
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                          q.difficulty === "mudah" ? "bg-emerald-50 text-emerald-700" :
                          q.difficulty === "sedang" ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {q.difficulty}
                        </span>
                        {q.cognitiveLevel && (
                          <>
                            <span className="text-[10px] text-gray-400">•</span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {q.cognitiveLevel}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleReorderQuestion(idx, idx - 1)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-25 transition"
                        title="Pindah ke atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleReorderQuestion(idx, idx + 1)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg disabled:opacity-25 transition"
                        title="Pindah ke bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500">
                Total: <strong className="text-gray-800">{questions.length}</strong> butir soal
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsQuickReorderOpen(false);
                    setShowPdfModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Lanjut Ekspor PDF</span>
                </button>
                <button
                  onClick={() => setIsQuickReorderOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        questions={questions}
        onReorderQuestions={setQuestions}
        state={state}
        headerSettings={headerSettings}
      />
    </div>
  );
}
