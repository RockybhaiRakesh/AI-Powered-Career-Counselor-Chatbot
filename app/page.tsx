'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ChatBot from '@/app/components/ChatBot';
import Navbar from '@/app/components/Navbar';
import FlowChart from '@/app/components/FlowChart';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showChat, setShowChat] = useState(false);

  const [history, setHistory] = useState<Array<{
    step: number;
    options: string[];
    selectedOptions: Record<string, boolean>;
    searchQuery: string;
    group?: string;
    subjects?: string[];
    interest?: string[];
    course?: string;
    college?: string;
    exam?: string;
    cutoff?: string;
    summary?: string;
    customSubject?: string;
  }>>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const flowSteps = useMemo(() => [
    { title: 'Subject Group', value: group },
    { title: 'Subjects', value: subjects },
    { title: 'Interests', value: interest },
    { title: 'Course', value: course },
    { title: 'College', value: college },
    { title: 'Exam', value: exam },
    { title: 'Summary', value: '' }
  ], [group, subjects, interest, course, college, exam]);

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

  const handlePrevious = useCallback(() => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
      setHistory(prev => prev.slice(0, prev.length - 1));

      setStep(prevState.step);
      setOptions(prevState.options);
      setSelectedOptions(prevState.selectedOptions);
      setSearchQuery(prevState.searchQuery);
      if (prevState.group !== undefined) setGroup(prevState.group);
      if (prevState.subjects !== undefined) setSubjects(prevState.subjects);
      if (prevState.interest !== undefined) setInterest(prevState.interest);
      if (prevState.course !== undefined) setCourse(prevState.course);
      if (prevState.college !== undefined) setCollege(prevState.college);
      if (prevState.exam !== undefined) setExam(prevState.exam);
      if (prevState.cutoff !== undefined) setCutoff(prevState.cutoff);
      if (prevState.summary !== undefined) setSummary(prevState.summary);
      if (prevState.customSubject !== undefined) setCustomSubject(prevState.customSubject);

      setError(null);
    }
  }, [history]);

  const handleNext = async (value?: string) => {
    setHistory(prev => [...prev, {
      step,
      options,
      selectedOptions,
      searchQuery,
      group, subjects, interest, course, college, exam, cutoff, summary, customSubject
    }]);

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
            setSearchQuery('');
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
          const interests = await callTool('interest', currentlySelectedSubjects);
          if (interests) {
            setOptions(interests);
            setSelectedOptions(interests.reduce((acc: Record<string, boolean>, curr: string) => ({ ...acc, [curr]: false }), {}));
            setSearchQuery('');
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
          const courses = await callTool('course', { interest: currentlySelectedInterests, group });
          if (courses) {
            setOptions(courses);
            setSearchQuery('');
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
            setSearchQuery('');
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
            setSearchQuery('');
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
    filteredOptions.forEach(option => {
      newSelectedOptions[option] = isSelected;
    });
    Object.keys(selectedOptions).forEach(key => {
      if (!newSelectedOptions[key] && selectedOptions[key]) {
        newSelectedOptions[key] = true;
      }
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
        setSearchQuery('');
        setStep(0);
        setHistory([]);
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

  const filteredOptions = useMemo(() => {
    if (searchQuery === '' || !(step === 1 || step === 2)) {
      return options;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return options.filter(option =>
      option.toLowerCase().includes(lowerCaseQuery)
    );
  }, [options, searchQuery, step]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen relative overflow-hidden font-sans bg-gradient to-black">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-30 opacity-90" 
             style={{ backgroundImage: "url('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG90dG10enRvcTJ2dWZtaTZydHA1bHBrZXdydTlsNWphaXhyMDc2aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ITRemFlr5tS39AzQUL/giphy.gif')" }}>
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 py-20 md:py-24 lg:py-28 flex flex-col lg:flex-row gap-8">
          {/* Flow Chart - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block lg:w-1/4 xl:w-1/5 sticky top-24 h-fit">
            <FlowChart steps={flowSteps} currentStep={step} />
          </div>

          {/* Main Content Card */}
          <div className="w-full lg:w-2/4 xl:w-3/5 bg-[url('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTJyMWg5YTYzNmo5Z3Y3bTg5YWw1b3J0MndkdWQxank4dmt3ZTZ1cyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/doXBzUFJRxpaUbuaqz/giphy.gif')] bg-cover bg-center bg-no-repeat bg-opacity-95 p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border-t-8 border-b-8 border-l-4 border-r-4 border-gradient-to-r from-blue-600 via-purple-600 to-red-600 transform perspective-1000">
  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white-900 leading-tight mb-6 text-center">
    <span className="inline-block transform rotate-[-5deg] text-white-600 mr-2">🚀</span>
    AI POWERED CAREER COUNSELING BOT<span className="inline-block transform rotate-[5deg] text-green-600 ml-2">💡</span>
  </h1>

  {error && (
    <div className="bg-red-200 border-l-4 border-red-600 text-red-900 px-4 py-3 sm:px-6 sm:py-4 rounded-md relative text-left shadow-md mb-6">
      <strong className="font-bold">Error!</strong>
      <span className="block sm:inline ml-2">{error}</span>
    </div>
            )}

            {step < 6 && (
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white-800 mb-6 sm:mb-8 text-center">
                  {[
                    'Choose your 12TH subject group to begin your journey:',
                    `Alright, let's select the subjects within ${group}:`,
                    `Intriguing! Select your interests related to ${subjects.join(', ')}:`,
                    `Excellent! Now, explore potential courses that align with your interests:`,
                    `Fantastic! Next, select a college where you envision yourself studying ${course}:`,
                    `Almost there! Finally, pick an entrance exam relevant to ${college} and ${course}:`,
                  ][step]}
                </p>

                {isLoading && (
                  <div className="my-8 text-blue-700 font-bold text-lg sm:text-xl flex items-center justify-center">
                    <img
                      src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjdqbDd5eXh1dm5oeHcweDA1NGV2YTE4cDdpMGY3NTFpeXh2OTB2ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/UQVRBjPL7Kd5NR7ZCt/giphy.gif"
                      alt="AI Bot GIF"
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 inline-block"
                    />
                  </div>
                )}

                {!isLoading && options.length === 0 && step !== 6 && (
                  <div className="my-6 text-gray-600 text-lg sm:text-xl text-center">Hmm, no options found. Let's try again or adjust previous choices.</div>
                )}

                {step > 0 && (
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <button
                      className="bg-gray-300 text-gray-800 px-4 py-2 sm:px-6 sm:py-3 rounded-full hover:bg-gray-400 transition duration-300 ease-in-out font-bold text-base sm:text-lg shadow-md mr-4"
                      onClick={handlePrevious}
                      disabled={isLoading}
                    >
                      ← Previous
                    </button>
                  </div>
                )}

                {step === 1 || step === 2 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {(step === 1 || step === 2) && (
                      <div className="mb-4">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="border border-blue-500 p-3 sm:p-4 w-full rounded-lg shadow-lg focus:ring-blue-700 focus:border-blue-700 text-black placeholder-gray-500 text-base sm:text-lg bg-blue-50"
                          placeholder={`Search for ${step === 1 ? 'subjects' : 'interests'}...`}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-center mb-4">
                      <input
                        type="checkbox"
                        id="selectAll"
                        className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-blue-700 border-gray-400 rounded-md shadow-md focus:ring-blue-600 cursor-pointer"
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        checked={filteredOptions.length > 0 && filteredOptions.every(opt => selectedOptions[opt])}
                      />
                      <label htmlFor="selectAll" className="text-gray-800 font-semibold text-base sm:text-lg cursor-pointer">Select All Visible</label>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 max-h-60 sm:max-h-80 overflow-y-auto border border-blue-400 rounded-xl bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 shadow-inner-lg p-3 sm:p-4 custom-scrollbar">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex items-center group bg-white bg-opacity-80 p-2 sm:p-3 rounded-lg shadow-sm hover:shadow-md hover:bg-opacity-100 transition duration-200 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              id={`${step === 1 ? 'subject' : 'interest'}-${idx}`}
                              className="mr-3 h-4 w-4 sm:h-5 sm:w-5 text-blue-700 border-gray-400 rounded focus:ring-blue-600 cursor-pointer"
                              checked={selectedOptions[opt] || false}
                              onChange={() => toggleOption(opt)}
                            />
                            <label
                              htmlFor={`${step === 1 ? 'subject' : 'interest'}-${idx}`}
                              className="text-gray-900 text-base sm:text-lg flex-grow hover:text-blue-800 font-medium"
                            >
                              {opt}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center text-gray-100 py-4">No matching options found.</div>
                      )}
                    </div>

                    {step === 1 && (
                      <div className="mt-4 sm:mt-6">
                        <label htmlFor="customSubject" className="block mb-2 sm:mb-3 text-gray-800 text-base sm:text-lg font-medium">Add your language subject in 12th Group:</label>
                        <input
                          type="text"
                          id="customSubject"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          className="border border-blue-500 p-3 sm:p-4 w-full rounded-lg shadow-lg focus:ring-blue-700 focus:border-blue-700 text-black placeholder-gray-500 text-base sm:text-lg bg-blue-50"
                          placeholder="e.g., Tamil, Hindi, French (your optional choice)"
                        />
                      </div>
                    )}

                    <div className="flex justify-center mt-6 sm:mt-8">
                      <button
                        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition duration-300 ease-in-out font-bold text-lg sm:text-xl shadow-lg"
                        onClick={() => handleNext()}
                        disabled={isLoading}
                      >
                        Proceed to Next Step
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 mt-6 sm:mt-8">
                    {options.map((opt, idx) => (
                      <button
                        key={idx}
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-full hover:from-blue-600 hover:via-purple-600 hover:to-red-600 transition duration-300 ease-in-out font-semibold text-base sm:text-lg shadow-lg"
                        onClick={() => handleNext(opt)}
                        disabled={isLoading}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 6 && (
              <div className="text-left space-y-4 sm:space-y-6 mt-6 sm:mt-10 bg-blue-50 p-4 sm:p-6 md:p-8 rounded-3xl border-l-8 border-r-8 border-blue-700 shadow-lg">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 mb-4 sm:mb-5">🌟 Your Personalized Career Compass Points To:</h2>
                <p className="text-gray-800 text-base sm:text-lg">
                  🎯 <strong>Predicted Exam Cutoff for {exam}</strong>: <br />
                  <code className="block bg-blue-100 p-3 sm:p-4 rounded-lg text-blue-900 font-mono text-sm sm:text-base whitespace-pre-wrap mt-2 border border-blue-300 shadow-inner">
                    {cutoff}
                  </code>
                </p>
                <p className="text-gray-800 text-base sm:text-lg">
                  📘 <strong>Your Chosen Subjects</strong>: {subjects.join(', ')}
                </p>
                <p className="text-gray-800 text-base sm:text-lg">
                  💡 <strong>Areas of Interest</strong>: {interest.join(', ')}
                </p>
                <p className="text-gray-800 text-base sm:text-lg">
                  📖 <strong>In Summary</strong>:
                </p>
                <blockquote className="bg-white p-4 sm:p-6 rounded-xl border border-blue-300 shadow-lg text-black whitespace-pre-wrap leading-relaxed text-sm sm:text-base italic">
                  {summary}
                </blockquote>
                <div className="flex justify-center mt-6 sm:mt-10">
                  <button
                    className="w-full max-w-md bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition duration-300 ease-in-out font-bold text-lg sm:text-xl shadow-lg"
                    onClick={startOver}
                  >
                    <span className="inline-block mr-2">🔄</span> Explore Another Path
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Spacer for larger screens */}
          <div className="hidden lg:block lg:w-1/4 xl:w-1/5"></div>
        </div>

        {/* Mobile Flow Chart - Shown at bottom on mobile */}
        <div className="lg:hidden w-full px-4 pb-8">
          <div className="bg-white bg-opacity-90 p-4 rounded-xl shadow-lg">
            <FlowChart steps={flowSteps} currentStep={step} />
          </div>
        </div>

        {/* Chat Bot Button */}
        {!showChat && (
          <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-xl hover:bg-blue-700 transition duration-200 z-40"
            aria-label="Open chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {showChat && <ChatBot onClose={() => setShowChat(false)} />}
      </main>
    </>
  );
}