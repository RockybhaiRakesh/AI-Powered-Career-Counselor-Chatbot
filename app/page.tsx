// page.tsx
'use client';

import { useState } from 'react';

export default function CareerCounselorPage() {
  const [group, setGroup] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]); // This state is still useful for display
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

  const callTool = async (tool: string, input?: any) => {
    const res = await fetch('/api/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, input }),
    });
    return res.json();
  };

  const handleNext = async (value?: string) => {
    switch (step) {
      case 0:
        setGroup(value!);
        const subjectsInitial = await callTool('subject', value); // Renamed to avoid conflict
        setOptions(subjectsInitial);
        // Initialize selectedOptions with all false
        setSelectedOptions(subjectsInitial.reduce((acc: Record<string, boolean>, curr: string) => {
          acc[curr] = false;
          return acc;
        }, {}));
        setStep(1);
        break;
      case 1:
        // Get all selected subjects
        const selectedSubjectsForInterest = Object.entries(selectedOptions) // Renamed for clarity
          .filter(([_, isChecked]) => isChecked)
          .map(([subject]) => subject);

        // Add custom subject if provided
        if (customSubject.trim()) {
          selectedSubjectsForInterest.push(customSubject.trim());
        }

        if (selectedSubjectsForInterest.length === 0) {
          alert('Please select at least one subject or enter a custom subject');
          return;
        }

        setSubjects(selectedSubjectsForInterest); // Update state for display later
        const interests = await callTool('interest', selectedSubjectsForInterest.join(', '));
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

        // IMPORTANT CHANGE HERE: Use the 'subjects' state directly or ensure it's fresh
        // The subjects state was set in step 1, and should be available here.
        // If 'subjects' could be stale, you might need to re-derive it or pass it explicitly.
        // Given your flow, `subjects` state should be up-to-date from `setSubjects(selected)` in step 1.
        const summaryRes = await callTool('summary', {
          group,
          subjects: subjects.join(', '), // Access `subjects` from state
          interest,
          course,
          college,
        });
        setSummary(summaryRes);
        setStep(6);
        break;
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
  };

  // Initial load
  if (options.length === 0 && step === 0) startOver();

  return (
    <main className="p-6 max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">🎓 AI POWERED CAREER COUNSELING BOT</h1>
      {step < 6 && (
        <div>
          <p className="text-lg font-semibold">
            {[
              'Choose your subject group:',
              `What are the subjects in ${group}?`,
              `What's your interest in ${subjects.join(', ')}?`,
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
          <blockquote className="bg-gray-100 p-4 rounded">{summary}</blockquote>
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