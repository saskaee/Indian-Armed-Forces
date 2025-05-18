import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, Clock, Calendar, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface TestResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  test_type: string;
  completed_at: string;
  answers: string; // JSON string of answers
  questions: string; // JSON string of questions
  created_at: string;
}

interface Answer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: string[] | Record<string, string>;
  correctAnswer: string;
  explanation?: string;
  category?: string;
}

const TestResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        if (!id) {
          setError('No test result ID provided');
          setLoading(false);
          return;
        }

        // Fetch the test result from Supabase
        const { data, error: fetchError } = await supabase
          .from('test_results')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('Test result not found');
          setLoading(false);
          return;
        }

        // Ensure user can only view their own test results
        if (user && data.user_id !== user.id) {
          setError('You do not have permission to view this test result');
          setLoading(false);
          return;
        }

        setTestResult(data as TestResult);

        // Parse the answers and questions JSON with error handling
        try {
          if (data.answers) {
            const parsedAnswers = JSON.parse(data.answers);
            console.log('Parsed answers:', parsedAnswers);
            
            // Convert object format answers to array format
            if (typeof parsedAnswers === 'object' && !Array.isArray(parsedAnswers)) {
              // Create an array of answer objects for each question
              const processedAnswers: Answer[] = [];
              
              // For each question, check if we have an answer
              if (data.questions) {
                try {
                  const parsedQuestions = JSON.parse(data.questions);
                  console.log('Question format example:', parsedQuestions[0]);
                  console.log('Answer keys:', Object.keys(parsedAnswers));
                  
                  if (Array.isArray(parsedQuestions)) {
                    parsedQuestions.forEach((question, index) => {
                      // Try different formats for matching question IDs with answer keys
                      let userAnswer = null;
                      const questionId = question.id;
                      
                      // 1. Try direct match
                      if (parsedAnswers[questionId]) {
                        userAnswer = parsedAnswers[questionId];
                      } 
                      // 2. Try with 'q' prefix (q1, q2, etc.)
                      else if (parsedAnswers[`q${questionId}`]) {
                        userAnswer = parsedAnswers[`q${questionId}`];
                      }
                      // 3. Try with short index (q1, q2, etc.)
                      else if (parsedAnswers[`q${index + 1}`]) {
                        userAnswer = parsedAnswers[`q${index + 1}`];
                      }
                      // 4. Try numeric index keys
                      else if (parsedAnswers[`${index + 1}`]) {
                        userAnswer = parsedAnswers[`${index + 1}`];
                      }
                      
                      if (userAnswer) {
                        console.log(`Found answer for question ${index + 1}:`, userAnswer);
                        processedAnswers.push({
                          questionId,
                          selectedOption: userAnswer,
                          isCorrect: userAnswer === question.correctAnswer
                        });
                      } else {
                        console.log(`No answer found for question ${index + 1} with ID ${questionId}`);
                      }
                    });
                  }
                } catch (err) {
                  console.error('Error processing questions during answer conversion:', err);
                }
              }
              
              setAnswers(processedAnswers);
            } else if (Array.isArray(parsedAnswers)) {
              setAnswers(parsedAnswers);
            } else {
              setAnswers([]);
            }
          } else {
            console.log('No answers found in test result');
            setAnswers([]);
          }

          if (data.questions) {
            try {
              const parsedQuestions = JSON.parse(data.questions);
              console.log('Parsed questions:', parsedQuestions);
              
              // Handle different formats of question data
              if (Array.isArray(parsedQuestions)) {
                // Standard array format - handle different field names
                setQuestions(parsedQuestions.map(q => {
                  // Log each question to understand its structure
                  console.log('Processing question:', q);
                  
                  // Determine if we have a question in the alternate format (question instead of text)
                  const questionText = q.text || q.question || 'Question text unavailable';
                  const correctAnswerValue = q.correctAnswer || q.correct_answer || '';
                  let optionsValue = [];
                  
                  // Handle options - could be in different formats
                  if (Array.isArray(q.options)) {
                    optionsValue = q.options;
                  } else if (q.options && typeof q.options === 'object') {
                    // Handle options in object format
                    optionsValue = Object.values(q.options);
                  }
                  
                  console.log(`Question ${q.id} options:`, optionsValue);
                  
                  // Build a standardized question object
                  return {
                    id: q.id || `question-${Math.random().toString(36).substr(2, 9)}`,
                    text: questionText,
                    options: optionsValue,
                    correctAnswer: correctAnswerValue
                  };
                }));
              } else if (typeof parsedQuestions === 'object') {
                // Handle object format by converting to array
                const questionsArray = Object.entries(parsedQuestions)
                  .map(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                      return {
                        id: key,
                        ...(value as any),
                        options: Array.isArray((value as any).options) ? (value as any).options : []
                      };
                    }
                    return null;
                  })
                  .filter(q => q !== null) as Question[];
                  
                console.log('Converted questions to array:', questionsArray);
                setQuestions(questionsArray);
              } else {
                console.log('Questions data is in an unexpected format');
                setQuestions([]);
              }
            } catch (err) {
              console.error('Error parsing questions JSON:', err);
              setQuestions([]);
            }
          } else {
            console.log('No questions found in test result');
            setQuestions([]);
          }
        } catch (parseError) {
          console.error('Error parsing JSON data:', parseError);
          // Set empty arrays to prevent rendering errors
          setAnswers([]);
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error fetching test result:', err);
        setError('Error loading test result');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResult();
  }, [id, user]);

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-army-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error || !testResult) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-4">Results Not Found</h1>
          <p className="text-neutral-600 mb-6">{error || 'The test results you\'re looking for are not available.'}</p>
          <Link
            to="/mock-test"
            className="inline-flex items-center bg-army-green text-white px-6 py-3 rounded-md hover:bg-army-dark transition-colors"
          >
            Take a New Test <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeFromSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTestTypeName = (testType: string) => {
    const testTypeNames: { [key: string]: string } = {
      'army_knowledge': 'Army Knowledge Test',
      'navy_knowledge': 'Navy Knowledge Test',
      'airforce_knowledge': 'Air Force Knowledge Test',
      'general_military': 'General Military Test',
      'mock_interview': 'Mock Interview'
    };

    return testTypeNames[testType] || testType;
  };

  // Since the isCorrect flags in the answers array seem to be incorrect,
  // let's use the test result data directly for accuracy
  
  // Get correct answers directly from the test score
  const correctAnswers = testResult ? testResult.score : 0;
  
  // Calculate incorrect answers as total questions minus correct answers
  const incorrectAnswers = testResult ? (testResult.total_questions - correctAnswers) : 0;
  
  console.log('Using score data directly:', { 
    correct: correctAnswers, 
    incorrect: incorrectAnswers,
    totalQuestions: testResult?.total_questions,
    score: testResult?.score
  });

  const renderQuestionOptions = (question: Question, userAnswer: Answer | null | undefined) => {
    // First try direct array format
    if (Array.isArray(question.options) && question.options.length > 0) {
      return question.options.map((option, optIndex) => {
        if (!option) return null;
        
        const isUserSelection = userAnswer?.selectedOption === option;
        const isCorrectAnswer = question.correctAnswer === option;
        
        return (
          <div 
            key={optIndex}
            className={`p-2 rounded border ${isUserSelection && isCorrectAnswer 
              ? 'border-green-500 bg-green-100' 
              : isUserSelection && !isCorrectAnswer 
                ? 'border-red-500 bg-red-100' 
                : isCorrectAnswer 
                  ? 'border-green-500 bg-white' 
                  : 'border-gray-200 bg-white'}`}
          >
            <div className="flex items-center">
              <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
              <span className="flex-1">{option}</span>
              {isUserSelection && isCorrectAnswer && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {isUserSelection && !isCorrectAnswer && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {!isUserSelection && isCorrectAnswer && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        );
      });
    }
    
    // Try object format
    if (question.options && typeof question.options === 'object') {
      const optionEntries = Object.entries(question.options);
      if (optionEntries.length > 0) {
        return optionEntries.map(([key, value]) => {
          const optionText = typeof value === 'string' ? value : String(value);
          const isUserSelection = userAnswer?.selectedOption === optionText || userAnswer?.selectedOption === key;
          const isCorrectAnswer = question.correctAnswer === optionText || question.correctAnswer === key;
          
          return (
            <div 
              key={key}
              className={`p-2 rounded border ${isUserSelection && isCorrectAnswer 
                ? 'border-green-500 bg-green-100' 
                : isUserSelection && !isCorrectAnswer 
                  ? 'border-red-500 bg-red-100' 
                  : isCorrectAnswer 
                    ? 'border-green-500 bg-white' 
                    : 'border-gray-200 bg-white'}`}
            >
              <div className="flex items-center">
                <span className="mr-2">{key.toUpperCase()}.</span>
                <span className="flex-1">{optionText}</span>
                {isUserSelection && isCorrectAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {isUserSelection && !isCorrectAnswer && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {!isUserSelection && isCorrectAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          );
        });
      }
    }
    
    // Special case: if we have a correctAnswer but no options, display at least the correct answer
    if (question.correctAnswer) {
      return (
        <div className="space-y-2">
          {/* Show the correct answer */}
          <div className="p-2 rounded border border-green-500 bg-green-50">
            <div className="flex items-center">
              <span className="mr-2">Correct Answer:</span>
              <span className="flex-1 font-medium">{question.correctAnswer}</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
          
          {/* If user provided an answer, show it too */}
          {userAnswer && userAnswer.selectedOption && userAnswer.selectedOption !== question.correctAnswer && (
            <div className="p-2 rounded border border-red-300 bg-red-50">
              <div className="flex items-center">
                <span className="mr-2">Your Answer:</span>
                <span className="flex-1">{userAnswer.selectedOption}</span>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          )}
          
          <div className="p-2 rounded border border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-700">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Full options weren't available for this question.
            </p>
          </div>
        </div>
      );
    }
    
    // No options or correct answer found
    return (
      <div className="p-2 rounded border border-gray-200">
        <p className="text-gray-500">No options available</p>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-army-green hover:underline mb-4"
          >
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" /> Back to Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-army-green text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
                    {testResult?.test_type ? getTestTypeName(testResult.test_type) : 'Test Result'}
                  </h1>
                  <div className="flex items-center text-sm text-neutral-100">
                    <Calendar className="h-4 w-4 mr-1" />
                    {testResult?.completed_at ? formatDate(testResult.completed_at) : 'Date unavailable'}
                    <span className="mx-2">|</span>
                    <Clock className="h-4 w-4 mr-1" />
                    {typeof testResult?.time_taken_seconds === 'number' ? formatTimeFromSeconds(testResult.time_taken_seconds) : '0m 0s'}
                  </div>
                </div>
                <div className="text-3xl md:text-5xl font-bold">
                  <span className={getScoreColor(testResult?.percentage || 0)}>{testResult?.percentage || 0}%</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-500">{correctAnswers}</div>
                  <p className="text-neutral-600">Correct</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-500">{incorrectAnswers}</div>
                  <p className="text-neutral-600">Incorrect</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold mb-4">Performance Analysis</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy Rate</span>
                      <span>
                        {correctAnswers + incorrectAnswers > 0
                          ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${correctAnswers + incorrectAnswers > 0
                            ? (correctAnswers / (correctAnswers + incorrectAnswers)) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion Rate</span>
                      <span>
                        {Math.round(((correctAnswers + incorrectAnswers) / testResult.total_questions) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${((correctAnswers + incorrectAnswers) / testResult.total_questions) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Details Section */}
              {Array.isArray(questions) && questions.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-display text-xl font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Question Details
                  </h2>

                  <div className="space-y-6">
                    {questions.map((question, index) => {
                      if (!question || typeof question !== 'object') return null;

                      // Find the user's answer for this question
                      const userAnswer = Array.isArray(answers) ? 
                        answers.find(a => a && a.questionId === question.id) : null;
                      
                      // Compare the user's selected answer directly with the question's correct answer
                      // instead of relying on the potentially incorrect isCorrect flag
                      const isCorrect = userAnswer && 
                          userAnswer.selectedOption === question.correctAnswer;
                      
                      // Determine answer status based on the actual correctness
                      const answerStatus = !userAnswer ? 'skipped' : 
                        isCorrect ? 'correct' : 'incorrect';
                      
                      // For debugging
                      console.log(`Question ${index + 1} status:`, {
                        id: question.id,
                        userSelected: userAnswer?.selectedOption,
                        correctAnswer: question.correctAnswer,
                        isCorrect,
                        status: answerStatus
                      });

                      return (
                        <div 
                          key={question.id || index} 
                          className={`p-4 rounded-lg border ${answerStatus === 'correct' 
                            ? 'border-green-500 bg-green-100' 
                            : answerStatus === 'incorrect' 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-gray-200 bg-gray-50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-semibold">Q{index + 1}.</span>
                            <div className="flex-1">
                              <p className="font-semibold mb-3">{question.text || 'Question unavailable'}</p>
                              
                              <div className="space-y-2 mb-4">
                                {renderQuestionOptions(question, userAnswer)}
                              </div>
                              
                              {question.explanation && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded">
                                  <p className="text-sm font-semibold mb-1">Explanation:</p>
                                  <p className="text-sm">{question.explanation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <Link
                  to="/mock-test"
                  className="flex-1 bg-army-green text-white py-3 rounded-md hover:bg-army-dark transition-colors text-center"
                >
                  Take Another Test
                </Link>
                <Link
                  to="/dashboard"
                  className="flex-1 border border-army-green text-army-green py-3 rounded-md hover:bg-army-green/10 transition-colors text-center"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestResultsPage;
