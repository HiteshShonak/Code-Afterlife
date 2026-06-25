'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Save, ShieldAlert, Plus, UploadCloud, X, Play, Image as ImageIcon, MessageSquare, FileText, Loader2, Pencil, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { TimeCapsule } from '@prisma/client';


const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 90 * 1024 * 1024; // 90 MB
const MAX_AUDIO_SIZE = 90 * 1024 * 1024; // 90 MB

const compressImageToWebp = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
          type: 'image/webp',
        });
        resolve(webpFile);
      }, 'image/webp', 0.85);
    };
    img.onerror = () => resolve(file);
  });
};

interface TimeCapsuleSectionProps {
  projectId: string;
  isOwner: boolean;
  initialTestament: string | null;
  initialCapsules: TimeCapsule[];
  readOnly?: boolean;
  isDead?: boolean;
  hasBeenResurrected: boolean;
}

export function TimeCapsuleSection({
  projectId,
  isOwner,
  initialTestament,
  initialCapsules,
  readOnly = false,
  isDead = false,
  hasBeenResurrected,
}: TimeCapsuleSectionProps) {
  const [testament, setTestament] = useState(initialTestament || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState('');
  const [tooltipOpen1, setTooltipOpen1] = useState(false);
  const [tooltipOpen2, setTooltipOpen2] = useState(false);
  
  const [capsules, setCapsules] = useState<TimeCapsule[]>(initialCapsules);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'MESSAGE' | 'IMAGE' | 'VIDEO' | 'AUDIO'>('MESSAGE');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = () => {
    setUploadType('MESSAGE');
    setUploadTitle('');
    setUploadContent('');
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setUploadError('');
    setIsUploadModalOpen(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setUploadError('');
    
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    
    if (uploadType === 'IMAGE' && selected.size > MAX_IMAGE_SIZE) {
      setUploadError(`Image exceeds 5MB limit. (Selected: ${formatSize(selected.size)})`);
      e.target.value = '';
      return;
    }
    if (uploadType === 'VIDEO' && selected.size > MAX_VIDEO_SIZE) {
      setUploadError(`Video exceeds 90MB limit. (Selected: ${formatSize(selected.size)})`);
      e.target.value = '';
      return;
    }
    if (uploadType === 'AUDIO' && selected.size > MAX_AUDIO_SIZE) {
      setUploadError(`Audio exceeds 90MB limit. (Selected: ${formatSize(selected.size)})`);
      e.target.value = '';
      return;
    }
    
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSaveTestament = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testament: testament.trim() || null,
          }),
        });
        if (res.ok) {
          setSaveMessage('Testament preserved successfully.');
          setIsEditing(false);
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          setSaveMessage('Failed to preserve testament.');
        }
      } catch (err) {
        setSaveMessage('Failed to preserve testament.');
      }
    });
  };

  const handleUploadCapsule = async () => {
    if (!uploadTitle.trim()) {
      setUploadError('Title is required.');
      return;
    }
    
    setIsUploading(true);
    setUploadError('');

    try {
      let mediaUrl = null;

      if (file && uploadType !== 'MESSAGE') {
        let fileToUpload = file;
        if (uploadType === 'IMAGE') {
          fileToUpload = await compressImageToWebp(file);
        }

        const sigRes = await fetch('/api/upload/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'time-capsules' })
        });
        if (!sigRes.ok) throw new Error('Failed to get upload signature');
        const { timestamp, signature, apiKey, cloudName } = await sigRes.json();
        
        let resourceType = 'auto';
        if (uploadType === 'VIDEO') resourceType = 'video';
        if (uploadType === 'AUDIO') resourceType = 'video';
        if (uploadType === 'IMAGE') resourceType = 'image';

        mediaUrl = await new Promise<string>((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp.toString());
          formData.append('signature', signature);
          formData.append('folder', 'time-capsules');
          if (uploadType === 'VIDEO') {
            formData.append('quality', 'auto');
          }

          const xhr = new XMLHttpRequest();
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadProgress(percent);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
              } catch (e) {
                reject(new Error('Invalid response from Cloudinary'));
              }
            } else {
              reject(new Error('Failed to upload media. Please try again.'));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(formData);
        });
      }

      setUploadProgress(100);

      const dbRes = await fetch(`/api/projects/${projectId}/time-capsules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle,
          content: uploadContent,
          type: uploadType,
          mediaUrl,
        }),
      });

      const dbData = await dbRes.json();
      if (!dbRes.ok) throw new Error(dbData.message || 'Failed to save capsule to database');

      setCapsules((prev) => [...prev, dbData.capsule]);
      resetUploadState();
      
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const showTestament = isOwner || hasBeenResurrected;

  if (!isOwner && (!showTestament || !initialTestament)) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 rounded-2xl border border-amber-500/10 bg-amber-500/2 p-4 sm:p-6 w-full"
    >
      <div className="flex items-center justify-between mb-6 gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 flex items-center gap-2">
          <ShieldAlert className="h-3 w-3" /> Will &amp; Testament
        </h2>
        {isOwner && !isEditing && !readOnly && (
          <button
            onClick={() => setIsEditing(true)}
            title="Edit Testament"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/20 text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 transition-colors shrink-0"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        
        {showTestament && (
          <div className="relative">
            <h3 className="font-mono text-[11px] font-semibold text-foreground/80 mb-3 flex items-center gap-2">
              Will & Testament
              <span className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => setTooltipOpen1((v) => !v)}
                  className="flex items-center"
                  aria-label="Info"
                >
                  <Info className="h-3 w-3 text-muted-foreground/30" />
                </button>
                {tooltipOpen1 && (
                  <span
                    onClick={() => setTooltipOpen1(false)}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] rounded-lg border border-border/50 bg-popover px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground/70 shadow-lg z-50 text-center cursor-pointer"
                  >
                    Only visible to the next Resurrector
                  </span>
                )}
              </span>
            </h3>
            
            {isEditing ? (
              <div className="relative rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 backdrop-blur-sm">
                <textarea
                  value={testament}
                  onChange={(e) => setTestament(e.target.value)}
                  placeholder="I leave this code to..."
                  className="w-full min-h-[150px] resize-y bg-transparent font-sans text-[15px] leading-relaxed text-foreground/90 font-light italic outline-none placeholder:text-muted-foreground/30"
                  maxLength={2000}
                />
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground/50">{testament.length}/2000</span>
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setTestament(initialTestament || '');
                      setIsEditing(false);
                    }}>Cancel</Button>
                    <Button variant="outline" size="sm" onClick={handleSaveTestament} className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/50" disabled={isPending}>
                      {isPending ? 'Preserving...' : 'Preserve Testament'}
                    </Button>
                  </div>
                </div>
                {saveMessage && <p className="mt-3 font-mono text-[10px] text-amber-500/80">{saveMessage}</p>}
              </div>
            ) : (
              <div className="relative rounded-2xl border border-amber-500/10 bg-amber-500/2 p-6 backdrop-blur-sm">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-linear-to-b from-amber-500/50 to-transparent rounded-l-2xl" />
                {testament ? (
                  <p className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground/80 font-light italic">
                    "{testament}"
                  </p>
                ) : (
                  <p className="font-mono text-[12px] text-muted-foreground/40 italic">
                    No testament recorded.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {isOwner && (
          <div className="relative mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-[11px] font-semibold text-foreground/80 flex items-center gap-2 flex-wrap">
                Time Capsules
                <span className="relative inline-flex">
                  <button
                    type="button"
                    onClick={() => setTooltipOpen2((v) => !v)}
                    className="flex items-center"
                    aria-label="Info"
                  >
                    <Info className="h-3 w-3 text-muted-foreground/30" />
                  </button>
                  {tooltipOpen2 && (
                    <span
                      onClick={() => setTooltipOpen2(false)}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] rounded-lg border border-border/50 bg-popover px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground/70 shadow-lg z-50 text-center cursor-pointer"
                    >
                      Sealed until project dies. Followers will be emailed upon unsealing.
                    </span>
                  )}
                </span>
              </h3>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  title="Add Capsule"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-500 transition-colors shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-2">
              {capsules.length > 0 ? (
                <p className="font-mono text-[12px] text-amber-500/80">{capsules.length} Time Capsule{capsules.length === 1 ? '' : 's'} Sealed.</p>
              ) : (
                <p className="font-mono text-[11px] text-muted-foreground/40">No time capsules have been sealed yet.</p>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4"
            >
              <Button onClick={handleSaveTestament} isLoading={isPending} className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30">
                <Save className="h-4 w-4 mr-2" />
                Preserve Testament
              </Button>
              <Button variant="ghost" onClick={() => {
                setTestament(initialTestament || '');
                setIsEditing(false);
              }}>
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {saveMessage && (
          <p className="font-mono text-[11px] text-emerald-500/80">{saveMessage}</p>
        )}
      </div>

      <Dialog
        open={isUploadModalOpen}
        onClose={() => { if (!isUploading) setIsUploadModalOpen(false); }}
        title="Seal New Time Capsule"
        description="Preserve a piece of history. This will remain locked until the project's life ends."
      >
         <div className="mt-4 flex flex-col gap-5">
            <div>
               <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">Capsule Type</label>
               <div className="flex gap-2">
                  {(['MESSAGE', 'IMAGE', 'VIDEO', 'AUDIO'] as const).map(type => (
                     <button
                        key={type}
                        onClick={() => { setUploadType(type); setFile(null); setPreviewUrl(null); setUploadError(''); }}
                        className={`px-3 py-1.5 rounded border font-mono text-[10px] transition-colors ${uploadType === type ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-border/50 bg-background/50 text-muted-foreground/60 hover:text-foreground'}`}
                     >
                        {type}
                     </button>
                  ))}
               </div>
            </div>

            <div>
               <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">Title</label>
               <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Architecture V1 Notes"
                  className="w-full rounded border border-border/50 bg-background/50 px-3 py-2 font-mono text-[11px] outline-none focus:border-amber-500/50"
                  maxLength={60}
               />
            </div>

            {uploadType !== 'MESSAGE' && (
               <div>
                  <div className="flex justify-between mb-2 items-end">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block">Media File</label>
                    <span className="font-mono text-[9px] text-muted-foreground/50">
                      {uploadType === 'IMAGE' && 'Max 5MB (Auto WebP)'}
                      {uploadType === 'VIDEO' && 'Max 90MB'}
                      {uploadType === 'AUDIO' && 'Max 90MB'}
                    </span>
                  </div>
                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleFileSelect}
                     accept={uploadType === 'IMAGE' ? 'image/*' : uploadType === 'VIDEO' ? 'video/*' : 'audio/*'}
                     className="hidden"
                  />
                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full rounded-xl border border-dashed border-border/60 hover:border-amber-500/40 bg-background/30 p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden"
                  >
                     {file && previewUrl ? (
                        <div className="flex flex-col items-center gap-4 w-full">
                           {uploadType === 'IMAGE' && (
                             <img src={previewUrl} alt="Preview" className="max-h-[160px] object-contain rounded-md border border-border/50" />
                           )}
                           {uploadType === 'VIDEO' && (
                             <video src={previewUrl} controls className="max-h-[160px] rounded-md border border-border/50 w-full object-cover" />
                           )}
                           {uploadType === 'AUDIO' && (
                             <audio src={previewUrl} controls className="w-full" />
                           )}
                           
                           <div className="flex items-center gap-3 text-amber-500/80 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-500/20 w-full justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <ImageIcon className="h-4 w-4 shrink-0" />
                                <span className="font-mono text-[11px] truncate max-w-[200px]">{file.name}</span>
                              </div>
                              <span className="font-mono text-[10px] text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                           </div>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-amber-500/70 transition-colors py-4">
                           <UploadCloud className="h-6 w-6" />
                           <span className="font-mono text-[10px] uppercase">Click to browse</span>
                        </div>
                     )}
                     
                     {isUploading && uploadProgress > 0 && (
                       <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-background">
                         <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                       </div>
                     )}
                  </div>
                  
                  {isUploading && (
                    <div className="mt-2 text-right font-mono text-[10px] text-amber-500/80">
                      Uploading... {uploadProgress}%
                    </div>
                  )}
               </div>
            )}

            <div>
               <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">Optional Message</label>
               <textarea
                  value={uploadContent}
                  onChange={e => setUploadContent(e.target.value)}
                  placeholder="Context or thoughts behind this capsule..."
                  className="w-full rounded border border-border/50 bg-background/50 px-3 py-2 font-mono text-[11px] outline-none focus:border-amber-500/50 resize-y min-h-[80px]"
               />
            </div>

            {uploadError && <p className="font-mono text-[10px] text-red-500/80">{uploadError}</p>}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/40">
               <Button variant="ghost" onClick={resetUploadState} disabled={isUploading}>Cancel</Button>
               <Button 
                  onClick={handleUploadCapsule} 
                  isLoading={isUploading}
                  disabled={isUploading || !uploadTitle.trim() || (uploadType !== 'MESSAGE' && !file)}
                  className="bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30"
               >
                  Seal Capsule
               </Button>
            </div>
         </div>
      </Dialog>
    </motion.section>
  );
}
