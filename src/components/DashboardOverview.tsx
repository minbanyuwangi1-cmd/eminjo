import React from "react";
import { 
  FileText, 
  Award, 
  Zap, 
  Database, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Play, 
  FileDown, 
  Sparkles, 
  BarChart3, 
  Layers, 
  BookOpen, 
  GraduationCap, 
  CheckCheck,
  MoveVertical,
  ShieldCheck,
  TrendingUp,
  Download
} from "lucide-react";
import { cn } from "../lib/utils";

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
  };
  details: any[];
}

interface DashboardOverviewProps {
  state: {
    curriculum: string;
    guru: string;
    sekolah: string;
    jenjang: string;
    kelas: string;
    mapel: string;
    mapelCustom: string;
    topik: string;
    jenisAsesmen: string;
    opsiJawaban: string;
    shuffleQuestions: boolean;
    counts: Record<string, number>;
    proportions: { mudah: number; sedang: number; sulit: number };
    cognitiveLevels: string[];
  };
  questions: Question[];
  totalSoal: number;
  gradingResult: GradingSummary | null;
  quizAnswers: Record<string, string>;
  quizTimeSpent: number;
  quizSubmitted: boolean;
  onOpenQuestions: () => void;
  onOpenQuiz: () => void;
  onOpenGrade: () => void;
  onOpenAnalysis: () => void;
  onOpenReorder: () => void;
  onOpenPdf: () => void;
  onQuickSampleGrade: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  state,
  questions,
  totalSoal,
  gradingResult,
  quizAnswers,
  quizTimeSpent,
  quizSubmitted,
  onOpenQuestions,
  onOpenQuiz,
  onOpenGrade,
  onOpenAnalysis,
  onOpenReorder,
  onOpenPdf,
  onQuickSampleGrade,
}) => {
  const normalizeDiff = (diff?: string) => (diff || "").toLowerCase().trim();
  const mudahCount = questions.filter(q => normalizeDiff(q.difficulty).includes("mudah")).length;
  const sedangCount = questions.filter(q => normalizeDiff(q.difficulty).includes("sedang")).length;
  const sulitCount = questions.filter(q => normalizeDiff(q.difficulty).includes("sulit")).length;

  const hotsCount = questions.filter(q => 
    normalizeDiff(q.difficulty).includes("sulit") || 
    ["c4", "c5", "c6"].some(c => (q.cognitiveLevel || "").toLowerCase().includes(c))
  ).length;

  const hotsPct = questions.length > 0 
    ? Math.round((hotsCount / questions.length) * 100) 
    : state.proportions.sulit;

  const effectiveMapel = state.mapel === "Lainnya (Ketik Sendiri)" 
    ? (state.mapelCustom || "Mata Pelajaran Kustom") 
    : (state.mapel || "Belum Dipilih");

  // Quiz Stats
  let quizCorrect = 0;
  const quizAnsweredCount = Object.keys(quizAnswers).length;
  questions.forEach(q => {
    const a = quizAnswers[q.id];
    if (a && q.answer.trim().toUpperCase().startsWith(a.toUpperCase())) {
      quizCorrect++;
    }
  });
  const quizPct = questions.length > 0 ? Math.round((quizCorrect / questions.length) * 100) : 0;
  const hasQuizData = quizAnsweredCount > 0 || quizSubmitted;

  // Cognitive counts
  const cognitiveCounts: Record<string, number> = {
    C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0
  };
  questions.forEach(q => {
    const cl = (q.cognitiveLevel || "").toUpperCase();
    if (cl.includes("C1")) cognitiveCounts.C1++;
    else if (cl.includes("C2")) cognitiveCounts.C2++;
    else if (cl.includes("C3")) cognitiveCounts.C3++;
    else if (cl.includes("C4")) cognitiveCounts.C4++;
    else if (cl.includes("C5")) cognitiveCounts.C5++;
    else if (cl.includes("C6")) cognitiveCounts.C6++;
  });

  // Type counts
  const typeCounts = {
    pg: questions.filter(q => q.type === "pg").length,
    isian: questions.filter(q => q.type === "isian").length,
    essay: questions.filter(q => q.type === "essay").length,
    pgKompleks: questions.filter(q => q.type === "pg-kompleks").length,
    bs: questions.filter(q => q.type === "bs").length,
    jodoh: questions.filter(q => q.type === "jodoh").length,
    urutan: questions.filter(q => q.type === "urutan").length,
    tabel: questions.filter(q => q.type === "tabel").length,
    sebabAkibat: questions.filter(q => q.type === "sebab-akibat").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Status Naskah Ujian Aktif */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-lg border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500 text-white tracking-wider">
                {state.jenjang} • Kelas {state.kelas}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/15 text-slate-200 border border-white/20">
                {state.jenisAsesmen}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Kurikulum {state.curriculum.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{effectiveMapel}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              <strong>Topik:</strong> {state.topik || "Belum ditentukan (Isi pada formulir parameter di sebelah kiri)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {questions.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{questions.length} Butir Siap Uji</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Draft (Target: {totalSoal} Butir)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns Analytics (Difficulty & Cognitive) */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Widget 1: Distribusi Tingkat Kesulitan Live */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Distribusi Kesulitan Butir Soal</span>
              </h3>
              <button 
                onClick={onOpenAnalysis} 
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Analisis Lengkap →
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner mb-3">
              <div 
                style={{ width: `${questions.length > 0 ? (mudahCount / questions.length) * 100 : state.proportions.mudah}%` }}
                className="bg-emerald-500 transition-all duration-500" 
                title={`Mudah: ${mudahCount} butir`}
              />
              <div 
                style={{ width: `${questions.length > 0 ? (sedangCount / questions.length) * 100 : state.proportions.sedang}%` }}
                className="bg-amber-500 transition-all duration-500" 
                title={`Sedang: ${sedangCount} butir`}
              />
              <div 
                style={{ width: `${questions.length > 0 ? (sulitCount / questions.length) * 100 : state.proportions.sulit}%` }}
                className="bg-rose-500 transition-all duration-500" 
                title={`Sulit: ${sulitCount} butir`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 block">MUDAH</span>
                <strong className="text-base font-black text-emerald-900 block mt-0.5">
                  {questions.length > 0 ? mudahCount : `${state.proportions.mudah}%`}
                </strong>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {questions.length > 0 ? `${Math.round((mudahCount / questions.length) * 100)}% naskah` : "Target"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 block">SEDANG</span>
                <strong className="text-base font-black text-amber-900 block mt-0.5">
                  {questions.length > 0 ? sedangCount : `${state.proportions.sedang}%`}
                </strong>
                <span className="text-[10px] text-amber-600 font-medium">
                  {questions.length > 0 ? `${Math.round((sedangCount / questions.length) * 100)}% naskah` : "Target"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700 block">SULIT / HOTS</span>
                <strong className="text-base font-black text-rose-900 block mt-0.5">
                  {questions.length > 0 ? sulitCount : `${state.proportions.sulit}%`}
                </strong>
                <span className="text-[10px] text-rose-600 font-medium">
                  {questions.length > 0 ? `${Math.round((sulitCount / questions.length) * 100)}% naskah` : "Target"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Proporsi HOTS Aktual:</span>
            <strong className="text-slate-800 font-bold">{hotsPct}% dari seluruh soal</strong>
          </div>
        </div>

        {/* Widget 2: Taksonomi Kognitif Bloom (C1 - C6) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Level Kognitif Bloom (C1 - C6)</span>
              </h3>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {questions.length > 0 ? `${questions.length} Butir Terpetakan` : "Sesuai Pilihan"}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { level: "C1", name: "Mengingat", count: cognitiveCounts.C1, color: "text-blue-700 bg-blue-50 border-blue-200" },
                { level: "C2", name: "Memahami", count: cognitiveCounts.C2, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
                { level: "C3", name: "Menerapkan", count: cognitiveCounts.C3, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                { level: "C4", name: "Menganalisis", count: cognitiveCounts.C4, color: "text-amber-700 bg-amber-50 border-amber-200" },
                { level: "C5", name: "Mengevaluasi", count: cognitiveCounts.C5, color: "text-rose-700 bg-rose-50 border-rose-200" },
                { level: "C6", name: "Mencipta", count: cognitiveCounts.C6, color: "text-purple-700 bg-purple-50 border-purple-200" },
              ].map(item => (
                <div key={item.level} className={cn("p-2 rounded-xl border text-center transition-all", item.color)}>
                  <div className="font-mono font-black text-xs">{item.level}</div>
                  <div className="text-sm font-black mt-0.5">{questions.length > 0 ? item.count : (state.cognitiveLevels.includes(item.level) ? "✓" : "-")}</div>
                  <div className="text-[9px] truncate opacity-80 mt-0.5">{item.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fokus Dimensi Berpikir:</span>
            <strong className="text-purple-900 font-bold">
              {hotsCount > 0 ? "Tinggi (Higher-Order Thinking)" : "Dasar & Terapan"}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns (Bentuk Soal & Evaluasi Siswa) */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Widget 3: Bentuk Soal Terbentuk */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Komposisi Bentuk Soal</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              Opsi PG: <strong>{state.opsiJawaban} Pilihan</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <span className="text-[10px] font-bold text-blue-700 block uppercase">Pilihan Ganda</span>
              <strong className="text-lg font-black text-blue-950 block mt-0.5">
                {questions.length > 0 ? typeCounts.pg : state.counts.pg}
              </strong>
              <span className="text-[10px] text-blue-600">Butir Soal</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase">Isian Singkat</span>
              <strong className="text-lg font-black text-emerald-950 block mt-0.5">
                {questions.length > 0 ? typeCounts.isian : state.counts.isian}
              </strong>
              <span className="text-[10px] text-emerald-600">Butir Soal</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80">
              <span className="text-[10px] font-bold text-purple-700 block uppercase">Essay / Uraian</span>
              <strong className="text-lg font-black text-purple-950 block mt-0.5">
                {questions.length > 0 ? typeCounts.essay : state.counts.essay}
              </strong>
              <span className="text-[10px] text-purple-600">Butir Soal</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {typeCounts.pgKompleks > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">PG Kompleks: {typeCounts.pgKompleks}</span>}
            {typeCounts.bs > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">Benar/Salah: {typeCounts.bs}</span>}
            {typeCounts.jodoh > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">Menjodohkan: {typeCounts.jodoh}</span>}
            {typeCounts.urutan > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">Mengurutkan: {typeCounts.urutan}</span>}
            {typeCounts.tabel > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">Tabel: {typeCounts.tabel}</span>}
            {typeCounts.sebabAkibat > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold">Sebab-Akibat: {typeCounts.sebabAkibat}</span>}
          </div>
        </div>

        {/* Widget 4: Live Evaluasi Siswa & Auto-Grade Tracker */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Hasil Koreksi Siswa (Live Auto-Grade)</span>
              </h3>
              <button 
                onClick={onOpenGrade}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
              >
                Buka Koreksi →
              </button>
            </div>

            {gradingResult ? (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <strong className="text-sm font-black text-slate-800 block">{gradingResult.studentName}</strong>
                    <span className="text-[11px] text-slate-500">{gradingResult.studentClass || "Kelas Peserta Didik"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-700">{gradingResult.scorePercentage}%</span>
                    <span className="text-[10px] block font-bold uppercase text-emerald-800">
                      Predikat {gradingResult.predicate.grade}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-200/80 text-center text-[11px]">
                  <div>
                    <span className="text-emerald-700 font-bold block">BENAR</span>
                    <strong className="text-emerald-950 font-black">{gradingResult.correctCount}</strong>
                  </div>
                  <div>
                    <span className="text-rose-700 font-bold block">SALAH</span>
                    <strong className="text-rose-950 font-black">{gradingResult.incorrectCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 font-bold block">KOSONG</span>
                    <strong className="text-slate-900 font-black">{gradingResult.unansweredCount}</strong>
                  </div>
                </div>
              </div>
            ) : hasQuizData ? (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <strong className="text-sm font-black text-indigo-950 block">Sesi Kuis CBT Terakhir</strong>
                    <span className="text-[11px] text-indigo-600">{quizAnsweredCount} butir terjawab</span>
                  </div>
                  <span className="text-2xl font-black text-indigo-700">{quizPct}%</span>
                </div>
                <div className="text-[11px] text-indigo-800 flex items-center justify-between mt-2 pt-2 border-t border-indigo-200">
                  <span>Jawaban Benar: <strong>{quizCorrect} / {questions.length}</strong></span>
                  <span>{quizPct >= 75 ? "Tuntas KKM" : "Perlu Latihan"}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Belum ada lembar jawaban siswa yang dikoreksi.
                </p>
                {questions.length > 0 && (
                  <button
                    onClick={onQuickSampleGrade}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 mx-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Uji Koreksi 1-Klik (Data Siswa Nyata)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standar Ketuntasan Minimal:</span>
            <strong className="text-emerald-700 font-bold">KKM 75 Poin</strong>
          </div>
        </div>
      </div>

      {/* Hub Pintasan Aksi Cepat */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-100/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-black text-indigo-950">Pusat Aksi Cepat Naskah</h4>
            <p className="text-[11px] text-indigo-700">Pilih modul kerja yang ingin Anda kelola selanjutnya</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenQuestions}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-900 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bank Soal ({questions.length})</span>
          </button>

          <button
            onClick={onOpenQuiz}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-pink-200 text-pink-900 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-pink-600" />
            <span>Kuis CBT</span>
          </button>

          <button
            onClick={onOpenReorder}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-purple-200 text-purple-900 font-bold text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <MoveVertical className="w-3.5 h-3.5 text-purple-600" />
            <span>Susun Urutan</span>
          </button>

          <button
            onClick={onOpenPdf}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor PDF Resmi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
