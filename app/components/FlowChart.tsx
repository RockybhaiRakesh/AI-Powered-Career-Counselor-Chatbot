'use client';

import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const FlowChart = ({ steps, currentStep }: { steps: any[]; currentStep: number }) => {
  // Refers to the div containing the actual flowchart content to be captured
  const flowChartContentRef = useRef<HTMLDivElement>(null);

  // Function to download the flowchart as a PDF
  const downloadAsPDF = useCallback(async () => {
    if (!flowChartContentRef.current) return;

    const originalOverflow = flowChartContentRef.current.style.overflow;
    const originalMaxHeight = flowChartContentRef.current.style.maxHeight;
    flowChartContentRef.current.style.overflow = 'visible';
    flowChartContentRef.current.style.maxHeight = 'none';

    try {
      const canvas = await html2canvas(flowChartContentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#DBEAFE',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages if needed
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('career-path-flowchart.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      flowChartContentRef.current.style.overflow = originalOverflow;
      flowChartContentRef.current.style.maxHeight = originalMaxHeight;
    }
  }, []);

  // Function to download the flowchart as a PNG image  
  const downloadAsPNG = useCallback(async () => {
    if (!flowChartContentRef.current) return;

    // Temporarily remove overflow styles to ensure full content is rendered for capture
    const originalOverflow = flowChartContentRef.current.style.overflow;
    const originalMaxHeight = flowChartContentRef.current.style.maxHeight;
    flowChartContentRef.current.style.overflow = 'visible';
    flowChartContentRef.current.style.maxHeight = 'none';

    try {
      const canvas = await html2canvas(flowChartContentRef.current, {
        scale: 2, // Increase scale for higher resolution
        logging: false,
        useCORS: true,
        backgroundColor: '#DBEAFE', // Match the background color for accurate capture
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'career-path-flowchart.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating PNG:', error);
      // In a real app, you'd show a user-friendly error message here
    } finally {
      // Revert overflow styles after capture
      flowChartContentRef.current.style.overflow = originalOverflow;
      flowChartContentRef.current.style.maxHeight = originalMaxHeight;
    }
  }, []);

  return (
    <div className="flex flex-col items-center p-4 bg-white bg-opacity-90 rounded-2xl shadow-xl border border-gray-200">
      {/* This div is the scrollable container on the screen */}
      <div
        ref={flowChartContentRef} // This ref is now on the content that needs to be captured
        className="w-48 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar p-2" // Reduced width and max height
        style={{ backgroundColor: '#DBEAFE' }} // Tailwind's blue-100
      >
        <h3
          className="text-xl font-bold mb-4 text-center"
          style={{ color: '#1E40AF' }} // Tailwind's blue-800
        >
          Your Career Path
        </h3>
        <div className="space-y-4"> {/* Adjusted spacing */}
          {steps.map((step, index) => (
            <div key={index}> {/* Wrapper for step and connector */}
              <div
                className={`flex items-start ${index <= currentStep ? 'opacity-100' : 'opacity-50'}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm mr-3" // Reduced circle size and font size
                  style={{
                    backgroundColor:
                      index < currentStep
                        ? '#22C55E' // green-500
                        : index === currentStep
                        ? '#2563EB' // blue-600
                        : '#9CA3AF', // gray-400
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div style={{ color: '#1F2937', fontSize: '0.85rem' }} className="font-medium">
                    {step.title}
                  </div>
                  {step.value && (
                    <div
                      className="mt-1 rounded px-2 py-1 text-xs max-w-xs break-words" // Reduced font size & padding
                      style={{
                        backgroundColor: '#E0F2FE', // blue-50
                        color: '#1E40AF', // blue-800
                      }}
                    >
                      {Array.isArray(step.value) ? step.value.join(', ') : step.value}
                    </div>
                  )}
                </div>
              </div>
              {/* Vertical connector line - now outside the step content div */}
              {index < steps.length - 1 && (
                <div
                  className="h-4 w-1 ml-4 my-1" // Reduced connector line height
                  style={{
                    backgroundColor:
                      index < currentStep ? '#22C55E' : '#D1D5DB', // green-500 or gray-300
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="mt-6 flex flex-col space-y-3 w-full"> {/* Vertical buttons */}
        <button
          onClick={downloadAsPDF}
          className="py-3 px-6 rounded-full text-lg font-bold transition-all duration-300 ease-in-out
                     bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <span className="inline-block mr-2">📄</span> Download as PDF
        </button>
        <button
          onClick={downloadAsPNG}
          className="py-3 px-6 rounded-full text-lg font-bold transition-all duration-300 ease-in-out
                     bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <span className="inline-block mr-2">🖼️</span> Download as PNG
        </button>
      </div>
    </div>
  );
};

export default FlowChart;
