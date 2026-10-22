import React, { useState } from 'react';
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useProcurement } from '@/context/ProcurementContext';
import {
  parseProcurementFile,
  autoDetectColumnMapping,
  validateAndMapRecords,
  generateSampleCSVTemplate,
  ColumnMapping,
  ImportErrorRow,
} from '@/lib/importer';
import { downloadFile } from '@/lib/exporter';
import { TransactionInput } from '@/types/procurement';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, onClose }) => {
  const { importRecords, transactions } = useProcurement();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    po_number: '',
    purchase_date: '',
    supplier_name: '',
    category_name: '',
    department_name: '',
    description: '',
    quantity: '',
    unit_price: '',
    total_amount: '',
  });

  const [validRecords, setValidRecords] = useState<TransactionInput[]>([]);
  const [invalidRows, setInvalidRows] = useState<ImportErrorRow[]>([]);
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle file drop/selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsProcessing(true);
      try {
        const { headers, rows } = await parseProcurementFile(file);
        setFileHeaders(headers);
        setRawRows(rows);
        const suggested = autoDetectColumnMapping(headers);
        setColumnMapping(suggested);
        setStep(2);
      } catch (err: any) {
        alert(`File error: ${err.message || 'Unable to parse file'}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Run validation
  const handleProceedToValidation = () => {
    const existingPoSet = new Set(transactions.map((t) => t.po_number));
    const { validRows, invalidRows, detectedDuplicates } = validateAndMapRecords(
      rawRows,
      columnMapping,
      existingPoSet
    );
    setValidRecords(validRows);
    setInvalidRows(invalidRows);
    setDuplicatesCount(detectedDuplicates);
    setStep(3);
  };

  // Commit to database
  const handleCommit = async () => {
    if (validRecords.length === 0) return;
    setIsProcessing(true);
    try {
      const filename = selectedFile?.name || 'procurement_upload.csv';
      const { successCount } = await importRecords(validRecords as any, filename);
      setImportSuccessMessage(`Successfully imported ${successCount} procurement transactions!`);
      setStep(4);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = generateSampleCSVTemplate();
    downloadFile(templateContent, 'procuresense_import_template.csv');
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedFile(null);
    setFileHeaders([]);
    setRawRows([]);
    setValidRecords([]);
    setInvalidRows([]);
    setDuplicatesCount(0);
    setImportSuccessMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Procurement Data Ingestion Wizard</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload, map, validate, and commit procurement datasets (CSV or Excel)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          {[
            { num: 1, title: 'Upload File' },
            { num: 2, title: 'Map Columns' },
            { num: 3, title: 'Validate Records' },
            { num: 4, title: 'Commit to Database' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === s.num
                    ? 'bg-teal-600 text-white'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span
                className={`hidden sm:inline font-medium ${
                  step === s.num ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500'
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-teal-500 dark:hover:border-teal-400 transition bg-slate-50/50 dark:bg-slate-800/30">
                <Upload className="w-12 h-12 text-teal-600 dark:text-teal-400 mx-auto mb-3 animate-bounce" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Drop your procurement CSV or Excel file here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports .csv, .xlsx, and .xls up to 25MB
                </p>

                <label className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition shadow-sm">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Template Download Box */}
              <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                  <div>
                    <h4 className="text-xs font-semibold">Need a sample format?</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Download our pre-structured CSV template with sample column headers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Map Columns from "{selectedFile?.name}"</h3>
                  <p className="text-xs text-slate-500">
                    Match fields in your uploaded file to ProcureSense system attributes.
                  </p>
                </div>
                <span className="text-xs bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-md font-medium border border-teal-200 dark:border-teal-800">
                  {rawRows.length} rows detected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                {[
                  { key: 'po_number', label: 'PO Number *', req: true },
                  { key: 'purchase_date', label: 'Purchase Date (YYYY-MM-DD) *', req: true },
                  { key: 'supplier_name', label: 'Supplier Name *', req: true },
                  { key: 'category_name', label: 'Category *', req: true },
                  { key: 'department_name', label: 'Department *', req: true },
                  { key: 'description', label: 'Description *', req: true },
                  { key: 'quantity', label: 'Quantity *', req: true },
                  { key: 'unit_price', label: 'Unit Price *', req: true },
                  { key: 'total_amount', label: 'Total Amount *', req: true },
                  { key: 'currency', label: 'Currency (Optional)', req: false },
                  { key: 'payment_status', label: 'Payment Status (Optional)', req: false },
                  { key: 'delivery_status', label: 'Delivery Status (Optional)', req: false },
                  { key: 'contract_ref', label: 'Contract Reference (Optional)', req: false },
                  { key: 'invoice_ref', label: 'Invoice Reference (Optional)', req: false },
                ].map((field) => (
                  <div
                    key={field.key}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {field.label}
                    </span>
                    <select
                      value={(columnMapping as any)[field.key] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                      }
                      className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="">-- Ignore / Unmapped --</option>
                      {fileHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Validate Records */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl text-center">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {validRecords.length}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Valid Records
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 rounded-xl text-center">
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {invalidRows.length}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                    Invalid Rows
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl text-center">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {duplicatesCount}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Duplicates Detected
                  </div>
                </div>
              </div>

              {/* Error Table if any */}
              {invalidRows.length > 0 && (
                <div className="border border-rose-200 dark:border-rose-800 rounded-xl overflow-hidden">
                  <div className="bg-rose-100 dark:bg-rose-950/60 px-4 py-2 font-semibold text-rose-800 dark:text-rose-300 text-xs">
                    Validation Issues ({invalidRows.length} rows excluded)
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2 divide-y divide-rose-100 dark:divide-rose-900/40 text-xs">
                    {invalidRows.slice(0, 10).map((inv, idx) => (
                      <div key={idx} className="py-2 px-2 flex items-start justify-between">
                        <div>
                          <span className="font-semibold text-rose-700 dark:text-rose-300">
                            Row #{inv.rowIndex}:
                          </span>{' '}
                          <span className="text-slate-600 dark:text-slate-300">
                            {inv.errors.join('; ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {invalidRows.length > 10 && (
                      <p className="text-center text-xs text-slate-500 py-1">
                        + {invalidRows.length - 10} more invalid rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Valid Sample Preview */}
              {validRecords.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">
                    Valid Records Preview (first 5 of {validRecords.length})
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <tr>
                          <th className="p-2">PO #</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Supplier</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Dept</th>
                          <th className="p-2">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {validRecords.slice(0, 5).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-mono font-medium">{r.po_number}</td>
                            <td className="p-2">{r.purchase_date}</td>
                            <td className="p-2 font-medium">{r.supplier_name}</td>
                            <td className="p-2">{r.category_name}</td>
                            <td className="p-2">{r.department_name}</td>
                            <td className="p-2 font-bold text-teal-600 dark:text-teal-400">
                              ${r.total_amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success & Confirmation */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Import Batch Committed Successfully!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {importSuccessMessage} All executive dashboard metrics, supplier scorecards, and
                statistical anomaly models have been recalculated with the new records.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  onClick={resetWizard}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step < 4 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            {step > 1 ? (
              <button
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step === 2 && (
              <button
                onClick={handleProceedToValidation}
                className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition"
              >
                <span>Validate Records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleCommit}
                disabled={validRecords.length === 0 || isProcessing}
                className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Commit {validRecords.length} Records</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
