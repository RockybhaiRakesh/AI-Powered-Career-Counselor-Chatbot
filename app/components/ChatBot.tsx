'use client';

import { useState, useRef, useEffect } from 'react';

// Define the Message type for clarity
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatBot({ onClose }: { onClose: () => void }) {
  // State for managing chat messages
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI career counselor assistant. How can I help you today?' }
  ]);
  // State for the current input field value
  const [input, setInput] = useState('');
  // State to indicate if an API call is in progress
  const [isLoading, setIsLoading] = useState(false);
  // State to indicate if the microphone is actively listening
  const [isListening, setIsListening] = useState(false);
  // State to indicate if the bot is speaking automatically (initial greeting, AI response)
  const [isSpeakingAuto, setIsSpeakingAuto] = useState(false);

  // Ref for scrolling to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref to track if the user has interacted, crucial for the initial greeting timeout
  const userInteractedRef = useRef(false);
  // Ref for the timeout ID of the initial greeting
  const initialGreetingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Speech Recognition API setup
  // Access window.SpeechRecognition or window.webkitSpeechRecognition for browser compatibility
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any | null>(null); // Ref to hold the SpeechRecognition instance

  // Speech Synthesis API setup
  const synthRef = useRef<SpeechSynthesis | null>(null); // Ref to hold the SpeechSynthesis instance

  // List of available languages for the language selection dropdown
  // In a real application, you might dynamically populate this based on available voices.
  const availableLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'ta-IN', name: 'Tamil (India)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
  ];
  // State for the currently selected language, defaults to US English
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  // Effect to scroll to the bottom of the chat whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to initialize Speech Recognition and Speech Synthesis APIs
  useEffect(() => {
    // Initialize Speech Recognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Listen for a single utterance
      recognitionRef.current.interimResults = false; // Only return final results
      recognitionRef.current.lang = selectedLanguage; // Set recognition language based on selected state

      // Event handler for when speech is recognized
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript); // Set the recognized speech as input
        setIsListening(false);
        userInteractedRef.current = true; // Mark that user has interacted
      };

      // Event handler for recognition errors
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      // Event handler for when recognition ends
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }

    // Initialize Speech Synthesis
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      // Optional: Event listener for when voices are loaded. Useful if you want dynamic voice selection.
      synthRef.current.onvoiceschanged = () => {
        // console.log("Voices loaded:", synthRef.current?.getVoices());
      };
    } else {
      console.warn('Speech Synthesis API not supported in this browser.');
    }

    // Cleanup function for unmounting component
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop(); // Stop ongoing recognition
      }
      if (synthRef.current) {
        synthRef.current.cancel(); // Stop any ongoing speech
      }
      if (initialGreetingTimeoutRef.current) {
        clearTimeout(initialGreetingTimeoutRef.current); // Clear initial greeting timeout
      }
    };
  }, [selectedLanguage]); // Re-run this effect if the selected language changes

  // Effect for handling the initial greeting vocalization
  useEffect(() => {
    // Check if the user hasn't interacted yet, and it's still just the initial assistant message
    if (!userInteractedRef.current && messages.length === 1 && messages[0].role === 'assistant') {
      initialGreetingTimeoutRef.current = setTimeout(() => {
        // Double-check user interaction status before speaking
        if (!userInteractedRef.current) {
          const initialMessage = messages[0].content;
          const utterance = new SpeechSynthesisUtterance(initialMessage);
          utterance.lang = selectedLanguage; // Set language for the greeting

          // Try to find a voice matching the selected language
          const voices = synthRef.current?.getVoices();
          const voice = voices?.find(v => v.lang === selectedLanguage);
          if (voice) utterance.voice = voice;

          // Set speaking state for automatic speech, and reset on end/error
          utterance.onstart = () => setIsSpeakingAuto(true);
          utterance.onend = () => setIsSpeakingAuto(false);
          utterance.onerror = () => setIsSpeakingAuto(false);

          if (synthRef.current) {
            synthRef.current.speak(utterance);
          }
        }
      }, 5000); // Speak after 5 seconds if no interaction

      // Cleanup: clear the timeout if the user interacts before it fires
      return () => {
        if (initialGreetingTimeoutRef.current) {
          clearTimeout(initialGreetingTimeoutRef.current);
        }
      };
    }
  }, [messages, selectedLanguage]); // Dependencies for this specific effect

  // Function to scroll the chat window to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to start speech recognition
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // If the bot is currently speaking automatically, stop it before listening
      if (isSpeakingAuto && synthRef.current) {
        synthRef.current.cancel();
        setIsSpeakingAuto(false);
      }
      setIsListening(true);
      setInput(''); // Clear input field when starting to listen
      recognitionRef.current.lang = selectedLanguage; // Ensure correct language for recognition
      recognitionRef.current.start();
      userInteractedRef.current = true; // Mark user interaction when mic is clicked
    }
  };

  // Function to stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Function for playing back a message's audio (e.g., from the speaker button)
  // This function does NOT affect the `isSpeakingAuto` state, allowing concurrent interaction.
  const playMessageAudio = (text: string, lang: string = selectedLanguage) => {
    if (synthRef.current) {
      // Cancel any currently speaking utterance (even automatic ones)
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang; // Set language for playback

      // Find and set a voice matching the language
      const voices = synthRef.current.getVoices();
      const voice = voices.find(v => v.lang === lang);
      if (voice) {
        utterance.voice = voice;
      }
      synthRef.current.speak(utterance);
    }
  };

  // Function for automatic speech responses from the bot (e.g., after API call)
  // This function sets `isSpeakingAuto` to true, disabling main input controls.
  const startSpeakingAutoResponse = (text: string, lang: string = selectedLanguage) => {
    if (synthRef.current) {
      // Stop any current speech
      synthRef.current.cancel();

      // If actively listening, stop recognition before speaking
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang; // Set language for the auto-response

      // Find and set a voice matching the language
      const voices = synthRef.current.getVoices();
      const voice = voices.find(v => v.lang === lang);
      if (voice) {
        utterance.voice = voice;
      }

      // Set `isSpeakingAuto` true when speech starts, false when it ends or errors
      utterance.onstart = () => setIsSpeakingAuto(true);
      utterance.onend = () => setIsSpeakingAuto(false);
      utterance.onerror = () => setIsSpeakingAuto(false);

      synthRef.current.speak(utterance);
    }
  };

  // Function to handle form submission (sending a message)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    if (!input.trim() || isLoading) return; // Do nothing if input is empty or loading

    // Stop any ongoing automatic speech or listening before new submission
    if (isSpeakingAuto && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeakingAuto(false);
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    userInteractedRef.current = true; // Mark user interaction

    const userMessage: Message = { role: 'user', content: input };

    // Optimistically update the UI with the user's message
    setMessages(prev => [...prev, userMessage]);
    setInput(''); // Clear input field
    setIsLoading(true); // Set loading state

    try {
      // Filter out the initial assistant message if it's the first in the 'messages' array
      // This is crucial for the Gemini API's 'history' requirement (must start with 'user').
      const messagesToSendToAPI = messages.filter((msg, index) => {
        // If the first message in the state is from assistant, exclude it from history sent to API
        if (index === 0 && msg.role === 'assistant' && messages.length > 0) {
          return false;
        }
        return true;
      });

      // Now add the new user message to the filtered history to send.
      const fullHistoryForAPI = [...messagesToSendToAPI, userMessage];

      // Make API call to your backend
      const response = await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'chat', input: fullHistoryForAPI }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError: any) {
        console.error("JSON parsing error:", jsonError);
        const rawResponseText = await response.text();
        console.error("Raw server response text (if available):", rawResponseText);
        throw new Error("Failed to parse server response as JSON. Server might have sent malformed JSON or an empty response. Check server logs.");
      }

      // Handle non-OK API responses
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to get response from API (non-2xx status)';
        console.error("API error response:", errorMessage);
        throw new Error(errorMessage);
      }

      const assistantResponseContent = data.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponseContent }]);

      // Automatically speak the assistant's response
      startSpeakingAutoResponse(assistantResponseContent, selectedLanguage);

    } catch (error: any) {
      console.error('Chat submission error:', error);
      const errorMessage = `Sorry, an error occurred: ${error.message || 'Please try again.'}`;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
      startSpeakingAutoResponse(errorMessage, selectedLanguage); // Speak out the error message
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden transform transition-all duration-300">
      {/* Chatbot Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex justify-between items-center">
        <h3 className="font-bold text-lg">Career Counselor AI</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          ×
        </button>
      </div>

      {/* Chat Messages Display Area */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
            >
              {message.content}
              {message.role === 'assistant' && (
                // Speaker button for replaying assistant messages
                <button
                  onClick={() => playMessageAudio(message.content, selectedLanguage)}
                  className="ml-2 p-1 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800"
                  title="Listen to message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 5.657a1 1 0 01.196 1.843 7.001 7.001 0 000 6.88a1 1 0 01-.196 1.843 9.001 9.001 0 010-10.566zM17.618 3.51a1 1 0 01.272 1.761 11.001 11.001 0 000 11.458 1 1 0 01-.272 1.761 13.001 13.001 0 010-14.98z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
        {/* Loading indicator (typing animation) */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Element to scroll into view */}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        {/* Language Selection Dropdown */}
        <div className="flex mb-2">
          <label htmlFor="language-select" className="sr-only">Select Language</label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full text-black border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isSpeakingAuto || isListening} // Disable if bot is busy
          >
            {availableLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
        <div className="flex">
          {/* Text Input Field */}
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              userInteractedRef.current = true; // Mark user interaction on typing
            }}
            placeholder="Ask me anything about careers..."
            className="flex-1 text-black border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isSpeakingAuto || isListening} // Disable if bot is busy
          />
          {/* Microphone button */}
          <button
            type="button" // Important: set to "button" to prevent form submission
            onClick={isListening ? stopListening : startListening}
            className={`px-4 py-2 text-black transition-colors duration-200 ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isLoading || isSpeakingAuto} // Disable if loading or bot is speaking
            title={isListening ? "Stop Listening" : "Start Listening"}
          >
            {isListening ? (
              // Stop Listening Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8H3a7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            ) : (
              // Start Listening Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm3 8V4a5 5 0 00-10 0v4c.066.082.13.165.197.245A6.992 6.092 0 001 8c0 3.866 3.134 7 7 7s7-3.134 7-7a6.992 6.092 0 00-2.803-.245c.067-.08.131-.163.197-.245V4h-2zm3 8v4a5 5 0 01-10 0v-4c.066.082.13.165.197.245A6.992 6.092 0 001 8c0 3.866 3.134 7 7 7s7-3.134 7-7a6.992 6.092 0 00-2.803-.245c.067-.08.131-.163.197-.245V4h-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || !input.trim() || isSpeakingAuto || isListening} // Disable if busy or input is empty
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}