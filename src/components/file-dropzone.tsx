
'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Download, ExternalLink, GripVertical, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { smartMergeFiles, MergedPage, generateMergedHtml } from '@/lib/smart-merger';

export default function FileDropzone() {
    const [files, setFiles] = useState<File[]>([]);
    const [mergedPages, setMergedPages] = useState<MergedPage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [mergedUrl, setMergedUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (newFiles: File[]) => {
        const htmlFiles = newFiles.filter(f =>
            f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
        );
        setFiles(prev => [...prev, ...htmlFiles]);
        setMergedUrl(null);
        setPreviewUrl(null);
    };

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx));
        setMergedUrl(null);
        setPreviewUrl(null);
    };

    const moveFile = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= files.length) return;
        const newFiles = [...files];
        const [moved] = newFiles.splice(fromIdx, 1);
        newFiles.splice(toIdx, 0, moved);
        setFiles(newFiles);
        setMergedUrl(null);
        setPreviewUrl(null);
    };

    const processMerge = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        try {
            const pages = await smartMergeFiles(files);

            // Sort by filename (natural order)
            pages.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));

            setMergedPages(pages);

            const finalHtml = generateMergedHtml(pages);
            const blob = new Blob([finalHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setMergedUrl(url);
            setPreviewUrl(url);

        } catch (err) {
            console.error('Merge failed', err);
            alert('파일 병합에 실패했습니다. 콘솔을 확인하세요.');
        } finally {
            setIsProcessing(false);
        }
    };

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-8">

            {/* Drop Zone */}
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                    dragActive
                        ? "border-indigo-500 bg-indigo-500/5 scale-[1.01] shadow-lg shadow-indigo-500/10"
                        : "border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/30 hover:border-indigo-400 hover:bg-indigo-500/5",
                    files.length > 0 && "py-8"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".html,.htm"
                    className="hidden"
                    onChange={handleChange}
                />

                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl ring-1 ring-indigo-500/20">
                        <UploadCloud className="w-10 h-10 text-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                            HTML 강의 파일을 여기에 놓으세요
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            또는 클릭하여 파일을 선택하세요 · .html, .htm 파일만 지원
                        </p>
                    </div>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <Card className="p-5 space-y-3 border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-base">선택된 파일</h3>
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                                {files.length}개
                            </span>
                            <span className="text-xs text-zinc-400">
                                총 {(totalSize / 1024).toFixed(1)} KB
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setFiles([]); setMergedUrl(null); setPreviewUrl(null); }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-auto px-3 py-1"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            전체 삭제
                        </Button>
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-sm group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-400 w-6 text-right">{i + 1}</span>
                                    <FileIcon className="w-4 h-4 text-indigo-500/70" />
                                    <span className="truncate max-w-[300px] font-medium">{file.name}</span>
                                    <span className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveFile(i, i - 1); }}
                                        disabled={i === 0}
                                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                                        title="위로 이동"
                                    >▲</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveFile(i, i + 1); }}
                                        disabled={i === files.length - 1}
                                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                                        title="아래로 이동"
                                    >▼</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-500 transition-colors"
                                        title="삭제"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            {files.length > 0 && (
                <div className="flex flex-col items-center gap-5">
                    {!mergedUrl ? (
                        <Button
                            size="lg"
                            onClick={processMerge}
                            disabled={isProcessing}
                            className="w-full max-w-md text-lg h-14 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl font-bold"
                        >
                            {isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    병합 중...
                                </span>
                            ) : (
                                `🔗 ${files.length}개 파일 병합하기`
                            )}
                        </Button>
                    ) : (
                        <div className="w-full max-w-md space-y-4">
                            {/* Success Banner */}
                            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-5 h-5" />
                                병합 완료! {mergedPages.length}개 페이지가 하나로 합쳐졌습니다.
                            </div>

                            {/* Merged Pages Summary */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-2">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">병합된 페이지 순서</h4>
                                <div className="space-y-1">
                                    {mergedPages.map((page, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <span className="truncate text-zinc-700 dark:text-zinc-300">{page.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <a href={mergedUrl} download="merged_lecture.html" className="w-full">
                                    <Button className="w-full h-12 font-bold gap-2 rounded-xl" variant="default">
                                        <Download className="w-4 h-4" />
                                        다운로드
                                    </Button>
                                </a>
                                <a href={mergedUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button className="w-full h-12 font-bold gap-2 rounded-xl" variant="outline">
                                        <ExternalLink className="w-4 h-4" />
                                        새 탭에서 열기
                                    </Button>
                                </a>
                            </div>

                            {/* Reset */}
                            <Button
                                variant="ghost"
                                className="w-full text-zinc-500 hover:text-zinc-700"
                                onClick={() => { setFiles([]); setMergedUrl(null); setPreviewUrl(null); setMergedPages([]); }}
                            >
                                🔄 새로운 파일로 다시 시작
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Inline Preview */}
            {previewUrl && (
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-center text-zinc-700 dark:text-zinc-300">
                        📄 미리보기
                    </h3>
                    <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-xl bg-white">
                        <iframe
                            src={previewUrl}
                            className="w-full border-none"
                            style={{ height: '600px' }}
                            title="Merged Lecture Preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
