import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { IngestExcelResponse } from '../../interfaces/ai.interface';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel-upload.component.html',
  styles: [
    `
      .excel-upload {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        padding: 20px;
        margin: 0 auto;
      }
      .upload-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }
      .upload-header h5 {
        margin: 0;
        color: #333;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .upload-header h5 i {
        color: #28a745;
      }
      .upload-area {
        border: 2px dashed #ddd;
        border-radius: 6px;
        padding: 30px 15px;
        text-align: center;
        cursor: pointer;
      }
      .upload-area:hover:not(.uploading) {
        border-color: #007bff;
        background: #f8f9ff;
      }
      .upload-area.uploading {
        border-color: #007bff;
        background: #f8f9ff;
        opacity: 0.7;
        cursor: not-allowed;
      }
      .upload-content i {
        font-size: 36px;
        color: #007bff;
        margin-bottom: 12px;
      }
      .upload-content h6 {
        margin-bottom: 8px;
        color: #333;
        font-weight: 600;
      }
      .upload-info {
        margin-bottom: 15px;
        color: #6c757d;
        font-size: 13px;
      }
      .upload-content .btn {
        padding: 10px 20px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 auto;
      }
      .upload-loading {
        margin-top: 15px;
        text-align: center;
      }
      .loading-spinner i {
        font-size: 24px;
        color: #007bff;
        margin-bottom: 8px;
      }
      .loading-spinner p {
        margin: 0;
        color: #6c757d;
        font-weight: 500;
      }
      .alert {
        margin-top: 15px;
        border-radius: 6px;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .alert.alert-danger {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      .upload-success {
        margin-top: 15px;
        padding: 15px;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 6px;
      }
      .success-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .success-header i {
        font-size: 16px;
        color: #28a745;
      }
      .success-header h6 {
        margin: 0;
        color: #155724;
        font-weight: 600;
      }
      .result-details {
        margin-bottom: 12px;
      }
      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 13px;
      }
      .detail-item .label {
        font-weight: 600;
        color: #155724;
      }
      .detail-item .value {
        color: #155724;
      }
      .detail-item .value.text-warning {
        color: #856404;
      }
      .data-preview {
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 4px;
      }
      .data-preview h6 {
        margin-bottom: 10px;
        color: #155724;
        font-weight: 600;
        font-size: 13px;
      }
      .preview-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 12px;
      }
      .preview-item strong {
        color: #155724;
      }
      .preview-item span {
        color: #155724;
      }
      .upload-error {
        margin-top: 15px;
        padding: 15px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 6px;
      }
      .error-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .error-header i {
        font-size: 16px;
        color: #dc3545;
      }
      .error-header h6 {
        margin: 0;
        color: #721c24;
        font-weight: 600;
      }
      .error-details {
        margin-bottom: 12px;
      }
      .error-details p {
        margin-bottom: 8px;
        color: #721c24;
        font-size: 13px;
      }
      .error-list h6 {
        margin-bottom: 6px;
        color: #721c24;
        font-weight: 600;
        font-size: 13px;
      }
      .error-list ul {
        margin: 0;
        padding-left: 15px;
        color: #721c24;
        font-size: 12px;
      }
      .error-list li {
        margin-bottom: 3px;
      }
      @media (max-width: 768px) {
        .excel-upload {
          padding: 15px;
        }
        .upload-header {
          flex-direction: column;
          gap: 10px;
          align-items: flex-start;
        }
        .upload-area {
          padding: 20px 12px;
        }
        .upload-content i {
          font-size: 28px;
        }
        .upload-content h6 {
          font-size: 14px;
        }
        .upload-success,
        .upload-error {
          padding: 12px;
        }
        .detail-item,
        .preview-item {
          flex-direction: column;
          gap: 3px;
          align-items: flex-start;
        }
      }
    `
  ]
})
export class ExcelUploadComponent {
  @Output() dataLoaded = new EventEmitter<{ system: { voltage: number; phases: number; frequency: number }; superficies: Array<{ name: string; area: number; type: string }>; consumos: Array<{ name: string; power: number; quantity: number; type: string }> }>();

  isUploading = false;
  uploadResult: IngestExcelResponse | null = null;
  error: string | null = null;

  private aiService = inject(AiService);

  /**
   * Maneja la selección de archivo
   */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  /**
   * Sube el archivo Excel
   */
  private uploadFile(file: File): void {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.error = 'Solo se permiten archivos Excel (.xlsx, .xls)';
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error = 'El archivo es demasiado grande. Máximo 5MB';
      return;
    }

    this.isUploading = true;
    this.error = null;
    this.uploadResult = null;

    this.aiService.ingestExcel(file).subscribe({
      next: (result) => {
        this.isUploading = false;
        this.uploadResult = result;

        if (result.success && result.data) {
          this.dataLoaded.emit(result.data);
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.error = error.message;
      }
    });
  }

  /**
   * Limpia el resultado
   */
  clearResult(): void {
    this.uploadResult = null;
    this.error = null;
  }

  /**
   * Descarga el template de ejemplo
   */
  downloadTemplate(): void {
    const templateData = [
      ['name', 'type', 'value', 'unit'],
      ['voltage', 'system', 120, 'V'],
      ['phases', 'system', 1, ''],
      ['frequency', 'system', 60, 'Hz'],
      ['Sala', 'superficie', 25, 'm2'],
      ['Cocina', 'superficie', 15, 'm2'],
      ['TV', 'consumo', 100, 'W'],
      ['Refrigerador', 'consumo', 800, 'W'],
      ['Aire Acondicionado', 'consumo', 1500, 'W']
    ];

    const csvContent = templateData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_calculo_electrico.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
