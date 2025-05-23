'use client';

import { useState, useEffect, useCallback } from 'react';

type ToolInput = string | { [key: string]: any };

export default function CareerCounselorPage() {
  const [group, setGroup] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState<string>('');
  const [interest, setInterest] = useState<string[]>([]);
  const [course, setCourse] = useState<string>('');
  const [college, setCollege] = useState<string>('');
  const [exam, setExam] = useState<string>('');
  const [cutoff, setCutoff] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [step, setStep] = useState<number>(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const callTool = useCallback(async (tool: string, input?: ToolInput): Promise<any> => {
    if (!baseUrl) {
      console.warn("Base URL not set, skipping API call for tool:", tool);
      return;
    }

    const url = `${baseUrl}/api/tool`;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, input }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API call failed for tool "${tool}": ${errorData.error || res.statusText}`);
      }

      return res.json();
    } catch (err: any) {
      console.error(`Error in callTool (${tool}):`, err);
      setError(`Failed to fetch data: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const handleNext = async (value?: string) => {
    try {
      setError(null);

      switch (step) {
        case 0:
          if (!value) {
            alert('Please select a subject group.');
            return;
          }
          setGroup(value);
          const fetchedSubjects = await callTool('subject', value);
          if (fetchedSubjects) {
            setOptions(fetchedSubjects);
            setSelectedOptions(fetchedSubjects.reduce((acc: Record<string, boolean>, curr: string) => {
              acc[curr] = false;
              return acc;
            }, {}));
            setStep(1);
          }
          break;
        case 1:
          const currentlySelectedSubjects = Object.entries(selectedOptions)
            .filter(([_, isChecked]) => isChecked)
            .map(([subject]) => subject);

          if (customSubject.trim()) {
            const parsedCustomSubjects = customSubject.split(',').map(s => s.trim()).filter(s => s !== '');
            currentlySelectedSubjects.push(...parsedCustomSubjects);
          }

          if (currentlySelectedSubjects.length === 0) {
            alert('Please select at least one subject or enter custom subjects.');
            return;
          }

          setSubjects(Array.from(new Set(currentlySelectedSubjects)));
          const interests = await callTool('interest', currentlySelectedSubjects.join(', '));
          if (interests) {
            setOptions(interests);
            setSelectedOptions(interests.reduce((acc: Record<string, boolean>, curr: string) => {
              acc[curr] = false;
              return acc;
            }, {}));
            setStep(2);
          }
          break;
        case 2:
          const currentlySelectedInterests = Object.entries(selectedOptions)
            .filter(([_, isChecked]) => isChecked)
            .map(([interestName]) => interestName);

          if (currentlySelectedInterests.length === 0) {
            alert('Please select at least one interest.');
            return;
          }

          setInterest(currentlySelectedInterests);
          const courses = await callTool('course', { interest: currentlySelectedInterests.join(', '), group });
          if (courses) {
            setOptions(courses);
            setStep(3);
          }
          break;
        case 3:
          if (!value) {
            alert('Please select a course.');
            return;
          }
          setCourse(value);
          const colleges = await callTool('college', value);
          if (colleges) {
            setOptions(colleges);
            setStep(4);
          }
          break;
        case 4:
          if (!value) {
            alert('Please select a college.');
            return;
          }
          setCollege(value);
          const exams = await callTool('exam', { college: value, course });
          if (exams) {
            setOptions(exams);
            setStep(5);
          }
          break;
        case 5:
          if (!value) {
            alert('Please select an exam.');
            return;
          }
          setExam(value);
          const cutoffRes = await callTool('cutoff', { exam: value, college });
          if (cutoffRes) {
            setCutoff(cutoffRes);

            const summaryRes = await callTool('summary', {
              group,
              subjects: subjects.join(', '),
              interest: interest.join(', '),
              course,
              college,
              exam: value,
              cutoff: cutoffRes
            });
            if (summaryRes) {
              setSummary(summaryRes);
              setStep(6);
            }
          }
          break;
      }
    } catch (err: any) {
      console.error("Error in handleNext:", err);
      setError(`An error occurred: ${err.message}`);
    }
  };

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const toggleSelectAll = (isSelected: boolean) => {
    const newSelectedOptions: Record<string, boolean> = {};
    options.forEach(option => {
      newSelectedOptions[option] = isSelected;
    });
    setSelectedOptions(newSelectedOptions);
  };

  const startOver = useCallback(async () => {
    try {
      setError(null);
      const groups = await callTool('subject_group');
      if (groups) {
        setOptions(groups);
        setGroup('');
        setSubjects([]);
        setCustomSubject('');
        setInterest([]);
        setCourse('');
        setCollege('');
        setExam('');
        setCutoff('');
        setSummary('');
        setSelectedOptions({});
        setStep(0);
      }
    } catch (err: any) {
      console.error("Error starting over:", err);
      setError(`Could not start over: ${err.message}`);
    }
  }, [callTool]);

  useEffect(() => {
    if (options.length === 0 && step === 0 && baseUrl) {
      startOver();
    }
  }, [options.length, step, baseUrl, startOver]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-700 to-purple-500 p-6 flex flex-col items-center justify-center font-sans">
      {/* Background - Multiple overlapping radial gradients for RGB 3D effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-purple-900 to-black opacity-80 animate-bg-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-red-800 via-pink-800 to-transparent opacity-60 animate-bg-pulse-delay"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-green-700 via-yellow-700 to-transparent opacity-40 animate-bg-pulse-more-delay"></div>

      {/* Main Content Card */}
      <div className="relative z-10 bg-white bg-opacity-95 p-10 rounded-3xl shadow-3xl max-w-2xl w-full text-center space-y-8 border-t-8 border-b-8 border-l-4 border-r-4 border-gradient-to-r from-blue-600 via-purple-600 to-red-600 transform perspective-1000 rotateY-3D animate-card-appear">
        <h1 className="text-4xl font-extrabold text-gray-900 drop-shadow-lg leading-tight mb-6" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1), 4px 4px 0px rgba(70,130,180,0.3), 6px 6px 0px rgba(138,43,226,0.2)' }}>
          <span className="inline-block transform rotate-[-5deg] text-red-600 mr-2">🚀</span>
          AI POWERED CAREER COUNSELING BOT
          <span className="inline-block transform rotate-[5deg] text-green-600 ml-2">💡</span>
        </h1>

        {error && (
          <div className="bg-red-200 border-l-4 border-red-600 text-red-900 px-6 py-4 rounded-md relative text-left shadow-md transform translateZ-10 animate-fade-in">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {step < 6 && (
          <div>
            <p className="text-2xl font-semibold text-gray-800 mb-8 leading-relaxed transform translateZ-50 animate-fade-in-up-stagger">
              {[
                'Choose your **12TH subject group** to begin your journey:',
                `Alright, let's select the **subjects** within ${group}:`,
                `Intriguing! What sparks your primary **interests** from these subjects?`,
                `Excellent! Now, explore potential **courses** that align with your interests:`,
                `Fantastic! Next, select a **college** where you envision yourself studying ${course}:`,
                `Almost there! Finally, pick an **entrance exam** relevant to ${college} and ${course}:`,
              ][step].split('**').map((part, i) => i % 2 === 1 ? <b key={i} className="text-blue-700 text-shadow-md">{part}</b> : part)}
            </p>

            {isLoading && (
              <div className="mt-6 text-blue-700 font-bold text-xl flex items-center justify-center animate-pulse-fade transform translateZ-20">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fetching exciting options for you...
              </div>
            )}

            {!isLoading && options.length === 0 && step !== 6 && (
              <div className="mt-6 text-gray-600 text-xl transform translateZ-20 animate-fade-in">Hmm, no options found. Let's try again or adjust previous choices.</div>
            )}

            {step === 1 || step === 2 ? (
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-center mb-4 transform translateZ-30 animate-fade-in">
                  <input
                    type="checkbox"
                    id="selectAll"
                    className="mr-3 h-6 w-6 text-blue-700 border-gray-400 rounded-md shadow-md focus:ring-blue-600 cursor-pointer transition duration-150 ease-in-out"
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    checked={Object.values(selectedOptions).every(Boolean) && options.length > 0}
                  />
                  <label htmlFor="selectAll" className="text-gray-800 font-semibold text-lg cursor-pointer text-shadow-sm">Select All</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto border border-blue-400 rounded-xl bg-blue-50 shadow-inner-lg p-4 custom-scrollbar transform translateZ-40 animate-fade-in-up-stagger">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center group bg-white p-3 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-100 transition duration-200 transform hover:scale-103 cursor-pointer">
                      <input
                        type="checkbox"
                        id={`${step === 1 ? 'subject' : 'interest'}-${idx}`}
                        className="mr-3 h-5 w-5 text-blue-700 border-gray-400 rounded focus:ring-blue-600 cursor-pointer transition duration-150 ease-in-out"
                        checked={selectedOptions[opt] || false}
                        onChange={() => toggleOption(opt)}
                      />
                      <label htmlFor={`${step === 1 ? 'subject' : 'interest'}-${idx}`} className="text-gray-900 text-lg flex-grow hover:text-blue-800 font-medium transition duration-200 text-shadow-xs">
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>

                {step === 1 && (
                  <div className="mt-6 transform translateZ-50 animate-fade-in-up-stagger">
                    <label htmlFor="customSubject" className="block mb-3 text-gray-800 text-lg font-medium text-shadow-sm">Or add your own **unique subject(s)** (comma-separated):</label>
                    <input
                      type="text"
                      id="customSubject"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="border border-blue-500 p-4 w-full rounded-lg shadow-lg focus:ring-blue-700 focus:border-blue-700 text-black placeholder-gray-500 text-lg bg-blue-50 transition duration-200 ease-in-out transform hover:scale-100.5"
                      placeholder="e.g., Data Science, Renewable Energy, Digital Art"
                    />
                  </div>
                )}

                <button
                  className="mt-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 rounded-full hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition duration-300 ease-in-out font-bold text-2xl shadow-3d transform hover:scale-105 active:scale-95 animate-button-pop"
                  onClick={() => handleNext()}
                  disabled={isLoading}
                >
                  <span className="relative z-10">Proceed to Next Step</span>
                  <span className="absolute inset-0 rounded-full bg-white opacity-20 blur-sm transform scale-x-0 group-hover:scale-x-100 transition duration-300"></span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white px-10 py-5 rounded-full hover:from-blue-600 hover:via-purple-600 hover:to-red-600 transition duration-300 ease-in-out font-semibold text-xl shadow-3d transform hover:scale-105 active:scale-95 animate-button-pop"
                    onClick={() => handleNext(opt)}
                    disabled={isLoading}
                  >
                    <span className="relative z-10">{opt}</span>
                    <span className="absolute inset-0 rounded-full bg-white opacity-20 blur-sm transform scale-x-0 group-hover:scale-x-100 transition duration-300"></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="text-left space-y-6 mt-10 bg-blue-50 p-8 rounded-3xl border-l-8 border-r-8 border-blue-700 shadow-3xl animate-fade-in-up">
            <h2 className="text-3xl font-bold text-blue-900 mb-5 text-shadow-md">🌟 Your Personalized Career Compass Points To:</h2>
            <p className="text-gray-800 text-xl">
              🎯 **Predicted Exam Cutoff for {exam}**: <br />
              <code className="block bg-blue-100 p-4 rounded-lg text-blue-900 font-mono text-base whitespace-pre-wrap mt-2 border border-blue-300 shadow-inner-lg text-shadow-xs">{cutoff}</code>
            </p>
            <p className="text-gray-800 text-xl">
              📘 **Your Chosen Subjects**: <span className="font-semibold text-blue-800 text-shadow-xs">{subjects.join(', ')}</span>
            </p>
            <p className="text-gray-800 text-xl">
              💡 **Areas of Interest**: <span className="font-semibold text-blue-800 text-shadow-xs">{interest.join(', ')}</span>
            </p>
            <p className="text-gray-800 text-xl">
              📖 **In Summary**:
            </p>
            <blockquote className="bg-white p-6 rounded-xl border border-blue-300 shadow-2xl text-black whitespace-pre-wrap leading-relaxed text-lg italic custom-blockquote transform translateZ-20">
              {summary}
            </blockquote>
            <button
              className="mt-10 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-10 py-5 rounded-full hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition duration-300 ease-in-out font-bold text-2xl shadow-3d transform hover:scale-105 active:scale-95 animate-button-pop"
              onClick={startOver}
            >
              <span className="inline-block mr-2 relative z-10">🔄</span> <span className="relative z-10">Explore Another Path</span>
              <span className="absolute inset-0 rounded-full bg-white opacity-20 blur-sm transform scale-x-0 group-hover:scale-x-100 transition duration-300"></span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}