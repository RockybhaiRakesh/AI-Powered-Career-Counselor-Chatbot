// page.tsx
'use client';

import { useState, useEffect } from 'react'; // Import useEffect

export default function CareerCounselorPage() {
  const [group, setGroup] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [interest, setInterest] = useState('');
  const [course, setCourse] = useState('');
  const [college, setCollege] = useState('');
  const [exam, setExam] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [summary, setSummary] = useState('');
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});

  // NEW: State to store the base URL for API calls
  const [baseUrl, setBaseUrl] = useState('');

  // NEW: useEffect to set the base URL once the component mounts on the client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []); // Empty dependency array means this runs once on mount

  const callTool = async (tool: string, input?: any) => {
    // Construct the full URL using the baseUrl
    // If baseUrl is not yet available (e.g., during initial server render before useEffect),
    // it will default to an empty string, causing /api/tool to be relative.
    // This is generally handled by Next.js in development, but for robust production,
    // ensure server-side calls have an absolute URL or use environment variables.
    const url = `${baseUrl}/api/tool`;

    // Added a check to log if baseUrl is missing on the client side
    // This won't directly fix SSR issues, but helps debug if client fetch fails
    if (!baseUrl && typeof window !== 'undefined') {
      console.warn('Base URL not yet set for API call on client. This might cause issues if not configured.');
    }

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
    } catch (error) {
      console.error(`Error in callTool (${tool}):`, error);
      // Depending on your error handling strategy, you might want to re-throw or return a default
      throw error; // Re-throw to propagate the error for client-side handling
    }
  };

  const handleNext = async (value?: string) => {
    try { // Added a try-catch block for overall error handling in handleNext
      switch (step) {
        case 0:
          setGroup(value!);
          // Renamed local variable to avoid confusion with state 'subjects'
          const fetchedSubjects = await callTool('subject', value);
          setOptions(fetchedSubjects);
          // Initialize selectedOptions with all false
          setSelectedOptions(fetchedSubjects.reduce((acc: Record<string, boolean>, curr: string) => {
            acc[curr] = false;
            return acc;
          }, {}));
          setStep(1);
          break;
        case 1:
          // Get all selected subjects from selectedOptions state
          const currentlySelectedSubjects = Object.entries(selectedOptions)
            .filter(([_, isChecked]) => isChecked)
            .map(([subject]) => subject);

          // Add custom subject if provided
          if (customSubject.trim()) {
            currentlySelectedSubjects.push(customSubject.trim());
          }

          if (currentlySelectedSubjects.length === 0) {
            alert('Please select at least one subject or enter a custom subject');
            return;
          }

          // Update the 'subjects' state with the final list of selected subjects
          setSubjects(currentlySelectedSubjects);

          const interests = await callTool('interest', currentlySelectedSubjects.join(', '));
          setOptions(interests);
          setStep(2);
          break;
        case 2:
          setInterest(value!);
          const courses = await callTool('course', { interest: value, group });
          setOptions(courses);
          setStep(3);
          break;
        case 3:
          setCourse(value!);
          const colleges = await callTool('college', value);
          setOptions(colleges);
          setStep(4);
          break;
        case 4:
          setCollege(value!);
          const exams = await callTool('exam', { college: value, course });
          setOptions(exams);
          setStep(5);
          break;
        case 5:
          setExam(value!);
          const cutoffRes = await callTool('cutoff', { exam: value, college });
          setCutoff(cutoffRes);

          // The 'subjects' state should be populated from 'case 1' by now
          // If you were to debug 'subjects' here, it should hold the correct value.
          const summaryRes = await callTool('summary', {
            group,
            subjects: subjects.join(', '), // Using the 'subjects' state here
            interest,
            course,
            college,
          });
          setSummary(summaryRes);
          setStep(6);
          break;
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      alert(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      // Optionally, reset the step or provide more specific user feedback
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

  const startOver = async () => {
    try {
      const groups = await callTool('subject_group');
      setOptions(groups);
      setGroup('');
      setSubjects([]);
      setCustomSubject('');
      setInterest('');
      setCourse('');
      setCollege('');
      setExam('');
      setCutoff('');
      setSummary('');
      setSelectedOptions({});
      setStep(0);
    } catch (error) {
      console.error("Error starting over:", error);
      alert(`Could not start over: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Initial load: Only call startOver if options are empty AND baseUrl is set (client-side)
  // This prevents it from firing on the server where baseUrl is initially empty.
  useEffect(() => {
    if (options.length === 0 && step === 0 && baseUrl) {
      startOver();
    }
  }, [options.length, step, baseUrl]); // Re-run if these dependencies change

  return (
    <main className="p-6 max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">🎓 AI POWERED CAREER COUNSELING BOT</h1>
      {step < 6 && (
        <div>
          <p className="text-lg font-semibold">
            {[
              'Choose your subject group:',
              `What are the subjects in ${group}?`, // Corrected to use backticks
              `What's your interest in ${subjects.join(', ')}?`, // Corrected to use backticks
              `Choose a course related to ${interest}:`,
              `Select a college offering ${course}:`,
              `Select an entrance exam for ${college}:`,
            ][step]}
          </p>

          {step === 1 ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  className="mr-2"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  checked={Object.values(selectedOptions).every(Boolean) && options.length > 0}
                />
                <label htmlFor="selectAll">Select All</label>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`subject-${idx}`}
                      className="mr-2"
                      checked={selectedOptions[opt] || false}
                      onChange={() => toggleOption(opt)}
                    />
                    <label htmlFor={`subject-${idx}`}>{opt}</label>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label htmlFor="customSubject" className="block mb-2">Or enter a custom subject:</label>
                <input
                  type="text"
                  id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="border p-2 w-full rounded"
                  placeholder="Enter your subject"
                />
              </div>

              <button
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => handleNext()}
              >
                Next
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 mt-4">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => handleNext(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <div className="text-left space-y-4 mt-6">
          <h2 className="text-xl font-bold">🔍 Results</h2>
          <p>🎯 Exam Cutoff for <b>{exam}</b>: <br /> <code>{cutoff}</code></p>
          <p>📘 Subjects: {subjects.join(', ')}</p>
          <p>📘 Summary:</p>
          <blockquote className="bg-gray-100 p-4 rounded text-black">{summary}</blockquote>
          <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={startOver}
          >
            🔁 Start Over
          </button>
        </div>
      )}
    </main>
  );
}