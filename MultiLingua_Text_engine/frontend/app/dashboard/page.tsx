"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  FileText,
  Home,
  Languages,
  Loader2,
  Mic,
  StopCircle,
  Upload,
  Volume2
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

type LanguageMap = Record<string, string>;

type TranslateResult = {
  source_lang: string;
  target_lang: string;
  translated_text: string;
};

type AudioOutput = {
  url: string;
  filename: string;
};

type SpeechMetadata = {
  transcript: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
};

type ActiveView = "home" | "textToText" | "textToSpeech" | "speechToSpeech";

const AUTO_SOURCE = "auto";
const DEFAULT_TARGET_LANG = "hi-IN";
const CODECS = ["mp3", "wav", "pcm"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100";
const textareaClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60";

const playgroundItems: Array<{
  key: Exclude<ActiveView, "home">;
  label: string;
  icon: typeof FileText;
  description: string;
}> = [
  {
    key: "textToText",
    label: "Translator",
    description: "Translate and transform written content.",
    icon: FileText
  },
  {
    key: "textToSpeech",
    label: "Text \u2192 Speech",
    description: "Synthesize natural speech from text.",
    icon: Volume2
  },
  {
    key: "speechToSpeech",
    label: "Speech \u2192 Speech",
    description: "Transcribe audio from recording or upload.",
    icon: Mic
  }
];

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;
    if (
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      payload.detail &&
      typeof payload.detail === "object" &&
      "errorMessage" in payload.detail &&
      typeof payload.detail.errorMessage === "string"
    ) {
      return payload.detail.errorMessage;
    }
  } catch {
    // Fallback to status text.
  }

  return `${response.status} ${response.statusText || "Request failed"}`;
}

function decodeBase64Utf8(value: string): string {
  try {
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return value;
  }
}

function decodeHeaderText(value: string | null, encoding: string | null): string {
  if (!value) {
    return "";
  }
  return encoding?.toLowerCase() === "base64" ? decodeBase64Utf8(value) : value;
}

