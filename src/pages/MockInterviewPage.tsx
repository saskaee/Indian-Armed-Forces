import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send, Loader, MessageSquare, User, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InterviewQuestion {
  id: string;
  question_text: string;
  question_type: string;
  expected_points: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MockInterviewPage: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Fallback interview questions if Supabase data isn't available
  const fallbackQuestions: InterviewQuestion[] = [
    {
      id: '1',
      question_text: 'Why do you want to join the Indian Armed Forces?',
      question_type: 'motivation',
      expected_points: [
        'Mention of patriotism and service to the nation',
        'Family tradition or inspiration from a role model',
        'Interest in military training and discipline',
        'Desire for a challenging and purposeful career'
      ]
    },
    {
      id: '2',
      question_text: 'How do you handle pressure in critical situations?',
      question_type: 'behavioural',
      expected_points: [
        'Maintaining calm and thinking clearly',
        'Following established protocols',
        'Prioritizing tasks effectively',
        'Learning from past experiences with pressure'
      ]
    },
    {
      id: '3',
      question_text: 'What leadership qualities do you possess that would make you a good officer?',
      question_type: 'leadership',
      expected_points: [
        'Leading by example',
        'Ability to make decisions',
        'Effective communication skills',
        'Empathy and concern for team members'
      ]
    },
    {
      id: '4',
      question_text: 'How do you stay physically fit, and what is your fitness routine?',
      question_type: 'fitness',
      expected_points: [
        'Regular exercise routine',
        'Balanced approach to fitness',
        'Knowledge of military fitness requirements',
        'Commitment to continuous improvement'
      ]
    },
    {
      id: '5',
      question_text: 'What recent national security challenges do you think India is facing?',
      question_type: 'knowledge',
      expected_points: [
        'Awareness of border issues',
        'Understanding of terrorism threats',
        'Knowledge of regional geopolitics',
        'Insight into cyber and technological challenges'
      ]
    }
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // Attempt to load questions from Supabase
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*');

      if (error || !data || data.length === 0) {
        // If there's an error or no data, use fallback questions
        console.info('Using fallback interview questions');
        setQuestions(fallbackQuestions);
      } else {
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      // Use fallback questions if there's an error
      setQuestions(fallbackQuestions);
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setSessionStarted(true);
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm your interview preparation assistant. Let's start with this question:\n\n${randomQuestion.question_text}`
      }
    ]);
  };

  // Simple algorithm to analyze user answers against expected points
  const analyzeAnswer = (userAnswer: string, expectedPoints: string[]) => {
    // Convert to lowercase for case-insensitive matching
    const answer = userAnswer.toLowerCase();
    
    // Check which expected points are mentioned in the answer
    const matchedPoints = expectedPoints.filter(point => {
      const keywords = point.toLowerCase().split(' ');
      // Check if at least half of the keywords are in the answer
      const matchCount = keywords.filter(word => 
        word.length > 3 && answer.includes(word)
      ).length;
      return matchCount >= Math.max(1, Math.ceil(keywords.length / 3));
    });
    
    // Determine unmatchedPoints for suggestions
    const unmatchedPoints = expectedPoints.filter(point => !matchedPoints.includes(point));
    
    // Generate feedback based on how many points were matched
    let summary = '';
    if (matchedPoints.length === 0) {
      summary = 'Your answer could be improved by including some key points expected in this type of question.';
    } else if (matchedPoints.length < expectedPoints.length / 2) {
      summary = 'Your answer covers some important points, but there are other aspects you could consider.';
    } else if (matchedPoints.length < expectedPoints.length) {
      summary = 'Good answer! You covered most of the expected points. With a few additions, it could be even better.';
    } else {
      summary = 'Excellent answer! You covered all the expected points thoroughly.';
    }
    
    // Generate suggestions text
    const suggestedPoints = unmatchedPoints.length > 0 
      ? unmatchedPoints.map(point => `• Consider mentioning: ${point}`).join('\n')
      : '• Your answer was comprehensive. Keep up the good work!';
    
    return {
      matchedPoints,
      feedback: {
        summary,
        suggestedPoints
      }
    };
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    setSubmitting(true);
    setMessages(prev => [...prev, { role: 'user', content: userAnswer }]);

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate feedback locally instead of calling an API
      const feedback = analyzeAnswer(userAnswer, currentQuestion.expected_points);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Here's my feedback on your answer:\n\n${feedback.feedback.summary}\n\nStrong points:\n${
            feedback.matchedPoints.length > 0
              ? feedback.matchedPoints.map((point: string) => `• ${point}`).join('\n')
              : '• None identified'
          }\n\nSuggestions:\n${feedback.feedback.suggestedPoints}`
        }
      ]);

      // Load next question
      const remainingQuestions = questions.filter(q => q.id !== currentQuestion.id);
      if (remainingQuestions.length > 0) {
        const nextQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
        setCurrentQuestion(nextQuestion);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Let's move on to the next question:\n\n${nextQuestion.question_text}`
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "That's all the questions we have for now. You've completed the mock interview session!"
          }
        ]);
        setSessionStarted(false);
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I encountered an error processing your answer. Let's try again."
        }
      ]);
    } finally {
      setUserAnswer('');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-army-green" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {!sessionStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md"
          >
            <h1 className="font-display text-3xl font-bold mb-4">Mock Interview Session</h1>
            <div className="space-y-4 mb-6">
              <p className="text-neutral-700">
                Practice your interview skills with our AI-powered mock interview system. You'll be asked questions commonly asked in military interviews.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600">
                <li>Answer questions as you would in a real interview</li>
                <li>Receive immediate feedback on your responses</li>
                <li>Practice different types of questions</li>
                <li>Get suggestions for improvement</li>
              </ul>
            </div>
            <button
              onClick={startSession}
              className="w-full bg-army-green text-white py-3 rounded-md hover:bg-army-dark transition-colors flex items-center justify-center"
            >
              Start Interview <MessageSquare className="ml-2 h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-army-green text-white">
                <h2 className="font-display text-xl font-semibold">Mock Interview Session</h2>
              </div>
              
              <div className="h-[500px] overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start mb-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-army-green text-white ml-4'
                          : 'bg-neutral-100 text-neutral-700 mr-4'
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        {message.role === 'user' ? (
                          <>
                            <span className="font-medium">You</span>
                            <User className="h-4 w-4 ml-2" />
                          </>
                        ) : (
                          <>
                            <Bot className="h-4 w-4 mr-2" />
                            <span className="font-medium">Interviewer</span>
                          </>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-army-green focus:border-transparent resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !userAnswer.trim()}
                    className="bg-army-green text-white px-4 py-2 rounded-md hover:bg-army-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <Loader className="animate-spin h-5 w-5" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewPage;