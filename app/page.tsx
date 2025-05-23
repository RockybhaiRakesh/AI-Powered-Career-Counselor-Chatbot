'use client';

import { useState } from 'react';

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
        const subjects = await callTool('subject', value);
        setOptions(subjects);
        // Initialize selectedOptions with all false
        setSelectedOptions(subjects.reduce((acc: Record<string, boolean>, curr: string) => {
  acc[curr] = false;
  return acc;
}, {}));
        setStep(1);
        break;
      case 1:
        // Get all selected subjects
        const selected = Object.entries(selectedOptions)
          .filter(([_, isChecked]) => isChecked)
          .map(([subject]) => subject);
        
        // Add custom subject if provided
        if (customSubject.trim()) {
          selected.push(customSubject.trim());
        }
        
        if (selected.length === 0) {
          alert('Please select at least one subject or enter a custom subject');
          return;
        }
        
        setSubjects(selected);
        const interests = await callTool('interest', selected.join(', '));
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
        const summaryRes = await callTool('summary', {
          group,
          subjects: subjects.join(', '),
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