function pickFilename(disposition: string | null, fallback: string): string {
  if (!disposition) {
    return fallback;
  }
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

function languageLabel(code: string, name: string): string {
  return `${name} (${code})`;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function preferredRecordingMimeType(): string | undefined {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) {
    return undefined;
  }
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const [languages, setLanguages] = useState<LanguageMap>({});
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageError, setLanguageError] = useState("");

  const [translateText, setTranslateText] = useState("");
  const [translateSourceLang, setTranslateSourceLang] = useState(AUTO_SOURCE);
  const [translateTargetLang, setTranslateTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [translatePending, setTranslatePending] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const [translateResult, setTranslateResult] = useState<TranslateResult | null>(null);

  const [ttsText, setTtsText] = useState("");
  const [ttsSourceLang, setTtsSourceLang] = useState(AUTO_SOURCE);
  const [ttsTargetLang, setTtsTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [ttsCodec, setTtsCodec] = useState("mp3");
  const [ttsPending, setTtsPending] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [ttsAudio, setTtsAudio] = useState<AudioOutput | null>(null);

  const [speechSourceLang, setSpeechSourceLang] = useState(AUTO_SOURCE);
  const [speechTargetLang, setSpeechTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [speechCodec, setSpeechCodec] = useState("mp3");
  const [speechPending, setSpeechPending] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [speechAudio, setSpeechAudio] = useState<AudioOutput | null>(null);
  const [speechMetadata, setSpeechMetadata] = useState<SpeechMetadata | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const languageEntries = useMemo(
    () => Object.entries(languages).sort((a, b) => a[1].localeCompare(b[1])),
    [languages]
  );
  const languagesReady = languageEntries.length > 0;

  const showSuccess = (message: string) => setToast({ id: Date.now(), message });

  useEffect(() => {
    void loadLanguages();
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 3400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }
    const intervalId = window.setInterval(
      () => setRecordingSeconds((previous) => previous + 1),
      1000
    );
    return () => window.clearInterval(intervalId);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (ttsAudio) {
        URL.revokeObjectURL(ttsAudio.url);
      }
      if (speechAudio) {
        URL.revokeObjectURL(speechAudio.url);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [ttsAudio, speechAudio]);

  async function loadLanguages() {
    setLanguageLoading(true);
    setLanguageError("");
    try {
      const response = await fetch("/api/languages", { method: "GET", cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const payload = (await response.json()) as LanguageMap;
      const codes = Object.keys(payload);
      setLanguages(payload);

      const fallback =
        payload[DEFAULT_TARGET_LANG] !== undefined ? DEFAULT_TARGET_LANG : codes[0] || "";
      if (fallback) {
        setTranslateTargetLang((current) => (payload[current] ? current : fallback));
        setTtsTargetLang((current) => (payload[current] ? current : fallback));
        setSpeechTargetLang((current) => (payload[current] ? current : fallback));
      }
    } catch (error) {
      setLanguageError(
        error instanceof Error ? error.message : "Unable to load language options right now."
      );
    } finally {
      setLanguageLoading(false);
    }
  }

  async function handleTranslateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTranslatePending(true);
    setTranslateError("");
    setTranslateResult(null);
    try {
      if (!translateText.trim()) {
        throw new Error("Text input is required.");
      }
      const payload: Record<string, unknown> = {
        text: translateText.trim(),
        target_lang: translateTargetLang
      };
      if (translateSourceLang !== AUTO_SOURCE) {
        payload.source_lang = translateSourceLang;
      }

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setTranslateResult((await response.json()) as TranslateResult);
      showSuccess("Success: Translation completed successfully");
    } catch (error) {
      setTranslateError(error instanceof Error ? error.message : "Translation request failed.");
    } finally {
      setTranslatePending(false);
    }
  }

  async function handleTtsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTtsPending(true);
    setTtsError("");
    try {
      if (!ttsText.trim()) {
        throw new Error("Text input is required.");
      }
      const payload: Record<string, unknown> = {
        text: ttsText.trim(),
        target_lang: ttsTargetLang,
        output_audio_codec: ttsCodec
      };
      if (ttsSourceLang !== AUTO_SOURCE) {
        payload.source_lang = ttsSourceLang;
      }

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const blob = await response.blob();
      const nextAudio = {
        url: URL.createObjectURL(blob),
        filename: pickFilename(response.headers.get("content-disposition"), `tts.${ttsCodec}`)
      };
      setTtsAudio((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.url);
        }
        return nextAudio;
      });
      showSuccess("Success: Speech generated successfully");
    } catch (error) {
      setTtsError(error instanceof Error ? error.message : "Text-to-speech request failed.");
    } finally {
      setTtsPending(false);
    }
  }

  async function processSpeechFile(file: File) {
    setSpeechPending(true);
    setSpeechError("");
    setSpeechMetadata(null);
    try {
      const body = new FormData();
      body.append("file", file, file.name);
      body.append(
        "language_hint",
        speechSourceLang === AUTO_SOURCE ? "unknown" : speechSourceLang
      );
      body.append("target_lang", speechTargetLang);
      body.append("output_audio_codec", speechCodec);

      const response = await fetch("/api/speech", { method: "POST", body });
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const blob = await response.blob();
      const nextAudio = {
        url: URL.createObjectURL(blob),
        filename: pickFilename(response.headers.get("content-disposition"), `speech.${speechCodec}`)
      };
      setSpeechAudio((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.url);
        }
        return nextAudio;
      });

      setSpeechMetadata({
        transcript:
          decodeHeaderText(
            response.headers.get("x-transcript"),
            response.headers.get("x-transcript-encoding")
          ) || "No transcript available.",
        translatedText:
          decodeHeaderText(
            response.headers.get("x-translated-text"),
            response.headers.get("x-translated-text-encoding")
          ) || "No translated text available.",
        sourceLang: response.headers.get("x-source-lang") || "unknown",
        targetLang: response.headers.get("x-target-lang") || speechTargetLang
      });
      showSuccess("Success: Transcription completed successfully");
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : "Speech transcription failed.");
    } finally {
      setSpeechPending(false);
    }
  }

  async function handleStartSpeaking() {
    if (isRecording || speechPending) {
      return;
    }
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSpeechError("Live recording is not supported in this browser.");
      return;
    }
    setSpeechError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredRecordingMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        setSpeechError("Recording failed. Please try again.");
        setIsRecording(false);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setIsRecording(false);

        const recordingBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        if (!recordingBlob.size) {
          setSpeechError("No audio captured. Please try again.");
          return;
        }

        const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
        const recordedFile = new File([recordingBlob], `recording.${extension}`, {
          type: recordingBlob.type
        });
        void processSpeechFile(recordedFile);
      };

      recorder.start(250);
      setRecordingSeconds(0);
      setIsRecording(true);
      setSpeechMetadata(null);
    } catch (error) {
      setSpeechError(
        error instanceof Error ? error.message : "Microphone access was not granted."
      );
    }
  }

  function handleStopSpeaking() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }

  function handleUploadButtonClick() {
    uploadInputRef.current?.click();
  }

  function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void processSpeechFile(file);
    event.target.value = "";
  }

  return (
    <main className="relative min-h-screen">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg sm:right-6 sm:top-6"
          >
            <CheckCircle2 size={18} className="text-emerald-600" />
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex h-screen w-full flex-col gap-0 lg:flex-row"
      >
        <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-5 shadow-[2px_0_12px_rgba(15,23,42,0.06)] lg:h-screen lg:w-[268px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-sm">
              <Languages size={19} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-slate-800">MultiLingua</p>
              <p className="text-xs text-slate-400">Speech Engine</p>
            </div>
          </div>

          <nav className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => setActiveView("home")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                activeView === "home"
                  ? "bg-sky-50 text-sky-600 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Home size={17} />
              Home (Dashboard)
            </button>

            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Playground
              </p>
              <div className="mt-2 space-y-2">
                {playgroundItems.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveView(key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                      activeView === key
                        ? "bg-sky-50 text-sky-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div className="mt-8 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-sky-700">
            {languageLoading
              ? "Preparing language options..."
              : `${languageEntries.length} languages available.`}
          </div>
        </aside>

        <section className="flex-1 overflow-y-auto bg-slate-50/70">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full p-6 pt-10 sm:p-10 sm:pt-14"
            >
              {activeView === "home" ? (
                <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
                  <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
                    Welcome to the MultiLingua Dashboard
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
                    Choose a model from the Playground to translate text, generate speech,
                    or transcribe audio with a modern AI workflow.
                  </p>

                  <div className="mt-12 grid w-full max-w-4xl gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {playgroundItems.map(({ key, label, description, icon: Icon }) => (
                      <motion.button
                        key={key}
                        type="button"
                        whileHover={{ y: -5 }}
                        onClick={() => setActiveView(key)}
                        className="rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
                      >
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                          <Icon size={22} />
                        </div>
                        <p className="mt-5 text-lg font-bold tracking-tight text-slate-900">
                          {label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                          {description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeView === "textToText" ? (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-5">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      Text {"\u2192"} Text
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Translate written content between languages.
                    </p>
                  </div>

                  <form onSubmit={handleTranslateSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Input Text</label>
                      <textarea
                        value={translateText}
                        onChange={(event) => setTranslateText(event.target.value)}
                        rows={7}
                        placeholder="Type text to translate..."
                        className={textareaClass}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Source Language</label>
                        <select
                          value={translateSourceLang}
                          onChange={(event) => setTranslateSourceLang(event.target.value)}
                          disabled={!languagesReady}
                          className={inputClass}
                        >
                          <option value={AUTO_SOURCE}>Auto Detect</option>
                          {languageEntries.map(([code, name]) => (
                            <option key={`translate-source-${code}`} value={code}>
                              {languageLabel(code, name)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Target Language</label>
                        <select
                          value={translateTargetLang}
                          onChange={(event) => setTranslateTargetLang(event.target.value)}
                          disabled={!languagesReady}
                          className={inputClass}
                        >
                          {languageEntries.map(([code, name]) => (
                            <option key={`translate-target-${code}`} value={code}>
                              {languageLabel(code, name)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={translatePending || !languagesReady} className={primaryButtonClass}>
                      {translatePending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Translating...
                        </>
                      ) : (
                        "Translate Text"
                      )}
                    </button>
                  </form>

                  {translateError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {translateError}
                    </p>
                  ) : null}
                  {translateResult ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Translation Result
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-800">
                        {translateResult.translated_text}
                      </p>
                      <p className="mt-4 text-xs text-slate-500">
                        Source: {translateResult.source_lang} | Target: {translateResult.target_lang}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeView === "textToSpeech" ? (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-5">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      Text {"\u2192"} Speech
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Generate high-quality audio with language controls.
                    </p>
                  </div>

                  <form onSubmit={handleTtsSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Input Text</label>
                      <textarea
                        value={ttsText}
                        onChange={(event) => setTtsText(event.target.value)}
                        rows={7}
                        placeholder="Type text to synthesize..."
                        className={textareaClass}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Source Language</label>
                        <select
                          value={ttsSourceLang}
                          onChange={(event) => setTtsSourceLang(event.target.value)}
                          disabled={!languagesReady}
                          className={inputClass}
                        >
                          <option value={AUTO_SOURCE}>Auto Detect</option>
                          {languageEntries.map(([code, name]) => (
                            <option key={`tts-source-${code}`} value={code}>
                              {languageLabel(code, name)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Target Language</label>
                        <select
                          value={ttsTargetLang}
                          onChange={(event) => setTtsTargetLang(event.target.value)}
                          disabled={!languagesReady}
                          className={inputClass}
                        >
                          {languageEntries.map(([code, name]) => (
                            <option key={`tts-target-${code}`} value={code}>
                              {languageLabel(code, name)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Audio Codec</label>
                        <select
                          value={ttsCodec}
                          onChange={(event) => setTtsCodec(event.target.value)}
                          className={inputClass}
                        >
                          {CODECS.map((codec) => (
                            <option key={`tts-codec-${codec}`} value={codec}>
                              {codec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={ttsPending || !languagesReady} className={primaryButtonClass}>
                      {ttsPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating Speech...
                        </>
                      ) : (
                        "Generate Speech"
                      )}
                    </button>
                  </form>

                  {ttsError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {ttsError}
                    </p>
                  ) : null}
                  {ttsAudio ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Generated Audio
                      </p>
                      <audio controls src={ttsAudio.url} className="mt-4 w-full" />
                      <a
                        href={ttsAudio.url}
                        download={ttsAudio.filename}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Download className="h-4 w-4" />
                        Download Audio
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeView === "speechToSpeech" ? (
                <div className="space-y-6">
                  <div className="border-b border-slate-200 pb-5">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                      Speech {"\u2192"} Speech
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                      Record live or upload audio to transcribe and translate in multiple languages.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Source Language</label>
                      <select
                        value={speechSourceLang}
                        onChange={(event) => setSpeechSourceLang(event.target.value)}
                        disabled={!languagesReady || isRecording || speechPending}
                        className={inputClass}
                      >
                        <option value={AUTO_SOURCE}>Auto Detect</option>
                        {languageEntries.map(([code, name]) => (
                          <option key={`speech-source-${code}`} value={code}>
                            {languageLabel(code, name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Target Language</label>
                      <select
                        value={speechTargetLang}
                        onChange={(event) => setSpeechTargetLang(event.target.value)}
                        disabled={!languagesReady || isRecording || speechPending}
                        className={inputClass}
                      >
                        {languageEntries.map(([code, name]) => (
                          <option key={`speech-target-${code}`} value={code}>
                            {languageLabel(code, name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Audio Codec</label>
                      <select
                        value={speechCodec}
                        onChange={(event) => setSpeechCodec(event.target.value)}
                        disabled={isRecording || speechPending}
                        className={inputClass}
                      >
                        {CODECS.map((codec) => (
                          <option key={`speech-codec-${codec}`} value={codec}>
                            {codec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleStartSpeaking}
                      disabled={isRecording || speechPending || !languagesReady}
                      className={primaryButtonClass}
                    >
                      <Mic size={16} />
                      {"\u{1F399} Start Speaking"}
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadButtonClick}
                      disabled={isRecording || speechPending || !languagesReady}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload size={16} />
                      {"\u{1F4C1} Upload Audio"}
                    </button>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleUploadChange}
                    />
                  </div>

                  {isRecording ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="recording-pulse flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white">
                            <Mic size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-rose-700">Recording live audio</p>
                            <p className="text-sm text-rose-600">Recording: {formatDuration(recordingSeconds)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStopSpeaking}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          <StopCircle size={16} />
                          Stop
                        </button>
                      </div>

                      <div className="mt-5 flex h-12 items-end gap-2">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <span
                            key={`wave-${index}`}
                            className="wave-bar h-4 w-1.5 rounded-full bg-rose-400"
                            style={{ animationDelay: `${index * 0.08}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {speechPending ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700">
                      <Loader2 size={16} className="animate-spin" />
                      Processing audio...
                    </div>
                  ) : null}
                  {speechError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {speechError}
                    </p>
                  ) : null}
                  {speechMetadata ? (
                    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          Transcript
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {speechMetadata.transcript}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          Translated Text
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                          {speechMetadata.translatedText}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        Source: {speechMetadata.sourceLang} | Target: {speechMetadata.targetLang}
                      </p>
                      {speechAudio ? (
                        <>
                          <audio controls src={speechAudio.url} className="w-full" />
                          <a
                            href={speechAudio.url}
                            download={speechAudio.filename}
                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <Download className="h-4 w-4" />
                            Download Audio
                          </a>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {languageError ? (
                <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {languageError}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </section>
      </motion.div>
    </main>
  );
}
