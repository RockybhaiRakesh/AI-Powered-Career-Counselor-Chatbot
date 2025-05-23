'use client';

import { useState } from 'react';

export default function CareerCounselorPage() {
  const [group, setGroup] = useState('');
  const [interest, setInterest] = useState('');
  const [course, setCourse] = useState('');
  const [college, setCollege] = useState('');
  const [exam, setExam] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [summary, setSummary] = useState('');
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<string[]>([]);

  const callTool = async (tool: string, input?: any) => {
    const res = await fetch('/api/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, input }),
    });
    return res.json();
  };

  const handleNext = async (value: string) => {
    switch (step) {
      case 0:
        setGroup(value);
        const interests = await callTool('interest', value);
        setOptions(interests);
        setStep(1);
        break;
      case 1:
        setInterest(value);
        const courses = await callTool('course', { interest: value, group });
        setOptions(courses);
        setStep(2);
        break;
      case 2:
        setCourse(value);
        const colleges = await callTool('college', value);
        setOptions(colleges);
        setStep(3);
        break;
      case 3:
        setCollege(value);
        const exams = await callTool('exam', { college: value, course });
        setOptions(exams);
        setStep(4);
        break;
      case 4:
        setExam(value);
        const cutoffRes = await callTool('cutoff', { exam: value, college });
        setCutoff(cutoffRes);
        const summaryRes = await callTool('summary', {
          group,
          interest,
          course,
          college,
        });
        setSummary(summaryRes);
        setStep(5);
        break;
    }
  };

  const startOver = async () => {
    const groups = await callTool('subject_group');
    setOptions(groups);
    setGroup('');
    setInterest('');
    setCourse('');
    setCollege('');
    setExam('');
    setCutoff('');
    setSummary('');
    setStep(0);
  };

  // Initial load
  if (options.length === 0 && step === 0) startOver();

  return (
    <main className="p-6 max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold">🎓 Career Counseling Bot</h1>
      {step < 5 && (
        <div>
          <p className="text-lg font-semibold">
            {[
              'Choose your subject group:',
              `What's your interest in ${group}?`,
              `Choose a course related to ${interest}:`,
              `Select a college offering ${course}:`,
              `Select an entrance exam for ${college}:`,
            ][step]}
          </p>
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
        </div>
      )}

      {step === 5 && (
        <div className="text-left space-y-4 mt-6">
          <h2 className="text-xl font-bold">🔍 Results</h2>
          <p>🎯 Exam Cutoff for <b>{exam}</b>: <br /> <code>{cutoff}</code></p>
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
