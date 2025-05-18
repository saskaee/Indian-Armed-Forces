import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Award, ArrowRight, RotateCcw, Clock, BarChart3, BookOpen, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

interface SelectedAnswers {
  [key: string]: string;
}

const mockQuestions: Question[] = [
  {
    id: 'q1',
    question_text: 'What is the rank insignia of a Captain in the Indian Army?',
    options: ['Three Stars', 'Two Stars and a Stripe', 'Crossed Swords with Star', 'One Star'],
    correct_answer: 'Crossed Swords with Star',
  },
  {
    id: 'q2',
    question_text: 'Which is the highest military award in India?',
    options: ['Param Vir Chakra', 'Ashoka Chakra', 'Kirti Chakra', 'Vir Chakra'],
    correct_answer: 'Param Vir Chakra',
  },
  {
    id: 'q3',
    question_text: 'The Indian Army celebrates its raising day on which date?',
    options: ['15 August', '1 April', '26 January', '3 October'],
    correct_answer: '15 August',
  },
  {
    id: 'q4',
    question_text: 'Which is the primary training academy for Indian Army officers?',
    options: ['National Defence Academy', 'Indian Military Academy', 'Officers Training Academy', 'Defence Services Staff College'],
    correct_answer: 'Indian Military Academy',
  },
  {
    id: 'q5',
    question_text: 'The motto of the Indian Army is?',
    options: ['Service Before Self', 'Duty, Honour, Country', 'Karam Hi Dharma Hai', 'Shaurya and Veerta'],
    correct_answer: 'Service Before Self',
  },
  {
    id: 'q6',
    question_text: 'What is the rank of the Chief of Defence Staff (CDS) in India?',
    options: ['General', 'Air Chief Marshal', 'Admiral', 'Field Marshal'],
    correct_answer: 'General',
  },
  {
    id: 'q7',
    question_text: 'Which operation led to the liberation of Goa by the Indian Armed Forces?',
    options: ['Operation Blue Star', 'Operation Vijay', 'Operation Meghdoot', 'Operation Cactus'],
    correct_answer: 'Operation Vijay',
  },
  {
    id: 'q8',
    question_text: 'The headquarters of the Indian Navy is located in which city?',
    options: ['Kochi', 'Visakhapatnam', 'New Delhi', 'Mumbai'],
    correct_answer: 'New Delhi',
  },
  {
    id: 'q9',
    question_text: 'Which branch of the Indian Armed Forces operates the INS Vikramaditya?',
    options: ['Indian Army', 'Indian Navy', 'Indian Air Force', 'Coast Guard'],
    correct_answer: 'Indian Navy',
  },
  {
    id: 'q10',
    question_text: 'What is the name of the elite special forces unit of the Indian Army?',
    options: ['NSG', 'Garud Commando Force', 'Para SF', 'MARCOS'],
    correct_answer: 'Para SF',
  },
  {
    id: 'q11',
    question_text: 'Which Indian Air Force base is the largest in Asia?',
    options: ['Tezpur AFS', 'Hindon AFS', 'Ambala AFS', 'Jodhpur AFS'],
    correct_answer: 'Hindon AFS',
  },
  {
    id: 'q12',
    question_text: 'What is the highest active rank in the Indian Air Force?',
    options: ['Wing Commander', 'Air Marshal', 'Group Captain', 'Air Chief Marshal'],
    correct_answer: 'Air Chief Marshal',
  },
  {
    id: 'q13',
    question_text: 'Who was the first woman fighter pilot of the Indian Air Force?',
    options: ['Avani Chaturvedi', 'Gunjan Saxena', 'Bhawana Kanth', 'Mohana Singh'],
    correct_answer: 'Avani Chaturvedi',
  },
  {
    id: 'q14',
    question_text: 'Which missile system is developed by DRDO for the Indian Armed Forces?',
    options: ['Trishul', 'Nag', 'Agni', 'All of the above'],
    correct_answer: 'All of the above',
  },
  {
    id: 'q15',
    question_text: 'Which Indian naval ship was the first aircraft carrier?',
    options: ['INS Vikrant', 'INS Viraat', 'INS Shivalik', 'INS Arihant'],
    correct_answer: 'INS Vikrant',
  },
  {
    id: 'q16',
    question_text: 'What does the abbreviation AFMS stand for in Indian Armed Forces?',
    options: ['Armed Forces Military Staff', 'Army Forces Medical Services', 'Armed Forces Medical Services', 'Air Force Medical Support'],
    correct_answer: 'Armed Forces Medical Services',
  },
  {
    id: 'q17',
    question_text: 'Which award is given for distinguished service during peacetime?',
    options: ['Param Vir Chakra', 'Ashoka Chakra', 'Ati Vishisht Seva Medal', 'Shaurya Chakra'],
    correct_answer: 'Ati Vishisht Seva Medal',
  },
  {
    id: 'q18',
    question_text: 'Which mountain post was recaptured during the Kargil War?',
    options: ['Point 4875', 'Tiger Hill', 'Tololing', 'All of the above'],
    correct_answer: 'All of the above',
  },
  {
    id: 'q19',
    question_text: 'What is the full form of NDA?',
    options: ['National Defence Association', 'Naval Defence Academy', 'National Defence Academy', 'National Division of Army'],
    correct_answer: 'National Defence Academy',
  },
  {
    id: 'q20',
    question_text: 'The Indian Army’s Siachen base is located in which mountain range?',
    options: ['Zanskar Range', 'Pir Panjal Range', 'Karakoram Range', 'Himalayas'],
    correct_answer: 'Karakoram Range',
  },
  {
    id: 'q21',
    question_text: 'Which service uses the motto "Touch the Sky with Glory"?',
    options: ['Indian Army', 'Indian Navy', 'Indian Air Force', 'NSG'],
    correct_answer: 'Indian Air Force',
  },
  {
    id: 'q22',
    question_text: 'Which regiment of the Indian Army is known as "The Bravehearts"?',
    options: ['Rajput Regiment', 'Gorkha Regiment', 'Sikh Regiment', 'Parachute Regiment'],
    correct_answer: 'Gorkha Regiment',
  },
  {
    id: 'q23',
    question_text: 'INS Arihant belongs to which class of vessels?',
    options: ['Destroyers', 'Submarines', 'Frigates', 'Patrol Ships'],
    correct_answer: 'Submarines',
  },
  {
    id: 'q24',
    question_text: 'What is the rank insignia of a Lieutenant in the Indian Army?',
    options: ['One Star', 'Two Stars', 'Three Stars', 'Ashoka Emblem'],
    correct_answer: 'One Star',
  },
  {
    id: 'q25',
    question_text: 'Which Indian President was a former Supreme Commander of the Armed Forces?',
    options: ['Dr. A.P.J. Abdul Kalam', 'Dr. Rajendra Prasad', 'Pratibha Patil', 'R. Venkataraman'],
    correct_answer: 'Dr. A.P.J. Abdul Kalam',
  }
];

