
import FileDropzone from "@/components/file-dropzone";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">

            {/* Header */}
            <header className="w-full border-b bg-white dark:bg-zinc-950 px-8 py-5 flex items-center justify-between sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">LF</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight">Lecture Forge</h1>
                        <p className="text-xs text-muted-foreground font-medium">강의 HTML 스마트 병합 도구</p>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="w-full max-w-5xl mx-auto py-16 px-6 text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-500/20">
                    v2.0 · HTML Merger
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400">
                    여러 HTML 강의 파일을<br />하나로 병합하세요.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    HTML 파일들을 드래그 앤 드롭으로 업로드하면,<br />
                    CSS 충돌 없이 안전하게 하나의 파일로 병합합니다.
                    <br />내비게이션 포함, 단일 파일로 바로 사용 가능!
                </p>
            </section>

            {/* Main Content: Dropzone */}
            <section className="w-full px-6 pb-24">
                <FileDropzone />
            </section>

            {/* Footer */}
            <footer className="w-full text-center py-6 text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
                Lecture Forge · HTML Merger Tool
            </footer>
        </main>
    );
}
