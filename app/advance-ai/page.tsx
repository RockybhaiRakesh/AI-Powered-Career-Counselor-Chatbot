// app/advance-ai/page.tsx
'use client';

import Navbar from '@/app/components/Navbar';

export default function AdvanceAIPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 p-8 pt-24 sm:pt-28"> {/* Added pt-24/28 for navbar */}
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full text-center border border-blue-200">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">Unlocking Advanced AI Features</h1>
          <p className="text-lg mb-4 leading-relaxed">
            This section represents the future of our Career Counselor AI, where we plan to integrate
            even more sophisticated tools and insights.
          </p>
          <h2 className="text-2xl font-semibold text-purple-600 mt-8 mb-4">Upcoming Features (Conceptual)</h2>
          <ul className="list-disc list-inside text-left text-lg space-y-2">
            <li>**Predictive Career Trends:** AI-driven analysis of future job market demands.</li>
            <li>**Skill Gap Analysis:** Identify skills needed for desired careers and suggest learning paths.</li>
            <li>**Personalized Mentorship Matching:** Connect with industry experts.</li>
            <li>**Virtual Internship Simulations:** Gain hands-on experience through AI-powered scenarios.</li>
            <li>**Sentiment Analysis for Career Satisfaction:** Understand what truly drives job fulfillment.</li>
          </ul>
          <p className="mt-8 text-gray-600 italic">
            Stay tuned as we continue to innovate and expand the capabilities of your AI Career Counselor!
          </p>
        </div>
      </main>
    </>
  );
}