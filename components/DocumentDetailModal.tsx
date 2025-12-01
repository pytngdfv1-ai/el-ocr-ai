import React, { useState } from 'react';
import { Document, QnaItem } from '../types';
import { CloseIcon, CalendarIcon, UserIcon, TagIcon, ExportIcon, DescriptionIcon, RecipientIcon, DocumentIcon, SparklesIcon, ErrorIcon, GlobeIcon } from './Icons';
import { answerQuestionAboutDocument, searchWebForInformation } from '../services/geminiService';

interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
  onUpdateDocument: (document: Document) => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document, onClose, onUpdateDocument }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [question, setQuestion] = useState('');
  const [qnaHistory, setQnaHistory] = useState<QnaItem[]>(document.qnaHistory || []);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [qnaError, setQnaError] = useState<string | null>(null);

  const handleExportSearchablePdf = async () => {
    setIsGeneratingPdf(true);
    try {
        // @ts-ignore - jsPDF está cargado globalmente desde un script
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 40;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = document.imagenUrl;
        
        img.onload = () => {
            // Page 1: Image
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min((pageWidth - margin * 2) / imgWidth, (pageHeight - margin * 2) / imgHeight);
            const canvasWidth = imgWidth * ratio;
            const canvasHeight = imgHeight * ratio;
            const x = (pageWidth - canvasWidth) / 2;
            const y = (pageHeight - canvasHeight) / 2;

            doc.addImage(img, 'PNG', x, y, canvasWidth, canvasHeight);
            
            // Page 2: OCR Text
            doc.addPage();
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);

            const textLines = doc.splitTextToSize(document.textoOCR, pageWidth - margin * 2);
            doc.text(textLines, margin, margin);

            // Page 3: Summary
            doc.addPage();
            doc.setFontSize(16);
            doc.setFont('Helvetica', 'bold');
            doc.text('Resumen del Documento', margin, margin);
            
            doc.setFontSize(12);
            doc.setFont('Helvetica', 'normal');
            const summaryLines = doc.splitTextToSize(document.metadata.resumen, pageWidth - margin * 2);
            doc.text(summaryLines, margin, margin + 30);

            // Page 4: Chat History (if it exists)
            if (qnaHistory && qnaHistory.length > 0) {
                doc.addPage();
                doc.setFontSize(16);
                doc.setFont('Helvetica', 'bold');
                doc.text('Historial de Chat con IA', margin, margin);

                doc.setFontSize(10);
                let currentY = margin + 30;

                qnaHistory.forEach(item => {
                    const questionLines = doc.splitTextToSize(`P: ${item.question}`, pageWidth - margin * 2);
                    const answerLines = doc.splitTextToSize(`R: ${item.answer}`, pageWidth - margin * 2 - 10);
                    const blockHeight = (questionLines.length * 12) + (answerLines.length * 12) + 15;

                    if (currentY + blockHeight > pageHeight - margin) {
                        doc.addPage();
                        currentY = margin;
                    }

                    doc.setFont('Helvetica', 'bold');
                    doc.text(questionLines, margin, currentY);
                    currentY += questionLines.length * 12;

                    doc.setFont('Helvetica', 'normal');
                    doc.text(answerLines, margin + 10, currentY + 5);
                    currentY += answerLines.length * 12 + 15;
                });
            }
            
            const filename = document.nombreArchivo.replace(/\.[^/.]+$/, "") + "_buscable.pdf";
            doc.save(filename);
            setIsGeneratingPdf(false);
        };
        img.onerror = () => {
            console.error("No se pudo cargar la imagen para la exportación a PDF.");
            alert("Hubo un error al cargar la imagen del documento para crear el PDF.");
            setIsGeneratingPdf(false);
        }
    } catch (e) {
        console.error("Error al generar PDF buscable:", e);
        alert("Hubo un error inesperado al generar el PDF. Por favor, inténtalo de nuevo.");
        setIsGeneratingPdf(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    
    const html = escapedText
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
    return { __html: html };
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAnswering(true);
    setQnaError(null);

    try {
        const answer = await answerQuestionAboutDocument(document.textoOCR, question);
        const newHistory = [...qnaHistory, { question, answer, type: 'internal' as const }];
        setQnaHistory(newHistory);
        onUpdateDocument({ ...document, qnaHistory: newHistory });
        setQuestion('');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        setQnaError(errorMessage);
    } finally {
        setIsAnswering(false);
    }
  };

  const handleSearchWeb = async () => {
    if (!question.trim()) return;

    setIsSearchingWeb(true);
    setQnaError(null);

    try {
      const { answer, sources } = await searchWebForInformation(document.textoOCR, question);
      const newHistory: QnaItem[] = [...qnaHistory, { question, answer, type: 'web' as const, sources }];
      setQnaHistory(newHistory);
      onUpdateDocument({ ...document, qnaHistory: newHistory });
      setQuestion('');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setQnaError(errorMessage);
    } finally {
      setIsSearchingWeb(false);
    }
  };


  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity no-print"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto printable-area-container">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl printable-area">
            <div className="bg-white dark:bg-slate-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4 printable-content">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-50" id="modal-title">
                        {document.nombreArchivo}
                    </h3>
                    <button
                        type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center no-print"
                        onClick={onClose}
                    >
                        <CloseIcon className="w-5 h-5"/>
                        <span className="sr-only">Cerrar modal</span>
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Image & Metadata */}
                    <div>
                        <img src={document.imagenUrl} alt={`Documento ${document.nombreArchivo}`} className="w-full rounded-lg border dark:border-slate-700" />
                        <div className="mt-4 space-y-4 pt-4 border-t dark:border-slate-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start">
                                    <UserIcon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Remitente</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{document.metadata.remitente}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <RecipientIcon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Destinatario</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{document.metadata.destinatario}</p>
                                    </div>
                                </div>
                                {document.metadata.fecha && (
                                    <div className="flex items-start">
                                        <CalendarIcon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{document.metadata.fecha}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start">
                                    <DocumentIcon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tipo de Documento</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{document.metadata.tipoDocumento}</p>
                                    </div>
                                </div>
                            </div>
                             <div className="flex items-start">
                                <DescriptionIcon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Resumen</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{document.metadata.resumen}</p>
                                </div>
                             </div>
                             <div className="flex items-start">
                                <TagIcon className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500 mr-3 mt-0.5"/>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Etiquetas</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                    {document.metadata.etiquetas.map(tag => (
                                        <span key={tag} className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20">
                                            {tag}
                                        </span>
                                    ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                    {/* Right Column: OCR Text & Q&A */}
                    <div className="flex flex-col">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">Texto Extraído (OCR)</h4>
                        <div 
                            className="mt-2 flex-shrink h-[20rem] overflow-y-auto rounded-md border bg-gray-50 dark:bg-slate-900 dark:border-slate-700 p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={renderFormattedText(document.textoOCR)}
                        >
                        </div>
                        
                        <div className="mt-4 pt-4 border-t dark:border-slate-700 flex-grow flex flex-col">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                              <SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />
                              Pregúntale a tu Documento
                          </h4>
                          
                          <div className="mt-2 space-y-4 flex-grow overflow-y-auto pr-2 min-h-[6rem]">
                            {qnaHistory.map((item, index) => (
                                <div key={index}>
                                    <p className="font-semibold text-sm text-gray-600 dark:text-gray-400">{item.question}</p>
                                    <div className="text-sm text-gray-800 dark:text-gray-200 bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md mt-1 whitespace-pre-wrap">
                                        {item.type === 'web' && (
                                            <div className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 mb-2 font-medium">
                                                <GlobeIcon className="w-4 h-4 mr-1.5" />
                                                <span>Respuesta de la web</span>
                                            </div>
                                        )}
                                        <p>{item.answer}</p>
                                        {item.type === 'web' && item.sources && item.sources.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                                                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400">Fuentes:</h5>
                                                <ul className="list-decimal list-inside mt-1 space-y-1">
                                                    {item.sources.filter(source => source.web && source.web.uri).map((source, idx) => (
                                                        <li key={idx} className="text-xs truncate">
                                                            <a
                                                                href={source.web.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                                                title={source.web.title}
                                                            >
                                                                {source.web.title || source.web.uri}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 flex-shrink-0">
                              <div className="flex items-start space-x-2">
                                  <input
                                      type="text"
                                      value={question}
                                      onChange={(e) => setQuestion(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isAnswering && !isSearchingWeb) {
                                          if (e.shiftKey) {
                                              handleSearchWeb();
                                          } else {
                                              handleAskQuestion();
                                          }
                                        }
                                      }}
                                      placeholder="Pregunta (Enter) o busca en web (Shift+Enter)"
                                      className="block w-full rounded-md border-0 bg-white dark:bg-slate-700 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
                                      disabled={isAnswering || isSearchingWeb}
                                  />
                                  <button
                                      onClick={handleAskQuestion}
                                      disabled={isAnswering || isSearchingWeb || !question.trim()}
                                      title="Preguntar al documento (Enter)"
                                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-700 disabled:cursor-not-allowed flex-shrink-0"
                                  >
                                      {isAnswering ? (
                                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                      ) : (
                                        <SparklesIcon className="w-5 h-5" />
                                      )}
                                  </button>
                                  <button
                                      onClick={handleSearchWeb}
                                      disabled={isAnswering || isSearchingWeb || !question.trim()}
                                      title="Buscar en la web (Shift + Enter)"
                                      className="inline-flex items-center justify-center rounded-md bg-sky-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:bg-sky-400 dark:disabled:bg-sky-700 disabled:cursor-not-allowed flex-shrink-0"
                                  >
                                      {isSearchingWeb ? (
                                           <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                      ) : (
                                        <GlobeIcon className="w-5 h-5" />
                                      )}
                                  </button>
                              </div>
                              {qnaError && 
                                <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <ErrorIcon className="w-4 h-4 mr-1"/> {qnaError}
                                </div>
                              }
                          </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 no-print border-t dark:border-slate-700">
               <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                onClick={handleExportSearchablePdf}
                disabled={isGeneratingPdf}
              >
                <ExportIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                {isGeneratingPdf ? 'Generando...' : 'Exportar con OCR (PDF)'}
              </button>
               <button
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;