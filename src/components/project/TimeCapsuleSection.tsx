'use client';

import { useState, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Save, Edit3, ShieldAlert, Plus, UploadCloud, X, Play, Image as ImageIcon, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { TimeCapsule } from '@prisma/client';
import { InteractiveCapsule } from './InteractiveCapsule';

interface TimeCapsuleSectionProps {
  projectId: string;
  isOwner: boolean;
  initialTestament: string | null;
  initialCapsules: TimeCapsule[];
  readOnly?: boolean;
  isDead?: boolean;
}

export function TimeCapsuleSection({
  projectId,
  isOwner,
  initialTestament,
  initialCapsules,
  readOnly = false,
  isDead = false,
}: TimeCapsuleSectionProps) {
  const [testament, setTestament] = useState(initialTestament || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState('');
  
  // Capsule Upload State
  const [capsules, setCapsules] = useState<TimeCapsule[]>(initialCapsules);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'MESSAGE' | 'IMAGE' | 'VIDEO' | 'AUDIO'>('MESSAGE');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // 1. Upload to Cloudinary if file exists
      if (file && uploadType !== 'MESSAGE') {
        const sigRes = await fetch('/api/upload/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'time-capsules' })
        });
        if (!sigRes.ok) throw new Error('Failed to get upload signature');
        const { timestamp, signature, apiKey, cloudName } = await sigRes.json();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', 'time-capsules');
        
        let resourceType = 'auto';
        if (uploadType === 'VIDEO') resourceType = 'video';
        if (uploadType === 'AUDIO') resourceType = 'video'; // Cloudinary treats audio as video resource type sometimes, auto is safest
        if (uploadType === 'IMAGE') resourceType = 'image';

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload file to Cloudinary');
        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.secure_url;
      }

      // 2. Save Capsule to DB
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

      if (!dbRes.ok) throw new Error('Failed to save capsule to database');
      const { capsule } = await dbRes.json();

      setCapsules((prev) => [...prev, capsule]);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadContent('');
      setFile(null);
      
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // If visitor and no content at all, don't show the section to save space
  if (!isOwner && !initialTestament && capsules.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 flex items-center gap-2">
          <ShieldAlert className="h-3 w-3" /> Will & Testament
        </h2>
        {isOwner && !isEditing && !readOnly && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 text-[10px] text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/10">
            <Edit3 className="h-3 w-3 mr-1.5" /> Edit Testament
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        
        {/* TESTAMENT (Only visible to Owner or via Legacy Inherited view) */}
        {(isOwner || initialTestament) && (
          <div className="relative">
            <h3 className="font-mono text-[11px] font-semibold text-foreground/80 mb-3 flex items-center gap-2">
              Will & Testament
              <span className="font-normal text-muted-foreground/40 tracking-normal text-[10px]">(Only visible to the next Resurrector)</span>
            </h3>
            
            {isEditing ? (
              <textarea
                value={testament}
                onChange={(e) => setTestament(e.target.value)}
                placeholder="Leave instructions or your vision for whoever resurrects this code..."
                className="w-full min-h-[120px] rounded-xl border border-border/60 bg-card/60 p-4 font-sans text-[14px] text-foreground outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 resize-y"
              />
            ) : (
              <div className="relative rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-6 backdrop-blur-sm">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 to-transparent rounded-l-2xl" />
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

        {/* TIME CAPSULES */}
        <div className="relative mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-[11px] font-semibold text-foreground/80 flex items-center gap-2">
              Time Capsules
              <span className="font-normal text-muted-foreground/40 tracking-normal text-[10px]">(Sealed until project dies. Followers will be emailed upon unsealing.)</span>
            </h3>
            {isOwner && !readOnly && (
               <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)} className="h-7 text-[10px] border-amber-500/30 text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-500">
                 <Plus className="h-3 w-3 mr-1" /> Add Capsule
               </Button>
            )}
          </div>

          <div className="mt-8">
            {capsules.length > 0 ? (
              isDead ? (
                <InteractiveCapsule capsules={capsules} isDead={isDead} />
              ) : (
                <div className="rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5 p-8 flex flex-col items-center justify-center text-center">
                   <Lock className="h-6 w-6 text-amber-500/50 mb-3" />
                   <p className="font-mono text-[12px] text-amber-500/80 mb-1">{capsules.length} Time Capsule{capsules.length === 1 ? '' : 's'} Sealed</p>
                   <p className="font-mono text-[10px] text-muted-foreground/50">The contents are locked until this project's life ends.</p>
                </div>
              )
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-border/40 p-8 text-center">
                 <p className="font-mono text-[11px] text-muted-foreground/40">No time capsules have been sealed yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* SAVE CONTROLS FOR TESTAMENT */}
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

      {/* UPLOAD MODAL */}
      <Dialog
        open={isUploadModalOpen}
        onClose={() => { if (!isUploading) setIsUploadModalOpen(false); }}
        title="Seal New Time Capsule"
        description="Preserve a piece of history. This will remain locked until the project's life ends."
      >
         <div className="mt-4 flex flex-col gap-5">
            <div>
               <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2 block">Capsule Type</label>
               <div className="flex gap-2">
                  {(['MESSAGE', 'IMAGE', 'VIDEO', 'AUDIO'] as const).map(type => (
                     <button
                        key={type}
                        onClick={() => { setUploadType(type); setFile(null); }}
                        className={`px-3 py-1.5 rounded border font-mono text-[10px] transition-colors ${uploadType === type ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-border/50 bg-background/50 text-muted-foreground/60 hover:text-foreground'}`}
                     >
                        {type}
                     </button>
                  ))}
               </div>
            </div>

            <div>
               <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2 block">Title</label>
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
                  <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2 block">Media File</label>
                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={e => setFile(e.target.files?.[0] || null)}
                     accept={uploadType === 'IMAGE' ? 'image/*' : uploadType === 'VIDEO' ? 'video/*' : 'audio/*'}
                     className="hidden"
                  />
                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full rounded-xl border border-dashed border-border/60 hover:border-amber-500/40 bg-background/30 p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                     {file ? (
                        <div className="flex items-center gap-3 text-amber-500/80">
                           <ImageIcon className="h-5 w-5" />
                           <span className="font-mono text-[11px] truncate max-w-[200px]">{file.name}</span>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-amber-500/70 transition-colors">
                           <UploadCloud className="h-6 w-6" />
                           <span className="font-mono text-[10px] uppercase">Click to browse</span>
                        </div>
                     )}
                  </div>
               </div>
            )}

            <div>
               <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2 block">Optional Message</label>
               <textarea
                  value={uploadContent}
                  onChange={e => setUploadContent(e.target.value)}
                  placeholder="Context or thoughts behind this capsule..."
                  className="w-full rounded border border-border/50 bg-background/50 px-3 py-2 font-mono text-[11px] outline-none focus:border-amber-500/50 resize-y min-h-[80px]"
               />
            </div>

            {uploadError && <p className="font-mono text-[10px] text-red-500/80">{uploadError}</p>}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/40">
               <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>Cancel</Button>
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
    </div>
  );
}
