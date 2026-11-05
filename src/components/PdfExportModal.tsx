import React, { useState, useRef } from "react";
import { 
  Download, 
  Printer, 
  X, 
  FileText, 
  Settings2, 
  Check, 
  Eye, 
  Loader2, 
  Sparkles,
  Calendar,
  Clock,
  School,
  FileCheck2,
  BookOpen,
  HelpCircle,
  Columns,
  List,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MoveVertical
} from "lucide-react";
import { cn } from "../lib/utils";
import html2pdf from "html2pdf.js";

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

interface HeaderSettings {
  instansi: string;
  sekolah: string;
  alamat: string;
  telp: string;
  email: string;
  logo: string;
}

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onReorderQuestions?: (newQuestions: Question[]) => void;
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
  };
  headerSettings: HeaderSettings;
}

export function PdfExportModal({
  isOpen,
  onClose,
  questions,
  onReorderQuestions,
  state,
  headerSettings
}: PdfExportModalProps) {
  // Reorder state inside modal
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showReorderSection, setShowReorderSection] = useState(false);

  const handleMoveQuestionInModal = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= questions.length || toIdx >= questions.length) return;
    const copy = [...questions];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    onReorderQuestions?.(copy);
  };

  // Form & Export Options
  const [includeKop, setIncludeKop] = useState(true);
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [includeStudentIdentity, setIncludeStudentIdentity] = useState(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(false);
  const [fontSize, setFontSize] = useState<"compact" | "normal" | "large">("normal");
  const [columnsLayout, setColumnsLayout] = useState<"1" | "2">("1");

  // Metadata overrides for the exam paper
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const [examDate, setExamDate] = useState(todayFormatted);
  const [duration, setDuration] = useState("90 Menit");
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("Ganjil");
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const printPaperRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const subjectName = state.mapelCustom || state.mapel || "Mata Pelajaran";
  const assessmentTitle = state.jenisAsesmen ? state.jenisAsesmen.toUpperCase() : "ASESMEN SUMATIF";

  const handleDownloadPdf = async () => {
    if (!printPaperRef.current) return;
    setIsGenerating(true);
    setGenerationProgress("Menyiapkan tata letak A4...");

    try {
      const element = printPaperRef.current;
      const cleanFileName = `Naskah_Soal_${subjectName.replace(/[^a-zA-Z0-9]/g, "_")}_Kelas_${state.kelas}_${(state.topik || "Ujian").slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      setGenerationProgress("Mengonversi naskah ke PDF resolusi tinggi...");

      const opt = {
        margin: [10, 12, 10, 12] as [number, number, number, number],
        filename: cleanFileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        },
        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
          avoid: [".pdf-avoid-break"]
        }
      };

      // @ts-ignore
      const exporter = (html2pdf.default || html2pdf)();
      await exporter.set(opt).from(element).save();

      setGenerationProgress("Selesai!");
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress("");
      }, 800);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Gagal membuat PDF. Anda dapat menggunakan tombol 'Cetak Langsung' sebagai alternatif.");
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  // Group questions by type if needed or keep sequence
  const pgQuestions = questions.filter(q => q.type.toLowerCase().includes("pilihan ganda") || q.type.toLowerCase().includes("pg"));
  const nonPgQuestions = questions.filter(q => !q.type.toLowerCase().includes("pilihan ganda") && !q.type.toLowerCase().includes("pg"));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Download className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Ekspor Naskah Soal Ujian (PDF)
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-100 border border-indigo-400/30">
                  Format Standar Sekolah
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                Dokumen siap cetak dengan Kop Surat resmi, tabel identitas, dan tata letak A4 profesional.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls, Right Live Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Controls Sidebar (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-gray-50 border-r border-gray-200 overflow-y-auto space-y-5">
            
            {/* Quick Actions Card */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating || questions.length === 0}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{generationProgress || "Sedang Memproses PDF..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh PDF Naskah Soal ({questions.length} Butir)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDirectPrint}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                <span>Cetak Lembar Soal (Print Langsung)</span>
              </button>
            </div>

            {/* Question Reordering Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <MoveVertical className="w-3.5 h-3.5 text-indigo-600" />
                  Urutan Soal ({questions.length} Butir)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReorderSection(!showReorderSection)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  {showReorderSection ? "Tutup" : "Atur / Drag & Drop"}
                </button>
              </div>
              
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Tahan & geser baris soal di bawah untuk mengubah nomor urutan naskah secara instan.
              </p>

              {showReorderSection && (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs divide-y divide-gray-100">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", idx.toString());
                        setDraggedIdx(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverIdx !== idx) setDragOverIdx(idx);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIdx !== null && draggedIdx !== idx) {
                          handleMoveQuestionInModal(draggedIdx, idx);
                        }
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      className={cn(
                        "pt-2 pb-1.5 px-2 rounded-xl flex items-center gap-2 bg-gray-50/70 hover:bg-gray-100/80 transition-all select-none border border-transparent",
                        draggedIdx === idx && "opacity-40 border-dashed border-indigo-400 bg-indigo-50",
                        dragOverIdx === idx && draggedIdx !== idx && "ring-2 ring-indigo-500 bg-indigo-100/60"
                      )}
                    >
                      <div 
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-600 p-0.5"
                        title="Geser posisi soal"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-gray-700 truncate">
                          {q.question}
                        </p>
                        <span className="text-[9px] text-gray-400 uppercase font-semibold">
                          {q.type} • {q.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 bg-white border border-gray-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestionInModal(idx, idx - 1)}
                          className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-25 transition"
                          title="Pindah ke atas"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveQuestionInModal(idx, idx + 1)}
                          className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-25 transition"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Layout & Font Options */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
                Tata Letak & Ukuran Huruf
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-600 block">Ukuran Font Soal</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "compact", label: "Kompak (10pt)" },
                    { id: "normal", label: "Standar (11pt)" },
                    { id: "large", label: "Besar (12pt)" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFontSize(f.id as any)}
                      className={cn(
                        "py-1.5 px-2 text-xs font-bold rounded-lg border transition text-center",
                        fontSize === f.id
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-[11px] font-bold text-gray-600 block">Kolom Pilihan Ganda</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setColumnsLayout("1")}
                    className={cn(
                      "py-1.5 px-2 text-xs font-bold rounded-lg border transition flex items-center justify-center gap-1.5",
                      columnsLayout === "1"
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <List className="w-3.5 h-3.5" /> 1 Kolom (Penuh)
                  </button>
                  <button
                    onClick={() => setColumnsLayout("2")}
                    className={cn(
                      "py-1.5 px-2 text-xs font-bold rounded-lg border transition flex items-center justify-center gap-1.5",
                      columnsLayout === "2"
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Columns className="w-3.5 h-3.5" /> 2 Kolom (Hemat Kertas)
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist of Components to Include */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                Komponen Dokumen
              </h3>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeKop}
                    onChange={e => setIncludeKop(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-gray-700 block">Kop Surat Sekolah Resmi</span>
                    <span className="text-[11px] text-gray-400">Logo, nama instansi, alamat, & garis kop</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStudentIdentity}
                    onChange={e => setIncludeStudentIdentity(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-gray-700 block">Kolom Identitas Siswa</span>
                    <span className="text-[11px] text-gray-400">Nama, nomor ujian/absen, kelas, & tanda tangan</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInstructions}
                    onChange={e => setIncludeInstructions(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-gray-700 block">Petunjuk Umum Ujian</span>
                    <span className="text-[11px] text-gray-400">Panduan pengerjaan standar bagi siswa</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer bg-emerald-50/50 border border-emerald-100">
                  <input
                    type="checkbox"
                    checked={includeAnswerKey}
                    onChange={e => setIncludeAnswerKey(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-800 block">Lembar Kunci & Pembahasan</span>
                    <span className="text-[11px] text-emerald-600">Dicetak di halaman terpisah (khusus guru)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer bg-amber-50/50 border border-amber-100">
                  <input
                    type="checkbox"
                    checked={includeAnswerSheet}
                    onChange={e => setIncludeAnswerSheet(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-amber-800 block">Lembar Jawaban Siswa (LJK/Manual)</span>
                    <span className="text-[11px] text-amber-600">Kisi bulatan jawaban A/B/C/D & kolom isian</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Editable Exam Details */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Info Jadwal & Pelaksanaan
              </h3>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Hari, Tanggal Ujian</label>
                  <input
                    type="text"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    placeholder="Contoh: Senin, 17 November 2025"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">Alokasi Waktu</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="90 Menit"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">Tahun Ajaran</label>
                    <input
                      type="text"
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                      placeholder="2024/2025"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    placeholder="Ganjil / Genap"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Live Preview Area (8 cols) */}
          <div className="lg:col-span-8 p-4 md:p-6 bg-gray-200/80 overflow-y-auto flex flex-col items-center">
            
            {/* Visual Instruction Banner */}
            <div className="w-full max-w-[210mm] mb-3 flex items-center justify-between text-xs text-gray-600 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-gray-300 shadow-xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Eye className="w-4 h-4 text-indigo-600" /> Pratinjau Naskah Cetak A4 (Live Preview)
              </span>
              <span className="text-[11px] text-gray-500">
                Otomatis dioptimalkan untuk kertas A4 80gr & hemat tinta
              </span>
            </div>

            {/* Simulated Paper (A4 aspect) */}
            <div 
              ref={printPaperRef}
              id="exam-printable-paper"
              className={cn(
                "bg-white text-gray-900 w-full max-w-[210mm] p-8 md:p-10 shadow-xl border border-gray-300 rounded-sm font-serif",
                fontSize === "compact" ? "text-[12px] leading-relaxed" :
                fontSize === "large" ? "text-[15px] leading-relaxed" :
                "text-[13px] leading-relaxed"
              )}
              style={{ minHeight: "297mm", backgroundColor: "#ffffff", color: "#111827" }}
            >

              {/* KOP SURAT RESMI */}
              {includeKop && (
                <div className="mb-4 pdf-avoid-break">
                  <div className="flex items-center justify-between gap-4 pb-2">
                    {/* Logo Sekolah */}
                    {headerSettings.logo && (
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                        <img 
                          src={headerSettings.logo} 
                          alt="Logo Sekolah" 
                          className="max-h-20 max-w-20 object-contain"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            // Fallback if CORS or broken image
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Teks Kop */}
                    <div className="flex-1 text-center font-sans">
                      <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-gray-700">
                        {headerSettings.instansi || "YAYASAN PEMBINA PENDIDIKAN"}
                      </h4>
                      <h2 className="text-base md:text-xl font-black uppercase text-gray-900 tracking-tight mt-0.5">
                        {headerSettings.sekolah || state.sekolah || "SEKOLAH DASAR / MENENGAH"}
                      </h2>
                      <p className="text-[10px] md:text-[11px] text-gray-600 mt-1 leading-tight">
                        {headerSettings.alamat || "Jl. Pendidikan No. 123"}
                        {headerSettings.telp ? ` • Telp: ${headerSettings.telp}` : ""}
                        {headerSettings.email ? ` • Email: ${headerSettings.email}` : ""}
                      </p>
                    </div>

                    {/* Placeholder space balance if logo exists */}
                    {headerSettings.logo && <div className="w-20 hidden md:block" />}
                  </div>

                  {/* Garis Ganda Kop Surat Resmi */}
                  <div className="border-t-2 border-gray-900 mt-1"></div>
                  <div className="border-t border-gray-900 mt-[1.5px]"></div>
                </div>
              )}

              {/* JUDUL NASKAH ASESMEN */}
              <div className="text-center font-sans mb-4 pdf-avoid-break">
                <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wide text-gray-900">
                  NASKAH SOAL {assessmentTitle}
                </h3>
                <p className="text-[11px] font-bold text-gray-700 uppercase">
                  TAHUN PELAJARAN {academicYear} • SEMESTER {semester.toUpperCase()}
                </p>
              </div>

              {/* TABEL KETERANGAN UJIAN & IDENTITAS SISWA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 font-sans text-[11px] pdf-avoid-break">
                
                {/* Meta Ujian */}
                <div className="border border-gray-400 p-2.5 rounded-sm space-y-1">
                  <div className="flex justify-between py-0.5 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold w-28">Mata Pelajaran</span>
                    <span className="font-bold text-gray-900 flex-1">: {subjectName}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold w-28">Kelas / Jenjang</span>
                    <span className="font-bold text-gray-900 flex-1">: Kelas {state.kelas} ({state.jenjang})</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-gray-200">
                    <span className="text-gray-600 font-semibold w-28">Hari, Tanggal</span>
                    <span className="font-medium text-gray-900 flex-1">: {examDate}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-600 font-semibold w-28">Alokasi Waktu</span>
                    <span className="font-bold text-gray-900 flex-1">: {duration}</span>
                  </div>
                </div>

                {/* Identitas Siswa Box */}
                {includeStudentIdentity ? (
                  <div className="border border-gray-400 p-2.5 rounded-sm space-y-1 bg-gray-50/50">
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600 font-semibold w-28">Nama Peserta</span>
                      <span className="text-gray-400 flex-1">: .................................................</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600 font-semibold w-28">Nomor Peserta</span>
                      <span className="text-gray-400 flex-1">: .................................................</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-200">
                      <span className="text-gray-600 font-semibold w-28">Ruang / Kelas</span>
                      <span className="text-gray-400 flex-1">: .................................................</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-600 font-semibold w-28">Tanda Tangan</span>
                      <span className="text-gray-400 flex-1">: .................................................</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-400 p-2.5 rounded-sm flex flex-col justify-center text-center">
                    <span className="text-gray-500 font-bold">Topik / Lingkup Materi:</span>
                    <span className="font-bold text-gray-800 text-xs mt-1">{state.topik || "Penilaian Berkala"}</span>
                    {state.guru && <span className="text-[10px] text-gray-500 mt-1">Guru Pengampu: {state.guru}</span>}
                  </div>
                )}
              </div>

              {/* PETUNJUK UMUM */}
              {includeInstructions && (
                <div className="mb-5 p-3 border border-gray-300 bg-gray-50 rounded-sm font-sans text-[11px] pdf-avoid-break">
                  <span className="font-black text-gray-900 uppercase block mb-1">Petunjuk Umum:</span>
                  <ol className="list-decimal pl-4 space-y-0.5 text-gray-700">
                    <li>Berdoalah sebelum mengerjakan soal sesuai keyakinan masing-masing.</li>
                    <li>Tulislah identitas dan nomor peserta Anda secara lengkap dan benar.</li>
                    <li>Periksa dan bacalah setiap butir soal dengan saksama sebelum memberikan jawaban.</li>
                    <li>Dahulukan menjawab soal-soal yang Anda anggap paling mudah.</li>
                    <li>Laporkan kepada pengawas jika terdapat tulisan yang buram atau halaman yang rusak.</li>
                    <li>Periksalah kembali seluruh lembar jawaban sebelum diserahkan kepada pengawas.</li>
                  </ol>
                </div>
              )}

              {/* DAFTAR BUTIR SOAL */}
              <div className="space-y-4">
                <div className="border-b-2 border-gray-800 pb-1 font-sans font-black text-xs uppercase tracking-wider text-gray-800 flex justify-between items-center pdf-avoid-break">
                  <span>Daftar Butir Soal</span>
                  <span className="text-[10px] font-bold text-gray-500">Jumlah: {questions.length} Soal</span>
                </div>

                {questions.map((q, idx) => {
                  const qNum = idx + 1;
                  return (
                    <div 
                      key={q.id} 
                      className="pdf-avoid-break pb-3 border-b border-gray-100 last:border-b-0"
                    >
                      {/* Nomor & Teks Soal */}
                      <div className="flex items-start gap-2.5">
                        <span className="font-bold text-gray-900 shrink-0 font-sans w-5 text-right">
                          {qNum}.
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-900 leading-relaxed font-serif">
                            {q.question}
                          </p>

                          {/* Pilihan Jawaban (Untuk Pilihan Ganda) */}
                          {q.options && q.options.length > 0 && (
                            <div className={cn(
                              "mt-2 gap-x-4 gap-y-1.5 font-sans",
                              columnsLayout === "2" ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-1"
                            )}>
                              {q.options.map((opt, optIdx) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                return (
                                  <div key={optIdx} className="flex items-start gap-2 text-[12px] text-gray-800">
                                    <span className="font-bold shrink-0">{letter}.</span>
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Blank answer line for Essay / Isian */}
                          {(!q.options || q.options.length === 0) && (
                            <div className="mt-3 font-sans">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Lembar Jawaban:
                              </span>
                              <div className="border-b border-dashed border-gray-400 h-6 w-full"></div>
                              <div className="border-b border-dashed border-gray-400 h-6 w-full mt-2"></div>
                              {q.type.toLowerCase().includes("essay") && (
                                <div className="border-b border-dashed border-gray-400 h-6 w-full mt-2"></div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HALAMAN TAMBAHAN: LEMBAR JAWABAN SISWA (LJK) JIKA AKTIF */}
              {includeAnswerSheet && (
                <div className="pdf-page-break mt-10 pt-8 border-t-2 border-gray-800 font-sans">
                  <div className="text-center mb-6">
                    <h3 className="font-black text-sm uppercase">LEMBAR JAWABAN SISWA (LJK)</h3>
                    <p className="text-xs text-gray-600">{subjectName} • Kelas {state.kelas} • {state.sekolah}</p>
                  </div>

                  <div className="border border-gray-400 p-3 mb-6 grid grid-cols-2 gap-2 text-xs">
                    <div>Nama: ........................................................</div>
                    <div>No. Peserta: .........................................</div>
                    <div>Kelas: .......................................................</div>
                    <div>Tanggal: .............................................</div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold text-xs uppercase mb-2">Pilihan Ganda</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-xs">
                      {questions.map((_, i) => (
                        <div key={i} className="flex items-center gap-1 p-1 border border-gray-200 rounded">
                          <span className="w-5 font-bold text-right">{i + 1}.</span>
                          <span className="tracking-widest font-mono text-[11px]">[A] [B] [C] [D]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* HALAMAN TAMBAHAN: KUNCI JAWABAN & PEMBAHASAN JIKA AKTIF */}
              {includeAnswerKey && (
                <div className="pdf-page-break mt-10 pt-8 border-t-2 border-gray-800 font-sans">
                  <div className="text-center mb-6">
                    <span className="px-3 py-1 bg-gray-900 text-white font-black text-xs uppercase tracking-wider rounded">
                      DOKUMEN RAHASIA GURU
                    </span>
                    <h3 className="font-black text-base uppercase text-gray-900 mt-2">
                      KUNCI JAWABAN & PEMBAHASAN SOAL
                    </h3>
                    <p className="text-xs text-gray-600">{subjectName} • Kelas {state.kelas} • {state.topik}</p>
                  </div>

                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="pdf-avoid-break p-3 border border-gray-300 rounded bg-gray-50/50 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-gray-800">Soal No. {idx + 1}</span>
                          <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            Kunci: {q.answer}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium mb-1 line-clamp-2 italic">"{q.question}"</p>
                        {q.explanation && (
                          <div className="mt-1 text-[11px] text-gray-600 bg-white p-2 rounded border border-gray-200">
                            <strong>Pembahasan:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Paper */}
              <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-400 font-sans pdf-avoid-break">
                <span>Dihasilkan secara otomatis oleh BantuGuru Soal Generator</span>
                <span>Halaman Naskah Ujian Resmi • {academicYear}</span>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Dokumen diformat khusus A4 dengan page break cerdas agar tidak terpotong sembarangan.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating || questions.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download PDF ({questions.length} Butir)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
