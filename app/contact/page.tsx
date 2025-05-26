// app/contact/page.tsx
'use client'; // This component uses client-side features like potentially interactive elements.

import Navbar from '@/app/components/Navbar'; // Assuming your Navbar is in src/components

export default function ContactPage() {
  return (
    <>
      <Navbar /> {/* Include your Navbar here */}
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 p-8 pt-24 sm:pt-28"> {/* Added pt-24/28 for navbar */}
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-blue-200">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">Get in Touch with Swarise</h1>
          <p className="text-lg mb-4 leading-relaxed">
            We'd love to hear from you. Whether you have questions about career paths, feedback on our AI, or partnership inquiries, please don't hesitate to reach out.
          </p>

          <div className="space-y-4 text-left mt-6">
            <p className="flex items-center text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-1 13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v14z" />
              </svg>
              Email: <a href="mailto:swarise@careercounselor.com" className="text-blue-600 hover:underline ml-2">support@careercounselor.com</a>
            </p>
            <p className="flex items-center text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
              </svg>
              Phone: <a href="tel:+1234567890" className="text-blue-600 hover:underline ml-2">+1 (234) 567-890</a>
            </p>
            <p className="flex items-center text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address: 123 Swarise Tech, Chennai City, TN 12345
            </p>
          </div>

          <p className="mt-8 text-gray-600 italic">We look forward to connecting with you!</p>
        </div>
      </main>
    </>
  );
}