// Fisher-Yates shuffle algorithm to randomize questions
const shuffleArray = <T extends unknown>(array: T[]): T[] => {
  // Create a copy of the array to avoid mutating the original
  const shuffledArray = [...array];
  
  // Start from the last element and swap with a random element before it
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  
  return shuffledArray;
};

const ArmyMockTestDemo = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [fade, setFade] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [animateResults, setAnimateResults] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  // Store the test ID for potential future reference (e.g., linking to a specific test result)
  const [savedTestId, setSavedTestId] = useState<string | null>(null);

  // Shuffle questions and start timer when component loads
  useEffect(() => {
    // Randomize questions order
    setQuestions(shuffleArray(mockQuestions));
    // Start timer
    setStartTime(new Date());
  }, []);

  // Trigger fade-in animation on question change
  useEffect(() => {
    setFade(false);
    const timer = setTimeout(() => setFade(true), 100);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Animate results when showing
  useEffect(() => {
    if (showResults) {
      setTimeout(() => setAnimateResults(true), 300);
    } else {
      setAnimateResults(false);
    }
  }, [showResults]);

  // Use shuffled questions instead of mockQuestions directly
  const currentQuestion = questions[currentIndex] || mockQuestions[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const endTimeNow = new Date();
      setEndTime(endTimeNow);
      setShowResults(true);
      
      // Auto-save results if user is authenticated
      if (isAuthenticated && user) {
        saveTestResults(endTimeNow);
      }
    }
  };
  
  // Function to save test results to Supabase
  const saveTestResults = async (endTimeValue: Date = new Date()) => {
    if (!user || !startTime) return;
    
    setSaveStatus('saving');
    
    try {
      const testData = {
        user_id: user.id,
        score: calculateScore(),
        total_questions: questions.length,
        percentage: calculatePercentage(),
        time_taken_seconds: Math.floor((endTimeValue.getTime() - startTime.getTime()) / 1000),
        test_type: 'army_knowledge',
        completed_at: endTimeValue.toISOString(),
        answers: JSON.stringify(selectedAnswers),
        questions: JSON.stringify(questions.map(q => ({ 
          id: q.id, 
          question: q.question_text, 
          correct_answer: q.correct_answer,
          options: q.options
        })))
      };
      
      // Insert test result into test_results table
      const { data, error } = await supabase
        .from('test_results')
        .insert(testData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      setSaveStatus('success');
      setSavedTestId(data.id);
      
    } catch (error) {
      console.error('Error saving test results:', error);
      setSaveStatus('error');
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    setStartTime(new Date());
    setEndTime(null);
    setActiveTab('summary');
    // Shuffle questions again for a new test
    setQuestions(shuffleArray(mockQuestions));
  };

  const calculateScore = () => {
    let score = 0;
    for (const question of questions) {
      if (selectedAnswers[question.id] === question.correct_answer) {
        score += 1;
      }
    }
    return score;
  };

  const calculatePercentage = () => {
    return Math.round((calculateScore() / questions.length) * 100);
  };

  const getTimeTaken = () => {
    if (!startTime || !endTime) return '0';
    const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s`;
  };

  interface Feedback {
    message: string;
    class: string;
  }

  const getFeedback = (): Feedback => {
    const percentage = calculatePercentage();
    if (percentage >= 80) {
      return {
        message: "Excellent work! You've demonstrated outstanding knowledge of the Indian Army.",
        class: "text-green-600"
      };
    } else if (percentage >= 60) {
      return {
        message: "Good effort! You have a solid grasp of the key concepts.",
        class: "text-blue-600"
      };
    } else {
      return {
        message: "You've made a start, but there's room for improvement. Review the areas you missed.",
        class: "text-amber-600"
      };
    }
  };

  const progressPercent = ((currentIndex) / questions.length) * 100;

  // Renders question analysis in results
  const renderQuestionAnalysis = () => {
    return questions.map((question, index) => {
      const isCorrect = selectedAnswers[question.id] === question.correct_answer;
      return (
        <div 
          key={question.id} 
          className={`mb-6 p-4 border rounded-lg transition-all duration-500 transform ${
            animateResults ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}
          style={{ transitionDelay: `${index * 150}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {isCorrect ? 
                <CheckCircle className="text-green-500" size={24} /> : 
                <XCircle className="text-red-500" size={24} />
              }
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-2">Question {index + 1}: {question.question_text}</h3>
              <div className="mb-1">
                <span className="font-medium">Your answer:</span> 
                <span className={isCorrect ? "text-green-600 ml-2" : "text-red-500 ml-2"}>
                  {selectedAnswers[question.id] || "Not answered"}
                </span>
              </div>
              {!isCorrect && (
                <div>
                  <span className="font-medium">Correct answer:</span> 
                  <span className="text-green-600 ml-2">{question.correct_answer}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = calculatePercentage();
    const feedback = getFeedback();
    
    return (
      <div className="max-w-2xl mx-auto p-8 mt-8 bg-white rounded-xl shadow-lg text-gray-800 font-sans">
        <div className={`text-center mb-6 transition-all duration-700 transform ${animateResults ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <h2 className="text-3xl font-bold mb-2">Test Complete</h2>
          <p className="text-gray-600">Here's how you performed on the Indian Army knowledge test</p>
        </div>
        
        {/* Score Animation */}
        <div className={`flex justify-center mb-10 transition-all duration-1000 transform ${animateResults ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <div className="relative h-40 w-40">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle 
                className="text-gray-200 stroke-current" 
                strokeWidth="10" 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent"
              />
              <circle 
                className="text-green-600 stroke-current" 
                strokeWidth="10" 
                strokeLinecap="round" 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl font-bold">{percentage}%</span>
                <p className="text-sm text-gray-500">Score</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="border-b mb-6">
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'summary' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-all duration-300`}
            >
              <Award size={18} className="mr-2" /> Summary
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'analysis' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-all duration-300`}
            >
              <BarChart3 size={18} className="mr-2" /> Question Analysis
            </button>
            
            {isAuthenticated && (
              <div className="ml-auto flex items-center">
                {saveStatus === 'idle' && (
                  <button 
                    onClick={() => saveTestResults()}
                    className="py-2 px-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm flex items-center transition-all duration-300"
                  >
                    <Save size={18} className="mr-2" /> Save Results
                  </button>
                )}
                
                {saveStatus === 'saving' && (
                  <span className="py-2 px-4 text-blue-500 font-medium text-sm flex items-center">
                    <span className="animate-spin mr-2">⟳</span> Saving...
                  </span>
                )}
                
                {saveStatus === 'success' && (
                  <span className="py-2 px-4 text-green-500 font-medium text-sm flex items-center">
                    <CheckCircle size={18} className="mr-2" /> Saved to Your Profile
                    {savedTestId && <span className="ml-1 text-xs text-gray-500">(#{savedTestId.substring(0, 8)})</span>}
                  </span>
                )}
                
                {saveStatus === 'error' && (
                  <button 
                    onClick={() => saveTestResults()}
                    className="py-2 px-4 text-red-500 font-medium text-sm flex items-center"
                  >
                    <AlertCircle size={18} className="mr-2" /> Error Saving - Retry?
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div>
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 transition-all duration-700 ${animateResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-2xl font-bold">{score}/{mockQuestions.length}</p>
                  </div>
                  <Award size={28} className="text-green-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Time Taken</p>
                    <p className="text-2xl font-bold">{getTimeTaken()}</p>
                  </div>
                  <Clock size={28} className="text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Questions</p>
                    <p className="text-2xl font-bold">{mockQuestions.length}</p>
                  </div>
                  <BookOpen size={28} className="text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className={`mb-6 p-4 border rounded-lg bg-gray-50 transition-all duration-1000 ${animateResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
              <h3 className="font-bold mb-2">Performance Feedback</h3>
              <p className={`${feedback.class}`}>{feedback.message}</p>
            </div>
          </div>
        )}
        
        {activeTab === 'analysis' && (
          <div className="mb-6">
            {renderQuestionAnalysis()}
          </div>
        )}
        
        <div className={`flex justify-center transition-all duration-1000 ${animateResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '600ms' }}>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105 flex items-center"
            aria-label="Retake Test"
          >
            <RotateCcw size={18} className="mr-2" /> Retake Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 mt-8 bg-white rounded-xl shadow-lg font-sans text-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-center animate-fade-in">
        Question {currentIndex + 1} of {mockQuestions.length}
      </h2>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden shadow-inner">
        <div
          className="bg-green-600 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={mockQuestions.length}
          role="progressbar"
        />
      </div>

      <div
        className={`mb-8 text-gray-800 text-lg min-h-[120px] transition-opacity duration-300 ${
          fade ? 'opacity-100' : 'opacity-0'
        } animate-fade-in`}
      >
        {currentQuestion.question_text}
      </div>

      <div className="space-y-4 mb-8">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswers[currentQuestion.id] === option;
          return (
            <label
              key={option}
              className={`block cursor-pointer rounded-lg border-2 p-4 select-none
                transition-all duration-200
                ${
                  isSelected
                    ? 'border-green-600 bg-green-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-green-600 hover:shadow-md hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center">
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center mr-3 transition-all
                  ${isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                  {isSelected && <div className="h-2 w-2 bg-white rounded-full"></div>}
                </div>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={isSelected}
                  onChange={() => handleSelectAnswer(option)}
                  className="sr-only"
                  aria-checked={isSelected}
                />
                <span className={`${isSelected ? 'font-medium' : ''}`}>{option}</span>
              </div>
            </label>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={!selectedAnswers[currentQuestion.id]}
        className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center
          transition-all duration-300
          ${
            selectedAnswers[currentQuestion.id]
              ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 cursor-pointer shadow-lg'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        aria-disabled={!selectedAnswers[currentQuestion.id]}
      >
        {currentIndex === mockQuestions.length - 1 ? 'Submit' : 'Next'}
        <ArrowRight size={18} className="ml-2" />
      </button>
    </div>
  );
};

export default ArmyMockTestDemo;