import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, X, ArrowLeft, ChevronRight, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const fieldOptions = [
  { value: 'name', label: 'Company Name' },
  { value: 'industry', label: 'Industry' },
  { value: 'description', label: 'Description' },
  { value: 'needs', label: 'Needs' },
  { value: 'offers', label: 'Offers' },
  { value: 'contact_name', label: 'Contact Name' },
  { value: 'contact_title', label: 'Contact Title' },
  { value: 'contact_email', label: 'Contact Email' },
  { value: 'contact_phone', label: 'Contact Phone' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'notes', label: 'Notes' },
];

const autoMap = {
  'company': 'name', 'business': 'name', 'business name': 'name',
  'email': 'contact_email', 'e-mail': 'contact_email',
  'phone': 'contact_phone', 'telephone': 'contact_phone', 'tel': 'contact_phone',
  'city': 'city', 'state': 'state', 'website': 'website', 'url': 'website',
  'linkedin': 'linkedin', 'industry': 'industry', 'sector': 'industry',
  'description': 'description', 'about': 'description',
  'needs': 'needs', 'offers': 'offers',
  'contact': 'contact_name', 'contact name': 'contact_name', 'full name': 'contact_name',
  'title': 'contact_title', 'role': 'contact_title', 'position': 'contact_title',
  'notes': 'notes', 'comments': 'notes',
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const result = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current); current = '';
      } else { current += char; }
    }
    result.push(current);
    return result;
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export default function CSVImportDialog({ open, onOpenChange }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const fileRef = useRef(null);

  const reset = () => {
    setStep(1); setFileName(''); setFileSize(0); setCsvData({ headers: [], rows: [] });
    setMapping({}); setImporting(false); setProgress(0); setResults({ success: 0, failed: 0 });
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      const autoMapping = {};
      parsed.headers.forEach(header => {
        const norm = header.toLowerCase().trim();
        autoMapping[header] = autoMap[norm] || (fieldOptions.some(f => f.value === norm) ? norm : 'skip');
      });
      setMapping(autoMapping);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setFileName(''); setCsvData({ headers: [], rows: [] }); setMapping({});
    setStep(1); if (fileRef.current) fileRef.current.value = '';
  };

  const handleImport = async () => {
    setStep(3); setImporting(true); setProgress(0);
    let success = 0, failed = 0;
    for (let i = 0; i < csvData.rows.length; i++) {
      const row = csvData.rows[i];
      const data = { stage: 'new_lead', tags: ['csv-import'] };
      csvData.headers.forEach((header, idx) => {
        const field = mapping[header];
        if (field && field !== 'skip' && row[idx]) {
          data[field] = row[idx].trim();
        }
      });
      if (!data.name) { failed++; setProgress(Math.round(((i + 1) / csvData.rows.length) * 100)); continue; }
      try {
        await base44.entities.Business.create(data);
        success++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / csvData.rows.length) * 100));
    }
    setImporting(false);
    setResults({ success, failed });
    qc.invalidateQueries({ queryKey: ['businesses'] });
    if (failed === 0) {
      toast.success(`Successfully imported ${success} businesses`);
    } else {
      toast.info(`Imported ${success} of ${csvData.rows.length}. ${failed} rows had errors.`);
    }
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Businesses from CSV</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={step >= 1 ? 'text-primary font-semibold' : ''}>1. Select File</span>
          <ChevronRight className="w-3 h-3" />
          <span className={step >= 2 ? 'text-primary font-semibold' : ''}>2. Map Columns</span>
          <ChevronRight className="w-3 h-3" />
          <span className={step >= 3 ? 'text-primary font-semibold' : ''}>3. Import</span>
        </div>

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div className="space-y-3">
            <label
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors active:scale-[0.98]"
              style={{ minHeight: 120 }}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">Tap to select CSV file</p>
              <p className="text-[10px] text-muted-foreground">.csv or .txt files supported</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            </label>
          </div>
        )}

        {/* Step 2: Preview & Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs flex-1 truncate">{fileName}</span>
              <span className="text-[10px] text-muted-foreground">{(fileSize / 1024).toFixed(1)} KB</span>
              <button onClick={removeFile} className="text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-secondary/30">
                  <tr>
                    {csvData.headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvData.rows.slice(0, 3).map((row, ri) => (
                    <tr key={ri} className="border-t border-border/50">
                      {csvData.headers.map((_, ci) => <td key={ci} className="px-2 py-1.5 whitespace-nowrap max-w-[120px] truncate">{row[ci]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mapping */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Map Columns</p>
              {csvData.headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs flex-1 truncate font-medium">{header}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Select value={mapping[header] || 'skip'} onValueChange={v => setMapping(p => ({ ...p, [header]: v }))}>
                    <SelectTrigger className="w-40 h-8 text-xs bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">— Skip —</SelectItem>
                      {fieldOptions.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleImport} disabled={!csvData.rows.length} className="flex-1 h-10">
                Import {csvData.rows.length} {csvData.rows.length === 1 ? 'Business' : 'Businesses'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Import Progress */}
        {step === 3 && (
          <div className="space-y-4">
            {importing ? (
              <div className="space-y-3">
                <p className="text-sm text-center font-medium">Importing {csvData.rows.length} businesses as New Leads...</p>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">{progress}%</p>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <div>
                  <p className="text-sm font-semibold">Import Complete</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Imported {results.success} of {csvData.rows.length} businesses
                    {results.failed > 0 && `. ${results.failed} rows had errors.`}
                  </p>
                </div>
                <Button onClick={close} className="w-full h-10">Done</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}