// app/about/page.tsx
'use client'; // This component uses client-side features.

import Navbar from '@/app/components/Navbar'; // Assuming your Navbar is in src/components

export default function AboutPage() {
  return (
    <>
      <Navbar /> {/* Include your Navbar here */}
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800 p-8 pt-24 sm:pt-28"> {/* Added pt-24/28 for navbar */}
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full text-center border border-blue-200">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">About Our Career Counselor AI</h1>
          <p className="text-lg mb-4 leading-relaxed">
            Welcome to the AI-powered Career Counselor! Our mission is to empower students and individuals
            by providing personalized, intelligent guidance on their academic and career journeys.
          </p>
          <p className="text-lg mb-4 leading-relaxed">
            Developed with cutting-edge artificial intelligence, our platform analyzes your subject choices,
            interests, and aspirations to recommend suitable courses, top colleges, relevant entrance exams,
            and even predicted cutoffs. We strive to demystify the complex world of career planning and
            make informed decisions accessible to everyone.
          </p>
          <h2 className="text-2xl font-semibold text-purple-600 mt-8 mb-4">Our Vision</h2>
          <p className="text-lg mb-4 leading-relaxed">
            To be the leading AI companion for career exploration, fostering a future where every individual
            can confidently pursue a path that aligns with their potential and passions.
          </p>
          <h2 className="text-2xl font-semibold text-purple-600 mt-8 mb-4">How It Works</h2>
          <ul className="list-disc list-inside text-left text-lg space-y-2">
            <li>**Subject Group Selection:** Start by choosing your 12th-grade subject stream.</li>
            <li>**Detailed Subject & Interest Analysis:** Select specific subjects and pinpoint your key interests.</li>
            <li>**Course & College Matching:** Receive tailored recommendations for higher education courses and top colleges.</li>
            <li>**Exam & Cutoff Information:** Get details on relevant entrance exams and insights into expected cutoffs.</li>
            <li>**Comprehensive Career Summary:** Obtain a personalized summary detailing your potential career path.</li>
          </ul>
          <p className="mt-8 text-gray-600 italic">
            Join us in building a smarter way to plan your future!
          </p>
        </div>
      </main>
    </>
  );
}