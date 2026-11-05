import React, { useState, useMemo } from "react";
import { 
  BarChart3, 
  HelpCircle, 
  Sliders, 
  Download, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Save, 
  FileSpreadsheet, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Filter, 
  ArrowUpDown, 
  Check, 
  X,
  Layers,
  GraduationCap
} from "lucide-react";
import { cn } from "../lib/utils";

export interface Question {
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

export interface ItemAnalysisData {
  questionId: string;
  qNum: number;
  question: Question;
  sampleSize: number; // N total siswa (e.g. 32)
  nUpper: number;     // Kelompok Atas (e.g. 9 = 27% of 32)
  nLower: number;     // Kelompok Bawah (e.g. 9 = 27% of 32)
  bUpper: number;     // Benar di Kelompok Atas
  bLower: number;     // Benar di Kelompok Bawah
  totalCorrect: number; // Total benar di seluruh kelas
  // P-Value (Tingkat Kesukaran): proportion of correct answers or (bUpper + bLower)/(nUpper + nLower)
  pValue: number; 
  // D-Index (Daya Pembeda): (bUpper - bLower) / nUpper
  dIndex: number;
  pCategory: "terlalu_sulit" | "sedang" | "terlalu_mudah";
  dCategory: "sangat_baik" | "baik" | "cukup" | "buruk" | "negatif";
  status: "diterima" | "revisi" | "dibuang";
  distractorCounts?: Record<string, { upper: number; lower: number; total: number }>;
  recommendation: string;
}

interface ItemAnalysisProps {
  questions: Question[];
  state: {
    mapel: string;
    mapelCustom: string;
    topik: string;
    kelas: string;
    jenjang: string;
    curriculum: string;
  };
  quizAnswers?: Record<string, string>;
  studentAnswers?: Record<number, string>;
  onNavigateToQuestion?: (questionId: string) => void;
}

// Helper to calculate P-value category
export function getPCategory(pValue: number): "terlalu_sulit" | "sedang" | "terlalu_mudah" {
  if (pValue < 0.30) return "terlalu_sulit";
  if (pValue <= 0.70) return "sedang";
  return "terlalu_mudah";
}

// Helper to calculate D-index category
export function getDCategory(dIndex: number): "sangat_baik" | "baik" | "cukup" | "buruk" | "negatif" {
  if (dIndex >= 0.40) return "sangat_baik";
  if (dIndex >= 0.30) return "baik";
  if (dIndex >= 0.20) return "cukup";
  if (dIndex >= 0.00) return "buruk";
  return "negatif";
}

// Helper to determine question overall acceptance status
export function getItemStatus(pValue: number, dIndex: number): "diterima" | "revisi" | "dibuang" {
  if (dIndex < 0.00) return "dibuang"; // negative discrimination: misleading or wrong key
  if (dIndex < 0.20) return "dibuang"; // poor discrimination: question doesn't differentiate
  if (dIndex >= 0.30 && pValue >= 0.30 && pValue <= 0.70) return "diterima"; // ideal!
  if (dIndex >= 0.20) return "revisi"; // acceptable but needs revision on distractors/difficulty
  return "revisi";
}

// Generate pedagogical recommendation based on P & D values
export function getPedagogicalRecommendation(
  pValue: number, 
  dIndex: number, 
  difficulty: string,
  cognitiveLevel: string
): string {
  if (dIndex < 0) {
    return "⚠️ Kunci jawaban mungkin salah atau tertukar! Siswa kelompok bawah justru lebih banyak menjawab benar dibandingkan kelompok atas. Periksa kunci jawaban dan telaah kembali kalimat pertanyaan terhadap adanya ambiguitas.";
  }
  if (dIndex < 0.20) {
    if (pValue > 0.80) {
      return `ℹ️ Soal terlalu mudah (P = ${pValue.toFixed(2)}) dan daya pembeda lemah (D = ${dIndex.toFixed(2)}). Siswa berkemampuan rendah dan tinggi sama-sama menjawab benar. Pertimbangkan menaikkan level kognitif ke tingkat ${cognitiveLevel.startsWith("C") ? "C4/C5 Analisis" : "analisis yang lebih tinggi"} atau memperkuat pilihan pengecoh.`;
    }
    if (pValue < 0.20) {
      return `⚠️ Soal terlalu sulit (P = ${pValue.toFixed(2)}) dan hampir seluruh siswa gagal menjawab benar (D = ${dIndex.toFixed(2)}). Cek apakah materi belum diajarkan, narasi soal terlalu berbelit, atau istilah yang dipakai asing bagi siswa.`;
    }
    return `⚠️ Daya pembeda sangat rendah (D = ${dIndex.toFixed(2)}). Butir soal tidak efektif membedakan kemampuan siswa pandai dan kurang. Disarankan merevisi opsi distraktor dan memperjelas stimulus soal.`;
  }
  if (dIndex >= 0.20 && dIndex < 0.30) {
    if (pValue < 0.30) {
      return `📝 Soal tergolong sukar namun masih memiliki daya pembeda cukup (D = ${dIndex.toFixed(2)}). Sederhanakan bahasa soal atau kurangi opsi yang terlalu menjebak agar tidak membebani siswa.`;
    }
    if (pValue > 0.70) {
      return `📝 Soal cukup mudah. Pengecoh kurang menarik bagi kelompok bawah. Revisi alternatif jawaban yang tidak pernah dipilih siswa.`;
    }
    return `📝 Butir soal cukup baik (D = ${dIndex.toFixed(2)}, P = ${pValue.toFixed(2)}). Dapat digunakan namun disarankan melakukan revisi kecil pada pilihan pengecoh agar lebih homogen.`;
  }
  if (dIndex >= 0.30 && dIndex < 0.40) {
    return `✅ Butir soal baik dan efektif (D = ${dIndex.toFixed(2)}, P = ${pValue.toFixed(2)}). Memenuhi kriteria standar asesmen nasional. Butir soal dapat disimpan dalam bank soal tanpa revisi mendasar.`;
  }
  // dIndex >= 0.40
  return `🌟 Butir soal SANGAT BAIK! Tingkat kesulitan ideal (P = ${pValue.toFixed(2)}) dengan daya pembeda tinggi (D = ${dIndex.toFixed(2)}). Mampu mengukur capaian pembelajaran siswa secara akurat dan valid.`;
}

// Generate realistic simulated response metrics for questions
function generateSimulatedMetrics(
  questions: Question[], 
  sampleSize: number = 32,
  seedVariant: number = 0
): Record<string, { bUpper: number; bLower: number; totalCorrect: number; distractorCounts?: Record<string, { upper: number; lower: number; total: number }> }> {
  const nUpper = Math.round(sampleSize * 0.27); // 9 for N=32
  const nLower = Math.round(sampleSize * 0.27); // 9 for N=32
  const nMiddle = sampleSize - nUpper - nLower;  // 14 for N=32

  const result: Record<string, { bUpper: number; bLower: number; totalCorrect: number; distractorCounts?: Record<string, { upper: number; lower: number; total: number }> }> = {};

  questions.forEach((q, idx) => {
    // Pseudo-random based on question id and seed
    const hash = (q.id + seedVariant).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx * 7;
    const jitter = ((hash % 100) - 50) / 100; // -0.5 to +0.5

    let bU: number;
    let bL: number;
    let bM: number;

    // Realistic behavior based on designated difficulty
    if (q.difficulty === "mudah") {
      // High pass rate in upper and relatively high in lower
      bU = Math.min(nUpper, Math.max(nUpper - 1, Math.round(nUpper * (0.88 + jitter * 0.1))));
      bL = Math.min(nLower - 1, Math.max(2, Math.round(nLower * (0.55 + jitter * 0.15))));
      bM = Math.round(nMiddle * (0.75 + jitter * 0.1));
    } else if (q.difficulty === "sulit") {
      // Low pass rate in upper and very low in lower
      bU = Math.min(nUpper - 2, Math.max(2, Math.round(nUpper * (0.45 + jitter * 0.15))));
      bL = Math.min(bU - 1, Math.max(0, Math.round(nLower * (0.15 + jitter * 0.1))));
      bM = Math.round(nMiddle * (0.28 + jitter * 0.1));
    } else {
      // "sedang" -> ideal discrimination
      bU = Math.min(nUpper, Math.max(nUpper - 2, Math.round(nUpper * (0.80 + jitter * 0.12))));
      bL = Math.min(bU - 2, Math.max(1, Math.round(nLower * (0.30 + jitter * 0.12))));
      bM = Math.round(nMiddle * (0.55 + jitter * 0.1));
    }

    // Occasional outlier to make analysis pedagogically rich (e.g. 1 question with tricky distractor or wrong key if seed % 5 == 0)
    if (idx === 2 && seedVariant === 0 && questions.length > 3) {
      // Make item 3 a "borderline" or tricky question to teach item analysis interpretation
      bU = Math.min(nUpper, Math.max(1, Math.round(nUpper * 0.40)));
      bL = Math.min(nLower, Math.max(1, Math.round(nLower * 0.35)));
      bM = Math.round(nMiddle * 0.38);
    }

    // Ensure within bounds
    bU = Math.max(0, Math.min(nUpper, bU));
    bL = Math.max(0, Math.min(nLower, bL));
    bM = Math.max(0, Math.min(nMiddle, bM));
    const totalCorrect = bU + bL + bM;

    // Distractor counts simulation for PG questions
    const distractorCounts: Record<string, { upper: number; lower: number; total: number }> = {};
    if (q.options && q.options.length > 0) {
      const optionLetters = q.options.map((_, i) => String.fromCharCode(65 + i));
      const keyLetter = q.answer.trim().toUpperCase().charAt(0) || "A";

      // Initialize
      optionLetters.forEach(letter => {
        distractorCounts[letter] = { upper: 0, lower: 0, total: 0 };
      });

      // Key option gets correct count
      if (distractorCounts[keyLetter]) {
        distractorCounts[keyLetter].upper = bU;
        distractorCounts[keyLetter].lower = bL;
        distractorCounts[keyLetter].total = totalCorrect;
      }

      // Distribute remaining incorrect answers across distractors
      const remainingUpper = nUpper - bU;
      const remainingLower = nLower - bL;
      const remainingTotal = sampleSize - totalCorrect;
      const otherLetters = optionLetters.filter(l => l !== keyLetter);

      if (otherLetters.length > 0) {
        otherLetters.forEach((letter, lIdx) => {
          const ratio = (lIdx + 1) / otherLetters.length;
          const uCount = Math.round(remainingUpper * (0.8 / otherLetters.length));
          const lCount = Math.round(remainingLower * (1.1 / otherLetters.length));
          distractorCounts[letter] = {
            upper: Math.min(remainingUpper, uCount),
            lower: Math.min(remainingLower, lCount),
            total: Math.max(1, Math.round(remainingTotal / otherLetters.length))
          };
        });
      }
    }

    result[q.id] = {
      bUpper: bU,
      bLower: bL,
      totalCorrect,
      distractorCounts
    };
  });

  return result;
}

export function ItemAnalysis({
  questions,
  state,
  quizAnswers,
  studentAnswers,
  onNavigateToQuestion
}: ItemAnalysisProps) {
  // Configurable class sample size
  const [sampleSize, setSampleSize] = useState<number>(32);
  const [seedVariant, setSeedVariant] = useState<number>(0);
  
  // Custom overrides per question (if teacher adjusts bUpper, bLower, or totalCorrect manually)
  const [customItemData, setCustomItemData] = useState<Record<string, { bUpper: number; bLower: number; totalCorrect?: number }>>({});
  
  // Selected question for deep-dive inspection / editor drawer
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  
  // Filters & Sorting
  const [filterStatus, setFilterStatus] = useState<"all" | "diterima" | "revisi" | "dibuang">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | "terlalu_sulit" | "sedang" | "terlalu_mudah">("all");
  const [sortBy, setSortBy] = useState<"number" | "p_asc" | "p_desc" | "d_asc" | "d_desc">("number");
  
  // Guide modal
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showPrintView, setShowPrintView] = useState<boolean>(false);

