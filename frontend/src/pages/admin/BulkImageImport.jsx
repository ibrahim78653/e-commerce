import React, { useState, useRef, useEffect } from 'react';
import { bulkImageAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Upload, Download, FileArchive, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronRight
} from 'lucide-react';

/* ────────────────────────────────────────────
   Utility: trigger browser download from Blob
───────────────────────────────────────────── */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────
   Sub-component: Stat Card
───────────────────────────────────────────── */
function StatCard({ label, value, color, icon: Icon }) {
  const colors = {
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700'
  };
  return (
    <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 shadow-sm ${colors[color] || colors.gray}`}>
      <Icon size={22} className="opacity-80" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-component: Job Result Banner
───────────────────────────────────────────── */
function JobBanner({ job, onDismiss, onDownloadReport }) {
  if (!job) return null;
  const isError = job.status === 'failed';
  const isProcessing = job.status === 'processing' || job.status === 'queued';
  const isCompleted = job.status === 'completed';

  const total = job.total_files || 0;
  const mapped = job.successfully_mapped || 0;
  const missing = job.missing_products?.length || 0;
  const invalid = job.invalid_files?.length || 0;
  const failed = job.failed_images?.length || 0;
  const hasErrors = missing > 0 || invalid > 0 || failed > 0;

  return (
    <div className={`rounded-xl border p-5 mb-6 shadow-sm transition-all
      ${isError ? 'bg-red-50 border-red-200' : 
        isProcessing ? 'bg-blue-50 border-blue-200' : 
        'bg-emerald-50 border-emerald-200'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className={`text-lg font-bold flex items-center gap-2 
            ${isError ? 'text-red-700' : isProcessing ? 'text-blue-700' : 'text-emerald-700'}`}>
            {isError ? <XCircle size={20} /> : isProcessing ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
            {isError ? 'Import Failed' : isProcessing ? `Processing... ${job.progress || 0}%` : 'Import Completed'}
          </h4>
          <p className="text-sm mt-1 opacity-80">
            Job ID: <span className="font-mono bg-white/50 px-1.5 py-0.5 rounded">{job.job_id}</span>
          </p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white/80 rounded-full p-1 transition-colors">
            <XCircle size={20} />
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="w-full bg-white/60 rounded-full h-3.5 mb-2 overflow-hidden border border-blue-100 shadow-inner">
          <div className="bg-blue-600 h-3.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${job.progress || 0}%` }}></div>
        </div>
      )}

      {job.error && (
        <div className="bg-white/80 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4 shadow-sm">
          <span className="font-bold">Error:</span> {job.error}
        </div>
      )}

      {(isCompleted || total > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total Images" value={total} color="blue" icon={FileArchive} />
          <StatCard label="Mapped" value={mapped} color="green" icon={CheckCircle} />
          <StatCard label="Missing Products" value={missing} color={missing > 0 ? "amber" : "gray"} icon={AlertCircle} />
          <StatCard label="Invalid/Failed" value={invalid + failed} color={(invalid + failed) > 0 ? "red" : "gray"} icon={XCircle} />
        </div>
      )}

      {(isCompleted && hasErrors) && (
        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/60 p-3 rounded-lg border border-amber-200/50">
          <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
            <AlertCircle size={16} /> Some images had issues. Download the report for details.
          </p>
          <button
            onClick={() => onDownloadReport(job.job_id)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="text-gray-500" /> Download Error Report (CSV)
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-component: Job History Item
───────────────────────────────────────────── */
function JobHistoryItem({ job, onDownloadReport }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = job.status === 'completed';
  const isError = job.status === 'failed';
  
  const total = job.total_files || 0;
  const mapped = job.successfully_mapped || 0;
  const missing = job.missing_products?.length || 0;
  const invalid = job.invalid_files?.length || 0;
  const failed = job.failed_images?.length || 0;
  const hasErrors = missing > 0 || invalid > 0 || failed > 0;

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="px-4 py-3 cursor-pointer flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {isCompleted ? <CheckCircle2 size={20} className="text-emerald-500" /> : 
           isError ? <XCircle size={20} className="text-red-500" /> : 
           <RefreshCw size={20} className="text-blue-500 animate-spin" />}
          
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <span className="font-semibold text-gray-800 text-sm">
                {new Date(job.created_at).toLocaleString()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border
                ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                  isError ? 'bg-red-50 text-red-700 border-red-200' : 
                  'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {job.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">ID: {job.job_id.split('-')[0]}...</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isCompleted && (
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <span className="text-gray-600"><span className="font-semibold">{total}</span> total</span>
              <span className="text-emerald-600"><span className="font-semibold">{mapped}</span> mapped</span>
              {hasErrors && <span className="text-red-500"><span className="font-semibold">{missing + invalid + failed}</span> issues</span>}
            </div>
          )}
          <div className="text-gray-400">
            {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Status</p>
              <p className="text-sm">{job.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Started</p>
              <p className="text-sm">{job.started_at ? new Date(job.started_at).toLocaleTimeString() : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Completed</p>
              <p className="text-sm">{job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Progress</p>
              <p className="text-sm font-medium">{job.progress}%</p>
            </div>
          </div>
          
          {job.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
              <span className="font-bold">Error:</span> {job.error}
            </div>
          )}

          {isCompleted && hasErrors && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadReport(job.job_id); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-700 hover:border-emerald-300 transition-all"
            >
              <Download size={16} /> Download CSV Error Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const BulkImageImport = () => {
  const fileRef = useRef(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Job Tracking State
  const [currentJobId, setCurrentJobId] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  
  // History State
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // ── Polling logic for current job ──
  useEffect(() => {
    let interval;
    if (currentJobId) {
      // Poll every 2 seconds
      interval = setInterval(async () => {
        try {
          const res = await bulkImageAPI.getJobStatus(currentJobId);
          setCurrentJob(res.data);
          
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            clearInterval(interval);
            fetchJobs(); // refresh history when done
          }
        } catch (err) {
          console.error('Failed to poll status', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [currentJobId]);

  // ── Fetch history ──
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await bulkImageAPI.getJobs();
      setJobs(res.data || []);
    } catch {
      toast.error('Failed to load import history');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ── Handlers ──
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.zip')) { 
      toast.error('Only .zip files are accepted'); 
      return; 
    }
    setSelectedFile(f);
  };

  const handleImport = async () => {
    if (!selectedFile) { toast.error('Select a .zip file first'); return; }
    
    setUploading(true);
    setCurrentJobId(null);
    setCurrentJob(null);
    
    try {
      const res = await bulkImageAPI.startImport(selectedFile);
      toast.success('Upload complete! Processing started in background.');
      setCurrentJobId(res.data.job_id);
      
      // Clear file selection
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReport = async (jobId) => {
    try {
      const res = await bulkImageAPI.downloadReport(jobId);
      downloadBlob(res.data, `image_import_report_${jobId.substring(0,8)}.csv`);
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to download report');
    }
  };

  // ─────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <FileArchive size={24} />
          </div>
          Bulk Image Import
        </h2>
        <p className="text-gray-500">Upload a ZIP file containing product images to automatically map them to products based on their filenames.</p>
      </div>

      {/* ── Active Job Banner ── */}
      {currentJobId && (
        <JobBanner 
          job={currentJob} 
          onDismiss={() => { setCurrentJobId(null); setCurrentJob(null); }}
          onDownloadReport={handleDownloadReport}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Upload & Instructions ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Upload size={18} className="text-emerald-600" /> Upload ZIP Archive
              </h3>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Drop zone */}
                <label
                  htmlFor="zip-upload"
                  className={`flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer transition-all duration-300
                    ${selectedFile 
                      ? 'border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50' 
                      : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50/50'}`}
                >
                  <div className={`p-4 rounded-full mb-4 ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <FileArchive size={32} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 text-center mb-1">
                    {selectedFile ? selectedFile.name : 'Click to browse or drag ZIP here'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Images must be in .zip format'}
                  </p>
                  
                  <input
                    id="zip-upload"
                    ref={fileRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>

                {/* Upload Action */}
                <div className="w-full sm:w-auto min-w-[200px] flex flex-col gap-4">
                  <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 shadow-sm leading-relaxed">
                    <span className="font-bold block mb-1">Supported Formats:</span>
                    jpg, jpeg, png, webp
                  </div>
                  
                  <button
                    onClick={handleImport}
                    disabled={!selectedFile || uploading || (currentJob && currentJob.status === 'processing')}
                    className="mt-auto w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {uploading ? (
                      <><RefreshCw size={18} className="animate-spin"/> Uploading...</>
                    ) : (
                      <><Upload size={18}/> Start Import</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-800">Naming Convention Guidelines</h3>
            </div>
            <div className="p-6 text-sm text-gray-600 leading-relaxed">
              <p className="mb-4">
                To automatically assign images to the correct product, the image files inside your ZIP archive 
                <strong className="text-gray-900"> must follow a specific naming pattern</strong>.
              </p>
              
              <div className="bg-gray-900 text-emerald-400 p-4 rounded-xl font-mono text-center text-lg shadow-inner mb-6">
                PRODUCTID_ORDER.extension
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Valid Examples
                  </h4>
                  <ul className="space-y-2 bg-emerald-50/50 border border-emerald-100 p-3 rounded-lg">
                    <li className="font-mono text-xs">PROD-030_1.webp <span className="text-gray-500 font-sans ml-2">→ Order 1 (Primary)</span></li>
                    <li className="font-mono text-xs">PROD-030_2.jpg <span className="text-gray-500 font-sans ml-2">→ Order 2</span></li>
                    <li className="font-mono text-xs">TSHIRT-BLK_1.png <span className="text-gray-500 font-sans ml-2">→ Order 1</span></li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-red-700 flex items-center gap-2">
                    <XCircle size={16} /> Invalid Examples
                  </h4>
                  <ul className="space-y-2 bg-red-50/50 border border-red-100 p-3 rounded-lg">
                    <li className="font-mono text-xs text-red-800 line-through decoration-red-300">product.jpg <span className="text-gray-500 font-sans ml-2 no-underline">→ Missing ID & Order</span></li>
                    <li className="font-mono text-xs text-red-800 line-through decoration-red-300">PROD030.png <span className="text-gray-500 font-sans ml-2 no-underline">→ Missing Order</span></li>
                    <li className="font-mono text-xs text-red-800 line-through decoration-red-300">1_PROD-030.webp <span className="text-gray-500 font-sans ml-2 no-underline">→ Wrong format</span></li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs">
                <strong>Important Notes:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Existing base images for a product will be <strong className="font-bold">replaced</strong> by the newly uploaded ones.</li>
                  <li>Order <strong>1</strong> will always be set as the primary image.</li>
                  <li>Images are automatically optimized and converted to WebP format.</li>
                  <li>Invalid files are skipped automatically; the rest will continue processing.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: History ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" /> Recent Imports
              </h3>
              <button 
                onClick={fetchJobs} 
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Refresh History"
              >
                <RefreshCw size={16} className={loadingJobs ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50/30">
              {loadingJobs && jobs.length === 0 ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw size={24} className="animate-spin text-emerald-500" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <FileArchive size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No import history yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {jobs.map((job) => (
                    <JobHistoryItem 
                      key={job.job_id} 
                      job={job} 
                      onDownloadReport={handleDownloadReport} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BulkImageImport;