  // Group sizes based on Kelley's 27% rule
  const nUpper = Math.max(1, Math.round(sampleSize * 0.27));
  const nLower = Math.max(1, Math.round(sampleSize * 0.27));

  // Compute base simulated metrics
  const simulatedMap = useMemo(() => {
    return generateSimulatedMetrics(questions, sampleSize, seedVariant);
  }, [questions, sampleSize, seedVariant]);

  // Combine simulated data with any teacher overrides
  const itemsAnalysis: ItemAnalysisData[] = useMemo(() => {
    return questions.map((q, idx) => {
      const sim = simulatedMap[q.id] || { bUpper: 7, bLower: 3, totalCorrect: 18 };
      const custom = customItemData[q.id];

      const bUpper = custom !== undefined ? custom.bUpper : sim.bUpper;
      const bLower = custom !== undefined ? custom.bLower : sim.bLower;
      
      // Calculate P-value (Indeks Kesukaran)
      // Classic Formula: P = (bUpper + bLower) / (nUpper + nLower) or totalCorrect / sampleSize
      const calculatedP = Number(((bUpper + bLower) / (nUpper + nLower)).toFixed(2));
      const pValue = Math.max(0, Math.min(1, calculatedP));

      // Calculate D-index (Daya Pembeda)
      // Classic Formula: D = (bUpper / nUpper) - (bLower / nLower) = (bUpper - bLower) / n
      const calculatedD = Number(((bUpper - bLower) / nUpper).toFixed(2));
      const dIndex = Math.max(-1, Math.min(1, calculatedD));

      const pCategory = getPCategory(pValue);
      const dCategory = getDCategory(dIndex);
      const status = getItemStatus(pValue, dIndex);
      const recommendation = getPedagogicalRecommendation(pValue, dIndex, q.difficulty, q.cognitiveLevel);

      return {
        questionId: q.id,
        qNum: idx + 1,
        question: q,
        sampleSize,
        nUpper,
        nLower,
        bUpper,
        bLower,
        totalCorrect: custom?.totalCorrect !== undefined ? custom.totalCorrect : sim.totalCorrect,
        pValue,
        dIndex,
        pCategory,
        dCategory,
        status,
        distractorCounts: sim.distractorCounts,
        recommendation
      };
    });
  }, [questions, simulatedMap, customItemData, sampleSize, nUpper, nLower]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    return itemsAnalysis
      .filter(item => {
        if (filterStatus !== "all" && item.status !== filterStatus) return false;
        if (filterDifficulty !== "all" && item.pCategory !== filterDifficulty) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "number") return a.qNum - b.qNum;
        if (sortBy === "p_asc") return a.pValue - b.pValue;
        if (sortBy === "p_desc") return b.pValue - a.pValue;
        if (sortBy === "d_asc") return a.dIndex - b.dIndex;
        if (sortBy === "d_desc") return b.dIndex - a.dIndex;
        return 0;
      });
  }, [itemsAnalysis, filterStatus, filterDifficulty, sortBy]);

  // Summary statistics
  const summary = useMemo(() => {
    if (itemsAnalysis.length === 0) {
      return {
        avgP: 0,
        avgD: 0,
        diterimaCount: 0,
        revisiCount: 0,
        dibuangCount: 0,
        pDistribution: { sulit: 0, sedang: 0, mudah: 0 },
        dDistribution: { sangatBaik: 0, baik: 0, cukup: 0, buruk: 0, negatif: 0 }
      };
    }

    const totalP = itemsAnalysis.reduce((acc, it) => acc + it.pValue, 0);
    const totalD = itemsAnalysis.reduce((acc, it) => acc + it.dIndex, 0);
    const avgP = Number((totalP / itemsAnalysis.length).toFixed(2));
    const avgD = Number((totalD / itemsAnalysis.length).toFixed(2));

    const diterimaCount = itemsAnalysis.filter(it => it.status === "diterima").length;
    const revisiCount = itemsAnalysis.filter(it => it.status === "revisi").length;
    const dibuangCount = itemsAnalysis.filter(it => it.status === "dibuang").length;

    const pDistribution = {
      sulit: itemsAnalysis.filter(it => it.pCategory === "terlalu_sulit").length,
      sedang: itemsAnalysis.filter(it => it.pCategory === "sedang").length,
      mudah: itemsAnalysis.filter(it => it.pCategory === "terlalu_mudah").length
    };

    const dDistribution = {
      sangatBaik: itemsAnalysis.filter(it => it.dCategory === "sangat_baik").length,
      baik: itemsAnalysis.filter(it => it.dCategory === "baik").length,
      cukup: itemsAnalysis.filter(it => it.dCategory === "cukup").length,
      buruk: itemsAnalysis.filter(it => it.dCategory === "buruk").length,
      negatif: itemsAnalysis.filter(it => it.dCategory === "negatif").length
    };

    return {
      avgP,
      avgD,
      diterimaCount,
      revisiCount,
      dibuangCount,
      pDistribution,
      dDistribution
    };
  }, [itemsAnalysis]);

  // Selected item detail for editing or inspect drawer
  const selectedItem = useMemo(() => {
    if (!selectedQuestionId) return itemsAnalysis[0] || null;
    return itemsAnalysis.find(it => it.questionId === selectedQuestionId) || itemsAnalysis[0] || null;
  }, [itemsAnalysis, selectedQuestionId]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (itemsAnalysis.length === 0) return;

    const headers = [
      "No",
      "Pertanyaan",
      "Tipe Soal",
      "Kunci Jawaban",
      "Tingkat Kesukaran (P)",
      "Kategori Kesukaran",
      "Daya Pembeda (D)",
      "Kategori Daya Pembeda",
      "Status Kelayakan Butir",
      "Benar Kelompok Atas (BU)",
      "Benar Kelompok Bawah (BL)",
      "Ukuran Sampel (N)",
      "Rekomendasi Pedagogis"
    ];

    const rows = itemsAnalysis.map(it => [
      it.qNum,
      `"${it.question.question.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      it.question.type.toUpperCase(),
      `"${it.question.answer.replace(/"/g, '""')}"`,
      it.pValue.toFixed(2),
      it.pCategory === "terlalu_sulit" ? "Sukar (< 0.30)" : it.pCategory === "sedang" ? "Sedang (0.30 - 0.70)" : "Mudah (> 0.70)",
      it.dIndex.toFixed(2),
      it.dCategory === "sangat_baik" ? "Sangat Baik (D >= 0.40)" :
        it.dCategory === "baik" ? "Baik (0.30 - 0.39)" :
        it.dCategory === "cukup" ? "Cukup (0.20 - 0.29)" :
        it.dCategory === "buruk" ? "Buruk (0.00 - 0.19)" : "Negatif (< 0.00)",
      it.status === "diterima" ? "Diterima / Baik" : it.status === "revisi" ? "Perlu Revisi" : "Ditolak / Dibuang",
      `${it.bUpper}/${it.nUpper}`,
      `${it.bLower}/${it.nLower}`,
      it.sampleSize,
      `"${it.recommendation.replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (state.topik || state.mapel || "analisis").toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `analisis_butir_soal_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper badge renderers
  const renderPBadge = (pValue: number, category: string) => {
    if (category === "terlalu_sulit") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
          <span>Sukar (P = {pValue.toFixed(2)})</span>
        </span>
      );
    }
    if (category === "sedang") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Sedang / Ideal (P = {pValue.toFixed(2)})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
        <span>Mudah (P = {pValue.toFixed(2)})</span>
      </span>
    );
  };

  const renderDBadge = (dIndex: number, category: string) => {
    if (category === "sangat_baik") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sangat Baik (D = {dIndex.toFixed(2)})</span>
        </span>
      );
    }
    if (category === "baik") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
          <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
          <span>Baik (D = {dIndex.toFixed(2)})</span>
        </span>
      );
    }
    if (category === "cukup") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Minus className="w-3.5 h-3.5 text-amber-600" />
          <span>Cukup (D = {dIndex.toFixed(2)})</span>
        </span>
      );
    }
    if (category === "buruk") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
          <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
          <span>Buruk (D = {dIndex.toFixed(2)})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        <span>Negatif / Kunci Salah (D = {dIndex.toFixed(2)})</span>
      </span>
    );
  };

  const renderStatusBadge = (status: "diterima" | "revisi" | "dibuang") => {
    if (status === "diterima") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>DITERIMA</span>
        </span>
      );
    }
    if (status === "revisi") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>PERLU REVISI</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-800 border border-rose-300 shadow-xs">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>DITOLAK / DIBUANG</span>
      </span>
    );
  };

  if (questions.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-800">Belum Ada Soal untuk Dianalisis</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          Buat atau muat paket butir soal terlebih dahulu untuk menghitung tingkat kesukaran (P-value) dan daya pembeda (D-index).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 rounded-3xl border border-purple-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="font-black text-gray-900 text-lg">Analisis Kuantitatif Butir Soal (Item Analysis)</h3>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider rounded-full border border-purple-200">
              Teori Tes Klasik
            </span>
          </div>
          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Evaluasi kualitas butir soal menggunakan formula psikometri standar <strong>Indeks Kesukaran (P-Value)</strong> dan <strong>Daya Pembeda (D-Index)</strong>. Identifikasi apakah butir soal terlalu sukar, terlalu mudah, efektif, atau memerlukan perbaikan kunci & distraktor.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-3.5 py-2 bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Panduan Rumus & Kriteria</span>
          </button>

          <button
            type="button"
            onClick={() => setSeedVariant(prev => prev + 1)}
            title="Kocok ulang simulasi variasi respon siswa"
            className="px-3.5 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <span>Simulasikan Kelas Lain</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Laporan CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata P-Value */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rata-rata Kesukaran (P)</span>
            <span className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
              summary.avgP < 0.30 ? "bg-rose-100 text-rose-800" :
              summary.avgP <= 0.70 ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
            )}>
              {summary.avgP < 0.30 ? "Cenderung Sulit" : summary.avgP <= 0.70 ? "Ideal / Seimbang" : "Cenderung Mudah"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 font-mono">{summary.avgP.toFixed(2)}</span>
            <span className="text-xs text-gray-400 font-medium">rentang 0.00 - 1.00</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Sukar: <strong>{summary.pDistribution.sulit}</strong></span>
            <span>Sedang: <strong>{summary.pDistribution.sedang}</strong></span>
            <span>Mudah: <strong>{summary.pDistribution.mudah}</strong></span>
          </div>
        </div>

        {/* Card 2: Rata-rata D-Index */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rata-rata Pembeda (D)</span>
            <span className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
              summary.avgD >= 0.30 ? "bg-emerald-100 text-emerald-800" :
              summary.avgD >= 0.20 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
            )}>
              {summary.avgD >= 0.30 ? "Daya Pembeda Baik" : summary.avgD >= 0.20 ? "Perlu Penguatan" : "Lemah"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 font-mono">{summary.avgD.toFixed(2)}</span>
            <span className="text-xs text-gray-400 font-medium">rentang -1.00 s/d +1.00</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>Sangat Baik: <strong>{summary.dDistribution.sangatBaik}</strong></span>
            <span>Baik: <strong>{summary.dDistribution.baik}</strong></span>
            <span>Revisi: <strong>{summary.dDistribution.cukup + summary.dDistribution.buruk + summary.dDistribution.negatif}</strong></span>
          </div>
        </div>

        {/* Card 3: Kelayakan Butir Soal */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status Kelayakan</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              {questions.length} Total Soal
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-black text-emerald-600 font-mono">{summary.diterimaCount}</span>
            <span className="text-xs font-bold text-emerald-700">Diterima</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-xl font-black text-amber-600 font-mono">{summary.revisiCount}</span>
            <span className="text-xs font-bold text-amber-700">Revisi</span>
            {summary.dibuangCount > 0 && (
              <>
                <span className="text-gray-300 mx-1">/</span>
                <span className="text-xl font-black text-rose-600 font-mono">{summary.dibuangCount}</span>
                <span className="text-xs font-bold text-rose-700">Ditolak</span>
              </>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${(summary.diterimaCount / questions.length) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Diterima: ${summary.diterimaCount}`}
              />
              <div 
                style={{ width: `${(summary.revisiCount / questions.length) * 100}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Revisi: ${summary.revisiCount}`}
              />
              <div 
                style={{ width: `${(summary.dibuangCount / questions.length) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Ditolak: ${summary.dibuangCount}`}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Parameter Sampel Pengujian */}
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sampel Peserta Tes</span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Kelley 27%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={100}
              value={sampleSize}
              onChange={e => {
                const val = parseInt(e.target.value) || 30;
                setSampleSize(Math.max(10, Math.min(100, val)));
              }}
              className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 text-center focus:bg-white focus:border-purple-500 focus:outline-hidden"
            />
            <span className="text-xs font-bold text-gray-700">Siswa di Kelas</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Kel. Atas (NU): <strong>{nUpper}</strong></span>
            <span>Kel. Bawah (NL): <strong>{nLower}</strong></span>
            <span>Tengah: <strong>{sampleSize - nUpper - nLower}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-purple-600" /> Filter:
          </span>

          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition",
              filterStatus === "all"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            Semua ({itemsAnalysis.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("diterima")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1",
              filterStatus === "diterima"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Diterima ({summary.diterimaCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("revisi")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1",
              filterStatus === "revisi"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Perlu Revisi ({summary.revisiCount})</span>
          </button>

          {summary.dibuangCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus("dibuang")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1",
                filterStatus === "dibuang"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              )}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Ditolak ({summary.dibuangCount})</span>
            </button>
          )}

          {/* Difficulty Dropdown filter */}
          <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>

          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value as any)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-hidden focus:border-purple-500"
          >
            <option value="all">Semua Kesukaran</option>
            <option value="terlalu_sulit">Sukar (P &lt; 0.30)</option>
            <option value="sedang">Sedang (0.30 - 0.70)</option>
            <option value="terlalu_mudah">Mudah (P &gt; 0.70)</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" /> Urutkan:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-hidden focus:border-purple-500"
          >
            <option value="number">Nomor Urut Soal</option>
            <option value="p_asc">P-Value Terendah (Paling Sukar)</option>
            <option value="p_desc">P-Value Tertinggi (Paling Mudah)</option>
            <option value="d_desc">Daya Pembeda Tertinggi (Paling Efektif)</option>
            <option value="d_asc">Daya Pembeda Terendah (Perlu Perbaikan)</option>
          </select>
        </div>
      </div>

      {/* Main Content: Item Cards & Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Question Item Cards (8 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {filteredAndSortedItems.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-600">Tidak ada butir soal yang sesuai dengan kriteria filter.</p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterDifficulty("all");
                }}
                className="mt-3 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filteredAndSortedItems.map(item => {
              const isSelected = selectedItem?.questionId === item.questionId;

              return (
                <div
                  key={item.questionId}
                  onClick={() => setSelectedQuestionId(item.questionId)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer bg-white relative",
                    isSelected
                      ? "ring-2 ring-purple-500 border-purple-300 shadow-md bg-purple-50/20"
                      : "border-gray-200 hover:border-purple-200 hover:shadow-xs"
                  )}
                >
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0">
                        {item.qNum}
                      </span>
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        {item.question.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.question.cognitiveLevel || "C3"}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        item.question.difficulty === "mudah" ? "bg-green-100 text-green-700" :
                        item.question.difficulty === "sedang" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        Target: {item.question.difficulty}
                      </span>
                    </div>

                    <div>
                      {renderStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Question Text Preview */}
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-4 leading-relaxed">
                    {item.question.question}
                  </p>

                  {/* Psychometric Scores Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                    {/* P-Value Meter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600">Tingkat Kesukaran (P)</span>
                        <span className="font-mono font-black text-gray-800">{item.pValue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.pCategory === "terlalu_sulit" ? "bg-rose-500" :
                            item.pCategory === "sedang" ? "bg-emerald-500" : "bg-sky-500"
                          )}
                          style={{ width: `${item.pValue * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Sukar (&lt;0.3)</span>
                        <span className="font-bold text-emerald-600">Ideal (0.3-0.7)</span>
                        <span>Mudah (&gt;0.7)</span>
                      </div>
                    </div>

                    {/* D-Index Meter */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-600">Daya Pembeda (D)</span>
                        <span className={cn(
                          "font-mono font-black",
                          item.dIndex >= 0.30 ? "text-emerald-700" :
                          item.dIndex >= 0.20 ? "text-amber-700" : "text-rose-700"
                        )}>
                          {item.dIndex.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        {/* Normalized width from -1 to 1: percent = ((D + 1) / 2) * 100 */}
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.dIndex >= 0.40 ? "bg-emerald-500" :
                            item.dIndex >= 0.30 ? "bg-teal-500" :
                            item.dIndex >= 0.20 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${Math.max(5, Math.min(100, Math.round(((item.dIndex + 1) / 2) * 100)))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="text-rose-500">Negatif</span>
                        <span>Cukup (0.2)</span>
                        <span className="font-bold text-emerald-600">Baik (&ge;0.3)</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Bottom stats and action */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-medium">
                      Kelompok Atas: <strong>{item.bUpper}/{item.nUpper}</strong> benar • Kelompok Bawah: <strong>{item.bLower}/{item.nLower}</strong> benar
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuestionId(item.questionId);
                      }}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      <span>Detail & Uji Coba</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail & Interactive Simulation Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedItem ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sticky top-4 space-y-6">
              {/* Header Inspector */}
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                      {selectedItem.qNum}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">Diagnosis Butir Soal #{selectedItem.qNum}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">{selectedItem.question.type.toUpperCase()} • Level {selectedItem.question.cognitiveLevel || "C3"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  {renderStatusBadge(selectedItem.status)}
                </div>
              </div>

              {/* Full Question Text */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Teks Soal</span>
                <p className="text-xs font-medium text-gray-800 leading-relaxed max-h-36 overflow-y-auto">
                  {selectedItem.question.question}
                </p>
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700">Kunci Jawaban: {selectedItem.question.answer}</span>
                  <span className="text-gray-400 font-normal text-[11px]">Target: {selectedItem.question.difficulty}</span>
                </div>
              </div>

              {/* Psychometric Scores Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 text-center">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block mb-1">
                    Indeks Kesukaran (P)
                  </span>
                  <span className="text-2xl font-black text-purple-900 font-mono block">
                    {selectedItem.pValue.toFixed(2)}
                  </span>
                  <div className="mt-1">
                    {renderPBadge(selectedItem.pValue, selectedItem.pCategory)}
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-center">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide block mb-1">
                    Daya Pembeda (D)
                  </span>
                  <span className="text-2xl font-black text-indigo-900 font-mono block">
                    {selectedItem.dIndex.toFixed(2)}
                  </span>
                  <div className="mt-1">
                    {renderDBadge(selectedItem.dIndex, selectedItem.dCategory)}
                  </div>
                </div>
              </div>

              {/* Pedagogical Recommendation Box */}
              <div className={cn(
                "p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5",
                selectedItem.status === "diterima"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : selectedItem.status === "revisi"
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
              )}>
                <span className="font-black text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Rekomendasi Ahli Evaluasi:
                </span>
                <p className="text-xs opacity-90">
                  {selectedItem.recommendation}
                </p>
              </div>

              {/* Interactive Adjustment Tool */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    Simulasi Nilai Siswa Riil
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomItemData(prev => {
                        const copy = { ...prev };
                        delete copy[selectedItem.questionId];
                        return copy;
                      });
                    }}
                    className="text-[10px] font-bold text-gray-400 hover:text-purple-600 transition"
                  >
                    Reset Nilai
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Geser atau ubah jumlah siswa yang menjawab benar di kelompok atas dan bawah untuk melihat perubahan P dan D secara instan:
                </p>

                {/* Slider: Kelompok Atas (BU) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Benar Kelompok Atas (BU):</span>
                    <span className="text-purple-700 font-mono font-black">{selectedItem.bUpper} / {selectedItem.nUpper} siswa</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selectedItem.nUpper}
                    value={selectedItem.bUpper}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomItemData(prev => ({
                        ...prev,
                        [selectedItem.questionId]: {
                          bUpper: val,
                          bLower: selectedItem.bLower
                        }
                      }));
                    }}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                {/* Slider: Kelompok Bawah (BL) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Benar Kelompok Bawah (BL):</span>
                    <span className="text-indigo-700 font-mono font-black">{selectedItem.bLower} / {selectedItem.nLower} siswa</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={selectedItem.nLower}
                    value={selectedItem.bLower}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomItemData(prev => ({
                        ...prev,
                        [selectedItem.questionId]: {
                          bUpper: selectedItem.bUpper,
                          bLower: val
                        }
                      }));
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Distractor Frequency Analysis for PG */}
              {selectedItem.question.options && selectedItem.question.options.length > 0 && selectedItem.distractorCounts && (
                <div className="space-y-2.5">
                  <h5 className="text-xs font-black text-gray-800 flex items-center justify-between">
                    <span>Efektivitas Pengecoh (Distractor)</span>
                    <span className="text-[10px] font-normal text-gray-400">Minimal 5% Pemilih</span>
                  </h5>

                  <div className="space-y-2">
                    {selectedItem.question.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isKey = selectedItem.question.answer.trim().toUpperCase().startsWith(letter);
                      const counts = selectedItem.distractorCounts?.[letter] || { upper: 0, lower: 0, total: 0 };
                      const pct = Math.round((counts.total / selectedItem.sampleSize) * 100);
                      const isDistractorFunctioning = !isKey && pct >= 5 && counts.lower >= counts.upper;

                      return (
                        <div 
                          key={oIdx}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2",
                            isKey ? "bg-emerald-50/70 border-emerald-200" : "bg-gray-50 border-gray-100"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "w-5 h-5 rounded-md font-bold text-[11px] flex items-center justify-center shrink-0",
                              isKey ? "bg-emerald-600 text-white" : "bg-white border text-gray-700"
                            )}>
                              {letter}
                            </span>
                            <span className="truncate text-gray-700 font-medium text-[11px]" title={opt}>
                              {opt}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono font-bold text-gray-600">
                              {counts.total} siswa ({pct}%)
                            </span>
                            {isKey ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Kunci
                              </span>
                            ) : (
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                isDistractorFunctioning 
                                  ? "text-emerald-700 bg-emerald-100" 
                                  : "text-amber-700 bg-amber-100"
                              )}>
                                {isDistractorFunctioning ? "Efektif" : "Kurang Efektif"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-gray-200">
              <p className="text-xs text-gray-500">Pilih salah satu butir soal untuk memeriksa diagnosis mendalam.</p>
            </div>
          )}
        </div>
      </div>

      {/* Guide & Psychometric Formulas Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Pedoman Teori Tes Klasik (Classical Test Theory)</h3>
                  <p className="text-xs text-gray-500">Standar Evaluasi Pendidikan Kemendikbudristek & BSKAP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formula 1: Tingkat Kesukaran */}
            <div className="space-y-2 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
              <h4 className="text-xs font-black text-purple-900 uppercase tracking-wide">
                1. Indeks Tingkat Kesukaran (P - Difficulty Index)
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Menyatakan proporsi peserta tes yang menjawab butir soal dengan benar. Menggunakan metode kelompok ekstrim (Kelley 27%):
              </p>
              <div className="p-3 bg-white rounded-xl border border-purple-200 font-mono text-xs text-purple-950 font-bold text-center">
                P = (BU + BL) / (NU + NL)
              </div>
              <p className="text-[11px] text-gray-500">
                Di mana <strong>BU</strong> = jumlah siswa kelompok atas yang benar, <strong>BL</strong> = kelompok bawah yang benar, dan <strong>NU + NL</strong> = total siswa dalam sampel uji.
              </p>
              {/* Table Criteria P */}
              <div className="overflow-hidden rounded-xl border border-purple-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-purple-100/70 text-purple-900 font-bold">
                    <tr>
                      <th className="p-2">Rentang Nilai P</th>
                      <th className="p-2">Klasifikasi</th>
                      <th className="p-2">Tindakan Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 bg-white">
                    <tr>
                      <td className="p-2 font-mono font-bold text-rose-700">P &lt; 0.30</td>
                      <td className="p-2 font-bold text-rose-800">Sukar / Terlalu Sulit</td>
                      <td className="p-2 text-gray-600">Periksa bahasa soal atau simplifikasi opsi jawaban</td>
                    </tr>
                    <tr className="bg-emerald-50/30">
                      <td className="p-2 font-mono font-bold text-emerald-700">0.30 &le; P &le; 0.70</td>
                      <td className="p-2 font-bold text-emerald-800">Sedang / Ideal (Direkomendasikan)</td>
                      <td className="p-2 text-gray-600">Sangat baik, simpan langsung ke bank soal</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-sky-700">P &gt; 0.70</td>
                      <td className="p-2 font-bold text-sky-800">Mudah / Terlalu Mudah</td>
                      <td className="p-2 text-gray-600">Tingkatkan kompleksitas stimulus atau pengecoh</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formula 2: Daya Pembeda */}
            <div className="space-y-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wide">
                2. Indeks Daya Pembeda (D - Discrimination Index)
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Kemampuan suatu butir soal dalam membedakan siswa berkemampuan tinggi (pandai) dan siswa berkemampuan rendah:
              </p>
              <div className="p-3 bg-white rounded-xl border border-indigo-200 font-mono text-xs text-indigo-950 font-bold text-center">
                D = (BU / NU) - (BL / NL) = (BU - BL) / n
              </div>
              {/* Table Criteria D */}
              <div className="overflow-hidden rounded-xl border border-indigo-200 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-indigo-100/70 text-indigo-900 font-bold">
                    <tr>
                      <th className="p-2">Rentang Nilai D</th>
                      <th className="p-2">Kualifikasi</th>
                      <th className="p-2">Status Butir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100 bg-white">
                    <tr className="bg-emerald-50/40">
                      <td className="p-2 font-mono font-bold text-emerald-700">D &ge; 0.40</td>
                      <td className="p-2 font-bold text-emerald-800">Sangat Baik (Excellent)</td>
                      <td className="p-2 text-emerald-700 font-bold">Diterima</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">0.30 &le; D &lt; 0.40</td>
                      <td className="p-2 font-bold text-teal-800">Baik (Good)</td>
                      <td className="p-2 text-teal-700 font-bold">Diterima</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-amber-700">0.20 &le; D &lt; 0.30</td>
                      <td className="p-2 font-bold text-amber-800">Cukup (Marginal)</td>
                      <td className="p-2 text-amber-700 font-bold">Perlu Revisi</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-orange-700">0.00 &le; D &lt; 0.20</td>
                      <td className="p-2 font-bold text-orange-800">Buruk (Poor)</td>
                      <td className="p-2 text-rose-700 font-bold">Dibuang / Diganti</td>
                    </tr>
                    <tr className="bg-rose-50/40">
                      <td className="p-2 font-mono font-bold text-rose-700">D &lt; 0.00</td>
                      <td className="p-2 font-bold text-rose-800">Sangat Buruk / Negatif</td>
                      <td className="p-2 text-rose-800 font-black">Kunci Salah / Ditolak</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
